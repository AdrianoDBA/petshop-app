import { useEffect, useState } from 'react';
import api from '../services/api';

const CATEGORIAS = ['Ração', 'Medicamentos', 'Brinquedos', 'Higiene', 'Acessórios', 'Outros'];

export default function Estoque() {
  const [produtos, setProdutos] = useState([]);
  const [busca, setBusca] = useState('');
  const [filtroAba, setFiltroAba] = useState('todos'); // 'todos' | 'baixo' | 'vencer' | 'racao' | 'medicamentos'
  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [movModal, setMovModal] = useState(null);
  
  const [form, setForm] = useState({
    nome: '', categoria: 'Ração', unidade_medida: 'un',
    preco_custo: 0, preco_venda: 0, quantidade: 0, estoque_minimo: 5,
    data_validade: '', numero_lote: '', fornecedor: '', descricao: '', codigo_barras: ''
  });
  const [movForm, setMovForm] = useState({ tipo: 'entrada', quantidade: 0, motivo: '' });

  useEffect(() => { carregar(); }, [busca, filtroAba]);

  function carregar() {
    let endpoint = '/estoque/produtos';
    if (filtroAba === 'baixo') endpoint = '/estoque/produtos/baixo-estoque';
    if (filtroAba === 'vencer') endpoint = '/estoque/produtos/a-vencer';

    api.get(endpoint, { params: { busca } }).then(({ data }) => setProdutos(data));
  }

  function abrirModal(produto = null) {
    if (produto) {
      setEditando(produto.id);
      setForm({
        nome: produto.nome || '',
        categoria: produto.categoria || 'Ração',
        unidade_medida: produto.unidade_medida || 'un',
        preco_custo: Number(produto.preco_custo) || 0,
        preco_venda: Number(produto.preco_venda) || 0,
        quantidade: produto.quantidade || 0,
        estoque_minimo: produto.estoque_minimo || 5,
        data_validade: produto.data_validade || '',
        numero_lote: produto.numero_lote || '',
        fornecedor: produto.fornecedor || '',
        descricao: produto.descricao || '',
        codigo_barras: produto.codigo_barras || ''
      });
    } else {
      setEditando(null);
      setForm({
        nome: '', categoria: 'Ração', unidade_medida: 'un',
        preco_custo: 0, preco_venda: 0, quantidade: 0, estoque_minimo: 5,
        data_validade: '', numero_lote: '', fornecedor: '', descricao: '', codigo_barras: ''
      });
    }
    setModal(true);
  }

  async function salvar(e) {
    e.preventDefault();
    try {
      if (editando) {
        await api.put(`/estoque/produtos/${editando}`, form);
      } else {
        await api.post('/estoque/produtos', form);
      }
      setModal(false);
      carregar();
    } catch (err) {
      alert(err.response?.data?.error || 'Erro ao salvar produto');
    }
  }

  async function salvarMov(e) {
    e.preventDefault();
    try {
      await api.post(`/estoque/produtos/${movModal.id}/movimentar`, movForm);
      setMovModal(null);
      setMovForm({ tipo: 'entrada', quantidade: 0, motivo: '' });
      carregar();
    } catch (err) {
      alert(err.response?.data?.error || 'Erro ao movimentar estoque');
    }
  }

  const produtosFiltrados = produtos.filter(p => {
    if (filtroAba === 'racao') return (p.categoria || '').toLowerCase().includes('ração');
    if (filtroAba === 'medicamentos') return (p.categoria || '').toLowerCase().includes('medicamento');
    return true;
  });

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1>📦 Controle de Estoque</h1>
          <p>Ração, medicamentos, brinquedos com alerta de reposição e validade</p>
        </div>
        <button className="btn btn-primary" onClick={() => abrirModal()}>+ Novo Produto</button>
      </div>

      {/* Abas de Filtros Rápidos */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, overflowX: 'auto', paddingBottom: 4 }}>
        <button className={`btn ${filtroAba === 'todos' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFiltroAba('todos')}>
          📦 Todos Os Produtos
        </button>
        <button className={`btn ${filtroAba === 'baixo' ? 'btn-danger' : 'btn-secondary'}`} onClick={() => setFiltroAba('baixo')}>
          ⚠️ Baixo Estoque
        </button>
        <button className={`btn ${filtroAba === 'vencer' ? 'btn-warning' : 'btn-secondary'}`} onClick={() => setFiltroAba('vencer')}>
          ⏰ A Vencer (60 Dias)
        </button>
        <button className={`btn ${filtroAba === 'racao' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFiltroAba('racao')}>
          🦴 Rações
        </button>
        <button className={`btn ${filtroAba === 'medicamentos' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFiltroAba('medicamentos')}>
          💉 Medicamentos
        </button>
      </div>

      <div className="card">
        <div className="search-bar">
          <input placeholder="Buscar por nome, descrição ou código de barras..." value={busca} onChange={(e) => setBusca(e.target.value)} />
        </div>

        {produtosFiltrados.length === 0 ? (
          <div className="empty-state">
            <div className="emoji">📦</div>
            <p>Nenhum produto encontrado neste filtro</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Produto</th>
                <th>Categoria</th>
                <th>Estoque Atual</th>
                <th>Validade / Lote</th>
                <th>Preço Custo</th>
                <th>Preço Venda</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {produtosFiltrados.map((p) => {
                const hoje = new Date();
                const dtValidade = p.data_validade ? new Date(p.data_validade) : null;
                const diasParaVencer = dtValidade ? Math.ceil((dtValidade - hoje) / (1000 * 60 * 60 * 24)) : null;

                return (
                  <tr key={p.id}>
                    <td>
                      <strong>{p.nome}</strong>
                      {p.descricao && <><br/><small style={{ color: 'var(--text-light)' }}>{p.descricao}</small></>}
                    </td>
                    <td><span className="badge badge-gray">{p.categoria || 'Geral'}</span></td>
                    <td>
                      <strong>{p.quantidade}</strong> {p.unidade_medida || 'un'}
                      <br /><small style={{ color: 'var(--text-light)' }}>Mín: {p.estoque_minimo}</small>
                    </td>
                    <td>
                      {p.data_validade ? (
                        <div>
                          <small style={{ fontWeight: 600, color: diasParaVencer <= 30 ? 'var(--danger)' : 'var(--text)' }}>
                            📅 {new Date(p.data_validade + 'T00:00:00').toLocaleDateString('pt-BR')}
                          </small>
                          {p.numero_lote && <small style={{ display: 'block', color: 'var(--text-light)' }}>Lote: {p.numero_lote}</small>}
                        </div>
                      ) : '—'}
                    </td>
                    <td>R$ {(p.preco_custo || 0).toFixed(2).replace('.', ',')}</td>
                    <td><strong>R$ {(p.preco_venda || 0).toFixed(2).replace('.', ',')}</strong></td>
                    <td>
                      {p.quantidade <= 0 ? <span className="badge badge-danger">Sem Estoque</span> :
                       p.quantidade <= p.estoque_minimo ? <span className="badge badge-danger">Baixo Estoque</span> :
                       diasParaVencer !== null && diasParaVencer <= 30 ? <span className="badge badge-warning">A Vencer ({diasParaVencer}d)</span> :
                       <span className="badge badge-success">OK</span>}
                    </td>
                    <td>
                      <button className="btn btn-sm btn-secondary" onClick={() => abrirModal(p)} title="Editar">✏️</button>{' '}
                      <button className="btn btn-sm btn-primary" onClick={() => setMovModal(p)} title="Movimentação de Entrada/Saída">↔️</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* --- MODAL PRODUTO --- */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 700 }}>
            <div className="modal-header">
              <h2>{editando ? 'Editar Produto' : 'Novo Produto'}</h2>
              <button onClick={() => setModal(false)}>×</button>
            </div>
            <form onSubmit={salvar}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Nome do Produto *</label>
                  <input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} required placeholder="Ex: Ração Premier Raças Pequenas 10kg" />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Categoria *</label>
                    <select value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })}>
                      {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Unidade de Medida</label>
                    <select value={form.unidade_medida} onChange={(e) => setForm({ ...form, unidade_medida: e.target.value })}>
                      <option value="un">Unidade (un)</option>
                      <option value="kg">Quilo (kg)</option>
                      <option value="l">Litro (l)</option>
                      <option value="cx">Caixa (cx)</option>
                      <option value="pct">Pacote (pct)</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Preço de Custo (R$)</label>
                    <input type="number" step="0.01" value={form.preco_custo} onChange={(e) => setForm({ ...form, preco_custo: parseFloat(e.target.value) || 0 })} />
                  </div>
                  <div className="form-group">
                    <label>Preço de Venda (R$) *</label>
                    <input type="number" step="0.01" value={form.preco_venda} onChange={(e) => setForm({ ...form, preco_venda: parseFloat(e.target.value) || 0 })} required />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Quantidade Em Estoque</label>
                    <input type="number" value={form.quantidade} onChange={(e) => setForm({ ...form, quantidade: parseInt(e.target.value) || 0 })} />
                  </div>
                  <div className="form-group">
                    <label>Estoque Mínimo (Alerta)</label>
                    <input type="number" value={form.estoque_minimo} onChange={(e) => setForm({ ...form, estoque_minimo: parseInt(e.target.value) || 0 })} />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Data de Validade (Opcional)</label>
                    <input type="date" value={form.data_validade || ''} onChange={(e) => setForm({ ...form, data_validade: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Número do Lote</label>
                    <input value={form.numero_lote || ''} onChange={(e) => setForm({ ...form, numero_lote: e.target.value })} placeholder="Ex: LOT-2026-X9" />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Fornecedor</label>
                    <input value={form.fornecedor || ''} onChange={(e) => setForm({ ...form, fornecedor: e.target.value })} placeholder="Ex: Distribuidora Pet" />
                  </div>
                  <div className="form-group">
                    <label>Código de Barras</label>
                    <input value={form.codigo_barras || ''} onChange={(e) => setForm({ ...form, codigo_barras: e.target.value })} placeholder="Ex: 7891234567890" />
                  </div>
                </div>

                <div className="form-group">
                  <label>Descrição Adicional</label>
                  <textarea rows="2" value={form.descricao || ''} onChange={(e) => setForm({ ...form, descricao: e.target.value })} placeholder="Ex: Ração super premium com ômega 3." />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Salvar Produto</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL MOVIMENTACAO --- */}
      {movModal && (
        <div className="modal-overlay" onClick={() => setMovModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Movimentação: {movModal.nome}</h2>
              <button onClick={() => setMovModal(null)}>×</button>
            </div>
            <form onSubmit={salvarMov}>
              <div className="modal-body">
                <p style={{ marginBottom: 12, color: 'var(--text-light)' }}>Estoque atual: <strong>{movModal.quantidade} {movModal.unidade_medida || 'un'}</strong></p>
                <div className="form-group">
                  <label>Tipo de Movimentação</label>
                  <select value={movForm.tipo} onChange={(e) => setMovForm({ ...movForm, tipo: e.target.value })}>
                    <option value="entrada">📥 Entrada (Compra / Reabastecimento)</option>
                    <option value="saida">📤 Saída (Consumo / Descarte)</option>
                    <option value="ajuste">🔧 Ajuste (Balanço / Inventário)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Quantidade *</label>
                  <input type="number" min="1" value={movForm.quantidade} onChange={(e) => setMovForm({ ...movForm, quantidade: parseInt(e.target.value) || 0 })} required />
                </div>
                <div className="form-group">
                  <label>Motivo / Observação</label>
                  <input value={movForm.motivo} onChange={(e) => setMovForm({ ...movForm, motivo: e.target.value })} placeholder="Ex: Compra com NF #1234" />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setMovModal(null)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Confirmar Movimentação</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
