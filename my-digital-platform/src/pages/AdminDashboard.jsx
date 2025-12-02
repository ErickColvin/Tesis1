import React, { useEffect, useMemo, useState } from 'react';
import api from '../services/api';

// ## Catalogo de modulos administrables y su descripcion
const MODULES = [
  { key: 'dashboard', label: 'Dashboard', description: 'Acceso al panel principal y tarjetas resumen.' },
  { key: 'import', label: 'Importar Excel', description: 'Carga masiva de inventario mediante archivos.' },
  { key: 'products', label: 'Productos', description: 'Consulta y edicion del catalogo.' },
  { key: 'trazabilidad', label: 'Trazabilidad', description: 'Seguimiento de entregas y registro de envios.' }
];
// ## Fin catalogo de modulos administrables y su descripcion

// ## Switch reutilizable para toggles de permisos
const PermissionSwitch = ({ label, checked, onToggle, disabled }) => (
  <button
    type="button"
    onClick={onToggle}
    disabled={disabled}
    className={[
      'w-16 rounded-full border px-3 py-1 text-xs font-semibold transition',
      checked ? 'border-emerald-400 bg-emerald-500/20 text-emerald-100' : 'border-white/10 bg-white/5 text-gray-400',
      disabled ? 'opacity-40 cursor-not-allowed' : 'hover:border-white/30'
    ].join(' ')}
  >
    {checked ? 'Activo' : 'Inactivo'}
  </button>
);
// ## Fin switch reutilizable para toggles de permisos

