// Configuração da API
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export const apiUrl = (endpoint) => {
  // Se estiver em desenvolvimento local, usar URL relativa
  if (API_BASE_URL === '') {
    return endpoint;
  }
  // Se estiver em produção, usar URL completa
  return `${API_BASE_URL}${endpoint}`;
};

export default apiUrl;

