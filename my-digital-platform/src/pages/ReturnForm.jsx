import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

// ## Catalogos reutilizados
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

const initialForm = {
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

// ## Formulario standalone para crear devolucion ML
export default function ReturnForm() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  const update = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg(null);
    setLoading(true);
    try {
      const payload = {
        ...form,
        cantidad: Number(form.cantidad) || 1,
        fechaRecoleccion: form.fechaRecoleccion || undefined
      };
      await api.post('/api/returns', payload);
      setMsg({ type: 'success', text: 'Devolucion creada' });
      setTimeout(() => navigate('/returns'), 1000);
    } catch (err) {
      const message = err?.response?.data?.message || err.message || 'No se pudo crear la devolucion';
      setMsg({ type: 'error', text: message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.4em] text-amber-300/70">Mercado Libre</p>
        <h1 className="text-3xl font-semibold text-white">Nueva devolucion</h1>
        <p className="text-sm text-gray-400">Completa los campos para registrar una devolucion de Mercado Libre.</p>
      </header>

      {msg && (
        <div
          className={`rounded-2xl px-5 py-3 text-sm ${
            msg.type === 'error'
              ? 'border border-rose-500/40 bg-rose-500/10 text-rose-100'
              : 'border border-emerald-500/40 bg-emerald-500/10 text-emerald-100'
          }`}
        >
          {msg.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="glass-panel p-8 space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="text-sm text-gray-300">ID de pedido</label>
            <input
              type="text"
              value={form.marketplaceOrderId}
              onChange={(e) => update('marketplaceOrderId', e.target.value)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-amber-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-sm text-gray-300">Producto</label>
            <input
              type="text"
              value={form.producto}
              onChange={(e) => update('producto', e.target.value)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-amber-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-sm text-gray-300">SKU</label>
            <input
              type="text"
              value={form.sku}
              onChange={(e) => update('sku', e.target.value)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-amber-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-sm text-gray-300">Cantidad</label>
            <input
              type="number"
              min="1"
              value={form.cantidad}
              onChange={(e) => update('cantidad', e.target.value)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-amber-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-sm text-gray-300">Motivo</label>
            <select
              className="mt-2 w-full rounded-xl select-dark px-4 py-3 focus:border-amber-400 focus:outline-none"
              value={form.motivo}
              onChange={(e) => update('motivo', e.target.value)}
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
              value={form.estadoProducto}
              onChange={(e) => update('estadoProducto', e.target.value)}
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
              value={form.resultado}
              onChange={(e) => update('resultado', e.target.value)}
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
              value={form.fechaRecoleccion}
              onChange={(e) => update('fechaRecoleccion', e.target.value)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-amber-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-sm text-gray-300">Correo del cliente (opcional)</label>
            <input
              type="email"
              value={form.customerEmail}
              onChange={(e) => update('customerEmail', e.target.value)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-amber-400 focus:outline-none"
              placeholder="cliente@correo.com"
            />
          </div>
        </div>

        <div>
          <label className="text-sm text-gray-300">Comentarios</label>
          <textarea
            rows="3"
            value={form.comentarios}
            onChange={(e) => update('comentarios', e.target.value)}
            className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-amber-400 focus:outline-none"
            placeholder="Notas internas u observaciones."
          />
        </div>

        <div className="flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/returns')}
            className="rounded-lg border border-white/20 px-5 py-3 text-sm text-white hover:bg-white/10"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-gradient-to-r from-orange-500 to-rose-500 px-6 py-3 text-sm font-semibold shadow-lg disabled:opacity-50"
          >
            {loading ? 'Guardando...' : 'Crear devolucion'}
          </button>
        </div>
      </form>
    </div>
  );
}
