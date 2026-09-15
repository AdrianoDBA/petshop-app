import { useEffect, useState } from 'react';
import api from '../services/api';

export default function Comissoes() {
  const [comissoes, setComissoes] = useState([]);
  const [resumo, setResumo] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [filtroUsuario, setFiltroUsuario] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');

  useEffect(() => {
    carregar();
    api.get('/usuarios').then(({ data }) => setUsuarios(data)).catch(() => {});
  }, [filtroUsuario, filtroStatus]);

  function carregar() {
    const params = {};
    if (filtroUsuario) params.usuario_id = filtroUsuario;
    if (filtroStatus) params.status = filtroStatus;

    api.get('/comissoes', { params }).then(({ data }) => setComissoes(data));
    api.get('/comissoes/resumo').then(({ data }) => setResumo(data));
  }

  async function pagarComissao(id) {
    if (!confirm('Confirmar o pagamento deste repasse de comissão?')) return;
    try {
      await api.put(`/comissoes/${id}/pagar`);
      carregar();
      alert('Comissão marcada como paga com sucesso!');
    } catch (err) {
      alert(err.response?.data?.error || 'Erro ao pagar comissão');
    }
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1>💰 Comissões & Repasses da Equipe</h1>
          <p>Relatório de comissões calculadas por serviço para tosadores e veterinários</p>
        </div>
      </div>

      {/* Cards de Resumo por Colaborador */}
      <div className="dashboard-grid">
        {resumo.map((r) => (
          <div key={r.usuario_id} className="stat-card" style={{ borderTop: '4px solid var(--primary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="badge badge-primary">{r.perfil}</span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{r.total_servicos} serviços</span>
            </div>
            <h3 style={{ fontSize: 16, marginTop: 8 }}>{r.nome}</h3>
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Comissão a Pagar</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--primary)' }}>
                R$ {(r.comissao_pendente || 0).toFixed(2).replace('.', ',')}
              </div>
            </div>
            <div style={{ fontSize: 12, color: 'var(--success)', marginTop: 4 }}>
              Pago no período: R$ {(r.comissao_paga || 0).toFixed(2).replace('.', ',')}
            </div>
          </div>
        ))}
      </div>

      {/* Tabela de Lançamentos de Comissão */}
      <div className="card">
        <div className="form-row" style={{ marginBottom: 16 }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Filtrar por Colaborador</label>
            <select value={filtroUsuario} onChange={(e) => setFiltroUsuario(e.target.value)}>
              <option value="">Todos os Colaboradores</option>
              {usuarios.map(u => <option key={u.id} value={u.id}>{u.nome} ({u.perfil})</option>)}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Status do Pagamento</label>
            <select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)}>
              <option value="">Todos os Status</option>
              <option value="pendente">🟡 Pendente de Repasse</option>
              <option value="pago">🟢 Pago</option>
            </select>
          </div>
        </div>

        {comissoes.length === 0 ? (
          <div className="empty-state">
            <div className="emoji">💰</div>
            <p>Nenhuma comissão registrada para este filtro</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Colaborador</th>
                <th>Valor do Serviço</th>
                <th>% Comissão</th>
                <th>Valor da Comissão</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {comissoes.map((c) => (
                <tr key={c.id}>
                  <td>{new Date(c.criado_em).toLocaleDateString('pt-BR')}</td>
                  <td><strong>{c.profissional_nome}</strong> ({c.profissional_perfil})</td>
                  <td>R$ {parseFloat(c.valor_servico || 0).toFixed(2).replace('.', ',')}</td>
                  <td><span className="badge badge-primary">{c.percentual_comissao}%</span></td>
                  <td><strong style={{ color: 'var(--primary)', fontSize: 15 }}>R$ {parseFloat(c.valor_comissao || 0).toFixed(2).replace('.', ',')}</strong></td>
                  <td>
                    <span className={`badge badge-${c.status === 'pago' ? 'success' : 'warning'}`}>
                      {c.status === 'pago' ? '🟢 Pago' : '🟡 Pendente'}
                    </span>
                  </td>
                  <td>
                    {c.status === 'pendente' && (
                      <button className="btn btn-sm btn-success" onClick={() => pagarComissao(c.id)}>
                        ✓ Pagar Repasse
                      </button>
                    )}
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
