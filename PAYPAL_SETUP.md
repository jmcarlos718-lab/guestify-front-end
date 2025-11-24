# PayPal Sandbox Setup Guide

This guide will help you set up PayPal in sandbox/test mode for development and testing.

## Quick Setup

### 1. Get PayPal Sandbox Client ID

1. Go to [PayPal Developer Dashboard](https://developer.paypal.com/)
2. Log in with your PayPal account (or create one)
3. Navigate to **Apps & Credentials** in the left sidebar
4. Under **Sandbox**, click **Create App**
5. Give it a name (e.g., "Guestify Test")
6. Copy the **Client ID** (starts with `sb-` or similar)

### 2. Configure Environment Variable

Create a `.env` file in the `my-react-app` directory:

```env
REACT_APP_PAYPAL_CLIENT_ID=your_sandbox_client_id_here
REACT_APP_PAYPAL_ENV=sandbox
```

### 3. Restart Development Server

After adding the `.env` file, restart your React development server:

```bash
npm start
```

## Testing with Sandbox Accounts

### Using PayPal Sandbox Test Accounts

PayPal provides pre-configured test accounts, or you can create your own:

1. Go to [PayPal Developer Dashboard](https://developer.paypal.com/)
2. Navigate to **Accounts** → **Sandbox** → **Accounts**
3. You'll see default test accounts or create new ones

### Default Test Accounts

PayPal provides these default test accounts:

**Personal Account (Buyer):**
- Email: `buyer@personal.example.com`
- Password: `test1234` (or check PayPal dashboard)

**Business Account (Seller):**
- Email: `seller@business.example.com`
- Password: `test1234` (or check PayPal dashboard)

### Creating Custom Test Accounts

1. In PayPal Developer Dashboard, go to **Accounts** → **Sandbox** → **Accounts**
2. Click **Create Account**
3. Choose account type (Personal or Business)
4. Set email and password
5. Use these credentials to test payments

## Testing the Payment Flow

1. **Start the app** and navigate to a listing
2. **Select dates** and click "Reserve"
3. **PayPal modal** will appear
4. **Click "Pay with PayPal"**
5. **Log in** with a sandbox test account
6. **Complete the payment** (no real money is charged)
7. **Booking will be created** after successful payment

## Important Notes

- ✅ **Sandbox mode** = No real money is charged
- ✅ **Test accounts** = Use any email/password from sandbox
- ✅ **All transactions** are fake and for testing only
- ⚠️ **Don't use real PayPal accounts** in sandbox mode
- ⚠️ **Sandbox Client ID** starts with `sb-` or is clearly marked as sandbox

## Troubleshooting

### PayPal Button Not Showing

- Check that `REACT_APP_PAYPAL_CLIENT_ID` is set in `.env`
- Restart the development server after adding `.env`
- Check browser console for errors

### Payment Fails

- Ensure you're using a **sandbox test account**
- Check that the Client ID is a **sandbox Client ID** (not production)
- Verify the account has sufficient balance (sandbox accounts can have unlimited balance)

### Client ID Format

Sandbox Client IDs typically:
- Start with `sb-` or `A`
- Are clearly marked as "Sandbox" in PayPal dashboard
- Are different from production Client IDs

## Production Setup

When ready for production:

1. Create a **Production App** in PayPal Developer Dashboard
2. Get the **Production Client ID**
3. Update `.env`:
   ```env
   REACT_APP_PAYPAL_CLIENT_ID=your_production_client_id
   REACT_APP_PAYPAL_ENV=production
   ```
4. Test thoroughly before going live!

## Support

For more information:
- [PayPal Developer Documentation](https://developer.paypal.com/docs/)
- [PayPal Sandbox Testing Guide](https://developer.paypal.com/docs/api-basics/sandbox/)







