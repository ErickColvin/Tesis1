import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

// ## Estado inicial para formulario de delivery
const initialState = {
  nombrePersona: "",
  nombreProductos: "",
  cantidad: 1,
  status: "en_preparacion",
  direccion: "",
  fechaEntregaEstimada: "",
  notas: "",
  plataforma: "delivery"
};
// ## Fin estado inicial para formulario de delivery

// ## Componente para registrar una entrega
export default function AddDelivery() {
  // ## Estados y navegacion del formulario
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const [formData, setFormData] = useState(initialState);
  // ## Fin estados y navegacion del formulario

  // ## Funcion para actualizar valores del formulario
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  // ## Fin funcion para actualizar valores del formulario

  // ## Funcion para enviar formulario y crear delivery
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg(null);
    setLoading(true);

    try {
      await api.post("/api/deliveries", {
        ...formData,
        cantidad: Number(formData.cantidad) || 1
      });
      setMsg({ type: "success", text: "Delivery agregado exitosamente" });
      setTimeout(() => navigate("/trazabilidad"), 1200);
    } catch (err) {
      const errorMsg = err?.response?.data?.message || err?.message || "Error al agregar delivery";
      setMsg({ type: "error", text: errorMsg });
    } finally {
      setLoading(false);
    }
  };
  // ## Fin funcion para enviar formulario y crear delivery

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ## Cabecera con resumen de la vista */}
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.4em] text-amber-300/70">Entregas</p>
        <h1 className="text-3xl font-semibold text-white">Registrar pedido</h1>
        <p className="text-sm text-gray-400">
          Completa los detalles del envio para seguirlo en trazabilidad y generar alertas de stock.
        </p>
      </header>
      {/* ## Fin cabecera con resumen de la vista */}

      {/* ## Mensaje de retroalimentacion para errores o exito */}
      {msg && (
        <div
          className={`rounded-2xl px-5 py-3 text-sm ${
            msg.type === "error"
              ? "border border-rose-500/40 bg-rose-500/10 text-rose-100"
              : "border border-emerald-500/40 bg-emerald-500/10 text-emerald-100"
          }`}
        >
          {msg.text}
        </div>
      )}
      {/* ## Fin mensaje de retroalimentacion para errores o exito */}

      {/* ## Formulario para registrar nueva entrega */}
      <form onSubmit={handleSubmit} className="glass-panel p-8 grid gap-6 md:grid-cols-2">
        <div>
          <label className="text-sm text-gray-300">Nombre de la persona *</label>
          <input
            type="text"
            name="nombrePersona"
            value={formData.nombrePersona}
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
            value={formData.nombreProductos}
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
            value={formData.cantidad}
            onChange={handleChange}
            required
            className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-amber-400 focus:outline-none"
          />
        </div>

        <div>
          <label className="text-sm text-gray-300">Estado *</label>
          <select
            className="mt-2 w-full rounded-xl select-dark px-4 py-3 focus:border-amber-400 focus:outline-none"
            name="status"
            value={formData.status}
            onChange={handleChange}
            required
          >
            <option value="pendiente">Pendiente</option>
            <option value="en_preparacion">En preparación</option>
            <option value="en_camino">En camino</option>
            <option value="entregado">Entregado</option>
            <option value="cancelado">Cancelado</option>
          </select>
        </div>

        <div>
          <label className="text-sm text-gray-300">Plataforma</label>
          <div className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-gray-200">
            Delivery (predeterminado)
          </div>
        </div>

        <div>
          <label className="text-sm text-gray-300">Fecha entrega estimada *</label>
          <input
            type="datetime-local"
            name="fechaEntregaEstimada"
            value={formData.fechaEntregaEstimada}
            onChange={handleChange}
            required
            className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-amber-400 focus:outline-none"
          />
        </div>

        <div className="md:col-span-2">
          <label className="text-sm text-gray-300">Direcci�n *</label>
          <input
            type="text"
            name="direccion"
            value={formData.direccion}
            onChange={handleChange}
            required
            className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-amber-400 focus:outline-none"
          />
        </div>

        <div className="md:col-span-2">
          <label className="text-sm text-gray-300">Notas (opcional)</label>
          <textarea
            name="notas"
            value={formData.notas}
            onChange={handleChange}
            rows="3"
            className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-amber-400 focus:outline-none"
            placeholder="Indicaciones especiales de entrega, referencias, horarios."
          />
        </div>

        <div className="md:col-span-2 flex justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate("/trazabilidad")}
            className="rounded-xl border border-white/20 px-6 py-3 text-sm text-white hover:bg-white/10"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-gradient-to-r from-orange-500 to-rose-500 px-6 py-3 text-sm font-semibold shadow-lg hover:shadow-xl disabled:opacity-50"
          >
            {loading ? "Guardando..." : "Guardar entrega"}
          </button>
        </div>
      </form>
      {/* ## Fin formulario para registrar nueva entrega */}
    </div>
  );
}
// ## Fin componente para registrar una entrega


