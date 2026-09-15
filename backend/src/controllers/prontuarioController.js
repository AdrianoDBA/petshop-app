import { ProntuarioVeterinario, Pet, Usuario, Agendamento, Cliente } from '../models/index.js';

export async function listar(req, res) {
  const { pet_id, tipo } = req.query;
  const where = {};
  if (pet_id) where.pet_id = pet_id;
  if (tipo) where.tipo = tipo;

  try {
    const registros = await ProntuarioVeterinario.findAll({
      where,
      include: [
        {
          model: Pet,
          as: 'pet',
          attributes: ['nome', 'especie', 'raca'],
          include: [{ model: Cliente, as: 'tutor', attributes: ['nome', 'telefone'] }]
        },
        { model: Usuario, as: 'veterinario', attributes: ['nome', 'perfil'] }
      ],
      order: [['criado_em', 'DESC']]
    });

    const formatados = registros.map(r => {
      const rJson = r.toJSON();
      rJson.pet_nome = r.pet?.nome || '—';
      rJson.tutor_nome = r.pet?.tutor?.nome || '—';
      rJson.veterinario_nome = r.veterinario?.nome || 'Dr(a). Veterinário(a)';
      return rJson;
    });

    res.json(formatados);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao listar prontuários veterinários', detalhes: err.message });
  }
}

export async function criar(req, res) {
  const {
    pet_id, agendamento_id, tipo = 'consulta', titulo,
    queixa_principal, diagnostico, prescricao_medicamentos,
    vacinas_aplicadas, data_proxima_dose, peso_atual, temperatura,
    crmv_veterinario, observacoes
  } = req.body;

  if (!pet_id || !titulo) {
    return res.status(400).json({ error: 'pet_id e titulo são obrigatórios' });
  }

  try {
    const pet = await Pet.findByPk(pet_id);
    if (!pet) return res.status(404).json({ error: 'Pet não encontrado' });

    const novo = await ProntuarioVeterinario.create({
      pet_id,
      usuario_id: req.usuario?.id || null,
      agendamento_id: agendamento_id || null,
      tipo,
      titulo,
      queixa_principal,
      diagnostico,
      prescricao_medicamentos,
      vacinas_aplicadas,
      data_proxima_dose,
      peso_atual: peso_atual || pet.peso_kg,
      temperatura,
      crmv_veterinario: crmv_veterinario || 'CRMV-SP 2026-VET',
      observacoes
    });

    // Se houve vacinas aplicadas ou atualização de peso, atualiza o perfil do pet
    if (peso_atual) pet.peso_kg = peso_atual;
    if (tipo === 'vacina' || vacinas_aplicadas) {
      pet.vacinas_em_dia = true;
    }
    await pet.save();

    res.status(201).json(novo);
  } catch (err) {
    res.status(400).json({ error: 'Erro ao criar registro médico/vacina', detalhes: err.message });
  }
}

export async function detalhar(req, res) {
  try {
    const prontuario = await ProntuarioVeterinario.findByPk(req.params.id, {
      include: [
        {
          model: Pet,
          as: 'pet',
          include: [{ model: Cliente, as: 'tutor' }]
        },
        { model: Usuario, as: 'veterinario' }
      ]
    });
    if (!prontuario) return res.status(404).json({ error: 'Registro veterinário não encontrado' });

    res.json(prontuario);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao detalhar prontuário', detalhes: err.message });
  }
}
