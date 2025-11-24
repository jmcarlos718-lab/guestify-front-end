import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json'
  }
});

export const setAuthToken = (token) => {
  if (token) {
    apiClient.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete apiClient.defaults.headers.common.Authorization;
  }
};

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle network errors (backend not reachable)
    if (!error.response) {
      if (error.code === 'ECONNABORTED') {
        return Promise.reject(new Error('Request timeout. Please check if the backend server is running.'));
      }
      if (error.message === 'Network Error' || error.code === 'ERR_NETWORK') {
        const backendUrl = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';
        return Promise.reject(new Error(
          `Cannot connect to backend server at ${backendUrl}.\n\n` +
          `⚠️  The backend server must be running on port 4000!\n\n` +
          `To start the backend:\n` +
          `1. Open a new terminal/command prompt\n` +
          `2. Run: cd backend\n` +
          `3. Run: npm start\n\n` +
          `You should see: "✅ Guestify API running on http://localhost:4000"\n` +
          `Keep that terminal open while using the app.`
        ));
      }
      return Promise.reject(new Error('Network error: ' + (error.message || 'Unable to reach server')));
    }
    
    // Handle HTTP errors
    const message = error?.response?.data?.message || error.message || 'Request failed';
    const statusCode = error.response?.status;
    const customError = new Error(message);
    // Preserve status code for error handling
    if (statusCode) {
      customError.status = statusCode;
      customError.response = error.response;
    }
    return Promise.reject(customError);
  }
);

export default apiClient;


