const DEFAULT_DEV_API_URL = 'http://localhost:4000/api';

export const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  (process.env.NODE_ENV === 'production' ? '' : DEFAULT_DEV_API_URL);

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
  Boolean(process.env.REACT_APP_API_URL || process.env.NODE_ENV !== 'production');
