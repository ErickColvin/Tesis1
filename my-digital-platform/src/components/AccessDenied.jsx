import React from 'react';

export default function AccessDenied({ label = 'esta seccion' }) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="max-w-xl w-full bg-white/5 border border-white/10 rounded-2xl p-10 text-center shadow-2xl backdrop-blur-md animate-fade-in">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20 text-red-300 text-2xl">
          !
        </div>
        <h2 className="text-2xl font-semibold text-white mb-3">Acceso restringido</h2>
        <p className="text-sm text-gray-300">
          No tienes permisos para ver {label}. Si consideras que esto es un error, contacta a un administrador para revisar tus permisos de acceso o edicion.
        </p>
      </div>
    </div>
  );
}
