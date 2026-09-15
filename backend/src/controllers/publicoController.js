import { Servico, Cliente, Pet, Agendamento, Notificacao } from '../models/index.js';
import { Op } from 'sequelize';
import { validarTelefone, haSobreposicaoHorarios } from '../utils/validators.js';

export async function obterInfoPetshop(req, res) {
  try {
    const servicos = await Servico.findAll({
      where: { ativo: true },
      order: [['preco_base', 'ASC']]
    });

    res.json({
      nome: 'PetShop Pro · Patinhas Felizes',
      slug: 'patinhas-felizes',
      endereco: 'Rua das Flores, 123 - Centro, São Paulo - SP',
      telefone: '(11) 98888-8888',
      horario_funcionamento: 'Seg a Sáb: 08:00 às 19:00',
      servicos
    });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao carregar informações públicas' });
  }
}

export async function agendamentoOnline(req, res) {
  const {
    tutor_nome, tutor_telefone, tutor_email,
    pet_nome, pet_especie = 'cachorro', pet_raca,
    servico_id, data_agendada, hora_agendada, observacoes
  } = req.body;

  if (!tutor_nome || !tutor_telefone || !pet_nome || !servico_id || !data_agendada || !hora_agendada) {
    return res.status(400).json({ error: 'Todos os campos obrigatórios devem ser preenchidos' });
  }

  if (!validarTelefone(tutor_telefone)) {
    return res.status(400).json({ error: 'Número de WhatsApp/telefone inválido. Informe DDD + número.' });
  }

  try {
    // 1. Busca serviço e duração
    const servico = await Servico.findByPk(servico_id);
    if (!servico) {
      return res.status(404).json({ error: 'Serviço selecionado não encontrado' });
    }
    const duracaoNovo = servico.duracao_minutos || 30;

    // 2. Valida se já não há sobreposição excessiva de agendamentos no mesmo horário (capacidade máxima de 3 simultâneos)
    const agendamentosNoHorario = await Agendamento.findAll({
      where: {
        data_agendada,
        status: { [Op.in]: ['agendado', 'confirmado', 'em_andamento'] }
      },
      include: [{ model: Servico, as: 'servico', attributes: ['duracao_minutos'] }]
    });

    const conflitos = agendamentosNoHorario.filter(a => {
      const dur = a.servico?.duracao_minutos || 30;
      return haSobreposicaoHorarios(hora_agendada, duracaoNovo, a.hora_agendada, dur);
    });

    if (conflitos.length >= 3) {
      return res.status(400).json({
        error: 'Horário indisponível devido à capacidade máxima da loja no momento. Por favor, escolha outro horário.'
      });
    }

    // 3. Localiza ou cria o Cliente
    let cliente = await Cliente.findOne({ where: { telefone: tutor_telefone } });
    if (!cliente) {
      cliente = await Cliente.create({
        nome: tutor_nome,
        telefone: tutor_telefone,
        email: tutor_email || null,
        endereco: 'Cadastrado via Agendamento Online'
      });
    }

    // 4. Localiza ou cria o Pet
    let pet = await Pet.findOne({
      where: {
        cliente_id: cliente.id,
        nome: pet_nome
      }
    });
    if (!pet) {
      pet = await Pet.create({
        cliente_id: cliente.id,
        nome: pet_nome,
        especie: pet_especie,
        raca: pet_raca || 'SRD',
        status_presenca: 'ausente'
      });
    }

    const preco = servico.preco_promocional || servico.preco_base || 50.00;

    // 5. Cria o Agendamento
    const agendamento = await Agendamento.create({
      pet_id: pet.id,
      servico_id,
      data_agendada,
      hora_agendada,
      observacoes: observacoes ? `[Online] ${observacoes}` : '[Agendado via Link Público]',
      status: 'agendado',
      preco_praticado: preco
    });

    // 6. Cria Notificação interna
    await Notificacao.create({
      agendamento_id: agendamento.id,
      tipo: 'lembrete_24h',
      status: 'pendente',
      data_envio: new Date()
    });

    res.status(201).json({
      message: 'Agendamento realizado com sucesso!',
      protocolo: `AG-${agendamento.id}-${Date.now().toString().slice(-4)}`,
      agendamento
    });
  } catch (err) {
    res.status(400).json({ error: 'Erro ao processar agendamento online' });
  }
}
