import { Produto, MovimentoEstoque, Usuario, sequelize } from '../models/index.js';
import { Op } from 'sequelize';

export async function listar(req, res) {
  const { busca, categoria } = req.query;
  const where = { ativo: true };
  
  if (busca) {
    where[Op.or] = [
      { nome: { [Op.like]: `%${busca}%` } },
      { descricao: { [Op.like]: `%${busca}%` } }
    ];
  }
  
  if (categoria) {
    where.categoria = categoria;
  }

  try {
    const produtos = await Produto.findAll({
      where,
      order: [['nome', 'ASC']]
    });
    res.json(produtos);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao listar produtos' });
  }
}

export async function listarBaixoEstoque(req, res) {
  try {
    const produtos = await Produto.findAll({
      where: {
        ativo: true,
        quantidade: {
          [Op.lte]: Op.col('estoque_minimo')
        }
      },
      order: [['quantidade', 'ASC']]
    });
    res.json(produtos);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao listar produtos com baixo estoque' });
  }
}

export async function listarAVencer(req, res) {
  try {
    const limiteDias = new Date();
    limiteDias.setDate(limiteDias.getDate() + 60); // Próximos 60 dias
    const hojeStr = new Date().toISOString().split('T')[0];
    const limiteStr = limiteDias.toISOString().split('T')[0];

    const produtos = await Produto.findAll({
      where: {
        ativo: true,
        data_validade: {
          [Op.ne]: null,
          [Op.between]: [hojeStr, limiteStr]
        }
      },
      order: [['data_validade', 'ASC']]
    });
    res.json(produtos);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao listar produtos a vencer' });
  }
}

export async function detalhar(req, res) {
  try {
    const produto = await Produto.findByPk(req.params.id);
    if (!produto) return res.status(404).json({ error: 'Produto não encontrado' });

    const movimentacoes = await MovimentoEstoque.findAll({
      where: { produto_id: req.params.id },
      include: [
        { model: Usuario, as: 'usuario', attributes: ['nome'] }
      ],
      order: [['criado_em', 'DESC']],
      limit: 50
    });

    const produtoJson = produto.toJSON();
    produtoJson.movimentacoes = movimentacoes.map(m => {
      const mJson = m.toJSON();
      mJson.usuario_nome = m.usuario?.nome || '—';
      return mJson;
    });

    res.json(produtoJson);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao detalhar produto' });
  }
}

export async function criar(req, res) {
  const { nome, descricao, categoria, unidade_medida, preco_custo, preco_venda, quantidade, estoque_minimo, estoque_maximo, localizacao, fornecedor, codigo_barras, numero_lote, data_validade } = req.body;
  if (!nome || preco_venda === undefined || preco_venda === null) {
    return res.status(400).json({ error: 'Nome e preço de venda são obrigatórios' });
  }

  const pVenda = parseFloat(preco_venda);
  if (isNaN(pVenda) || pVenda < 0) {
    return res.status(400).json({ error: 'Preço de venda inválido' });
  }

  const unidade = unidade_medida || req.body.unidade || 'un';

  try {
    const novo = await Produto.create({
      nome,
      descricao,
      categoria,
      unidade_medida: unidade,
      preco_custo: parseFloat(preco_custo) || 0,
      preco_venda: pVenda,
      quantidade: parseInt(quantidade, 10) || 0,
      estoque_minimo: parseInt(estoque_minimo, 10) || 5,
      estoque_maximo: parseInt(estoque_maximo, 10) || 100,
      localizacao,
      fornecedor,
      codigo_barras,
      numero_lote,
      data_validade: data_validade || null,
      ativo: true
    });
    res.status(201).json(novo);
  } catch (err) {
    res.status(400).json({ error: 'Erro ao criar produto' });
  }
}

