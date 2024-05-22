import axios from 'axios';
const API_URL=process.env.REACT_APP_SERVER_URL || 'http://localhost';
const SERVER_PORT=process.env.REACT_APP_SERVER_PORT || '3001';

const api = axios.create({
  baseURL: `${API_URL}:${SERVER_PORT}`,
  withCredentials: true,
});

export default api;