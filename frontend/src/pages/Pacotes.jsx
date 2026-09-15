import { useEffect, useState } from 'react';
import api from '../services/api';

export default function Pacotes() {
  const [pacotes, setPacotes] = useState([]);
  const [assinaturas, setAssinaturas] = useState([]);
  const [pets, setPets] = useState([]);
  const [servicos, setServicos] = useState([]);
  const [abaAtiva, setAbaAtiva] = useState('assinaturas'); // 'assinaturas' | 'planos'

  const [modalNovoPlano, setModalNovoPlano] = useState(false);
  const [modalVender, setModalVender] = useState(false);

  const [planoForm, setPlanoForm] = useState({
    nome: '', descricao: '', servico_id: '', quantidade_sessoes: 4, validade_dias: 30, preco_total: '', desconto_percentual: 15
  });

  const [vendaForm, setVendaForm] = useState({
    cliente_id: '', pet_id: '', pacote_id: '', forma_pagamento: 'PIX', observacoes: ''
  });

  useEffect(() => {
    carregar();
    api.get('/pets').then(({ data }) => setPets(data));
    api.get('/agendamentos/servicos').then(({ data }) => setServicos(data));
  }, []);

  function carregar() {
    api.get('/pacotes').then(({ data }) => setPacotes(data));
    api.get('/pacotes/assinaturas').then(({ data }) => setAssinaturas(data));
  }

  async function salvarPlano(e) {
    e.preventDefault();
    try {
      await api.post('/pacotes', planoForm);
      setModalNovoPlano(false);
      carregar();
      alert('Plano/Pacote cadastrado com sucesso!');
    } catch (err) {
      alert(err.response?.data?.error || 'Erro ao cadastrar pacote');
    }
  }

  async function salvarVenda(e) {
    e.preventDefault();
    try {
      await api.post('/pacotes/vender', vendaForm);
      setModalVender(false);
      carregar();
      alert('Assinatura de Pacote vendida com sucesso! Receita lançada no Caixa.');
    } catch (err) {
      alert(err.response?.data?.error || 'Erro ao vender pacote');
    }
  }

  async function debitarSessao(id, petNome) {
    if (!confirm(`Debitar 1 sessão de banho/serviço para o pet ${petNome}?`)) return;
    try {
      await api.post(`/pacotes/assinaturas/${id}/debitar`);
      carregar();
      alert('Sessão debitada com sucesso!');
    } catch (err) {
      alert(err.response?.data?.error || 'Erro ao debitar sessão');
    }
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1>🔁 Pacotes & Assinaturas Recorrentes</h1>
          <p>Fidelize seus clientes com pacotes mensais de banho, tosa e daycare</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-primary" onClick={() => setModalVender(true)}>
            🛍️ Vender Pacote para Pet
          </button>
          <button className="btn btn-secondary" onClick={() => setModalNovoPlano(true)}>
            ➕ Criar Novo Plano
          </button>
        </div>
      </div>

      {/* Abas */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <button className={`btn ${abaAtiva === 'assinaturas' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setAbaAtiva('assinaturas')}>
          🐾 Pacotes Ativos dos Pets ({assinaturas.length})
        </button>
        <button className={`btn ${abaAtiva === 'planos' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setAbaAtiva('planos')}>
          📋 Tabela de Planos ({pacotes.length})
        </button>
      </div>

      {/* ABA 1: ASSINATURAS ATIVAS */}
      {abaAtiva === 'assinaturas' && (
        <div className="card">
          {assinaturas.length === 0 ? (
            <div className="empty-state">
              <div className="emoji">🔁</div>
              <p>Nenhuma assinatura de pacote ativa no momento</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Pet / Tutor</th>
                  <th>Plano Contratado</th>
                  <th>Sessões & Progresso</th>
                  <th>Validade</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {assinaturas.map((ass) => {
                  const pct = Math.round((ass.sessoes_utilizadas / ass.sessoes_totais) * 100);
                  return (
                    <tr key={ass.id}>
                      <td>
                        <strong>🐾 {ass.pet_nome}</strong>
                        <br /><small style={{ color: 'var(--text-muted)' }}>Tutor: {ass.cliente_nome} ({ass.cliente_telefone})</small>
                      </td>
                      <td>
                        <strong>{ass.pacote_nome}</strong>
                        <br /><small style={{ color: 'var(--text-muted)' }}>Pago: R$ {parseFloat(ass.valor_pago || 0).toFixed(2).replace('.', ',')}</small>
                      </td>
                      <td style={{ minWidth: 160 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700 }}>
                          <span>{ass.sessoes_utilizadas} de {ass.sessoes_totais} usadas</span>
                          <span style={{ color: 'var(--primary)' }}>{ass.sessoes_restantes} restantes</span>
                        </div>
                        <div className="progress-container" style={{ height: 6, margin: '4px 0 0' }}>
                          <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
                        </div>
                      </td>
                      <td>
                        {new Date(ass.data_validade + 'T00:00:00').toLocaleDateString('pt-BR')}
                      </td>
                      <td>
                        <span className={`badge badge-${ass.status === 'ativo' ? 'success' : 'gray'}`}>
                          {ass.status === 'ativo' ? '🟢 Ativo' : '⚪ Esgotado'}
                        </span>
                      </td>
                      <td>
                        {ass.status === 'ativo' && (
                          <button className="btn btn-sm btn-primary" onClick={() => debitarSessao(ass.id, ass.pet_nome)}>
                            ✓ Debitar 1 Banho
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ABA 2: PLANOS DISPONÍVEIS */}
      {abaAtiva === 'planos' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
          {pacotes.map((pct) => (
            <div key={pct.id} className="card" style={{ borderTop: '4px solid var(--primary)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <span className="badge badge-primary" style={{ marginBottom: 8 }}>{pct.quantidade_sessoes}x Sessões</span>
                <h2 style={{ fontSize: 18, marginBottom: 8 }}>{pct.nome}</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 16 }}>{pct.descricao || 'Plano de fidelidade para cuidados contínuos.'}</p>
                <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--secondary)' }}>
                  R$ {parseFloat(pct.preco_total).toFixed(2).replace('.', ',')}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                  Validade: {pct.validade_dias} dias · Desconto médio: {pct.desconto_percentual}%
                </div>
              </div>
              <button className="btn btn-primary" style={{ marginTop: 20, width: '100%' }} onClick={() => {
                setVendaForm({ ...vendaForm, pacote_id: pct.id });
                setModalVender(true);
              }}>
                Vender este Plano
              </button>
            </div>
          ))}
        </div>
      )}

      {/* MODAL NOVO PLANO */}
      {modalNovoPlano && (
        <div className="modal-overlay" onClick={() => setModalNovoPlano(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>➕ Criar Novo Plano / Pacote</h2>
              <button onClick={() => setModalNovoPlano(false)}>×</button>
            </div>
            <form onSubmit={salvarPlano}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Nome do Pacote *</label>
                  <input placeholder="Ex: Pacote 4x Banhos Mensais" value={planoForm.nome} onChange={(e) => setPlanoForm({ ...planoForm, nome: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Serviço Principal Vinculado</label>
                  <select value={planoForm.servico_id} onChange={(e) => setPlanoForm({ ...planoForm, servico_id: e.target.value })}>
                    <option value="">Selecione o serviço...</option>
                    {servicos.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
                  </select>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Quantidade de Sessões *</label>
                    <input type="number" min="1" value={planoForm.quantidade_sessoes} onChange={(e) => setPlanoForm({ ...planoForm, quantidade_sessoes: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label>Validade (Dias) *</label>
                    <input type="number" min="1" value={planoForm.validade_dias} onChange={(e) => setPlanoForm({ ...planoForm, validade_dias: e.target.value })} required />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Preço Total do Pacote (R$) *</label>
                    <input type="number" step="0.01" value={planoForm.preco_total} onChange={(e) => setPlanoForm({ ...planoForm, preco_total: e.target.value })} placeholder="160.00" required />
                  </div>
                  <div className="form-group">
                    <label>Desconto Estimado (%)</label>
                    <input type="number" value={planoForm.desconto_percentual} onChange={(e) => setPlanoForm({ ...planoForm, desconto_percentual: e.target.value })} placeholder="15" />
                  </div>
                </div>
                <div className="form-group">
                  <label>Descrição / Benefícios</label>
                  <textarea rows="2" value={planoForm.descricao} onChange={(e) => setPlanoForm({ ...planoForm, descricao: e.target.value })} placeholder="Ex: Inclui hidratação e tosa higiênica." />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModalNovoPlano(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Salvar Pacote</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL VENDER PACOTE */}
      {modalVender && (
        <div className="modal-overlay" onClick={() => setModalVender(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>🛍️ Vender Pacote para Pet</h2>
              <button onClick={() => setModalVender(false)}>×</button>
            </div>
            <form onSubmit={salvarVenda}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Pet Beneficiário *</label>
                  <select value={vendaForm.pet_id} onChange={(e) => {
                    const selPet = pets.find(p => p.id == e.target.value);
                    setVendaForm({
                      ...vendaForm,
                      pet_id: e.target.value,
                      cliente_id: selPet ? selPet.cliente_id : ''
                    });
                  }} required>
                    <option value="">Selecione o pet...</option>
                    {pets.map(p => <option key={p.id} value={p.id}>🐾 {p.nome} · Tutor: {p.cliente_nome}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Pacote Escolhido *</label>
                  <select value={vendaForm.pacote_id} onChange={(e) => setVendaForm({ ...vendaForm, pacote_id: e.target.value })} required>
                    <option value="">Selecione o plano...</option>
                    {pacotes.map(pct => (
                      <option key={pct.id} value={pct.id}>
                        {pct.nome} - R$ {parseFloat(pct.preco_total).toFixed(2).replace('.', ',')} ({pct.quantidade_sessoes}x sessões)
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Forma de Pagamento</label>
                  <select value={vendaForm.forma_pagamento} onChange={(e) => setVendaForm({ ...vendaForm, forma_pagamento: e.target.value })}>
                    <option>PIX</option>
                    <option>Cartão de Crédito</option>
                    <option>Cartão de Débito</option>
                    <option>Dinheiro</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Observações</label>
                  <input value={vendaForm.observacoes} onChange={(e) => setVendaForm({ ...vendaForm, observacoes: e.target.value })} placeholder="Ex: Pago à vista no balcão." />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModalVender(false)}>Cancelar</button>
                <button type="submit" className="btn btn-success">Confirmar Venda & Lançar Caixa</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
