import path from 'path';
import fs from 'fs';
import { criarBackup, listarBackups, obterDiretorioBackup, iniciarAgendadorBackup } from '../services/backupService.js';
import { Configuracao } from '../models/index.js';

export async function listar(req, res) {
  try {
    const lista = await listarBackups();
    const confFreq = await Configuracao.findOne({ where: { chave: 'backup_frequencia' } });
    const confDir = await Configuracao.findOne({ where: { chave: 'backup_diretorio' } });
    const confUltimo = await Configuracao.findOne({ where: { chave: 'ultimo_backup_data' } });
    const dirAtual = await obterDiretorioBackup();

    res.json({
      backups: lista,
      configuracao: {
        frequencia: confFreq?.valor || '1h',
        diretorio: confDir?.valor || dirAtual,
        ultimo_backup: confUltimo?.valor || null
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao listar backups' });
  }
}

export async function executar(req, res) {
  try {
    const resultado = await criarBackup();
    res.status(201).json({
      message: 'Backup realizado com sucesso!',
      backup: resultado
    });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao gerar backup', detalhes: err.message });
  }
}

export async function salvarConfiguracao(req, res) {
  const { frequencia, diretorio } = req.body;

  try {
    if (diretorio && diretorio.trim()) {
      const dirNormalizado = path.resolve(diretorio.trim());
      if (!fs.existsSync(dirNormalizado)) {
        fs.mkdirSync(dirNormalizado, { recursive: true });
      }
      await Configuracao.upsert({
        chave: 'backup_diretorio',
        valor: dirNormalizado,
        descricao: 'Caminho da pasta de destino para backups (ex: Google Drive)'
      });
    }

    if (frequencia) {
      await Configuracao.upsert({
        chave: 'backup_frequencia',
        valor: frequencia,
        descricao: 'Frequência do backup automático (1h, 6h, 24h, manual)'
      });
    }

    // Reinicia o agendador com a nova configuração
    await iniciarAgendadorBackup();

    res.json({ message: 'Configurações de backup salvas com sucesso!' });
  } catch (err) {
    res.status(400).json({ error: 'Erro ao salvar configuração de backup', detalhes: err.message });
  }
}

export async function baixar(req, res) {
  const { arquivo } = req.params;
  // Prevenção básica contra path traversal
  const nomeSeguro = path.basename(arquivo);

  try {
    const dir = await obterDiretorioBackup();
    const caminho = path.join(dir, nomeSeguro);

    if (!fs.existsSync(caminho)) {
      return res.status(404).json({ error: 'Arquivo de backup não encontrado' });
    }

    res.download(caminho, nomeSeguro);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao fazer download do backup' });
  }
}
