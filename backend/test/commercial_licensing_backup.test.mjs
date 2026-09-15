import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import express from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { validarLicencaRSA, obterStatusLicenca, ativarLicenca } from '../src/services/licenseService.js';
import { obterMachineId } from '../src/utils/machineId.js';
import { criarBackup, listarBackups } from '../src/services/backupService.js';
import licencaRoutes from '../src/routes/licenca.js';
import onboardingRoutes from '../src/routes/onboarding.js';
import sequelize from '../src/config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const privateKeyPath = path.resolve(__dirname, '../../admin-keygen/keys/license_private.pem');

function gerarChaveRSAComPrivada({ cliente, maquina, dias = 30, tipo = 'mensal' }) {
  const privateKey = fs.readFileSync(privateKeyPath, 'utf8');
  const agora = new Date();
  const dataVal = new Date(agora);
  dataVal.setDate(agora.getDate() + dias);
  const dataValStr = dataVal.toISOString().split('T')[0];

  const payload = {
    c: cliente,
    m: maquina,
    t: tipo,
    v: dataValStr
  };

  const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signer = crypto.createSign('SHA256');
  signer.update(payloadBase64);
  signer.end();
  const sigBase64 = signer.sign(privateKey, 'base64url');

  return `LIC-PET-${payloadBase64}.${sigBase64}`;
}

describe('Controle de Licença Criptográfica Assimétrica RSA-2048 & Machine ID', () => {
  test('Deve gerar Machine ID estável para o hardware local', async () => {
    const machineId = await obterMachineId();
    assert.ok(machineId.startsWith('REQ-PET-'));
    assert.ok(machineId.length >= 16);
  });

  test('Deve verificar assinatura RSA com sucesso para o Machine ID correto', async () => {
    const machineId = await obterMachineId();
    const chave = gerarChaveRSAComPrivada({
      cliente: 'Pet Shop Bicho Mimado',
      maquina: machineId,
      dias: 30,
      tipo: 'mensal'
    });

    assert.ok(chave.startsWith('LIC-PET-'));
    const resultado = validarLicencaRSA(chave, machineId);

    assert.equal(resultado.valida, true);
    assert.equal(resultado.payload.c, 'Pet Shop Bicho Mimado');
    assert.equal(resultado.payload.m, machineId);
    assert.equal(resultado.payload.t, 'mensal');
    assert.equal(resultado.expirada, false);
  });

  test('Deve REJEITAR chave de licença caso o Machine ID pertença a outro computador', async () => {
    const machineIdAtual = await obterMachineId();
    const outroComputador = 'REQ-PET-9999-8888-7777';

    const chaveOutroComputador = gerarChaveRSAComPrivada({
      cliente: 'Loja Infratora',
      maquina: outroComputador,
      dias: 30
    });

    const resultado = validarLicencaRSA(chaveOutroComputador, machineIdAtual);
    assert.equal(resultado.valida, false);
    assert.match(resultado.motivo, /outro computador/);
  });

  test('Deve REJEITAR chave de licença adulterada ou com assinatura forjada', async () => {
    const machineId = await obterMachineId();
    const chave = gerarChaveRSAComPrivada({ cliente: 'Loja Autêntica', maquina: machineId, dias: 30 });
    const clean = chave.replace('LIC-PET-', '');
    const [payloadBase64, sig] = clean.split('.');

    // Tenta adulterar o payload mantendo a assinatura original
    const payloadCorrompido = Buffer.from(JSON.stringify({ c: 'Loja Hacker', m: machineId, t: 'vitalicio', v: '2099-01-01' })).toString('base64url');
    const chaveAdulterada = `LIC-PET-${payloadCorrompido}.${sig}`;

    const resultado = validarLicencaRSA(chaveAdulterada, machineId);
    assert.equal(resultado.valida, false);
    assert.match(resultado.motivo, /inválida|não é autêntica/i);
  });

  test('Deve identificar licença vencida como expirada', async () => {
    const machineId = await obterMachineId();
    const chaveExpirada = gerarChaveRSAComPrivada({ cliente: 'Cliente Vencido', maquina: machineId, dias: -5 });
    const resultado = validarLicencaRSA(chaveExpirada, machineId);

    assert.equal(resultado.valida, false);
    assert.equal(resultado.expirada, true);
    assert.match(resultado.motivo, /expirou em/);
  });
});

describe('Rotina de Backups Automatizados & Snapshots Locais/Nuvem', () => {
  before(async () => {
    await sequelize.sync();
  });

  test('Deve gerar snapshot atômico compactado em arquivo .zip com sucesso', async () => {
    const resultado = await criarBackup();

    assert.equal(resultado.sucesso, true);
    assert.ok(resultado.arquivo.startsWith('backup_petshop_'));
    assert.ok(resultado.arquivo.endsWith('.zip'));
    assert.ok(resultado.tamanho_bytes > 0);
    assert.ok(fs.existsSync(resultado.caminho), 'Arquivo zip deve existir no disco');
  });

  test('Deve listar histórico de backups ordenados por data decrescente', async () => {
    const lista = await listarBackups();

    assert.ok(Array.isArray(lista));
    assert.ok(lista.length >= 1, 'Deve conter ao menos 1 backup criado no teste anterior');
    assert.ok(lista[0].arquivo.startsWith('backup_petshop_'));
    assert.ok(lista[0].tamanho_bytes > 0);
  });
});

describe('Endpoints de API: Licença & Onboarding', () => {
  const app = express();
  app.use(express.json());
  app.use('/api/licenca', licencaRoutes);
  app.use('/api/onboarding', onboardingRoutes);

  test('GET /api/licenca deve retornar status da licença e o código da máquina', async () => {
    const res = await request(app).get('/api/licenca');

    assert.equal(res.status, 200);
    assert.ok(typeof res.body.ativa === 'boolean');
    assert.ok(typeof res.body.dias_restantes === 'number');
    assert.ok(res.body.codigo_maquina.startsWith('REQ-PET-'));
  });

  test('POST /api/licenca/ativar com chave inválida deve retornar 400', async () => {
    const res = await request(app)
      .post('/api/licenca/ativar')
      .send({ chave: 'CHAVE-FALSA-123' });

    assert.equal(res.status, 400);
    assert.match(res.body.error, /inválid|corrompido/i);
  });

  test('POST /api/licenca/ativar com chave RSA válida deve ativar licença no banco', async () => {
    const machineId = await obterMachineId();
    const chaveValida = gerarChaveRSAComPrivada({ cliente: 'Pet Shop Teste API', maquina: machineId, dias: 60, tipo: 'mensal' });
    const res = await request(app)
      .post('/api/licenca/ativar')
      .send({ chave: chaveValida });

    assert.equal(res.status, 200);
    assert.equal(res.body.licenca.cliente, 'Pet Shop Teste API');
    assert.equal(res.body.licenca.ativa, true);
    assert.ok(res.body.licenca.dias_restantes >= 59);
  });

  test('GET /api/onboarding/status deve retornar flag de inicialização do sistema', async () => {
    const res = await request(app).get('/api/onboarding/status');

    assert.equal(res.status, 200);
    assert.ok(typeof res.body.inicializado === 'boolean');
  });
});
