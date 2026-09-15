import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const archiver = require('archiver');
import cron from 'node-cron';
import sequelize from '../config/database.js';
import { Configuracao } from '../models/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const defaultBackupDir = path.resolve(__dirname, '../../backups');

if (!fs.existsSync(defaultBackupDir)) {
  fs.mkdirSync(defaultBackupDir, { recursive: true });
}

let cronTask = null;

/**
 * Obtém o diretório configurado para salvar os backups
 */
export async function obterDiretorioBackup() {
  const conf = await Configuracao.findOne({ where: { chave: 'backup_diretorio' } });
  if (conf && conf.valor && fs.existsSync(conf.valor)) {
    return conf.valor;
  }
  return defaultBackupDir;
}

/**
 * Cria um snapshot atômico e gera um arquivo .zip compactado
 */
export async function criarBackup() {
  const targetDir = await obterDiretorioBackup();
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const agora = new Date();
  const timestamp = agora.toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const zipFileName = `backup_petshop_${timestamp}.zip`;
  const zipFilePath = path.join(targetDir, zipFileName);

  const dbPath = path.resolve(__dirname, '../../petshop.db');
  const tempSnapshot = path.join(targetDir, `temp_${Date.now()}.db`);

  // 1. Snapshot seguro via SQLite VACUUM INTO ou cópia direta
  if (sequelize.getDialect() === 'sqlite') {
    try {
      await sequelize.query(`VACUUM INTO '${tempSnapshot}'`);
    } catch (e) {
      // Fallback para cópia direta caso VACUUM INTO não seja suportado pela versão
      if (fs.existsSync(dbPath)) {
        fs.copyFileSync(dbPath, tempSnapshot);
      }
    }
  }

  // 2. Compactação em arquivo .zip
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(zipFilePath);
    const archive = typeof archiver === 'function' 
      ? archiver('zip', { zlib: { level: 9 } })
      : new archiver.ZipArchive({ zlib: { level: 9 } });

    output.on('close', async () => {
      // Remove o snapshot temporário descompactado
      if (fs.existsSync(tempSnapshot)) {
        try { fs.unlinkSync(tempSnapshot); } catch (_) {}
      }

      const stats = fs.statSync(zipFilePath);
      const dataIso = agora.toISOString();

      // Registra data do último backup nas configurações
      await Configuracao.upsert({
        chave: 'ultimo_backup_data',
        valor: dataIso,
        descricao: 'Data e hora da realização do último backup automático'
      });

      resolve({
        sucesso: true,
        arquivo: zipFileName,
        caminho: zipFilePath,
        tamanho_bytes: stats.size,
        tamanho_formatado: `${(stats.size / 1024).toFixed(1)} KB`,
        data: dataIso
      });
    });

    archive.on('error', (err) => {
      if (fs.existsSync(tempSnapshot)) {
        try { fs.unlinkSync(tempSnapshot); } catch (_) {}
      }
      reject(err);
    });

    archive.pipe(output);

    // Adiciona o banco de dados
    if (fs.existsSync(tempSnapshot)) {
      archive.file(tempSnapshot, { name: 'petshop.db' });
    } else if (fs.existsSync(dbPath)) {
      archive.file(dbPath, { name: 'petshop.db' });
    }

    // Adiciona arquivo descritivo com metadados do backup
    const meta = {
      app: 'PetShop Pro Enterprise',
      versao: '2.0.0',
      criado_em: agora.toISOString(),
      tipo_banco: sequelize.getDialect()
    };
    archive.append(JSON.stringify(meta, null, 2), { name: 'backup_info.json' });

    archive.finalize();
  });
}

/**
 * Lista todos os backups existentes no diretório configurado
 */
export async function listarBackups() {
  const dir = await obterDiretorioBackup();
  if (!fs.existsSync(dir)) return [];

  const arquivos = fs.readdirSync(dir);
  const backups = [];

  for (const arq of arquivos) {
    if (arq.endsWith('.zip') && arq.startsWith('backup_petshop_')) {
      const fullPath = path.join(dir, arq);
      const stat = fs.statSync(fullPath);
      backups.push({
        arquivo: arq,
        tamanho_bytes: stat.size,
        tamanho_formatado: `${(stat.size / 1024).toFixed(1)} KB`,
        criado_em: stat.mtime.toISOString(),
        caminho_completo: fullPath
      });
    }
  }

  // Ordena do mais recente para o mais antigo
  return backups.sort((a, b) => new Date(b.criado_em) - new Date(a.criado_em));
}

/**
 * Inicia o agendador de backups automáticos periódicos (Hora em hora / Diário)
 */
export async function iniciarAgendadorBackup() {
  if (cronTask) {
    cronTask.stop();
  }

  const confFreq = await Configuracao.findOne({ where: { chave: 'backup_frequencia' } });
  const freq = confFreq?.valor || '1h'; // '1h' (padrão), '6h', '24h', 'manual'

  if (freq === 'manual') {
    console.log('📦 Backups automáticos configurados como modo manual.');
    return;
  }

  let cronExpr = '0 * * * *'; // A cada 1 hora no minuto zero
  if (freq === '6h') cronExpr = '0 */6 * * *';
  if (freq === '24h') cronExpr = '0 23 * * *'; // Todo dia às 23:00

  cronTask = cron.schedule(cronExpr, async () => {
    console.log('⏰ Executando rotina programada de backup do PetShop Pro...');
    try {
      const res = await criarBackup();
      console.log(`✅ Backup automático concluído: ${res.arquivo} (${res.tamanho_formatado})`);
    } catch (err) {
      console.error('❌ Falha na rotina de backup automático:', err.message);
    }
  });

  console.log(`📦 Agendador de backup ativo com frequência: ${freq} (${cronExpr})`);
}
