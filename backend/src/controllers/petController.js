import { Pet, Cliente, Agendamento, Servico } from '../models/index.js';

export async function listar(req, res) {
  const { cliente_id } = req.query;
  const where = { ativo: true };
  if (cliente_id) {
    where.cliente_id = cliente_id;
  }
  try {
    const pets = await Pet.findAll({
      where,
      include: [
        {
          model: Cliente,
          as: 'tutor',
          attributes: ['nome', 'telefone']
        }
      ],
      order: [['nome', 'ASC']]
    });
    const formatados = pets.map(p => {
      const pJson = p.toJSON();
      pJson.cliente_nome = p.tutor?.nome || '—';
      pJson.cliente_telefone = p.tutor?.telefone || '—';
      return pJson;
    });
    res.json(formatados);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao listar pets' });
  }
}

export async function detalhar(req, res) {
  try {
    const pet = await Pet.findOne({
      where: { id: req.params.id },
      include: [
        {
          model: Cliente,
          as: 'tutor',
          attributes: ['nome', 'telefone']
        }
      ]
    });
    if (!pet) return res.status(404).json({ error: 'Pet não encontrado' });
    
    const agendamentos = await Agendamento.findAll({
      where: { pet_id: req.params.id },
      include: [
        {
          model: Servico,
          as: 'servico',
          attributes: ['nome']
        }
      ],
      order: [['data_agendada', 'DESC'], ['hora_agendada', 'DESC']],
      limit: 20
    });

    const petJson = pet.toJSON();
    petJson.cliente_nome = pet.tutor?.nome || '—';
    petJson.cliente_telefone = pet.tutor?.telefone || '—';
    petJson.historico = agendamentos.map(a => {
      const aJson = a.toJSON();
      aJson.servico_nome = a.servico?.nome || '—';
      return aJson;
    });

    res.json(petJson);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao detalhar pet' });
  }
}

export async function criar(req, res) {
  const {
    cliente_id, nome, especie, raca, sexo,
    data_nascimento, peso_kg, cor, castrado, observacoes,
    alergias, vacinas_em_dia, vacinas_detalhes
  } = req.body;

  if (!cliente_id || !nome || !especie) {
    return res.status(400).json({ error: 'Tutor (cliente_id), nome e espécie são obrigatórios' });
  }

  // Validação de tutor existente e ativo
  const tutor = await Cliente.findOne({ where: { id: cliente_id, ativo: true } });
  if (!tutor) {
    return res.status(404).json({ error: 'Tutor/Cliente não encontrado ou inativo' });
  }

  const peso = peso_kg !== undefined ? parseFloat(peso_kg) : (req.body.peso !== undefined ? parseFloat(req.body.peso) : null);
  if (peso !== null && (isNaN(peso) || peso <= 0)) {
    return res.status(400).json({ error: 'Peso do pet deve ser um valor positivo em kg' });
  }

  if (data_nascimento) {
    const dataNasc = new Date(data_nascimento);
    if (dataNasc > new Date()) {
      return res.status(400).json({ error: 'Data de nascimento não pode ser no futuro' });
    }
  }

  try {
    const novo = await Pet.create({
      cliente_id,
      nome,
      especie: especie.toLowerCase(),
      raca,
      sexo,
      data_nascimento: data_nascimento || null,
      peso_kg: peso,
      cor,
      castrado: castrado === true || castrado === 1,
      observacoes,
      alergias: alergias || null,
      vacinas_em_dia: vacinas_em_dia !== undefined ? (vacinas_em_dia === true || vacinas_em_dia === 'sim' || vacinas_em_dia === 1) : true,
      vacinas_detalhes: typeof vacinas_detalhes === 'object' ? JSON.stringify(vacinas_detalhes) : vacinas_detalhes,
      status_presenca: 'ausente',
      ativo: true
    });
    res.status(201).json(novo);
  } catch (err) {
    res.status(400).json({ error: 'Erro ao cadastrar pet' });
  }
}

export async function atualizar(req, res) {
  const {
    nome, especie, raca, sexo,
    data_nascimento, peso_kg, cor, castrado, observacoes,
    alergias, vacinas_em_dia, vacinas_detalhes
  } = req.body;

  const peso = peso_kg !== undefined ? parseFloat(peso_kg) : (req.body.peso !== undefined ? parseFloat(req.body.peso) : undefined);
  if (peso !== undefined && peso !== null && (isNaN(peso) || peso <= 0)) {
    return res.status(400).json({ error: 'Peso do pet deve ser um valor positivo em kg' });
  }

  if (data_nascimento) {
    const dataNasc = new Date(data_nascimento);
    if (dataNasc > new Date()) {
      return res.status(400).json({ error: 'Data de nascimento não pode ser no futuro' });
    }
  }

  try {
    const pet = await Pet.findByPk(req.params.id);
    if (!pet) return res.status(404).json({ error: 'Pet não encontrado' });

    await pet.update({
      nome: nome !== undefined ? nome : pet.nome,
      especie: especie ? especie.toLowerCase() : pet.especie,
      raca: raca !== undefined ? raca : pet.raca,
      sexo: sexo !== undefined ? sexo : pet.sexo,
      data_nascimento: data_nascimento !== undefined ? data_nascimento : pet.data_nascimento,
      peso_kg: peso !== undefined ? peso : pet.peso_kg,
      cor: cor !== undefined ? cor : pet.cor,
      castrado: castrado !== undefined ? (castrado === true || castrado === 1) : pet.castrado,
      observacoes: observacoes !== undefined ? observacoes : pet.observacoes,
      alergias: alergias !== undefined ? alergias : pet.alergias,
      vacinas_em_dia: vacinas_em_dia !== undefined ? (vacinas_em_dia === true || vacinas_em_dia === 'sim' || vacinas_em_dia === 1) : pet.vacinas_em_dia,
      vacinas_detalhes: vacinas_detalhes !== undefined ? (typeof vacinas_detalhes === 'object' ? JSON.stringify(vacinas_detalhes) : vacinas_detalhes) : pet.vacinas_detalhes
    });
    res.json({ message: 'Pet atualizado com sucesso', pet });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar pet' });
  }
}

export async function excluir(req, res) {
  try {
    const pet = await Pet.findByPk(req.params.id);
    if (!pet) return res.status(404).json({ error: 'Pet não encontrado' });

    pet.ativo = false;
    await pet.save();
    res.json({ message: 'Pet desativado com sucesso' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao desativar pet' });
  }
}

export async function checkin(req, res) {
  try {
    const pet = await Pet.findByPk(req.params.id);
    if (!pet) return res.status(404).json({ error: 'Pet não encontrado' });

    pet.status_presenca = 'presente';
    pet.data_checkin = new Date();
    await pet.save();
    res.json({ message: 'Check-in realizado com sucesso', status_presenca: 'presente' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao realizar check-in' });
  }
}

export async function checkout(req, res) {
  try {
    const pet = await Pet.findByPk(req.params.id);
    if (!pet) return res.status(404).json({ error: 'Pet não encontrado' });

    pet.status_presenca = 'ausente';
    pet.data_checkout = new Date();
    await pet.save();
    res.json({ message: 'Check-out realizado com sucesso', status_presenca: 'ausente' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao realizar check-out' });
  }
}
