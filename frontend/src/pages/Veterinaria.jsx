import { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Veterinaria() {
  const { usuario } = useAuth();
  const [prontuarios, setProntuarios] = useState([]);
  const [pets, setPets] = useState([]);
  const [busca, setBusca] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  
  const [modal, setModal] = useState(false);
  const [receitaModal, setReceitaModal] = useState(null);

  const [form, setForm] = useState({
    pet_id: '', tipo: 'consulta', titulo: '',
    queixa_principal: '', diagnostico: '', prescricao_medicamentos: '',
    vacinas_aplicadas: '', data_proxima_dose: '', peso_atual: '', temperatura: '',
    crmv_veterinario: 'CRMV-SP 45.892', observacoes: ''
  });

  useEffect(() => {
    carregar();
    api.get('/pets').then(({ data }) => setPets(data));
  }, [filtroTipo]);

  function carregar() {
    const params = {};
    if (filtroTipo) params.tipo = filtroTipo;
    api.get('/prontuarios', { params }).then(({ data }) => setProntuarios(data));
  }

  function abrirModal(tipo = 'consulta') {
    setForm({
      pet_id: pets[0]?.id || '',
      tipo,
      titulo: tipo === 'vacina' ? 'Aplicação de Vacina' : tipo === 'medicamento' ? 'Prescrição Médica' : 'Consulta Clínica Veterinária',
      queixa_principal: '',
      diagnostico: '',
      prescricao_medicamentos: '',
      vacinas_aplicadas: '',
      data_proxima_dose: '',
      peso_atual: '',
      temperatura: '38.5',
      crmv_veterinario: 'CRMV-SP 45.892',
      observacoes: ''
    });
    setModal(true);
  }

  async function salvar(e) {
    e.preventDefault();
    try {
      await api.post('/prontuarios', form);
      setModal(false);
      carregar();
      alert('Prontuário veterinário / Registro de vacina e medicamento salvo com sucesso!');
    } catch (err) {
      alert(err.response?.data?.error || 'Erro ao salvar registro veterinário');
    }
  }

  function verReceita(p) {
    setReceitaModal(p);
  }

  const filtrados = prontuarios.filter(p =>
    (p.pet_nome || '').toLowerCase().includes(busca.toLowerCase()) ||
    (p.tutor_nome || '').toLowerCase().includes(busca.toLowerCase()) ||
    (p.titulo || '').toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1>🩺 Consultório Veterinário & Vacinas</h1>
          <p>Prontuários clínicos, prescrição de medicamentos e controle de vacinação</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-primary" onClick={() => abrirModal('consulta')}>🩺 Nova Consulta</button>
          <button className="btn btn-success" onClick={() => abrirModal('vacina')}>💉 Aplicar Vacina</button>
          <button className="btn btn-secondary" onClick={() => abrirModal('medicamento')}>💊 Prescrever Medicamento</button>
        </div>
      </div>

      <div className="card">
        <div className="form-row" style={{ marginBottom: 16 }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Buscar por Pet, Tutor ou Título</label>
            <input placeholder="Digite para buscar..." value={busca} onChange={(e) => setBusca(e.target.value)} />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Filtrar por Tipo de Registro</label>
            <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)}>
              <option value="">Todos os Registros</option>
              <option value="consulta">🩺 Consultas Clínicas</option>
              <option value="vacina">💉 Aplicações de Vacina</option>
              <option value="medicamento">💊 Prescrições de Medicamentos</option>
            </select>
          </div>
        </div>

        {filtrados.length === 0 ? (
          <div className="empty-state">
            <div className="emoji">🩺</div>
            <p>Nenhum prontuário veterinário encontrado</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Pet / Tutor</th>
                <th>Tipo / Atendimento</th>
                <th>Diagnóstico / Vacina</th>
                <th>Prescrição Médica</th>
                <th>Veterinário(a)</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((p) => (
                <tr key={p.id}>
                  <td>
                    <strong>{new Date(p.criado_em).toLocaleDateString('pt-BR')}</strong>
                    <br/><small style={{ color: 'var(--text-light)' }}>{new Date(p.criado_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</small>
                  </td>
                  <td>
                    🐾 <strong>{p.pet_nome}</strong>
                    <br/><small style={{ color: 'var(--text-light)' }}>Tutor: {p.tutor_nome}</small>
                  </td>
                  <td>
                    <span className={`badge badge-${p.tipo === 'vacina' ? 'success' : p.tipo === 'medicamento' ? 'warning' : 'info'}`}>
                      {p.tipo === 'vacina' ? '💉 Vacina' : p.tipo === 'medicamento' ? '💊 Medicamento' : '🩺 Consulta'}
                    </span>
                    <strong style={{ display: 'block', fontSize: 13, marginTop: 4 }}>{p.titulo}</strong>
                  </td>
                  <td>
                    {p.vacinas_aplicadas ? (
                      <div>
                        <strong style={{ color: '#065f46' }}>💉 {p.vacinas_aplicadas}</strong>
                        {p.data_proxima_dose && <small style={{ display: 'block', color: 'var(--danger)' }}>Próxima Dose: {new Date(p.data_proxima_dose + 'T00:00:00').toLocaleDateString('pt-BR')}</small>}
                      </div>
                    ) : (
                      <span>{p.diagnostico || '—'}</span>
                    )}
                  </td>
                  <td>
                    {p.prescricao_medicamentos ? (
                      <span style={{ fontSize: 13, color: 'var(--primary-dark)', fontWeight: 600 }}>💊 Possui Receita</span>
                    ) : '—'}
                  </td>
                  <td>{p.veterinario_nome}<br/><small style={{ color: 'var(--text-light)' }}>{p.crmv_veterinario}</small></td>
                  <td>
                    <button className="btn btn-sm btn-secondary" onClick={() => verReceita(p)}>📋 Ver Prontuário / Receita</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* --- MODAL NOVO REGISTRO VETERINARIO --- */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 750 }}>
            <div className="modal-header">
              <h2>
                {form.tipo === 'vacina' ? '💉 Registro de Aplicação de Vacina' : form.tipo === 'medicamento' ? '💊 Nova Prescrição Médica' : '🩺 Consulta Veterinária & Anamnese'}
              </h2>
              <button onClick={() => setModal(false)}>×</button>
            </div>
            <form onSubmit={salvar}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Pet Atendido *</label>
                  <select value={form.pet_id} onChange={(e) => {
                    const selectedPet = pets.find(p => p.id == e.target.value);
                    setForm({ ...form, pet_id: e.target.value, peso_atual: selectedPet ? selectedPet.peso_kg || '' : '' });
                  }} required>
                    <option value="">Selecione o pet...</option>
                    {pets.map(p => <option key={p.id} value={p.id}>🐾 {p.nome} - {p.especie} ({p.raca || 'SDR'}) | Tutor: {p.cliente_nome}</option>)}
                  </select>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Título do Atendimento *</label>
                    <input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label>CRMV do Veterinário(a)</label>
                    <input value={form.crmv_veterinario} onChange={(e) => setForm({ ...form, crmv_veterinario: e.target.value })} />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Peso Atual (kg)</label>
                    <input type="number" step="0.1" value={form.peso_atual} onChange={(e) => setForm({ ...form, peso_atual: e.target.value })} placeholder="Ex: 12.5" />
                  </div>
                  <div className="form-group">
                    <label>Temperatura (°C)</label>
                    <input type="number" step="0.1" value={form.temperatura} onChange={(e) => setForm({ ...form, temperatura: e.target.value })} placeholder="Ex: 38.5" />
                  </div>
                </div>

                {form.tipo === 'vacina' && (
                  <div style={{ background: '#ecfdf5', padding: 14, borderRadius: 8, border: '1px solid #a7f3d0', marginBottom: 16 }}>
                    <div className="form-group">
                      <label style={{ color: '#065f46' }}>Vacina Aplicada & Número do Lote *</label>
                      <input value={form.vacinas_aplicadas} onChange={(e) => setForm({ ...form, vacinas_aplicadas: e.target.value })} placeholder="Ex: V10 Polivalente Zoetis - Lote #V10-9988" required />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label style={{ color: '#065f46' }}>Data Recomendada para Próxima Dose / Revacinação</label>
                      <input type="date" value={form.data_proxima_dose} onChange={(e) => setForm({ ...form, data_proxima_dose: e.target.value })} />
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <label>Queixa Principal / Anamnese</label>
                  <textarea rows="2" value={form.queixa_principal} onChange={(e) => setForm({ ...form, queixa_principal: e.target.value })} placeholder="Ex: Tutor relata vômito ocasional e falta de apetite há 1 dia." />
                </div>

                <div className="form-group">
                  <label>Diagnóstico Veterinário</label>
                  <textarea rows="2" value={form.diagnostico} onChange={(e) => setForm({ ...form, diagnostico: e.target.value })} placeholder="Ex: Indigestão alimentar leve por ingestão de petisco inadequado." />
                </div>

                <div className="form-group">
                  <label>💊 Prescrição de Medicamentos & Posologia</label>
                  <textarea rows="3" value={form.prescricao_medicamentos} onChange={(e) => setForm({ ...form, prescricao_medicamentos: e.target.value })} placeholder="Ex: 1. Simparic 20mg - 1 comprimido via oral em dose única.&#10;2. Gaviz V 10mg - 1 comprimido pela manhã em jejum por 5 dias." />
                </div>

                <div className="form-group">
                  <label>Recomendações Especiais / Observações</label>
                  <input value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} placeholder="Ex: Dieta leve por 48 horas com frango desfiado sem tempero e arroz." />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Salvar Prontuário Veterinário</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL IMPRESSAO DE RECEITA / PRONTUARIO --- */}
      {receitaModal && (
        <div className="modal-overlay" onClick={() => setReceitaModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 650 }}>
            <div className="modal-header">
              <h2>📋 Receituário & Prontuário Veterinário</h2>
              <button onClick={() => setReceitaModal(null)}>×</button>
            </div>
            <div className="modal-body" style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 8, padding: 24 }}>
              <div style={{ textAlign: 'center', borderBottom: '2px solid var(--primary)', paddingBottom: 12, marginBottom: 16 }}>
                <h2 style={{ margin: 0, color: 'var(--primary-dark)' }}>🐾 CLÍNICA VETERINÁRIA PETSHOP PRO</h2>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-light)' }}>
                  Médico(a) Veterinário(a): <strong>{receitaModal.veterinario_nome}</strong> | {receitaModal.crmv_veterinario || 'CRMV-SP 45.892'}
                </p>
                <p style={{ margin: 0, fontSize: 12, color: 'var(--text-light)' }}>Rua dos Pets, 100 - Tel: (11) 98888-8888</p>
              </div>

              <div style={{ background: '#f9fafb', padding: 12, borderRadius: 6, marginBottom: 16, fontSize: 13 }}>
                <p style={{ margin: 0 }}>PACIENTE: <strong>🐾 {receitaModal.pet_nome}</strong> | TUTOR: <strong>{receitaModal.tutor_nome}</strong></p>
                <p style={{ margin: '4px 0 0' }}>DATA DO ATENDIMENTO: <strong>{new Date(receitaModal.criado_em).toLocaleDateString('pt-BR')}</strong> | PESO: {receitaModal.peso_atual || '—'} kg | TEMP: {receitaModal.temperatura || '—'} °C</p>
              </div>

              {receitaModal.queixa_principal && (
                <div style={{ marginBottom: 12, fontSize: 13 }}>
                  <strong>Queixa Principal / Anamnese:</strong>
                  <p style={{ margin: '4px 0 0', color: '#444' }}>{receitaModal.queixa_principal}</p>
                </div>
              )}

              {receitaModal.diagnostico && (
                <div style={{ marginBottom: 12, fontSize: 13 }}>
                  <strong>Diagnóstico Clínico:</strong>
                  <p style={{ margin: '4px 0 0', color: '#444' }}>{receitaModal.diagnostico}</p>
                </div>
              )}

              {receitaModal.vacinas_aplicadas && (
                <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', padding: 12, borderRadius: 6, marginBottom: 16, fontSize: 13 }}>
                  <strong style={{ color: '#065f46' }}>💉 Vacina Aplicada:</strong>
                  <p style={{ margin: '4px 0 0', fontWeight: 'bold' }}>{receitaModal.vacinas_aplicadas}</p>
                  {receitaModal.data_proxima_dose && (
                    <p style={{ margin: '4px 0 0', color: 'var(--danger)', fontSize: 12 }}>
                      ⏰ Próxima dose/revacinação recomendada até: <strong>{new Date(receitaModal.data_proxima_dose + 'T00:00:00').toLocaleDateString('pt-BR')}</strong>
                    </p>
                  )}
                </div>
              )}

              {receitaModal.prescricao_medicamentos && (
                <div style={{ border: '1.5px solid var(--primary)', padding: 16, borderRadius: 8, marginBottom: 16, background: '#f3e8ff' }}>
                  <h3 style={{ margin: '0 0 10px', color: 'var(--primary-dark)', fontSize: 15 }}>💊 PRESCEIÇÃO MÉDICA & POSOLOGIA</h3>
                  <pre style={{ margin: 0, fontFamily: 'inherit', whiteSpace: 'pre-wrap', fontSize: 14, lineHeight: 1.5, color: '#111827' }}>
                    {receitaModal.prescricao_medicamentos}
                  </pre>
                </div>
              )}

              {receitaModal.observacoes && (
                <div style={{ fontSize: 13, color: 'var(--text-light)', marginBottom: 20 }}>
                  <strong>Observações:</strong> {receitaModal.observacoes}
                </div>
              )}

              <div style={{ textAlign: 'center', marginTop: 40, borderTop: '1px dashed #ccc', paddingTop: 16 }}>
                <p style={{ margin: 0, fontSize: 13 }}>______________________________________________________</p>
                <p style={{ margin: '4px 0 0', fontWeight: 'bold', fontSize: 13 }}>{receitaModal.veterinario_nome}</p>
                <p style={{ margin: 0, fontSize: 12, color: 'var(--text-light)' }}>{receitaModal.crmv_veterinario || 'CRMV-SP 45.892'}</p>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setReceitaModal(null)}>Fechar</button>
              <button className="btn btn-primary" onClick={() => window.print()}>🖨️ Imprimir Receita Veterinária</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
