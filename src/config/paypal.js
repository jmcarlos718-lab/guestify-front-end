const DEFAULT_PROD_PAYPAL_CLIENT_ID =
  'Af7uDfrUj7bLonV4Nc1DEp-7VRncJ7XAcfEBG89r2uuSY6w7scocNoaz3oFEXJ73pGJKSuTak_32HCEF';

export const PAYPAL_CLIENT_ID =
  process.env.REACT_APP_PAYPAL_CLIENT_ID ||
  (process.env.NODE_ENV === 'production' ? DEFAULT_PROD_PAYPAL_CLIENT_ID : '');

export const isPayPalSandbox = () => {
  if (process.env.REACT_APP_PAYPAL_ENV === 'production') {
    return false;
  }

  if (process.env.REACT_APP_PAYPAL_ENV === 'sandbox') {
    return true;
  }

  const clientId = PAYPAL_CLIENT_ID;
  if (!clientId) {
    return process.env.NODE_ENV !== 'production';
  }

  return clientId.includes('sandbox') || clientId.startsWith('sb-');
};
