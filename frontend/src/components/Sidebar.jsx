import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Sidebar() {
  const { usuario, logout } = useAuth();
  const perfil = usuario?.perfil || 'atendente';

  const linksPrincipais = [
    { to: '/', icon: '📊', label: 'Dashboard' },
    { to: '/agendamentos', icon: '📅', label: 'Agenda & Serviços' }
  ];

  if (['admin', 'gerente', 'atendente'].includes(perfil)) {
    linksPrincipais.push({ to: '/whatsapp', icon: '💬', label: 'WhatsApp & Avisos' });
    linksPrincipais.push({ to: '/pacotes', icon: '🔁', label: 'Pacotes & Planos' });
  }

  if (['admin', 'gerente', 'veterinario'].includes(perfil)) {
    linksPrincipais.push({ to: '/veterinaria', icon: '🩺', label: 'Veterinária & Vacinas' });
  }

  if (['admin', 'gerente', 'atendente', 'veterinario'].includes(perfil)) {
    linksPrincipais.push({ to: '/clientes', icon: '👥', label: 'Clientes / Tutores' });
  }

  linksPrincipais.push({ to: '/pets', icon: '🐾', label: 'Pets & Prontuários' });

  const linksOperacionais = [];
  if (['admin', 'gerente', 'atendente'].includes(perfil)) {
    linksOperacionais.push({ to: '/caixa', icon: '🛒', label: 'Frente de Caixa (PDV)' });
    linksOperacionais.push({ to: '/estoque', icon: '📦', label: 'Estoque & Validade' });
  }

  const linksGestao = [];
  if (['admin', 'gerente'].includes(perfil)) {
    linksGestao.push({ to: '/relatorios', icon: '📈', label: 'Relatórios & DRE' });
  }
  if (['admin', 'gerente', 'tosador', 'veterinario'].includes(perfil)) {
    linksGestao.push({
      to: '/comissoes',
      icon: '💰',
      label: ['admin', 'gerente'].includes(perfil) ? 'Comissões da Equipe' : 'Minhas Comissões'
    });
  }
  if (perfil === 'admin') {
    linksGestao.push({ to: '/usuarios', icon: '👤', label: 'Usuários & Permissões' });
    linksGestao.push({ to: '/backup', icon: '💾', label: 'Backups & Nuvem' });
    linksGestao.push({ to: '/licenca', icon: '🔑', label: 'Licença & Assinatura' });
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">🐾</div>
        <div>
          <div className="brand-name">PetShop <span className="brand-badge">PRO</span></div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-title">Atendimento</div>
        {linksPrincipais.map((l) => (
          <NavLink key={l.to} to={l.to} end={l.to === '/'}>
            <span className="icon">{l.icon}</span>
            <span>{l.label}</span>
          </NavLink>
        ))}

        {linksOperacionais.length > 0 && (
          <>
            <div className="nav-section-title">Operações & Vendas</div>
            {linksOperacionais.map((l) => (
              <NavLink key={l.to} to={l.to}>
                <span className="icon">{l.icon}</span>
                <span>{l.label}</span>
              </NavLink>
            ))}
          </>
        )}

        {linksGestao.length > 0 && (
          <>
            <div className="nav-section-title">Gestão & Finanças</div>
            {linksGestao.map((l) => (
              <NavLink key={l.to} to={l.to}>
                <span className="icon">{l.icon}</span>
                <span>{l.label}</span>
              </NavLink>
            ))}
          </>
        )}
      </nav>

      <div className="sidebar-user">
        <div className="user-info">
          <div className="name">{usuario?.nome || 'Usuário'}</div>
          <div className="role">{usuario?.perfil || 'Colaborador'}</div>
        </div>
        <button className="btn-logout" onClick={logout} title="Sair do sistema">
          🚪 Sair
        </button>
      </div>
    </aside>
  );
}
