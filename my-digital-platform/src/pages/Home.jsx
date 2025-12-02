import React from 'react';
import { Link } from 'react-router-dom';

// ## Pantalla de bienvenida con accesos rapidos
const Home = ({ user }) => {
  // ## Determina si el usuario tiene rol administrador
  const isAdmin = user?.role === 'admin';

  // ## Configuracion de botones segun rol
  const buttons = isAdmin
    ? [
        {
          to: '/cliente/nuevo',
          label: 'Agregar pedido',
          className:
            'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white'
        },
        {
          to: '/returns/new',
          label: 'Agregar Mercado Libre',
          className:
            'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white'
        },
        {
          to: '/products',
          label: 'Productos',
          className:
            'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white'
        }
      ]
    : [
        {
          to: '/cliente/nuevo',
          label: 'Agregar pedido',
          className:
            'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white'
        },
        {
          to: '/products',
          label: 'Productos',
          className:
            'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white'
        }
      ];
  // ## Fin configuracion de botones segun rol

  // ## Render principal con accesos y mensajes
  return (
    <div className="p-6 text-center text-white">
      <h1 className="text-3xl font-bold mb-4 bg-gradient-to-r from-amber-300 to-rose-400 bg-clip-text text-transparent">
        Bienvenido a tu Plataforma de Inventario
      </h1>
      <p className="mb-6 text-gray-300">Digitaliza tu stock con un clic y evita quiebres de inventario.</p>
      <div className="flex flex-wrap justify-center gap-4">
        {buttons.map((button) => (
          <Link
            key={button.label}
            to={button.to}
            className={`inline-block ${button.className} px-6 py-3 rounded-lg font-semibold transition-all transform hover:scale-105 shadow-lg`}
          >
            {button.label}
          </Link>
        ))}
      </div>
      <p className="mt-4 text-sm text-gray-400">
        Consulta y actualiza las devoluciones de Mercado Libre directamente desde la base de datos.
      </p>
    </div>
  );
};
// ## Fin pantalla de bienvenida con accesos rapidos

export default Home;
