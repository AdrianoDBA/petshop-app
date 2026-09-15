import { Cliente, Pet } from '../models/index.js';
import { Op } from 'sequelize';
import { validarCPF, validarTelefone } from '../utils/validators.js';

export async function listar(req, res) {
  const { busca } = req.query;
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
  const offset = (page - 1) * limit;
  const where = { ativo: true };
  if (busca) {
    where[Op.or] = [
      { nome: { [Op.like]: `%${busca}%` } },
      { telefone: { [Op.like]: `%${busca}%` } },
      { cpf: { [Op.like]: `%${busca}%` } }
    ];
  }
  try {
    const { count, rows } = await Cliente.findAndCountAll({
      where,
      order: [['nome', 'ASC']],
      limit,
      offset
    });
    res.json({ data: rows, total: count, page, limit });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao listar clientes' });
  }
}

export async function detalhar(req, res) {
  try {
    const cliente = await Cliente.findByPk(req.params.id);
    if (!cliente) return res.status(404).json({ error: 'Cliente não encontrado' });
    const pets = await Pet.findAll({
      where: { cliente_id: req.params.id, ativo: true }
    });
    res.json({ ...cliente.toJSON(), pets });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao detalhar cliente' });
  }
}

export async function criar(req, res) {
  const { nome, cpf, rg, telefone, telefone_secundario, email, endereco, bairro, cidade, estado, cep, observacoes } = req.body;
  if (!nome || !telefone) {
    return res.status(400).json({ error: 'Nome e telefone são obrigatórios' });
  }

  if (!validarTelefone(telefone)) {
    return res.status(400).json({ error: 'Telefone inválido. Informe DDD + número.' });
  }

  if (cpf && cpf.trim() !== '') {
    if (!validarCPF(cpf)) {
      return res.status(400).json({ error: 'CPF inválido. Verifique os dígitos informados.' });
    }
    const existeCpf = await Cliente.findOne({ where: { cpf: cpf.replace(/\D/g, '') } });
    if (existeCpf) {
      return res.status(400).json({ error: 'Já existe um cliente cadastrado com este CPF.' });
    }
  }

  try {
    const novo = await Cliente.create({
      nome,
      cpf: cpf ? cpf.replace(/\D/g, '') : null,
      rg,
      telefone,
      telefone_secundario,
      email,
      endereco,
      bairro,
      cidade,
      estado,
      cep,
      observacoes,
      ativo: true
    });
    res.status(201).json(novo);
  } catch (err) {
    res.status(400).json({ error: 'Erro ao criar cliente' });
  }
}

export async function atualizar(req, res) {
  const { nome, cpf, rg, telefone, telefone_secundario, email, endereco, bairro, cidade, estado, cep, observacoes } = req.body;
  
  if (telefone && !validarTelefone(telefone)) {
    return res.status(400).json({ error: 'Telefone inválido. Informe DDD + número.' });
  }

  if (cpf && cpf.trim() !== '') {
    if (!validarCPF(cpf)) {
      return res.status(400).json({ error: 'CPF inválido. Verifique os dígitos informados.' });
    }
  }

  try {
    const cliente = await Cliente.findByPk(req.params.id);
    if (!cliente) return res.status(404).json({ error: 'Cliente não encontrado' });

    await cliente.update({
      nome: nome !== undefined ? nome : cliente.nome,
      cpf: cpf !== undefined ? (cpf ? cpf.replace(/\D/g, '') : null) : cliente.cpf,
      rg,
      telefone: telefone !== undefined ? telefone : cliente.telefone,
      telefone_secundario,
      email,
      endereco,
      bairro,
      cidade,
      estado,
      cep,
      observacoes
    });
    res.json({ message: 'Cliente atualizado com sucesso', cliente });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar cliente' });
  }
}

export async function excluir(req, res) {
  try {
    const cliente = await Cliente.findByPk(req.params.id);
    if (!cliente) return res.status(404).json({ error: 'Cliente não encontrado' });

    cliente.ativo = false;
    await cliente.save();
    res.json({ message: 'Cliente desativado com sucesso' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao desativar cliente' });
  }
}
