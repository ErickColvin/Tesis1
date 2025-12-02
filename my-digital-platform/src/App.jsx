// src/App.jsx
import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import ImportExcel from './pages/ImportExcel';
import DataTable from './pages/DataTable';
import Register from './pages/Register';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import Trazabilidad from './pages/Trazabilidad';
import AddDelivery from './pages/AddDelivery';
import MercadoLibreReturns from './pages/MercadoLibreReturns';
import ReturnForm from './pages/ReturnForm';
import ClientView from './pages/ClientView';
import ClientAddOrder from './pages/ClientAddOrder';
import { DataProvider } from './context/DataProvider';
import AccessDenied from './components/AccessDenied';
import { setAuthToken } from './services/api';

// ## Configuracion de rutas y etiquetas para la navegacion
const NAV_LINKS = [
  { path: '/', label: 'Inicio', section: 'dashboard' },
  { path: '/products', label: 'Productos', section: 'products' },
  { path: '/trazabilidad', label: 'Trazabilidad', section: 'trazabilidad' },
  { path: '/returns', label: 'Mercado Libre', section: 'trazabilidad' },
  { path: '/cliente', label: 'Cliente', section: 'dashboard' }
];

const SECTION_LABELS = {
  dashboard: 'el panel principal',
  import: 'la importacion de Excel',
  products: 'el modulo de productos',
  trazabilidad: 'la trazabilidad'
};
// ## Fin configuracion de rutas y etiquetas para la navegacion

// ## Capas de fondo para efectos visuales generales
const BackgroundLayers = () => (
  <>
    <div className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-72 bg-gradient-to-b from-slate-900/70 via-blue-950/30 to-transparent blur-3xl opacity-80" />
    <div className="pointer-events-none fixed inset-x-0 bottom-0 -z-10 h-72 bg-gradient-to-t from-slate-950/70 via-blue-950/30 to-transparent blur-3xl opacity-80" />
  </>
);
// ## Fin capas de fondo para efectos visuales generales

// ## Componente principal de la aplicacion
const App = () => {
  // ## Estado y efectos iniciales de autenticacion
  const [user, setUser] = useState(null);

  useEffect(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('userProfile');
  }, []);
  // ## Fin estado y efectos iniciales de autenticacion

  // ## Funcion para cerrar sesion
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userProfile');
    setAuthToken('');
    setUser(null);
  };
  // ## Fin funcion para cerrar sesion

  // ## Redireccion inicial si no hay usuario
  useEffect(() => {
    if (!user && window.location.pathname !== '/register') {
      window.history.replaceState({}, '', '/login');
    }
  }, [user]);
  // ## Fin redireccion inicial si no hay usuario

  // ## Funcion para manejar login exitoso
  const handleLoginSuccess = (sessionUser) => {
    setUser(sessionUser);
  };
  // ## Fin funcion para manejar login exitoso

  // ## Validaciones de permisos de vista y edicion
  const canView = (section) => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    return Boolean(user.permissions?.[section]?.view);
  };

  const canEdit = (section) => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    return Boolean(user.permissions?.[section]?.edit);
  };
  // ## Fin validaciones de permisos de vista y edicion

  // ## Guardia de rutas para verificar permisos
  const guard = (section, node) => {
    return canView(section) ? node : <AccessDenied label={SECTION_LABELS[section] || 'esta area'} />;
  };
  // ## Fin guardia de rutas para verificar permisos

  // ## Render de rutas segun autenticacion
  return (
    <Router>
      <div className="min-h-screen relative overflow-hidden bg-slate-950 text-slate-100 animated-bg">
        <BackgroundLayers />
        {user ? (
          <DataProvider>
            <div className="relative z-10 w-full max-w-[1800px] mx-auto px-4 sm:px-8 lg:px-10 py-6 space-y-6">
              <Navbar
                user={user}
                onLogout={handleLogout}
                navLinks={NAV_LINKS}
                canAccess={canView}
              />
              <main className="glass-panel p-6 sm:p-10 animate-fade-in">
                <Routes>
                  <Route path="/" element={guard('dashboard', <Home user={user} />)} />
                  <Route path="/import" element={guard('import', <ImportExcel allowEdit={canEdit('import')} />)} />
                  <Route path="/data" element={guard('products', <DataTable allowEdit={canEdit('products')} />)} />
                  <Route path="/products" element={guard('products', <DataTable allowEdit={canEdit('products')} />)} />
                  <Route
                    path="/trazabilidad"
                    element={guard('trazabilidad', <Trazabilidad allowEdit={canEdit('trazabilidad')} />)}
                  />
                  <Route
                    path="/returns"
                    element={guard(
                      'trazabilidad',
                      <MercadoLibreReturns allowEdit={canEdit('trazabilidad')} />
                    )}
                  />
                  <Route
                    path="/returns/new"
                    element={guard(
                      'trazabilidad',
                      canEdit('trazabilidad') ? <ReturnForm /> : <AccessDenied label="crear devoluciones" />
                    )}
                  />
                  <Route
                    path="/cliente"
                    element={guard('dashboard', <ClientView allowEdit />)}
                  />
                  <Route
                    path="/cliente/nuevo"
                    element={guard('dashboard', <ClientAddOrder />)}
                  />
                  <Route
                    path="/add-delivery"
                    element={
                      canEdit('trazabilidad')
                        ? <AddDelivery />
                        : <AccessDenied label="el registro de nuevas entregas" />
                    }
                  />
                  <Route
                    path="/admin"
                    element={user?.role === 'admin' ? <AdminDashboard /> : <AccessDenied label="el panel de administracion" />}
                  />
                  <Route path="/login" element={<Navigate to="/" replace />} />
                  <Route path="/register" element={<Navigate to="/" replace />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </main>
            </div>
          </DataProvider>
        ) : (
          <div className="relative z-10 flex min-h-screen items-center justify-center px-4">
            <div className="w-full max-w-2xl">
              <div className="mb-8 text-center">
                <p className="text-sm uppercase tracking-[0.3em] text-amber-300/70">Trace Link</p>
                <h1 className="text-3xl font-semibold text-white mt-3">Plataforma digital segura</h1>
                <p className="text-gray-300 text-sm mt-2">Accede con tus credenciales para continuar</p>
              </div>
              <Routes>
                <Route path="/login" element={<Login onLogin={handleLoginSuccess} />} />
                <Route path="/register" element={<Register />} />
                <Route path="*" element={<Navigate to="/login" replace />} />
              </Routes>
            </div>
          </div>
        )}
      </div>
    </Router>
  );
  // ## Fin render de rutas segun autenticacion
};
// ## Fin componente principal de la aplicacion

export default App;
