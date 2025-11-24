/**
 * Contact Us Page
 * 
 * Contact form and information
 */

import React, { useState } from 'react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { toast } from 'react-toastify';
import './ContactUs.css';

const ContactUs = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.subject.trim()) {
      newErrors.subject = 'Subject is required';
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    } else if (formData.message.trim().length < 10) {
      newErrors.message = 'Message must be at least 10 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // In a real app, you would send this to a backend API
      // For now, we'll just show a success message
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Thank you for your message! We will get back to you soon.');
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: ''
      });
    } catch (error) {
      toast.error('Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="contact-page">
      <Header />
      <main className="contact-main">
        <div className="contact-container">
          <div className="contact-header">
            <h1>Contact Us</h1>
            <p>We'd love to hear from you. Send us a message and we'll respond as soon as possible.</p>
          </div>

          <div className="contact-content">
            <Card className="contact-form-card">
              <h2>Send us a Message</h2>
              <form onSubmit={handleSubmit} className="contact-form">
                <Input
                  label="Your Name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  error={errors.name}
                  required
                  fullWidth
                />

                <Input
                  type="email"
                  label="Email Address"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  error={errors.email}
                  required
                  fullWidth
                />

                <Input
                  label="Subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  error={errors.subject}
                  required
                  fullWidth
                />

                <div className="form-group">
                  <label className="form-label">
                    Message <span className="required">*</span>
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows="6"
                    className={`form-textarea ${errors.message ? 'error' : ''}`}
                    placeholder="Enter your message..."
                  />
                  {errors.message && (
                    <span className="input-error">{errors.message}</span>
                  )}
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  fullWidth
                  loading={isSubmitting}
                  disabled={isSubmitting}
                >
                  Send Message
                </Button>
              </form>
            </Card>

            <Card className="contact-info-card">
              <h2>Get in Touch</h2>
              <div className="contact-info">
                <div className="info-item">
                  <h3>Email</h3>
                  <p>support@guestify.com</p>
                </div>
                <div className="info-item">
                  <h3>Phone</h3>
                  <p>+1 (555) 123-4567</p>
                </div>
                <div className="info-item">
                  <h3>Office Hours</h3>
                  <p>Monday - Friday: 9:00 AM - 6:00 PM</p>
                  <p>Saturday: 10:00 AM - 4:00 PM</p>
                  <p>Sunday: Closed</p>
                </div>
                <div className="info-item">
                  <h3>Address</h3>
                  <p>
                    123 Guestify Street<br />
                    City, State 12345<br />
                    Country
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ContactUs;
