import crypto from 'crypto';
import { Configuracao } from '../models/index.js';

const MASTER_SALT = process.env.LICENSE_SECRET || 'PETSHOP_PRO_SECURE_ENTERPRISE_KEY_2026';

/**
 * Normaliza uma chave de licença no formato PETPRO-XXXX-XXXX-XXXX-XXXX
 */
export function formatarChave(rawHex) {
  const clean = rawHex.toUpperCase().replace(/[^A-Z0-9]/g, '');
  const chunks = [];
  for (let i = 0; i < clean.length && chunks.length < 4; i += 4) {
    chunks.push(clean.substring(i, i + 4));
  }
  return `PETPRO-${chunks.join('-')}`;
}

/**
 * Cria uma assinatura criptográfica HMAC-SHA256 para o payload
 */
function assinarPayload(dados) {
  const hmac = crypto.createHmac('sha256', MASTER_SALT);
  hmac.update(JSON.stringify(dados));
  return hmac.digest('hex').substring(0, 16).toUpperCase();
}

/**
 * Gera uma chave de licença comercial válida
 * @param {Object} params
 * @param {string} params.cliente Nome do Pet Shop / Cliente
 * @param {string} params.documento CNPJ ou CPF
 * @param {number} params.dias Validade em dias a partir de hoje
 * @param {string} params.tipo 'mensal' | 'anual' | 'vitalicio' | 'trial'
 * @returns {string} Token de licença completo
 */
export function gerarLicenca({ cliente, documento = '', dias = 30, tipo = 'mensal' }) {
  const agora = new Date();
  const dataValidade = new Date(agora);
  if (tipo === 'vitalicio') {
    dataValidade.setFullYear(agora.getFullYear() + 50);
  } else {
    dataValidade.setDate(agora.getDate() + parseInt(dias, 10));
  }

  const payload = {
    c: cliente.trim(),
    d: documento.replace(/\D/g, ''),
    t: tipo,
    v: dataValidade.toISOString().split('T')[0]
  };

  const sig = assinarPayload(payload);
  const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  
  return `${payloadBase64}.${sig}`;
}

/**
 * Valida a chave de licença informada
 * @param {string} licencaStr 
 * @returns {{ valida: boolean, payload?: Object, motivo?: string }}
 */
export function validarLicenca(licencaStr) {
  if (!licencaStr || typeof licencaStr !== 'string' || !licencaStr.includes('.')) {
    return { valida: false, motivo: 'Formato de chave de licença inválido.' };
  }

  try {
    const [payloadBase64, sig] = licencaStr.trim().split('.');
    if (!payloadBase64 || !sig) {
      return { valida: false, motivo: 'Formato de licença corrompido.' };
    }

    const payloadJson = Buffer.from(payloadBase64, 'base64url').toString('utf8');
    const payload = JSON.parse(payloadJson);

    // Valida integridade criptográfica
    const sigEsperada = assinarPayload(payload);
    if (sig !== sigEsperada) {
      return { valida: false, motivo: 'Assinatura da chave inválida ou adulterada.' };
    }

    // Valida data de expiração
    const hojeStr = new Date().toISOString().split('T')[0];
    const expirou = payload.v < hojeStr;

    return {
      valida: !expirou,
      expirada: expirou,
      payload,
      motivo: expirou ? `Licença expirou em ${payload.v.split('-').reverse().join('/')}.` : null
    };
  } catch (err) {
    return { valida: false, motivo: 'Falha ao decodificar chave de licença.' };
  }
}

/**
 * Obtém o status da licença atual configurada no sistema
 */
export async function obterStatusLicenca() {
  const confLicenca = await Configuracao.findOne({ where: { chave: 'licenca_chave' } });
  const confTrialInicio = await Configuracao.findOne({ where: { chave: 'trial_inicio' } });
  const hojeStr = new Date().toISOString().split('T')[0];

  // Se houver licença comercial cadastrada
  if (confLicenca && confLicenca.valor) {
    const validacao = validarLicenca(confLicenca.valor);
    if (validacao.valida || validacao.expirada) {
      const p = validacao.payload;
      const dataVal = new Date(p.v + 'T23:59:59');
      const diasRestantes = Math.ceil((dataVal.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

      return {
        ativa: !validacao.expirada,
        tipo: p.t,
        cliente: p.c,
        documento: p.d,
        validade: p.v,
        dias_restantes: Math.max(0, diasRestantes),
        aviso_expiracao: diasRestantes <= 7 && diasRestantes >= 0,
        expirada: validacao.expirada,
        motivo: validacao.motivo,
        chave: confLicenca.valor
      };
    }
  }

  // Se não houver licença comercial, verifica se está no período de Trial (15 dias)
  let dataTrial = confTrialInicio?.valor;
  if (!dataTrial) {
    dataTrial = hojeStr;
    await Configuracao.findOrCreate({
      where: { chave: 'trial_inicio' },
      defaults: { valor: hojeStr, descricao: 'Data de início do período de avaliação gratuita' }
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
    cliente: 'Período de Avaliação Gratuita (Trial)',
    documento: '',
    validade: dataFimTrialStr,
    dias_restantes: Math.max(0, diasRestantesTrial),
    aviso_expiracao: diasRestantesTrial <= 5 && diasRestantesTrial >= 0,
    expirada: trialExpirado,
    motivo: trialExpirado ? 'O seu período de avaliação de 15 dias expirou.' : null,
    chave: null
  };
}

/**
 * Registra e ativa uma nova chave de licença no banco
 */
export async function ativarLicenca(chave) {
  const validacao = validarLicenca(chave);
  if (!validacao.valida && !validacao.expirada) {
    throw new Error(validacao.motivo || 'Chave de licença inválida.');
  }

  if (validacao.expirada) {
    throw new Error(`Esta licença já está expirada desde ${validacao.payload.v}.`);
  }

  const [conf, created] = await Configuracao.findOrCreate({
    where: { chave: 'licenca_chave' },
    defaults: { valor: chave.trim(), descricao: 'Chave de ativação do PetShop Pro' }
  });

  if (!created) {
    conf.valor = chave.trim();
    await conf.save();
  }

  return obterStatusLicenca();
}
