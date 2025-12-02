import React, { useCallback, useEffect, useState } from 'react';
import { DataContext } from './DataContext';
import api from '../services/api';

export const DataProvider = ({ children }) => {
  // ## Estado global para productos, alertas y ultima importacion
  const [products, setProducts] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [lastImport, setLastImport] = useState(null);
  // ## Fin estado global para productos, alertas y ultima importacion

  // ## Carga inicial de productos y alertas
  const loadData = useCallback(async () => {
    try {
      const [productsRes, alertsRes] = await Promise.all([
        api.get('/api/products'),
        api.get('/api/alerts/feed')
      ]);
      setProducts(productsRes.data.items || productsRes.data || []);
      setAlerts(alertsRes.data.alerts || alertsRes.data || []);
    } catch (err) {
      console.error('Fetch inicial:', err);
    }
  }, []);
  // ## Fin carga inicial de productos y alertas

  // ## Efecto para ejecutar carga inicial al montar
  useEffect(() => {
    loadData();
  }, [loadData]);
  // ## Fin efecto para ejecutar carga inicial al montar

  // ## Funcion para subir Excel y refrescar datos
  const uploadExcel = useCallback(async (file, options = {}) => {
    if (!file) throw new Error('Archivo requerido');
    const { type = 'products', onProgress } = options;
    const form = new FormData();
    form.append('file', file);
    form.append('type', type);

    try {
      const response = await api.post('/api/imports', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (event) => {
          if (onProgress && event.total) {
            const percent = Math.round((event.loaded / event.total) * 100);
            onProgress(percent);
          }
        }
      });
      await loadData();
      setLastImport(response.data);
      return response.data;
    } catch (err) {
      console.error('uploadExcel error:', err?.response?.data || err);
      throw err;
    }
  }, [loadData]);
  // ## Fin funcion para subir Excel y refrescar datos

  // ## Proveedor de contexto con valores y acciones compartidas
  return (
    <DataContext.Provider value={{ products, alerts, uploadExcel, refreshData: loadData, lastImport }}>
      {children}
    </DataContext.Provider>
  );
  // ## Fin proveedor de contexto con valores y acciones compartidas
};
