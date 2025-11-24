/**
 * Payment Method Selector Component
 * 
 * Allows users to select payment method
 */

import React, { useState } from 'react';
import './PaymentMethodSelector.css';

const PAYMENT_METHODS = {
  CREDIT_CARD: 'credit_card',
  DEBIT_CARD: 'debit_card',
  E_WALLET: 'e_wallet',
  BANK_TRANSFER: 'bank_transfer'
};

const E_WALLETS = {
  PAYPAL: 'paypal',
  STRIPE: 'stripe',
  VENMO: 'venmo',
  CASHAPP: 'cashapp',
  GOOGLE_PAY: 'google_pay',
  APPLE_PAY: 'apple_pay'
};

const PaymentMethodSelector = ({ selectedMethod, onMethodChange, selectedWallet, onWalletChange }) => {
  const [showWalletOptions, setShowWalletOptions] = useState(selectedMethod === PAYMENT_METHODS.E_WALLET);

  const handleMethodChange = (method) => {
    onMethodChange(method);
    setShowWalletOptions(method === PAYMENT_METHODS.E_WALLET);
    if (method !== PAYMENT_METHODS.E_WALLET) {
      onWalletChange(null);
    }
  };

  return (
    <div className="payment-method-selector">
      <h3 className="selector-title">Select Payment Method</h3>
      
      <div className="payment-methods-grid">
        <button
          type="button"
          className={`method-option ${selectedMethod === PAYMENT_METHODS.CREDIT_CARD ? 'active' : ''}`}
          onClick={() => handleMethodChange(PAYMENT_METHODS.CREDIT_CARD)}
        >
          <span className="method-icon">💳</span>
          <span className="method-label">Credit Card</span>
        </button>

        <button
          type="button"
          className={`method-option ${selectedMethod === PAYMENT_METHODS.DEBIT_CARD ? 'active' : ''}`}
          onClick={() => handleMethodChange(PAYMENT_METHODS.DEBIT_CARD)}
        >
          <span className="method-icon">💳</span>
          <span className="method-label">Debit Card</span>
        </button>

        <button
          type="button"
          className={`method-option ${selectedMethod === PAYMENT_METHODS.E_WALLET ? 'active' : ''}`}
          onClick={() => handleMethodChange(PAYMENT_METHODS.E_WALLET)}
        >
          <span className="method-icon">📱</span>
          <span className="method-label">E-Wallet</span>
        </button>

        <button
          type="button"
          className={`method-option ${selectedMethod === PAYMENT_METHODS.BANK_TRANSFER ? 'active' : ''}`}
          onClick={() => handleMethodChange(PAYMENT_METHODS.BANK_TRANSFER)}
        >
          <span className="method-icon">🏦</span>
          <span className="method-label">Bank Transfer</span>
        </button>
      </div>

      {showWalletOptions && (
        <div className="wallet-options">
          <h4 className="wallet-title">Select E-Wallet</h4>
          <div className="wallets-grid">
            {Object.entries(E_WALLETS).map(([key, value]) => (
              <button
                key={value}
                type="button"
                className={`wallet-option ${selectedWallet === value ? 'active' : ''}`}
                onClick={() => onWalletChange(value)}
              >
                <span className="wallet-name">{key.replace('_', ' ')}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedMethod === PAYMENT_METHODS.CREDIT_CARD || selectedMethod === PAYMENT_METHODS.DEBIT_CARD ? (
        <div className="card-form">
          <div className="form-group">
            <label>Card Number</label>
            <input
              type="text"
              placeholder="1234 5678 9012 3456"
              maxLength="19"
              className="form-input"
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Expiry Date</label>
              <input
                type="text"
                placeholder="MM/YY"
                maxLength="5"
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>CVV</label>
              <input
                type="text"
                placeholder="123"
                maxLength="4"
                className="form-input"
              />
            </div>
          </div>
          <div className="form-group">
            <label>Cardholder Name</label>
            <input
              type="text"
              placeholder="John Doe"
              className="form-input"
            />
          </div>
        </div>
      ) : selectedMethod === PAYMENT_METHODS.BANK_TRANSFER ? (
        <div className="bank-info">
          <p className="info-text">
            Bank transfer details will be provided after booking confirmation.
            Payment must be completed within 24 hours.
          </p>
        </div>
      ) : null}
    </div>
  );
};

export default PaymentMethodSelector;
export { PAYMENT_METHODS, E_WALLETS };





