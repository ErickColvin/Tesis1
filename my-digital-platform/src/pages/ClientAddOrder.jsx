import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const initialState = {
  nombrePersona: '',
  nombreProductos: '',
  cantidad: 1,
  direccion: '',
  notas: ''
};

export default function ClientAddOrder() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg(null);
    setLoading(true);
    try {
      const payload = {
        nombrePersona: form.nombrePersona,
        nombreProductos: form.nombreProductos,
        cantidad: Number(form.cantidad) || 1,
        direccion: form.direccion,
        notas: form.notas,
        // Campos omitidos en el UI pero requeridos en backend
        fechaEntregaEstimada: new Date(), // placeholder para cumplir validacion; se puede ajustar luego en trazabilidad
        status: 'pendiente'
      };
      await api.post('/api/deliveries', payload);
      setMsg({ type: 'success', text: 'Pedido agregado correctamente' });
      setTimeout(() => navigate('/cliente'), 1200);
    } catch (err) {
      const errorMsg = err?.response?.data?.message || err?.message || 'Error al agregar pedido';
      setMsg({ type: 'error', text: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.4em] text-amber-300/70">Cliente</p>
        <h1 className="text-3xl font-semibold text-white">Agregar pedido</h1>
        <p className="text-sm text-gray-400">Completa los datos del pedido para registrarlo y gestionarlo luego en trazabilidad.</p>
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

      <form onSubmit={handleSubmit} className="glass-panel p-8 grid gap-6 md:grid-cols-2">
        <div>
          <label className="text-sm text-gray-300">Nombre y Apellidos *</label>
          <input
            type="text"
            name="nombrePersona"
            value={form.nombrePersona}
            onChange={handleChange}
            required
            className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-amber-400 focus:outline-none"
          />
        </div>

        <div>
          <label className="text-sm text-gray-300">Productos *</label>
          <input
            type="text"
            name="nombreProductos"
            value={form.nombreProductos}
            onChange={handleChange}
            required
            className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-amber-400 focus:outline-none"
          />
        </div>

        <div>
          <label className="text-sm text-gray-300">Cantidad *</label>
          <input
            type="number"
            min="1"
            name="cantidad"
            value={form.cantidad}
            onChange={handleChange}
            required
            className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-amber-400 focus:outline-none"
          />
        </div>

        <div className="md:col-span-2">
          <label className="text-sm text-gray-300">Direccion *</label>
          <input
            type="text"
            name="direccion"
            value={form.direccion}
            onChange={handleChange}
            required
            className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-amber-400 focus:outline-none"
          />
        </div>

        <div className="md:col-span-2">
          <label className="text-sm text-gray-300">Notas (opcional)</label>
          <textarea
            name="notas"
            value={form.notas}
            onChange={handleChange}
            rows="3"
            className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-amber-400 focus:outline-none"
            placeholder="Indicaciones especiales de entrega, referencias, horarios."
          />
        </div>

        <div className="md:col-span-2 flex justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate('/cliente')}
            className="rounded-xl border border-white/20 px-6 py-3 text-sm text-white hover:bg-white/10"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-gradient-to-r from-orange-500 to-rose-500 px-6 py-3 text-sm font-semibold shadow-lg hover:shadow-xl disabled:opacity-50"
          >
            {loading ? 'Guardando...' : 'Guardar pedido'}
          </button>
        </div>
      </form>
    </div>
  );
}
