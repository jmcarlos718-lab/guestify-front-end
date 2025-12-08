/**
 * Payout Service
 *
 * Handles host and admin payout/withdrawal flows using Firestore.
 * Attempts a real PayPal sandbox payout when client/secret are present;
 * otherwise falls back to a simulated payout so that balances are cleared
 * for testing.
 */

import * as firestoreService from './firestoreService';

const PAYOUT_COLLECTION = 'payouts';

const parseAmount = (value) => {
  if (typeof value === 'number') return value;
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const getPayPalCredentials = () => {
  const clientId =
    process.env.REACT_APP_PAYPAL_PAYOUT_CLIENT_ID ||
    process.env.REACT_APP_PAYPAL_CLIENT_ID;
  const secret = process.env.REACT_APP_PAYPAL_PAYOUT_SECRET;
  return { clientId, secret };
};

const requestPayPalAccessToken = async (clientId, secret) => {
  const authHeader = btoa(`${clientId}:${secret}`);
  const response = await fetch('https://api-m.sandbox.paypal.com/v1/oauth2/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${authHeader}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`PayPal auth failed: ${body}`);
  }

  const data = await response.json();
  return data.access_token;
};

const sendPayPalPayout = async ({ amount, email, note }) => {
  const { clientId, secret } = getPayPalCredentials();

  // If sandbox credentials are not provided, simulate success so we can
  // continue to mark payouts as processed during development.
  if (!clientId || !secret) {
    return {
      simulated: true,
      message: 'PayPal sandbox credentials not configured; simulated payout.'
    };
  }

  const accessToken = await requestPayPalAccessToken(clientId, secret);

  const response = await fetch('https://api-m.sandbox.paypal.com/v1/payments/payouts', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      sender_batch_header: {
        sender_batch_id: `batch-${Date.now()}`,
        email_subject: 'Guestify payout',
        email_message: 'You have a payout from Guestify.'
      },
      items: [
        {
          recipient_type: 'EMAIL',
          amount: {
            value: parseAmount(amount).toFixed(2),
            currency: 'PHP'
          },
          note: note || 'Host payout',
          receiver: email
        }
      ]
    })
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`PayPal payout failed: ${body}`);
  }

  const data = await response.json();
  return {
    simulated: false,
    batchId: data.batch_header?.payout_batch_id,
    payPalResponse: data
  };
};

const splitPaymentByRole = (payment, role) => {
  const amount =
    role === 'host'
      ? parseAmount(payment.hostIncome)
      : parseAmount(payment.adminIncome);

  const status =
    role === 'host'
      ? payment.hostPayoutStatus || payment.payoutStatus || 'pending'
      : payment.adminPayoutStatus || 'pending';

  return { amount, status };
};

const summarizePayments = (payments, role) => {
  return payments.reduce(
    (acc, payment) => {
      const { amount, status } = splitPaymentByRole(payment, role);
      if (status === 'paid') {
        acc.paid += amount;
      } else if (status === 'processing') {
        acc.processing += amount;
      } else {
        acc.available += amount;
      }
      return acc;
    },
    { available: 0, processing: 0, paid: 0 }
  );
};

export const getHostPayoutSummary = async (hostId) => {
  const payments = await firestoreService.getDocuments(
    'payments',
    [{ field: 'hostId', operator: '==', value: hostId }],
    null,
    'asc'
  );

  const totals = summarizePayments(payments, 'host');
  return { ...totals, payments };
};

export const getAdminPayoutSummary = async () => {
  const payments = await firestoreService.getDocuments('payments', [], null, 'asc');
  const totals = summarizePayments(payments, 'admin');
  return { ...totals, payments };
};

