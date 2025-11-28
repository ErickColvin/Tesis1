import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

export default function Navbar({ user, onLogout, navLinks = [], canAccess = () => true }) {
  const navigate = useNavigate();

  const renderLinkClass = ({ isActive }) =>
    [
      'px-4 py-2 text-sm font-medium rounded-full transition-colors duration-200',
      isActive ? 'bg-white/20 text-white shadow-lg' : 'text-gray-300 hover:text-white hover:bg-white/10'
    ].join(' ');

  const visibleLinks = navLinks.filter((link) => canAccess(link.section));

  return (
    <header className="sticky top-4 z-40">
      <div className="glass-panel px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-amber-300/70">Trace Link</p>
            <p className="text-lg font-semibold text-white">Panel Operativo</p>
          </div>
          <nav className="hidden lg:flex items-center gap-2">
            {visibleLinks.map((link) => (
              <NavLink key={link.path} to={link.path} className={renderLinkClass}>
                {link.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {user?.role === 'admin' && (
            <button
              type="button"
              onClick={() => navigate('/admin')}
              className="h-11 px-5 rounded-full border border-white/20 bg-gradient-to-r from-orange-500 to-rose-500 text-sm font-semibold tracking-wide shadow-lg hover:from-orange-600 hover:to-rose-600 hover:shadow-xl transition-transform hover:-translate-y-0.5"
            >
              ADMIN
            </button>
          )}
          <div className="text-right">
            <p className="text-sm font-semibold text-white">{user?.email}</p>
            <p className="text-xs uppercase tracking-wider text-gray-400">{user?.role}</p>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="px-4 py-2 text-sm font-semibold rounded-full bg-white/10 border border-white/20 hover:bg-white/20 transition-colors"
          >
            Salir
          </button>
        </div>

        <nav className="flex w-full flex-wrap gap-2 pt-2 border-t border-white/5 lg:hidden">
          {visibleLinks.map((link) => (
            <NavLink key={`mobile-${link.path}`} to={link.path} className={renderLinkClass}>
              {link.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}
