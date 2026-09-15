import { useEffect, useState } from 'react';
import api from '../services/api';

export default function Licenca() {
  const [licenca, setLicenca] = useState(null);
  const [chaveNova, setChaveNova] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [mensagem, setMensagem] = useState({ tipo: '', texto: '' });

  useEffect(() => {
    carregar();
  }, []);

  function carregar() {
    api.get('/licenca')
      .then(({ data }) => setLicenca(data))
      .catch(() => {});
  }

  async function ativarNovaChave(e) {
    e.preventDefault();
    if (!chaveNova.trim()) return;

    setCarregando(true);
    setMensagem({ tipo: '', texto: '' });

    try {
      const res = await api.post('/licenca/ativar', { chave: chaveNova.trim() });
      setMensagem({ tipo: 'success', texto: res.data.message || 'Licença ativada com sucesso!' });
      setChaveNova('');
      carregar();
    } catch (err) {
      setMensagem({ tipo: 'danger', texto: err.response?.data?.error || 'Erro ao ativar licença' });
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1>🔑 Licença & Assinatura do Sistema</h1>
          <p>Gerenciamento da licença comercial, validade e renovação</p>
        </div>
      </div>

      {mensagem.texto && (
        <div className={`badge badge-${mensagem.tipo}`} style={{ display: 'block', padding: 14, fontSize: 14, marginBottom: 20, borderRadius: 8 }}>
          {mensagem.tipo === 'success' ? '✅ ' : '⚠️ '} {mensagem.texto}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
        
        {/* CARD DE STATUS DA LICENÇA */}
        <div className="card">
          <h2 style={{ marginBottom: 16, fontSize: 18 }}>📋 Status da Assinatura Atual</h2>
          
          {licenca ? (
            <div>
              <div style={{
                background: licenca.expirada ? '#fef2f2' : (licenca.aviso_expiracao ? '#fffbeb' : '#ecfdf5'),
                border: `1px solid ${licenca.expirada ? 'var(--danger)' : (licenca.aviso_expiracao ? 'var(--warning)' : 'var(--success)')}`,
                borderRadius: 8,
                padding: 18,
                marginBottom: 20
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 28 }}>
                    {licenca.expirada ? '🚨' : (licenca.aviso_expiracao ? '⏳' : '🛡️')}
                  </span>
                  <span className={`badge badge-${licenca.expirada ? 'danger' : (licenca.aviso_expiracao ? 'warning' : 'success')}`}>
                    {licenca.expirada ? 'LICENÇA EXPIRADA' : (licenca.aviso_expiracao ? 'EXPIRA EM BREVE' : 'LICENÇA ATIVA')}
                  </span>
                </div>

                <h3 style={{ margin: '12px 0 4px', fontSize: 18, color: licenca.expirada ? '#991b1b' : '#065f46' }}>
                  Plano {licenca.tipo?.toUpperCase()}
                </h3>
                <p style={{ margin: 0, fontSize: 14, color: 'var(--text-light)' }}>
                  Titular: <strong>{licenca.cliente || 'PetShop Pro'}</strong>
                </p>

                <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid rgba(0,0,0,0.06)', display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <span style={{ fontSize: 12, color: 'var(--text-light)' }}>Vencimento:</span>
                    <div style={{ fontWeight: 700 }}>
                      {licenca.validade ? licenca.validade.split('-').reverse().join('/') : '—'}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: 12, color: 'var(--text-light)' }}>Tempo Restante:</span>
                    <div style={{ fontWeight: 700, color: licenca.dias_restantes <= 7 ? 'var(--danger)' : 'var(--success)' }}>
                      {licenca.dias_restantes} dia(s)
                    </div>
                  </div>
                </div>
              </div>

              {licenca.expirada && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: 14, marginBottom: 16, color: '#991b1b', fontSize: 13 }}>
                  ⚠️ O prazo da sua licença encerrou. Para continuar criando novos agendamentos e faturando no PDV, insira uma nova chave de renovação abaixo.
                </div>
              )}

              <div style={{ fontSize: 13, color: 'var(--text-light)' }}>
                🔒 <strong>Segurança Local-First:</strong> A validação da sua licença é realizada localmente no computador da loja, não dependendo de conexão externa para o funcionamento do caixa diário.
              </div>
            </div>
          ) : (
            <p>Carregando dados da licença...</p>
          )}
        </div>

        {/* CARD DE ATIVAÇÃO DE NOVA CHAVE */}
        <div className="card">
          <h2 style={{ marginBottom: 16, fontSize: 18 }}>🔑 Inserir Nova Chave de Ativação</h2>
          <p style={{ fontSize: 13, color: 'var(--text-light)', marginBottom: 16 }}>
            Adquiriu um novo período ou renovou sua assinatura mensal/anual? Cole a chave fornecida pelo suporte para estender a validade do seu sistema.
          </p>

          <form onSubmit={ativarNovaChave}>
            <div className="form-group">
              <label>Chave de Ativação *</label>
              <textarea
                rows="4"
                value={chaveNova}
                onChange={e => setChaveNova(e.target.value)}
                placeholder="Cole aqui a chave enviada pelo suporte (ex: eyJjIjoi...)"
                style={{ fontFamily: 'monospace', fontSize: 12 }}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={carregando}
              style={{ width: '100%', marginBottom: 16 }}
            >
              {carregando ? '⏳ Verificando Chave...' : '🚀 Validar e Ativar Licença'}
            </button>
          </form>

          {/* Suporte / Renovação via WhatsApp */}
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 16, textAlign: 'center' }}>
            <span style={{ fontSize: 24, display: 'block', marginBottom: 4 }}>💬</span>
            <strong style={{ fontSize: 14 }}>Precisa de Suporte ou Quer Renovar?</strong>
            <p style={{ fontSize: 12, color: 'var(--text-light)', margin: '4px 0 12px' }}>
              Entre em contato direto com o desenvolvedor para receber sua chave imediata via PIX.
            </p>
            <a
              href="https://wa.me/5511999999999?text=Ol%C3%A1%2C+preciso+renovar+a+minha+licen%C3%A7a+do+PetShop+Pro"
              target="_blank"
              rel="noreferrer"
              className="btn btn-success btn-sm"
              style={{ display: 'inline-block', textDecoration: 'none' }}
            >
              📲 Falar no WhatsApp de Suporte
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}
