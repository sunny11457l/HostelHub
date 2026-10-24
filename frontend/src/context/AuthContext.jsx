import { createContext, useContext, useEffect, useState } from 'react';
import client from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('hh_user')); } catch { return null; }
  });
  const [booting, setBooting] = useState(!!localStorage.getItem('hh_token'));

  useEffect(() => {
    const token = localStorage.getItem('hh_token');
    if (!token) { setBooting(false); return; }
    client.get('/auth/me')
      .then((res) => { setUser(res.data); localStorage.setItem('hh_user', JSON.stringify(res.data)); })
      .catch(() => { localStorage.removeItem('hh_token'); localStorage.removeItem('hh_user'); setUser(null); })
      .finally(() => setBooting(false));
  }, []);

  async function login(email, password) {
    const res = await client.post('/auth/login', { email, password });
    localStorage.setItem('hh_token', res.data.token);
    localStorage.setItem('hh_user', JSON.stringify(res.data));
    setUser(res.data);
  }

  async function register(payload) {
    const res = await client.post('/auth/register', payload);
    localStorage.setItem('hh_token', res.data.token);
    localStorage.setItem('hh_user', JSON.stringify(res.data));
    setUser(res.data);
  }

  function logout() {
    localStorage.removeItem('hh_token');
    localStorage.removeItem('hh_user');
    setUser(null);
  }

  return <AuthContext.Provider value={{ user, booting, login, register, logout }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
