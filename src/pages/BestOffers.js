/**
 * Best Offers Page
 * 
 * Display all listings with special offers and discounts
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import Card from '../components/common/Card';
import WishlistButton from '../components/common/WishlistButton';
import Loading from '../components/common/Loading';
import { ROUTES, LISTING_STATUS } from '../config/constants';
import { subscribeToPublishedListings, searchListings } from '../services/listingService';
import { formatCurrency } from '../utils/helpers';
import { toast } from 'react-toastify';
import './BestOffers.css';

const BestOffers = () => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    let unsubscribe = null;
    let initialTimeout = null;

    // Fallback function to use regular search if real-time fails
    const loadOffersFallback = async () => {
      try {
        const allListings = await searchListings({});
        // Sort by discount (highest first) so offers appear at the top
        const sortedListings = allListings.sort((a, b) => {
          const discountA = a.pricing?.discount || 0;
          const discountB = b.pricing?.discount || 0;
          return discountB - discountA; // Highest discount first
        });
        setListings(sortedListings);
        setLoading(false);
      } catch (error) {
        console.error('Fallback search also failed:', error);
        toast.error('Failed to load listings. Please refresh the page.');
        setListings([]);
        setLoading(false);
      }
    };

    // Process listings (sort by discount)
    const processListings = (allListings) => {
      // Sort by discount (highest first) so offers appear at the top
      const sortedListings = allListings.sort((a, b) => {
        const discountA = a.pricing?.discount || 0;
        const discountB = b.pricing?.discount || 0;
        return discountB - discountA; // Highest discount first
      });
      setListings(sortedListings);
      setLoading(false);
    };

    // Set a timeout to use fallback if no response in 5 seconds
    initialTimeout = setTimeout(() => {
      console.warn('Real-time listener taking too long, using fallback');
      if (unsubscribe) unsubscribe();
      loadOffersFallback();
    }, 5000);

    // Subscribe to real-time updates for all published listings
    unsubscribe = subscribeToPublishedListings({}, (listings, error) => {
      // Clear initial timeout if subscription responds
      if (initialTimeout) {
        clearTimeout(initialTimeout);
        initialTimeout = null;
      }

      if (error) {
        console.error('Error loading listings:', error);
        // Show user-friendly error message
        if (error.code === 'failed-precondition' || error.message?.includes('index')) {
          toast.error('Please wait while we set up the database. If this persists, contact support.');
        } else {
          toast.error('Failed to load listings. Trying fallback method...');
        }
        // Try fallback after a short delay
        setTimeout(() => {
          loadOffersFallback();
        }, 1000);
        return;
      }

      // Success - process the listings
      processListings(listings);
    });

    // Cleanup subscription on unmount
    return () => {
      if (unsubscribe) unsubscribe();
      if (initialTimeout) clearTimeout(initialTimeout);
    };
  }, []);

  return (
    <div className="best-offers-page">
      <Header />
      <main className="best-offers-main">
        <div className="best-offers-container">
          <div className="offers-header">
            <h1>All Listings & Offers</h1>
            <p>Browse all available listings and discover amazing deals</p>
          </div>

          {loading ? (
            <Loading message="Loading offers..." />
          ) : listings.length === 0 ? (
            <Card className="empty-offers">
              <div className="empty-content">
                <h3>No listings available</h3>
                <p>Check back later for new listings!</p>
                <Link to={ROUTES.BOOKING}>
                  <button className="browse-btn">Browse All Listings</button>
                </Link>
              </div>
            </Card>
          ) : (
            <>
              <div className="offers-grid">
                {listings.map((listing) => (
                  <Card key={listing.id} className="offer-card">
                    <Link
                      to={`${ROUTES.LISTING_DETAIL.replace(':id', listing.id)}`}
                      className="offer-link"
                    >
                      <div className="offer-image">
                        {listing.images && listing.images.length > 0 ? (
                          <img src={listing.images[0]} alt={listing.title} />
                        ) : (
                          <div className="no-image">No Image</div>
                        )}
                        {listing.pricing?.discount > 0 && (
                          <div className="discount-badge-large">
                            {listing.pricing.discount}% OFF
                          </div>
                        )}
                        <WishlistButton listingId={listing.id} className="wishlist-btn" />
                      </div>
                      <div className="offer-info">
                        <h3>{listing.title}</h3>
                        <p className="offer-location">
                          {listing.location?.city}, {listing.location?.country}
                        </p>
                        {listing.rating > 0 && (
                          <div className="offer-rating">
                            <span className="rating-stars">★</span>
                            <span>{listing.rating.toFixed(1)}</span>
                            <span className="rating-count">({listing.reviewCount || 0})</span>
                          </div>
                        )}
                        <div className="offer-price">
                          {listing.pricing?.discount > 0 ? (
                            <>
                              <span className="original-price">
                                {formatCurrency(listing.pricing.baseRate, listing.pricing.currency)}
                              </span>
                              <span className="current-price">
                                {formatCurrency(
                                  listing.pricing.baseRate * (1 - listing.pricing.discount / 100),
                                  listing.pricing.currency
                                )}
                              </span>
                            </>
                          ) : (
                            <span className="current-price">
                              {formatCurrency(listing.pricing?.baseRate || 0, listing.pricing?.currency || 'PHP')}
                            </span>
                          )}
                          <span className="price-period">/night</span>
                        </div>
                      </div>
                    </Link>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default BestOffers;
