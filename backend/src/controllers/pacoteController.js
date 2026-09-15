import { Pacote, AssinaturaCliente, Cliente, Pet, Servico, Caixa, ItensCaixa, sequelize } from '../models/index.js';

export async function listar(req, res) {
  try {
    const pacotes = await Pacote.findAll({
      include: [{ model: Servico, as: 'servico', attributes: ['nome', 'preco_base'] }],
      order: [['criado_em', 'DESC']]
    });
    res.json(pacotes);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao listar pacotes' });
  }
}

export async function criar(req, res) {
  const { nome, descricao, servico_id, quantidade_sessoes, validade_dias, preco_total, desconto_percentual } = req.body;
  if (!nome || preco_total === undefined || !quantidade_sessoes) {
    return res.status(400).json({ error: 'Nome, preço total e quantidade de sessões são obrigatórios' });
  }

  const pTotal = parseFloat(preco_total);
  if (isNaN(pTotal) || pTotal <= 0) {
    return res.status(400).json({ error: 'Preço total deve ser um número positivo' });
  }

  try {
    const novo = await Pacote.create({
      nome,
      descricao,
      servico_id: servico_id || null,
      quantidade_sessoes: parseInt(quantidade_sessoes, 10) || 4,
      validade_dias: parseInt(validade_dias, 10) || 30,
      preco_total: pTotal,
      desconto_percentual: parseFloat(desconto_percentual) || 0
    });
    res.status(201).json(novo);
  } catch (err) {
    res.status(400).json({ error: 'Erro ao criar pacote' });
  }
}

export async function listarAssinaturas(req, res) {
  const { pet_id, status } = req.query;
  const where = {};
  if (pet_id) where.pet_id = pet_id;
  if (status) where.status = status;

  try {
    const assinaturas = await AssinaturaCliente.findAll({
      where,
      include: [
        { model: Cliente, as: 'cliente', attributes: ['nome', 'telefone'] },
        { model: Pet, as: 'pet', attributes: ['nome', 'especie', 'raca'] },
        { model: Pacote, as: 'pacote', attributes: ['nome', 'quantidade_sessoes'] }
      ],
      order: [['criado_em', 'DESC']]
    });

    const formatadas = assinaturas.map(a => {
      const aJson = a.toJSON();
      aJson.cliente_nome = a.cliente?.nome || '—';
      aJson.cliente_telefone = a.cliente?.telefone || '';
      aJson.pet_nome = a.pet?.nome || '—';
      aJson.pacote_nome = a.pacote?.nome || '—';
      aJson.sessoes_restantes = Math.max(0, a.sessoes_totais - a.sessoes_utilizadas);
      return aJson;
    });

    res.json(formatadas);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao listar assinaturas de pacotes' });
  }
}

export async function venderPacote(req, res) {
  const { cliente_id, pet_id, pacote_id, forma_pagamento = 'PIX', observacoes } = req.body;
  if (!cliente_id || !pet_id || !pacote_id) {
    return res.status(400).json({ error: 'Cliente, Pet e Pacote são obrigatórios' });
  }

  const transaction = await sequelize.transaction();
  try {
    const pacote = await Pacote.findByPk(pacote_id, { transaction });
    if (!pacote) throw new Error('Pacote não encontrado');

    const dataHoje = new Date();
    const dataValidade = new Date();
    dataValidade.setDate(dataHoje.getDate() + (pacote.validade_dias || 30));

    const assinatura = await AssinaturaCliente.create({
      cliente_id,
      pet_id,
      pacote_id,
      sessoes_totais: pacote.quantidade_sessoes,
      sessoes_utilizadas: 0,
      data_inicio: dataHoje.toISOString().split('T')[0],
      data_validade: dataValidade.toISOString().split('T')[0],
      status: 'ativo',
      valor_pago: pacote.preco_total,
      observacoes
    }, { transaction });

    const caixaResult = await Caixa.create({
      tipo: 'entrada',
      valor: pacote.preco_total,
      descricao: `Venda de Assinatura: ${pacote.nome} para Pet #${pet_id}`,
      forma_pagamento,
      categoria: 'servico',
      cliente_id,
      usuario_id: req.usuario?.id || null,
      status: 'pago'
    }, { transaction });

    await ItensCaixa.create({
      caixa_id: caixaResult.id,
      tipo: 'servico',
      item_id: pacote.servico_id || pacote.id,
      nome: `Assinatura ${pacote.nome} (${pacote.quantidade_sessoes}x sessões)`,
      quantidade: 1,
      preco_unitario: pacote.preco_total,
      subtotal: pacote.preco_total
    }, { transaction });

    await transaction.commit();
    res.status(201).json({ assinatura, caixa_id: caixaResult.id });
  } catch (err) {
    await transaction.rollback();
    res.status(400).json({ error: err.message || 'Erro ao processar venda do pacote' });
  }
}

export async function debitarSessao(req, res) {
  const { id } = req.params;
  const transaction = await sequelize.transaction();
  try {
    const assinatura = await AssinaturaCliente.findByPk(id, { transaction });
    if (!assinatura) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Assinatura não encontrada' });
    }

    if (assinatura.sessoes_utilizadas >= assinatura.sessoes_totais) {
      assinatura.status = 'esgotado';
      await assinatura.save({ transaction });
      await transaction.commit();
      return res.status(400).json({ error: 'Todas as sessões deste pacote já foram utilizadas' });
    }

    assinatura.sessoes_utilizadas += 1;
    if (assinatura.sessoes_utilizadas >= assinatura.sessoes_totais) {
      assinatura.status = 'esgotado';
    }
    await assinatura.save({ transaction });
    await transaction.commit();

    res.json({ message: 'Sessão debitada com sucesso!', assinatura });
  } catch (err) {
    await transaction.rollback();
    res.status(500).json({ error: 'Erro ao debitar sessão do pacote' });
  }
}
