import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import Sidebar from './Sidebar';
import BannerLicenca from './BannerLicenca';
import { useAuth } from '../context/AuthContext';

export default function Layout({ children }) {
  const { usuario, logout } = useAuth();
  const [online, setOnline] = useState(navigator.onLine);
  const [pwaPrompt, setPwaPrompt] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setPwaPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  async function instalarPWA() {
    if (!pwaPrompt) {
      alert('Para instalar no Computador (Chrome/Edge), clique no ícone de instalar na barra de endereços. No celular, selecione "Adicionar à Tela de Início".');
      return;
    }
    pwaPrompt.prompt();
    const { outcome } = await pwaPrompt.userChoice;
    if (outcome === 'accepted') {
      setPwaPrompt(null);
    }
  }

  function copiarLinkPublico() {
    const url = `${window.location.origin}/agendar/patinhas-felizes`;
    navigator.clipboard.writeText(url);
    alert(`Link de auto-agendamento copiado com sucesso!\n\n${url}\n\nEnvie este link para seus clientes agendarem pelo celular!`);
  }

  return (
    <div className="app-container">
      <Sidebar />

      <main className="main-content">
        <BannerLicenca />
        
        <header className="topbar">
          <div className="topbar-left">
            <span className="badge badge-success" style={{ padding: '6px 12px' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: online ? '#10b981' : '#ef4444', display: 'inline-block' }} />
              {online ? 'Online' : 'Offline (Modo PWA)'}
            </span>
            <button className="btn btn-sm btn-secondary" onClick={copiarLinkPublico} title="Copiar link público para clientes">
              🌐 Link de Agendamento
            </button>
          </div>

          <div className="topbar-right">
            <button className="btn btn-sm btn-primary" onClick={instalarPWA} title="Instalar aplicativo no dispositivo">
              📲 Instalar App
            </button>
            <span className="badge badge-primary" style={{ padding: '6px 12px' }}>
              👤 {usuario?.nome} ({usuario?.perfil})
            </span>
          </div>
        </header>

        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="bottom-nav">
        <NavLink to="/" end>
          <span className="icon">📊</span>
          <span>Início</span>
        </NavLink>
        <NavLink to="/agendamentos">
          <span className="icon">📅</span>
          <span>Agenda</span>
        </NavLink>
        <NavLink to="/whatsapp">
          <span className="icon">💬</span>
          <span>WhatsApp</span>
        </NavLink>
        <NavLink to="/caixa">
          <span className="icon">🛒</span>
          <span>Caixa</span>
        </NavLink>
        <button
          onClick={() => setMobileMenuOpen(true)}
          style={{ background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'var(--text-muted)', fontSize: 10, fontWeight: 600, gap: 3, cursor: 'pointer' }}
        >
          <span style={{ fontSize: 20 }}>☰</span>
          <span>Mais</span>
        </button>
      </nav>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="modal-overlay" onClick={() => setMobileMenuOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 360, alignSelf: 'flex-end', borderRadius: '24px 24px 0 0', margin: 0 }}>
            <div className="modal-header">
              <h2>Menu Completo</h2>
              <button onClick={() => setMobileMenuOpen(false)}>×</button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <NavLink to="/pacotes" className="btn btn-secondary" style={{ justifyContent: 'flex-start' }} onClick={() => setMobileMenuOpen(false)}>
                🔁 Pacotes & Assinaturas
              </NavLink>
              <NavLink to="/veterinaria" className="btn btn-secondary" style={{ justifyContent: 'flex-start' }} onClick={() => setMobileMenuOpen(false)}>
                🩺 Veterinária & Vacinas
              </NavLink>
              <NavLink to="/clientes" className="btn btn-secondary" style={{ justifyContent: 'flex-start' }} onClick={() => setMobileMenuOpen(false)}>
                👥 Clientes / Tutores
              </NavLink>
              <NavLink to="/pets" className="btn btn-secondary" style={{ justifyContent: 'flex-start' }} onClick={() => setMobileMenuOpen(false)}>
                🐾 Pets & Prontuários
              </NavLink>
              <NavLink to="/estoque" className="btn btn-secondary" style={{ justifyContent: 'flex-start' }} onClick={() => setMobileMenuOpen(false)}>
                📦 Estoque & Validade
              </NavLink>
              <NavLink to="/comissoes" className="btn btn-secondary" style={{ justifyContent: 'flex-start' }} onClick={() => setMobileMenuOpen(false)}>
                💰 Comissões da Equipe
              </NavLink>
              <NavLink to="/relatorios" className="btn btn-secondary" style={{ justifyContent: 'flex-start' }} onClick={() => setMobileMenuOpen(false)}>
                📈 Relatórios & DRE
              </NavLink>
              <NavLink to="/backup" className="btn btn-secondary" style={{ justifyContent: 'flex-start' }} onClick={() => setMobileMenuOpen(false)}>
                💾 Backups & Nuvem
              </NavLink>
              <NavLink to="/licenca" className="btn btn-secondary" style={{ justifyContent: 'flex-start' }} onClick={() => setMobileMenuOpen(false)}>
                🔑 Licença & Assinatura
              </NavLink>
              <button className="btn btn-danger" style={{ marginTop: 12, justifyContent: 'center' }} onClick={logout}>
                🚪 Sair da Conta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
