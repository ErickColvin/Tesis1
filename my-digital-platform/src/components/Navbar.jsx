// src/components/Navbar.jsx
import React, { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { DataContext } from '../context/DataContext';

export default function Navbar({ user, onLogout }) {
  const { alerts } = useContext(DataContext) || { alerts: [] };

  return (
    <nav className="bg-gray-900 shadow p-4 flex justify-between items-center text-white">
      <div className="flex items-center space-x-4">
        <NavLink to="/" className="hover:text-blue-300">Dashboard</NavLink>
        <NavLink to="/import" className="hover:text-blue-300">Importar Excel</NavLink>
        <NavLink to="/products" className="hover:text-blue-300">Productos</NavLink>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative">
          <button className="relative">
            🔔
          </button>
          {alerts.length > 0 && (
            <span className="absolute -top-1 -right-2 bg-red-500 text-white text-xs rounded-full px-1">
              {alerts.length}
            </span>
          )}
        </div>

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
