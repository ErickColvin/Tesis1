import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api, { setAuthToken } from '../services/api';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const parseToken = (token) => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return { email: payload.email, role: payload.role };
    } catch {
      return null;
    }
  };

  async function submit(e) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);
    try {
      const response = await api.post('/api/auth/login', { email, password: pass });
      const { token, user } = response.data;
      if (!token) throw new Error('Token no recibido');
      setAuthToken(token);

      const tokenData = parseToken(token);
      const normalizedUser = {
        id: user?.id,
        email: user?.email || tokenData?.email || email,
        role: user?.role || tokenData?.role || 'user',
        permissions: user?.permissions || {}
      };

      onLogin?.(normalizedUser);
      navigate('/');
    } catch (err) {
      const errorMsg = err?.response?.data?.message || err.message || 'No se pudo iniciar sesion';
      setMsg(errorMsg === 'invalid_credentials' ? 'Credenciales invalidas' : errorMsg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="glass-panel p-10 space-y-6 animate-fade-in">
      <div className="text-center space-y-3">
        <p className="text-xs uppercase tracking-[0.4em] text-amber-300/70">Acceso seguro</p>
        <h2 className="text-3xl font-semibold text-white">Inicia sesion</h2>
        <p className="text-sm text-gray-400">Controla inventarios y entregas desde un solo lugar</p>
      </div>
      <form onSubmit={submit} className="space-y-5">
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm text-gray-300">Correo electronico</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@empresa.com"
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white transition focus:border-amber-400 focus:outline-none"
            required
            disabled={loading}
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="password" className="text-sm text-gray-300">Contrasena</label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 pr-10 text-white transition focus:border-amber-400 focus:outline-none"
              required
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute inset-y-0 right-3 text-xs font-semibold text-gray-400 hover:text-white"
              tabIndex={-1}
            >
              {showPassword ? 'Ocultar' : 'Ver'}
            </button>
          </div>
        </div>

        {msg && (
          <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {msg}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-gradient-to-r from-orange-500 to-rose-500 py-3 font-semibold tracking-wide shadow-lg transition hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? 'Validando...' : 'Ingresar'}
        </button>
      </form>

      <div className="text-center text-sm text-gray-400">
        <p>
          Aun sin cuenta?{' '}
          <Link className="text-amber-300 hover:text-amber-200 font-semibold" to="/register">
            Crear cuenta
          </Link>
        </p>
      </div>
    </div>
  );
}
