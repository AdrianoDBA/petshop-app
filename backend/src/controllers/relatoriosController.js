import { Cliente, Pet, Agendamento, Servico, Usuario, Produto, Caixa, ItensCaixa, sequelize } from '../models/index.js';
import { getLocalDateString } from '../utils/date.js';
import { Op } from 'sequelize';

export async function dashboard(req, res) {
  const hoje = getLocalDateString();
  const inicioMes = hoje.slice(0, 7) + '-01';

  try {
    const totalClientes = await Cliente.count({ where: { ativo: true } });
    const totalPets = await Pet.count({ where: { ativo: true } });
    const agendamentosHoje = await Agendamento.count({
      where: {
        data_agendada: hoje,
        status: { [Op.ne]: 'cancelado' }
      }
    });

    const isPostgres = sequelize.getDialect() === 'postgres';
    const dateCol = isPostgres 
      ? sequelize.literal('CAST("Caixa"."criado_em" AS DATE)')
      : sequelize.fn('date', sequelize.col('Caixa.criado_em'));

    const faturamentoMes = await Caixa.sum('valor', {
      where: {
        tipo: 'entrada',
        [Op.and]: [
          sequelize.where(dateCol, { [Op.gte]: inicioMes })
        ]
      }
    }) || 0;

    const faturamentoHoje = await Caixa.sum('valor', {
      where: {
        tipo: 'entrada',
        [Op.and]: [
          sequelize.where(dateCol, hoje)
        ]
      }
    }) || 0;

    const produtosBaixoEstoque = await Produto.count({
      where: {
        ativo: true,
        quantidade: { [Op.lte]: sequelize.col('estoque_minimo') }
      }
    });

    // Próximos agendamentos
    const proximos = await Agendamento.findAll({
      where: {
        data_agendada: { [Op.gte]: hoje },
        status: { [Op.in]: ['agendado', 'confirmado', 'em_andamento'] }
      },
      include: [
        {
          model: Pet,
          as: 'pet',
          attributes: ['nome'],
          include: [{ model: Cliente, as: 'tutor', attributes: ['nome'] }]
        },
        { model: Servico, as: 'servico', attributes: ['nome'] }
      ],
      order: [['data_agendada', 'ASC'], ['hora_agendada', 'ASC']],
      limit: 10
    });

    const formatadosProximos = proximos.map(a => {
      const aJson = a.toJSON();
      aJson.pet_nome = a.pet?.nome || '—';
      aJson.cliente_nome = a.pet?.tutor?.nome || '—';
      aJson.servico_nome = a.servico?.nome || '—';
      return aJson;
    });

    // Lançamentos recentes de caixa
    const recentesCaixa = await Caixa.findAll({
      attributes: ['id', 'tipo', 'valor', 'descricao', 'forma_pagamento', 'categoria', 'criado_em'],
      order: [['criado_em', 'DESC']],
      limit: 6
    });

    const formatadosRecentes = recentesCaixa.map(cx => {
      const cxJson = cx.toJSON();
      const d = new Date(cx.criado_em);
      cxJson.hora = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
      return cxJson;
    });

    res.json({
      totalClientes,
      totalPets,
      agendamentosHoje,
      faturamentoMes,
      faturamentoHoje,
      produtosBaixoEstoque,
      proximosAgendamentos: formatadosProximos,
      recentesCaixa: formatadosRecentes,
      metaFaturamento: 12000.00,
      metaOcupacao: 10
    });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao obter dados do dashboard', detalhes: err.message });
  }
}

export async function faturamento(req, res) {
  const { data_inicio, data_fim, agrupamento = 'dia' } = req.query;
  if (!data_inicio || !data_fim) {
    return res.status(400).json({ error: 'data_inicio e data_fim são obrigatórios' });
  }

  const isPg = sequelize.getDialect() === 'postgres';
  let dateExpr = isPg ? `TO_CHAR(criado_em, 'YYYY-MM-DD')` : `strftime('%Y-%m-%d', criado_em)`;
  if (agrupamento === 'mes') {
    dateExpr = isPg ? `TO_CHAR(criado_em, 'YYYY-MM')` : `strftime('%Y-%m', criado_em)`;
  }

  try {
    const query = `
      SELECT ${dateExpr} as periodo, SUM(valor) as total, COUNT(*) as quantidade
      FROM caixa
      WHERE ${isPg ? 'CAST(criado_em AS DATE)' : 'date(criado_em)'} BETWEEN :data_inicio AND :data_fim AND tipo = 'entrada'
      GROUP BY periodo
      ORDER BY periodo ASC
    `;

    const resultado = await sequelize.query(query, {
      replacements: { data_inicio, data_fim },
      type: sequelize.QueryTypes.SELECT
    });

    res.json(resultado);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao gerar relatório de faturamento', detalhes: err.message });
  }
}

