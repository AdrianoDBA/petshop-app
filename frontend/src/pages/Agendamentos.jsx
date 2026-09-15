import { useEffect, useState } from 'react';
import api from '../services/api';

export default function Agendamentos() {
  const [agendamentos, setAgendamentos] = useState([]);
  const [pets, setPets] = useState([]);
  const [servicos, setServicos] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [filtroData, setFiltroData] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');
  const [modal, setModal] = useState(false);
  const [checkoutModal, setCheckoutModal] = useState(null);

  const hojeLocal = new Date();
  const hojeStr = `${hojeLocal.getFullYear()}-${String(hojeLocal.getMonth() + 1).padStart(2, '0')}-${String(hojeLocal.getDate()).padStart(2, '0')}`;

  const [form, setForm] = useState({
    pet_id: '', servico_id: '', usuario_id: '',
    data_agendada: hojeStr,
    hora_agendada: '09:00', observacoes: ''
  });

  const [checkoutForm, setCheckoutForm] = useState({
    forma_pagamento: 'PIX', observacoes: ''
  });

  useEffect(() => {
    carregar();
    api.get('/pets').then(({ data }) => setPets(Array.isArray(data) ? data : (data.data || []))).catch(() => setPets([]));
    api.get('/agendamentos/servicos').then(({ data }) => setServicos(Array.isArray(data) ? data : (data.data || []))).catch(() => setServicos([]));
    api.get('/usuarios').then(({ data }) => setUsuarios(Array.isArray(data) ? data : (data.data || []))).catch(() => setUsuarios([]));
  }, []);

  useEffect(() => { carregar(); }, [filtroData, filtroStatus]);

  function carregar() {
    const params = {};
    if (filtroData) params.data = filtroData;
    if (filtroStatus) params.status = filtroStatus;
    api.get('/agendamentos', { params })
      .then(({ data }) => setAgendamentos(Array.isArray(data) ? data : (data.data || [])))
      .catch(() => setAgendamentos([]));
  }

  function abrirModal() {
    setForm({
      pet_id: '',
      servico_id: '',
      usuario_id: '',
      data_agendada: hojeStr,
      hora_agendada: '09:00',
      observacoes: ''
    });
    setModal(true);
  }

  function isFuturo(dataAgendada, horaAgendada) {
    if (!dataAgendada) return false;
    if (dataAgendada > hojeStr) return true;
    if (dataAgendada === hojeStr && horaAgendada) {
      const agoraMinutos = hojeLocal.getHours() * 60 + hojeLocal.getMinutes();
      const [h, m] = horaAgendada.split(':').map(n => parseInt(n, 10) || 0);
      const agendadoMinutos = h * 60 + m;
      return (agendadoMinutos - agoraMinutos) > 30; // Mais de 30 minutos no futuro
    }
    return false;
  }

  async function salvar(e) {
    e.preventDefault();
    try {
      await api.post('/agendamentos', form);
      setModal(false);
      carregar();
      alert('Agendamento realizado com sucesso! Notificação agendada.');
    } catch (err) {
      alert(err.response?.data?.error || 'Erro ao agendar');
    }
  }

  function abrirCheckout(agendamento) {
    if (isFuturo(agendamento.data_agendada, agendamento.hora_agendada)) {
      alert(`Este agendamento está marcado para ${agendamento.data_agendada} às ${agendamento.hora_agendada}. Não é permitido faturar no caixa antes da data e horário agendados.`);
      return;
    }
    setCheckoutModal(agendamento);
    setCheckoutForm({ forma_pagamento: 'PIX', observacoes: '' });
  }

  async function confirmarCheckout(e) {
    e.preventDefault();
    if (!checkoutModal) return;
    try {
      await api.post('/caixa/servico-checkout', {
        agendamento_id: checkoutModal.id,
        forma_pagamento: checkoutForm.forma_pagamento
      });
      setCheckoutModal(null);
      carregar();
      alert('Serviço concluído com sucesso! Check-out do pet realizado e valor registrado no Caixa.');
    } catch (err) {
      alert(err.response?.data?.error || 'Erro ao registrar checkout');
    }
  }

  async function mudarStatus(id, status, agendamento) {
    if (['em_andamento', 'concluido'].includes(status) && agendamento && isFuturo(agendamento.data_agendada, agendamento.hora_agendada)) {
      alert(`Este agendamento é para data/horário futuro (${agendamento.data_agendada} às ${agendamento.hora_agendada}). O atendimento só pode ser iniciado no dia do agendamento.`);
      return;
    }

    try {
      await api.put(`/agendamentos/${id}/status`, { status });
      carregar();
    } catch (err) {
      alert(err.response?.data?.error || 'Erro ao atualizar status');
    }
  }

  function badgeStatus(status) {
    const map = {
      agendado: 'info',
      confirmado: 'info',
      em_andamento: 'warning',
      concluido: 'success',
      cancelado: 'danger'
    };
    return <span className={`badge badge-${map[status] || 'gray'}`}>{status.replace('_', ' ')}</span>;
  }

  const agendamentosLista = Array.isArray(agendamentos) ? agendamentos : [];
  const petsLista = Array.isArray(pets) ? pets : [];
  const servicosLista = Array.isArray(servicos) ? servicos : [];
  const usuariosLista = Array.isArray(usuarios) ? usuarios : [];

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1>📅 Agendamentos & Atendimentos</h1>
          <p>Banho, tosa, consulta veterinária, daycare e hospedagem</p>
        </div>
        <button className="btn btn-primary" onClick={abrirModal}>+ Novo Agendamento</button>
      </div>

      <div className="card">
        <div className="form-row" style={{ marginBottom: 16 }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Filtrar por data</label>
            <input type="date" value={filtroData} onChange={(e) => setFiltroData(e.target.value)} />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Status</label>
            <select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)}>
              <option value="">Todos os status</option>
              <option value="agendado">Agendado</option>
              <option value="em_andamento">Em andamento</option>
              <option value="concluido">Concluído</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>
        </div>

        {agendamentosLista.length === 0 ? (
          <div className="empty-state">
            <div className="emoji">📅</div>
            <p>Nenhum agendamento encontrado</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Data/Hora</th>
                <th>Pet</th>
                <th>Tutor</th>
                <th>Serviço</th>
                <th>Profissional</th>
                <th>Valor</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {agendamentosLista.map((a) => {
                const sNome = (a.servico_nome || '').toLowerCase();
                let icon = '✂️';
                if (sNome.includes('banho')) icon = '🚿';
                if (sNome.includes('vet') || sNome.includes('consulta')) icon = '🩺';
                if (sNome.includes('daycare') || sNome.includes('creche')) icon = '🏕️';
                if (sNome.includes('hospedagem')) icon = '🏨';

                const agFuturo = isFuturo(a.data_agendada, a.hora_agendada);

                return (
                  <tr key={a.id}>
                    <td>
                      <strong>{new Date(a.data_agendada + 'T00:00:00').toLocaleDateString('pt-BR')}</strong>
                      <br /><small style={{ color: 'var(--text-light)' }}>às {a.hora_agendada}</small>
                      {agFuturo && (
                        <div><span className="badge badge-gray" style={{ fontSize: 10, marginTop: 4 }}>🔒 Agendado Futuro</span></div>
                      )}
                    </td>
                    <td>🐾 <strong>{a.pet_nome}</strong></td>
                    <td>{a.cliente_nome}<br/><small style={{ color: 'var(--text-light)' }}>{a.cliente_telefone}</small></td>
                    <td><span className="badge badge-secondary">{icon} {a.servico_nome}</span></td>
                    <td>{a.profissional_nome || 'A definir'}</td>
                    <td><strong>R$ {(a.valor || 0).toFixed(2).replace('.', ',')}</strong></td>
                    <td>{badgeStatus(a.status)}</td>
                    <td>
                      {a.status === 'agendado' && (
                        <>
                          {agFuturo ? (
                            <button
                              className="btn btn-sm btn-secondary"
                              style={{ opacity: 0.6, cursor: 'not-allowed' }}
                              onClick={() => alert(`Agendamento futuro (${a.data_agendada} às ${a.hora_agendada}). O atendimento só pode ser iniciado no dia marcado.`)}
                              title="Não é permitido iniciar atendimento antes da data agendada"
                            >
                              🔒 Iniciar
                            </button>
                          ) : (
                            <button
                              className="btn btn-sm btn-success"
                              onClick={() => mudarStatus(a.id, 'em_andamento', a)}
                              title="Iniciar Atendimento Agora"
                            >
                              ▶️ Iniciar
                            </button>
                          )}{' '}
                          {!agFuturo && (
                            <button className="btn btn-sm btn-secondary" onClick={() => abrirCheckout(a)} title="Concluir e Faturar">✓ Checkout</button>
                          )}{' '}
                          <button className="btn btn-sm btn-danger" onClick={() => mudarStatus(a.id, 'cancelado', a)} title="Cancelar">✕</button>
                        </>
                      )}
                      {a.status === 'em_andamento' && (
                        <button className="btn btn-sm btn-success" onClick={() => abrirCheckout(a)} title="Finalizar e Ir ao Caixa">🏁 Finalizar & Caixa</button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* --- MODAL NOVO AGENDAMENTO --- */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Novo Agendamento</h2>
              <button onClick={() => setModal(false)}>×</button>
            </div>
            <form onSubmit={salvar}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Pet *</label>
                  <select value={form.pet_id} onChange={(e) => setForm({ ...form, pet_id: e.target.value })} required>
                    <option value="">Selecione o pet...</option>
                    {petsLista.map((p) => <option key={p.id} value={p.id}>🐾 {p.nome} (Tutor: {p.cliente_nome})</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Serviço *</label>
                  <select value={form.servico_id} onChange={(e) => setForm({ ...form, servico_id: e.target.value })} required>
                    <option value="">Selecione o serviço...</option>
                    {servicosLista.map((s) => <option key={s.id} value={s.id}>{s.nome} - R$ {(s.preco || s.preco_base || 0).toFixed(2).replace('.', ',')}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Profissional Responsável (Opcional)</label>
                  <select value={form.usuario_id} onChange={(e) => setForm({ ...form, usuario_id: e.target.value })}>
                    <option value="">A definir / Qualquer disponível</option>
                    {usuariosLista.map((u) => <option key={u.id} value={u.id}>{u.nome} ({u.perfil})</option>)}
                  </select>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Data *</label>
                    <input type="date" value={form.data_agendada} onChange={(e) => setForm({ ...form, data_agendada: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label>Hora *</label>
                    <input type="time" value={form.hora_agendada} onChange={(e) => setForm({ ...form, hora_agendada: e.target.value })} required />
                  </div>
                </div>
                <div className="form-group">
                  <label>Observações do Atendimento</label>
                  <textarea rows="3" value={form.observacoes || ''} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} placeholder="Ex: Tosa higiênica baixa, banho medicinal." />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Agendar Serviço</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL CHECKOUT DO SERVICO --- */}
      {checkoutModal && (
        <div className="modal-overlay" onClick={() => setCheckoutModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <h2>🏁 Checkout de Serviço & Lançamento de Caixa</h2>
              <button onClick={() => setCheckoutModal(null)}>×</button>
            </div>
            <form onSubmit={confirmarCheckout}>
              <div className="modal-body">
                <div style={{ background: '#f3e8ff', padding: 14, borderRadius: 8, marginBottom: 16 }}>
                  <p style={{ margin: 0, fontSize: 14 }}>Pet: <strong>🐾 {checkoutModal.pet_nome}</strong></p>
                  <p style={{ margin: '4px 0 0', fontSize: 14 }}>Serviço: <strong>{checkoutModal.servico_nome}</strong></p>
                  <p style={{ margin: '4px 0 0', fontSize: 16, fontWeight: 'bold', color: 'var(--primary-dark)' }}>
                    Valor Total: R$ {(checkoutModal.valor || 0).toFixed(2).replace('.', ',')}
                  </p>
                </div>

                <div className="form-group">
                  <label>Forma de Pagamento *</label>
                  <select value={checkoutForm.forma_pagamento} onChange={(e) => setCheckoutForm({ ...checkoutForm, forma_pagamento: e.target.value })}>
                    <option value="PIX">⚡ PIX</option>
                    <option value="Dinheiro">💵 Dinheiro</option>
                    <option value="Cartão de Crédito">💳 Cartão de Crédito</option>
                    <option value="Cartão de Débito">💳 Cartão de Débito</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setCheckoutModal(null)}>Cancelar</button>
                <button type="submit" className="btn btn-success">Finalizar & Lançar no Caixa</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
