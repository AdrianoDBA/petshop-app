import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import express from 'express';
import cors from 'cors';
import sequelize from '../src/config/database.js';
import { Usuario, Cliente, Pet, Produto, Pacote, AssinaturaCliente, Servico } from '../src/models/index.js';
import estoqueRoutes from '../src/routes/estoque.js';
import caixaRoutes from '../src/routes/caixa.js';
import pacoteRoutes from '../src/routes/pacotes.js';
import authRoutes from '../src/routes/auth.js';
import bcrypt from 'bcrypt';

function buildApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use('/api/auth', authRoutes);
  app.use('/api/estoque', estoqueRoutes);
  app.use('/api/caixa', caixaRoutes);
  app.use('/api/pacotes', pacoteRoutes);
  return app;
}

let app;
let adminToken;
let produtoEstoque;
let clienteFin;
let petFin;
let pacoteTeste;

before(async () => {
  await sequelize.authenticate();
  await sequelize.sync();

  const senhaHash = await bcrypt.hash('admin123', 4);
  await Usuario.findOrCreate({
    where: { usuario: 'admin_test_fin' },
    defaults: { nome: 'Admin Fin Test', senha_hash: senhaHash, perfil: 'admin', ativo: true }
  });

  const [cli] = await Cliente.findOrCreate({
    where: { telefone: '(11) 98111-9999' },
    defaults: { nome: 'Cliente Fin Test', ativo: true }
  });
  clienteFin = cli;

  const [p] = await Pet.findOrCreate({
    where: { cliente_id: cli.id, nome: 'Pet Fin Test' },
    defaults: { especie: 'cachorro', status_presenca: 'ausente', ativo: true }
  });
  petFin = p;

  const [prod] = await Produto.findOrCreate({
    where: { nome: 'Shampoo Neutro Teste ACID' },
    defaults: { preco_custo: 10.00, preco_venda: 25.00, quantidade: 10, ativo: true }
  });
  produtoEstoque = prod;

  const [srv] = await Servico.findOrCreate({
    where: { nome: 'Banho Pacote Teste' },
    defaults: { preco_base: 50.00, categoria: 'banho', ativo: true }
  });

  const [pct] = await Pacote.findOrCreate({
    where: { nome: 'Pacote 2 Banhos Teste ACID' },
    defaults: { servico_id: srv.id, quantidade_sessoes: 2, validade_dias: 30, preco_total: 80.00 }
  });
  pacoteTeste = pct;

  app = buildApp();

  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({ usuario: 'admin_test_fin', senha: 'admin123' });
  adminToken = loginRes.body.token;
});

after(async () => {
  await sequelize.close();
});

describe('Estoque, Fluxo de Caixa e Transações ACID', () => {
  test('POST /api/caixa/transacao deve rejeitar valores negativos ou zero', async () => {
    const res1 = await request(app)
      .post('/api/caixa/transacao')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        tipo: 'entrada',
        valor: -50.00, // Negativo inválido
        descricao: 'Teste Negativo',
        categoria: 'outro'
      });

    assert.equal(res1.status, 400);

    const res2 = await request(app)
      .post('/api/caixa/transacao')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        tipo: 'entrada',
        valor: 0, // Zero inválido
        descricao: 'Teste Zero',
        categoria: 'outro'
      });

    assert.equal(res2.status, 400);
  });

  test('POST /api/caixa/venda-produto deve rejeitar venda se estoque for insuficiente', async () => {
    const res = await request(app)
      .post('/api/caixa/venda-produto')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        cliente_id: clienteFin.id,
        itens: [{ item_id: produtoEstoque.id, quantidade: 999 }] // Quantidade acima do disponível
      });

    assert.equal(res.status, 400);
    assert.ok(res.body.error.includes('Estoque insuficiente'));
  });

  test('POST /api/caixa/venda-produto deve realizar baixa atômica no estoque e lançar no caixa', async () => {
    const qtdInicial = produtoEstoque.quantidade;
    const res = await request(app)
      .post('/api/caixa/venda-produto')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        cliente_id: clienteFin.id,
        forma_pagamento: 'PIX',
        itens: [{ item_id: produtoEstoque.id, quantidade: 2 }]
      });

    assert.equal(res.status, 201);
    assert.ok(res.body.id);

    // Recarrega produto para validar integridade da quantidade
    const prodAtualizado = await Produto.findByPk(produtoEstoque.id);
    assert.equal(prodAtualizado.quantidade, qtdInicial - 2);
  });

  test('POST /api/estoque/produtos/:id/movimentar deve atualizar quantidade de forma atômica', async () => {
    const prod = await Produto.findByPk(produtoEstoque.id);
    const qtdAntes = prod.quantidade;

    const res = await request(app)
      .post(`/api/estoque/produtos/${produtoEstoque.id}/movimentar`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        tipo: 'entrada',
        quantidade: 5,
        motivo: 'Chegada de Lote'
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.quantidade_atual, qtdAntes + 5);
  });

  test('Módulo de Pacotes: Deve vender pacote e debitar sessões até esgotar', async () => {
    // 1. Vende pacote
    const resVenda = await request(app)
      .post('/api/pacotes/vender')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        cliente_id: clienteFin.id,
        pet_id: petFin.id,
        pacote_id: pacoteTeste.id,
        forma_pagamento: 'PIX'
      });

    assert.equal(resVenda.status, 201);
    const assinaturaId = resVenda.body.assinatura.id;

    // 2. Debita sessão 1 (de 2)
    const resDebito1 = await request(app)
      .post(`/api/pacotes/assinaturas/${assinaturaId}/debitar`)
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(resDebito1.status, 200);
    assert.equal(resDebito1.body.assinatura.sessoes_utilizadas, 1);
    assert.equal(resDebito1.body.assinatura.status, 'ativo');

    // 3. Debita sessão 2 (de 2 - deve esgotar)
    const resDebito2 = await request(app)
      .post(`/api/pacotes/assinaturas/${assinaturaId}/debitar`)
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(resDebito2.status, 200);
    assert.equal(resDebito2.body.assinatura.sessoes_utilizadas, 2);
    assert.equal(resDebito2.body.assinatura.status, 'esgotado');

    // 4. Tentativa de debitar sessão extra além do limite deve falhar com 400
    const resDebitoExtra = await request(app)
      .post(`/api/pacotes/assinaturas/${assinaturaId}/debitar`)
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(resDebitoExtra.status, 400);
    assert.ok(resDebitoExtra.body.error.includes('utilizadas') || resDebitoExtra.body.error.includes('esgotado'));
  });
});
