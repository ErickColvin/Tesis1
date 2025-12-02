import React, { useEffect, useState } from 'react';
import api from '../services/api';

// ## Configuracion de estados y estilos de badges
const STATUS_CONFIG = {
  pendiente: { label: 'Pendiente', badge: 'bg-amber-500/20 text-amber-200 border border-amber-500/50', dot: 'bg-amber-400' },
  en_preparacion: { label: 'En preparacion', badge: 'bg-sky-500/20 text-sky-200 border border-sky-500/50', dot: 'bg-sky-400' },
  en_camino: { label: 'En camino', badge: 'bg-purple-500/20 text-purple-200 border border-purple-500/50', dot: 'bg-purple-400' },
  entregado: { label: 'Entregado', badge: 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/40', dot: 'bg-emerald-400' },
  cancelado: { label: 'Cancelado', badge: 'bg-rose-500/20 text-rose-200 border border-rose-500/50', dot: 'bg-rose-500' }
};

const STATUS_ORDER = ['', 'pendiente', 'en_preparacion', 'en_camino', 'entregado', 'cancelado'];
const STATUS_OPTIONS = STATUS_ORDER.filter(Boolean);
// ## Fin configuracion de estados y estilos de badges

// ## Chip visual para mostrar estado de una entrega
const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || { label: status, badge: 'bg-white/10 text-gray-200 border border-white/10', dot: 'bg-gray-400' };
  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${cfg.badge}`}>
      <span className={`h-2 w-2 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
};
// ## Fin chip visual para mostrar estado de una entrega

