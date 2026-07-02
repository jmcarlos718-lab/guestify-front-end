const DEFAULT_DEV_API_URL = 'http://localhost:4000/api';
const DEFAULT_PROD_API_URL = 'https://backend-production-0716.up.railway.app/api';

export const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  (process.env.NODE_ENV === 'production' ? DEFAULT_PROD_API_URL : DEFAULT_DEV_API_URL);

export const getHealthCheckUrl = () => {
  if (!API_BASE_URL) {
    return null;
  }

  const normalized = API_BASE_URL.replace(/\/$/, '');
  if (normalized.endsWith('/api')) {
    return `${normalized}/health`;
  }

  const origin = normalized.replace(/\/api.*$/, '');
  return `${origin}/api/health`;
};

export const isProductionApiConfigured = () =>
  Boolean(API_BASE_URL);
