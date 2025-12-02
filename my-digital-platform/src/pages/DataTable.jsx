// src/pages/DataTable.jsx
import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DataContext } from "../context/DataContext";
import api from "../services/api";

// ## Plantilla base para producto vacio
const emptyProduct = { producto: "", categoria: "", stock: "", stock_limit: "", precio: "" };
// ## Fin plantilla base para producto vacio

// ## Tabla de productos con filtros, alta y edicion
const DataTable = ({ allowEdit = false }) => {
  const { products: contextProducts } = useContext(DataContext) || { products: [] };
  const navigate = useNavigate();

  // ## Estado local para filtros, paginacion y formularios
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addItemsCount, setAddItemsCount] = useState(1);
  const [addItems, setAddItems] = useState([emptyProduct]);
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [editing, setEditing] = useState({ open: false, product: null, form: {}, saving: false });
  const perPage = 20;
  // ## Fin estado local para filtros, paginacion y formularios

  // ## Helper para mostrar mensajes en pantalla
  const notify = (type, text) => setMsg({ type, text });
  // ## Fin helper para mostrar mensajes en pantalla

  // ## Consulta a la API para traer productos con filtros
  const loadProducts = async () => {
    setFetching(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(perPage) });
      if (search) params.set("search", search);
      if (category) params.set("categoria", category);
      const res = await api.get(`/api/products?${params.toString()}`);
      const list = res.data.items || res.data || [];
      const total = res.data.total ?? list.length;
      const limit = res.data.limit ?? perPage;
      setProducts(Array.isArray(list) ? list : []);
      setTotalPages(Math.max(1, Math.ceil(total / limit)));
    } catch (err) {
      console.error("Error cargando productos:", err);
      setProducts(contextProducts || []);
      setTotalPages(1);
      notify("error", "No se pudieron cargar productos");
    } finally {
      setFetching(false);
    }
  };
  // ## Fin consulta a la API para traer productos con filtros

  // ## Recargar tabla cuando cambian filtros o pagina
  useEffect(() => {
    loadProducts();
  }, [page, search, category]);
  // ## Fin recargar tabla cuando cambian filtros o pagina

  // ## Alta masiva de productos desde modal
  const handleAddItems = async (e) => {
    e.preventDefault();
    if (!allowEdit) {
      notify("error", "No tienes permisos para agregar productos.");
      return;
    }
    setLoading(true);
    setMsg(null);

    try {
      const productsToAdd = addItems
        .filter((item) => item.producto && item.categoria && item.stock && item.stock_limit && item.precio)
        .map((item) => ({
          producto: item.producto,
          categoria: item.categoria,
          stock: Number(item.stock),
          stock_limit: Number(item.stock_limit),
          precio: Number(item.precio)
        }));

      if (productsToAdd.length === 0) {
        notify("error", "Por favor completa al menos un producto");
        setLoading(false);
        return;
      }

      const res = await api.post("/api/products", { products: productsToAdd });
      if (res.data.ok) {
        notify("success", `${res.data.created} producto(s) agregado(s) exitosamente`);
        setShowAddModal(false);
        setAddItems([emptyProduct]);
        setAddItemsCount(1);
        setTimeout(() => setMsg(null), 1800);
        await loadProducts();
      }
    } catch (err) {
      const errorMsg = err?.response?.data?.message || err?.message || "Error al agregar productos";
      notify("error", errorMsg);
    } finally {
      setLoading(false);
    }
  };
  // ## Fin alta masiva de productos desde modal

  // ## Preparar formulario de edicion de producto
  const openEditModal = (product) => {
    if (!allowEdit) {
      notify("error", "Solo los administradores pueden editar productos.");
      return;
    }
    const base = product || {};
    setEditing({
      open: true,
      product,
      saving: false,
      form: {
        nombre: base.nombre || base.producto || "",
        categoria: base.categoria || "",
        stock: base.stock ?? 0,
        minStock: base.minStock ?? base.stock_limit ?? 0,
        precioUnitario: base.precioUnitario ?? base.precio ?? 0
      }
    });
  };
  // ## Fin preparar formulario de edicion de producto

  // ## Guardar cambios del modal de edicion
  const saveEdit = async () => {
    if (!editing.product) return;
    const sku = (editing.product.sku || editing.product._id || editing.product.id || "").toString();
    if (!sku) {
      notify("error", "No se encontro SKU para editar el producto.");
      return;
    }

    const payload = {
      nombre: editing.form.nombre?.trim(),
      categoria: editing.form.categoria?.trim(),
      stock: Number(editing.form.stock) || 0,
      minStock: Number(editing.form.minStock) || 0,
      precioUnitario: Number(editing.form.precioUnitario) || 0
    };

    try {
      setEditing((prev) => ({ ...prev, saving: true }));
      const { data } = await api.patch(`/api/products/${sku}`, payload);
      setProducts((prev) => prev.map((item) => {
        const idCompare = (item.sku || item._id || item.id || "").toString();
        return idCompare === sku ? { ...item, ...data } : item;
      }));
      notify("success", "Producto actualizado correctamente.");
      setEditing({ open: false, product: null, form: {}, saving: false });
    } catch (err) {
      const errorMsg = err?.response?.data?.message || err?.message || "Error al actualizar producto";
      notify("error", errorMsg);
      setEditing((prev) => ({ ...prev, saving: false }));
    }
  };
  // ## Fin guardar cambios del modal de edicion

  // ## Categorias derivadas para filtro rapido
  const categories = [...new Set(products.map((p) => p.categoria).filter(Boolean))];
  // ## Fin categorias derivadas para filtro rapido

  // ## Manejo de inputs dinamicos para nuevos productos
  const handleAddItemChange = (index, field, value) => {
    const next = [...addItems];
    next[index] = { ...next[index], [field]: value };
    setAddItems(next);
  };

  const changeAddItemsCount = (value) => {
    const count = Math.max(1, Math.min(5, Number(value) || 1));
    setAddItemsCount(count);
    const next = [];
    for (let i = 0; i < count; i += 1) {
      next.push(addItems[i] || emptyProduct);
    }
    setAddItems(next);
  };
  // ## Fin manejo de inputs dinamicos para nuevos productos

  // ## Render principal con filtros, tabla, paginacion y modales
  return (
    <div className="p-6 text-white space-y-6">
      <header className="flex flex-wrap gap-4 items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-300 to-rose-400 bg-clip-text text-transparent">
            Productos
          </h1>
          <p className="text-sm text-gray-400">Administra catalogo, precios y minimos de stock.</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => navigate('/import')}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 font-semibold transition disabled:opacity-60"
          >
            Importar Excel
          </button>
          <button
            type="button"
            disabled={!allowEdit}
            onClick={() => allowEdit && setShowAddModal(true)}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 font-semibold transition disabled:opacity-50"
          >
            Agregar item
          </button>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-4">
        <input
          type="text"
          placeholder="Buscar..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-amber-500 w-full sm:w-72"
        />
        <select
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setPage(1);
          }}
          className="px-4 py-2 rounded-lg select-dark focus:ring-2 focus:ring-amber-500 w-full sm:w-60"
        >
          <option value="">Todas las categorias</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {msg && (
        <div
          className={`p-3 rounded-lg ${
            msg.type === 'success'
              ? 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-100'
              : 'bg-rose-500/15 border border-rose-500/40 text-rose-100'
          }`}
        >
          {msg.text}
        </div>
      )}

      <div className="bg-white/5 border border-white/20 rounded-lg overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-white/10">
            <tr>
              <th className="px-4 py-3 text-left">Producto</th>
              <th className="px-4 py-3 text-left">Categoria</th>
              <th className="px-4 py-3 text-left">Stock</th>
              <th className="px-4 py-3 text-left">Minimo</th>
              <th className="px-4 py-3 text-left">Precio</th>
              {allowEdit && <th className="px-4 py-3 text-left">Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {fetching ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <tr key={`skeleton-${idx}`} className="border-t border-white/10">
                  <td className="px-4 py-3"><div className="h-4 w-32 bg-white/10 rounded animate-pulse" /></td>
                  <td className="px-4 py-3"><div className="h-4 w-24 bg-white/10 rounded animate-pulse" /></td>
                  <td className="px-4 py-3"><div className="h-4 w-12 bg-white/10 rounded animate-pulse" /></td>
                  <td className="px-4 py-3"><div className="h-4 w-12 bg-white/10 rounded animate-pulse" /></td>
                  <td className="px-4 py-3"><div className="h-4 w-16 bg-white/10 rounded animate-pulse" /></td>
                  {allowEdit && <td className="px-4 py-3"><div className="h-8 w-24 bg-white/10 rounded animate-pulse" /></td>}
                </tr>
              ))
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={allowEdit ? 6 : 5} className="px-4 py-8 text-center text-gray-400">
                  No hay productos disponibles
                </td>
              </tr>
            ) : (
              products.map((p) => (
                <tr key={p._id || p.id || p.sku} className="border-t border-white/10 hover:bg-white/5 transition">
                  <td className="px-4 py-3">{p.nombre || p.producto}</td>
                  <td className="px-4 py-3">{p.categoria}</td>
                  <td className="px-4 py-3">{p.stock}</td>
                  <td className="px-4 py-3">{p.minStock ?? p.stock_limit ?? '-'}</td>
                  <td className="px-4 py-3">${(p.precioUnitario || p.precio || 0).toFixed(2)}</td>
                  {allowEdit && (
                    <td className="px-4 py-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() => openEditModal(p)}
                        className="px-3 py-1 rounded bg-orange-500 hover:bg-orange-600 text-sm font-semibold"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAddItems([{
                            producto: p.nombre || p.producto || '',
                            categoria: p.categoria || '',
                            stock: p.stock || 0,
                            stock_limit: p.minStock ?? p.stock_limit ?? 0,
                            precio: p.precioUnitario || p.precio || 0
                          }]);
                          setAddItemsCount(1);
                          setShowAddModal(true);
                          notify('success', 'Producto copiado al formulario');
                        }}
                        className="px-3 py-1 rounded bg-slate-600 hover:bg-slate-700 text-sm font-semibold"
                      >
                        Duplicar
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-2">
          <button
            disabled={page === 1}
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            className="px-4 py-2 bg-white/5 border border-white/20 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/10"
          >
            Anterior
          </button>
          <span className="px-4 py-2 text-sm">
            Pagina {page} de {totalPages}
          </span>
          <button
            disabled={page === totalPages}
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            className="px-4 py-2 bg-white/5 border border-white/20 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/10"
          >
            Siguiente
          </button>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4">
          <div className="glass-panel w-full max-w-4xl p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-2xl font-semibold text-white">Agregar productos</h3>
                <p className="text-sm text-gray-300">Puedes cargar hasta 5 productos a la vez.</p>
              </div>
              <button
                type="button"
                className="text-gray-400 hover:text-white"
                onClick={() => setShowAddModal(false)}
              >
                Cerrar
              </button>
            </div>

            <div className="mb-4 flex items-center gap-3">
              <label className="text-sm text-gray-300">Cantidad de items</label>
              <input
                type="number"
                min="1"
                max="5"
                value={addItemsCount}
                onChange={(e) => changeAddItemsCount(e.target.value)}
                className="w-20 rounded-lg select-dark px-3 py-2 focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <form onSubmit={handleAddItems} className="space-y-6">
              {addItems.map((item, index) => (
                <div key={`new-${index}`} className="grid gap-4 md:grid-cols-3 bg-white/5 border border-white/10 rounded-xl p-4">
                  <div className="md:col-span-2">
                    <label className="text-sm text-gray-300">Producto *</label>
                    <input
                      type="text"
                      value={item.producto}
                      onChange={(e) => handleAddItemChange(index, 'producto', e.target.value)}
                      className="mt-2 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-amber-400 focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-300">Categoria *</label>
                    <input
                      type="text"
                      value={item.categoria}
                      onChange={(e) => handleAddItemChange(index, 'categoria', e.target.value)}
                      className="mt-2 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-amber-400 focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-300">Stock *</label>
                    <input
                      type="number"
                      min="0"
                      value={item.stock}
                      onChange={(e) => handleAddItemChange(index, 'stock', e.target.value)}
                      className="mt-2 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-amber-400 focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-300">Stock minimo *</label>
                    <input
                      type="number"
                      min="0"
                      value={item.stock_limit}
                      onChange={(e) => handleAddItemChange(index, 'stock_limit', e.target.value)}
                      className="mt-2 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-amber-400 focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-300">Precio *</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.precio}
                      onChange={(e) => handleAddItemChange(index, 'precio', e.target.value)}
                      className="mt-2 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-amber-400 focus:outline-none"
                      required
                    />
                  </div>
                </div>
              ))}

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  className="rounded-lg border border-white/20 px-4 py-2 text-white hover:bg-white/10"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-lg bg-gradient-to-r from-orange-500 to-rose-500 px-6 py-3 font-semibold shadow-lg disabled:opacity-50"
                >
                  {loading ? 'Guardando...' : 'Guardar productos'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editing.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4">
          <div className="glass-panel w-full max-w-3xl p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-2xl font-semibold text-white">Editar producto</h3>
                <p className="text-sm text-gray-300">Actualiza cualquier atributo del producto.</p>
              </div>
              <button
                type="button"
                className="text-gray-400 hover:text-white"
                onClick={() => setEditing({ open: false, product: null, form: {}, saving: false })}
              >
                Cerrar
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm text-gray-300">Nombre</label>
                <input
                  type="text"
                  value={editing.form.nombre}
                  onChange={(e) => setEditing((prev) => ({ ...prev, form: { ...prev.form, nombre: e.target.value } }))}
                  className="mt-2 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-amber-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-sm text-gray-300">Categoria</label>
                <input
                  type="text"
                  value={editing.form.categoria}
                  onChange={(e) =>
                    setEditing((prev) => ({ ...prev, form: { ...prev.form, categoria: e.target.value } }))
                  }
                  className="mt-2 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-amber-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-sm text-gray-300">Stock</label>
                <input
                  type="number"
                  min="0"
                  value={editing.form.stock}
                  onChange={(e) =>
                    setEditing((prev) => ({ ...prev, form: { ...prev.form, stock: e.target.value } }))
                  }
                  className="mt-2 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-amber-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-sm text-gray-300">Stock minimo</label>
                <input
                  type="number"
                  min="0"
                  value={editing.form.minStock}
                  onChange={(e) =>
                    setEditing((prev) => ({ ...prev, form: { ...prev.form, minStock: e.target.value } }))
                  }
                  className="mt-2 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-amber-400 focus:outline-none"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm text-gray-300">Precio unitario</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={editing.form.precioUnitario}
                  onChange={(e) =>
                    setEditing((prev) => ({ ...prev, form: { ...prev.form, precioUnitario: e.target.value } }))
                  }
                  className="mt-2 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-amber-400 focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditing({ open: false, product: null, form: {}, saving: false })}
                className="rounded-lg border border-white/20 px-4 py-2 text-white hover:bg-white/10"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={saveEdit}
                disabled={editing.saving}
                className="rounded-lg bg-gradient-to-r from-orange-500 to-rose-500 px-6 py-3 font-semibold shadow-lg disabled:opacity-50"
              >
                {editing.saving ? 'Actualizando...' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ## Fin tabla de productos con filtros, alta y edicion
export default DataTable;
