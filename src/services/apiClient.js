import axios from 'axios';
import { API_BASE_URL } from '../config/api';

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
    if (!error.response) {
      if (error.code === 'ECONNABORTED') {
        return Promise.reject(new Error('Request timeout. Please check if the backend server is running.'));
      }

      if (error.message === 'Network Error' || error.code === 'ERR_NETWORK') {
        if (process.env.NODE_ENV === 'production') {
          return Promise.reject(new Error(
            `Cannot connect to backend at ${API_BASE_URL || '(missing REACT_APP_API_URL)'}.\n\n` +
            'Check Railway deployment, Vercel REACT_APP_API_URL, and Railway CLIENT_URL.'
          ));
        }

        return Promise.reject(new Error(
          `Cannot connect to backend server at ${API_BASE_URL}.\n\n` +
          'The backend server must be running on port 4000.\n\n' +
          'To start the backend:\n' +
          '1. Open a new terminal/command prompt\n' +
          '2. Run: cd backend\n' +
          '3. Run: npm start'
        ));
      }

      return Promise.reject(new Error('Network error: ' + (error.message || 'Unable to reach server')));
    }

    const message = error?.response?.data?.message || error.message || 'Request failed';
    const statusCode = error.response?.status;
    const customError = new Error(message);

    if (statusCode) {
      customError.status = statusCode;
      customError.response = error.response;
    }

    return Promise.reject(customError);
  }
);

export default apiClient;
