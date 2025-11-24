/**
 * Home Page - Redesigned
 * 
 * Modern home page with hero slider, featured listings, Best Offers, and Promos
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';
import { ROUTES, LISTING_CATEGORIES } from '../config/constants';
import Button from '../components/common/Button';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { searchListings } from '../services/listingService';
import { formatCurrency } from '../utils/helpers';
import WishlistButton from '../components/common/WishlistButton';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import './Home.css';

const Home = () => {
  const { isAuthenticated, userProfile } = useAuthContext();
  const [caramoanListings, setCaramoanListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadListings();
  }, []);

  const loadListings = async () => {
    try {
      // Load all published listings
      const allListings = await searchListings({
        category: null,
        minPrice: null,
        maxPrice: null
      });

      // Caramoan listings (filter by location containing "Caramoan")
      const caramoan = allListings.filter(l => 
        l.location?.city?.toLowerCase().includes('caramoan') ||
        l.location?.country?.toLowerCase().includes('caramoan') ||
        l.title?.toLowerCase().includes('caramoan')
      ).slice(0, 6);
      setCaramoanListings(caramoan);

    } catch (error) {
      console.error('Error loading listings:', error);
    } finally {
      setLoading(false);
    }
  };

  const heroSlides = [
    {
      image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1920&q=80',
      title: 'Discover Amazing Stays',
      subtitle: 'Find the perfect place for your next adventure'
    },
    {
      image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1920&q=80',
      title: 'Caramoan Paradise',
      subtitle: 'Experience the beauty of Caramoan beaches'
    },
    {
      image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1920&q=80',
      title: 'Camarines Sur Heritage',
      subtitle: 'Explore the rich culture of Camarines Sur'
    }
  ];

  const ListingCard = ({ listing }) => (
    <Link
      to={`${ROUTES.LISTING_DETAIL.replace(':id', listing.id)}`}
      className="listing-card"
    >
      <div className="listing-image-container">
        {listing.images && listing.images.length > 0 ? (
          <img src={listing.images[0]} alt={listing.title} />
        ) : (
          <div className="no-image">No Image</div>
        )}
        {listing.pricing?.discount > 0 && (
          <div className="discount-badge">
            {listing.pricing.discount}% OFF
          </div>
        )}
        <WishlistButton listingId={listing.id} className="wishlist-btn" />
      </div>
      <div className="listing-info">
        <h3 className="listing-title">{listing.title}</h3>
        <p className="listing-location">
          {listing.location?.city}, {listing.location?.country}
        </p>
        {listing.rating > 0 && (
          <div className="listing-rating">
            <span className="rating-stars">★</span>
            <span>{listing.rating.toFixed(1)}</span>
            <span className="rating-count">({listing.reviewCount || 0})</span>
          </div>
        )}
        <div className="listing-price">
          {listing.pricing?.discount > 0 && (
            <span className="original-price">
              {formatCurrency(listing.pricing.baseRate, listing.pricing.currency)}
            </span>
          )}
          <span className="current-price">
            {formatCurrency(
              listing.pricing?.baseRate * (1 - (listing.pricing?.discount || 0) / 100),
              listing.pricing?.currency
            )}
          </span>
          <span className="price-period">/night</span>
        </div>
      </div>
    </Link>
  );

  const DestinationCard = ({ listing }) => {
    const propertyCount = Math.floor(Math.random() * 1000) + 100; // Mock property count
    
    return (
      <Link
        to={`${ROUTES.LISTING_DETAIL.replace(':id', listing.id)}`}
        className="destination-card"
      >
        <div className="destination-image">
          {listing.images && listing.images.length > 0 ? (
            <img src={listing.images[0]} alt={listing.title} />
          ) : (
            <div className="no-image">No Image</div>
          )}
        </div>
        <div className="destination-info">
          <h3>{listing.title}</h3>
          <p className="destination-properties">{propertyCount} properties</p>
        </div>
      </Link>
    );
  };

  return (
    <div className="home-container">
      <Header />

      <main className="home-main">
        {/* Hero Slider */}
        <section className="hero-slider-section">
          <Swiper
            modules={[Navigation, Pagination, Autoplay]}
            spaceBetween={0}
            slidesPerView={1}
            navigation
            pagination={{ clickable: true }}
            autoplay={{
              delay: 5000,
              disableOnInteraction: false
            }}
            loop
            className="hero-swiper"
          >
            {heroSlides.map((slide, index) => (
              <SwiperSlide key={index}>
                <div
                  className="hero-slide"
                  style={{ backgroundImage: `url(${slide.image})` }}
                >
                  <div className="hero-overlay"></div>
                  <div className="hero-content">
                    <div className="hero-content-card">
                      <h1 className="hero-title">{slide.title}</h1>
                      <p className="hero-subtitle">{slide.subtitle}</p>
                      {!isAuthenticated && (
                        <div className="hero-actions">
                          <Link to={ROUTES.REGISTER}>
                            <Button variant="primary" size="lg">
                              Get Started
                            </Button>
                          </Link>
                          <Link to={ROUTES.BOOKING}>
                            <Button variant="outline" size="lg">
                              Explore Listings
                            </Button>
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </section>

        {/* Why Guestify Section */}
        <section className="why-guestify-section">
          <div className="section-container">
            <h2 className="section-title">Why Guestify?</h2>
            <div className="why-guestify-grid">
              <div className="why-card">
                <div className="why-icon">📅</div>
                <h3>Book now, pay at the property</h3>
                <p>FREE cancellation on most rooms</p>
              </div>
              <div className="why-card">
                <div className="why-icon">👍</div>
                <h3>100K+ reviews from fellow travelers</h3>
                <p>Get trusted information from guests like you</p>
              </div>
              <div className="why-card">
                <div className="why-icon">🌍</div>
                <h3>2+ million properties worldwide</h3>
                <p>Hotels, guest houses, apartments, and more...</p>
              </div>
              <div className="why-card">
                <div className="why-icon">🎧</div>
                <h3>Trusted 24/7 customer service you can rely on</h3>
                <p>We're always here to help</p>
              </div>
            </div>
          </div>
        </section>

        {/* Explore Caramoan Section */}
        <section className="explore-caramoan-section">
          <div className="section-container">
            <div className="section-header">
              <div>
                <h2>Explore Caramoan</h2>
                <p className="section-subtitle">These popular destinations have a lot to offer</p>
              </div>
            </div>
            {loading ? (
              <div className="loading-grid">Loading...</div>
            ) : caramoanListings.length > 0 ? (
              <div className="destinations-grid">
                {caramoanListings.map((listing) => (
                  <DestinationCard key={listing.id} listing={listing} />
                ))}
              </div>
            ) : (
              <div className="empty-section">
                <p>No Caramoan listings available at the moment</p>
                <Link to={ROUTES.BOOKING}>
                  <Button variant="primary">Browse All Listings</Button>
                </Link>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Home;
