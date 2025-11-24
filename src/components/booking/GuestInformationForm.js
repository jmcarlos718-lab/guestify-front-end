/**
 * Guest Information Form Component
 * 
 * Collects information for the primary guest before payment
 */

import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Card from '../common/Card';
import Button from '../common/Button';
import Input from '../common/Input';
import './GuestInformationForm.css';

const GuestInformationForm = ({
  isOpen,
  onClose,
  numberOfGuests,
  onContinue,
  initialData = []
}) => {
  const [guestData, setGuestData] = useState({
    fullName: '',
    age: '',
    phone: '',
    email: ''
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    // Reset form when modal opens
    if (isOpen) {
      if (initialData && initialData.length > 0 && initialData[0]) {
        setGuestData({
          fullName: initialData[0].fullName || '',
          age: initialData[0].age || '',
          phone: initialData[0].phone || '',
          email: initialData[0].email || ''
        });
      } else {
        setGuestData({
          fullName: '',
          age: '',
          phone: '',
          email: ''
        });
      }
      setErrors({});
    } else {
      // Reset when modal closes
      setGuestData({
        fullName: '',
        age: '',
        phone: '',
        email: ''
      });
      setErrors({});
    }
  }, [isOpen]); // Only depend on isOpen to prevent re-renders while typing

  const handleGuestChange = (field, value) => {
    setGuestData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error for this field
    if (errors[field]) {
      const newErrors = { ...errors };
      delete newErrors[field];
      setErrors(newErrors);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!guestData.fullName || guestData.fullName.trim().length < 2) {
      newErrors.fullName = 'Full name is required (at least 2 characters)';
    }

    if (!guestData.age || parseInt(guestData.age) < 1 || parseInt(guestData.age) > 120) {
      newErrors.age = 'Valid age is required (1-120)';
    }

    if (!guestData.phone || guestData.phone.trim().length < 10) {
      newErrors.phone = 'Valid phone number is required';
    }

    // Email is optional but if provided, should be valid
    if (guestData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestData.email)) {
      newErrors.email = 'Invalid email format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Format guest data for submission (only primary guest)
    const formattedGuestData = [{
      guestNumber: 1,
      fullName: guestData.fullName.trim(),
      age: parseInt(guestData.age),
      phone: guestData.phone.trim(),
      email: guestData.email ? guestData.email.trim() : null
    }];

    onContinue(formattedGuestData);
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Guest Information"
      size="large"
    >
      <div className="guest-information-form">
        <Card className="info-card">
          <p className="form-description">
            Please provide information for the primary guest before proceeding to payment.
            {numberOfGuests > 1 && (
              <span style={{ display: 'block', marginTop: '0.5rem', fontSize: '0.875rem', color: '#6b7280' }}>
                (Booking for {numberOfGuests} {numberOfGuests === 1 ? 'guest' : 'guests'})
              </span>
            )}
          </p>
        </Card>

        <form onSubmit={handleSubmit}>
          <Card className="guest-card">
            <h3 className="guest-title">
              Primary Guest Information
            </h3>

            <div className="guest-form-fields">
              <div className="form-group">
                <Input
                  label="Full Name"
                  name="fullName"
                  type="text"
                  value={guestData.fullName}
                  onChange={(e) => handleGuestChange('fullName', e.target.value)}
                  required
                  fullWidth
                  error={errors.fullName}
                />
              </div>

              <div className="form-group">
                <Input
                  label="Age"
                  name="age"
                  type="number"
                  value={guestData.age}
                  onChange={(e) => handleGuestChange('age', e.target.value)}
                  min="1"
                  max="120"
                  required
                  fullWidth
                  error={errors.age}
                />
              </div>

              <div className="form-group">
                <Input
                  label="Phone Number"
                  name="phone"
                  type="tel"
                  value={guestData.phone}
                  onChange={(e) => handleGuestChange('phone', e.target.value)}
                  placeholder="+1234567890"
                  required
                  fullWidth
                  error={errors.phone}
                />
              </div>

              <div className="form-group">
                <Input
                  label="Email (Optional)"
                  name="email"
                  type="email"
                  value={guestData.email || ''}
                  onChange={(e) => handleGuestChange('email', e.target.value)}
                  placeholder="guest@example.com"
                  fullWidth
                  error={errors.email}
                />
              </div>
            </div>
          </Card>

          <div className="form-actions">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
            >
              Continue to Payment
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default GuestInformationForm;