export async function atualizar(req, res) {
  const { nome, descricao, categoria, unidade_medida, preco_custo, preco_venda, quantidade, estoque_minimo, estoque_maximo, localizacao, fornecedor, codigo_barras, numero_lote, data_validade } = req.body;
  const unidade = unidade_medida || req.body.unidade;

  try {
    const prod = await Produto.findByPk(req.params.id);
    if (!prod) return res.status(404).json({ error: 'Produto não encontrado' });

    await prod.update({
      nome: nome !== undefined ? nome : prod.nome,
      descricao: descricao !== undefined ? descricao : prod.descricao,
      categoria: categoria !== undefined ? categoria : prod.categoria,
      unidade_medida: unidade !== undefined ? unidade : prod.unidade_medida,
      preco_custo: preco_custo !== undefined ? parseFloat(preco_custo) : prod.preco_custo,
      preco_venda: preco_venda !== undefined ? parseFloat(preco_venda) : prod.preco_venda,
      quantidade: quantidade !== undefined ? parseInt(quantidade, 10) : prod.quantidade,
      estoque_minimo: estoque_minimo !== undefined ? parseInt(estoque_minimo, 10) : prod.estoque_minimo,
      estoque_maximo: estoque_maximo !== undefined ? parseInt(estoque_maximo, 10) : prod.estoque_maximo,
      localizacao,
      fornecedor,
      codigo_barras,
      numero_lote,
      data_validade: data_validade !== undefined ? (data_validade || null) : prod.data_validade
    });

    res.json({ message: 'Produto atualizado com sucesso', produto: prod });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar produto' });
  }
}

export async function movimentar(req, res) {
  const { tipo, quantidade, motivo } = req.body;
  if (!['entrada', 'saida', 'ajuste'].includes(tipo)) {
    return res.status(400).json({ error: 'Tipo de movimentação inválido (use entrada, saida ou ajuste)' });
  }
  const qty = parseInt(quantidade, 10);
  if (isNaN(qty) || qty <= 0) return res.status(400).json({ error: 'Quantidade informada inválida' });

  const transaction = await sequelize.transaction();
  try {
    const prod = await Produto.findByPk(req.params.id, { transaction });
    if (!prod) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Produto não encontrado' });
    }

    let novaQtd = prod.quantidade;
    if (tipo === 'entrada') {
      novaQtd += qty;
    } else if (tipo === 'saida') {
      if (prod.quantidade < qty) {
        await transaction.rollback();
        return res.status(400).json({ error: `Estoque insuficiente (disponível: ${prod.quantidade}, solicitado: ${qty})` });
      }
      novaQtd -= qty;
    } else if (tipo === 'ajuste') {
      novaQtd = qty;
    }

    prod.quantidade = novaQtd;
    await prod.save({ transaction });

    await MovimentoEstoque.create({
      produto_id: prod.id,
      tipo,
      quantidade: qty,
      preco_unitario: prod.preco_custo || 0,
      motivo: motivo || `Movimentação manual (${tipo})`,
      usuario_id: req.usuario?.id || null
    }, { transaction });

    await transaction.commit();
    res.json({ message: 'Movimentação registrada com sucesso', quantidade_atual: novaQtd });
  } catch (err) {
    await transaction.rollback();
    res.status(500).json({ error: 'Erro ao registrar movimentação de estoque' });
  }
}

export async function excluir(req, res) {
  try {
    const prod = await Produto.findByPk(req.params.id);
    if (!prod) return res.status(404).json({ error: 'Produto não encontrado' });

    prod.ativo = false;
    await prod.save();
    res.json({ message: 'Produto desativado com sucesso' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao desativar produto' });
  }
}

export async function listarMovimentacoes(req, res) {
  const { produto_id, tipo, data_inicio, data_fim } = req.query;
  const where = {};
  
  if (produto_id) where.produto_id = produto_id;
  if (tipo) where.tipo = tipo;
  
  if (data_inicio || data_fim) {
    where.criado_em = {};
    if (data_inicio) where.criado_em[Op.gte] = new Date(data_inicio + 'T00:00:00');
    if (data_fim) where.criado_em[Op.lte] = new Date(data_fim + 'T23:59:59');
  }

  try {
    const movimentacoes = await MovimentoEstoque.findAll({
      where,
      include: [
        { model: Produto, as: 'produto', attributes: ['nome'] },
        { model: Usuario, as: 'usuario', attributes: ['nome'] }
      ],
      order: [['criado_em', 'DESC']],
      limit: 200
    });

    const formatadas = movimentacoes.map(m => {
      const mJson = m.toJSON();
      mJson.produto_nome = m.produto?.nome || '—';
      mJson.usuario_nome = m.usuario?.nome || '—';
      return mJson;
    });

    res.json(formatadas);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao listar movimentações' });
  }
}
