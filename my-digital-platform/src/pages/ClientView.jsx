import React, { useEffect, useMemo, useState } from 'react';
import api from '../services/api';

// ## Configuracion de estados y etiquetas para pedidos
const STATUS_CONFIG = {
  pendiente: { label: 'Pendiente', badge: 'bg-amber-500/20 text-amber-200 border border-amber-500/50', dot: 'bg-amber-400' },
  en_preparacion: { label: 'En preparacion', badge: 'bg-sky-500/20 text-sky-200 border border-sky-500/50', dot: 'bg-sky-400' },
  en_camino: { label: 'En camino', badge: 'bg-purple-500/20 text-purple-200 border border-purple-500/50', dot: 'bg-purple-400' },
  entregado: { label: 'Entregado', badge: 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/40', dot: 'bg-emerald-400' },
  cancelado: { label: 'Cancelado', badge: 'bg-rose-500/20 text-rose-200 border border-rose-500/50', dot: 'bg-rose-500' }
};

const RETURN_RESULTS = [
  { value: 'reingresado', label: 'Reingresar a stock' },
  { value: 'para_revision', label: 'Enviar a revision' },
  { value: 'descartado', label: 'Descartar' }
];
// ## Fin configuracion de estados y etiquetas para pedidos

// ## Chip visual para estados de pedidos
const StatusPill = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || { label: status, badge: 'bg-white/10 text-gray-200 border border-white/10', dot: 'bg-gray-400' };
  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${cfg.badge}`}>
      <span className={`h-2 w-2 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
};
// ## Fin chip visual para estados de pedidos