export async function servicosMaisRealizados(req, res) {
  const { data_inicio, data_fim } = req.query;
  const isPg = sequelize.getDialect() === 'postgres';
  try {
    let query = `
      SELECT s.nome, COUNT(a.id) as quantidade, SUM(a.preco_praticado) as receita
      FROM agendamentos a
      JOIN servicos s ON s.id = a.servico_id
      WHERE a.status = 'concluido'
    `;
    const replacements = {};
    if (data_inicio) {
      query += isPg ? ' AND CAST(a.data_agendada AS DATE) >= :data_inicio' : ' AND date(a.data_agendada) >= :data_inicio';
      replacements.data_inicio = data_inicio;
    }
    if (data_fim) {
      query += isPg ? ' AND CAST(a.data_agendada AS DATE) <= :data_fim' : ' AND date(a.data_agendada) <= :data_fim';
      replacements.data_fim = data_fim;
    }
    query += ' GROUP BY s.id, s.nome ORDER BY quantidade DESC LIMIT 10';

    const resultado = await sequelize.query(query, {
      replacements,
      type: sequelize.QueryTypes.SELECT
    });

    res.json(resultado);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao gerar relatório de serviços', detalhes: err.message });
  }
}

export async function clientesTop(req, res) {
  try {
    const query = `
      SELECT c.nome, c.telefone, COUNT(cx.id) as total_visitas, COALESCE(SUM(cx.valor), 0) as total_gasto
      FROM clientes c
      LEFT JOIN caixa cx ON cx.cliente_id = c.id AND cx.tipo = 'entrada'
      WHERE c.ativo = true OR c.ativo = 1
      GROUP BY c.id, c.nome, c.telefone
      ORDER BY total_gasto DESC
      LIMIT 10
    `;

    const resultado = await sequelize.query(query, {
      type: sequelize.QueryTypes.SELECT
    });

    res.json(resultado);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao gerar relatório de clientes top', detalhes: err.message });
  }
}

export async function produtosMaisVendidos(req, res) {
  const { data_inicio, data_fim } = req.query;
  const isPg = sequelize.getDialect() === 'postgres';
  try {
    let query = `
      SELECT ic.nome, SUM(ic.quantidade) as quantidade_vendida, SUM(ic.subtotal) as receita
      FROM itens_caixa ic
      JOIN caixa cx ON cx.id = ic.caixa_id
      WHERE ic.tipo = 'produto' AND cx.tipo = 'entrada'
    `;
    const replacements = {};
    if (data_inicio) {
      query += isPg ? ' AND CAST(cx.criado_em AS DATE) >= :data_inicio' : ' AND date(cx.criado_em) >= :data_inicio';
      replacements.data_inicio = data_inicio;
    }
    if (data_fim) {
      query += isPg ? ' AND CAST(cx.criado_em AS DATE) <= :data_fim' : ' AND date(cx.criado_em) <= :data_fim';
      replacements.data_fim = data_fim;
    }
    query += ' GROUP BY ic.item_id, ic.nome ORDER BY quantidade_vendida DESC LIMIT 10';

    const resultado = await sequelize.query(query, {
      replacements,
      type: sequelize.QueryTypes.SELECT
    });

    res.json(resultado);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao gerar relatório de produtos vendidos', detalhes: err.message });
  }
}

export async function taxaRetencaoClientes(req, res) {
  try {
    const totalClientes = await Cliente.count({ where: { ativo: true } });
    const queryRecorrentes = `
      SELECT p.cliente_id, COUNT(a.id) as total_atendimentos
      FROM agendamentos a
      JOIN pets p ON p.id = a.pet_id
      WHERE a.status = 'concluido'
      GROUP BY p.cliente_id
      HAVING COUNT(a.id) > 1
    `;
    const resRecorrentes = await sequelize.query(queryRecorrentes, {
      type: sequelize.QueryTypes.SELECT
    });

    const numRecorrentes = resRecorrentes.length;
    const taxa = totalClientes > 0 ? ((numRecorrentes / totalClientes) * 100).toFixed(1) : 0;

    res.json({
      totalClientes,
      clientesRecorrentes: numRecorrentes,
      taxaRetencao: parseFloat(taxa),
      mensagem: `${taxa}% dos clientes cadastrados já realizaram 2 ou mais atendimentos no Pet Shop.`
    });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao calcular taxa de retenção de clientes', detalhes: err.message });
  }
}
