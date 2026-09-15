import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { Configuracao } from '../models/index.js';
import { obterMachineId } from '../utils/machineId.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicKeyPath = path.resolve(__dirname, '../config/license_public.pem');

// Lê a chave pública embutida no software do cliente
let PUBLIC_KEY = null;
if (fs.existsSync(publicKeyPath)) {
  PUBLIC_KEY = fs.readFileSync(publicKeyPath, 'utf8');
}

/**
 * Valida criptograficamente uma chave de licença usando a Chave Pública RSA
 * @param {string} licencaStr Chave no formato LIC-PET-[payload].[assinatura]
 * @param {string} machineIdEsperado ID do hardware local
 */
export function validarLicencaRSA(licencaStr, machineIdEsperado) {
  if (!licencaStr || typeof licencaStr !== 'string') {
    return { valida: false, motivo: 'Chave de licença não fornecida.' };
  }

  const clean = licencaStr.trim();
  if (!clean.startsWith('LIC-PET-') || !clean.includes('.')) {
    return { valida: false, motivo: 'Formato de chave de licença inválido.' };
  }

  const token = clean.replace('LIC-PET-', '');
  const [payloadBase64, sigBase64] = token.split('.');

  if (!payloadBase64 || !sigBase64) {
    return { valida: false, motivo: 'Formato da chave está corrompido.' };
  }

  if (!PUBLIC_KEY) {
    return { valida: false, motivo: 'Chave pública de validação não encontrada no servidor.' };
  }

  try {
    // 1. Valida a Assinatura Digital RSA-SHA256 usando a Chave Pública
    const verifier = crypto.createVerify('SHA256');
    verifier.update(payloadBase64);
    verifier.end();

    const assinaturaValida = verifier.verify(PUBLIC_KEY, sigBase64, 'base64url');
    if (!assinaturaValida) {
      return { valida: false, motivo: 'Assinatura digital inválida. Esta chave foi alterada ou não é autêntica.' };
    }

    // 2. Decodifica o payload JSON
    const payloadJson = Buffer.from(payloadBase64, 'base64url').toString('utf8');
    const payload = JSON.parse(payloadJson);

    // 3. Valida se a licença pertence a ESTE computador (Machine ID)
    if (machineIdEsperado && payload.m) {
      const idAtualNorm = machineIdEsperado.trim().toUpperCase();
      const idLicencaNorm = payload.m.trim().toUpperCase();
      if (idAtualNorm !== idLicencaNorm) {
        return {
          valida: false,
          motivo: `Esta licença foi emitida para outro computador (${payload.m}). Seu computador é ${idAtualNorm}.`
        };
      }
    }

    // 4. Valida data de vencimento
    const hojeStr = new Date().toISOString().split('T')[0];
    const expirou = payload.v < hojeStr;

    return {
      valida: !expirou,
      expirada: expirou,
      payload,
      motivo: expirou ? `Licença expirou em ${payload.v.split('-').reverse().join('/')}.` : null
    };
  } catch (err) {
    return { valida: false, motivo: 'Falha ao processar e decodificar a chave de licença.' };
  }
}

/**
 * Consulta o status da licença do cliente nesta máquina
 */
export async function obterStatusLicenca() {
  const machineId = await obterMachineId();
  const confNomeLoja = await Configuracao.findOne({ where: { chave: 'loja_nome' } });
  const nomeLoja = confNomeLoja?.valor || 'Meu Pet Shop';

  const confLicenca = await Configuracao.findOne({ where: { chave: 'licenca_chave' } });
  const confTrialInicio = await Configuracao.findOne({ where: { chave: 'trial_inicio' } });
  const hojeStr = new Date().toISOString().split('T')[0];

  // 1. Se o cliente possui uma chave cadastrada
  if (confLicenca && confLicenca.valor) {
    const validacao = validarLicencaRSA(confLicenca.valor, machineId);
    if (validacao.valida || validacao.expirada) {
      const p = validacao.payload;
      const dataVal = new Date(p.v + 'T23:59:59');
      const diasRestantes = Math.ceil((dataVal.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

      return {
        ativa: !validacao.expirada,
        tipo: p.t,
        cliente: p.c,
        codigo_maquina: machineId,
        nome_loja: nomeLoja,
        validade: p.v,
        dias_restantes: Math.max(0, diasRestantes),
        aviso_expiracao: diasRestantes <= 7 && diasRestantes >= 0,
        expirada: validacao.expirada,
        motivo: validacao.motivo,
        chave: confLicenca.valor
      };
    }
  }

  // 2. Se não possui chave comercial, ativa modo Trial (15 dias na máquina)
  let dataTrial = confTrialInicio?.valor;
  if (!dataTrial) {
    dataTrial = hojeStr;
    await Configuracao.findOrCreate({
      where: { chave: 'trial_inicio' },
      defaults: { valor: dataTrial, descricao: 'Data de início da avaliação de 15 dias' }
    });
  }

  const dataFimTrial = new Date(dataTrial + 'T00:00:00');
  dataFimTrial.setDate(dataFimTrial.getDate() + 15);
  const dataFimTrialStr = dataFimTrial.toISOString().split('T')[0];
  const diasRestantesTrial = Math.ceil((dataFimTrial.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  const trialExpirado = diasRestantesTrial < 0;

  return {
    ativa: !trialExpirado,
    tipo: 'trial',
    cliente: nomeLoja,
    codigo_maquina: machineId,
    nome_loja: nomeLoja,
    validade: dataFimTrialStr,
    dias_restantes: Math.max(0, diasRestantesTrial),
    aviso_expiracao: diasRestantesTrial <= 5 && diasRestantesTrial >= 0,
    expirada: trialExpirado,
    motivo: trialExpirado ? 'O período de avaliação gratuita de 15 dias expirou.' : null,
    chave: null
  };
}

/**
 * Ativa uma nova chave fornecida pelo administrador
 */
export async function ativarLicenca(chave) {
  const machineId = await obterMachineId();
  const validacao = validarLicencaRSA(chave, machineId);

  if (!validacao.valida && !validacao.expirada) {
    throw new Error(validacao.motivo || 'Chave de licença inválida.');
  }

  if (validacao.expirada) {
    throw new Error(`Esta licença já está vencida desde ${validacao.payload.v}.`);
  }

  const [conf, created] = await Configuracao.findOrCreate({
    where: { chave: 'licenca_chave' },
    defaults: { valor: chave.trim(), descricao: 'Chave de licença oficial ativada' }
  });

  if (!created) {
    conf.valor = chave.trim();
    await conf.save();
  }

  return obterStatusLicenca();
}
