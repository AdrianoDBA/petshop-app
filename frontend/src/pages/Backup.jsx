import { useEffect, useState } from 'react';
import api from '../services/api';

export default function Backup() {
  const [backups, setBackups] = useState([]);
  const [configuracao, setConfiguracao] = useState({
    frequencia: '1h',
    diretorio: '',
    ultimo_backup: null
  });
  const [carregando, setCarregando] = useState(false);
  const [executandoBackup, setExecutandoBackup] = useState(false);
  const [mensagem, setMensagem] = useState({ tipo: '', texto: '' });

  useEffect(() => {
    carregar();
  }, []);

  function carregar() {
    setCarregando(true);
    api.get('/backup')
      .then(({ data }) => {
        setBackups(data.backups || []);
        if (data.configuracao) setConfiguracao(data.configuracao);
      })
      .catch(() => {})
      .finally(() => setCarregando(false));
  }

  async function dispararBackupManual() {
    setExecutandoBackup(true);
    setMensagem({ tipo: '', texto: '' });

    try {
      const res = await api.post('/backup/executar');
      setMensagem({ tipo: 'success', texto: `Backup concluído com sucesso: ${res.data.backup?.arquivo} (${res.data.backup?.tamanho_formatado})` });
      carregar();
    } catch (err) {
      setMensagem({ tipo: 'danger', texto: err.response?.data?.error || 'Erro ao gerar backup' });
    } finally {
      setExecutandoBackup(false);
    }
  }

  async function salvarConfiguracoes(e) {
    e.preventDefault();
    setCarregando(true);
    setMensagem({ tipo: '', texto: '' });

    try {
      await api.post('/backup/configurar', {
        frequencia: configuracao.frequencia,
        diretorio: configuracao.diretorio
      });
      setMensagem({ tipo: 'success', texto: 'Configurações de backup atualizadas!' });
      carregar();
    } catch (err) {
      setMensagem({ tipo: 'danger', texto: err.response?.data?.error || 'Erro ao salvar configurações' });
    } finally {
      setCarregando(false);
    }
  }

  async function baixarArquivoBackup(arquivo) {
    try {
      const response = await api.get(`/backup/download/${arquivo}`, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/zip' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = arquivo;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Erro ao baixar arquivo de backup');
    }
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1>💾 Backup & Segurança dos Dados</h1>
          <p>Snapshots automáticos, rotinas de hora em hora e sincronização com Google Drive</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={dispararBackupManual}
          disabled={executandoBackup}
        >
          {executandoBackup ? '⏳ Criando Snapshot...' : '💾 Fazer Backup Agora'}
        </button>
      </div>

      {mensagem.texto && (
        <div className={`badge badge-${mensagem.tipo}`} style={{ display: 'block', padding: 14, fontSize: 14, marginBottom: 20, borderRadius: 8 }}>
          {mensagem.tipo === 'success' ? '✅ ' : '⚠️ '} {mensagem.texto}
        </div>
      )}

      {/* KPI CARDS */}
      <div className="dashboard-grid" style={{ marginBottom: 20 }}>
        <div className="stat-card">
          <span className="icon">🛡️</span>
          <div className="label">Último Backup Realizado</div>
          <div className="value" style={{ fontSize: 16 }}>
            {configuracao.ultimo_backup
              ? new Date(configuracao.ultimo_backup).toLocaleString('pt-BR')
              : 'Nenhum backup recente'}
          </div>
        </div>
        <div className="stat-card">
          <span className="icon">⏰</span>
          <div className="label">Frequência Programada</div>
          <div className="value" style={{ fontSize: 16 }}>
            {configuracao.frequencia === '1h' && 'De Hora em Hora'}
            {configuracao.frequencia === '6h' && 'A cada 6 Horas'}
            {configuracao.frequencia === '24h' && 'Diário (às 23:00)'}
            {configuracao.frequencia === 'manual' && 'Apenas Manual'}
          </div>
        </div>
        <div className="stat-card">
          <span className="icon">📦</span>
          <div className="label">Total de Cópias Armazenadas</div>
          <div className="value" style={{ fontSize: 16 }}>
            {backups.length} arquivo(s)
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20, marginBottom: 24 }}>
        
        {/* CONFIGURAÇÃO DO DESTINO E PERIODICIDADE */}
        <div className="card">
          <h2 style={{ marginBottom: 16, fontSize: 18 }}>⚙️ Configuração da Rotina Automática</h2>
          <form onSubmit={salvarConfiguracoes}>
            
            <div className="form-group">
              <label>Frequência de Execução Automática</label>
              <select
                value={configuracao.frequencia}
                onChange={e => setConfiguracao({ ...configuracao, frequencia: e.target.value })}
              >
                <option value="1h">⏰ De Hora em Hora (Recomendado para Pet Shops movimentados)</option>
                <option value="6h">⏳ A cada 6 Horas</option>
                <option value="24h">🌙 Diário no Fechamento da Loja (23:00)</option>
                <option value="manual">✋ Apenas Manual (Quando você clicar no botão)</option>
              </select>
            </div>

            <div className="form-group">
              <label>Pasta de Destino para Sincronização</label>
              <input
                value={configuracao.diretorio}
                onChange={e => setConfiguracao({ ...configuracao, diretorio: e.target.value })}
                placeholder="Ex: C:\Users\SeuNome\Google Drive\Backups_PetShop"
              />
              <small style={{ display: 'block', color: 'var(--text-light)', marginTop: 4 }}>
                💡 <strong>Dica Google Drive / OneDrive:</strong> Aponte para a pasta sincronizada do Google Drive para Computador para que seus backups subam automaticamente para a nuvem!
              </small>
            </div>

            <button type="submit" className="btn btn-secondary" disabled={carregando}>
              Salvar Preferências de Backup
            </button>
          </form>
        </div>

        {/* INSTRUÇÃO DE SEGURANÇA */}
        <div className="card" style={{ background: '#f8fafc' }}>
          <h2 style={{ marginBottom: 12, fontSize: 18 }}>☁️ Como manter backups em Nuvem Grátis</h2>
          <ol style={{ paddingLeft: 20, fontSize: 13, lineHeight: 1.6, color: '#334155' }}>
            <li style={{ marginBottom: 8 }}>
              Instale o aplicativo oficial <strong>Google Drive para Computador</strong> ou <strong>OneDrive</strong>.
            </li>
            <li style={{ marginBottom: 8 }}>
              Crie uma pasta chamada <code>Backups_PetShop</code> dentro do seu Drive.
            </li>
            <li style={{ marginBottom: 8 }}>
              Cole o caminho dessa pasta no campo ao lado e clique em salvar.
            </li>
            <li>
              Pronto! A cada 1 hora o PetShop Pro gerará um snapshot compactado <code>.zip</code> que sincronizará imediatamente na sua nuvem pessoal.
            </li>
          </ol>
        </div>
      </div>

      {/* TABELA DE ARQUIVOS DE BACKUP */}
      <div className="card">
        <h2 style={{ marginBottom: 16, fontSize: 18 }}>📂 Histórico de Cópias de Segurança (.zip)</h2>

        {backups.length === 0 ? (
          <div className="empty-state">
            <div className="emoji">📦</div>
            <p>Nenhum arquivo de backup gerado ainda. Clique no botão acima para criar o primeiro.</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Arquivo</th>
                <th>Tamanho</th>
                <th>Data de Criação</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {backups.map(b => (
                <tr key={b.arquivo}>
                  <td>
                    <strong>📦 {b.arquivo}</strong>
                  </td>
                  <td>{b.tamanho_formatado}</td>
                  <td>{new Date(b.criado_em).toLocaleString('pt-BR')}</td>
                  <td>
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={() => baixarArquivoBackup(b.arquivo)}
                    >
                      📥 Baixar Arquivo .ZIP
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
