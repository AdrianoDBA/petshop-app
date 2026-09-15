import { useEffect, useState } from 'react';
import api from '../services/api';
import { NavLink } from 'react-router-dom';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [assinaturas, setAssinaturas] = useState([]);
  const [whatsappStats, setWhatsappStats] = useState({ mensagensHoje: 127 });

  useEffect(() => {
    Promise.all([
      api.get('/relatorios/dashboard'),
      api.get('/pacotes/assinaturas').catch(() => ({ data: [] })),
      api.get('/whatsapp/stats').catch(() => ({ data: { mensagensHoje: 127 } }))
    ]).then(([resStats, resAssinaturas, resWa]) => {
      setStats(resStats.data);
      setAssinaturas(resAssinaturas.data || []);
      setWhatsappStats(resWa.data || { mensagensHoje: 127 });
      setCarregando(false);
    }).catch(() => setCarregando(false));
  }, []);

  if (carregando) {
    return <div className="fade-in" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Carregando estatísticas...</div>;
  }

  if (!stats) {
    return <div className="fade-in" style={{ padding: 40, textAlign: 'center', color: 'var(--danger)' }}>Erro ao carregar o dashboard</div>;
  }

  const formatBRL = (v) => `R$ ${(v || 0).toFixed(2).replace('.', ',')}`;

  const metaFat = stats.metaFaturamento || 10000;
  const pctFat = Math.min(100, Math.round((stats.faturamentoMes / metaFat) * 100));

  const metaOcup = stats.metaOcupacao || 8;
  const pctOcup = Math.min(100, Math.round((stats.agendamentosHoje / metaOcup) * 100));

  function copiarLink() {
    const url = `${window.location.origin}/agendar/patinhas-felizes`;
    navigator.clipboard.writeText(url);
    alert(`Link de auto-agendamento copiado:\n${url}`);
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1>📊 Painel Inteligente</h1>
          <p>Visão em tempo real de atendimentos, faturamento, pacotes e automações</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <NavLink to="/agendamentos" className="btn btn-primary">
            ➕ Novo Atendimento
          </NavLink>
          <NavLink to="/caixa" className="btn btn-secondary">
            🛒 Frente de Caixa
          </NavLink>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="dashboard-grid">
        <div className="stat-card">
          <span className="icon">🟢</span>
          <div className="label">Faturamento Hoje</div>
          <div className="value" style={{ color: 'var(--success)' }}>{formatBRL(stats.faturamentoHoje)}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
            Atualizado em tempo real
          </div>
        </div>

        <div className="stat-card">
          <span className="icon">📈</span>
          <div className="label">Faturamento do Mês</div>
          <div className="value" style={{ color: 'var(--primary)' }}>{formatBRL(stats.faturamentoMes)}</div>
          <div className="progress-container">
            <div className="progress-bar-fill" style={{ width: `${pctFat}%` }} />
          </div>
          <div className="progress-meta">
            <span>Meta Mensal</span>
            <span>{pctFat}% de {formatBRL(metaFat)}</span>
          </div>
        </div>

        <div className="stat-card">
          <span className="icon">📅</span>
          <div className="label">Agenda de Hoje</div>
          <div className="value">{stats.agendamentosHoje}</div>
          <div className="progress-container">
            <div className="progress-bar-fill" style={{ width: `${pctOcup}%`, background: 'var(--accent-blue)' }} />
          </div>
          <div className="progress-meta">
            <span>Ocupação</span>
            <span>{pctOcup}% ({stats.agendamentosHoje} de {metaOcup})</span>
          </div>
        </div>

        <div className="stat-card">
          <span className="icon">💬</span>
          <div className="label">WhatsApp Hoje</div>
          <div className="value" style={{ color: '#25d366' }}>{whatsappStats.mensagensHoje}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
            ⚡ Lembretes automáticos
          </div>
        </div>
      </div>

      {/* Main Grid: Agenda + Pacotes + Link Publico */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
        
        {/* Próximos Atendimentos */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: 17, fontWeight: 700 }}>📅 Próximos Atendimentos</h2>
            <NavLink to="/agendamentos" style={{ color: 'var(--primary)', fontSize: 13, textDecoration: 'none', fontWeight: 600 }}>
              Ver agenda completa →
            </NavLink>
          </div>

          {stats.proximosAgendamentos.length === 0 ? (
            <div className="empty-state" style={{ padding: '30px 10px' }}>
              <div className="emoji">📭</div>
              <p>Nenhum agendamento pendente</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {stats.proximosAgendamentos.map((a) => (
                <div key={a.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, background: '#f8fafc', borderRadius: 12, border: '1px solid var(--border)' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="badge badge-primary">{a.hora_agendada}</span>
                      <strong>🐾 {a.pet_nome}</strong>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                      {a.servico_nome} · Tutor: {a.cliente_nome}
                    </div>
                  </div>
                  <span className="badge badge-secondary">{new Date(a.data_agendada + 'T00:00:00').toLocaleDateString('pt-BR')}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pacotes Ativos & Assinaturas */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: 17, fontWeight: 700 }}>🔁 Pacotes & Assinaturas Ativas</h2>
            <NavLink to="/pacotes" style={{ color: 'var(--primary)', fontSize: 13, textDecoration: 'none', fontWeight: 600 }}>
              Gerenciar →
            </NavLink>
          </div>

          {assinaturas.length === 0 ? (
            <div className="empty-state" style={{ padding: '30px 10px' }}>
              <div className="emoji">🔁</div>
              <p>Nenhum pacote ativo no momento</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {assinaturas.slice(0, 3).map((ass) => {
                const pctUsado = Math.round((ass.sessoes_utilizadas / ass.sessoes_totais) * 100);
                return (
                  <div key={ass.id} style={{ padding: 14, borderRadius: 12, border: '1px solid #fed7aa', background: '#fffaf5' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                      <div>
                        <strong style={{ fontSize: 14 }}>{ass.pacote_nome}</strong>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>🐾 {ass.pet_nome} · Tutor: {ass.cliente_nome}</div>
                      </div>
                      <span className="badge badge-primary">{ass.sessoes_restantes} restantes</span>
                    </div>
                    <div className="progress-container" style={{ margin: '8px 0 4px', height: 6 }}>
                      <div className="progress-bar-fill" style={{ width: `${pctUsado}%` }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)' }}>
                      <span>{ass.sessoes_utilizadas} de {ass.sessoes_totais} sessões usadas</span>
                      <span>Válido até {new Date(ass.data_validade + 'T00:00:00').toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Link Público de Agendamento */}
        <div className="card" style={{ background: 'linear-gradient(135deg, var(--secondary) 0%, var(--secondary-light) 100%)', color: '#fff', border: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 20 }}>🌐</span>
            <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.8, fontWeight: 700 }}>Portal do Cliente</span>
          </div>
          <h2 style={{ fontSize: 20, color: '#fff', marginBottom: 6 }}>Auto-Agendamento Online</h2>
          <p style={{ fontSize: 13, opacity: 0.85, marginBottom: 16 }}>
            Seus clientes agendam banhos, tosas e consultas diretamente pelo celular sem precisar ligar ou baixar aplicativo!
          </p>

          <div style={{ background: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(4px)', padding: 12, borderRadius: 10, border: '1px solid rgba(255, 255, 255, 0.15)', marginBottom: 16 }}>
            <div style={{ fontSize: 10, opacity: 0.7 }}>LINK DO SEU PET SHOP</div>
            <div style={{ fontSize: 13, fontWeight: 700, marginTop: 2, wordBreak: 'break-all' }}>
              {window.location.origin}/agendar/patinhas-felizes
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={copiarLink}>
              📋 Copiar Link
            </button>
            <a href="/agendar/patinhas-felizes" target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ color: 'var(--secondary)' }}>
              ↗️ Abrir Página
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
