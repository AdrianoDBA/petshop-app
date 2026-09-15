import { Agendamento, Pet, Cliente, Servico, Usuario } from '../models/index.js';
import { Op } from 'sequelize';
import { haSobreposicaoHorarios, verificarDataHoraFutura } from '../utils/validators.js';

export async function listar(req, res) {
  const { data, status, pet_id, limit = 100, offset = 0 } = req.query;
  const where = {};
  if (data) where.data_agendada = data;
  if (status) where.status = status;
  if (pet_id) where.pet_id = pet_id;

  try {
    const agendamentos = await Agendamento.findAll({
      where,
      include: [
        {
          model: Pet,
          as: 'pet',
          include: [{ model: Cliente, as: 'tutor', attributes: ['nome', 'telefone'] }]
        },
        {
          model: Servico,
          as: 'servico',
          attributes: ['nome', 'preco_base', 'duracao_minutos']
        },
        {
          model: Usuario,
          as: 'profissional',
          attributes: ['nome']
        }
      ],
      order: [['data_agendada', 'DESC'], ['hora_agendada', 'DESC']],
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10)
    });

    const formatados = agendamentos.map(a => {
      const aJson = a.toJSON();
      aJson.pet_nome = a.pet?.nome || '—';
      aJson.especie = a.pet?.especie || '—';
      aJson.cliente_nome = a.pet?.tutor?.nome || '—';
      aJson.cliente_telefone = a.pet?.tutor?.telefone || '—';
      aJson.servico_nome = a.servico?.nome || '—';
      aJson.usuario_nome = a.profissional?.nome || '—';
      aJson.valor = a.preco_praticado;
      aJson.duracao_minutos = a.servico?.duracao_minutos || 30;
      return aJson;
    });

    res.json(formatados);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao listar agendamentos' });
  }
}

export async function criar(req, res) {
  const { pet_id, servico_id, data_agendada, hora_agendada, observacoes, valor, usuario_id } = req.body;
  const prof_id = usuario_id || req.usuario.id;

  if (!pet_id || !servico_id || !data_agendada || !hora_agendada) {
    return res.status(400).json({ error: 'Campos obrigatórios faltando (pet, serviço, data e hora)' });
  }

  try {
    const servico = await Servico.findByPk(servico_id);
    if (!servico) {
      return res.status(404).json({ error: 'Serviço não encontrado' });
    }

    const duracaoNovo = servico.duracao_minutos || 30;

    // Busca agendamentos do profissional na data para checagem de sobreposição
    const agendamentosExistentes = await Agendamento.findAll({
      where: {
        usuario_id: prof_id,
        data_agendada,
        status: { [Op.in]: ['agendado', 'confirmado', 'em_andamento'] }
      },
      include: [{ model: Servico, as: 'servico', attributes: ['duracao_minutos'] }]
    });

    for (const agExistente of agendamentosExistentes) {
      const duracaoExistente = agExistente.servico?.duracao_minutos || 30;
      if (haSobreposicaoHorarios(hora_agendada, duracaoNovo, agExistente.hora_agendada, duracaoExistente)) {
        return res.status(400).json({
          error: `Conflito de agenda: o profissional já possui atendimento marcado às ${agExistente.hora_agendada} (duração: ${duracaoExistente} min).`
        });
      }
    }

    let valorFinal = valor;
    if (valorFinal === undefined || valorFinal === null) {
      valorFinal = servico.preco_promocional || servico.preco_base || 0;
    }

    const novo = await Agendamento.create({
      pet_id,
      servico_id,
      usuario_id: prof_id,
      data_agendada,
      hora_agendada,
      preco_praticado: valorFinal,
      observacoes,
      status: 'agendado'
    });

    res.status(201).json(novo);
  } catch (err) {
    res.status(400).json({ error: 'Erro ao criar agendamento' });
  }
}

export async function atualizarStatus(req, res) {
  const { status } = req.body;
  if (!['agendado', 'confirmado', 'em_andamento', 'concluido', 'cancelado'].includes(status)) {
    return res.status(400).json({ error: 'Status de agendamento inválido' });
  }

  try {
    const ag = await Agendamento.findByPk(req.params.id);
    if (!ag) return res.status(404).json({ error: 'Agendamento não encontrado' });

    // Bloqueia início ou conclusão antecipada de agendamentos futuros
    if (['em_andamento', 'concluido'].includes(status)) {
      const checkFuturo = verificarDataHoraFutura(ag.data_agendada, ag.hora_agendada);
      if (checkFuturo.ehFuturo) {
        return res.status(400).json({ error: checkFuturo.motivo });
      }
    }

    ag.status = status;
    if (status === 'em_andamento') {
      ag.hora_inicio = new Date();
    } else if (status === 'concluido') {
      ag.hora_fim = new Date();
      ag.data_realizacao = new Date();
    }
    await ag.save();
    res.json({ message: 'Status atualizado com sucesso', agendamento: ag });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar status do agendamento' });
  }
}

export async function excluir(req, res) {
  try {
    const ag = await Agendamento.findByPk(req.params.id);
    if (!ag) return res.status(404).json({ error: 'Agendamento não encontrado' });

    ag.status = 'cancelado';
    await ag.save();
    res.json({ message: 'Agendamento cancelado com sucesso' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao cancelar agendamento' });
  }
}
