/**
 * Utilitários de validação de regras de negócio e segurança
 */

/**
 * Validação rigorosa do algoritmo oficial de CPF brasileiro (Módulo 11)
 * @param {string} cpf 
 * @returns {boolean}
 */
export function validarCPF(cpf) {
  if (!cpf || typeof cpf !== 'string') return false;

  const limpo = cpf.replace(/\D/g, '');

  if (limpo.length !== 11) return false;

  // Rejeita sequências de dígitos repetidos conhecidas (ex: 000.000.000-00, 111.111.111-11)
  if (/^(\d)\1{10}$/.test(limpo)) return false;

  // Cálculo do 1º dígito verificador
  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(limpo.charAt(i), 10) * (10 - i);
  }
  let resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(limpo.charAt(9), 10)) return false;

  // Cálculo do 2º dígito verificador
  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(dezDigitosChar => dezDigitosChar, 10);
  }
  let soma2 = 0;
  for (let i = 0; i < 10; i++) {
    soma2 += parseInt(limpo.charAt(i), 10) * (11 - i);
  }
  resto = (soma2 * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(limpo.charAt(10), 10)) return false;

  return true;
}

/**
 * Gera um CPF matematicamente válido para uso em testes automatizados
 * @returns {string}
 */
export function gerarCPFValido() {
  const noveDigitos = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10)).join('');
  
  let soma1 = 0;
  for (let i = 0; i < 9; i++) {
    soma1 += parseInt(noveDigitos.charAt(i), 10) * (10 - i);
  }
  let d1 = (soma1 * 10) % 11;
  if (d1 === 10 || d1 === 11) d1 = 0;

  const dezDigitos = noveDigitos + d1;
  let soma2 = 0;
  for (let i = 0; i < 10; i++) {
    soma2 += parseInt(dezDigitos.charAt(i), 10) * (11 - i);
  }
  let d2 = (soma2 * 10) % 11;
  if (d2 === 10 || d2 === 11) d2 = 0;

  return dezDigitos + d2;
}

/**
 * Validação de formato de telefone brasileiro (10 ou 11 dígitos com DDD)
 * @param {string} telefone 
 * @returns {boolean}
 */
export function validarTelefone(telefone) {
  if (!telefone || typeof telefone !== 'string') return false;
  const limpo = telefone.replace(/\D/g, '');
  return limpo.length === 10 || limpo.length === 11;
}

/**
 * Converte string de horário 'HH:MM' para número total de minutos desde a meia-noite
 * @param {string} horaStr 
 * @returns {number}
 */
export function converterHoraParaMinutos(horaStr) {
  if (!horaStr || typeof horaStr !== 'string') return 0;
  const [h, m] = horaStr.split(':').map(n => parseInt(n, 10) || 0);
  return h * 60 + m;
}

/**
 * Verifica se dois intervalos de atendimento se sobrepõem
 * @param {string} horaA 'HH:MM'
 * @param {number} duracaoA minutos
 * @param {string} horaB 'HH:MM'
 * @param {number} duracaoB minutos
 * @returns {boolean} true se houver colisão de horário
 */
export function haSobreposicaoHorarios(horaA, duracaoA = 30, horaB, duracaoB = 30) {
  const inicioA = converterHoraParaMinutos(horaA);
  const fimA = inicioA + (parseInt(duracaoA, 10) || 30);

  const inicioB = converterHoraParaMinutos(horaB);
  const fimB = inicioB + (parseInt(duracaoB, 10) || 30);

  return inicioA < fimB && inicioB < fimA;
}

/**
 * Valida se um agendamento é para uma data ou horário futuro que impede início antecipado
 * @param {string} dataAgendada 'YYYY-MM-DD'
 * @param {string} horaAgendada 'HH:MM'
 * @returns {{ ehFuturo: boolean, motivo?: string }}
 */
export function verificarDataHoraFutura(dataAgendada, horaAgendada) {
  if (!dataAgendada) return { ehFuturo: false };

  const agora = new Date();
  // Formata a data local atual em YYYY-MM-DD
  const ano = agora.getFullYear();
  const mes = String(agora.getMonth() + 1).padStart(2, '0');
  const dia = String(agora.getDate()).padStart(2, '0');
  const hojeStr = `${ano}-${mes}-${dia}`;

  if (dataAgendada > hojeStr) {
    const dataFormatadaPt = dataAgendada.split('-').reverse().join('/');
    return {
      ehFuturo: true,
      motivo: `O agendamento está marcado para ${dataFormatadaPt}, não podendo ser iniciado ou concluído antes desta data.`
    };
  }

  if (dataAgendada === hojeStr && horaAgendada) {
    const agoraMinutos = agora.getHours() * 60 + agora.getMinutes();
    const [h, m] = horaAgendada.split(':').map(n => parseInt(n, 10) || 0);
    const agendadoMinutos = h * 60 + m;

    // Permite tolerância de até 30 minutos de antecedência no mesmo dia
    if (agendadoMinutos - agoraMinutos > 30) {
      return {
        ehFuturo: true,
        motivo: `O agendamento está marcado para hoje às ${horaAgendada}. Só é permitido iniciar com até 30 minutos de antecedência.`
      };
    }
  }

  return { ehFuturo: false };
}
