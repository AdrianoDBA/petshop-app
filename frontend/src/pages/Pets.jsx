import { useEffect, useState } from 'react';
import api from '../services/api';

const ESPECIE_LABELS = {
  cachorro: { label: 'Cão', icon: '🐶' },
  gato: { label: 'Gato', icon: '🐱' },
  ave: { label: 'Ave', icon: '🦜' },
  roedor: { label: 'Roedor', icon: '🐹' },
  reptil: { label: 'Réptil', icon: '🦎' },
  outro: { label: 'Outro', icon: '🐠' }
};

const SEXO_LABELS = { M: 'Macho', F: 'Fêmea' };

const formVazio = {
  cliente_id: '',
  nome: '',
  especie: 'cachorro',
  raca: '',
  sexo: 'M',
  data_nascimento: '',
  peso: '',
  cor: '',
  castrado: false,
  alergias: '',
  vacinas_em_dia: true,
  vacinas_detalhes: [],
  observacoes: ''
};

export default function Pets() {
  const [pets, setPets] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [busca, setBusca] = useState('');
  const [modal, setModal] = useState(false);
  const [prontuarioModal, setProntuarioModal] = useState(null);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState(formVazio);
  
  // Estado temporário para inserção de vacina no form
  const [vacinaTemp, setVacinaTemp] = useState({ nome: '', data: '', proxima_dose: '' });

  useEffect(() => {
    carregar();
    api.get('/clientes')
      .then(({ data }) => setClientes(Array.isArray(data) ? data : (data.data || [])))
      .catch(() => setClientes([]));
  }, []);

  function carregar() {
    api.get('/pets')
      .then(({ data }) => setPets(Array.isArray(data) ? data : (data.data || [])))
      .catch(() => setPets([]));
  }

  function abrirModal(pet = null) {
    const listaClientes = Array.isArray(clientes) ? clientes : [];
    if (pet) {
      setEditando(pet.id);
      let vacs = [];
      try {
        vacs = typeof pet.vacinas_detalhes === 'string' ? JSON.parse(pet.vacinas_detalhes) : (pet.vacinas_detalhes || []);
      } catch (e) {
        vacs = [];
      }

      setForm({
        cliente_id: pet.cliente_id || '',
        nome: pet.nome || '',
        especie: pet.especie || 'cachorro',
        raca: pet.raca || '',
        sexo: pet.sexo || 'M',
        data_nascimento: pet.data_nascimento ? pet.data_nascimento.substring(0, 10) : '',
        peso: pet.peso_kg ?? '',
        cor: pet.cor || '',
        castrado: !!pet.castrado,
        alergias: pet.alergias || '',
        vacinas_em_dia: pet.vacinas_em_dia !== false,
        vacinas_detalhes: Array.isArray(vacs) ? vacs : [],
        observacoes: pet.observacoes || ''
      });
    } else {
      setEditando(null);
      setForm({ ...formVazio, cliente_id: listaClientes[0]?.id || '' });
    }
    setVacinaTemp({ nome: '', data: '', proxima_dose: '' });
    setModal(true);
  }

  function verProntuario(petId) {
    api.get(`/pets/${petId}`).then(({ data }) => {
      setProntuarioModal(data);
    });
  }

  function adicionarVacina() {
    if (!vacinaTemp.nome) return;
    setForm({
      ...form,
      vacinas_detalhes: [...(form.vacinas_detalhes || []), { ...vacinaTemp }]
    });
    setVacinaTemp({ nome: '', data: '', proxima_dose: '' });
  }

  function removerVacina(index) {
    setForm({
      ...form,
      vacinas_detalhes: (form.vacinas_detalhes || []).filter((_, idx) => idx !== index)
    });
  }

  async function salvar(e) {
    e.preventDefault();
    try {
      if (editando) {
        await api.put(`/pets/${editando}`, form);
      } else {
        await api.post('/pets', form);
      }
      setModal(false);
      carregar();
    } catch (err) {
      alert(err.response?.data?.error || 'Erro ao salvar pet');
    }
  }

  async function excluir(id) {
    if (!confirm('Desativar este pet?')) return;
    await api.delete(`/pets/${id}`);
    carregar();
  }

  async function checkin(id) {
    try {
      await api.post(`/pets/${id}/checkin`);
      carregar();
    } catch (err) {
      alert('Erro ao realizar check-in');
    }
  }

  async function checkout(id) {
    try {
      await api.post(`/pets/${id}/checkout`);
      carregar();
    } catch (err) {
      alert('Erro ao realizar check-out');
    }
  }

  const petsLista = Array.isArray(pets) ? pets : [];
  const clientesLista = Array.isArray(clientes) ? clientes : [];

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1>🐾 Pets & Prontuários</h1>
          <p>Cadastro detalhado, vacinas, alergias e tutores</p>
        </div>
        <button className="btn btn-primary" onClick={() => abrirModal()}>+ Novo Pet</button>
      </div>

      <div className="card">
        <div className="search-bar">
          <input placeholder="Buscar por nome do pet, raça ou tutor..." value={busca} onChange={(e) => setBusca(e.target.value)} />
        </div>
        {petsLista.length === 0 ? (
          <div className="empty-state">
            <div className="emoji">🐾</div>
            <p>Nenhum pet cadastrado</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Pet</th>
                <th>Espécie</th>
                <th>Raça / Sexo</th>
                <th>Vacinas</th>
                <th>Alergias</th>
                <th>Presença</th>
                <th>Tutor</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {petsLista.filter(p => 
                (p.nome || '').toLowerCase().includes(busca.toLowerCase()) ||
                (p.raca || '').toLowerCase().includes(busca.toLowerCase()) ||
                (p.cliente_nome || '').toLowerCase().includes(busca.toLowerCase())
              ).map((p) => {
                const especie = ESPECIE_LABELS[p.especie] || { label: p.especie, icon: '🐠' };
                const sexo = SEXO_LABELS[p.sexo] || p.sexo;
                return (
                  <tr key={p.id}>
                    <td>
                      <strong style={{ cursor: 'pointer', color: 'var(--primary)' }} onClick={() => verProntuario(p.id)}>
                        🐾 {p.nome}
                      </strong>
                    </td>
                    <td>
                      <span className="badge badge-gray">{especie.icon} {especie.label}</span>
                    </td>
                    <td>
                      {p.raca || 'SRD'} ({sexo})
                    </td>
                    <td>
                      <span className={`badge badge-${p.vacinas_em_dia ? 'success' : 'danger'}`}>
                        {p.vacinas_em_dia ? '💉 Em Dia' : '⚠️ Atrasada'}
                      </span>
                    </td>
                    <td>
                      {p.alergias ? (
                        <span className="badge badge-warning" title={p.alergias}>⚠️ Possui Alergia</span>
                      ) : (
                        <span style={{ opacity: 0.6 }}>Nenhuma</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge badge-${p.status_presenca === 'presente' ? 'success' : 'gray'}`}>
                        {p.status_presenca === 'presente' ? '📍 Presente' : '🏠 Ausente'}
                      </span>
                    </td>
                    <td>{p.cliente_nome || '—'}</td>
                    <td>
                      <button className="btn btn-sm btn-info" style={{ padding: '4px 8px' }} onClick={() => verProntuario(p.id)} title="Ver Prontuário Completo">📋 Prontuário</button>{' '}
                      {p.status_presenca === 'presente' ? (
                        <button className="btn btn-sm btn-danger" style={{ padding: '4px 8px' }} onClick={() => checkout(p.id)} title="Check-out">🚪</button>
                      ) : (
                        <button className="btn btn-sm btn-success" style={{ padding: '4px 8px' }} onClick={() => checkin(p.id)} title="Check-in">📍</button>
                      )}{' '}
                      <button className="btn btn-sm btn-secondary" style={{ padding: '4px 8px' }} onClick={() => abrirModal(p)}>✏️</button>{' '}
                      <button className="btn btn-sm btn-danger" style={{ padding: '4px 8px' }} onClick={() => excluir(p.id)}>🗑️</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* --- MODAL DE EDICAO / CADASTRO DE PET --- */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 720 }}>
            <div className="modal-header">
              <h2>{editando ? 'Editar Prontuário do Pet' : 'Novo Pet'}</h2>
              <button onClick={() => setModal(false)}>×</button>
            </div>
            <form onSubmit={salvar}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Tutor / Cliente Responsável *</label>
                  <select value={form.cliente_id} onChange={(e) => setForm({ ...form, cliente_id: e.target.value })} required>
                    <option value="">Selecione o tutor...</option>
                    {clientesLista.map((c) => <option key={c.id} value={c.id}>{c.nome} ({c.telefone})</option>)}
                  </select>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Nome do Pet *</label>
                    <input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} required placeholder="Ex: Rex" />
                  </div>
                  <div className="form-group">
                    <label>Espécie *</label>
                    <select value={form.especie} onChange={(e) => setForm({ ...form, especie: e.target.value })}>
                      {Object.entries(ESPECIE_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>{v.icon} {v.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Raça</label>
                    <input value={form.raca || ''} onChange={(e) => setForm({ ...form, raca: e.target.value })} placeholder="Ex: Shih Tzu, Poodle" />
                  </div>
                  <div className="form-group">
                    <label>Sexo</label>
                    <select value={form.sexo} onChange={(e) => setForm({ ...form, sexo: e.target.value })}>
                      <option value="M">♂️ Macho</option>
                      <option value="F">♀️ Fêmea</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Data de Nascimento</label>
                    <input type="date" value={form.data_nascimento || ''} onChange={(e) => setForm({ ...form, data_nascimento: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Peso (kg)</label>
                    <input type="number" step="0.1" value={form.peso} onChange={(e) => setForm({ ...form, peso: e.target.value })} placeholder="Ex: 8.5" />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Alergias e Restrições Alimentares/Banhos</label>
                    <input value={form.alergias || ''} onChange={(e) => setForm({ ...form, alergias: e.target.value })} placeholder="Ex: Alergia a shampoo perfumado, intolerância a frango" />
                  </div>
                  <div className="form-group">
                    <label>Status das Vacinas</label>
                    <select value={form.vacinas_em_dia ? 'sim' : 'nao'} onChange={(e) => setForm({ ...form, vacinas_em_dia: e.target.value === 'sim' })}>
                      <option value="sim">🟢 Vacinas Em Dia</option>
                      <option value="nao">🔴 Vacinas Pendentes/Atrasadas</option>
                    </select>
                  </div>
                </div>

                {/* Seção de Cadastro de Vacinas */}
                <div style={{ background: '#f9fafb', padding: 14, borderRadius: 8, border: '1px solid var(--border)', marginBottom: 16 }}>
                  <strong style={{ display: 'block', marginBottom: 8 }}>💉 Registrar Vacina no Histórico</strong>
                  <div className="form-row" style={{ marginBottom: 8 }}>
                    <input placeholder="Nome da vacina (ex: V10, Raiva)" value={vacinaTemp.nome} onChange={(e) => setVacinaTemp({ ...vacinaTemp, nome: e.target.value })} />
                    <input type="date" value={vacinaTemp.data} onChange={(e) => setVacinaTemp({ ...vacinaTemp, data: e.target.value })} />
                  </div>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={adicionarVacina}>+ Adicionar Vacina ao Histórico</button>

                  {(form.vacinas_detalhes || []).length > 0 && (
                    <div style={{ marginTop: 12 }}>
                      <label style={{ fontSize: 12, fontWeight: 600 }}>Vacinas Cadastradas:</label>
                      <ul style={{ paddingLeft: 20, fontSize: 13, marginTop: 4 }}>
                        {form.vacinas_detalhes.map((v, idx) => (
                          <li key={idx} style={{ marginBottom: 4 }}>
                            💉 <strong>{v.nome}</strong> - Aplicada em: {v.data || 'Data N/I'}{' '}
                            <button type="button" style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }} onClick={() => removerVacina(idx)}>✕</button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label>Observações Clínicas / Comportamentais</label>
                  <textarea rows="2" value={form.observacoes || ''} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} placeholder="Ex: Arrisca morder ao secar as orelhas." />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Salvar Pet</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL DE PRONTUARIO DETALHADO DO PET --- */}
      {prontuarioModal && (
        <div className="modal-overlay" onClick={() => setProntuarioModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 680 }}>
            <div className="modal-header">
              <h2>🐾 Prontuário Digital: {prontuarioModal.nome}</h2>
              <button onClick={() => setProntuarioModal(null)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 20, padding: 16, background: '#f3e8ff', borderRadius: 8 }}>
                <span style={{ fontSize: 40 }}>🐾</span>
                <div>
                  <h3 style={{ margin: 0 }}>{prontuarioModal.nome} ({prontuarioModal.raca || 'SRD'})</h3>
                  <p style={{ margin: '4px 0 0', color: 'var(--text-light)', fontSize: 14 }}>
                    Tutor: <strong>{prontuarioModal.cliente_nome}</strong> ({prontuarioModal.cliente_telefone})
                  </p>
                </div>
              </div>

              <div className="form-row" style={{ marginBottom: 16 }}>
                <div><strong>Espécie:</strong> {prontuarioModal.especie}</div>
                <div><strong>Sexo:</strong> {prontuarioModal.sexo === 'M' ? 'Macho' : 'Fêmea'}</div>
                <div><strong>Peso:</strong> {prontuarioModal.peso_kg || '—'} kg</div>
                <div><strong>Castrado:</strong> {prontuarioModal.castrado ? 'Sim' : 'Não'}</div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <strong>⚠️ Alergias & Restrições:</strong>
                <p style={{ background: '#fef2f2', color: '#991b1b', padding: 8, borderRadius: 6, margin: '6px 0 0', fontSize: 13 }}>
                  {prontuarioModal.alergias || 'Nenhuma alergia registrada.'}
                </p>
              </div>

              <div style={{ marginBottom: 16 }}>
                <strong>💉 Histórico de Vacinação:</strong>
                <div style={{ background: '#f9fafb', padding: 12, borderRadius: 6, marginTop: 6, fontSize: 13 }}>
                  <span className={`badge badge-${prontuarioModal.vacinas_em_dia ? 'success' : 'danger'}`}>
                    {prontuarioModal.vacinas_em_dia ? '🟢 Vacinas Em Dia' : '🔴 Vacinas Pendentes'}
                  </span>
                  {prontuarioModal.vacinas_detalhes ? (
                    <div style={{ marginTop: 8 }}>
                      {typeof prontuarioModal.vacinas_detalhes === 'string' ? (
                        <p>{prontuarioModal.vacinas_detalhes}</p>
                      ) : (
                        <ul>
                          {prontuarioModal.vacinas_detalhes.map((v, i) => (
                            <li key={i}>💉 {v.nome} - Data: {v.data}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ) : (
                    <p style={{ margin: '6px 0 0', color: 'var(--text-light)' }}>Nenhum histórico de vacinas registrado ainda.</p>
                  )}
                </div>
              </div>

              <div>
                <strong>📅 Histórico Recente de Atendimentos:</strong>
                {(!prontuarioModal.historico || prontuarioModal.historico.length === 0) ? (
                  <p style={{ fontSize: 13, color: 'var(--text-light)', marginTop: 4 }}>Nenhum atendimento finalizado ainda.</p>
                ) : (
                  <table style={{ marginTop: 8 }}>
                    <thead>
                      <tr><th>Data</th><th>Serviço</th><th>Status</th></tr>
                    </thead>
                    <tbody>
                      {prontuarioModal.historico.map((h) => (
                        <tr key={h.id}>
                          <td>{h.data_agendada}</td>
                          <td>{h.servico_nome}</td>
                          <td><span className="badge badge-success">{h.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setProntuarioModal(null)}>Fechar Prontuário</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
