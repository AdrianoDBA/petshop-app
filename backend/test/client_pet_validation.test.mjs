import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import express from 'express';
import cors from 'cors';
import sequelize from '../src/config/database.js';
import { Usuario, Cliente, Pet } from '../src/models/index.js';
import clienteRoutes from '../src/routes/clientes.js';
import petRoutes from '../src/routes/pets.js';
import authRoutes from '../src/routes/auth.js';
import { validarCPF, validarTelefone, gerarCPFValido } from '../src/utils/validators.js';
import bcrypt from 'bcrypt';

function buildApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use('/api/auth', authRoutes);
  app.use('/api/clientes', clienteRoutes);
  app.use('/api/pets', petRoutes);
  return app;
}

let app;
let adminToken;
let clienteIdCriado;

before(async () => {
  await sequelize.authenticate();
  await sequelize.sync();

  const senhaHash = await bcrypt.hash('admin123', 4);
  await Usuario.findOrCreate({
    where: { usuario: 'admin_test_val' },
    defaults: { nome: 'Admin Val Test', senha_hash: senhaHash, perfil: 'admin', ativo: true }
  });

  app = buildApp();

  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({ usuario: 'admin_test_val', senha: 'admin123' });
  adminToken = loginRes.body.token;
});

after(async () => {
  await sequelize.close();
});

describe('Validação de Algoritmo de CPF e Telefone (Regras Nacionais)', () => {
  test('Função validarCPF deve aceitar CPFs com dígitos verificadores matematicamente válidos', () => {
    // CPFs com algoritmo válido
    assert.equal(validarCPF('52998224725'), true);
    assert.equal(validarCPF('529.982.247-25'), true);
    assert.equal(validarCPF('11144477735'), true);
  });

  test('Função validarCPF deve rejeitar CPFs com dígitos verificadores inválidos ou sequências repetidas', () => {
    assert.equal(validarCPF('11111111111'), false); // Sequência repetida
    assert.equal(validarCPF('00000000000'), false); // Sequência repetida
    assert.equal(validarCPF('12345678900'), false); // Dígitos verificadores incorretos
    assert.equal(validarCPF('123'), false); // Curto
    assert.equal(validarCPF(null), false);
  });

  test('Função validarTelefone deve validar números com DDD de 10 e 11 dígitos', () => {
    assert.equal(validarTelefone('(11) 98888-8888'), true);
    assert.equal(validarTelefone('11988888888'), true);
    assert.equal(validarTelefone('(11) 3333-4444'), true);
    assert.equal(validarTelefone('123'), false);
    assert.equal(validarTelefone(''), false);
  });
});

describe('Integração: Cadastro de Clientes e Pets', () => {
  test('POST /api/clientes deve rejeitar cadastro com CPF inválido', async () => {
    const res = await request(app)
      .post('/api/clientes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nome: 'Cliente CPF Inválido',
        telefone: '(11) 97777-6666',
        cpf: '111.111.111-11' // Inválido!
      });

    assert.equal(res.status, 400);
    assert.ok(res.body.error.includes('CPF'));
  });

  test('POST /api/clientes deve aceitar cadastro com CPF matematicamente válido', async () => {
    const cpfValido = gerarCPFValido();
    const res = await request(app)
      .post('/api/clientes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nome: 'Cliente CPF Válido',
        telefone: '(11) 97777-6666',
        cpf: cpfValido
      });

    assert.equal(res.status, 201, `Erro ao criar cliente com CPF válido: ${JSON.stringify(res.body)}`);
    assert.ok(res.body.id);
    clienteIdCriado = res.body.id;
  });

  test('POST /api/pets deve rejeitar pet com peso negativo ou zero', async () => {
    const res = await request(app)
      .post('/api/pets')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        cliente_id: clienteIdCriado,
        nome: 'Pet Peso Negativo',
        especie: 'cachorro',
        peso_kg: -5.0 // Inválido!
      });

    assert.equal(res.status, 400);
    assert.ok(res.body.error.includes('Peso'));
  });

  test('POST /api/pets deve rejeitar pet com data de nascimento no futuro', async () => {
    const res = await request(app)
      .post('/api/pets')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        cliente_id: clienteIdCriado,
        nome: 'Pet Futuro',
        especie: 'cachorro',
        peso_kg: 8.5,
        data_nascimento: '2099-01-01' // Data no futuro!
      });

    assert.equal(res.status, 400);
    assert.ok(res.body.error.includes('nascimento'));
  });

  test('POST /api/pets deve cadastrar pet com dados consistentes', async () => {
    const res = await request(app)
      .post('/api/pets')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        cliente_id: clienteIdCriado,
        nome: 'Thor Teste Validação',
        especie: 'cachorro',
        raca: 'Labrador',
        peso_kg: 29.5,
        alergias: 'Alergia a pulga'
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.nome, 'Thor Teste Validação');
  });
});
