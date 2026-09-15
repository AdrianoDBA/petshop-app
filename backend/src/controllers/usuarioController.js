import bcrypt from 'bcrypt';
import { Usuario } from '../models/index.js';
import { Op } from 'sequelize';

export async function listar(req, res) {
  try {
    const usuarios = await Usuario.findAll({
      attributes: ['id', 'nome', 'usuario', 'email', 'perfil', 'ativo', 'ultimo_acesso', 'criado_em'],
      order: [['nome', 'ASC']]
    });
    res.json(usuarios);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao listar usuários', detalhes: err.message });
  }
}

export async function criar(req, res) {
  const { nome, usuario, senha, perfil, email } = req.body;
  if (!nome || !usuario || !senha || !perfil) {
    return res.status(400).json({ error: 'Nome, usuário, senha e perfil são obrigatórios' });
  }
  try {
    const existe = await Usuario.findOne({ where: { usuario } });
    if (existe) {
      return res.status(400).json({ error: 'Nome de usuário (login) já está em uso' });
    }

    const senhaHash = await bcrypt.hash(senha, 10);
    const novo = await Usuario.create({
      nome,
      usuario,
      senha_hash: senhaHash,
      perfil,
      email: email || null,
      ativo: true
    });
    res.status(201).json(novo);
  } catch (err) {
    res.status(400).json({ error: 'Erro ao criar usuário', detalhes: err.message });
  }
}

export async function atualizar(req, res) {
  const { nome, usuario, perfil, email, ativo, senha } = req.body;
  const { id } = req.params;

  try {
    const user = await Usuario.findByPk(id);
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });

    // Se o login mudou, verifica se o novo já existe
    if (usuario && usuario !== user.usuario) {
      const existe = await Usuario.findOne({
        where: {
          usuario,
          id: { [Op.ne]: id }
        }
      });
      if (existe) {
        return res.status(400).json({ error: 'Este nome de usuário (login) já pertence a outra pessoa' });
      }
      user.usuario = usuario;
    }

    if (nome !== undefined) user.nome = nome;
    if (perfil !== undefined) user.perfil = perfil;
    if (email !== undefined) user.email = email;
    if (ativo !== undefined) user.ativo = Boolean(ativo);

    if (senha && senha.trim() !== '') {
      user.senha_hash = await bcrypt.hash(senha, 10);
    }

    await user.save();
    res.json({ message: 'Usuário e permissões atualizados com sucesso!', usuario: user });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar usuário', detalhes: err.message });
  }
}

export async function excluir(req, res) {
  const { id } = req.params;
  try {
    if (parseInt(id) === req.usuario.id) {
      return res.status(400).json({ error: 'Você não pode excluir sua própria conta de administrador' });
    }
    const user = await Usuario.findByPk(id);
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });

    user.ativo = false;
    await user.save();
    res.json({ message: 'Usuário desativado com sucesso!' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao desativar usuário', detalhes: err.message });
  }
}
