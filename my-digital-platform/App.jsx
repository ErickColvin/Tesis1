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
import { DataProvider } from './context/DataContext';
import { setAuthToken } from './services/api';

function parseToken(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return { email: payload.email, role: payload.role, exp: payload.exp };
  } catch {
    return null;
  }
}

export default function App() {
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    const parsed = parseToken(token);
    if (!parsed) {
      localStorage.removeItem('token');
      return null;
    }
    if (parsed.exp && Date.now() >= parsed.exp * 1000) {
      localStorage.removeItem('token');
      return null;
    }
    setAuthToken(token);
    return { email: parsed.email, role: parsed.role };
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) setAuthToken(token);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setAuthToken('');
    setUser(null);
    window.location.replace('/login');
  };

  // if no user: only allow login/register
  if (!user) {
    return (
      <Router>
        <div className="p-4">
          <Routes>
            <Route path="/login" element={<Login onLogin={(u) => setUser(u)} />} />
            <Route path="/register" element={<Register />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </div>
      </Router>
    );
  }

  // authenticated app
  return (
    <DataProvider>
      <Router>
        <Navbar user={user} onLogout={handleLogout} />
        <div className="p-4">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/import" element={<ImportExcel />} />
            <Route path="/data" element={<DataTable />} />
            <Route
              path="/admin"
              element={user?.role === 'admin' ? <AdminDashboard /> : <Navigate to="/" replace />}
            />
            <Route path="/login" element={<Navigate to="/" replace />} />
            <Route path="/register" element={<Navigate to="/" replace />} />
            <Route path="/import-protected" element={user ? <ImportExcel /> : <Navigate to="/login" replace />} />
          </Routes>
        </div>
      </Router>
    </DataProvider>
  );
}
