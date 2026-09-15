import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const [usuario, setUsuario] = useState('admin');
  const [senha, setSenha] = useState('admin123');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setErro('');
    setCarregando(true);
    try {
      await login(usuario, senha);
    } catch (err) {
      if (!err.response) {
        setErro('Não foi possível conectar ao servidor backend. Verifique a conexão.');
      } else {
        setErro(err.response.data?.error || 'Erro ao autenticar. Verifique seu login e senha.');
      }
    } finally {
      setCarregando(false);
    }
  }

  function preencherAcesso(u, s) {
    setUsuario(u);
    setSenha(s);
    setErro('');
  }

  return (
    <div className="login-container">
      <div className="login-card-wrapper">
        <div className="login-card">
          
          {/* Brand Header */}
          <div className="login-header">
            <div className="login-logo-icon">🐾</div>
            <h1 className="login-title">PetShop <span className="brand-badge">PRO</span></h1>
            <p className="login-subtitle">Gestão Empresarial, Estética Animal & Veterinária</p>
          </div>

          {erro && (
            <div className="login-error-badge">
              ⚠️ {erro}
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label>Usuário / Login</label>
              <input
                type="text"
                placeholder="Seu usuário"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label>Senha de Acesso</label>
              <input
                type="password"
                placeholder="Sua senha"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
              />
            </div>

            <button
              className="btn btn-primary login-btn"
              type="submit"
              disabled={carregando}
            >
              {carregando ? '⏳ Acessando Sistema...' : '🚀 Entrar no Sistema'}
            </button>
          </form>

          {/* Quick Login Helper Pills */}
          <div className="login-quick-access">
            <div className="quick-access-title">Perfis para Demonstração:</div>
            <div className="quick-access-pills">
              <button
                type="button"
                className={`pill ${usuario === 'admin' ? 'active' : ''}`}
                onClick={() => preencherAcesso('admin', 'admin123')}
              >
                👑 Admin
              </button>
              <button
                type="button"
                className={`pill ${usuario === 'carla' ? 'active' : ''}`}
                onClick={() => preencherAcesso('carla', 'admin123')}
              >
                🩺 Veterinária
              </button>
              <button
                type="button"
                className={`pill ${usuario === 'maria' ? 'active' : ''}`}
                onClick={() => preencherAcesso('maria', 'admin123')}
              >
                🛎️ Atendente
              </button>
              <button
                type="button"
                className={`pill ${usuario === 'joao' ? 'active' : ''}`}
                onClick={() => preencherAcesso('joao', 'tosador123')}
              >
                ✂️ Tosador
              </button>
            </div>
          </div>

        </div>

        <div className="login-footer-text">
          PetShop Pro Enterprise · Sistema Seguro & Conexão Criptografada
        </div>
      </div>
    </div>
  );
}
