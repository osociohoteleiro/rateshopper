// Configuração robusta da API
const API_BASE_URL = 'https://xlhyimcjnjyy.manus.space';

export const apiCall = async (endpoint, options = {}) => {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
};

export const apiUrl = (endpoint) => `${API_BASE_URL}${endpoint}`;

export default apiCall;

