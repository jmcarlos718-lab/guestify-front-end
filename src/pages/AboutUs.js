/**
 * About Us Page
 * 
 * Information about Guestify platform
 */

import React from 'react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import Card from '../components/common/Card';
import './AboutUs.css';

const AboutUs = () => {
  return (
    <div className="about-page">
      <Header />
      <main className="about-main">
        <div className="about-container">
          <div className="about-hero">
            <h1>About Guestify</h1>
            <p className="about-subtitle">
              Your trusted platform for amazing stays, experiences, and services
            </p>
          </div>

          <section className="about-section">
            <Card className="about-card">
              <h2>Our Mission</h2>
              <p>
                At Guestify, we believe that everyone deserves to discover amazing places and experiences. 
                Our mission is to connect hosts and guests in a seamless, secure, and enjoyable way, 
                creating memorable experiences for everyone involved.
              </p>
            </Card>

            <Card className="about-card">
              <h2>What We Offer</h2>
              <div className="about-features">
                <div className="feature-item">
                  <h3>For Guests</h3>
                  <p>
                    Discover unique accommodations, experiences, and services. Browse through apartments, 
                    hotels, resorts, and more. Find the perfect place for your next adventure with our 
                    comprehensive search and filtering options.
                  </p>
                </div>
                <div className="feature-item">
                  <h3>For Hosts</h3>
                  <p>
                    Share your space and earn income. Our subscription-based platform allows hosts to 
                    list their properties with flexible plans. Manage your listings, bookings, and 
                    connect with guests easily.
                  </p>
                </div>
                <div className="feature-item">
                  <h3>Secure & Reliable</h3>
                  <p>
                    We prioritize security and reliability. All transactions are secure, and we provide 
                    comprehensive support for both hosts and guests throughout their journey.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="about-card">
              <h2>Our Locations</h2>
              <p>
                We specialize in connecting guests with amazing properties in beautiful destinations, 
                including:
              </p>
              <ul className="locations-list">
                <li><strong>Caramoan</strong> - Pristine beaches and natural beauty</li>
                <li><strong>Ilocos Sur</strong> - Rich cultural heritage and stunning landscapes</li>
                <li>And many more destinations across the region</li>
              </ul>
            </Card>

            <Card className="about-card">
              <h2>Why Choose Guestify?</h2>
              <ul className="benefits-list">
                <li>✓ Verified listings and hosts</li>
                <li>✓ Secure payment processing</li>
                <li>✓ 24/7 customer support</li>
                <li>✓ Best offers and exclusive promos</li>
                <li>✓ Easy booking and management</li>
                <li>✓ Transparent pricing with no hidden fees</li>
              </ul>
            </Card>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AboutUs;
