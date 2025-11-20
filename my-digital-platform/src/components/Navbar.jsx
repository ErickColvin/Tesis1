// src/components/Navbar.jsx
import React, { useContext, useState, useRef, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { DataContext } from '../context/DataContext';

function AlertsDropdown({ alerts }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-white/10 rounded-lg transition-colors"
      >
        🔔
        {alerts.length > 0 && (
          <span className="absolute -top-1 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {alerts.length}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-gray-800 border border-white/20 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto">
          {alerts.length === 0 ? (
            <div className="p-4 text-center text-gray-400 text-sm">
              No hay alertas
            </div>
          ) : (
            <>
              <div className="p-3 border-b border-white/10 bg-gray-900">
                <h3 className="text-sm font-semibold text-white">
                  Alertas ({alerts.length})
                </h3>
              </div>
              <div className="divide-y divide-white/10">
                {alerts.map((alert, idx) => (
                  <div key={idx} className="p-4 hover:bg-gray-700/50 transition-colors">
                    <div className="flex items-start gap-3">
                      <span className="text-red-400 text-xl">⚠️</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white mb-1">
                          {alert.mensaje || alert.message || 'Alerta de stock'}
                        </p>
                        {alert.producto && (
                          <p className="text-xs text-gray-400">
                            Producto: {alert.producto}
                          </p>
                        )}
                        {alert.stock !== undefined && (
                          <p className="text-xs text-gray-400">
                            Stock actual: {alert.stock}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function Navbar({ user, onLogout }) {
  const { alerts } = useContext(DataContext) || { alerts: [] };

  return (
    <nav className="bg-gray-900 shadow p-4 flex justify-between items-center text-white">
      <div className="flex items-center space-x-4">
        <NavLink to="/" className="hover:text-blue-300">Dashboard</NavLink>
        <NavLink to="/import" className="hover:text-blue-300">Importar Excel</NavLink>
        <NavLink to="/products" className="hover:text-blue-300">Productos</NavLink>
        <NavLink to="/trazabilidad" className="hover:text-blue-300">Trazabilidad</NavLink>
      </div>

      <div className="flex items-center gap-4">
        <AlertsDropdown alerts={alerts} />

        {user ? (
          <>
            <span className="text-sm text-gray-200">{user.email}</span>
            {user.role === 'admin' && (
              <NavLink to="/admin" className="text-sm text-red-400 hover:text-red-300">Admin</NavLink>
            )}
            <button
              onClick={onLogout}
              className="px-2 py-1 bg-gray-200 text-gray-900 rounded text-sm"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <NavLink to="/login" className="text-sm text-blue-400 hover:text-blue-300">Login</NavLink>
            <NavLink to="/register" className="text-sm text-blue-400 hover:text-blue-300">Register</NavLink>
          </>
        )}
      </div>
    </nav>
  );
}
