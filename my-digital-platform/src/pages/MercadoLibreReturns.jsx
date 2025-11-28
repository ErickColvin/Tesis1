import React, { useEffect, useState } from 'react';
import api from '../services/api';

const reasons = ['Producto equivocado', 'No era como esperaba', 'Falla tecnica', 'Danos en transporte', 'Otro'];

const conditionOptions = [
  { value: 'sin_abrir', label: 'Sin abrir' },
  { value: 'sellado', label: 'Sellado' },
  { value: 'usado', label: 'Usado' },
  { value: 'danado', label: 'Danado' }
];

const resultOptions = [
  { value: 'reingresado', label: 'Reingresar a stock' },
  { value: 'para_revision', label: 'Enviar a revision' },
  { value: 'descartado', label: 'Descartar' }
];

const emptyReturnForm = {
  marketplaceOrderId: '',
  producto: '',
  sku: '',
  cantidad: 1,
  motivo: '',
  estadoProducto: 'sin_abrir',
  resultado: 'para_revision',
  comentarios: '',
  customerEmail: '',
  fechaRecoleccion: ''
};

const formatDateInput = (value) => {
  if (!value) return '';
  const date = new Date(value);
  return date.toISOString().slice(0, 10);
};

export default function MercadoLibreReturns({ allowEdit = true, startCreate = false }) {
  const [feedback, setFeedback] = useState(null);
  const [returnsList, setReturnsList] = useState([]);
  const [listLoading, setListLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchText, setSearchText] = useState('');
  const [formModal, setFormModal] = useState({
    open: false,
    mode: 'edit',
    record: null,
    form: { ...emptyReturnForm },
    saving: false
  });

  useEffect(() => {
    loadReturns();
  }, []);

  useEffect(() => {
    if (startCreate && allowEdit) {
      openCreate();
    }
  }, [startCreate, allowEdit]);

  const loadReturns = async () => {
    setListLoading(true);
    try {
      const { data } = await api.get('/api/returns');
      setReturnsList(data.items || data || []);
    } catch (err) {
      console.error('loadReturns', err);
      setFeedback({ type: 'error', message: 'No se pudieron cargar las devoluciones' });
    } finally {
      setListLoading(false);
    }
  };

  const openEdit = (record) => {
    if (!allowEdit) return;
    setFormModal({
      open: true,
      mode: 'edit',
      record,
      saving: false,
      form: {
        marketplaceOrderId: record.marketplaceOrderId || '',
        producto: record.producto || '',
        sku: record.sku || '',
        cantidad: record.cantidad || 1,
        motivo: record.motivo || '',
        estadoProducto: record.estadoProducto || 'sin_abrir',
        resultado: record.resultado || 'para_revision',
        comentarios: record.comentarios || '',
        customerEmail: record.customerEmail || '',
        fechaRecoleccion: formatDateInput(record.fechaRecoleccion)
      }
    });
  };

  const openCreate = () => {
    if (!allowEdit) return;
    setFormModal({
      open: true,
      mode: 'create',
      record: null,
      saving: false,
      form: { ...emptyReturnForm }
    });
  };

  const closeModal = () => {
    setFormModal({ open: false, mode: 'edit', record: null, form: { ...emptyReturnForm }, saving: false });
  };

  const updateFormField = (field, value) => {
    setFormModal((prev) => ({ ...prev, form: { ...prev.form, [field]: value } }));
  };

  const saveForm = async () => {
    if (!allowEdit) return;
    const payload = {
      ...formModal.form,
      cantidad: Number(formModal.form.cantidad) || 1,
      fechaRecoleccion: formModal.form.fechaRecoleccion || undefined
    };

    try {
      setFormModal((prev) => ({ ...prev, saving: true }));

      if (formModal.mode === 'edit') {
        if (!formModal.record) {
          setFeedback({ type: 'error', message: 'No se encontro el registro a editar' });
          setFormModal((prev) => ({ ...prev, saving: false }));
          return;
        }
        const id = formModal.record._id || formModal.record.id;
        if (!id) {
          setFeedback({ type: 'error', message: 'No se encontro el registro a editar' });
          setFormModal((prev) => ({ ...prev, saving: false }));
          return;
        }
        const { data } = await api.patch(`/api/returns/${id}`, payload);
        setReturnsList((prev) => prev.map((item) => (item._id === id || item.id === id ? data : item)));
        setFeedback({ type: 'success', message: 'Devolucion actualizada' });
      } else {
        const { data } = await api.post('/api/returns', payload);
        setReturnsList((prev) => [data, ...prev]);
        setFeedback({ type: 'success', message: 'Devolucion creada' });
      }

      closeModal();
    } catch (err) {
      const message = err?.response?.data?.message || err.message || 'No se pudo guardar la devolucion';
      setFeedback({ type: 'error', message });
      setFormModal((prev) => ({ ...prev, saving: false }));
    }
  };

  const normalizedSearch = searchText.trim().toLowerCase();
  const filteredReturns = returnsList.filter((item) => {
    if (statusFilter && item.resultado !== statusFilter) return false;
    if (!normalizedSearch) return true;
    const haystack = [
      item.marketplaceOrderId,
      item.producto,
      item.sku,
      item.motivo,
      item.estadoProducto,
      item.resultado,
      item.customerEmail
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return haystack.includes(normalizedSearch);
  });

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.4em] text-amber-300/70">Mercado Libre</p>
        <h1 className="text-3xl font-semibold text-white">Base de datos de devoluciones</h1>
        <p className="text-sm text-gray-400">
          Visualiza y administra los retornos de Mercado Libre sin cuestionario. Usa "Editar" para actualizar un registro.
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

      <div className="glass-panel p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-white">Historial de devoluciones</h3>
            <p className="text-sm text-gray-400">Solo administradores pueden editar registros existentes.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {allowEdit && (
              <button
                type="button"
                onClick={openCreate}
                className="rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2 text-sm font-semibold text-white shadow-lg hover:from-amber-600 hover:to-orange-600"
              >
                Agregar devolucion
              </button>
            )}
            <button
              type="button"
              onClick={loadReturns}
              className="rounded-lg border border-white/20 px-4 py-2 text-sm text-white hover:bg-white/10"
            >
              Refrescar
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <input
            type="text"
            value={searchText}
            onChange={(e) => {
              setSearchText(e.target.value);
            }}
            placeholder="Buscar por pedido, producto, SKU o cliente..."
            className="w-full sm:w-72 rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-amber-400 focus:outline-none"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-60 rounded-lg select-dark px-4 py-2.5 text-sm focus:border-amber-400 focus:outline-none"
          >
            <option value="">Todos los estados</option>
            {resultOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {listLoading ? (
          <div className="text-gray-400 text-sm">Cargando devoluciones...</div>
        ) : returnsList.length === 0 ? (
          <div className="text-gray-400 text-sm">No hay devoluciones registradas.</div>
        ) : filteredReturns.length === 0 ? (
          <div className="text-gray-400 text-sm">No hay coincidencias para el filtro o busqueda.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-white/10">
                <tr>
                  <th className="px-3 py-2 text-left">Pedido</th>
                  <th className="px-3 py-2 text-left">Producto</th>
                  <th className="px-3 py-2 text-left">Cantidad</th>
                  <th className="px-3 py-2 text-left">Estado producto</th>
                  <th className="px-3 py-2 text-left">Resultado</th>
                  <th className="px-3 py-2 text-left">Fecha</th>
                  <th className="px-3 py-2 text-left">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredReturns.map((item) => (
                  <tr key={item._id || item.id} className="border-t border-white/10 hover:bg-white/5">
                    <td className="px-3 py-2">{item.marketplaceOrderId}</td>
                    <td className="px-3 py-2">{item.producto}</td>
                    <td className="px-3 py-2">{item.cantidad}</td>
                    <td className="px-3 py-2 capitalize">{(item.estadoProducto || '').replace('_', ' ')}</td>
                    <td className="px-3 py-2 capitalize">{(item.resultado || '').replace('_', ' ')}</td>
                    <td className="px-3 py-2">
                      {item.fechaRecoleccion
                        ? new Date(item.fechaRecoleccion).toLocaleDateString('es-CL')
                        : '-'}
                    </td>
                    <td className="px-3 py-2">
                      {allowEdit ? (
                        <button
                          type="button"
                          className="rounded-lg bg-orange-500 px-3 py-1 text-white hover:bg-orange-600"
                          onClick={() => openEdit(item)}
                        >
                          Editar
                        </button>
                      ) : (
                        <span className="text-gray-500 text-sm">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {formModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4">
          <div className="glass-panel w-full max-w-3xl p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-2xl font-semibold text-white">
                  {formModal.mode === 'create' ? 'Nueva devolucion' : 'Editar devolucion'}
                </h3>
                <p className="text-sm text-gray-300">
                  {formModal.mode === 'create'
                    ? 'Completa los campos para registrar una devolucion de Mercado Libre.'
                    : 'Actualiza cualquier campo del registro.'}
                </p>
              </div>
              <button
                type="button"
                className="text-gray-400 hover:text-white"
                onClick={closeModal}
              >
                Cerrar
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="text-sm text-gray-300">ID de pedido</label>
                <input
                  type="text"
                  value={formModal.form.marketplaceOrderId}
                  onChange={(e) => updateFormField('marketplaceOrderId', e.target.value)}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-amber-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-sm text-gray-300">Producto</label>
                <input
                  type="text"
                  value={formModal.form.producto}
                  onChange={(e) => updateFormField('producto', e.target.value)}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-amber-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-sm text-gray-300">SKU</label>
                <input
                  type="text"
                  value={formModal.form.sku}
                  onChange={(e) => updateFormField('sku', e.target.value)}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-amber-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-sm text-gray-300">Cantidad</label>
                <input
                  type="number"
                  min="1"
                  value={formModal.form.cantidad}
                  onChange={(e) => updateFormField('cantidad', e.target.value)}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-amber-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-sm text-gray-300">Motivo</label>
                <select
                  className="mt-2 w-full rounded-xl select-dark px-4 py-3 focus:border-amber-400 focus:outline-none"
                  value={formModal.form.motivo}
                  onChange={(e) => updateFormField('motivo', e.target.value)}
                >
                  <option value="">Selecciona...</option>
                  {reasons.map((reason) => (
                    <option key={reason} value={reason}>
                      {reason}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-300">Estado del producto</label>
                <select
                  className="mt-2 w-full rounded-xl select-dark px-4 py-3 focus:border-amber-400 focus:outline-none"
                  value={formModal.form.estadoProducto}
                  onChange={(e) => updateFormField('estadoProducto', e.target.value)}
                >
                  {conditionOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-300">Resultado</label>
                <select
                  className="mt-2 w-full rounded-xl select-dark px-4 py-3 focus:border-amber-400 focus:outline-none"
                  value={formModal.form.resultado}
                  onChange={(e) => updateFormField('resultado', e.target.value)}
                >
                  {resultOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-300">Fecha de recoleccion</label>
                <input
                  type="date"
                  value={formModal.form.fechaRecoleccion}
                  onChange={(e) => updateFormField('fechaRecoleccion', e.target.value)}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-amber-400 focus:outline-none"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm text-gray-300">Comentarios</label>
                <textarea
                  rows="3"
                  value={formModal.form.comentarios}
                  onChange={(e) => updateFormField('comentarios', e.target.value)}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-amber-400 focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                className="rounded-lg border border-white/20 px-4 py-2 text-white hover:bg-white/10"
                onClick={closeModal}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={saveForm}
                disabled={formModal.saving}
                className="rounded-lg bg-gradient-to-r from-orange-500 to-rose-500 px-6 py-3 font-semibold shadow-lg disabled:opacity-50"
              >
                {formModal.saving ? 'Guardando...' : formModal.mode === 'create' ? 'Crear devolucion' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