export const requestHostPayout = async (hostId, paypalEmail) => {
  const { payments, available } = await getHostPayoutSummary(hostId);
  const eligible = payments.filter(
    (payment) =>
      (payment.hostPayoutStatus || payment.payoutStatus || 'pending') === 'pending'
  );

  if (eligible.length === 0 || available <= 0) {
    throw new Error('No available balance to withdraw.');
  }

  // Create payout record
  const payoutDoc = {
    type: 'host',
    userId: hostId,
    email: paypalEmail,
    amount: available,
    paymentIds: eligible.map((p) => p.id),
    status: 'processing',
    createdAt: new Date()
  };

  const payoutId = await firestoreService.createDocument(PAYOUT_COLLECTION, payoutDoc);

  // Move payments into processing to avoid duplicate requests
  await Promise.all(
    eligible.map((payment) =>
      firestoreService.updateDocument('payments', payment.id, {
        hostPayoutStatus: 'processing',
        hostPayoutId: payoutId
      })
    )
  );

  let payPalResult;
  try {
    payPalResult = await sendPayPalPayout({
      amount: available,
      email: paypalEmail,
      note: 'Host payout'
    });
  } catch (error) {
    // Roll back to pending so user can retry
    await Promise.all(
      eligible.map((payment) =>
        firestoreService.updateDocument('payments', payment.id, {
          hostPayoutStatus: 'pending'
        })
      )
    );
    await firestoreService.updateDocument(PAYOUT_COLLECTION, payoutId, {
      status: 'failed',
      error: error.message,
      updatedAt: new Date()
    });
    throw error;
  }

  // Mark payout as paid
  await Promise.all(
    eligible.map((payment) =>
      firestoreService.updateDocument('payments', payment.id, {
        hostPayoutStatus: 'paid',
        hostPayoutId: payoutId
      })
    )
  );

  await firestoreService.updateDocument(PAYOUT_COLLECTION, payoutId, {
    status: 'paid',
    payPalBatchId: payPalResult.batchId || null,
    simulated: payPalResult.simulated || false,
    updatedAt: new Date()
  });

  return { payoutId, amount: available, simulated: payPalResult.simulated };
};

export const requestAdminPayout = async (paypalEmail) => {
  const { payments, available } = await getAdminPayoutSummary();
  const eligible = payments.filter(
    (payment) => (payment.adminPayoutStatus || 'pending') === 'pending'
  );

  if (eligible.length === 0 || available <= 0) {
    throw new Error('No available admin income to withdraw.');
  }

  const payoutDoc = {
    type: 'admin',
    userId: 'platform',
    email: paypalEmail,
    amount: available,
    paymentIds: eligible.map((p) => p.id),
    status: 'processing',
    createdAt: new Date()
  };

  const payoutId = await firestoreService.createDocument(PAYOUT_COLLECTION, payoutDoc);

  await Promise.all(
    eligible.map((payment) =>
      firestoreService.updateDocument('payments', payment.id, {
        adminPayoutStatus: 'processing',
        adminPayoutId: payoutId
      })
    )
  );

  let payPalResult;
  try {
    payPalResult = await sendPayPalPayout({
      amount: available,
      email: paypalEmail,
      note: 'Platform income payout'
    });
  } catch (error) {
    await Promise.all(
      eligible.map((payment) =>
        firestoreService.updateDocument('payments', payment.id, {
          adminPayoutStatus: 'pending'
        })
      )
    );
    await firestoreService.updateDocument(PAYOUT_COLLECTION, payoutId, {
      status: 'failed',
      error: error.message,
      updatedAt: new Date()
    });
    throw error;
  }

  await Promise.all(
    eligible.map((payment) =>
      firestoreService.updateDocument('payments', payment.id, {
        adminPayoutStatus: 'paid',
        adminPayoutId: payoutId
      })
    )
  );

  await firestoreService.updateDocument(PAYOUT_COLLECTION, payoutId, {
    status: 'paid',
    payPalBatchId: payPalResult.batchId || null,
    simulated: payPalResult.simulated || false,
    updatedAt: new Date()
  });

  return { payoutId, amount: available, simulated: payPalResult.simulated };
};

