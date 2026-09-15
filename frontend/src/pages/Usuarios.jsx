import { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Usuarios() {
  const { usuario: atual } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [modalNovo, setModalNovo] = useState(false);
  const [modalEditar, setModalEditar] = useState(false);

  const [novoForm, setNovoForm] = useState({
    nome: '', usuario: '', senha: '', perfil: 'atendente', email: ''
  });

  const [editForm, setEditForm] = useState({
    id: '', nome: '', usuario: '', perfil: 'atendente', email: '', ativo: true, senha: ''
  });

  useEffect(() => {
    if (atual?.perfil !== 'admin') return;
    carregar();
  }, [atual]);

  function carregar() {
    api.get('/usuarios').then(({ data }) => setUsuarios(data)).catch(() => {});
  }

  if (atual?.perfil !== 'admin') {
    return (
      <div className="card empty-state" style={{ padding: 60 }}>
        <div className="emoji">🔒</div>
        <h2>Acesso Restrito</h2>
        <p>Apenas administradores do sistema possuem permissão para gerenciar usuários e perfis de acesso.</p>
      </div>
    );
  }

  function abrirEditar(u) {
    setEditForm({
      id: u.id,
      nome: u.nome,
      usuario: u.usuario,
      perfil: u.perfil,
      email: u.email || '',
      ativo: u.ativo !== false,
      senha: ''
    });
    setModalEditar(true);
  }

  async function salvarNovo(e) {
    e.preventDefault();
    try {
      await api.post('/usuarios', novoForm);
      setModalNovo(false);
      setNovoForm({ nome: '', usuario: '', senha: '', perfil: 'atendente', email: '' });
      carregar();
      alert('Novo usuário cadastrado com sucesso!');
    } catch (err) {
      alert(err.response?.data?.error || 'Erro ao criar usuário');
    }
  }

  async function salvarEdicao(e) {
    e.preventDefault();
    try {
      await api.put(`/usuarios/${editForm.id}`, editForm);
      setModalEditar(false);
      carregar();
      alert('Usuário e permissões atualizados com sucesso!');
    } catch (err) {
      alert(err.response?.data?.error || 'Erro ao atualizar usuário');
    }
  }

  async function desativar(id, nome) {
    if (!confirm(`Tem certeza que deseja desativar o acesso de ${nome}?`)) return;
    try {
      await api.delete(`/usuarios/${id}`);
      carregar();
      alert('Usuário desativado com sucesso!');
    } catch (err) {
      alert(err.response?.data?.error || 'Erro ao desativar');
    }
  }

  const getPerfilBadge = (perfil) => {
    switch (perfil) {
      case 'admin':
        return <span className="badge badge-danger">👑 Administrador</span>;
      case 'gerente':
        return <span className="badge badge-warning">💼 Gerente</span>;
      case 'veterinario':
        return <span className="badge badge-info">🩺 Veterinário(a)</span>;
      case 'atendente':
        return <span className="badge badge-success">🛎️ Atendente</span>;
      case 'tosador':
      case 'esteticista':
        return <span className="badge badge-primary">✂️ Tosador / Banhista</span>;
      default:
        return <span className="badge badge-gray">{perfil}</span>;
    }
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1>🔑 Gestão de Usuários & Permissões</h1>
          <p>Controle de perfis de acesso, permissões restritas e segurança da equipe</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModalNovo(true)}>
          ➕ Novo Usuário
        </button>
      </div>

      {/* Matriz de Perfis & Permissões */}
      <div className="dashboard-grid" style={{ marginBottom: 24 }}>
        <div className="stat-card" style={{ borderLeft: '4px solid var(--danger)' }}>
          <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--secondary)' }}>👑 Administrador</div>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
            Acesso irrestrito a todos os módulos, relatórios financeiros, caixa, usuários e configurações.
          </p>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid var(--warning)' }}>
          <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--secondary)' }}>💼 Gerente</div>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
            Acesso a relatórios de gestão, faturamento, caixa, estoque e comissões da equipe.
          </p>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid var(--info)' }}>
          <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--secondary)' }}>🩺 Veterinário(a)</div>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
            Acesso restrito ao módulo clínico, prontuários, carteira de vacinação e suas próprias comissões.
          </p>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid var(--success)' }}>
          <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--secondary)' }}>🛎️ Atendente</div>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
            Agendamentos, recepção, WhatsApp, vendas no caixa (PDV) e controle de pacotes.
          </p>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid var(--primary)' }}>
          <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--secondary)' }}>✂️ Tosador / Banhista</div>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
            Fila de banho/tosa do dia, status de presença dos pets e suas próprias comissões.
          </p>
        </div>
      </div>

      {/* Tabela de Usuários */}
      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Colaborador</th>
              <th>Login / Usuário</th>
              <th>Perfil de Acesso</th>
              <th>Email</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u) => (
              <tr key={u.id}>
                <td><strong>{u.nome}</strong></td>
                <td><code style={{ background: '#f1f5f9', padding: '3px 8px', borderRadius: 6, fontWeight: 700 }}>{u.usuario}</code></td>
                <td>{getPerfilBadge(u.perfil)}</td>
                <td>{u.email || '—'}</td>
                <td>
                  {u.ativo ? (
                    <span className="badge badge-success">🟢 Ativo</span>
                  ) : (
                    <span className="badge badge-danger">🔴 Inativo</span>
                  )}
                </td>
                <td style={{ textAlign: 'right' }}>
                  <button className="btn btn-sm btn-secondary" style={{ marginRight: 6 }} onClick={() => abrirEditar(u)}>
                    ✏️ Editar Permissões
                  </button>
                  {u.id !== atual.id && u.ativo && (
                    <button className="btn btn-sm btn-danger" onClick={() => desativar(u.id, u.nome)}>
                      Desativar
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL NOVO USUÁRIO */}
      {modalNovo && (
        <div className="modal-overlay" onClick={() => setModalNovo(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>➕ Cadastrar Novo Usuário</h2>
              <button onClick={() => setModalNovo(false)}>×</button>
            </div>
            <form onSubmit={salvarNovo}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Nome Completo do Colaborador *</label>
                  <input placeholder="Ex: Lucas Mendes" value={novoForm.nome} onChange={(e) => setNovoForm({ ...novoForm, nome: e.target.value })} required />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Login de Acesso (Username) *</label>
                    <input placeholder="Ex: lucas" value={novoForm.usuario} onChange={(e) => setNovoForm({ ...novoForm, usuario: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label>Senha Inicial *</label>
                    <input type="password" placeholder="Senha segura" value={novoForm.senha} onChange={(e) => setNovoForm({ ...novoForm, senha: e.target.value })} required />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Perfil de Permissão *</label>
                    <select value={novoForm.perfil} onChange={(e) => setNovoForm({ ...novoForm, perfil: e.target.value })}>
                      <option value="atendente">🛎️ Atendente (Balcão, Agenda & Caixa)</option>
                      <option value="tosador">✂️ Tosador / Banhista (Serviços & Minhas Comissões)</option>
                      <option value="veterinario">🩺 Veterinário(a) (Prontuários & Vacinas)</option>
                      <option value="gerente">💼 Gerente (Operacional, Estoque & Relatórios)</option>
                      <option value="admin">👑 Administrador (Acesso Completo)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Email (Opcional)</label>
                    <input type="email" placeholder="colaborador@petshop.com" value={novoForm.email} onChange={(e) => setNovoForm({ ...novoForm, email: e.target.value })} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModalNovo(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Cadastrar Usuário</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EDITAR USUÁRIO */}
      {modalEditar && (
        <div className="modal-overlay" onClick={() => setModalEditar(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>✏️ Editar Usuário e Permissões</h2>
              <button onClick={() => setModalEditar(false)}>×</button>
            </div>
            <form onSubmit={salvarEdicao}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Nome Completo *</label>
                  <input value={editForm.nome} onChange={(e) => setEditForm({ ...editForm, nome: e.target.value })} required />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Login de Usuário (Username) *</label>
                    <input value={editForm.usuario} onChange={(e) => setEditForm({ ...editForm, usuario: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label>Perfil de Permissão *</label>
                    <select value={editForm.perfil} onChange={(e) => setEditForm({ ...editForm, perfil: e.target.value })}>
                      <option value="atendente">🛎️ Atendente (Balcão, Agenda & Caixa)</option>
                      <option value="tosador">✂️ Tosador / Banhista (Serviços & Minhas Comissões)</option>
                      <option value="veterinario">🩺 Veterinário(a) (Prontuários & Vacinas)</option>
                      <option value="gerente">💼 Gerente (Operacional, Estoque & Relatórios)</option>
                      <option value="admin">👑 Administrador (Acesso Completo)</option>
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Email</label>
                    <input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Status da Conta</label>
                    <select value={editForm.ativo ? '1' : '0'} onChange={(e) => setEditForm({ ...editForm, ativo: e.target.value === '1' })}>
                      <option value="1">🟢 Ativo (Pode fazer login)</option>
                      <option value="0">🔴 Inativo (Acesso bloqueado)</option>
                    </select>
                  </div>
                </div>
                <div className="form-group" style={{ background: '#f8fafc', padding: 14, borderRadius: 12, border: '1px solid var(--border)' }}>
                  <label>Redefinir Senha (Opcional)</label>
                  <input type="password" placeholder="Deixe em branco para manter a senha atual" value={editForm.senha} onChange={(e) => setEditForm({ ...editForm, senha: e.target.value })} />
                  <small style={{ color: 'var(--text-muted)' }}>Preencha apenas se desejar trocar a senha do colaborador.</small>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModalEditar(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Salvar Alterações</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
