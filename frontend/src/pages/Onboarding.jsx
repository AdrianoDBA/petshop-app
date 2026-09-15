import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Onboarding() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [etapa, setEtapa] = useState(1);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');

  // Formulário do Onboarding
  const [form, setForm] = useState({
    loja_nome: '',
    loja_razao_social: '',
    loja_documento: '',
    loja_telefone: '',
    loja_whatsapp: '',
    loja_email: '',
    loja_endereco: '',
    loja_cidade: '',
    loja_estado: 'SP',
    loja_cep: '',
    admin_nome: '',
    admin_usuario: 'admin',
    admin_senha: '',
    admin_senha_confirm: '',
    carregar_servicos_padrao: true,
    licenca_chave: ''
  });

  function atualizarCampo(campo, valor) {
    setForm(prev => ({ ...prev, [campo]: valor }));
    setErro('');
  }

  function avancar(e) {
    if (e) e.preventDefault();
    setErro('');

    if (etapa === 1) {
      if (!form.loja_nome.trim()) {
        setErro('Por favor, informe o Nome Fantasia do seu Pet Shop.');
        return;
      }
      if (!form.loja_whatsapp.trim()) {
        setErro('Por favor, informe o WhatsApp Comercial de atendimento.');
        return;
      }
      setEtapa(2);
    } else if (etapa === 2) {
      if (!form.admin_nome.trim() || !form.admin_usuario.trim() || !form.admin_senha) {
        setErro('Preencha o nome, usuário e senha do Administrador.');
        return;
      }
      if (form.admin_senha.length < 4) {
        setErro('A senha deve ter pelo menos 4 caracteres.');
        return;
      }
      if (form.admin_senha !== form.admin_senha_confirm) {
        setErro('A confirmação de senha não confere.');
        return;
      }
      setEtapa(3);
    } else if (etapa === 3) {
      setEtapa(4);
    }
  }

  async function concluirSetup(usarTrial = false) {
    setErro('');
    setCarregando(true);

    const payload = {
      ...form,
      licenca_chave: usarTrial ? '' : form.licenca_chave
    };

    try {
      const res = await api.post('/onboarding/concluir', payload);
      if (res.data.token) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('usuario', JSON.stringify(res.data.usuario));
        window.location.href = '/';
      } else {
        navigate('/login');
      }
    } catch (err) {
      setErro(err.response?.data?.error || 'Erro ao concluir configuração.');
      setCarregando(false);
    }
  }

  return (
    <div className="login-container" style={{ minHeight: '100vh', padding: '24px 16px' }}>
      <div className="login-card-wrapper" style={{ maxWidth: 640 }}>
        <div className="login-card" style={{ padding: '32px' }}>
          
          {/* Header */}
          <div className="login-header" style={{ marginBottom: 24 }}>
            <div className="login-logo-icon">🐾</div>
            <h1 className="login-title">Bem-vindo ao <span className="brand-badge">PetShop PRO</span></h1>
            <p className="login-subtitle">Assistente de Configuração Inicial da sua Loja</p>
          </div>

          {/* Stepper Progress */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 28, position: 'relative' }}>
            {[
              { num: 1, label: 'Sua Loja' },
              { num: 2, label: 'Admin' },
              { num: 3, label: 'Serviços' },
              { num: 4, label: 'Licença' }
            ].map(s => (
              <div key={s.num} style={{ textAlign: 'center', zIndex: 2 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: etapa >= s.num ? 'var(--primary)' : '#e2e8f0',
                  color: etapa >= s.num ? '#fff' : '#64748b',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 'bold', margin: '0 auto 6px',
                  boxShadow: etapa === s.num ? '0 0 0 4px rgba(124, 58, 237, 0.2)' : 'none',
                  transition: 'all 0.3s ease'
                }}>
                  {etapa > s.num ? '✓' : s.num}
                </div>
                <span style={{ fontSize: 12, fontWeight: etapa === s.num ? 700 : 500, color: etapa === s.num ? 'var(--primary)' : 'var(--text-light)' }}>
                  {s.label}
                </span>
              </div>
            ))}
          </div>

          {erro && (
            <div className="login-error-badge" style={{ marginBottom: 20 }}>
              ⚠️ {erro}
            </div>
          )}

          {/* ETAPA 1: DADOS DA LOJA */}
          {etapa === 1 && (
            <form onSubmit={avancar}>
              <h3 style={{ marginBottom: 16, fontSize: 16 }}>🏬 1. Dados do seu Pet Shop ou Clínica</h3>
              <div className="form-group">
                <label>Nome Fantasia do Pet Shop *</label>
                <input
                  value={form.loja_nome}
                  onChange={e => atualizarCampo('loja_nome', e.target.value)}
                  placeholder="Ex: Pet Shop Patinhas de Ouro"
                  required
                  autoFocus
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>WhatsApp Comercial *</label>
                  <input
                    value={form.loja_whatsapp}
                    onChange={e => atualizarCampo('loja_whatsapp', e.target.value)}
                    placeholder="(11) 99999-8888"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>CNPJ ou CPF</label>
                  <input
                    value={form.loja_documento}
                    onChange={e => atualizarCampo('loja_documento', e.target.value)}
                    placeholder="00.000.000/0001-00"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Cidade</label>
                  <input
                    value={form.loja_cidade}
                    onChange={e => atualizarCampo('loja_cidade', e.target.value)}
                    placeholder="São Paulo"
                  />
                </div>
                <div className="form-group">
                  <label>UF</label>
                  <input
                    value={form.loja_estado}
                    onChange={e => atualizarCampo('loja_estado', e.target.value)}
                    placeholder="SP"
                    maxLength="2"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Endereço Completo</label>
                <input
                  value={form.loja_endereco}
                  onChange={e => atualizarCampo('loja_endereco', e.target.value)}
                  placeholder="Rua das Flores, 123 - Centro"
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 12 }}>
                Continuar para Usuário Admin →
              </button>
            </form>
          )}

          {/* ETAPA 2: USUÁRIO ADMINISTRADOR */}
          {etapa === 2 && (
            <form onSubmit={avancar}>
              <h3 style={{ marginBottom: 16, fontSize: 16 }}>👑 2. Crie a Conta do Administrador Mestre</h3>
              <p style={{ fontSize: 13, color: 'var(--text-light)', marginBottom: 16 }}>
                Este usuário terá acesso total ao sistema, financeiro, configurações e cadastro de colaboradores.
              </p>

              <div className="form-group">
                <label>Nome Completo do Proprietário/Admin *</label>
                <input
                  value={form.admin_nome}
                  onChange={e => atualizarCampo('admin_nome', e.target.value)}
                  placeholder="Ex: Carlos Eduardo Silva"
                  required
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label>Login de Usuário *</label>
                <input
                  value={form.admin_usuario}
                  onChange={e => atualizarCampo('admin_usuario', e.target.value)}
                  placeholder="admin"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Senha de Acesso *</label>
                  <input
                    type="password"
                    value={form.admin_senha}
                    onChange={e => atualizarCampo('admin_senha', e.target.value)}
                    placeholder="Crie uma senha segura"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Confirme a Senha *</label>
                  <input
                    type="password"
                    value={form.admin_senha_confirm}
                    onChange={e => atualizarCampo('admin_senha_confirm', e.target.value)}
                    placeholder="Repita a senha"
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setEtapa(1)}>
                  ← Voltar
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  Continuar para Catálogo →
                </button>
              </div>
            </form>
          )}

          {/* ETAPA 3: CATÁLOGO DE SERVIÇOS */}
          {etapa === 3 && (
            <div>
              <h3 style={{ marginBottom: 12, fontSize: 16 }}>✂️ 3. Catálogo Inicial de Atendimentos</h3>
              <p style={{ fontSize: 13, color: 'var(--text-light)', marginBottom: 20 }}>
                Deseja que o PetShop Pro pré-carregue os serviços padrão mais comuns do mercado pet? Você poderá editar todos os preços a qualquer momento.
              </p>

              <div style={{
                background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 16, marginBottom: 20
              }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={form.carregar_servicos_padrao}
                    onChange={e => atualizarCampo('carregar_servicos_padrao', e.target.checked)}
                    style={{ width: 20, height: 20 }}
                  />
                  <div>
                    <strong style={{ fontSize: 14 }}>Carregar Catálogo Básico Recomendado</strong>
                    <div style={{ fontSize: 12, color: 'var(--text-light)', marginTop: 2 }}>
                      Inclui: Banho Tradicional (R$ 50), Tosa Higiênica (R$ 40), Banho + Tosa Completa (R$ 120), Tosa na Tesoura (R$ 80), Consulta Veterinária (R$ 150) e Aplicação de Vacina (R$ 90).
                    </div>
                  </div>
                </label>
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setEtapa(2)}>
                  ← Voltar
                </button>
                <button type="button" className="btn btn-primary" style={{ flex: 1 }} onClick={() => avancar()}>
                  Continuar para Licença →
                </button>
              </div>
            </div>
          )}

          {/* ETAPA 4: ATIVAÇÃO DE LICENÇA */}
          {etapa === 4 && (
            <div>
              <h3 style={{ marginBottom: 12, fontSize: 16 }}>🔑 4. Ativação da Licença Comercial</h3>
              <p style={{ fontSize: 13, color: 'var(--text-light)', marginBottom: 20 }}>
                Se você já comprou sua licença com o suporte, cole a chave de ativação abaixo. Caso contrário, você pode iniciar com o período de avaliação gratuita de 15 dias.
              </p>

              <div className="form-group">
                <label>Chave de Licença (Opcional se for usar avaliação)</label>
                <textarea
                  rows="3"
                  value={form.licenca_chave}
                  onChange={e => atualizarCampo('licenca_chave', e.target.value)}
                  placeholder="Cole aqui o token da sua chave de licença (ex: eyJjIjoiUGV0IFNob3...)"
                  style={{ fontFamily: 'monospace', fontSize: 12 }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 20 }}>
                {form.licenca_chave.trim() ? (
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={carregando}
                    onClick={() => concluirSetup(false)}
                    style={{ padding: '12px' }}
                  >
                    {carregando ? '⏳ Ativando e Inicializando...' : '🚀 Ativar Licença e Iniciar Sistema'}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={carregando}
                    onClick={() => concluirSetup(true)}
                    style={{ padding: '12px', background: '#059669', borderColor: '#059669' }}
                  >
                    {carregando ? '⏳ Inicializando...' : '✨ Iniciar 15 Dias de Avaliação Gratuita'}
                  </button>
                )}

                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={carregando}
                  onClick={() => setEtapa(3)}
                >
                  ← Voltar
                </button>
              </div>
            </div>
          )}

        </div>

        <div className="login-footer-text" style={{ marginTop: 20 }}>
          PetShop Pro Enterprise · Instalação Local Segura com Armazenamento Transacional
        </div>
      </div>
    </div>
  );
}