// ## Panel de administracion de usuarios y permisos
export default function AdminDashboard() {
  // ## Estado de usuarios, seleccion, flags de carga y feedback
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);
  // ## Fin estado de usuarios, seleccion, flags de carga y feedback

  // ## Usuario seleccionado memoizado
  const selectedUser = useMemo(() => users.find((user) => user._id === selectedUserId), [users, selectedUserId]);
  // ## Fin usuario seleccionado memoizado

  // ## Helper para mostrar feedback temporal
  const showFeedback = (message, type = 'info') => {
    setFeedback({ message, type });
    setTimeout(() => setFeedback(null), 3000);
  };
  // ## Fin helper para mostrar feedback temporal

  // ## Carga inicial de usuarios
  const loadUsers = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/api/admin/users');
      setUsers(data);
      if (!selectedUserId && data.length > 0) {
        setSelectedUserId(data[0]._id);
      }
    } catch (err) {
      console.error('listUsers', err);
      showFeedback('No se pudo cargar la lista de usuarios', 'error');
    } finally {
      setLoading(false);
    }
  };
  // ## Fin carga inicial de usuarios

  useEffect(() => {
    loadUsers();
  }, []);

  // ## Actualizar usuario en memoria
  const updateUserInState = (id, partial) => {
    setUsers((prev) => prev.map((user) => (user._id === id ? { ...user, ...partial } : user)));
  };
  // ## Fin actualizar usuario en memoria

  // ## Alternar rol entre admin, user y cliente
  const toggleRole = async (user) => {
    setSaving(true);
    try {
      const nextRole = user.role === 'admin' ? 'user' : user.role === 'user' ? 'cliente' : 'admin';
      const { data } = await api.patch(`/api/admin/users/${user._id}/role`, { role: nextRole });
      updateUserInState(user._id, { role: data.role, permissions: data.permissions });
      showFeedback('Rol actualizado correctamente', 'success');
    } catch (err) {
      const message = err?.response?.data?.message === 'must_have_one_admin'
        ? 'Debe existir al menos un administrador activo.'
        : err?.response?.data?.message || 'No se pudo actualizar el rol';
      showFeedback(message, 'error');
    } finally {
      setSaving(false);
    }
  };
  // ## Fin alternar rol entre admin, user y cliente

  // ## Alternar permisos de vista/edicion por modulo
  const togglePermission = async (section, field) => {
    if (!selectedUser) return;
    const current = selectedUser.permissions?.[section] || { view: false, edit: false };
    let nextValue = !current[field];
    const nextPermissions = { view: current.view, edit: current.edit };

    if (field === 'edit' && nextValue) {
      nextPermissions.view = true;
    }
    if (field === 'view' && !nextValue) {
      nextPermissions.edit = false;
    }
    nextPermissions[field] = nextValue;

    setSaving(true);
    try {
      const { data } = await api.patch(`/api/admin/users/${selectedUser._id}/permissions`, {
        permissions: { [section]: nextPermissions }
      });
      updateUserInState(selectedUser._id, { permissions: data.permissions });
      showFeedback('Permisos actualizados', 'success');
    } catch (err) {
      console.error('updatePermissions', err);
      showFeedback('No se pudieron actualizar los permisos', 'error');
    } finally {
      setSaving(false);
    }
  };
  // ## Fin alternar permisos de vista/edicion por modulo

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="glass-panel px-10 py-6 text-center">
          <p className="text-sm text-gray-400">Cargando usuarios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.4em] text-amber-300/70">Control central</p>
        <h1 className="text-3xl font-semibold text-white">Panel de administracion</h1>
        <p className="text-sm text-gray-400">Asigna roles y permisos finos para cada modulo de la plataforma.</p>
      </header>

      {feedback && (
        <div
          className={[
            'rounded-2xl px-5 py-3 text-sm',
            feedback.type === 'error'
              ? 'border border-rose-500/40 bg-rose-500/10 text-rose-100'
              : 'border border-emerald-500/40 bg-emerald-500/10 text-emerald-100'
          ].join(' ')}
        >
          {feedback.message}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[320px,1fr]">
        <aside className="glass-panel p-6 space-y-4">
          <p className="text-xs uppercase tracking-[0.3em] text-gray-500">Usuarios</p>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            {users.map((user) => (
              <button
                key={user._id}
                type="button"
                onClick={() => setSelectedUserId(user._id)}
                className={[
                  'w-full rounded-2xl border px-4 py-4 text-left transition',
                  selectedUserId === user._id
                    ? 'border-amber-400 bg-amber-500/10 text-white'
                    : 'border-white/10 bg-white/5 text-gray-200 hover:border-white/30'
                ].join(' ')}
              >
                <p className="text-sm font-semibold">{user.email}</p>
                <p className="text-xs uppercase tracking-widest text-gray-400">{user.role}</p>
              </button>
            ))}
          </div>
        </aside>

        <section className="glass-panel p-6 space-y-6">
          {selectedUser ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-gray-400">Gestionando permisos de:</p>
                  <h2 className="text-2xl font-semibold text-white">{selectedUser.email}</h2>
                </div>
                <button
                  type="button"
                  onClick={() => toggleRole(selectedUser)}
                  disabled={saving}
                  className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 disabled:opacity-50"
                >
                  {selectedUser.role === 'admin'
                    ? 'Convertir a usuario/cliente'
                    : selectedUser.role === 'cliente'
                    ? 'Convertir a usuario'
                    : 'Promover a admin'}
                </button>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-white/10">
                <table className="min-w-full divide-y divide-white/10">
                  <thead className="bg-white/5 text-left text-xs uppercase tracking-wider text-gray-400">
                    <tr>
                      <th className="px-4 py-3">Modulo</th>
                      <th className="px-4 py-3">Descripcion</th>
                      <th className="px-4 py-3 text-center">Acceso</th>
                      <th className="px-4 py-3 text-center">Edicion</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {MODULES.map((module) => {
                      const permissions = selectedUser.permissions?.[module.key] || { view: false, edit: false };
                      return (
                        <tr key={module.key}>
                          <td className="px-4 py-4 text-sm font-semibold text-white">{module.label}</td>
                          <td className="px-4 py-4 text-sm text-gray-300">{module.description}</td>
                          <td className="px-4 py-4 text-center">
                            <PermissionSwitch
                              label="Acceso"
                              checked={permissions.view}
                              disabled={saving}
                              onToggle={() => togglePermission(module.key, 'view')}
                            />
                          </td>
                          <td className="px-4 py-4 text-center">
                            <PermissionSwitch
                              label="Edicion"
                              checked={permissions.edit}
                              disabled={saving}
                              onToggle={() => togglePermission(module.key, 'edit')}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <p className="text-sm text-gray-400">Selecciona un usuario para comenzar.</p>
          )}
        </section>
      </div>
    </div>
  );
}
// ## Fin panel de administracion de usuarios y permisos
