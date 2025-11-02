// src/pages/Login.jsx
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
    setLoading(true);
    
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
      const errorMsg = err.response?.data?.message || err.message || 'Login failed';
      setMsg(errorMsg === 'invalid_credentials' ? 'Credenciales inválidas' : errorMsg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="w-full max-w-md">
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-2xl p-8 space-y-6">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Bienvenido
            </h1>
            <p className="text-gray-300">Inicia sesión en tu cuenta</p>
          </div>

          {/* Form */}
          <form onSubmit={submit} className="space-y-4">
            {/* Email Input */}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                Correo electrónico
              </label>
              <div className="relative">
                <input
                  id="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg 
                           focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                           transition-all duration-200 placeholder-gray-500"
                  required
                  type="email"
                  disabled={loading}
                />
                <span className="absolute right-3 top-3 text-gray-400">✉</span>
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={pass}
                  onChange={e => setPass(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg 
                           focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                           transition-all duration-200 placeholder-gray-500"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-white transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? '❌' : '👁️'}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {msg && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 flex items-center gap-2">
                <span className="text-red-400">⚠️</span>
                <p className="text-red-300 text-sm">{msg}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 
                       hover:from-blue-700 hover:to-purple-700 rounded-lg font-semibold
                       transform transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]
                       disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                       shadow-lg hover:shadow-xl"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Iniciando sesión...
                </span>
              ) : (
                'Iniciar sesión'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/20"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white/10 text-gray-400">¿No tienes cuenta?</span>
            </div>
          </div>

          {/* Register Link */}
          <Link
            to="/register"
            className="block w-full py-3 px-4 text-center bg-white/5 border border-white/20 
                     hover:bg-white/10 rounded-lg transition-all duration-200"
          >
            <span className="text-blue-400 hover:text-blue-300 font-medium">
              Crear una cuenta
            </span>
          </Link>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-sm text-gray-400">
          ¿Olvidaste tu contraseña?{' '}
          <a href="#" className="text-blue-400 hover:text-blue-300">
            Recuperar
          </a>
        </p>
      </div>
    </div>
  );
}