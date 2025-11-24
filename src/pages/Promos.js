/**
 * Promos Page
 * 
 * Display limited-time promos and special deals
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import Card from '../components/common/Card';
import WishlistButton from '../components/common/WishlistButton';
import Loading from '../components/common/Loading';
import { ROUTES } from '../config/constants';
import { searchListings } from '../services/listingService';
import { formatCurrency } from '../utils/helpers';
import { toast } from 'react-toastify';
import './Promos.css';

const Promos = () => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPromos();
  }, []);

  const loadPromos = async () => {
    try {
      setLoading(true);
      const allListings = await searchListings({});
      // Filter listings with promo codes or discount > 15%
      const promos = allListings.filter(
        l => l.pricing?.promoCode || l.pricing?.discount > 15
      );
      setListings(promos);
    } catch (error) {
      toast.error('Failed to load promos');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysLeft = () => {
    // Mock countdown - in real app, this would come from listing data
    return Math.floor(Math.random() * 30) + 1;
  };

  return (
    <div className="promos-page">
      <Header />
      <main className="promos-main">
        <div className="promos-container">
          <div className="promos-header">
            <h1>Limited Time Promos</h1>
            <p>Don't miss out on these exclusive deals and special offers</p>
          </div>

          {loading ? (
            <Loading message="Loading promos..." />
          ) : listings.length === 0 ? (
            <Card className="empty-promos">
              <div className="empty-content">
                <h3>No promos available</h3>
                <p>Check back later for exclusive deals!</p>
                <Link to={ROUTES.BOOKING}>
                  <button className="browse-btn">Browse All Listings</button>
                </Link>
              </div>
            </Card>
          ) : (
            <div className="promos-grid">
              {listings.map((listing) => {
                const daysLeft = getDaysLeft();
                return (
                  <Card key={listing.id} className="promo-card-large">
                    <Link
                      to={`${ROUTES.LISTING_DETAIL.replace(':id', listing.id)}`}
                      className="promo-link"
                    >
                      <div className="promo-image-large">
                        {listing.images && listing.images.length > 0 ? (
                          <img src={listing.images[0]} alt={listing.title} />
                        ) : (
                          <div className="no-image">No Image</div>
                        )}
                        <div className="promo-badge-large">Limited Deal</div>
                        <WishlistButton listingId={listing.id} className="wishlist-btn" />
                      </div>
                      <div className="promo-content-large">
                        <h3>{listing.title}</h3>
                        <p className="promo-location">
                          {listing.location?.city}, {listing.location?.country}
                        </p>
                        <div className="promo-countdown-large">
                          <span className="countdown-label">Ends in:</span>
                          <span className="countdown-time">{daysLeft} days</span>
                        </div>
                        <div className="promo-price-large">
                          <span className="discount-tag-large">
                            {listing.pricing?.discount || 0}% OFF
                          </span>
                          <div className="price-group">
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
                      </div>
                    </Link>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Promos;
