import os from 'os';
import crypto from 'crypto';
import { Configuracao } from '../models/index.js';

let cachedMachineId = null;

/**
 * Coleta informações de hardware da máquina local
 */
function obterHardwareRaw() {
  const cpus = os.cpus() || [];
  const cpuModel = cpus[0]?.model || 'GenericCPU';
  const hostname = os.hostname() || 'localhost';
  const platform = os.platform() || 'generic';
  const arch = os.arch() || 'x64';

  // Coleta os MAC addresses das placas de rede
  const interfaces = os.networkInterfaces();
  const macs = [];
  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name]) {
      if (!net.internal && net.mac && net.mac !== '00:00:00:00:00:00') {
        macs.push(net.mac);
      }
    }
  }

  return `${hostname}-${platform}-${arch}-${cpuModel}-${macs.sort().join('|')}`;
}

/**
 * Gera ou recupera o identificador único da instalação desta máquina
 * @returns {Promise<string>} Exemplo: "REQ-PET-7B92-A41C-98E0"
 */
export async function obterMachineId() {
  if (cachedMachineId) {
    return cachedMachineId;
  }

  try {
    // 1. Tenta recuperar o ID fixo já gravado no banco de dados da loja
    const conf = await Configuracao.findOne({ where: { chave: 'machine_installation_id' } });
    if (conf && conf.valor) {
      cachedMachineId = conf.valor;
      return cachedMachineId;
    }

    // 2. Se não existir, gera a partir das características de hardware + salt local
    const raw = obterHardwareRaw();
    const hash = crypto.createHash('sha256').update(raw).digest('hex').toUpperCase();
    
    // Formata em blocos: REQ-PET-XXXX-XXXX-XXXX
    const b1 = hash.substring(0, 4);
    const b2 = hash.substring(4, 8);
    const b3 = hash.substring(8, 12);
    const machineCode = `REQ-PET-${b1}-${b2}-${b3}`;

    // Grava no banco para persistência total
    await Configuracao.findOrCreate({
      where: { chave: 'machine_installation_id' },
      defaults: {
        valor: machineCode,
        descricao: 'Identificador único de hardware desta instalação para controle de licença'
      }
    });

    cachedMachineId = machineCode;
    return machineCode;
  } catch (err) {
    // Fallback seguro em caso de indisponibilidade momentânea do banco
    const raw = obterHardwareRaw();
    const hash = crypto.createHash('sha256').update(raw).digest('hex').toUpperCase();
    return `REQ-PET-${hash.substring(0, 4)}-${hash.substring(4, 8)}-${hash.substring(8, 12)}`;
  }
}
