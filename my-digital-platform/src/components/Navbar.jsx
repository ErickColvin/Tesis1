import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { DataContext } from '../context/DataContext';

// ## Barra de navegacion principal con control de permisos
export default function Navbar({ user, onLogout, navLinks = [], canAccess = () => true }) {
  const navigate = useNavigate();
  const { alerts = [] } = useContext(DataContext) || {};
  const [showAlerts, setShowAlerts] = useState(false);
  const alertBtnRef = useRef(null);
  const alertDropdownRef = useRef(null);

  const alertCount = alerts?.length || 0;

  // Cierra el dropdown al hacer click fuera del boton o el panel.
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!showAlerts) return;
      if (
        alertBtnRef.current &&
        !alertBtnRef.current.contains(event.target) &&
        alertDropdownRef.current &&
        !alertDropdownRef.current.contains(event.target)
      ) {
        setShowAlerts(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showAlerts]);

  const statusLabel = (status = '') => {
    const labels = {
      pendiente: 'pendiente',
      en_preparacion: 'en preparacion',
      en_camino: 'en camino',
      entregado: 'entregado',
      cancelado: 'cancelado'
    };
    return labels[status] || status || 'desconocido';
  };

  const formattedAlerts = useMemo(() => {
    return (alerts || []).map((alert) => ({
      id: alert.id || alert._id || alert.message,
      title: alert.producto || alert.nombrePersona || 'Alerta',
      message: alert.message || 'Alerta generada',
      createdAt: alert.createdAt || alert.updatedAt,
      type: alert.type,
      stock: alert.stock,
      minStock: alert.minStock,
      status: alert.status
    }));
  }, [alerts]);

  const handleAlertClick = (alert) => {
    const target = alert.type === 'delivery_status' ? '/trazabilidad' : '/products';
    navigate(target, { state: { alertId: alert.id } });
    setShowAlerts(false);
  };

  // ## Utilidad para estilos de enlaces segun estado activo
  const renderLinkClass = ({ isActive }) =>
    [
      'px-4 py-2 text-sm font-medium rounded-full transition-colors duration-200',
      isActive ? 'bg-white/20 text-white shadow-lg' : 'text-gray-300 hover:text-white hover:bg-white/10'
    ].join(' ');
  // ## Fin utilidad para estilos de enlaces segun estado activo

  // ## Filtrado de enlaces visibles segun permisos
  const visibleLinks = navLinks.filter((link) => canAccess(link.section));
  // ## Fin filtrado de enlaces visibles segun permisos

  // ## Renderizado de cabecera, acciones y navegacion
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
          <div className="relative">
            <button
              type="button"
              ref={alertBtnRef}
              onClick={() => setShowAlerts((open) => !open)}
              className="relative h-11 w-11 rounded-full border border-amber-500/40 bg-amber-500/10 text-amber-100 font-black text-lg shadow-lg hover:bg-amber-500/20 hover:-translate-y-0.5 transition-transform"
              aria-label="Ver alertas"
            >
              !
              {alertCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 min-w-[20px] px-1 rounded-full bg-rose-500 text-[11px] font-bold text-white flex items-center justify-center shadow-md">
                  {alertCount}
                </span>
              )}
            </button>

            {showAlerts && (
              <div
                ref={alertDropdownRef}
                className="absolute right-0 mt-3 w-96 max-w-[calc(100vw-2rem)] rounded-2xl border border-amber-500/40 bg-slate-900 shadow-2xl animate-fade-in"
              >
                <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-white/5">
                  <div>
                    <p className="text-sm font-semibold text-white">Alertas</p>
                    <p className="text-xs text-gray-400">Ultimas alertas activas</p>
                  </div>
                  <span className="px-3 py-1 text-[11px] font-semibold rounded-full bg-amber-500/20 text-amber-100 border border-amber-400/30">
                    {alertCount} {alertCount === 1 ? 'activa' : 'activas'}
                  </span>
                </div>
                <div className="max-h-80 overflow-y-auto px-4 pb-4 pt-2 space-y-2">
                  {alertCount === 0 ? (
                    <p className="text-sm text-gray-400 py-3">Sin alertas por ahora.</p>
                  ) : (
                    formattedAlerts.map((alert) => (
                      <div
                        key={alert.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => handleAlertClick(alert)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleAlertClick(alert);
                          }
                        }}
                        className="p-3 rounded-xl bg-white/5 border border-white/10 shadow-sm flex gap-3 cursor-pointer hover:border-amber-400/50 hover:bg-amber-500/5 transition-colors"
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/90 text-slate-900 font-black text-lg">
                          !
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-sm font-semibold text-white">{alert.title}</p>
                              <p className="text-xs text-amber-100 mt-0.5">{alert.message}</p>
                            </div>
                            <span className="text-[11px] text-gray-400 whitespace-nowrap">
                              {alert.createdAt ? new Date(alert.createdAt).toLocaleString('es-ES') : ''}
                            </span>
                          </div>
                          {alert.type === 'stock' && (
                            <p className="text-[11px] text-gray-300 mt-1">
                              Stock: {alert.stock ?? '-'} / Min: {alert.minStock ?? '-'}
                            </p>
                          )}
                          {alert.type === 'delivery_status' && (
                            <p className="text-[11px] text-gray-300 mt-1">
                              Estado: {statusLabel(alert.status)}
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
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
// ## Fin renderizado de cabecera, acciones y navegacion
