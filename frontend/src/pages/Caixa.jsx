import { useEffect, useState } from 'react';
import api from '../services/api';

export default function Caixa() {
  const [lancamentos, setLancamentos] = useState([]);
  const [resumo, setResumo] = useState({ saldo: 0, entradas: 0, saidas: 0 });
  const [abaAtiva, setAbaAtiva] = useState('extrato'); // 'extrato' | 'contas'
  const [modal, setModal] = useState(false); // 'venda' | 'compra' | 'manual' | 'nfse' | 'sucesso' | false
  
  const [nfseSelecao, setNfseSelecao] = useState(null);
  const [sucessoTransacao, setSucessoTransacao] = useState(null);
  
  const [clientes, setClientes] = useState([]);
  const [produtos, setProdutos] = useState([]);

  // Form states
  const [vendaForm, setVendaForm] = useState({
    cliente_id: '', desconto: 0, forma_pagamento: 'Dinheiro', observacoes: '', itens: []
  });
  const [compraForm, setCompraForm] = useState({
    forma_pagamento: 'Dinheiro', observacoes: '', itens: []
  });
  const [manualForm, setManualForm] = useState({
    tipo: 'entrada', valor: '', descricao: '', forma_pagamento: 'Dinheiro', categoria: 'outro', cliente_id: ''
  });

  const [itemVendaTemp, setItemVendaTemp] = useState({ item_id: '', quantidade: 1 });
  const [itemCompraTemp, setItemCompraTemp] = useState({ item_id: '', quantidade: 1, preco_unitario: 0 });

  useEffect(() => {
    carregar();
  }, []);

  function carregar() {
    api.get('/caixa').then(({ data }) => setLancamentos(data));
    api.get('/caixa/saldo/resumo').then(({ data }) => setResumo(data));
  }

  function abrirModal(tipo) {
    setModal(tipo);
    if (tipo === 'venda' || tipo === 'manual' || tipo === 'nfse') {
      api.get('/clientes')
        .then(({ data }) => setClientes(Array.isArray(data) ? data : (data.data || [])))
        .catch(() => setClientes([]));
    }
    if (tipo === 'venda' || tipo === 'compra') {
      api.get('/estoque/produtos')
        .then(({ data }) => setProdutos(Array.isArray(data) ? data : (data.data || [])))
        .catch(() => setProdutos([]));
    }
    setVendaForm({ cliente_id: '', desconto: 0, forma_pagamento: 'Dinheiro', observacoes: '', itens: [] });
    setCompraForm({ forma_pagamento: 'Dinheiro', observacoes: '', itens: [] });
    setManualForm({ tipo: 'entrada', valor: '', descricao: '', forma_pagamento: 'Dinheiro', categoria: 'outro', cliente_id: '' });
    setItemVendaTemp({ item_id: '', quantidade: 1 });
    setItemCompraTemp({ item_id: '', quantidade: 1, preco_unitario: 0 });
  }

  function emitirNotaSimples(lancamento) {
    setNfseSelecao(lancamento);
    setModal('nfse');
  }

  // --- Venda ---
  function adicionarItemVenda() {
    if (!itemVendaTemp.item_id) return;
    const prod = produtos.find(p => p.id == itemVendaTemp.item_id);
    if (!prod) return;
    if (vendaForm.itens.some(i => i.item_id == prod.id)) {
      alert('Produto já adicionado no carrinho');
      return;
    }

    setVendaForm({
      ...vendaForm,
      itens: [...vendaForm.itens, {
        item_id: prod.id,
        nome: prod.nome,
        quantidade: itemVendaTemp.quantidade,
        preco_unitario: prod.preco_venda
      }]
    });
    setItemVendaTemp({ item_id: '', quantidade: 1 });
  }

  function removerItemVenda(idx) {
    setVendaForm({ ...vendaForm, itens: vendaForm.itens.filter((_, i) => i !== idx) });
  }

  async function salvarVenda(e) {
    e.preventDefault();
    if (vendaForm.itens.length === 0) {
      alert('Adicione pelo menos um produto');
      return;
    }
    try {
      const { data } = await api.post('/caixa/venda-produto', vendaForm);
      setSucessoTransacao({ id: data.id, tipo: 'venda', valor: data.valor, descricao: 'Venda de Produtos' });
      setModal('sucesso');
      carregar();
    } catch (err) {
      alert(err.response?.data?.error || 'Erro ao registrar venda');
    }
  }

  // --- Compra / Reabastecimento ---
  function adicionarItemCompra() {
    if (!itemCompraTemp.item_id) return;
    const prod = produtos.find(p => p.id == itemCompraTemp.item_id);
    if (!prod) return;

    const precoUn = parseFloat(itemCompraTemp.preco_unitario) || prod.preco_custo || 0;
    setCompraForm({
      ...compraForm,
      itens: [...compraForm.itens, {
        item_id: prod.id,
        nome: prod.nome,
        quantidade: itemCompraTemp.quantidade,
        preco_unitario: precoUn
      }]
    });
    setItemCompraTemp({ item_id: '', quantidade: 1, preco_unitario: 0 });
  }

  function removerItemCompra(idx) {
    setCompraForm({ ...compraForm, itens: compraForm.itens.filter((_, i) => i !== idx) });
  }

  async function salvarCompra(e) {
    e.preventDefault();
    if (compraForm.itens.length === 0) {
      alert('Adicione pelo menos um produto');
      return;
    }
    try {
      const { data } = await api.post('/caixa/compra-produto', compraForm);
      setSucessoTransacao({ id: data.id, tipo: 'compra', valor: data.valor, descricao: 'Reabastecimento de Estoque' });
      setModal('sucesso');
      carregar();
    } catch (err) {
      alert(err.response?.data?.error || 'Erro ao registrar compra');
    }
  }

  async function salvarManual(e) {
    e.preventDefault();
    try {
      const { data } = await api.post('/caixa/transacao', manualForm);
      setSucessoTransacao({ id: data.id, tipo: data.tipo, valor: data.valor, descricao: data.descricao });
      setModal('sucesso');
      carregar();
    } catch (err) {
      alert(err.response?.data?.error || 'Erro ao registrar lançamento');
    }
  }

  async function baixarComprovante(id) {
    try {
      const response = await api.get(`/caixa/${id}/comprovante`, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const win = window.open(url, '_blank');
      if (!win) {
        const link = document.createElement('a');
        link.href = url;
        link.download = `recibo_${id}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (err) {
      const token = localStorage.getItem('token');
      window.open(`/api/caixa/${id}/comprovante?token=${token}`, '_blank');
    }
  }

  const subtotalVenda = vendaForm.itens.reduce((acc, i) => acc + i.quantidade * i.preco_unitario, 0);
  const totalVenda = Math.max(0, subtotalVenda - (vendaForm.desconto || 0));
  const totalCompra = compraForm.itens.reduce((acc, i) => acc + i.quantidade * i.preco_unitario, 0);

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1>🏦 Financeiro & Fluxo de Caixa</h1>
          <p>Contas a pagar/receber, fluxo de caixa e emissão de notas fiscais simples</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-primary" onClick={() => abrirModal('venda')}>🛍️ Venda de Produtos</button>
          <button className="btn btn-secondary" onClick={() => abrirModal('compra')}>📦 Compra de Estoque</button>
          <button className="btn btn-secondary" onClick={() => abrirModal('manual')}>💸 Lançamento Manual</button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="dashboard-grid" style={{ marginBottom: 20 }}>
        <div className="stat-card" style={{ background: resumo.saldo >= 0 ? '#ecfdf5' : '#fef2f2', border: '1px solid ' + (resumo.saldo >= 0 ? 'var(--success)' : 'var(--danger)') }}>
          <span className="icon" style={{ fontSize: 24 }}>💰</span>
          <div className="label">Saldo em Caixa</div>
          <div className="value" style={{ color: resumo.saldo >= 0 ? '#065f46' : 'var(--danger)' }}>
            R$ {(resumo.saldo || 0).toFixed(2).replace('.', ',')}
          </div>
        </div>
        <div className="stat-card">
          <span className="icon">🟢</span>
          <div className="label">Entradas Totais (Receitas)</div>
          <div className="value" style={{ color: 'var(--success)' }}>
            R$ {(resumo.entradas || 0).toFixed(2).replace('.', ',')}
          </div>
        </div>
        <div className="stat-card">
          <span className="icon">🔴</span>
          <div className="label">Saídas Totais (Despesas)</div>
          <div className="value" style={{ color: 'var(--danger)' }}>
            R$ {(resumo.saidas || 0).toFixed(2).replace('.', ',')}
          </div>
        </div>
      </div>

      {/* Abas Financeiras */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button className={`btn ${abaAtiva === 'extrato' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setAbaAtiva('extrato')}>
          📊 Fluxo & Extrato
        </button>
        <button className={`btn ${abaAtiva === 'contas' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setAbaAtiva('contas')}>
          📄 Contas a Pagar / Receber
        </button>
      </div>

      {/* ABA EXTRATO */}
      {abaAtiva === 'extrato' && (
        <div className="card">
          <h2 style={{ marginBottom: 16 }}>📊 Extrato Financeiro em Tempo Real</h2>
          {lancamentos.length === 0 ? (
            <div className="empty-state"><p>Nenhum lançamento registrado no caixa</p></div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Cód</th>
                  <th>Data</th>
                  <th>Tipo / Categoria</th>
                  <th>Descrição</th>
                  <th>Forma Pag.</th>
                  <th>Valor</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {lancamentos.map((l) => (
                  <tr key={l.id}>
                    <td>#{String(l.id).padStart(6, '0')}</td>
                    <td>{new Date(l.criado_em).toLocaleString('pt-BR')}</td>
                    <td>
                      <span className={`badge badge-${l.tipo === 'entrada' ? 'success' : 'danger'}`}>
                        {l.tipo === 'entrada' ? 'Entrada' : 'Saída'}
                      </span>
                      <small style={{ display: 'block', color: 'var(--text-light)', marginTop: 2 }}>
                        {(l.categoria || '').replace('_', ' ')}
                      </small>
                    </td>
                    <td>
                      {l.descricao}
                      {l.cliente_nome && <><br/><small style={{ color: 'var(--text-light)' }}>Tutor: {l.cliente_nome}</small></>}
                    </td>
                    <td>{l.forma_pagamento || 'Dinheiro'}</td>
                    <td style={{ color: l.tipo === 'entrada' ? 'var(--success)' : 'var(--danger)', fontWeight: 700 }}>
                      {l.tipo === 'entrada' ? '+' : '-'} R$ {(l.valor || 0).toFixed(2).replace('.', ',')}
                    </td>
                    <td>
                      <button className="btn btn-sm btn-secondary" onClick={() => baixarComprovante(l.id)}>📄 Recibo PDF</button>{' '}
                      {l.tipo === 'entrada' && (
                        <button className="btn btn-sm btn-primary" onClick={() => emitirNotaSimples(l)} title="Emitir Nota Fiscal Simples">🧾 Nota Simples</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ABA CONTAS A PAGAR E RECEBER */}
      {abaAtiva === 'contas' && (
        <div className="card">
          <h2 style={{ marginBottom: 16 }}>📄 Contas a Pagar e Contas a Receber</h2>
          <table>
            <thead>
              <tr>
                <th>Lançamento</th>
                <th>Tipo</th>
                <th>Vencimento</th>
                <th>Descrição / Beneficiário</th>
                <th>Valor</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {lancamentos.map((l) => (
                <tr key={l.id}>
                  <td>#{String(l.id).padStart(6, '0')}</td>
                  <td>
                    <span className={`badge badge-${l.tipo === 'entrada' ? 'success' : 'danger'}`}>
                      {l.tipo === 'entrada' ? 'A Receber' : 'A Pagar'}
                    </span>
                  </td>
                  <td>{l.data_vencimento || new Date(l.criado_em).toLocaleDateString('pt-BR')}</td>
                  <td>{l.descricao}</td>
                  <td><strong>R$ {(l.valor || 0).toFixed(2).replace('.', ',')}</strong></td>
                  <td>
                    <span className={`badge badge-${l.status === 'pago' ? 'success' : 'warning'}`}>
                      {l.status === 'pago' ? '🟢 Quitado' : '🟡 Pendente'}
                    </span>
                  </td>
                  <td>
                    <button className="btn btn-sm btn-secondary" onClick={() => baixarComprovante(l.id)}>📄 Recibo PDF</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* --- MODAL VENDA DE PRODUTOS --- */}
      {modal === 'venda' && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 720 }}>
            <div className="modal-header">
              <h2>🛍️ Venda de Produtos no Caixa</h2>
              <button onClick={() => setModal(false)}>×</button>
            </div>
            <form onSubmit={salvarVenda}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Cliente / Tutor *</label>
                  <select value={vendaForm.cliente_id} onChange={(e) => setVendaForm({ ...vendaForm, cliente_id: e.target.value })} required>
                    <option value="">Selecione o tutor...</option>
                    {clientes.map(c => <option key={c.id} value={c.id}>{c.nome} ({c.telefone})</option>)}
                  </select>
                </div>

                <div style={{ background: '#f9fafb', padding: 14, borderRadius: 8, marginBottom: 16, border: '1px solid var(--border)' }}>
                  <strong>Adicionar Produto ao Carrinho</strong>
                  <div className="form-row" style={{ marginTop: 10, marginBottom: 0 }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label>Produto</label>
                      <select value={itemVendaTemp.item_id} onChange={(e) => setItemVendaTemp({ ...itemVendaTemp, item_id: e.target.value })}>
                        <option value="">Selecione...</option>
                        {produtos.map(p => (
                          <option key={p.id} value={p.id} disabled={p.quantidade <= 0}>
                            {p.nome} - R$ {(p.preco_venda || 0).toFixed(2).replace('.', ',')} (Estoque: {p.quantidade})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label>Qtd</label>
                      <input type="number" min="1" value={itemVendaTemp.quantidade} onChange={(e) => setItemVendaTemp({ ...itemVendaTemp, quantidade: parseInt(e.target.value) || 1 })} />
                    </div>
                  </div>
                  <button type="button" className="btn btn-primary" style={{ marginTop: 10, width: '100%', justifyContent: 'center' }} onClick={adicionarItemVenda}>
                    + Inserir no Carrinho
                  </button>
                </div>

                {vendaForm.itens.length > 0 && (
                  <table style={{ marginBottom: 16 }}>
                    <thead>
                      <tr><th>Item</th><th>Qtd</th><th>Unit.</th><th>Subtotal</th><th></th></tr>
                    </thead>
                    <tbody>
                      {vendaForm.itens.map((i, idx) => (
                        <tr key={idx}>
                          <td>{i.nome}</td>
                          <td>{i.quantidade}</td>
                          <td>R$ {i.preco_unitario.toFixed(2).replace('.', ',')}</td>
                          <td><strong>R$ {(i.quantidade * i.preco_unitario).toFixed(2).replace('.', ',')}</strong></td>
                          <td><button type="button" className="btn btn-sm btn-danger" onClick={() => removerItemVenda(idx)}>🗑️</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                <div className="form-row">
                  <div className="form-group">
                    <label>Desconto (R$)</label>
                    <input type="number" step="0.01" value={vendaForm.desconto} onChange={(e) => setVendaForm({ ...vendaForm, desconto: parseFloat(e.target.value) || 0 })} />
                  </div>
                  <div className="form-group">
                    <label>Forma de Pagamento</label>
                    <select value={vendaForm.forma_pagamento} onChange={(e) => setVendaForm({ ...vendaForm, forma_pagamento: e.target.value })}>
                      <option>Dinheiro</option>
                      <option>PIX</option>
                      <option>Cartão de Crédito</option>
                      <option>Cartão de Débito</option>
                    </select>
                  </div>
                </div>

                <div style={{ background: 'var(--primary)', color: 'white', padding: 12, borderRadius: 8, textAlign: 'right', fontSize: 18, fontWeight: 700 }}>
                  TOTAL A PAGAR: R$ {totalVenda.toFixed(2).replace('.', ',')}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-success">Finalizar e Baixar Estoque</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL COMPRA DE ESTOQUE / REABASTECIMENTO --- */}
      {modal === 'compra' && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 720 }}>
            <div className="modal-header">
              <h2>📦 Compra / Reabastecimento de Estoque</h2>
              <button onClick={() => setModal(false)}>×</button>
            </div>
            <form onSubmit={salvarCompra}>
              <div className="modal-body">
                <div style={{ background: '#f9fafb', padding: 14, borderRadius: 8, marginBottom: 16, border: '1px solid var(--border)' }}>
                  <strong>Adicionar Produto à Compra</strong>
                  <div className="form-row" style={{ marginTop: 10, marginBottom: 0 }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label>Produto</label>
                      <select value={itemCompraTemp.item_id} onChange={(e) => {
                        const prod = produtos.find(p => p.id == e.target.value);
                        setItemCompraTemp({
                          ...itemCompraTemp,
                          item_id: e.target.value,
                          preco_unitario: prod ? prod.preco_custo || 0 : 0
                        });
                      }}>
                        <option value="">Selecione o produto...</option>
                        {produtos.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.nome} (Estoque atual: {p.quantidade})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label>Preço Custo Unit. (R$)</label>
                      <input type="number" step="0.01" value={itemCompraTemp.preco_unitario} onChange={(e) => setItemCompraTemp({ ...itemCompraTemp, preco_unitario: parseFloat(e.target.value) || 0 })} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label>Qtd Comprada</label>
                      <input type="number" min="1" value={itemCompraTemp.quantidade} onChange={(e) => setItemCompraTemp({ ...itemCompraTemp, quantidade: parseInt(e.target.value) || 1 })} />
                    </div>
                  </div>
                  <button type="button" className="btn btn-primary" style={{ marginTop: 10, width: '100%', justifyContent: 'center' }} onClick={adicionarItemCompra}>
                    + Inserir na Compra
                  </button>
                </div>

                {compraForm.itens.length > 0 && (
                  <table style={{ marginBottom: 16 }}>
                    <thead>
                      <tr><th>Item</th><th>Qtd</th><th>Custo Unit.</th><th>Subtotal</th><th></th></tr>
                    </thead>
                    <tbody>
                      {compraForm.itens.map((i, idx) => (
                        <tr key={idx}>
                          <td>{i.nome}</td>
                          <td>{i.quantidade}</td>
                          <td>R$ {i.preco_unitario.toFixed(2).replace('.', ',')}</td>
                          <td><strong>R$ {(i.quantidade * i.preco_unitario).toFixed(2).replace('.', ',')}</strong></td>
                          <td><button type="button" className="btn btn-sm btn-danger" onClick={() => removerItemCompra(idx)}>🗑️</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                <div className="form-row">
                  <div className="form-group">
                    <label>Forma de Pagamento</label>
                    <select value={compraForm.forma_pagamento} onChange={(e) => setCompraForm({ ...compraForm, forma_pagamento: e.target.value })}>
                      <option>Dinheiro</option>
                      <option>PIX</option>
                      <option>Cartão de Crédito</option>
                      <option>Boleto</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Observações / Fornecedor</label>
                    <input value={compraForm.observacoes} onChange={(e) => setCompraForm({ ...compraForm, observacoes: e.target.value })} placeholder="Ex: Compra de ração com Nota Fornecedor #1024" />
                  </div>
                </div>

                <div style={{ background: '#fee2e2', color: '#991b1b', padding: 12, borderRadius: 8, textAlign: 'right', fontSize: 18, fontWeight: 700 }}>
                  TOTAL DA COMPRA (SAÍDA DO CAIXA): R$ {totalCompra.toFixed(2).replace('.', ',')}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-danger">Confirmar Compra & Entrada de Estoque</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL LANÇAMENTO MANUAL --- */}
      {modal === 'manual' && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 600 }}>
            <div className="modal-header">
              <h2>💸 Lançamento Manual no Caixa</h2>
              <button onClick={() => setModal(false)}>×</button>
            </div>
            <form onSubmit={salvarManual}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label>Tipo de Lançamento *</label>
                    <select value={manualForm.tipo} onChange={(e) => setManualForm({ ...manualForm, tipo: e.target.value })}>
                      <option value="entrada">🟢 Entrada (Receita / Ganho)</option>
                      <option value="saida">🔴 Saída (Despesa / Custo)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Valor (R$) *</label>
                    <input type="number" step="0.01" min="0.01" value={manualForm.valor} onChange={(e) => setManualForm({ ...manualForm, valor: e.target.value })} placeholder="0.00" required />
                  </div>
                </div>

                <div className="form-group">
                  <label>Descrição do Lançamento *</label>
                  <input value={manualForm.descricao} onChange={(e) => setManualForm({ ...manualForm, descricao: e.target.value })} placeholder="Ex: Pagamento da conta de luz / Venda avulsa de acessório" required />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Categoria *</label>
                    <select value={manualForm.categoria} onChange={(e) => setManualForm({ ...manualForm, categoria: e.target.value })}>
                      <option value="outro">Outro / Geral</option>
                      <option value="venda_produto">Venda de Produtos</option>
                      <option value="servico">Serviços do Petshop</option>
                      <option value="compra_produto">Compra de Estoque</option>
                      <option value="aluguel">Aluguel do Imóvel</option>
                      <option value="luz_agua_internet">Luz / Água / Internet</option>
                      <option value="salarios">Folha de Pagamento / Salários</option>
                      <option value="impostos">Impostos / Simples Nacional</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Forma de Pagamento</label>
                    <select value={manualForm.forma_pagamento} onChange={(e) => setManualForm({ ...manualForm, forma_pagamento: e.target.value })}>
                      <option>Dinheiro</option>
                      <option>PIX</option>
                      <option>Cartão de Crédito</option>
                      <option>Cartão de Débito</option>
                      <option>Transferência</option>
                      <option>Boleto</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Cliente / Tutor (Opcional)</label>
                  <select value={manualForm.cliente_id} onChange={(e) => setManualForm({ ...manualForm, cliente_id: e.target.value })}>
                    <option value="">Nenhum / Não associado</option>
                    {clientes.map(c => <option key={c.id} value={c.id}>{c.nome} ({c.telefone})</option>)}
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Salvar Lançamento no Caixa</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL SUCESSO / EMBUTIDO COM RECIBO --- */}
      {modal === 'sucesso' && sucessoTransacao && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 500, textAlign: 'center' }}>
            <div className="modal-header">
              <h2>🎉 Transação Concluída com Sucesso!</h2>
              <button onClick={() => setModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
              <h3 style={{ margin: 0, color: 'var(--success)' }}>{sucessoTransacao.descricao}</h3>
              <p style={{ fontSize: 20, fontWeight: 'bold', marginTop: 8 }}>
                Valor: R$ {(sucessoTransacao.valor || 0).toFixed(2).replace('.', ',')}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 20 }}>
                <button className="btn btn-primary" style={{ justifyContent: 'center' }} onClick={() => baixarComprovante(sucessoTransacao.id)}>
                  📄 Baixar Recibo em PDF
                </button>
                <button className="btn btn-secondary" style={{ justifyContent: 'center' }} onClick={() => {
                  const l = lancamentos.find(item => item.id === sucessoTransacao.id) || { id: sucessoTransacao.id, valor: sucessoTransacao.valor, descricao: sucessoTransacao.descricao, criado_em: new Date().toISOString() };
                  emitirNotaSimples(l);
                }}>
                  🧾 Emitir Nota Fiscal Simples Nacional
                </button>
              </div>
            </div>
            <div className="modal-footer" style={{ justifyContent: 'center' }}>
              <button className="btn btn-secondary" onClick={() => setModal(false)}>Concluir</button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL EMISSAO NOTA FISCAL SIMPLES (NFS-e) --- */}
      {modal === 'nfse' && nfseSelecao && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 650 }}>
            <div className="modal-header">
              <h2>🧾 Nota Fiscal Simples Nacional (NFS-e)</h2>
              <button onClick={() => setModal(false)}>×</button>
            </div>
            <div className="modal-body" style={{ background: '#fdfbf7', border: '1px solid #f3e8d2', borderRadius: 8, padding: 20, fontFamily: 'monospace' }}>
              <div style={{ textAlign: 'center', borderBottom: '2px dashed #ccc', paddingBottom: 12, marginBottom: 12 }}>
                <h3 style={{ margin: 0 }}>🐾 PETSHOP PRO LTDA</h3>
                <p style={{ margin: '4px 0 0', fontSize: 12 }}>CNPJ: 12.345.678/0001-90 | IE: 987.654.321.000</p>
                <p style={{ margin: 0, fontSize: 12 }}>Rua dos Pets, 100 - Centro - São Paulo/SP</p>
                <h4 style={{ margin: '10px 0 0' }}>DANFE SIMPLIFICADO - NOTA FISCAL DE SERVIÇOS/PRODUTOS</h4>
                <p style={{ margin: 0, fontSize: 11 }}>NÚMERO DA NOTA: <strong>NFS-2026-00{nfseSelecao.id}</strong></p>
              </div>

              <div style={{ fontSize: 12, marginBottom: 12 }}>
                <p style={{ margin: 0 }}><strong>CLIENTE/TOMADOR:</strong> {nfseSelecao.cliente_nome || 'Consumidor Final'}</p>
                <p style={{ margin: 0 }}><strong>DATA EMISSÃO:</strong> {new Date(nfseSelecao.criado_em).toLocaleString('pt-BR')}</p>
                <p style={{ margin: 0 }}><strong>FORMA DE PAGAMENTO:</strong> {nfseSelecao.forma_pagamento || 'PIX'}</p>
              </div>

              <div style={{ borderTop: '1px dashed #ccc', borderBottom: '1px dashed #ccc', padding: '8px 0', marginBottom: 12, fontSize: 12 }}>
                <p style={{ margin: 0 }}><strong>DESCRIÇÃO DOS SERVIÇOS / PRODUTOS:</strong></p>
                <p style={{ margin: '4px 0' }}>• {nfseSelecao.descricao}</p>
              </div>

              <div style={{ textAlign: 'right', fontSize: 14, fontWeight: 'bold' }}>
                VALOR TOTAL: R$ {(nfseSelecao.valor || 0).toFixed(2).replace('.', ',')}
              </div>

              <div style={{ marginTop: 12, fontSize: 10, color: '#666', borderTop: '1px solid #eee', paddingTop: 8 }}>
                <p style={{ margin: 0 }}>Empresa optante pelo Simples Nacional. Alíquota Efetiva ISS: 4,00%</p>
                <p style={{ margin: 0 }}>Valor Aproximado de Tributos (IBPT): R$ {((nfseSelecao.valor || 0) * 0.1345).toFixed(2).replace('.', ',')} (13,45%)</p>
                <p style={{ margin: '4px 0 0', textAlign: 'center', fontWeight: 'bold' }}>CÓDIGO DE AUTENTICIDADE: {Math.random().toString(36).substring(2, 10).toUpperCase()}</p>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setModal(false)}>Fechar</button>
              <button className="btn btn-primary" onClick={() => window.print()}>🖨️ Imprimir Nota Fiscal</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
