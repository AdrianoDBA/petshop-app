import { Caixa, ItensCaixa, Produto, MovimentoEstoque, Cliente, Agendamento, Pet, Servico, sequelize } from '../models/index.js';
import { gerarComprovante } from '../utils/pdfGenerator.js';
import { verificarDataHoraFutura } from '../utils/validators.js';
import { Op } from 'sequelize';

export async function listar(req, res) {
  const { limit = 100, offset = 0 } = req.query;
  try {
    const lancamentos = await Caixa.findAll({
      include: [
        { model: Cliente, as: 'cliente', attributes: ['nome'] }
      ],
      order: [['criado_em', 'DESC']],
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10)
    });
    const formatados = lancamentos.map(l => {
      const lJson = l.toJSON();
      lJson.cliente_nome = l.cliente?.nome || null;
      return lJson;
    });
    res.json(formatados);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao listar lançamentos do caixa' });
  }
}

export async function detalhar(req, res) {
  try {
    const lancamento = await Caixa.findOne({
      where: { id: req.params.id },
      include: [
        { model: Cliente, as: 'cliente' },
        { model: ItensCaixa, as: 'itens' }
      ]
    });
    if (!lancamento) return res.status(404).json({ error: 'Lançamento não encontrado' });
    res.json(lancamento);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao detalhar lançamento do caixa' });
  }
}

export async function resumoSaldo(req, res) {
  try {
    const entradas = await Caixa.sum('valor', { where: { tipo: 'entrada', status: 'pago' } }) || 0;
    const saidas = await Caixa.sum('valor', { where: { tipo: 'saida', status: 'pago' } }) || 0;
    const saldo = entradas - saidas;
    res.json({ saldo, entradas, saidas });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao obter resumo do caixa' });
  }
}

export async function transacaoManual(req, res) {
  const { tipo, valor, descricao, forma_pagamento, categoria, cliente_id } = req.body;
  if (!tipo || valor === undefined || !descricao || !categoria) {
    return res.status(400).json({ error: 'Tipo, valor, descrição e categoria são obrigatórios' });
  }

  const numValor = parseFloat(valor);
  if (isNaN(numValor) || numValor <= 0) {
    return res.status(400).json({ error: 'O valor da transação deve ser um número positivo maior que zero' });
  }

  if (!['entrada', 'saida'].includes(tipo)) {
    return res.status(400).json({ error: 'Tipo de transação deve ser "entrada" ou "saida"' });
  }

  try {
    const lancamento = await Caixa.create({
      tipo,
      valor: numValor,
      descricao,
      forma_pagamento: forma_pagamento || 'Dinheiro',
      categoria,
      cliente_id: cliente_id || null,
      usuario_id: req.usuario?.id || null,
      status: 'pago'
    });

    res.status(201).json(lancamento);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao registrar transação manual' });
  }
}

export async function vendaProduto(req, res) {
  const { cliente_id, desconto, forma_pagamento, observacoes, itens } = req.body;
  if (!cliente_id || !itens || !Array.isArray(itens) || itens.length === 0) {
    return res.status(400).json({ error: 'Cliente e lista de itens são obrigatórios' });
  }

  const transaction = await sequelize.transaction();
  try {
    let subtotal = 0;
    const itemsToCreate = [];
    const stockUpdates = [];

    for (const item of itens) {
      const qty = parseInt(item.quantidade, 10);
      if (isNaN(qty) || qty <= 0) {
        throw new Error('Quantidade de item inválida');
      }

      const prod = await Produto.findByPk(item.item_id, { transaction });
      if (!prod) {
        throw new Error(`Produto #${item.item_id} não encontrado`);
      }
      if (prod.quantidade < qty) {
        throw new Error(`Estoque insuficiente para ${prod.nome} (Solicitado: ${qty}, Disponível: ${prod.quantidade})`);
      }

      const itemSub = qty * prod.preco_venda;
      subtotal += itemSub;

      itemsToCreate.push({
        tipo: 'produto',
        item_id: prod.id,
        nome: prod.nome,
        quantidade: qty,
        preco_unitario: prod.preco_venda,
        subtotal: itemSub
      });

      stockUpdates.push({ prod, newQtd: prod.quantidade - qty, qtySold: qty });
    }

    const numDesconto = Math.max(0, parseFloat(desconto) || 0);
    const valorFinal = Math.max(0, subtotal - numDesconto);

    const descStr = observacoes || `Venda de Produtos para cliente #${cliente_id}`;
    const caixaResult = await Caixa.create({
      tipo: 'entrada',
      valor: valorFinal,
      descricao: descStr,
      forma_pagamento: forma_pagamento || 'Dinheiro',
      categoria: 'venda_produto',
      cliente_id,
      usuario_id: req.usuario?.id || null,
      status: 'pago'
    }, { transaction });

    for (const line of itemsToCreate) {
      line.caixa_id = caixaResult.id;
      await ItensCaixa.create(line, { transaction });
    }

    for (const update of stockUpdates) {
      update.prod.quantidade = update.newQtd;
      await update.prod.save({ transaction });

      await MovimentoEstoque.create({
        produto_id: update.prod.id,
        tipo: 'saida',
        quantidade: update.qtySold,
        preco_unitario: update.prod.preco_venda,
        motivo: `Venda Ref Caixa #${caixaResult.id}`,
        usuario_id: req.usuario?.id || null
      }, { transaction });
    }

    await transaction.commit();
    res.status(201).json({ id: caixaResult.id, valor: valorFinal, subtotal, desconto: numDesconto });
  } catch (err) {
    await transaction.rollback();
    res.status(400).json({ error: err.message || 'Erro ao processar venda de produtos' });
  }
}