// ## Utilidades de formato para fechas, moneda e IDs
const formatDate = (value, withTime = false) => {
  if (!value) return '-';
  const date = new Date(value);
  return withTime
    ? date.toLocaleString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatCurrency = (value) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(value || 0);

const shortId = (value) => {
  if (!value) return '-';
  const text = String(value).trim();
  return text.slice(0, 8) || text;
};

const extractAmount = (order) => {
  const possibleFields = ['total', 'monto', 'montoTotal', 'precio', 'price', 'importe'];
  for (const field of possibleFields) {
    if (order[field] !== undefined && order[field] !== null) {
      const num = Number(order[field]);
      if (!Number.isNaN(num)) return num;
    }
  }
  return 0;
};
// ## Fin utilidades de formato para fechas, moneda e IDs

// ## Vista cliente con resumen de pedidos y devoluciones
export default function ClientView({ allowEdit = true }) {
  // ## Estado para datos, feedback, filtros y modal de edicion
  const [deliveries, setDeliveries] = useState([]);
  const [returnsList, setReturnsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);
  const [inlineAlerts, setInlineAlerts] = useState([]);
  const [returnsSearch, setReturnsSearch] = useState('');
  const [returnsStatus, setReturnsStatus] = useState('');
  const [editModal, setEditModal] = useState({
    open: false,
    record: null,
    saving: false,
    form: { direccion: '', fechaEntregaEstimada: '' }
  });
  // ## Fin estado para datos, feedback, filtros y modal de edicion

  // ## Consulta de pedidos y devoluciones para el cliente
  const loadData = async () => {
    setLoading(true);
    setFeedback(null);
    try {
      const [deliveriesRes, returnsRes] = await Promise.all([
        api.get('/api/deliveries?limit=200'),
        api.get('/api/returns')
      ]);
      setDeliveries(deliveriesRes.data.deliveries || deliveriesRes.data || []);
      setReturnsList(returnsRes.data.items || returnsRes.data || []);
    } catch (err) {
      console.error('client view load', err);
      const msg = err?.response?.data?.message || err?.message || 'No se pudo cargar la vista del cliente';
      setFeedback({ type: 'error', message: msg });
    } finally {
      setLoading(false);
    }
  };
  // ## Fin consulta de pedidos y devoluciones para el cliente

  // ## Carga inicial al montar la vista
  useEffect(() => {
    loadData();
  }, []);
  // ## Fin carga inicial al montar la vista

  // ## Estadisticas del mes actual
  const monthStats = useMemo(() => {
    const now = new Date();
    const sameMonth = (date) => date && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();

    const ordersThisMonth = deliveries.filter((d) => sameMonth(new Date(d.createdAt || d.fechaEntregaEstimada)));
    const returnsThisMonth = returnsList.filter((r) => sameMonth(new Date(r.createdAt || r.fechaRecoleccion)));

    const spent = ordersThisMonth.reduce((acc, order) => acc + extractAmount(order), 0);

    return {
      ordersCount: ordersThisMonth.length,
      returnsCount: returnsThisMonth.length,
      spent
    };
  }, [deliveries, returnsList]);
  // ## Fin estadisticas del mes actual

  // ## Abrir modal de edicion de entrega
  const openEdit = (delivery) => {
    if (!allowEdit) return;
    setEditModal({
      open: true,
      record: delivery,
      saving: false,
      form: {
        direccion: delivery.direccion || '',
        fechaEntregaEstimada: delivery.fechaEntregaEstimada
          ? new Date(delivery.fechaEntregaEstimada).toISOString().slice(0, 16)
          : ''
      }
    });
  };
  // ## Fin abrir modal de edicion de entrega

  // ## Guardar cambios de direccion o fecha de entrega
  const saveEdit = async () => {
    if (!editModal.record) return;
    const targetId = editModal.record.id || editModal.record._id;
    if (!targetId) return;

    try {
      setEditModal((prev) => ({ ...prev, saving: true }));
      const payload = {
        direccion: editModal.form.direccion,
        fechaEntregaEstimada: editModal.form.fechaEntregaEstimada
          ? new Date(editModal.form.fechaEntregaEstimada)
          : undefined
      };
      const { data } = await api.patch(`/api/deliveries/${targetId}`, payload);
      setDeliveries((prev) =>
        prev.map((item) => {
          const currentId = item.id || item._id;
          return currentId === targetId ? { ...item, ...data } : item;
        })
      );
      const displayId = shortId(targetId);
      setInlineAlerts([
        { type: 'info', text: `Se ha modificado la direccion/fecha de entrega del producto ID ${displayId} (vista cliente).` },
        { type: 'warning', text: `Se ha modificado la direccion/fecha de entrega del producto ID ${displayId} (alerta operaciones).` }
      ]);
      setEditModal({ open: false, record: null, saving: false, form: { direccion: '', fechaEntregaEstimada: '' } });
    } catch (err) {
      console.error('saveEdit', err);
      const msg = err?.response?.data?.message || err?.message || 'No se pudo actualizar el pedido';
      setFeedback({ type: 'error', message: msg });
      setEditModal((prev) => ({ ...prev, saving: false }));
    }
  };
  // ## Fin guardar cambios de direccion o fecha de entrega

  const summaryCards = [
    { label: 'Pedidos del mes', value: monthStats.ordersCount, tone: 'from-emerald-500 to-lime-500' },
    { label: 'Devueltos del mes', value: monthStats.returnsCount, tone: 'from-amber-500 to-orange-500' },
    { label: 'Gasto estimado', value: formatCurrency(monthStats.spent), tone: 'from-sky-500 to-indigo-500' }
  ];

  // ## Filtros para tabla de devoluciones
  const normalizedReturnSearch = returnsSearch.trim().toLowerCase();
  const filteredReturns = returnsList.filter((item) => {
    if (returnsStatus && item.resultado !== returnsStatus) return false;
    if (!normalizedReturnSearch) return true;
    const haystack = [
      item.marketplaceOrderId,
      item.producto,
      item.sku,
      item.motivo,
      item.estadoProducto,
      item.resultado
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return haystack.includes(normalizedReturnSearch);
  });
  // ## Fin filtros para tabla de devoluciones

  // ## Render principal de la vista del cliente
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.4em] text-amber-300/70">Cliente</p>
        <h1 className="text-3xl font-semibold text-white">Resumen de compras y pedidos</h1>
        <p className="text-sm text-gray-400">
          Consulta pedidos del mes, devoluciones y actualiza direccion/fecha de entrega cuando lo necesites.
        </p>
      </header>

      {feedback && (
        <div
          className={`rounded-2xl px-5 py-3 text-sm ${
            feedback.type === 'error'
              ? 'border border-rose-500/40 bg-rose-500/10 text-rose-100'
              : 'border border-emerald-500/40 bg-emerald-500/10 text-emerald-100'
          }`}
        >
          {feedback.message}
        </div>
      )}

      {inlineAlerts.length > 0 && (
        <div className="grid gap-3 md:grid-cols-2">
          {inlineAlerts.map((alert, idx) => (
            <div
              key={`${alert.type}-${idx}`}
              className={`rounded-2xl px-4 py-3 text-sm ${
                alert.type === 'warning'
                  ? 'border border-amber-400/40 bg-amber-500/10 text-amber-50'
                  : 'border border-sky-400/40 bg-sky-500/10 text-sky-50'
              }`}
            >
              {alert.text}
            </div>
          ))}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        {summaryCards.map((card) => (
          <div key={card.label} className="glass-panel p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-gray-400">{card.label}</p>
            <p className={`mt-2 text-2xl font-semibold text-white bg-gradient-to-r ${card.tone} bg-clip-text text-transparent`}>
              {card.value}
            </p>
          </div>
        ))}
      </div>

      <section className="glass-panel p-6 space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-xl font-semibold text-white">Pedidos del mes</h2>
            <p className="text-sm text-gray-400">Lista de entregas registradas con opcion de editar direccion/fecha.</p>
          </div>
          <button
            type="button"
            onClick={loadData}
            className="rounded-full border border-white/20 px-4 py-2 text-sm text-white hover:bg-white/10"
          >
            Refrescar
          </button>
        </div>

        {loading ? (
          <p className="text-gray-400 text-sm">Cargando pedidos...</p>
        ) : deliveries.length === 0 ? (
          <p className="text-gray-400 text-sm">No hay pedidos registrados.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-white/5 text-sm">
              <thead className="bg-white/5 text-left text-xs uppercase tracking-wider text-gray-400">
                <tr>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Producto(s)</th>
                  <th className="px-4 py-3">Cantidad</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Direccion</th>
                  <th className="px-4 py-3">Entrega</th>
                  {allowEdit && <th className="px-4 py-3 text-right">Acciones</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {deliveries.map((delivery) => {
                  const idValue = delivery.id || delivery._id;
                  return (
                    <tr key={idValue} className="hover:bg-white/5">
                      <td className="px-4 py-3 font-mono text-gray-300" title={idValue}>
                        {shortId(idValue)}
                      </td>
                      <td className="px-4 py-3 text-white">{delivery.nombreProductos || '-'}</td>
                      <td className="px-4 py-3 text-gray-200">{delivery.cantidad || 0}</td>
                      <td className="px-4 py-3">
                        <StatusPill status={delivery.status} />
                      </td>
                      <td className="px-4 py-3 text-gray-200">{delivery.direccion || '-'}</td>
                      <td className="px-4 py-3 text-gray-200">{formatDate(delivery.fechaEntregaEstimada, true)}</td>
                      {allowEdit && (
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => openEdit(delivery)}
                            className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-white hover:bg-white/10"
                          >
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
        )}
      </section>

      <section className="glass-panel p-6 space-y-3">
        <h2 className="text-xl font-semibold text-white">Devoluciones</h2>
        <p className="text-sm text-gray-400">Historial de devoluciones registradas para el cliente.</p>
        <div className="flex flex-wrap gap-3">
          <input
            type="text"
            value={returnsSearch}
            onChange={(e) => setReturnsSearch(e.target.value)}
            placeholder="Buscar por pedido, producto o SKU..."
            className="w-full sm:w-72 rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-amber-400 focus:outline-none"
          />
          <select
            value={returnsStatus}
            onChange={(e) => setReturnsStatus(e.target.value)}
            className="w-full sm:w-60 rounded-lg select-dark px-4 py-2.5 text-sm focus:border-amber-400 focus:outline-none"
          >
            <option value="">Todos los estados</option>
            {RETURN_RESULTS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        {filteredReturns.length === 0 ? (
          <p className="text-gray-400 text-sm">Sin devoluciones registradas.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-white/5 text-sm">
              <thead className="bg-white/5 text-left text-xs uppercase tracking-wider text-gray-400">
                <tr>
                  <th className="px-4 py-3">Pedido</th>
                  <th className="px-4 py-3">Producto</th>
                  <th className="px-4 py-3">Resultado</th>
                  <th className="px-4 py-3">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredReturns.map((item) => (
                  <tr key={item._id || item.id}>
                    <td className="px-4 py-3 text-gray-200">{item.marketplaceOrderId || '-'}</td>
                    <td className="px-4 py-3 text-white">{item.producto || '-'}</td>
                    <td className="px-4 py-3 text-gray-200 capitalize">{(item.resultado || '').replace('_', ' ') || '-'}</td>
                    <td className="px-4 py-3 text-gray-200">{formatDate(item.createdAt || item.fechaRecoleccion)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {editModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4">
          <div className="glass-panel w-full max-w-lg p-8 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-2xl font-semibold text-white">Editar entrega</h3>
                <p className="text-sm text-gray-300">Actualiza direccion o fecha estimada de entrega.</p>
              </div>
              <button
                type="button"
                className="text-gray-400 hover:text-white"
                onClick={() => setEditModal({ open: false, record: null, saving: false, form: { direccion: '', fechaEntregaEstimada: '' } })}
              >
                Cerrar
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-300">Direccion</label>
                <input
                  type="text"
                  value={editModal.form.direccion}
                  onChange={(e) => setEditModal((prev) => ({ ...prev, form: { ...prev.form, direccion: e.target.value } }))}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-amber-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-sm text-gray-300">Fecha estimada</label>
                <input
                  type="datetime-local"
                  value={editModal.form.fechaEntregaEstimada}
                  onChange={(e) =>
                    setEditModal((prev) => ({ ...prev, form: { ...prev.form, fechaEntregaEstimada: e.target.value } }))
                  }
                  className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-amber-400 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setEditModal({ open: false, record: null, saving: false, form: { direccion: '', fechaEntregaEstimada: '' } })}
                className="rounded-lg border border-white/20 px-4 py-2 text-sm text-white hover:bg-white/10"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={saveEdit}
                disabled={editModal.saving}
                className="rounded-lg bg-gradient-to-r from-orange-500 to-rose-500 px-6 py-3 text-sm font-semibold shadow-lg hover:shadow-xl disabled:opacity-50"
              >
                {editModal.saving ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
// ## Fin vista cliente con resumen de pedidos y devoluciones
