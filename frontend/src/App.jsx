import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import api from './services/api';
import Login from './pages/Login';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Clientes from './pages/Clientes';
import Pets from './pages/Pets';
import Agendamentos from './pages/Agendamentos';
import Estoque from './pages/Estoque';
import Caixa from './pages/Caixa';
import Relatorios from './pages/Relatorios';
import Usuarios from './pages/Usuarios';
import Veterinaria from './pages/Veterinaria';
import Pacotes from './pages/Pacotes';
import WhatsApp from './pages/WhatsApp';
import Comissoes from './pages/Comissoes';
import AgendamentoPublico from './pages/AgendamentoPublico';
import Onboarding from './pages/Onboarding';
import Licenca from './pages/Licenca';
import Backup from './pages/Backup';

function App() {
  const { usuario, carregando } = useAuth();
  const [inicializado, setInicializado] = useState(null);

  useEffect(() => {
    api.get('/onboarding/status')
      .then(({ data }) => setInicializado(data.inicializado))
      .catch(() => setInicializado(true));
  }, []);

  if (carregando || inicializado === null) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0f172a', color: '#fff', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🐾</div>
          <div style={{ fontWeight: 600 }}>Carregando PetShop Pro...</div>
        </div>
      </div>
    );
  }

  // Se o sistema nunca foi configurado, força o Assistente de Inicialização (Onboarding)
  if (!inicializado) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="*" element={<Onboarding />} />
        </Routes>
      </BrowserRouter>
    );
  }

  const perfil = usuario?.perfil || '';

  return (
    <BrowserRouter>
      <Routes>
        {/* Rotas Públicas (Sem necessidade de login) */}
        <Route path="/agendar/:slug" element={<AgendamentoPublico />} />
        <Route path="/agendar" element={<AgendamentoPublico />} />
        <Route path="/onboarding" element={<Onboarding />} />

        {/* Rotas Autenticadas */}
        {!usuario ? (
          <Route path="*" element={<Login />} />
        ) : (
          <Route
            path="*"
            element={
              <Layout>
                <Routes>
                  {/* Rotas Comuns */}
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/agendamentos" element={<Agendamentos />} />
                  <Route path="/pets" element={<Pets />} />

                  {/* Rotas com Restrição por Perfil */}
                  {['admin', 'gerente', 'atendente', 'veterinario'].includes(perfil) && (
                    <Route path="/clientes" element={<Clientes />} />
                  )}

                  {['admin', 'gerente', 'atendente'].includes(perfil) && (
                    <>
                      <Route path="/whatsapp" element={<WhatsApp />} />
                      <Route path="/pacotes" element={<Pacotes />} />
                      <Route path="/caixa" element={<Caixa />} />
                      <Route path="/estoque" element={<Estoque />} />
                    </>
                  )}

                  {['admin', 'gerente', 'veterinario'].includes(perfil) && (
                    <Route path="/veterinaria" element={<Veterinaria />} />
                  )}

                  {['admin', 'gerente'].includes(perfil) && (
                    <Route path="/relatorios" element={<Relatorios />} />
                  )}

                  {['admin', 'gerente', 'tosador', 'veterinario'].includes(perfil) && (
                    <Route path="/comissoes" element={<Comissoes />} />
                  )}

                  {perfil === 'admin' && (
                    <>
                      <Route path="/usuarios" element={<Usuarios />} />
                      <Route path="/backup" element={<Backup />} />
                      <Route path="/licenca" element={<Licenca />} />
                    </>
                  )}

                  <Route path="*" element={<Navigate to="/" />} />
                </Routes>
              </Layout>
            }
          />
        )}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