// ## Panel de trazabilidad de entregas con filtros y edicion
export default function Trazabilidad({ allowEdit = false }) {
  // ## Estado para entregas, filtros, modales y configuracion de alertas
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [searchText, setSearchText] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showAlertConfigModal, setShowAlertConfigModal] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    stockThreshold: 10,
    notifyStatuses: ['pendiente', 'en_preparacion'],
    emailRecipients: []
  });
  const [alertEmailInput, setAlertEmailInput] = useState('');
  const [configLoading, setConfigLoading] = useState(false);
  const [savingAlertConfig, setSavingAlertConfig] = useState(false);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [editor, setEditor] = useState({ open: false, delivery: null, form: {} });
  // ## Fin estado para entregas, filtros, modales y configuracion de alertas

  // ## Carga de entregas al cambiar filtros o pagina
  useEffect(() => {
    loadDeliveries();
  }, [page, filterStatus, searchText]);
  // ## Fin carga de entregas al cambiar filtros o pagina

  // ## Carga de configuracion de alertas al abrir modal
  useEffect(() => {
    if (!showAlertConfigModal || !allowEdit) return;
    loadAlertConfiguration();
  }, [showAlertConfigModal, allowEdit]);
  // ## Fin carga de configuracion de alertas al abrir modal

  // ## Consulta de entregas con paginacion y filtros
  const loadDeliveries = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (filterStatus) params.append('status', filterStatus);
      if (searchText) params.append('search', searchText);
      const res = await api.get(`/api/deliveries?${params}`);
      const deliveriesList = res.data.deliveries || res.data || [];
      setDeliveries(Array.isArray(deliveriesList) ? deliveriesList : []);
      setTotalPages(res.data.totalPages || Math.max(1, Math.ceil((deliveriesList.length || 0) / 20)));
      setError(null);
    } catch (err) {
      console.error('Error cargando deliveries:', err);
      const errorMsg = err.response?.data?.message || err.response?.data?.error || err.message || 'Error desconocido';
      setError(`No se pudo cargar la trazabilidad: ${errorMsg}`);
      setDeliveries([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };
  // ## Fin consulta de entregas con paginacion y filtros

  // ## Cambio rapido de filtro de estado
  const handleStatusFilterChange = (status) => {
    setFilterStatus(status);
    setPage(1);
  };
  // ## Fin cambio rapido de filtro de estado

  // ## Obtener configuracion actual de alertas
  const loadAlertConfiguration = async () => {
    setConfigLoading(true);
    try {
      const { data } = await api.get('/api/alerts/config');
      setAlertConfig({
        stockThreshold: data.stockThreshold ?? 10,
        notifyStatuses: Array.isArray(data.notifyStatuses) ? data.notifyStatuses : [],
        emailRecipients: data.emailRecipients || []
      });
      setAlertEmailInput((data.emailRecipients || []).join(', '));
    } catch (err) {
      console.error('alert config', err);
      setFeedback({ type: 'error', message: 'No se pudo cargar la configuracion de alertas.' });
    } finally {
      setConfigLoading(false);
    }
  };
  // ## Fin obtener configuracion actual de alertas

  // ## Activar o desactivar estado monitoreado para alertas
  const toggleStatusSelection = (status) => {
    setAlertConfig((prev) => {
      const exists = prev.notifyStatuses?.includes(status);
      const updated = exists
        ? prev.notifyStatuses.filter((s) => s !== status)
        : [...(prev.notifyStatuses || []), status];
      return { ...prev, notifyStatuses: updated };
    });
  };
  // ## Fin activar o desactivar estado monitoreado para alertas

  // ## Guardar configuracion de alertas en servidor
  const saveAlertConfig = async () => {
    setSavingAlertConfig(true);
    try {
      const payload = {
        stockThreshold: Number(alertConfig.stockThreshold) || 1,
        notifyStatuses: alertConfig.notifyStatuses || [],
        emailRecipients: alertEmailInput
      };
      const { data } = await api.put('/api/alerts/config', payload);
      setAlertConfig({
        stockThreshold: data.stockThreshold,
        notifyStatuses: data.notifyStatuses,
        emailRecipients: data.emailRecipients
      });
      setFeedback({ type: 'success', message: 'Configuracion de alertas guardada.' });
      setShowAlertConfigModal(false);
    } catch (err) {
      console.error('save alert config', err);
      setFeedback({ type: 'error', message: 'No se pudo guardar la configuracion.' });
    } finally {
      setSavingAlertConfig(false);
    }
  };
  // ## Fin guardar configuracion de alertas en servidor

  // ## Formateo de fechas para inputs datetime-local
  const formatInputValue = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const iso = date.toISOString();
    return iso.slice(0, 16);
  };
  // ## Fin formateo de fechas para inputs datetime-local

  // ## Apertura de modal de edicion con datos normalizados
  const openEditModal = (delivery) => {
    if (!delivery) return;
    setEditor({
      open: true,
      delivery,
      form: {
        nombrePersona: delivery.nombrePersona || delivery.personName || '',
        nombreProductos: delivery.nombreProductos || delivery.productName || '',
        cantidad: delivery.cantidad || delivery.quantity || 0,
        status: delivery.status || 'pendiente',
        direccion: delivery.direccion || delivery.address || '',
        fechaEntregaEstimada: formatInputValue(delivery.fechaEntregaEstimada || delivery.estimatedDeliveryDate),
        notas: delivery.notas || '',
        plataforma: delivery.plataforma || 'delivery'
      }
    });
  };
  // ## Fin apertura de modal de edicion con datos normalizados

  // ## Cerrar modal de edicion
  const closeEditor = () => setEditor({ open: false, delivery: null, form: {} });
  // ## Fin cerrar modal de edicion

  // ## Actualizar campos en formulario de edicion
  const updateEditForm = (field, value) => {
    setEditor((prev) => ({ ...prev, form: { ...prev.form, [field]: value } }));
  };
  // ## Fin actualizar campos en formulario de edicion

  // ## Guardar cambios de una entrega editada
  const handleEditorSave = async () => {
    if (!editor.delivery) return;
    const targetId = editor.delivery.id || editor.delivery._id;
    if (!targetId) return;
    const payload = {
      ...editor.form,
      cantidad: Number(editor.form.cantidad) || 0,
      fechaEntregaEstimada: editor.form.fechaEntregaEstimada
        ? new Date(editor.form.fechaEntregaEstimada)
        : null
    };

    if (!payload.fechaEntregaEstimada) {
      delete payload.fechaEntregaEstimada;
    }

    try {
      const { data } = await api.patch(`/api/deliveries/${targetId}`, payload);
      setDeliveries((prev) =>
        prev.map((item) => {
          const compareId = item.id || item._id;
          return compareId === targetId ? { ...item, ...data } : item;
        })
      );
      setFeedback({ type: 'success', message: 'Entrega actualizada correctamente.' });
      closeEditor();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'No se pudo actualizar el delivery.';
      setFeedback({ type: 'error', message: msg });
    }
  };
  // ## Fin guardar cambios de una entrega editada

  // ## Limpieza automatica de mensajes temporales
  useEffect(() => {
    if (!feedback) return;
    const timeout = setTimeout(() => setFeedback(null), 4000);
    return () => clearTimeout(timeout);
  }, [feedback]);
  // ## Fin limpieza automatica de mensajes temporales

  // ## Formato legible de fecha de entrega
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  // ## Fin formato legible de fecha de entrega

  // ## Reducir IDs largos para mostrarlos en tabla
  const formatDisplayId = (value) => {
    if (!value) return '-';
    const text = String(value).trim();
    const shortened = text.slice(0, 8);
    return shortened.length >= 3 ? shortened : text;
  };
  // ## Fin reducir IDs largos para mostrarlos en tabla

  // ## Busqueda y conteo resumido por estado
  const normalizedSearch = searchText.trim().toLowerCase();
  const filteredDeliveries = deliveries.filter((delivery) => {
    if (!normalizedSearch) return true;
    const haystack = [
      delivery.nombrePersona,
      delivery.personName,
      delivery.nombreProductos,
      delivery.productName,
      delivery.direccion,
      delivery.address,
      delivery.status,
      delivery.plataforma,
      delivery._id,
      delivery.id
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return haystack.includes(normalizedSearch);
  });

  const statusSummary = ['pendiente', 'en_preparacion', 'en_camino', 'entregado'].map((key) => ({
    key,
    label: STATUS_CONFIG[key]?.label || key,
    count: filteredDeliveries.filter((delivery) => delivery.status === key).length
  }));
  // ## Fin busqueda y conteo resumido por estado

  // ## Render principal con filtros, tabla y modales de configuracion
  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-amber-300/70">Monitor en vivo</p>
          <h1 className="text-3xl font-semibold text-white">Trazabilidad de entregas</h1>
          <p className="text-sm text-gray-400">Observa el estado de cada pedido y anticipa cuellos de botella.</p>
        </div>
        {allowEdit && (
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setShowAddProductModal(true)}
              className="rounded-full bg-gradient-to-r from-emerald-500 to-lime-500 px-5 py-2 text-sm font-semibold text-slate-900 shadow-lg transition hover:shadow-xl"
            >
              Agregar producto
            </button>
            <button
              type="button"
              onClick={() => setShowAlertConfigModal(true)}
              className="rounded-full border border-white/20 px-5 py-2 text-sm font-semibold text-white hover:bg-white/10 transition"
            >
              Configurar alertas
            </button>
          </div>
        )}
      </header>

      {error && (
        <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 px-6 py-4 text-sm text-rose-100">
          {error}
        </div>
      )}
      {feedback && (
        <div
          className={`rounded-2xl px-6 py-4 text-sm ${
            feedback.type === 'error'
              ? 'border border-rose-500/40 bg-rose-500/10 text-rose-100'
              : 'border border-emerald-500/40 bg-emerald-500/10 text-emerald-100'
          }`}
        >
          {feedback.message}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[360px,1fr]">
        <aside className="glass-panel p-6 space-y-6 min-h-[420px]">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Busqueda rapida</p>
            <input
              type="text"
              value={searchText}
              onChange={(e) => {
                setSearchText(e.target.value);
                setPage(1);
              }}
              placeholder="Cliente, producto, direccion..."
              className="mt-3 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-amber-400 focus:outline-none"
            />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Filtrar por estado</p>
            <select
              className="select-dark mt-3 w-full appearance-none rounded-xl border px-4 py-3 text-sm"
              value={filterStatus}
              onChange={(e) => handleStatusFilterChange(e.target.value)}
            >
              {STATUS_ORDER.map((status) => (
                <option key={status || 'todos'} value={status}>
                  {status ? STATUS_CONFIG[status]?.label : 'Todos los estados'}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Resumen rapido</p>
            {statusSummary.map((item) => {
              const isActive = filterStatus === item.key;
              return (
                <button
                  type="button"
                  key={item.key}
                  onClick={() => handleStatusFilterChange(isActive ? '' : item.key)}
                  className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 transition ${
                    isActive
                      ? 'border-white/40 bg-white/15 text-white'
                      : 'border-white/10 bg-white/5 text-gray-300 hover:border-white/20'
                  }`}
                >
                  <span className="text-sm">{item.label}</span>
                  <span className="text-lg font-semibold text-white">{item.count}</span>
                </button>
              );
            })}
          </div>
        </aside>

        <section className="glass-panel overflow-hidden min-h-[540px] p-2 sm:p-4">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-white/5">
            <thead>
              <tr className="text-left text-xs uppercase tracking-widest text-gray-400">
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Productos</th>
                <th className="px-4 py-3">Cantidad</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Direccion</th>
                <th className="px-4 py-3">Fecha entrega</th>
                {allowEdit && <th className="px-4 py-3 text-right">Acciones</th>}
              </tr>
            </thead>
              <tbody className="divide-y divide-white/5">
                {loading
                  ? Array.from({ length: 5 }).map((_, idx) => (
                      <tr key={`skeleton-${idx}`} className="animate-pulse">
                        {Array.from({ length: allowEdit ? 8 : 7 }).map((__, cellIdx) => (
                          <td key={`${idx}-${cellIdx}`} className="px-4 py-4">
                            <div className="h-4 w-full rounded bg-white/5" />
                          </td>
                        ))}
                      </tr>
                    ))
                  : filteredDeliveries.length === 0 ? (
                    <tr>
                      <td colSpan={allowEdit ? 8 : 7} className="px-4 py-10 text-center text-gray-400">
                        {deliveries.length === 0 ? 'No hay entregas registradas.' : 'No hay coincidencias con el filtro o busqueda.'}
                      </td>
                    </tr>
                    )
                  : filteredDeliveries.map((delivery) => {
                      const deliveryId = delivery._id || delivery.id;
                      const personName = delivery.nombrePersona || delivery.personName || '-';
                      const productName = delivery.nombreProductos || delivery.productName || '-';
                      const quantity = delivery.cantidad || delivery.quantity || 0;
                      const address = delivery.direccion || delivery.address || '-';
                      const deliveryDate = delivery.fechaEntregaEstimada || delivery.estimatedDeliveryDate;
                      const displayId = formatDisplayId(deliveryId);
                      return (
                        <tr key={deliveryId} className="hover:bg-white/10 transition-colors">
                          <td className="px-4 py-4 text-sm text-gray-400 font-mono" title={deliveryId}>
                            {displayId}
                          </td>
                          <td className="px-4 py-4 text-sm text-white">{personName}</td>
                      <td className="px-4 py-4 text-sm text-gray-200">{productName}</td>
                          <td className="px-4 py-4 text-sm text-gray-200">{quantity}</td>
                          <td className="px-4 py-4 text-sm">
                            <StatusBadge status={delivery.status} />
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-200">{address}</td>
                      <td className="px-4 py-4 text-sm text-gray-200">{formatDate(deliveryDate)}</td>
                      {allowEdit && (
                        <td className="px-4 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => openEditModal(delivery)}
                            className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-white hover:bg-white/10"
                          >
                            <svg
                              className="h-4 w-4"
                              viewBox="0 0 20 20"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                              aria-hidden="true"
                            >
                              <path
                                d="M4 13.5V16h2.5L15 7.5 12.5 5 4 13.5zM17 5.5l-2-2a1 1 0 00-1.4 0L12 5.1 14.9 8l1.6-1.6a1 1 0 000-1.4z"
                                fill="currentColor"
                              />
                            </svg>
                            Editar
                          </button>
                        </td>
                      )}
                        </tr>
                      );
                    })}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={page === 1}
            className="rounded-full border border-white/20 px-4 py-2 text-sm text-white disabled:opacity-40"
          >
            Anterior
          </button>
          <span className="text-sm text-gray-300">
            Pagina {page} de {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={page === totalPages}
            className="rounded-full border border-white/20 px-4 py-2 text-sm text-white disabled:opacity-40"
          >
            Siguiente
          </button>
        </div>
      )}

      {editor.open && allowEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4">
          <div className="glass-panel relative w-full max-w-4xl p-8 max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              className="absolute right-4 top-4 text-gray-400 hover:text-white"
              onClick={closeEditor}
            >
              Cerrar
            </button>
            <h3 className="text-2xl font-semibold text-white mb-2">Editar entrega</h3>
            <p className="text-sm text-gray-300 mb-6">
              Actualiza la informacion del envio. Los cambios quedan registrados inmediatamente.
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm text-gray-300">Nombre de la persona</label>
                <input
                  type="text"
                  value={editor.form.nombrePersona}
                  onChange={(e) => updateEditForm('nombrePersona', e.target.value)}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-amber-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-sm text-gray-300">Producto</label>
                <input
                  type="text"
                  value={editor.form.nombreProductos}
                  onChange={(e) => updateEditForm('nombreProductos', e.target.value)}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-amber-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-sm text-gray-300">Cantidad</label>
                <input
                  type="number"
                  min="0"
                  value={editor.form.cantidad}
                  onChange={(e) => updateEditForm('cantidad', e.target.value)}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-amber-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-sm text-gray-300">Estado</label>
                <select
                  value={editor.form.status}
                  onChange={(e) => updateEditForm('status', e.target.value)}
                  className="mt-2 w-full rounded-xl select-dark px-4 py-3 focus:border-amber-400 focus:outline-none"
                >
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {STATUS_CONFIG[status]?.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-300">Direccion</label>
                <input
                  type="text"
                  value={editor.form.direccion}
                  onChange={(e) => updateEditForm('direccion', e.target.value)}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-amber-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-sm text-gray-300">Plataforma</label>
                <select
                  value={editor.form.plataforma}
                  onChange={(e) => updateEditForm('plataforma', e.target.value)}
                  className="mt-2 w-full rounded-xl select-dark px-4 py-3 focus:border-amber-400 focus:outline-none"
                >
                  <option value="delivery">Delivery</option>
                  <option value="mercadolibre">MercadoLibre</option>
                  <option value="otro">Otro</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-300">Fecha estimada de entrega</label>
                <input
                  type="datetime-local"
                  value={editor.form.fechaEntregaEstimada}
                  onChange={(e) => updateEditForm('fechaEntregaEstimada', e.target.value)}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-amber-400 focus:outline-none"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm text-gray-300">Notas internas</label>
                <textarea
                  rows="3"
                  value={editor.form.notas}
                  onChange={(e) => updateEditForm('notas', e.target.value)}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-amber-400 focus:outline-none"
                />
              </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-3 justify-end">
              <button
                type="button"
                onClick={handleEditorSave}
                className="rounded-xl bg-gradient-to-r from-orange-500 to-rose-500 px-6 py-3 text-sm font-semibold shadow-lg hover:from-orange-600 hover:to-rose-600 hover:shadow-xl"
              >
                Guardar cambios
              </button>
              <button
                type="button"
                onClick={closeEditor}
                className="rounded-xl border border-white/20 px-6 py-3 text-sm text-white hover:bg-white/10"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4">
          <div className="glass-panel relative w-full max-w-lg p-8">
            <button
              type="button"
              className="absolute right-4 top-4 text-gray-400 hover:text-white"
              onClick={() => setShowAddProductModal(false)}
            >
              Cerrar
            </button>
            <h3 className="text-2xl font-semibold text-white mb-2">Agregar producto</h3>
            <p className="text-sm text-gray-300 mb-6">
              Para agregar nuevos articulos redirigete al modulo de productos donde podras crear SKUs y stock inicial.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowAddProductModal(false);
                  window.location.href = '/products';
                }}
                className="flex-1 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-3 font-semibold text-slate-900 shadow-lg"
              >
                Ir a productos
              </button>
              <button
                type="button"
                onClick={() => setShowAddProductModal(false)}
                className="rounded-xl border border-white/20 px-4 py-3 text-white"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {showAlertConfigModal && allowEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4">
          <div className="glass-panel relative w-full max-w-3xl p-8 max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              className="absolute right-4 top-4 text-gray-400 hover:text-white"
              onClick={() => setShowAlertConfigModal(false)}
            >
              Cerrar
            </button>
            <h3 className="text-2xl font-semibold text-white mb-3">Configurar alertas</h3>
            <p className="text-sm text-gray-300 mb-6">
              Define umbrales de inventario y estados de entrega que activan notificaciones en el panel.
            </p>
            {configLoading ? (
              <div className="py-16 text-center text-gray-400">Cargando configuracion...</div>
            ) : (
              <div className="space-y-6">
                <div>
                  <label className="text-sm text-gray-300">Umbral de stock</label>
                  <input
                    type="number"
                    min="1"
                    value={alertConfig.stockThreshold}
                    onChange={(e) =>
                      setAlertConfig((prev) => ({ ...prev, stockThreshold: Number(e.target.value) }))
                    }
                    className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-amber-400 focus:outline-none"
                  />
                  <p className="mt-1 text-xs text-gray-400">
                    El sistema creara alertas cuando un producto este por debajo de este valor.
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-300 mb-2">Estados de entrega a vigilar</p>
                  <div className="flex flex-wrap gap-3">
                    {STATUS_OPTIONS.map((status) => (
                      <button
                        type="button"
                        key={`status-${status}`}
                        onClick={() => toggleStatusSelection(status)}
                        className={`rounded-full border px-4 py-2 text-xs font-semibold transition ${
                          alertConfig.notifyStatuses?.includes(status)
                            ? 'border-amber-400 bg-amber-500/20 text-amber-100'
                            : 'border-white/10 bg-white/5 text-gray-300 hover:border-white/30'
                        }`}
                      >
                        {STATUS_CONFIG[status]?.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm text-gray-300">Destinatarios para alertas (emails separados por coma)</label>
                  <textarea
                    rows="3"
                    value={alertEmailInput}
                    onChange={(e) => setAlertEmailInput(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-amber-400 focus:outline-none"
                    placeholder="operaciones@tuempresa.com, soporte@tuempresa.com"
                  />
                </div>
              </div>
            )}
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={saveAlertConfig}
                disabled={savingAlertConfig || configLoading}
                className="rounded-xl bg-gradient-to-r from-orange-400 to-rose-500 px-6 py-3 text-sm font-semibold shadow-lg hover:shadow-xl disabled:opacity-50"
              >
                {savingAlertConfig ? 'Guardando...' : 'Guardar'}
              </button>
              <button
                type="button"
                onClick={() => setShowAlertConfigModal(false)}
                className="rounded-xl border border-white/20 px-6 py-3 text-sm text-white hover:bg-white/10"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
// ## Fin panel de trazabilidad de entregas con filtros y edicion
