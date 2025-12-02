import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';

const MIN_PASSWORD_LENGTH = 6;

// ## Pantalla para registrar nuevos usuarios
export default function Register() {
  // ## Estado local para formulario, mensajes y controles de UI
  const [form, setForm] = useState({ email: '', password: '', confirm: '' });
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const navigate = useNavigate();
  // ## Fin estado local para formulario, mensajes y controles de UI

  // ## Actualizar campos del formulario
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };
  // ## Fin actualizar campos del formulario

  // ## Validar correo y contrasenas antes de enviar
  const validate = () => {
    if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(form.email)) {
      return 'Ingresa un correo valido';
    }
    if (form.password.length < MIN_PASSWORD_LENGTH) {
      return `La contrasena debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres`;
    }
    if (form.password !== form.confirm) {
      return 'Las contrasenas no coinciden';
    }
    return null;
  };
  // ## Fin validar correo y contrasenas antes de enviar

  // ## Enviar registro al backend y redirigir al login
  const submit = async (e) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setMsg(validationError);
      return;
    }

    setMsg(null);
    setLoading(true);
    try {
      await api.post('/api/auth/register', { email: form.email, password: form.password });
      setMsg('Cuenta creada. Te redirigiremos al inicio de sesion.');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      const errorMsg = err?.response?.data?.message || err.message || 'No se pudo registrar';
      setMsg(errorMsg);
    } finally {
      setLoading(false);
    }
  };
  // ## Fin enviar registro al backend y redirigir al login

  // ## Render del formulario de registro y enlaces complementarios
  return (
    <div className="glass-panel p-10 space-y-6 animate-fade-in">
      <div className="text-center space-y-3">
        <p className="text-xs uppercase tracking-[0.4em] text-amber-300/70">Crear cuenta</p>
        <h2 className="text-3xl font-semibold text-white">Registra un usuario</h2>
        <p className="text-sm text-gray-400">Habilita el acceso a la plataforma segura</p>
      </div>

      <form onSubmit={submit} className="space-y-5">
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm text-gray-300">Correo electronico</label>
          <input
            id="email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="usuario@empresa.com"
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
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={form.password}
              onChange={handleChange}
              placeholder="********"
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

        <div className="space-y-2">
          <label htmlFor="confirm" className="text-sm text-gray-300">Confirmar contrasena</label>
          <div className="relative">
            <input
              id="confirm"
              name="confirm"
              type={showConfirm ? 'text' : 'password'}
              value={form.confirm}
              onChange={handleChange}
              placeholder="********"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 pr-10 text-white transition focus:border-amber-400 focus:outline-none"
              required
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowConfirm((prev) => !prev)}
              className="absolute inset-y-0 right-3 text-xs font-semibold text-gray-400 hover:text-white"
              tabIndex={-1}
            >
              {showConfirm ? 'Ocultar' : 'Ver'}
            </button>
          </div>
        </div>

        {msg && (
          <div className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-gray-200">
            {msg}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 py-3 font-semibold tracking-wide text-slate-900 shadow-lg transition hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? 'Registrando...' : 'Crear cuenta'}
        </button>
      </form>

      <div className="text-center text-sm text-gray-400">
        <p>
          Ya tienes acceso?{' '}
          <Link className="text-amber-300 hover:text-amber-200 font-semibold" to="/login">
            Volver al login
          </Link>
        </p>
      </div>
    </div>
  );
}
// ## Fin pantalla para registrar nuevos usuarios