export async function compraProduto(req, res) {
  const { forma_pagamento, observacoes, itens } = req.body;
  if (!itens || !Array.isArray(itens) || itens.length === 0) {
    return res.status(400).json({ error: 'Itens de compra são obrigatórios' });
  }

  const transaction = await sequelize.transaction();
  try {
    let subtotal = 0;
    const itemsToCreate = [];
    const stockUpdates = [];

    for (const item of itens) {
      const qty = parseInt(item.quantidade, 10);
      if (isNaN(qty) || qty <= 0) {
        throw new Error('Quantidade de item inválida');
      }

      const prod = await Produto.findByPk(item.item_id, { transaction });
      if (!prod) {
        throw new Error(`Produto #${item.item_id} não encontrado`);
      }

      const itemCost = parseFloat(item.preco_unitario) || prod.preco_custo;
      const itemSub = qty * itemCost;
      subtotal += itemSub;

      itemsToCreate.push({
        tipo: 'produto',
        item_id: prod.id,
        nome: prod.nome,
        quantidade: qty,
        preco_unitario: itemCost,
        subtotal: itemSub
      });

      stockUpdates.push({ prod, newQtd: prod.quantidade + qty, qtyBought: qty, cost: itemCost });
    }

    const descStr = observacoes || 'Reabastecimento de Estoque - Compra de Fornecedor';
    const caixaResult = await Caixa.create({
      tipo: 'saida',
      valor: subtotal,
      descricao: descStr,
      forma_pagamento: forma_pagamento || 'Boleto',
      categoria: 'compra_produto',
      usuario_id: req.usuario?.id || null,
      status: 'pago'
    }, { transaction });

    for (const line of itemsToCreate) {
      line.caixa_id = caixaResult.id;
      await ItensCaixa.create(line, { transaction });
    }

    for (const update of stockUpdates) {
      update.prod.quantidade = update.newQtd;
      update.prod.preco_custo = update.cost;
      await update.prod.save({ transaction });

      await MovimentoEstoque.create({
        produto_id: update.prod.id,
        tipo: 'entrada',
        quantidade: update.qtyBought,
        preco_unitario: update.cost,
        motivo: `Reabastecimento Ref Caixa #${caixaResult.id}`,
        usuario_id: req.usuario?.id || null
      }, { transaction });
    }

    await transaction.commit();
    res.status(201).json({ id: caixaResult.id, valor: subtotal });
  } catch (err) {
    await transaction.rollback();
    res.status(400).json({ error: err.message || 'Erro ao processar compra de produtos' });
  }
}

export async function servicoCheckout(req, res) {
  const { agendamento_id, forma_pagamento } = req.body;
  if (!agendamento_id) {
    return res.status(400).json({ error: 'ID do agendamento é obrigatório' });
  }

  const transaction = await sequelize.transaction();
  try {
    const ag = await Agendamento.findOne({
      where: { id: agendamento_id },
      include: [
        { model: Pet, as: 'pet' },
        { model: Servico, as: 'servico' }
      ],
      transaction
    });

    if (!ag) throw new Error('Agendamento não encontrado');
    if (ag.status === 'concluido') throw new Error('Este agendamento já foi faturado e concluído');

    // Validação estrita: impede checkout e entrada no caixa de agendamentos futuros
    const checkFuturo = verificarDataHoraFutura(ag.data_agendada, ag.hora_agendada);
    if (checkFuturo.ehFuturo) {
      throw new Error(`Não é permitido faturar e dar entrada no caixa antes da data do agendamento. ${checkFuturo.motivo}`);
    }

    ag.status = 'concluido';
    ag.forma_pagamento = forma_pagamento || 'Dinheiro';
    ag.data_realizacao = new Date();
    ag.hora_fim = new Date();
    await ag.save({ transaction });

    if (ag.pet) {
      ag.pet.status_presenca = 'ausente';
      ag.pet.data_checkout = new Date();
      await ag.pet.save({ transaction });
    }

    const descStr = `Serviço ${ag.servico?.nome || 'Banho/Tosa'} - Pet: ${ag.pet?.nome || '—'}`;
    const caixaResult = await Caixa.create({
      tipo: 'entrada',
      valor: ag.preco_praticado,
      descricao: descStr,
      forma_pagamento: forma_pagamento || 'Dinheiro',
      categoria: 'servico',
      cliente_id: ag.pet ? ag.pet.cliente_id : null,
      agendamento_id: ag.id,
      usuario_id: req.usuario?.id || null,
      status: 'pago'
    }, { transaction });

    await ItensCaixa.create({
      caixa_id: caixaResult.id,
      tipo: 'servico',
      item_id: ag.servico_id,
      nome: ag.servico?.nome || 'Serviço',
      quantidade: 1,
      preco_unitario: ag.preco_praticado,
      subtotal: ag.preco_praticado
    }, { transaction });

    await transaction.commit();
    res.json({ message: 'Checkout de serviço realizado com sucesso!', id: caixaResult.id });
  } catch (err) {
    await transaction.rollback();
    res.status(400).json({ error: err.message || 'Erro no checkout de serviço' });
  }
}

export async function comprovante(req, res) {
  try {
    const caminhoPdf = await gerarComprovante(req.params.id);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="recibo_${req.params.id}.pdf"`);
    res.sendFile(caminhoPdf);
  } catch (err) {
    res.status(400).json({ error: 'Erro ao gerar comprovante PDF' });
  }
}
