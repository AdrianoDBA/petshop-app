import { useEffect, useState } from 'react';
import api from '../services/api';

export default function Licenca() {
  const [licenca, setLicenca] = useState(null);
  const [chaveNova, setChaveNova] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [mensagem, setMensagem] = useState({ tipo: '', texto: '' });

  // E-mail de suporte do desenvolvedor
  const emailSuporte = 'adrianodba@github.com';

  useEffect(() => {
    carregar();
  }, []);

  function carregar() {
    api.get('/licenca')
      .then(({ data }) => setLicenca(data))
      .catch(() => {});
  }

  function copiarCodigoMaquina() {
    if (!licenca?.codigo_maquina) return;
    navigator.clipboard.writeText(licenca.codigo_maquina);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 3000);
  }

  function obterLinkEmail() {
    if (!licenca) return '#';
    const assunto = encodeURIComponent(`[RENOVAÇÃO PETSHOP PRO] Solicitação de Chave - ${licenca.nome_loja || 'Minha Loja'}`);
    const corpo = encodeURIComponent(
      `Olá Adriano,\n\n` +
      `Gostaria de solicitar a renovação da minha licença do PetShop Pro.\n\n` +
      `🏬 Nome do Pet Shop: ${licenca.nome_loja || 'Minha Loja'}\n` +
      `💻 Código deste Computador (Machine ID): ${licenca.codigo_maquina}\n` +
      `📅 Vencimento Atual: ${licenca.validade ? licenca.validade.split('-').reverse().join('/') : 'Trial'}\n\n` +
      `Favor enviar a chave de ativação após a confirmação do pagamento.\n` +
      `Obrigado!`
    );
    return `mailto:${emailSuporte}?subject=${assunto}&body=${corpo}`;
  }

  function obterLinkWhatsApp() {
    if (!licenca) return '#';
    const texto = encodeURIComponent(
      `Olá! Gostaria de renovar minha licença do PetShop Pro.\n\n` +
      `*Loja:* ${licenca.nome_loja || 'Meu Pet Shop'}\n` +
      `*Código do meu Computador:* ${licenca.codigo_maquina}\n\n` +
      `Segue o código para gerar a nova chave de ativação!`
    );
    return `https://wa.me/5511999999999?text=${texto}`;
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
          <p>Controle de validade autônomo, identificação da máquina e renovação</p>
        </div>
      </div>

      {mensagem.texto && (
        <div className={`badge badge-${mensagem.tipo}`} style={{ display: 'block', padding: 14, fontSize: 14, marginBottom: 20, borderRadius: 8 }}>
          {mensagem.tipo === 'success' ? '✅ ' : '⚠️ '} {mensagem.texto}
        </div>
      )}

      {/* CARD EM DESTAQUE: CÓDIGO DESTE COMPUTADOR */}
      {licenca && (
        <div className="card" style={{ background: '#f8fafc', border: '2px dashed #cbd5e1', marginBottom: 24, padding: 20 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
            <div>
              <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--primary)' }}>
                💻 Identificação Exclusiva deste Computador (Machine ID)
              </span>
              <div style={{ fontSize: 22, fontFamily: 'monospace', fontWeight: 800, color: '#1e293b', marginTop: 4 }}>
                {licenca.codigo_maquina || 'Carregando...'}
              </div>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-light)' }}>
                Envie este código ao suporte para receber sua chave de ativação atrelada a este computador.
              </p>
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={copiarCodigoMaquina}
              >
                {copiado ? '✓ Copiado!' : '📋 Copiar Código'}
              </button>
              <a
                href={obterLinkEmail()}
                className="btn btn-primary"
                style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                📧 Enviar Código por E-mail
              </a>
              <a
                href={obterLinkWhatsApp()}
                target="_blank"
                rel="noreferrer"
                className="btn btn-success"
                style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                📲 Enviar via WhatsApp
              </a>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
        
        {/* STATUS DA LICENÇA */}
        <div className="card">
          <h2 style={{ marginBottom: 16, fontSize: 18 }}>📋 Situação da sua Licença</h2>
          
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
                  {licenca.tipo === 'trial' ? 'Avaliação Gratuita (Trial)' : `Plano ${licenca.tipo?.toUpperCase()}`}
                </h3>
                <p style={{ margin: 0, fontSize: 14, color: 'var(--text-light)' }}>
                  Estabelecimento: <strong>{licenca.cliente || licenca.nome_loja}</strong>
                </p>

                <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid rgba(0,0,0,0.06)', display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <span style={{ fontSize: 12, color: 'var(--text-light)' }}>Vencimento:</span>
                    <div style={{ fontWeight: 700 }}>
                      {licenca.validade ? licenca.validade.split('-').reverse().join('/') : '—'}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: 12, color: 'var(--text-light)' }}>Dias Restantes:</span>
                    <div style={{ fontWeight: 700, color: licenca.dias_restantes <= 7 ? 'var(--danger)' : 'var(--success)' }}>
                      {licenca.dias_restantes} dia(s)
                    </div>
                  </div>
                </div>
              </div>

              {licenca.expirada && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: 14, marginBottom: 16, color: '#991b1b', fontSize: 13 }}>
                  ⚠️ O período da sua licença encerrou. Clique no botão de E-mail ou WhatsApp acima para enviar o seu código de computador e renovar imediatamente.
                </div>
              )}

              <div style={{ fontSize: 13, color: 'var(--text-light)', lineHeight: 1.5 }}>
                🔒 <strong>Validação Criptográfica Assimétrica (RSA-2048):</strong> Todas as chaves são autenticadas por assinatura digital pública no próprio computador da loja, garantindo funcionamento autônomo sem depender de servidores em nuvem para o caixa e a agenda.
              </div>
            </div>
          ) : (
            <p>Consultando status da licença...</p>
          )}
        </div>

        {/* ATIVAÇÃO DE CHAVE RECEBIDA */}
        <div className="card">
          <h2 style={{ marginBottom: 16, fontSize: 18 }}>🔑 Ativar Nova Chave de Licença</h2>
          <p style={{ fontSize: 13, color: 'var(--text-light)', marginBottom: 16 }}>
            Após efetuar o pagamento e receber a chave enviada pelo desenvolvedor por e-mail ou WhatsApp, cole o código completo abaixo:
          </p>

          <form onSubmit={ativarNovaChave}>
            <div className="form-group">
              <label>Chave de Ativação (Formato LIC-PET-...) *</label>
              <textarea
                rows="5"
                value={chaveNova}
                onChange={e => setChaveNova(e.target.value)}
                placeholder="Cole aqui o código de ativação fornecido pelo suporte (ex: LIC-PET-eyJuYW1lIjoi...)"
                style={{ fontFamily: 'monospace', fontSize: 12 }}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={carregando}
              style={{ width: '100%' }}
            >
              {carregando ? '⏳ Verificando Assinatura...' : '🚀 Ativar Licença no Sistema'}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
