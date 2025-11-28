import React, { useCallback, useEffect, useState } from 'react';
import { DataContext } from './DataContext';
import api from '../services/api';

export const DataProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [lastImport, setLastImport] = useState(null);

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

  useEffect(() => {
    loadData();
  }, [loadData]);

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

  return (
    <DataContext.Provider value={{ products, alerts, uploadExcel, refreshData: loadData, lastImport }}>
      {children}
    </DataContext.Provider>
  );
};
