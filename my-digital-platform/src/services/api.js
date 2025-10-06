import axios from 'axios';
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '' });
export function setAuthToken(token) { api.defaults.headers.common.Authorization = token ? `Bearer ${token}` : undefined; }
export default api;
