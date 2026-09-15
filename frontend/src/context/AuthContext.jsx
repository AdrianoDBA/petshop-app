import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('usuario');
    if (token && user) {
      api.defaults.headers.Authorization = `Bearer ${token}`;
      setUsuario(JSON.parse(user));
    }
    setCarregando(false);
  }, []);

  async function login(usuarioLogin, senha) {
    const { data } = await api.post('/auth/login', {
      usuario: usuarioLogin,
      senha
    });
    localStorage.setItem('token', data.token);
    localStorage.setItem('usuario', JSON.stringify(data.usuario));
    api.defaults.headers.Authorization = `Bearer ${data.token}`;
    setUsuario(data.usuario);
    return data;
  }

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    delete api.defaults.headers.Authorization;
    setUsuario(null);
  }

  return (
    <AuthContext.Provider value={{ usuario, login, logout, carregando }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
