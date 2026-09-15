import { Caixa, ItensCaixa, Produto, MovimentoEstoque, Cliente, Servico, sequelize } from '../models/index.js';
import { Op } from 'sequelize';
import { gerarComprovante } from '../utils/pdfGenerator.js';

// Lista vendas (entradas de caixa vinculadas a itens de produto/serviço avulso).
// Mantida como "vendas" para preservar a UI/rota legada usada pelo frontend.
export async function listar(req, res) {
  const { cliente_id, data_inicio, data_fim, status } = req.query;
  const where = {};
  // Vendas são entradas de caixa que possuem itens registrados
  if (cliente_id) where.cliente_id = cliente_id;
  if (status) where.status = status;
  if (data_inicio || data_fim) {
    where.criado_em = {};
    if (data_inicio) where.criado_em[Op.gte] = new Date(`${data_inicio}T00:00:00`);
    if (data_fim) where.criado_em[Op.lte] = new Date(`${data_fim}T23:59:59`);
  }

  try {
    // Vendas são "Caixa" do tipo entrada com itens (serviço ou produto)
    where.tipo = 'entrada';
    const vendas = await Caixa.findAll({
      where,
      include: [
        { model: Cliente, as: 'cliente', attributes: ['nome', 'telefone'] },
        { model: ItensCaixa, as: 'itens' }
      ],
      order: [['criado_em', 'DESC']],
      limit: 100
    });

    const formatadas = vendas.map(v => {
      const vJson = v.toJSON();
      vJson.cliente_nome = v.cliente?.nome || '—';
      const subtotal = (v.itens || []).reduce((acc, i) => acc + Number(i.subtotal || 0), 0);
      vJson.subtotal = subtotal;
      vJson.desconto = Math.max(0, subtotal - Number(vJson.valor || 0));
      vJson.total = Number(vJson.valor || 0);
      return vJson;
    });

    res.json(formatadas);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao listar vendas', detalhes: err.message });
  }
}

export async function detalhar(req, res) {
  try {
    const venda = await Caixa.findOne({
      where: { id: req.params.id, tipo: 'entrada' },
      include: [
        { model: Cliente, as: 'cliente' },
        { model: ItensCaixa, as: 'itens' }
      ]
    });
    if (!venda) return res.status(404).json({ error: 'Venda não encontrada' });
    res.json(venda);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao detalhar venda', detalhes: err.message });
  }
}

// Cria venda com itens (serviço ou produto). Para produtos, baixa estoque.
export async function criar(req, res) {
  const { cliente_id, agendamento_id, itens, desconto, forma_pagamento, observacoes } = req.body;
  if (!cliente_id || !itens || !Array.isArray(itens) || itens.length === 0) {
    return res.status(400).json({ error: 'Cliente e itens são obrigatórios' });
  }

  const transaction = await sequelize.transaction();
  try {
    let subtotal = 0;
    const itensFormatados = [];
    const updatesEstoque = [];

    for (const item of itens) {
      const qty = item.quantidade || 1;
      let precoUnit = Number(item.preco_unitario || 0);
      let nomeItem = item.nome;
      let itemIdReal = item.item_id;
      let tipoItem = item.tipo; // 'produto' ou 'servico'

      if (tipoItem === 'produto') {
        const prod = await Produto.findByPk(item.item_id, { transaction });
        if (!prod) throw new Error(`Produto #${item.item_id} não encontrado`);
        if (prod.quantidade < qty) {
          throw new Error(`Estoque insuficiente para ${prod.nome} (solicitado: ${qty}, disponível: ${prod.quantidade})`);
        }
        precoUnit = prod.preco_venda;
        nomeItem = prod.nome;
        updatesEstoque.push({ prod, qty });
      } else if (tipoItem === 'servico') {
        const serv = await Servico.findByPk(item.item_id, { transaction });
        if (!serv) throw new Error(`Serviço #${item.item_id} não encontrado`);
        precoUnit = Number(serv.preco_base);
        nomeItem = serv.nome;
      } else {
        throw new Error('Tipo de item inválido (use "produto" ou "servico")');
      }

      const sub = qty * precoUnit;
      subtotal += sub;
      itensFormatados.push({
        tipo: tipoItem,
        item_id: itemIdReal,
        nome: nomeItem,
        quantidade: qty,
        preco_unitario: precoUnit,
        subtotal: sub
      });
    }

    const desc = Number(desconto || 0);
    const total = Math.max(0, subtotal - desc);
    const descStr = observacoes || `Venda para cliente #${cliente_id}`;

    const caixa = await Caixa.create({
      tipo: 'entrada',
      valor: total,
      descricao: descStr,
      forma_pagamento: forma_pagamento || 'Dinheiro',
      categoria: 'venda_produto',
      cliente_id,
      agendamento_id: agendamento_id || null,
      usuario_id: req.usuario.id,
      status: 'pago'
    }, { transaction });

    for (const line of itensFormatados) {
      line.caixa_id = caixa.id;
      await ItensCaixa.create(line, { transaction });
    }

    for (const u of updatesEstoque) {
      u.prod.quantidade = u.prod.quantidade - u.qty;
      await u.prod.save({ transaction });
      await MovimentoEstoque.create({
        produto_id: u.prod.id,
        tipo: 'saida',
        quantidade: u.qty,
        preco_unitario: u.prod.preco_venda,
        motivo: `Venda #${caixa.id}`,
        usuario_id: req.usuario.id
      }, { transaction });
    }

    await transaction.commit();
    res.status(201).json({ id: caixa.id, subtotal, desconto: desc, total });
  } catch (err) {
    await transaction.rollback();
    res.status(400).json({ error: err.message });
  }
}

export async function comprovante(req, res) {
  try {
    const caminho = await gerarComprovante(parseInt(req.params.id, 10));
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="recibo_${req.params.id}.pdf"`);
    res.sendFile(caminho);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao gerar comprovante' });
  }
}
