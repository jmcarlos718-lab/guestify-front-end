/**
 * Guest Wishlist Page
 * 
 * View and manage wishlist items
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthContext } from '../../context/AuthContext';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Loading from '../../components/common/Loading';
import { ROUTES } from '../../config/constants';
import { getUserWishlist, removeFromWishlist } from '../../services/wishlistService';
import { formatCurrency } from '../../utils/helpers';
import { toast } from 'react-toastify';
import './Wishlist.css';

const Wishlist = () => {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.uid) {
      loadWishlist();
    }
  }, [user]);

  const loadWishlist = async () => {
    try {
      setLoading(true);
      const data = await getUserWishlist(user.uid);
      setWishlist(data);
    } catch (error) {
      toast.error('Failed to load wishlist');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (listingId) => {
    try {
      await removeFromWishlist(user.uid, listingId);
      toast.success('Removed from wishlist');
      await loadWishlist();
    } catch (error) {
      toast.error(error.message || 'Failed to remove from wishlist');
    }
  };

  const wishlistStats = useMemo(() => {
    const destinations = new Set();
    const categories = new Set();

    wishlist.forEach((item) => {
      const listing = item.listing;
      if (!listing) return;
      if (listing.location?.city) {
        destinations.add(`${listing.location.city}, ${listing.location?.country || ''}`.trim());
      }
      if (listing.category) {
        categories.add(listing.category);
      }
    });

    const rawDate = wishlist[0]?.createdAt;
    let lastUpdated = null;
    if (rawDate) {
      if (typeof rawDate.toDate === 'function') {
        lastUpdated = rawDate.toDate();
      } else if (rawDate.seconds) {
        lastUpdated = new Date(rawDate.seconds * 1000);
      } else {
        lastUpdated = new Date(rawDate);
      }
    }

    return {
      count: wishlist.length,
      destinationCount: destinations.size,
      categories: Array.from(categories),
      lastUpdated
    };
  }, [wishlist]);

  const formatDate = (date) => {
    if (!date) return 'Recently updated';
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="wishlist-page">
          <Loading message="Loading wishlist..." />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="wishlist-page">
        <section className="wishlist-hero">
          <div className="wishlist-hero-content">
            <p className="wishlist-eyebrow">Favorites</p>
            <h1>My Wishlist</h1>
            <p className="wishlist-subtitle">
              Keep track of the stays you love. Book them when you’re ready or share them with friends.
            </p>
            <div className="wishlist-hero-tags">
              <span className="wishlist-tag">
                {wishlistStats.count} {wishlistStats.count === 1 ? 'stay saved' : 'stays saved'}
              </span>
              <span className="wishlist-tag">{wishlistStats.destinationCount} destinations</span>
              <span className="wishlist-tag">Updated {formatDate(wishlistStats.lastUpdated)}</span>
            </div>
          </div>

          <div className="wishlist-hero-stats">
            <div className="wishlist-stat-card">
              <span className="stat-label">Saved stays</span>
              <span className="stat-value">{wishlistStats.count}</span>
            </div>
            <div className="wishlist-stat-card">
              <span className="stat-label">Destinations</span>
              <span className="stat-value">{wishlistStats.destinationCount}</span>
            </div>
          </div>
        </section>

        {wishlistStats.categories.length > 0 && (
          <div className="wishlist-category-pills">
            {wishlistStats.categories.map((category) => (
              <span key={category} className="category-pill">
                {category}
              </span>
            ))}
          </div>
        )}

        {wishlist.length === 0 ? (
          <div className="wishlist-empty-state">
            <div className="empty-illustration">❤️</div>
            <h3>Your wishlist is empty</h3>
            <p>Save listings you love to keep them handy for later.</p>
            <Button variant="primary" onClick={() => navigate(ROUTES.BOOKING)}>
              Explore Listings
            </Button>
          </div>
        ) : (
          <div className="wishlist-grid">
            {wishlist.map((item) => {
              const listing = item.listing;
              if (!listing) return null;

              return (
                <Card key={item.id} className="wishlist-card">
                  <div className="wishlist-card-image">
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
                    <button
                      className="wishlist-card-heart"
                      onClick={() => handleRemove(listing.id)}
                      aria-label="Remove from wishlist"
                    >
                      ♥
                    </button>
                  </div>

                  <div className="wishlist-card-body">
                    <div className="wishlist-card-top">
                      <div>
                        <p className="wishlist-card-category">{listing.category || 'Featured stay'}</p>
                        <h3>{listing.title}</h3>
                        <p className="wishlist-location">
                          {listing.location?.city}, {listing.location?.country}
                        </p>
                      </div>
                      {listing.rating > 0 && (
                        <div className="wishlist-rating">
                          <span className="rating-stars">★</span>
                          <span>{listing.rating.toFixed(1)}</span>
                          <span className="rating-count">({listing.reviewCount || 0})</span>
                        </div>
                      )}
                    </div>

                    <div className="wishlist-card-footer">
                      <div className="wishlist-price">
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
                      <div className="wishlist-card-actions">
                        <Button
                          variant="outline"
                          onClick={() => navigate(`${ROUTES.LISTING_DETAIL.replace(':id', listing.id)}`)}
                        >
                          View details
                        </Button>
                        <Link
                          to={`${ROUTES.LISTING_DETAIL.replace(':id', listing.id)}`}
                          className="wishlist-primary-link"
                        >
                          Book now →
                        </Link>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Wishlist;



