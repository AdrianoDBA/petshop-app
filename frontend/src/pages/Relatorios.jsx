import { useEffect, useState } from 'react';
import api from '../services/api';

export default function Relatorios() {
  const hoje = new Date().toISOString().slice(0, 10);
  const inicioMes = new Date().toISOString().slice(0, 7) + '-01';
  const [dataInicio, setDataInicio] = useState(inicioMes);
  const [dataFim, setDataFim] = useState(hoje);
  const [faturamento, setFaturamento] = useState([]);
  const [servicos, setServicos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [retencao, setRetencao] = useState(null);

  useEffect(() => {
    carregar();
  }, [dataInicio, dataFim]);

  function carregar() {
    const params = { data_inicio: dataInicio, data_fim: dataFim };
    api.get('/relatorios/faturamento', { params }).then(({ data }) => setFaturamento(data)).catch(() => {});
    api.get('/relatorios/servicos-mais-realizados', { params }).then(({ data }) => setServicos(data)).catch(() => {});
    api.get('/relatorios/clientes-top').then(({ data }) => setClientes(data)).catch(() => {});
    api.get('/relatorios/produtos-mais-vendidos', { params }).then(({ data }) => setProdutos(data)).catch(() => {});
    api.get('/relatorios/taxa-retencao').then(({ data }) => setRetencao(data)).catch(() => {});
  }

  function exportar() {
    const linhas = [
      ['RELATÓRIO PETSHOP PRO'],
      [`Período: ${dataInicio} a ${dataFim}`],
      [],
      ['TAXA DE RETENÇÃO DE CLIENTES'],
      ['Total Clientes', 'Clientes Recorrentes (>1 serviço)', 'Taxa (%)'],
      [retencao?.totalClientes || 0, retencao?.clientesRecorrentes || 0, `${retencao?.taxaRetencao || 0}%`],
      [],
      ['SERVIÇOS MAIS REALIZADOS'],
      ['Serviço', 'Quantidade', 'Receita (R$)'],
      ...servicos.map(s => [s.nome, s.quantidade, s.receita?.toFixed(2) || 0]),
      [],
      ['PRODUTOS MAIS VENDIDOS'],
      ['Produto', 'Quantidade Vendida', 'Receita (R$)'],
      ...produtos.map(p => [p.nome, p.quantidade_vendida, p.receita?.toFixed(2) || 0]),
      [],
      ['TOP CLIENTES'],
      ['Cliente', 'Telefone', 'Visitas', 'Total Gasto (R$)'],
      ...clientes.map(c => [c.nome, c.telefone, c.total_visitas, c.total_gasto?.toFixed(2) || 0]),
    ];
    const csv = '﻿' + linhas.map(l => l.join(';')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio_petshoppro_${dataInicio}_a_${dataFim}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const maxServicoReceita = Math.max(1, ...servicos.map(s => s.receita || 0));
  const maxProdutoReceita = Math.max(1, ...produtos.map(p => p.receita || 0));

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1>📈 Relatórios e Analytics</h1>
          <p>Análise de faturamento por serviço, mais vendidos e retenção de clientes</p>
        </div>
        <button className="btn btn-primary" onClick={exportar}>📥 Exportar CSV Completo</button>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="form-row">
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Data Inicial</label>
            <input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Data Final</label>
            <input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Taxa de Retenção de Clientes KPI Card */}
      {retencao && (
        <div className="stat-card" style={{ marginBottom: 20, background: 'linear-gradient(135deg, #7c3aed 0%, #4c1d95 100%)', color: 'white' }}>
          <span className="icon" style={{ fontSize: 32, opacity: 0.8 }}>🔄</span>
          <div className="label" style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14 }}>Taxa de Retenção de Clientes</div>
          <div className="value" style={{ color: 'white', fontSize: 36, marginTop: 4 }}>
            {retencao.taxaRetencao}%
          </div>
          <div style={{ marginTop: 8, fontSize: 13, color: 'rgba(255,255,255,0.9)' }}>
            📊 <strong>{retencao.clientesRecorrentes}</strong> de <strong>{retencao.totalClientes}</strong> clientes retornaram para realizar novos serviços no PetShop.
          </div>
        </div>
      )}

      {/* Gráficos de Serviços e Produtos Side-by-Side */}
      <div className="dashboard-row" style={{ marginTop: 0, marginBottom: 20 }}>
        <div className="card" style={{ margin: 0 }}>
          <h2 style={{ marginBottom: 16 }}>✂️ Faturamento por Serviço</h2>
          {servicos.length === 0 ? (
            <div className="empty-state"><p>Sem registros no período</p></div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Serviço</th>
                  <th>Atendimentos</th>
                  <th>Receita Total</th>
                </tr>
              </thead>
              <tbody>
                {servicos.map((s) => {
                  const pct = Math.round(((s.receita || 0) / maxServicoReceita) * 100);
                  return (
                    <tr key={s.nome}>
                      <td>
                        <strong>{s.nome}</strong>
                        <div style={{ marginTop: 6, background: '#f3f4f6', borderRadius: 4, height: 6, width: '100%', overflow: 'hidden' }}>
                          <div style={{ background: 'var(--primary)', height: '100%', width: `${pct}%`, borderRadius: 4 }} />
                        </div>
                      </td>
                      <td>{s.quantidade}x</td>
                      <td><strong>R$ {(s.receita || 0).toFixed(2).replace('.', ',')}</strong></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <div className="card" style={{ margin: 0 }}>
          <h2 style={{ marginBottom: 16 }}>🛒 Produtos Mais Vendidos</h2>
          {produtos.length === 0 ? (
            <div className="empty-state"><p>Sem registros no período</p></div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Produto</th>
                  <th>Vendidos</th>
                  <th>Receita Total</th>
                </tr>
              </thead>
              <tbody>
                {produtos.map((p) => {
                  const pct = Math.round(((p.receita || 0) / maxProdutoReceita) * 100);
                  return (
                    <tr key={p.nome}>
                      <td>
                        <strong>{p.nome}</strong>
                        <div style={{ marginTop: 6, background: '#f3f4f6', borderRadius: 4, height: 6, width: '100%', overflow: 'hidden' }}>
                          <div style={{ background: '#f59e0b', height: '100%', width: `${pct}%`, borderRadius: 4 }} />
                        </div>
                      </td>
                      <td>{p.quantidade_vendida} un</td>
                      <td><strong>R$ {(p.receita || 0).toFixed(2).replace('.', ',')}</strong></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Clientes Fiéis */}
      <div className="card" style={{ margin: 0 }}>
        <h2 style={{ marginBottom: 16 }}>👑 Ranking dos Melhores Clientes (VIPs)</h2>
        {clientes.length === 0 ? (
          <div className="empty-state"><p>Sem registros</p></div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Cliente / Tutor</th>
                <th>Telefone</th>
                <th>Frequência</th>
                <th>Total Investido</th>
              </tr>
            </thead>
            <tbody>
              {clientes.map((c) => (
                <tr key={c.nome}>
                  <td><strong>👥 {c.nome}</strong></td>
                  <td>{c.telefone}</td>
                  <td><span className="badge badge-info">{c.total_visitas} compras/serviços</span></td>
                  <td style={{ color: 'var(--primary-dark)', fontWeight: 700, fontSize: 15 }}>
                    R$ {(c.total_gasto || 0).toFixed(2).replace('.', ',')}
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
