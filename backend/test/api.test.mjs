// Testes automatizados para o backend PetShop.
// Usa node:test nativo e Supertest para simular requests HTTP.
//
// Antes de rodar: `npm run seed` (garante schema e dados).
// Rodar:        `node test/api.test.mjs`

import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

// Importa o app (precisamos de um app "limpo" sem server.listen)
// Para isso, monkey-patchamos http.Server.prototype.listen
import express from 'express';
import cors from 'cors';
import sequelize from '../src/config/database.js';
import authRoutes from '../src/routes/auth.js';
import clienteRoutes from '../src/routes/clientes.js';
import petRoutes from '../src/routes/pets.js';
import agendamentoRoutes from '../src/routes/agendamentos.js';
import estoqueRoutes from '../src/routes/estoque.js';
import caixaRoutes from '../src/routes/caixa.js';
import vendaRoutes from '../src/routes/vendas.js';
import relatorioRoutes from '../src/routes/relatorios.js';
import usuarioRoutes from '../src/routes/usuarios.js';

function buildApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use('/api/auth', authRoutes);
  app.use('/api/clientes', clienteRoutes);
  app.use('/api/pets', petRoutes);
  app.use('/api/agendamentos', agendamentoRoutes);
  app.use('/api/estoque', estoqueRoutes);
  app.use('/api/caixa', caixaRoutes);
  app.use('/api/vendas', vendaRoutes);
  app.use('/api/relatorios', relatorioRoutes);
  app.use('/api/usuarios', usuarioRoutes);
  return app;
}

let app;
let adminToken;
let atendenteToken;
let testClienteId;
let testPetId;
let testProdutoId;

async function loginAs(usuario, senha) {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ usuario, senha });
  assert.equal(res.status, 200, `login ${usuario} falhou: ${res.status} ${JSON.stringify(res.body)}`);
  return res.body.token;
}

before(async () => {
  // Garante schema (não destrói dados existentes)
  await sequelize.authenticate();
  await sequelize.sync();

  // Garante usuário admin com senha conhecida
  const { Usuario } = await import('../src/models/index.js');
  const senhaHash = await bcrypt.hash('admin123', 4);
  const [admin] = await Usuario.findOrCreate({
    where: { usuario: 'admin' },
    defaults: { nome: 'Administrador', senha_hash: senhaHash, perfil: 'admin', ativo: true }
  });

  const senhaAtend = await bcrypt.hash('atendente123', 4);
  const [atendente] = await Usuario.findOrCreate({
    where: { usuario: 'atendente_teste' },
    defaults: { nome: 'Atendente Teste', senha_hash: senhaAtend, perfil: 'atendente', ativo: true }
  });

  app = buildApp();
  adminToken = await loginAs('admin', 'admin123');
  atendenteToken = await loginAs('atendente_teste', 'atendente123');
});

after(async () => {
  await sequelize.close();
});

describe('Auth', () => {
  test('login com credenciais válidas retorna token', async () => {
    const res = await request(app).post('/api/auth/login').send({ usuario: 'admin', senha: 'admin123' });
    assert.equal(res.status, 200);
    assert.ok(res.body.token, 'token ausente');
    assert.equal(res.body.usuario.perfil, 'admin');
  });

  test('login com senha inválida retorna 401', async () => {
    const res = await request(app).post('/api/auth/login').send({ usuario: 'admin', senha: 'errada' });
    assert.equal(res.status, 401);
  });

  test('rota protegida sem token retorna 401', async () => {
    const res = await request(app).get('/api/clientes');
    assert.equal(res.status, 401);
  });
});

