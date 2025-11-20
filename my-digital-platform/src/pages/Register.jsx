import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

export default function Register() {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  // Validación de email
  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  // Validación de contraseña
  const validatePassword = (password) => {
    return password.length >= 6;
  };

  async function submit(e) {
    e.preventDefault();
    setMsg(null);

    // Validaciones del lado del cliente
    if (!validateEmail(email)) {
      setMsg('⚠️ Por favor ingresa un email válido');
      return;
    }

    if (!validatePassword(pass)) {
      setMsg('⚠️ La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (pass !== confirmPass) {
      setMsg('⚠️ Las contraseñas no coinciden');
      return;
    }

    setLoading(true);

    try {
      await api.post('/api/auth/register', { email, password: pass });
      setMsg('✅ ¡Registro exitoso! Redirigiendo...');
      
      // Redirigir al login después de 2 segundos
      setTimeout(() => {
        navigate('/login', { 
          state: { message: 'Cuenta creada exitosamente. Por favor inicia sesión.' }
        });
      }, 2000);
    } catch (err) {
      console.error('Error en registro:', err);
      
      // Obtener mensaje de error del backend o usar uno genérico
      const errorMsg = err?.response?.data?.message || err?.message || 'Error al registrar';
      const errorDetail = err?.response?.data?.error;
      
      // Mostrar error detallado en desarrollo
      if (errorDetail && import.meta.env.DEV) {
        console.error('Detalles del error:', errorDetail);
      }
      
      // Mensajes de error amigables
      if (errorMsg.includes('ya está registrado') || errorMsg === 'user_exists') {
        setMsg('⚠️ Este email ya está registrado. ¿Ya tienes cuenta?');
      } else if (errorMsg.includes('conexión')) {
        setMsg('⚠️ Error de conexión. Verifica que el servidor esté funcionando.');
      } else {
        setMsg(`⚠️ ${errorMsg}`);
      }
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
              Crear Cuenta
            </h1>
            <p className="text-gray-300">Regístrate para comenzar</p>
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
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-white transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
              <p className="text-xs text-gray-400">Mínimo 6 caracteres</p>
            </div>

            {/* Confirm Password Input */}
            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300">
                Confirmar contraseña
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPass}
                  onChange={e => setConfirmPass(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg 
                           focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                           transition-all duration-200 placeholder-gray-500"
          required
                  disabled={loading}
                  minLength={6}
        />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-white transition-colors"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {/* Error/Success Message */}
            {msg && (
              <div className={`${
                msg.includes('✅') 
                  ? 'bg-green-500/20 border-green-500/50' 
                  : 'bg-red-500/20 border-red-500/50'
              } border rounded-lg p-3 flex items-center gap-2`}>
                <span>{msg.includes('✅') ? '✅' : '⚠️'}</span>
                <p className={`text-sm ${
                  msg.includes('✅') ? 'text-green-300' : 'text-red-300'
                }`}>{msg}</p>
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
                  Creando cuenta...
                </span>
              ) : (
                'Crear cuenta'
              )}
            </button>
      </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/20"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white/10 text-gray-400">¿Ya tienes cuenta?</span>
            </div>
          </div>

          {/* Login Link */}
          <Link
            to="/login"
            className="block w-full py-3 px-4 text-center bg-white/5 border border-white/20 
                     hover:bg-white/10 rounded-lg transition-all duration-200"
          >
            <span className="text-blue-400 hover:text-blue-300 font-medium">
              Iniciar sesión
            </span>
          </Link>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-sm text-gray-400">
          Al registrarte, aceptas nuestros términos y condiciones
        </p>
      </div>
    </div>
  );
}
