import { useEffect, useState } from 'react';
import api from '../services/api';

export default function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [busca, setBusca] = useState('');
  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState({ nome: '', telefone: '', cpf: '', email: '', endereco: '' });

  useEffect(() => {
    carregar();
  }, [busca]);

  function carregar() {
    api.get('/clientes', { params: { busca } }).then(({ data }) => setClientes(data.data || data));
  }

  function abrirModal(cliente = null) {
    if (cliente) {
      setEditando(cliente.id);
      // Filtra só os campos editáveis — evita mandar objetos relacionados
      // (pets, criado_em, data_cadastro, ativo) que quebrariam o Sequelize.
      setForm({
        nome: cliente.nome || '',
        telefone: cliente.telefone || '',
        cpf: cliente.cpf || '',
        email: cliente.email || '',
        endereco: cliente.endereco || ''
      });
    } else {
      setEditando(null);
      setForm({ nome: '', telefone: '', cpf: '', email: '', endereco: '' });
    }
    setModal(true);
  }

  async function salvar(e) {
    e.preventDefault();
    try {
      if (editando) {
        await api.put(`/clientes/${editando}`, form);
      } else {
        await api.post('/clientes', form);
      }
      setModal(false);
      carregar();
    } catch (err) {
      alert(err.response?.data?.error || 'Erro ao salvar');
    }
  }

  async function excluir(id) {
    if (!confirm('Desativar este cliente?')) return;
    await api.delete(`/clientes/${id}`);
    carregar();
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>👥 Clientes</h1>
          <p>Gerencie os tutores dos pets</p>
        </div>
        <button className="btn btn-primary" onClick={() => abrirModal()}>+ Novo Cliente</button>
      </div>

      <div className="card">
        <div className="search-bar">
          <input placeholder="Buscar por nome, telefone ou CPF..." value={busca} onChange={(e) => setBusca(e.target.value)} />
        </div>
        {clientes.length === 0 ? (
          <div className="empty-state">
            <div className="emoji">👥</div>
            <p>Nenhum cliente encontrado</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>CPF</th>
                <th>Telefone</th>
                <th>Email</th>
                <th>Endereço</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {clientes.map((c) => (
                <tr key={c.id}>
                  <td><strong>{c.nome}</strong></td>
                  <td>{c.cpf || '—'}</td>
                  <td>{c.telefone}</td>
                  <td>{c.email || '—'}</td>
                  <td>{c.endereco || '—'}</td>
                  <td>
                    <button className="btn btn-sm btn-secondary" onClick={() => abrirModal(c)}>✏️</button>
                    {' '}
                    <button className="btn btn-sm btn-danger" onClick={() => excluir(c.id)}>🗑️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editando ? 'Editar' : 'Novo'} Cliente</h2>
              <button onClick={() => setModal(false)}>×</button>
            </div>
            <form onSubmit={salvar}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Nome *</label>
                  <input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} required />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Telefone *</label>
                    <input value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label>CPF</label>
                    <input value={form.cpf || ''} onChange={(e) => setForm({ ...form, cpf: e.target.value })} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input type="email" value={form.email || ''} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Endereço</label>
                  <input value={form.endereco || ''} onChange={(e) => setForm({ ...form, endereco: e.target.value })} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
