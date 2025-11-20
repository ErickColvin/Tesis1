import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => (
  <div className="p-6 text-center text-white">
    <h1 className="text-3xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
      Bienvenido a tu Plataforma de Inventario
    </h1>
    <p className="mb-6 text-gray-300">Digitaliza tu stock con un clic y evita quiebres de inventario.</p>
    <div className="space-x-4">
      <Link 
        to="/add-delivery" 
        className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition-all transform hover:scale-105 shadow-lg"
      >
        Agregar Delivery/MercadoLibre
      </Link>
      <Link 
        to="/products" 
        className="inline-block bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-3 rounded-lg font-semibold transition-all transform hover:scale-105 shadow-lg"
      >
        Productos
      </Link>
    </div>
  </div>
);

export default Home;