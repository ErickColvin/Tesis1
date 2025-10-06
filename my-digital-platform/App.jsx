// App.jsx
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

const App = () => {
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    try {
      setAuthToken(token);
      const payload = JSON.parse(atob(token.split('.')[1]));
      return { email: payload.email, role: payload.role };
    } catch {
      return null;
    }
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) setAuthToken(token);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setAuthToken('');
    setUser(null);
  };

  return (
    <DataProvider>
      <Router>
        <Navbar user={user} onLogout={handleLogout} />
        <div className="p-4">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/import" element={<ImportExcel />} />
            <Route path="/data" element={<DataTable />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login onLogin={setUser} />} />
            <Route
              path="/admin"
              element={user?.role === 'admin' ? <AdminDashboard /> : <Navigate to="/login" replace />}
            />
            <Route
              path="/import-protected"
              element={user ? <ImportExcel /> : <Navigate to="/login" replace />}
            />
          </Routes>
        </div>
      </Router>
    </DataProvider>
  );
};

export default App;
// End of App.jsx