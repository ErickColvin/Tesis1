import React, { useState, useEffect } from 'react';
import api from '../services/api';

export default function Trazabilidad() {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showAlertConfigModal, setShowAlertConfigModal] = useState(false);
  const [deliveryAlerts, setDeliveryAlerts] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDeliveries();
  }, [page, filterStatus]);

  const loadDeliveries = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20'
      });
      if (filterStatus) params.append('status', filterStatus);

      const res = await api.get(`/api/deliveries?${params}`);
      const deliveriesList = res.data.deliveries || res.data || [];
      setDeliveries(Array.isArray(deliveriesList) ? deliveriesList : []);
      setTotalPages(res.data.totalPages || Math.ceil((deliveriesList.length || 0) / 20));
      setError(null);
    } catch (err) {
      console.error('Error cargando deliveries:', err);
      console.error('Detalles del error:', err.response?.data || err.message);
      const errorMsg = err.response?.data?.message || err.response?.data?.error || err.message || 'Error desconocido';
      setError(`Error al cargar entregas: ${errorMsg}`);
      setDeliveries([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    const styles = {
      pendiente: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50',
      en_preparacion: 'bg-blue-500/20 text-blue-300 border-blue-500/50',
      en_camino: 'bg-purple-500/20 text-purple-300 border-purple-500/50',
      entregado: 'bg-green-500/20 text-green-300 border-green-500/50',
      cancelado: 'bg-red-500/20 text-red-300 border-red-500/50'
    };
    return styles[status] || 'bg-gray-500/20 text-gray-300 border-gray-500/50';
  };

  const getStatusLabel = (status) => {
    const labels = {
      pendiente: 'Pendiente',
      en_preparacion: 'En Preparación',
      en_camino: 'En Camino',
      entregado: 'Entregado',
      cancelado: 'Cancelado'
    };
    return labels[status] || status;
  };

  if (loading && deliveries.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white">Cargando...</div>
      </div>
    );
  }

  useEffect(() => {
    if (showAlertConfigModal) {
      loadDeliveryAlerts();
    }
  }, [showAlertConfigModal]);

  const loadDeliveryAlerts = async () => {
    try {
      // Combinar deliveries con información de alertas
      const alerts = deliveries.map(delivery => ({
        cliente: delivery.nombrePersona,
        fechaEntrega: delivery.fechaEntregaEstimada,
        alerta: delivery.status === 'pendiente' || delivery.status === 'en_preparacion' 
          ? '⚠️ Pendiente de entrega' 
          : delivery.status === 'en_camino' 
          ? '🚚 En camino'
          : delivery.status === 'entregado'
          ? '✅ Entregado'
          : '❌ Cancelado'
      }));
      setDeliveryAlerts(alerts);
    } catch (err) {
      console.error('Error cargando alertas de delivery:', err);
    }
  };

  return (
    <div className="p-6 text-white">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          Trazabilidad de Entregas
        </h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddProductModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 rounded-lg font-semibold transition-all transform hover:scale-105"
          >
            ➕ Agregar Producto
          </button>
          <button
            onClick={() => setShowAlertConfigModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 rounded-lg font-semibold transition-all transform hover:scale-105"
          >
            🔔 Configurar Alerta
          </button>
        </div>
      </div>

      {/* Mensaje de Error */}
      {error && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300">
          <p>{error}</p>
        </div>
      )}

      {/* Filtros */}
      <div className="mb-4 flex gap-4">
        <select
          value={filterStatus}
          onChange={(e) => {
            setFilterStatus(e.target.value);
            setPage(1);
          }}
          className="px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white"
        >
          <option value="">Todos los estados</option>
          <option value="pendiente">Pendiente</option>
          <option value="en_preparacion">En Preparación</option>
          <option value="en_camino">En Camino</option>
          <option value="entregado">Entregado</option>
          <option value="cancelado">Cancelado</option>
        </select>
      </div>

      {/* Tabla */}
      <div className="bg-white/5 border border-white/20 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/10">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold">ID</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Nombre Persona</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Productos</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Cantidad</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Estado</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Dirección</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Fecha Entrega</th>
              </tr>
            </thead>
            <tbody>
              {deliveries.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-4 py-8 text-center text-gray-400">
                    {loading ? 'Cargando...' : 'No hay entregas registradas'}
                  </td>
                </tr>
              ) : (
                deliveries.map((delivery) => {
                  const deliveryId = delivery._id || delivery.id;
                  const personName = delivery.nombrePersona || delivery.personName || '-';
                  const productName = delivery.nombreProductos || delivery.productName || '-';
                  const quantity = delivery.cantidad || delivery.quantity || 0;
                  const address = delivery.direccion || delivery.address || '-';
                  const deliveryDate = delivery.fechaEntregaEstimada || delivery.estimatedDeliveryDate;
                  
                  return (
                    <tr key={deliveryId} className="border-t border-white/10 hover:bg-white/5">
                      <td className="px-4 py-3 text-sm font-mono">{delivery.id || deliveryId}</td>
                      <td className="px-4 py-3 text-sm">{personName}</td>
                      <td className="px-4 py-3 text-sm">{productName}</td>
                      <td className="px-4 py-3 text-sm">{quantity}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-xs border ${getStatusBadge(delivery.status)}`}>
                          {getStatusLabel(delivery.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">{address}</td>
                      <td className="px-4 py-3 text-sm">{formatDate(deliveryDate)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="mt-4 flex justify-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 bg-white/5 border border-white/20 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/10"
          >
            Anterior
          </button>
          <span className="px-4 py-2 text-sm">
            Página {page} de {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 bg-white/5 border border-white/20 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/10"
          >
            Siguiente
          </button>
        </div>
      )}

      {/* Modal Agregar Producto */}
      {showAddProductModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 border border-white/20 rounded-2xl shadow-2xl max-w-2xl w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                  Agregar Producto
                </h2>
                <button
                  onClick={() => setShowAddProductModal(false)}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  ×
                </button>
              </div>
              <p className="text-gray-300 mb-4">
                Redirige a la página de productos para agregar nuevos items.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setShowAddProductModal(false);
                    window.location.href = '/products';
                  }}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 rounded-lg font-semibold"
                >
                  Ir a Productos
                </button>
                <button
                  onClick={() => setShowAddProductModal(false)}
                  className="px-6 py-3 bg-white/5 border border-white/20 rounded-lg hover:bg-white/10"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Configurar Alerta */}
      {showAlertConfigModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 border border-white/20 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
                  Configurar Alertas de Delivery
                </h2>
                <button
                  onClick={() => setShowAlertConfigModal(false)}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="bg-white/5 border border-white/20 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-white/10">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Cliente</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Fecha Entrega</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Alerta</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deliveries.length === 0 ? (
                      <tr>
                        <td colSpan="3" className="px-4 py-8 text-center text-gray-400">
                          No hay entregas registradas
                        </td>
                      </tr>
                    ) : (
                      deliveries.map((delivery) => (
                        <tr key={delivery._id} className="border-t border-white/10 hover:bg-white/5">
                          <td className="px-4 py-3">{delivery.nombrePersona || delivery.personName}</td>
                          <td className="px-4 py-3">{formatDate(delivery.fechaEntregaEstimada || delivery.estimatedDeliveryDate)}</td>
                          <td className="px-4 py-3">
                            <span className={`px-3 py-1 rounded text-sm ${
                              delivery.status === 'pending' || delivery.status === 'pendiente' || delivery.status === 'en_preparacion'
                                ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/50'
                                : delivery.status === 'shipped' || delivery.status === 'en_camino'
                                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/50'
                                : delivery.status === 'delivered' || delivery.status === 'entregado'
                                ? 'bg-green-500/20 text-green-300 border border-green-500/50'
                                : 'bg-red-500/20 text-red-300 border border-red-500/50'
                            }`}>
                              {delivery.status === 'pending' || delivery.status === 'pendiente' || delivery.status === 'en_preparacion'
                                ? '⚠️ Pendiente de entrega' 
                                : delivery.status === 'shipped' || delivery.status === 'en_camino'
                                ? '🚚 En camino'
                                : delivery.status === 'delivered' || delivery.status === 'entregado'
                                ? '✅ Entregado'
                                : '❌ Cancelado'}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

