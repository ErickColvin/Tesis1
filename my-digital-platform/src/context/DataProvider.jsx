import React, { useState, useEffect } from 'react';
import { DataContext } from './DataContext';

export const DataProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [alerts, setAlerts] = useState([]);

  // Fetch inicial
  useEffect(() => {
    (async () => {
      try {
        const [pRes, aRes] = await Promise.all([
          fetch('/api/products'),
          fetch('/api/alerts?status=active'),
        ]);
        const productsData = await pRes.json();
        const alertsData = await aRes.json();
        setProducts(productsData.items || productsData || []);
        setAlerts(alertsData.alerts || alertsData || []);
      } catch (err) {
        console.error('Fetch inicial:', err);
      }
    })();
  }, []);

  const uploadExcel = async (file) => {
    const form = new FormData();
    form.append('file', file);
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: form,
      });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      // refresca datos
      const [productsRes, alertsRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/alerts?status=active')
      ]);
      const productsData = await productsRes.json();
      const alertsData = await alertsRes.json();
      setProducts(productsData.items || productsData || []);
      setAlerts(alertsData.alerts || alertsData || []);
      return true;
    } catch (err) {
      console.error('uploadExcel error:', err);
      return false;
    }
  };

  return (
    <DataContext.Provider
      value={{ products, alerts, uploadExcel }}
    >
      {children}
    </DataContext.Provider>
  );
};