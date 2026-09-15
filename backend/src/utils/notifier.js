import cron from 'node-cron';
import { Agendamento, Pet, Cliente, Servico, Notificacao } from '../models/index.js';
import axios from 'axios';
import { getLocalDateString } from './date.js';
import { Op } from 'sequelize';
import logger from '../logger.js';

// Envia notificação via WhatsApp (integra com APIs como Twilio, Z-API, Evolution, etc.)
async function enviarWhatsApp(telefone, mensagem) {
  const url = process.env.WHATSAPP_API_URL;
  const token = process.env.WHATSAPP_TOKEN;
  if (!url || !token) {
    logger.info(`📱 [SIMULAÇÃO] WhatsApp para ${telefone}: ${mensagem}`);
    return { simulado: true };
  }
  try {
    const response = await axios.post(url, {
      telefone,
      mensagem
    }, { headers: { Authorization: `Bearer ${token}` } });
    return response.data;
  } catch (err) {
    logger.error('Erro ao enviar WhatsApp:', err.message);
    throw err;
  }
}

export function startNotificationScheduler() {
  // Roda a cada 30 minutos para verificar agendamentos
  cron.schedule('*/30 * * * *', async () => {
    await processarNotificacoes();
  });
  logger.info('⏰ Agendador de notificações iniciado');
}

export async function processarNotificacoes() {
  const agora = new Date();
  const horaLocal = agora.getHours();
  if (horaLocal < 8 || horaLocal > 20) {
    return;
  }

  const em24h = new Date(agora.getTime() + 24 * 60 * 60 * 1000);
  const dataEm24h = getLocalDateString(em24h);

  try {
    // Busca agendamentos que precisam de notificação
    const agendamentos = await Agendamento.findAll({
      where: {
        status: 'agendado',
        data_agendada: dataEm24h
      },
      include: [
        {
          model: Pet,
          as: 'pet',
          include: [{ model: Cliente, as: 'tutor' }]
        },
        {
          model: Servico,
          as: 'servico'
        },
        {
          model: Notificacao,
          as: 'notificacoes',
          required: false,
          where: { tipo: 'lembrete_24h' }
        }
      ]
    });

    // Filtra apenas agendamentos que ainda não possuem lembrete_24h enviado/pendente
    const agendamentosSemNotificacao = agendamentos.filter(a => !a.notificacoes || a.notificacoes.length === 0);

    for (const ag of agendamentosSemNotificacao) {
      if (!ag.pet || !ag.pet.tutor) continue;

      const tutor = ag.pet.tutor;
      const dataBR = new Date(ag.data_agendada + 'T00:00:00').toLocaleDateString('pt-BR');
      const mensagem = `🐾 Olá ${tutor.nome}! Lembrete: ${ag.servico?.nome || 'serviço'} do(a) ${ag.pet.nome} agendado para ${dataBR} às ${ag.hora_agendada}. Te esperamos!`;
      
      try {
        await enviarWhatsApp(tutor.telefone, mensagem);
        
        await Notificacao.create({
          agendamento_id: ag.id,
          tipo: 'lembrete_24h',
          destinatario: tutor.telefone,
          mensagem,
          status: 'enviado',
          enviado_em: new Date()
        });
        
        logger.info(`✅ Notificação enviada para ${tutor.telefone}`);
      } catch (err) {
        await Notificacao.create({
          agendamento_id: ag.id,
          tipo: 'lembrete_24h',
          destinatario: tutor.telefone,
          mensagem,
          status: 'falhou',
          tentativas: 1
        });
      }
    }
  } catch (err) {
    logger.error('Erro ao processar notificações:', err.message);
  }
}