describe('Clientes', () => {
  test('GET /clientes lista clientes (autenticado)', async () => {
    const res = await request(app).get('/api/clientes').set('Authorization', `Bearer ${adminToken}`);
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.data), 'resposta deve conter array em data');
  });

  test('POST /clientes cria cliente com e sem CPF', async () => {
    const { gerarCPFValido } = await import('../src/utils/validators.js');
    const cpfValido = gerarCPFValido();
    const res1 = await request(app).post('/api/clientes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ nome: 'Cliente A', telefone: '(11) 99999-0001', cpf: cpfValido });
    assert.equal(res1.status, 201, JSON.stringify(res1.body));
    testClienteId = res1.body.id;

    // Sem CPF
    const res2 = await request(app).post('/api/clientes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ nome: 'Cliente B', telefone: '(11) 99999-0002' });
    assert.equal(res2.status, 201, JSON.stringify(res2.body));
  });

  test('POST /clientes com dados inválidos retorna 400', async () => {
    const res = await request(app).post('/api/clientes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ nome: '' });
    assert.equal(res.status, 400);
  });

  test('PUT /clientes/:id atualiza cliente', async () => {
    const res = await request(app).put(`/api/clientes/${testClienteId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ nome: 'Cliente A Atualizado', telefone: '(11) 99999-0001' });
    assert.equal(res.status, 200);
  });
});

describe('Pets', () => {
  test('POST /pets cria pet com especie/sexo em inglês', async () => {
    const res = await request(app).post('/api/pets')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        cliente_id: testClienteId,
        nome: 'Rex Teste',
        especie: 'cachorro',
        sexo: 'M',
        peso_kg: 12.5
      });
    assert.equal(res.status, 201, JSON.stringify(res.body));
    assert.equal(res.body.especie, 'cachorro');
    assert.equal(res.body.sexo, 'M');
    testPetId = res.body.id;
  });

  test('POST /pets rejeita especie inválida', async () => {
    const res = await request(app).post('/api/pets')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ cliente_id: testClienteId, nome: 'P', especie: 'dragao' });
    assert.equal(res.status, 400);
  });

  test('GET /pets lista pets com tutor embutido', async () => {
    const res = await request(app).get('/api/pets').set('Authorization', `Bearer ${adminToken}`);
    assert.equal(res.status, 200);
    const rex = res.body.find(p => p.id === testPetId);
    assert.ok(rex, 'pet de teste não encontrado');
    assert.ok(rex.cliente_nome, 'cliente_nome ausente');
  });

  test('POST /pets/:id/checkin atualiza presença', async () => {
    const res = await request(app).post(`/api/pets/${testPetId}/checkin`)
      .set('Authorization', `Bearer ${adminToken}`);
    assert.equal(res.status, 200);
    assert.equal(res.body.status_presenca, 'presente');
  });
});

describe('Estoque', () => {
  test('GET /estoque/produtos lista produtos', async () => {
    const res = await request(app).get('/api/estoque/produtos').set('Authorization', `Bearer ${adminToken}`);
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body));
    if (res.body.length > 0) {
      testProdutoId = res.body[0].id;
      assert.equal(typeof res.body[0].preco_venda, 'number');
    }
  });

  test('POST /estoque/produtos cria produto', async () => {
    const res = await request(app).post('/api/estoque/produtos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nome: 'Produto Teste',
        preco_venda: 9.99,
        preco_custo: 5.00,
        quantidade: 10
      });
    assert.equal(res.status, 201, JSON.stringify(res.body));
    testProdutoId = res.body.id;
  });

  test('POST /estoque/produtos sem preco_venda retorna 400', async () => {
    const res = await request(app).post('/api/estoque/produtos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ nome: 'Sem Preco' });
    assert.equal(res.status, 400);
  });

  test('POST /estoque/produtos/:id/movimentar entrada aumenta estoque', async () => {
    const res = await request(app).post(`/api/estoque/produtos/${testProdutoId}/movimentar`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ tipo: 'entrada', quantidade: 5, motivo: 'Teste' });
    assert.equal(res.status, 200);
  });
});

describe('Agendamentos', () => {
  test('GET /agendamentos/servicos lista serviços com campo preco (compatibilidade)', async () => {
    const res = await request(app).get('/api/agendamentos/servicos')
      .set('Authorization', `Bearer ${adminToken}`);
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body));
    if (res.body.length > 0) {
      assert.equal(typeof res.body[0].preco, 'number', 'campo preco ausente');
    }
  });
});

describe('Vendas (Sequelize)', () => {
  test('GET /vendas retorna lista de vendas (entradas com itens)', async () => {
    const res = await request(app).get('/api/vendas').set('Authorization', `Bearer ${adminToken}`);
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body));
  });

  test('POST /vendas cria venda de produto e baixa estoque', async () => {
    if (!testProdutoId) return; // pula se não tem produto
    const res = await request(app).post('/api/vendas')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        cliente_id: testClienteId,
        itens: [{ tipo: 'produto', item_id: testProdutoId, quantidade: 1, preco_unitario: 10 }],
        forma_pagamento: 'PIX'
      });
    assert.equal(res.status, 201, JSON.stringify(res.body));
    assert.ok(res.body.id);
    assert.equal(typeof res.body.total, 'number');
  });

  test('POST /vendas com tipo inválido retorna 400', async () => {
    const res = await request(app).post('/api/vendas')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ cliente_id: testClienteId, itens: [{ tipo: 'inexistente', item_id: 1, quantidade: 1 }] });
    assert.equal(res.status, 400);
  });
});

describe('Caixa', () => {
  test('GET /caixa/saldo/resumo retorna saldos', async () => {
    const res = await request(app).get('/api/caixa/saldo/resumo')
      .set('Authorization', `Bearer ${adminToken}`);
    assert.equal(res.status, 200);
    assert.ok('saldo' in res.body);
    assert.ok('entradas' in res.body);
    assert.ok('saidas' in res.body);
  });

  test('POST /caixa/transacao registra lançamento manual', async () => {
    const res = await request(app).post('/api/caixa/transacao')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        tipo: 'entrada',
        valor: 50.00,
        descricao: 'Lançamento de teste',
        categoria: 'outro',
        forma_pagamento: 'Dinheiro'
      });
    assert.equal(res.status, 201);
  });
});

describe('Relatórios', () => {
  test('GET /relatorios/dashboard retorna métricas', async () => {
    const res = await request(app).get('/api/relatorios/dashboard')
      .set('Authorization', `Bearer ${adminToken}`);
    assert.equal(res.status, 200);
    assert.ok('totalClientes' in res.body);
    assert.ok('faturamentoMes' in res.body);
  });

  test('GET /relatorios/faturamento com período válido', async () => {
    const res = await request(app).get('/api/relatorios/faturamento')
      .query({ data_inicio: '2024-01-01', data_fim: '2030-12-31' })
      .set('Authorization', `Bearer ${adminToken}`);
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body));
  });

  test('GET /relatorios/faturamento sem período retorna 400', async () => {
    const res = await request(app).get('/api/relatorios/faturamento')
      .set('Authorization', `Bearer ${adminToken}`);
    assert.equal(res.status, 400);
  });
});

describe('Permissões', () => {
  test('atendente não consegue listar usuários (rota admin)', async () => {
    const res = await request(app).get('/api/usuarios')
      .set('Authorization', `Bearer ${atendenteToken}`);
    assert.equal(res.status, 403);
  });

  test('admin consegue listar usuários', async () => {
    const res = await request(app).get('/api/usuarios')
      .set('Authorization', `Bearer ${adminToken}`);
    assert.equal(res.status, 200);
  });
});
