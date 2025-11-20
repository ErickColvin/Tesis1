// src/pages/DataTable.jsx
import React, { useContext, useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataContext } from '../context/DataContext';
import api from '../services/api';

const DataTable = () => {
  const { products: contextProducts, uploadExcel } = useContext(DataContext) || { products: [] };
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAlertsModal, setShowAlertsModal] = useState(false);
  const [numItems, setNumItems] = useState(1);
  const [formItems, setFormItems] = useState([{
    producto: '',
    categoria: '',
    stock: '',
    stock_limit: '',
    precio: ''
  }]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [editingStockLimit, setEditingStockLimit] = useState({});
  const navigate = useNavigate();
  const perPage = 20;

  useEffect(() => {
    loadProducts();
    loadAlerts();
  }, []);

  const loadProducts = async () => {
    try {
      const res = await api.get('/api/products');
      // Si viene con paginación, usar items; si no, usar directamente
      const productsList = res.data.items || res.data || [];
      setProducts(Array.isArray(productsList) ? productsList : []);
    } catch (err) {
      console.error('Error cargando productos:', err);
      setProducts(contextProducts || []);
    }
  };

  const loadAlerts = async () => {
    try {
      const res = await api.get('/api/alerts?status=active');
      setAlerts(res.data.alerts || []);
    } catch (err) {
      console.error('Error cargando alertas:', err);
    }
  };

  const handleImportExcel = () => {
    navigate('/import');
  };

  const handleNumItemsChange = (e) => {
    const num = parseInt(e.target.value) || 1;
    const clamped = Math.max(1, Math.min(5, num));
    setNumItems(clamped);
    
    // Ajustar formItems
    const newItems = [];
    for (let i = 0; i < clamped; i++) {
      newItems.push(formItems[i] || {
        producto: '',
        categoria: '',
        stock: '',
        stock_limit: '',
        precio: ''
      });
    }
    setFormItems(newItems);
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormItems(newItems);
  };

  const handleAddItems = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg(null);

    try {
      const productsToAdd = formItems
        .filter(item => item.producto && item.categoria && item.stock && item.stock_limit && item.precio)
        .map(item => ({
          producto: item.producto,
          categoria: item.categoria,
          stock: Number(item.stock),
          stock_limit: Number(item.stock_limit),
          precio: Number(item.precio)
        }));

      if (productsToAdd.length === 0) {
        setMsg('⚠️ Por favor completa al menos un producto');
        setLoading(false);
        return;
      }

      const res = await api.post('/api/products', { products: productsToAdd });
      
      if (res.data.ok) {
        setMsg(`✅ ${res.data.created} producto(s) agregado(s) exitosamente`);
        setShowAddModal(false);
        setFormItems([{ producto: '', categoria: '', stock: '', stock_limit: '', precio: '' }]);
        setNumItems(1);
        setTimeout(() => {
          loadProducts();
          loadAlerts();
          setMsg(null);
        }, 1500);
      }
    } catch (err) {
      const errorMsg = err?.response?.data?.message || err?.message || 'Error al agregar productos';
      setMsg(`⚠️ ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    let list = products;
    if (search) {
      list = list.filter(p => (p.nombre || p.producto || '').toLowerCase().includes(search.toLowerCase()));
    }
    if (category) {
      list = list.filter(p => (p.categoria || '') === category);
    }
    return list;
  }, [products, search, category]);

  const totalPages = Math.ceil(filtered.length / perPage);
  const slice = filtered.slice((page - 1) * perPage, page * perPage);

  return (
    <div className="p-6 text-white">
      <h1 className="text-3xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
        Productos
      </h1>

      {/* Filtros y Botones */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <input
          type="text"
          placeholder="Buscar..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          className="px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={category}
          onChange={e => { setCategory(e.target.value); setPage(1); }}
          className="px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todas las categorías</option>
          {[...new Set(products.map(p => p.categoria))].filter(c => c).map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        <div className="flex gap-2 ml-auto">
          <button
            onClick={handleImportExcel}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-lg font-semibold transition-all transform hover:scale-105"
          >
            📥 Importar Excel
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 rounded-lg font-semibold transition-all transform hover:scale-105"
          >
            ➕ Agregar Item
          </button>
          <button
            onClick={() => setShowAlertsModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 rounded-lg font-semibold transition-all transform hover:scale-105 relative"
          >
            🔔 Alerta
            {alerts.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-yellow-400 text-black text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                {alerts.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Mensaje */}
      {msg && (
        <div className={`mb-4 p-3 rounded-lg ${
          msg.includes('✅') 
            ? 'bg-green-500/20 border border-green-500/50 text-green-300' 
            : 'bg-red-500/20 border border-red-500/50 text-red-300'
        }`}>
          {msg}
        </div>
      )}

      {/* Tabla */}
      <div className="bg-white/5 border border-white/20 rounded-lg overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-white/10">
            <tr>
              <th className="px-4 py-3 text-left">Producto</th>
              <th className="px-4 py-3 text-left">Categoría</th>
              <th className="px-4 py-3 text-left">Stock</th>
              <th className="px-4 py-3 text-left">Precio</th>
            </tr>
          </thead>
          <tbody>
            {slice.length === 0 ? (
              <tr>
                <td colSpan="4" className="px-4 py-8 text-center text-gray-400">
                  No hay productos disponibles
                </td>
              </tr>
            ) : (
              slice.map((p, idx) => (
                <tr key={p._id || p.id || idx} className="border-t border-white/10 hover:bg-white/5">
                  <td className="px-4 py-3">{p.nombre || p.producto}</td>
                  <td className="px-4 py-3">{p.categoria}</td>
                  <td className="px-4 py-3">{p.stock}</td>
                  <td className="px-4 py-3">${(p.precioUnitario || p.precio || 0).toFixed(2)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <button
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
            className="px-4 py-2 bg-white/5 border border-white/20 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/10"
          >
            Anterior
          </button>
          <span className="px-4 py-2 text-sm">
            Página {page} de {totalPages}
          </span>
          <button
            disabled={page === totalPages}
            onClick={() => setPage(p => p + 1)}
            className="px-4 py-2 bg-white/5 border border-white/20 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/10"
          >
            Siguiente
          </button>
        </div>
      )}

      {/* Modal Agregar Items */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 border border-white/20 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                  Agregar Items
                </h2>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setFormItems([{ producto: '', categoria: '', stock: '', stock_limit: '', precio: '' }]);
                    setNumItems(1);
                    setMsg(null);
                  }}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Número de items a agregar (1-5)
                </label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={numItems}
                  onChange={handleNumItemsChange}
                  className="px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white w-32"
                />
              </div>

              <form onSubmit={handleAddItems} className="space-y-4">
                {formItems.map((item, idx) => (
                  <div key={idx} className="p-4 bg-white/5 border border-white/10 rounded-lg space-y-3">
                    <h3 className="text-lg font-semibold text-blue-400 mb-3">Item {idx + 1}</h3>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Producto *</label>
                        <input
                          type="text"
                          value={item.producto}
                          onChange={e => handleItemChange(idx, 'producto', e.target.value)}
                          required
                          className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded text-white text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Categoría *</label>
                        <input
                          type="text"
                          value={item.categoria}
                          onChange={e => handleItemChange(idx, 'categoria', e.target.value)}
                          required
                          className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded text-white text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Stock *</label>
                        <input
                          type="number"
                          min="0"
                          value={item.stock}
                          onChange={e => handleItemChange(idx, 'stock', e.target.value)}
                          required
                          className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded text-white text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Stock Límite *</label>
                        <input
                          type="number"
                          min="0"
                          value={item.stock_limit}
                          onChange={e => handleItemChange(idx, 'stock_limit', e.target.value)}
                          required
                          className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded text-white text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Precio *</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.precio}
                          onChange={e => handleItemChange(idx, 'precio', e.target.value)}
                          required
                          className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded text-white text-sm"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 rounded-lg font-semibold disabled:opacity-50"
                  >
                    {loading ? 'Guardando...' : 'Agregar Productos'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setFormItems([{ producto: '', categoria: '', stock: '', stock_limit: '', precio: '' }]);
                      setNumItems(1);
                      setMsg(null);
                    }}
                    className="px-6 py-3 bg-white/5 border border-white/20 rounded-lg hover:bg-white/10"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal Configurar Alertas */}
      {showAlertsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 border border-white/20 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
                  Configurar Alertas de Stock
                </h2>
                <button
                  onClick={() => {
                    setShowAlertsModal(false);
                    setEditingStockLimit({});
                  }}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="bg-white/5 border border-white/20 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-white/10">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Producto</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Stock</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Stock Bajo</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="px-4 py-8 text-center text-gray-400">
                          No hay productos disponibles
                        </td>
                      </tr>
                    ) : (
                      products.map((product) => {
                        const productId = product._id || product.id;
                        const isEditing = editingStockLimit[productId];
                        const currentLimit = isEditing !== undefined 
                          ? editingStockLimit[productId] 
                          : (product.minStock || 10);

                        return (
                          <tr key={productId} className="border-t border-white/10 hover:bg-white/5">
                            <td className="px-4 py-3">{product.nombre || product.producto}</td>
                            <td className="px-4 py-3">{product.stock || 0}</td>
                            <td className="px-4 py-3">
                              {isEditing !== undefined ? (
                                <input
                                  type="number"
                                  min="0"
                                  value={currentLimit}
                                  onChange={(e) => setEditingStockLimit({
                                    ...editingStockLimit,
                                    [productId]: Number(e.target.value)
                                  })}
                                  className="w-24 px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-sm"
                                />
                              ) : (
                                <span className={product.stock <= (product.minStock || 10) ? 'text-red-400 font-semibold' : ''}>
                                  {product.minStock || 10}
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              {isEditing !== undefined ? (
                                <div className="flex gap-2">
                                  <button
                                    onClick={async () => {
                                      try {
                                        const sku = product.sku || productId;
                                        await api.patch(`/api/products/${sku}`, {
                                          minStock: currentLimit
                                        });
                                        setMsg(`✅ Stock límite actualizado para ${product.nombre || product.producto}`);
                                        setEditingStockLimit({});
                                        await loadProducts();
                                        await loadAlerts();
                                        setTimeout(() => setMsg(null), 3000);
                                      } catch (err) {
                                        setMsg(`⚠️ Error al actualizar: ${err.response?.data?.message || err.message}`);
                                      }
                                    }}
                                    className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-sm"
                                  >
                                    Guardar
                                  </button>
                                  <button
                                    onClick={() => {
                                      const newEditing = { ...editingStockLimit };
                                      delete newEditing[productId];
                                      setEditingStockLimit(newEditing);
                                    }}
                                    className="px-3 py-1 bg-gray-600 hover:bg-gray-700 rounded text-sm"
                                  >
                                    Cancelar
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setEditingStockLimit({
                                    ...editingStockLimit,
                                    [productId]: product.minStock || 10
                                  })}
                                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm"
                                >
                                  Editar
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })
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
};

export default DataTable;
