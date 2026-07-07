/**
 * Guest Information Form Component
 *
 * Collects information for all guests before payment
 */

import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Card from '../common/Card';
import Button from '../common/Button';
import Input from '../common/Input';
import './GuestInformationForm.css';

const createEmptyGuest = (guestNumber = 1) => ({
  guestNumber,
  fullName: '',
  age: '',
  phone: '',
  email: ''
});

const GuestInformationForm = ({
  isOpen,
  onClose,
  numberOfGuests,
  onContinue,
  initialData = []
}) => {
  const [guestsData, setGuestsData] = useState([createEmptyGuest(1)]);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!isOpen) {
      setGuestsData([createEmptyGuest(1)]);
      setErrors({});
      return;
    }

    const guestCount = Math.max(Number(numberOfGuests) || 1, 1);
    const nextGuests = Array.from({ length: guestCount }, (_, index) => {
      const existing = initialData[index];
      return existing
        ? {
            guestNumber: index + 1,
            fullName: existing.fullName || '',
            age: existing.age || '',
            phone: existing.phone || '',
            email: existing.email || ''
          }
        : createEmptyGuest(index + 1);
    });

    setGuestsData(nextGuests);
    setErrors({});
  }, [isOpen, numberOfGuests]);

  const handleGuestChange = (index, field, value) => {
    setGuestsData((prev) =>
      prev.map((guest, guestIndex) =>
        guestIndex === index ? { ...guest, [field]: value } : guest
      )
    );

    const errorKey = `${index}-${field}`;
    if (errors[errorKey]) {
      setErrors((prev) => {
        const nextErrors = { ...prev };
        delete nextErrors[errorKey];
        return nextErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    guestsData.forEach((guest, index) => {
      if (!guest.fullName || guest.fullName.trim().length < 2) {
        newErrors[`${index}-fullName`] = 'Full name is required (at least 2 characters)';
      }

      if (!guest.age || parseInt(guest.age, 10) < 1 || parseInt(guest.age, 10) > 120) {
        newErrors[`${index}-age`] = 'Valid age is required (1-120)';
      }

      if (!guest.phone || guest.phone.trim().length < 10) {
        newErrors[`${index}-phone`] = 'Valid phone number is required';
      }

      if (index === 0 && guest.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guest.email)) {
        newErrors[`${index}-email`] = 'Invalid email format';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const formattedGuestData = guestsData.map((guest, index) => ({
      guestNumber: index + 1,
      fullName: guest.fullName.trim(),
      age: parseInt(guest.age, 10),
      phone: guest.phone.trim(),
      email: guest.email ? guest.email.trim() : null
    }));

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
            Please provide details for all guests before proceeding to payment.
          </p>
        </Card>

        <form onSubmit={handleSubmit}>
          {guestsData.map((guest, index) => (
            <Card key={`guest-${index}`} className="guest-card">
              <h3 className="guest-title">
                {index === 0 ? 'Primary Guest' : `Guest ${index + 1}`}
              </h3>

              <div className="guest-form-fields">
                <div className="form-group">
                  <Input
                    label="Full Name"
                    name={`fullName-${index}`}
                    type="text"
                    value={guest.fullName}
                    onChange={(e) => handleGuestChange(index, 'fullName', e.target.value)}
                    required
                    fullWidth
                    error={errors[`${index}-fullName`]}
                  />
                </div>

                <div className="form-group">
                  <Input
                    label="Age"
                    name={`age-${index}`}
                    type="number"
                    value={guest.age}
                    onChange={(e) => handleGuestChange(index, 'age', e.target.value)}
                    min="1"
                    max="120"
                    required
                    fullWidth
                    error={errors[`${index}-age`]}
                  />
                </div>

                <div className="form-group">
                  <Input
                    label="Phone Number"
                    name={`phone-${index}`}
                    type="tel"
                    value={guest.phone}
                    onChange={(e) => handleGuestChange(index, 'phone', e.target.value)}
                    placeholder="+639123456789"
                    required
                    fullWidth
                    error={errors[`${index}-phone`]}
                  />
                </div>

                {index === 0 && (
                  <div className="form-group">
                    <Input
                      label="Email"
                      name={`email-${index}`}
                      type="email"
                      value={guest.email || ''}
                      onChange={(e) => handleGuestChange(index, 'email', e.target.value)}
                      placeholder="guest@example.com"
                      fullWidth
                      error={errors[`${index}-email`]}
                    />
                  </div>
                )}
              </div>
            </Card>
          ))}

          <div className="form-actions">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Continue to Payment
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default GuestInformationForm;
