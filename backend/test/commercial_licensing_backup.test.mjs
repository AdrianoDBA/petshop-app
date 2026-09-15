import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import express from 'express';
import fs from 'fs';
import { gerarLicenca, validarLicenca, obterStatusLicenca, ativarLicenca } from '../src/services/licenseService.js';
import { criarBackup, listarBackups, obterDiretorioBackup } from '../src/services/backupService.js';
import licencaRoutes from '../src/routes/licenca.js';
import onboardingRoutes from '../src/routes/onboarding.js';
import sequelize from '../src/config/database.js';

describe('Controle de Licença Criptográfica & Vencimento (Local SaaS)', () => {
  test('Deve gerar chave de licença válida e verificar assinatura HMAC com sucesso', () => {
    const chave = gerarLicenca({
      cliente: 'Pet Shop Bicho Mimado',
      documento: '12.345.678/0001-90',
      dias: 30,
      tipo: 'mensal'
    });

    assert.ok(chave.includes('.'), 'Chave deve conter separador de payload e assinatura');
    const resultado = validarLicenca(chave);

    assert.equal(resultado.valida, true);
    assert.equal(resultado.payload.c, 'Pet Shop Bicho Mimado');
    assert.equal(resultado.payload.t, 'mensal');
    assert.equal(resultado.expirada, false);
  });

  test('Deve REJEITAR chave de licença adulterada ou com assinatura forjada', () => {
    const chave = gerarLicenca({ cliente: 'Loja Autêntica', dias: 30 });
    const [payloadBase64, sig] = chave.split('.');

    // Tenta adulterar o payload (alterar nome do cliente) mantendo a assinatura original
    const payloadCorrompido = Buffer.from(JSON.stringify({ c: 'Loja Hacker', t: 'vitalicio', v: '2099-01-01' })).toString('base64url');
    const chaveAdulterada = `${payloadCorrompido}.${sig}`;

    const resultado = validarLicenca(chaveAdulterada);
    assert.equal(resultado.valida, false);
    assert.match(resultado.motivo, /Assinatura/);
  });

  test('Deve identificar licença vencida como expirada', () => {
    // Licença gerada com -5 dias (no passado)
    const chaveExpirada = gerarLicenca({ cliente: 'Cliente Vencido', dias: -5 });
    const resultado = validarLicenca(chaveExpirada);

    assert.equal(resultado.valida, false);
    assert.equal(resultado.expirada, true);
    assert.match(resultado.motivo, /expirou em/);
  });

  test('Deve gerar plano vitalício com validade superior a 40 anos', () => {
    const chaveVitalicia = gerarLicenca({ cliente: 'Sócio Fundador', tipo: 'vitalicio' });
    const resultado = validarLicenca(chaveVitalicia);

    assert.equal(resultado.valida, true);
    assert.equal(resultado.payload.t, 'vitalicio');
    const anoVencimento = parseInt(resultado.payload.v.split('-')[0], 10);
    const anoAtual = new Date().getFullYear();
    assert.ok(anoVencimento >= anoAtual + 49);
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

  test('GET /api/licenca deve retornar status da licença atual ou trial', async () => {
    const res = await request(app).get('/api/licenca');

    assert.equal(res.status, 200);
    assert.ok(typeof res.body.ativa === 'boolean');
    assert.ok(typeof res.body.dias_restantes === 'number');
    assert.ok(['mensal', 'anual', 'vitalicio', 'trial'].includes(res.body.tipo));
  });

  test('POST /api/licenca/ativar com chave inválida deve retornar 400', async () => {
    const res = await request(app)
      .post('/api/licenca/ativar')
      .send({ chave: 'CHAVE-FALSA-123' });

    assert.equal(res.status, 400);
    assert.match(res.body.error, /inválid|corrompido/i);
  });

  test('POST /api/licenca/ativar com chave válida deve ativar licença no banco', async () => {
    const chaveValida = gerarLicenca({ cliente: 'Pet Shop Teste API', dias: 60, tipo: 'mensal' });
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
