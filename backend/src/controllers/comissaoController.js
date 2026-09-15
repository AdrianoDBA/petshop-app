import { Comissao, Usuario, Agendamento, Servico, Caixa } from '../models/index.js';
import { Op } from 'sequelize';

export async function listar(req, res) {
  const { usuario_id, status } = req.query;
  const where = {};

  // Se o usuário logado for tosador ou veterinário, restringe estritamente aos seus próprios dados
  if (['tosador', 'veterinario', 'esteticista'].includes(req.usuario.perfil)) {
    where.usuario_id = req.usuario.id;
  } else if (usuario_id) {
    where.usuario_id = usuario_id;
  }

  if (status) where.status = status;

  try {
    const comissoes = await Comissao.findAll({
      where,
      include: [
        { model: Usuario, as: 'profissional', attributes: ['id', 'nome', 'perfil'] },
        { model: Agendamento, as: 'agendamento' }
      ],
      order: [['criado_em', 'DESC']]
    });

    const formatadas = comissoes.map(c => {
      const cJson = c.toJSON();
      cJson.profissional_nome = c.profissional?.nome || 'Colaborador';
      cJson.profissional_perfil = c.profissional?.perfil || 'tosador';
      return cJson;
    });

    res.json(formatadas);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao listar comissões', detalhes: err.message });
  }
}

export async function pagar(req, res) {
  if (!['admin', 'gerente'].includes(req.usuario.perfil)) {
    return res.status(403).json({ error: 'Apenas administradores e gerentes podem autorizar repasses de comissão' });
  }

  const { id } = req.params;
  try {
    const comissao = await Comissao.findByPk(id);
    if (!comissao) return res.status(404).json({ error: 'Comissão não encontrada' });

    comissao.status = 'pago';
    comissao.data_pagamento = new Date().toISOString().split('T')[0];
    await comissao.save();

    res.json({ message: 'Comissão marcada como paga!', comissao });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao pagar comissão', detalhes: err.message });
  }
}

export async function resumoPorProfissional(req, res) {
  const where = {};
  if (['tosador', 'veterinario', 'esteticista'].includes(req.usuario.perfil)) {
    where.usuario_id = req.usuario.id;
  }

  try {
    const comissoes = await Comissao.findAll({
      where,
      include: [{ model: Usuario, as: 'profissional', attributes: ['id', 'nome', 'perfil'] }]
    });

    const agrupado = {};
    for (const c of comissoes) {
      const uId = c.usuario_id;
      const uNome = c.profissional?.nome || `Usuário #${uId}`;
      if (!agrupado[uId]) {
        agrupado[uId] = {
          usuario_id: uId,
          nome: uNome,
          perfil: c.profissional?.perfil || 'tosador',
          total_servicos: 0,
          total_faturado: 0,
          comissao_pendente: 0,
          comissao_paga: 0
        };
      }

      agrupado[uId].total_servicos += 1;
      agrupado[uId].total_faturado += parseFloat(c.valor_servico) || 0;
      if (c.status === 'pago') {
        agrupado[uId].comissao_paga += parseFloat(c.valor_comissao) || 0;
      } else {
        agrupado[uId].comissao_pendente += parseFloat(c.valor_comissao) || 0;
      }
    }

    res.json(Object.values(agrupado));
  } catch (err) {
    res.status(500).json({ error: 'Erro ao calcular resumo de comissões', detalhes: err.message });
  }
}
