import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import express from 'express';
import cors from 'cors';
import sequelize from '../src/config/database.js';
import { Usuario } from '../src/models/index.js';
import authRoutes from '../src/routes/auth.js';
import usuariosRoutes from '../src/routes/usuarios.js';
import caixaRoutes from '../src/routes/caixa.js';
import comissoesRoutes from '../src/routes/comissoes.js';
import bcrypt from 'bcrypt';

function buildApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use('/api/auth', authRoutes);
  app.use('/api/usuarios', usuariosRoutes);
  app.use('/api/caixa', caixaRoutes);
  app.use('/api/comissoes', comissoesRoutes);
  return app;
}

let app;
let adminToken;
let tosadorToken;
let tosadorId;

before(async () => {
  await sequelize.authenticate();
  await sequelize.sync();

  const senhaHash = await bcrypt.hash('admin123', 4);
  await Usuario.findOrCreate({
    where: { usuario: 'admin_sec_test' },
    defaults: { nome: 'Admin Sec Test', senha_hash: senhaHash, perfil: 'admin', ativo: true }
  });

  const [tosador] = await Usuario.findOrCreate({
    where: { usuario: 'tosador_sec_test' },
    defaults: { nome: 'Tosador Sec Test', senha_hash: senhaHash, perfil: 'tosador', ativo: true }
  });
  tosadorId = tosador.id;

  app = buildApp();

  const loginAdmin = await request(app)
    .post('/api/auth/login')
    .send({ usuario: 'admin_sec_test', senha: 'admin123' });
  adminToken = loginAdmin.body.token;

  const loginTosador = await request(app)
    .post('/api/auth/login')
    .send({ usuario: 'tosador_sec_test', senha: 'admin123' });
  tosadorToken = loginTosador.body.token;
});

after(async () => {
  await sequelize.close();
});

describe('Segurança, RBAC e Tratamento Seguro de Erros', () => {
  test('Tosador NÃO deve conseguir acessar módulo de Usuários (403 Proibido)', async () => {
    const res = await request(app)
      .get('/api/usuarios')
      .set('Authorization', `Bearer ${tosadorToken}`);

    assert.equal(res.status, 403);
  });

  test('Tosador NÃO deve conseguir cadastrar novos usuários', async () => {
    const res = await request(app)
      .post('/api/usuarios')
      .set('Authorization', `Bearer ${tosadorToken}`)
      .send({ nome: 'Hacker', usuario: 'hacker', senha: '123', perfil: 'admin' });

    assert.equal(res.status, 403);
  });

  test('Admin pode listar e gerenciar usuários com sucesso', async () => {
    const res = await request(app)
      .get('/api/usuarios')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body));
  });

  test('Isolamento de Dados: Tosador só recebe suas próprias comissões', async () => {
    const res = await request(app)
      .get('/api/comissoes')
      .set('Authorization', `Bearer ${tosadorToken}`);

    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body));
    // Valida que nenhum registro pertence a outro usuário
    for (const c of res.body) {
      assert.equal(c.usuario_id, tosadorId);
    }
  });

  test('Respostas de erro não devem vazar stack traces ou schemas SQL (Information Disclosure)', async () => {
    // Tenta obter ID inválido
    const res = await request(app)
      .get('/api/caixa/99999999')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(res.status, 404);
    assert.equal(typeof res.body.error, 'string');
    assert.equal(res.body.detalhes, undefined, 'Não deve conter campo detalhes com exceção crua');
    assert.equal(res.body.stack, undefined, 'Não deve conter stack trace');
  });
});
