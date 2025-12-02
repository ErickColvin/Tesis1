import axios from 'axios';

// ## Cliente Axios configurado con base URL del entorno
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '' });
// ## Fin cliente Axios configurado con base URL del entorno

// ## Funcion para fijar o limpiar el token de autorizacion
export function setAuthToken(token) {
  api.defaults.headers.common.Authorization = token ? `Bearer ${token}` : undefined;
}
// ## Fin funcion para fijar o limpiar el token de autorizacion

export default api;
