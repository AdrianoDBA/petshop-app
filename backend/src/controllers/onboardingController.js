import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Configuracao, Usuario, Servico, sequelize } from '../models/index.js';
import { ativarLicenca } from '../services/licenseService.js';

export async function checarStatus(req, res) {
  try {
    const confInicializado = await Configuracao.findOne({ where: { chave: 'sistema_inicializado' } });
    const confNomeLoja = await Configuracao.findOne({ where: { chave: 'loja_nome' } });
    const confWhatsLoja = await Configuracao.findOne({ where: { chave: 'loja_whatsapp' } });

    res.json({
      inicializado: confInicializado?.valor === 'true',
      loja_nome: confNomeLoja?.valor || 'PetShop Pro',
      loja_whatsapp: confWhatsLoja?.valor || ''
    });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao verificar status do sistema' });
  }
}

export async function concluir(req, res) {
  const {
    loja_nome,
    loja_razao_social,
    loja_documento,
    loja_telefone,
    loja_whatsapp,
    loja_email,
    loja_endereco,
    loja_cidade,
    loja_estado,
    loja_cep,
    admin_nome,
    admin_usuario,
    admin_senha,
    admin_email,
    carregar_servicos_padrao = true,
    licenca_chave
  } = req.body;

  if (!loja_nome || !loja_whatsapp) {
    return res.status(400).json({ error: 'Nome do Pet Shop e Telefone/WhatsApp são obrigatórios.' });
  }

  if (!admin_nome || !admin_usuario || !admin_senha) {
    return res.status(400).json({ error: 'Dados do Administrador (nome, usuário e senha) são obrigatórios.' });
  }

  const transaction = await sequelize.transaction();
  try {
    // 1. Grava Configurações da Loja
    const configs = [
      { chave: 'loja_nome', valor: loja_nome, descricao: 'Nome Fantasia do Pet Shop' },
      { chave: 'loja_razao_social', valor: loja_razao_social || loja_nome, descricao: 'Razão Social' },
      { chave: 'loja_documento', valor: loja_documento || '', descricao: 'CNPJ ou CPF' },
      { chave: 'loja_telefone', valor: loja_telefone || loja_whatsapp, descricao: 'Telefone Fixo' },
      { chave: 'loja_whatsapp', valor: loja_whatsapp, descricao: 'WhatsApp Comercial' },
      { chave: 'loja_email', valor: loja_email || '', descricao: 'E-mail Comercial' },
      { chave: 'loja_endereco', valor: loja_endereco || '', descricao: 'Endereço da Loja' },
      { chave: 'loja_cidade', valor: loja_cidade || '', descricao: 'Cidade' },
      { chave: 'loja_estado', valor: loja_estado || '', descricao: 'Estado / UF' },
      { chave: 'loja_cep', valor: loja_cep || '', descricao: 'CEP' },
      { chave: 'sistema_inicializado', valor: 'true', descricao: 'Sinalizador de primeira execução concluída' },
      { chave: 'trial_inicio', valor: new Date().toISOString().split('T')[0], descricao: 'Data de início do trial' }
    ];

    for (const c of configs) {
      const [registro, created] = await Configuracao.findOrCreate({
        where: { chave: c.chave },
        defaults: c,
        transaction
      });
      if (!created) {
        registro.valor = c.valor;
        await registro.save({ transaction });
      }
    }

    // 2. Cria o Usuário Administrador Principal
    const senhaHash = await bcrypt.hash(admin_senha, 10);
    let admin = await Usuario.findOne({ where: { usuario: admin_usuario }, transaction });
    if (!admin) {
      admin = await Usuario.create({
        nome: admin_nome,
        usuario: admin_usuario,
        senha_hash: senhaHash,
        perfil: 'admin',
        email: admin_email || loja_email || null,
        ativo: true
      }, { transaction });
    } else {
      admin.nome = admin_nome;
      admin.senha_hash = senhaHash;
      admin.perfil = 'admin';
      admin.ativo = true;
      await admin.save({ transaction });
    }

    // 3. Carrega Catálogo Inicial de Serviços se solicitado
    if (carregar_servicos_padrao) {
      const servicosPadrao = [
        { nome: 'Banho Tradicional', preco_base: 50.00, categoria: 'banho', duracao_minutos: 45, comissao_percentual: 20 },
        { nome: 'Tosa Higiênica', preco_base: 40.00, categoria: 'tosa', duracao_minutos: 30, comissao_percentual: 20 },
        { nome: 'Banho + Tosa Completa', preco_base: 120.00, categoria: 'tosa', duracao_minutos: 90, comissao_percentual: 25 },
        { nome: 'Tosa na Tesoura', preco_base: 80.00, categoria: 'tosa', duracao_minutos: 60, comissao_percentual: 25 },
        { nome: 'Consulta Veterinária', preco_base: 150.00, categoria: 'consulta', duracao_minutos: 40, comissao_percentual: 50 },
        { nome: 'Aplicação de Vacina', preco_base: 90.00, categoria: 'vacina', duracao_minutos: 20, comissao_percentual: 30 }
      ];

      for (const sp of servicosPadrao) {
        await Servico.findOrCreate({
          where: { nome: sp.nome },
          defaults: { ...sp, ativo: true },
          transaction
        });
      }
    }

    await transaction.commit();

    // 4. Se o usuário forneceu uma chave de licença no assistente, ativa
    if (licenca_chave && licenca_chave.trim()) {
      try {
        await ativarLicenca(licenca_chave.trim());
      } catch (licErr) {
        console.warn('Aviso: Chave de licença informada no setup falhou, trial de 15 dias ativado.');
      }
    }

    // Gera token JWT de login automático
    const token = jwt.sign(
      { id: admin.id, nome: admin.nome, usuario: admin.usuario, perfil: admin.perfil },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.status(201).json({
      message: 'PetShop Pro configurado com sucesso! Bem-vindo.',
      token,
      usuario: { id: admin.id, nome: admin.nome, usuario: admin.usuario, perfil: admin.perfil }
    });
  } catch (err) {
    await transaction.rollback();
    res.status(500).json({ error: 'Erro ao concluir configuração inicial do sistema' });
  }
}
