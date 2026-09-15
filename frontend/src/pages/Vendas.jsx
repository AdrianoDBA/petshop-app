import { useEffect, useState } from 'react';
import api from '../services/api';

export default function Vendas() {
  const [vendas, setVendas] = useState([]);
  const [modal, setModal] = useState(false);
  const [clientes, setClientes] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [servicos, setServicos] = useState([]);
  const [form, setForm] = useState({
    cliente_id: '', desconto: 0, forma_pagamento: 'Dinheiro', observacoes: '', itens: []
  });
  const [itemTemp, setItemTemp] = useState({ tipo: 'servico', item_id: '', quantidade: 1 });

  useEffect(() => { carregar(); }, []);

  function carregar() {
    api.get('/vendas').then(({ data }) => setVendas(data));
  }

  function abrirModal() {
    api.get('/clientes')
      .then(({ data }) => setClientes(Array.isArray(data) ? data : (data.data || [])))
      .catch(() => setClientes([]));
    api.get('/estoque/produtos')
      .then(({ data }) => setProdutos(Array.isArray(data) ? data : (data.data || [])))
      .catch(() => setProdutos([]));
    api.get('/agendamentos/servicos').then(({ data }) => setServicos(data));
    setForm({ cliente_id: '', desconto: 0, forma_pagamento: 'Dinheiro', observacoes: '', itens: [] });
    setItemTemp({ tipo: 'servico', item_id: '', quantidade: 1 });
    setModal(true);
  }

  function adicionarItem() {
    if (!itemTemp.item_id) return;
    const lista = itemTemp.tipo === 'servico' ? servicos : produtos;
    const item = lista.find((i) => i.id == itemTemp.item_id);
    if (!item) return;
    // Serviços têm campo `preco`; produtos têm `preco_venda`.
    const precoUnitario = itemTemp.tipo === 'servico' ? item.preco : item.preco_venda;
    const novo = {
      tipo: itemTemp.tipo,
      item_id: item.id,
      nome: item.nome,
      quantidade: itemTemp.quantidade,
      preco_unitario: precoUnitario
    };
    setForm({ ...form, itens: [...form.itens, novo] });
    setItemTemp({ tipo: 'servico', item_id: '', quantidade: 1 });
  }

  function removerItem(idx) {
    const itens = form.itens.filter((_, i) => i !== idx);
    setForm({ ...form, itens });
  }

  async function salvar(e) {
    e.preventDefault();
    if (form.itens.length === 0) {
      alert('Adicione ao menos um item');
      return;
    }
    try {
      const { data } = await api.post('/vendas', form);
      setModal(false);
      carregar();
      if (confirm('Venda registrada! Deseja abrir o comprovante em PDF?')) {
        await baixarComprovante(data.id);
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Erro ao registrar venda');
    }
  }

  async function baixarComprovante(id) {
    try {
      const response = await api.get(`/vendas/${id}/comprovante`, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const win = window.open(url, '_blank');
      if (!win) {
        const link = document.createElement('a');
        link.href = url;
        link.download = `recibo_venda_${id}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (err) {
      const token = localStorage.getItem('token');
      window.open(`/api/vendas/${id}/comprovante?token=${token}`, '_blank');
    }
  }

  const subtotal = form.itens.reduce((acc, i) => acc + i.quantidade * i.preco_unitario, 0);
  const total = Math.max(0, subtotal - (form.desconto || 0));
  const listaItem = itemTemp.tipo === 'servico' ? servicos : produtos;
  const precoExibir = (i) => (i.preco ?? i.preco_venda ?? 0);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>💰 Vendas</h1>
          <p>Registre vendas e gere comprovantes</p>
        </div>
        <button className="btn btn-primary" onClick={abrirModal}>+ Nova Venda</button>
      </div>

      <div className="card">
        {vendas.length === 0 ? (
          <div className="empty-state">
            <div className="emoji">💰</div>
            <p>Nenhuma venda registrada</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Data</th>
                <th>Cliente</th>
                <th>Total</th>
                <th>Pagamento</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {vendas.map((v) => (
                <tr key={v.id}>
                  <td>#{String(v.id).padStart(6, '0')}</td>
                  <td>{new Date(v.criado_em).toLocaleString('pt-BR')}</td>
                  <td>{v.cliente_nome}</td>
                  <td><strong>R$ {Number(v.total || 0).toFixed(2).replace('.', ',')}</strong></td>
                  <td>{v.forma_pagamento || '—'}</td>
                  <td>
                    <span className={`badge badge-${v.status === 'pago' ? 'success' : v.status === 'pendente' ? 'warning' : 'danger'}`}>
                      {v.status || 'pago'}
                    </span>
                  </td>
                  <td>
                    <button className="btn btn-sm btn-secondary" onClick={() => baixarComprovante(v.id)}>📄 PDF</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 720 }}>
            <div className="modal-header">
              <h2>Nova Venda</h2>
              <button onClick={() => setModal(false)}>×</button>
            </div>
            <form onSubmit={salvar}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Cliente *</label>
                  <select value={form.cliente_id} onChange={(e) => setForm({ ...form, cliente_id: e.target.value })} required>
                    <option value="">Selecione...</option>
                    {clientes.map((c) => <option key={c.id} value={c.id}>{c.nome} - {c.telefone}</option>)}
                  </select>
                </div>

                <div style={{ background: '#f9fafb', padding: 16, borderRadius: 8, marginBottom: 16 }}>
                  <strong>Adicionar item</strong>
                  <div className="form-row" style={{ marginTop: 10, marginBottom: 0 }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label>Tipo</label>
                      <select value={itemTemp.tipo} onChange={(e) => setItemTemp({ ...itemTemp, tipo: e.target.value, item_id: '' })}>
                        <option value="servico">Serviço</option>
                        <option value="produto">Produto</option>
                      </select>
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label>Item</label>
                      <select value={itemTemp.item_id} onChange={(e) => setItemTemp({ ...itemTemp, item_id: e.target.value })}>
                        <option value="">Selecione...</option>
                        {listaItem.map((i) => <option key={i.id} value={i.id}>{i.nome} - R$ {precoExibir(i).toFixed(2).replace('.', ',')}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="form-row" style={{ marginTop: 8, marginBottom: 0 }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label>Qtd</label>
                      <input type="number" min="1" value={itemTemp.quantidade} onChange={(e) => setItemTemp({ ...itemTemp, quantidade: parseInt(e.target.value) || 1 })} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0, display: 'flex', alignItems: 'flex-end' }}>
                      <button type="button" className="btn btn-primary" onClick={adicionarItem}>+ Adicionar</button>
                    </div>
                  </div>
                </div>

                {form.itens.length > 0 && (
                  <table style={{ marginBottom: 16 }}>
                    <thead>
                      <tr><th>Item</th><th>Qtd</th><th>Vlr Unit</th><th>Subtotal</th><th></th></tr>
                    </thead>
                    <tbody>
                      {form.itens.map((i, idx) => (
                        <tr key={idx}>
                          <td>{i.nome}</td>
                          <td>{i.quantidade}</td>
                          <td>R$ {i.preco_unitario.toFixed(2).replace('.', ',')}</td>
                          <td><strong>R$ {(i.quantidade * i.preco_unitario).toFixed(2).replace('.', ',')}</strong></td>
                          <td><button type="button" className="btn btn-sm btn-danger" onClick={() => removerItem(idx)}>🗑️</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                <div className="form-row">
                  <div className="form-group">
                    <label>Desconto (R$)</label>
                    <input type="number" step="0.01" value={form.desconto} onChange={(e) => setForm({ ...form, desconto: parseFloat(e.target.value) || 0 })} />
                  </div>
                  <div className="form-group">
                    <label>Forma de Pagamento</label>
                    <select value={form.forma_pagamento} onChange={(e) => setForm({ ...form, forma_pagamento: e.target.value })}>
                      <option>Dinheiro</option>
                      <option>PIX</option>
                      <option>Cartão de Crédito</option>
                      <option>Cartão de Débito</option>
                      <option>Transferência</option>
                    </select>
                  </div>
                </div>
                <div style={{ background: 'var(--primary)', color: 'white', padding: 12, borderRadius: 8, textAlign: 'right', fontSize: 18, fontWeight: 700 }}>
                  Subtotal: R$ {subtotal.toFixed(2).replace('.', ',')} - Desconto: R$ {(form.desconto || 0).toFixed(2).replace('.', ',')} = TOTAL: R$ {total.toFixed(2).replace('.', ',')}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-success">Finalizar Venda</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
