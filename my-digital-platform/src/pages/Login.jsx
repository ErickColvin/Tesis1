// src/pages/Login.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { setAuthToken } from '../services/api';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [msg, setMsg] = useState(null);
  const navigate = useNavigate();

  function parseToken(token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return { email: payload.email, role: payload.role };
    } catch {
      return null;
    }
  }

  async function submit(e) {
    e.preventDefault();
    setMsg(null);
    try {
      const r = await api.post('/api/auth/login', { email, password: pass });
      const { token, user } = r.data;
      if (!token) throw new Error('No token returned');

      localStorage.setItem('token', token);
      setAuthToken(token);

      const parsed = parseToken(token);
      const normalizedUser = parsed || (user ? { email: user.email, role: user.role } : null);

      if (normalizedUser) {
        onLogin(normalizedUser);
        navigate('/');
      } else {
        setMsg('Login correcto pero datos de usuario faltantes');
        navigate('/');
      }
    } catch (err) {
      setMsg(err.response?.data?.message || err.message || 'Login failed');
    }
  }

  return (
    <div className="p-6 max-w-md mx-auto">
      <h2 className="text-2xl mb-4">Login</h2>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <input
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="email"
          className="p-2 border rounded"
          required
          type="email"
        />
        <input
          type="password"
          value={pass}
          onChange={e => setPass(e.target.value)}
          placeholder="password"
          className="p-2 border rounded"
          required
        />
        <button type="submit" className="px-3 py-2 bg-blue-600 text-white rounded">
          Login
        </button>
      </form>
      {msg && <p className="mt-3 text-red-500">{msg}</p>}
    </div>
  );
}