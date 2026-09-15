import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import express from 'express';
import cors from 'cors';
import sequelize from '../src/config/database.js';
import { Usuario, Cliente, Pet, Servico, Agendamento } from '../src/models/index.js';
import agendamentoRoutes from '../src/routes/agendamentos.js';
import caixaRoutes from '../src/routes/caixa.js';
import publicoRoutes from '../src/routes/publico.js';
import authRoutes from '../src/routes/auth.js';
import bcrypt from 'bcrypt';

function buildApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use('/api/auth', authRoutes);
  app.use('/api/agendamentos', agendamentoRoutes);
  app.use('/api/caixa', caixaRoutes);
  app.use('/api/publico', publicoRoutes);
  return app;
}

let app;
let adminToken;
let tosadorUser;
let testPet;
let servicoBanhoTosa; // 90 min
let servicoBanhoSimples; // 30 min
let agendamentoFuturoId;

before(async () => {
  await sequelize.authenticate();
  await sequelize.sync();

  const senhaHash = await bcrypt.hash('admin123', 4);
  const [admin] = await Usuario.findOrCreate({
    where: { usuario: 'admin_test_sched' },
    defaults: { nome: 'Admin Sched Test', senha_hash: senhaHash, perfil: 'admin', ativo: true }
  });

  const [tosador] = await Usuario.findOrCreate({
    where: { usuario: 'tosador_test_sched' },
    defaults: { nome: 'Tosador Sched Test', senha_hash: senhaHash, perfil: 'tosador', ativo: true }
  });
  tosadorUser = tosador;

  const [cliente] = await Cliente.findOrCreate({
    where: { telefone: '(11) 99111-2222' },
    defaults: { nome: 'Tutor Sched Test', ativo: true }
  });

  const [pet] = await Pet.findOrCreate({
    where: { cliente_id: cliente.id, nome: 'Pet Sched Test' },
    defaults: { especie: 'cachorro', status_presenca: 'ausente', ativo: true }
  });
  testPet = pet;

  const [sBanhoTosa] = await Servico.findOrCreate({
    where: { nome: 'Banho e Tosa Completa 90min' },
    defaults: { preco_base: 120.00, duracao_minutos: 90, categoria: 'tosa', ativo: true }
  });
  servicoBanhoTosa = sBanhoTosa;

  const [sBanhoSimples] = await Servico.findOrCreate({
    where: { nome: 'Banho Simples 30min' },
    defaults: { preco_base: 40.00, duracao_minutos: 30, categoria: 'banho', ativo: true }
  });
  servicoBanhoSimples = sBanhoSimples;

  await Agendamento.destroy({ where: { data_agendada: '2028-10-10' } });

  app = buildApp();

  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({ usuario: 'admin_test_sched', senha: 'admin123' });
  adminToken = loginRes.body.token;
});

after(async () => {
  await sequelize.close();
});

describe('Regras de Negócio: Agendamentos e Sobreposição de Horários', () => {
  const dataTeste = '2028-10-10';

  test('Deve criar o primeiro agendamento com sucesso (09:00 com 90 min de duração)', async () => {
    const res = await request(app)
      .post('/api/agendamentos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        pet_id: testPet.id,
        servico_id: servicoBanhoTosa.id,
        usuario_id: tosadorUser.id,
        data_agendada: dataTeste,
        hora_agendada: '09:00'
      });

    assert.equal(res.status, 201, `Erro ao criar agendamento inicial: ${JSON.stringify(res.body)}`);
    assert.equal(res.body.hora_agendada, '09:00');
    agendamentoFuturoId = res.body.id;
  });

  test('Deve REJEITAR agendamento com sobreposição no meio do atendimento (09:30 para o mesmo profissional)', async () => {
    const res = await request(app)
      .post('/api/agendamentos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        pet_id: testPet.id,
        servico_id: servicoBanhoSimples.id,
        usuario_id: tosadorUser.id,
        data_agendada: dataTeste,
        hora_agendada: '09:30' // Conflita com 09:00 - 10:30!
      });

    assert.equal(res.status, 400);
    assert.ok(res.body.error.includes('Conflito de agenda'), 'Deveria retornar erro de conflito de agenda');
  });

  test('Deve REJEITAR agendamento com sobreposição no final do intervalo (10:00 para o mesmo profissional)', async () => {
    const res = await request(app)
      .post('/api/agendamentos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        pet_id: testPet.id,
        servico_id: servicoBanhoSimples.id,
        usuario_id: tosadorUser.id,
        data_agendada: dataTeste,
        hora_agendada: '10:00' // Conflita com 09:00 - 10:30!
      });

    assert.equal(res.status, 400);
    assert.ok(res.body.error.includes('Conflito de agenda'));
  });

  test('Deve PERMITIR agendamento imediatamente após o término do anterior (10:30)', async () => {
    const res = await request(app)
      .post('/api/agendamentos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        pet_id: testPet.id,
        servico_id: servicoBanhoSimples.id,
        usuario_id: tosadorUser.id,
        data_agendada: dataTeste,
        hora_agendada: '10:30' // Exatamente após o término do serviço anterior!
      });

    assert.equal(res.status, 201, `Deveria permitir agendamento após o término: ${JSON.stringify(res.body)}`);
  });

  test('BLOQUEIO DE INÍCIO ANTECIPADO: Não deve permitir iniciar atendimento marcado para data futura', async () => {
    const res = await request(app)
      .put(`/api/agendamentos/${agendamentoFuturoId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'em_andamento' });

    assert.equal(res.status, 400);
    assert.ok(res.body.error.includes('não podendo ser iniciado ou concluído antes desta data'));
  });

  test('BLOQUEIO DE FATURAMENTO ANTECIPADO: Não deve permitir faturar/checkout no caixa de agendamento futuro', async () => {
    const res = await request(app)
      .post('/api/caixa/servico-checkout')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        agendamento_id: agendamentoFuturoId,
        forma_pagamento: 'PIX'
      });

    assert.equal(res.status, 400);
    assert.ok(res.body.error.includes('Não é permitido faturar e dar entrada no caixa antes da data'));
  });

  test('Portal Público: Deve rejeitar agendamento online com número de telefone inválido', async () => {
    const res = await request(app)
      .post('/api/publico/agendar')
      .send({
        tutor_nome: 'Tutor Online Teste',
        tutor_telefone: '1234', // Telefone inválido (muito curto)
        pet_nome: 'Pet Online',
        servico_id: servicoBanhoSimples.id,
        data_agendada: '2028-11-11',
        hora_agendada: '14:00'
      });

    assert.equal(res.status, 400);
    assert.ok(res.body.error.includes('Telefone') || res.body.error.includes('WhatsApp'));
  });
});
