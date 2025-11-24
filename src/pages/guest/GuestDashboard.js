/**
 * Guest Dashboard
 * 
 * Main dashboard page for guests
 */

import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Loading from '../../components/common/Loading';
import { ROUTES, BOOKING_STATUS } from '../../config/constants';
import { useAuthContext } from '../../context/AuthContext';
import { getUserWishlist, removeFromWishlist } from '../../services/wishlistService';
import { getUserBookings } from '../../services/bookingService';
import { formatCurrency } from '../../utils/helpers';
import WishlistButton from '../../components/common/WishlistButton';
import { toast } from 'react-toastify';
import './GuestDashboard.css';

const GuestDashboard = () => {
  const { user } = useAuthContext();
  const [wishlist, setWishlist] = useState([]);
  const [wishlistLoading, setWishlistLoading] = useState(true);
  const [bookings, setBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);

  const loadWishlist = async () => {
    if (!user?.uid) {
      setWishlist([]);
      setWishlistLoading(false);
      return;
    }

    try {
      setWishlistLoading(true);
      const data = await getUserWishlist(user.uid);
      setWishlist(data);
    } catch (error) {
      console.error('Failed to load wishlist:', error);
      toast.error('Unable to load your favorites right now');
    } finally {
      setWishlistLoading(false);
    }
  };

  const loadBookings = async () => {
    if (!user?.uid) {
      setBookings([]);
      setBookingsLoading(false);
      return;
    }

    try {
      setBookingsLoading(true);
      const data = await getUserBookings(user.uid, 'guest');
      setBookings(data);
    } catch (error) {
      console.error('Failed to load bookings:', error);
      toast.error('Unable to load your bookings right now');
    } finally {
      setBookingsLoading(false);
    }
  };

  useEffect(() => {
    loadWishlist();
    loadBookings();
  }, [user?.uid]);

  // Refresh wishlist periodically and when window regains focus
  useEffect(() => {
    if (!user?.uid) return;

    const handleFocus = () => {
      loadWishlist();
    };

    // Refresh when window regains focus
    window.addEventListener('focus', handleFocus);
    
    // Refresh every 30 seconds to catch any changes
    const interval = setInterval(() => {
      loadWishlist();
    }, 30000);

    return () => {
      window.removeEventListener('focus', handleFocus);
      clearInterval(interval);
    };
  }, [user?.uid]);

  const favoriteCount = wishlist.length;
  
  // Calculate booking stats
  const totalBookings = bookings.length;
  const upcomingBookings = bookings.filter(booking => {
    const checkIn = booking.checkIn?.toDate ? booking.checkIn.toDate() : new Date(booking.checkIn);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return (booking.status === BOOKING_STATUS.CONFIRMED || booking.status === BOOKING_STATUS.PENDING) &&
           checkIn >= today;
  }).length;

  const handleRemoveFromWishlist = async (listingId) => {
    try {
      await removeFromWishlist(user.uid, listingId);
      toast.success('Removed from wishlist');
      // Reload wishlist
      const data = await getUserWishlist(user.uid);
      setWishlist(data);
    } catch (error) {
      toast.error(error.message || 'Failed to remove from wishlist');
    }
  };

  return (
    <DashboardLayout>
      <div className="guest-dashboard">
        <div className="dashboard-header">
          <h1 className="dashboard-title">Welcome Back!</h1>
          <p className="dashboard-subtitle">Discover amazing experiences and places</p>
        </div>

        <div className="dashboard-actions">
          <Link to={ROUTES.BOOKING}>
            <Button variant="primary" size="lg">
              Explore Listings
            </Button>
          </Link>
        </div>

        <div className="dashboard-stats">
          <Card className="stat-card">
            <h3 className="stat-value">{bookingsLoading ? '...' : upcomingBookings}</h3>
            <p className="stat-label">Upcoming Trips</p>
          </Card>
          <Card className="stat-card">
            <h3 className="stat-value">{favoriteCount}</h3>
            <p className="stat-label">Saved Places</p>
          </Card>
          <Card className="stat-card">
            <h3 className="stat-value">{bookingsLoading ? '...' : totalBookings}</h3>
            <p className="stat-label">Total Bookings</p>
          </Card>
        </div>

        <div className="dashboard-sections">
          <Card title="Upcoming Trips" className="dashboard-section">
            {bookingsLoading ? (
              <Loading message="Loading bookings..." />
            ) : upcomingBookings === 0 ? (
              <>
                <p>No upcoming trips</p>
                <Link to={ROUTES.SEARCH}>
                  <Button variant="outline" size="md" style={{ marginTop: '1rem' }}>
                    Start Exploring
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <p>You have {upcomingBookings} upcoming {upcomingBookings === 1 ? 'trip' : 'trips'}</p>
                <Link to={ROUTES.GUEST_BOOKINGS}>
                  <Button variant="primary" size="md" style={{ marginTop: '1rem' }}>
                    View All Bookings
                  </Button>
                </Link>
              </>
            )}
          </Card>
        </div>

        {/* Wishlist Section */}
        <div className="dashboard-wishlist-section">
          <div className="wishlist-section-header">
            <div>
              <h2>My Wishlist</h2>
              <p className="wishlist-subtitle">
                {favoriteCount === 0 
                  ? "Save listings you love to keep them handy for later"
                  : `${favoriteCount} ${favoriteCount === 1 ? 'saved stay' : 'saved stays'}`
                }
              </p>
            </div>
            {favoriteCount > 0 && (
              <Link to={ROUTES.GUEST_WISHLIST}>
                <Button variant="outline" size="md">
                  View All
                </Button>
              </Link>
            )}
          </div>

          {wishlistLoading ? (
            <Loading message="Loading wishlist..." />
          ) : wishlist.length === 0 ? (
            <Card className="wishlist-empty-card">
              <div className="wishlist-empty">
                <div className="empty-icon">❤️</div>
                <h3>Your wishlist is empty</h3>
                <p>Save listings you love to keep them handy for later.</p>
                <Link to={ROUTES.BOOKING}>
                  <Button variant="primary" size="md">
                    Explore Listings
                  </Button>
                </Link>
              </div>
            </Card>
          ) : (
            <div className="wishlist-grid">
              {wishlist.map((item) => {
                const listing = item.listing;
                if (!listing) return null;

                const location = [
                  listing.location?.city,
                  listing.location?.country
                ]
                  .filter(Boolean)
                  .join(', ');

                return (
                  <Card key={item.id} className="wishlist-item-card">
                    <Link
                      to={ROUTES.LISTING_DETAIL.replace(':id', listing.id)}
                      className="wishlist-item-link"
                    >
                      <div className="wishlist-item-image">
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
                        <div 
                          className="wishlist-heart-wrapper"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                        >
                          <WishlistButton 
                            listingId={listing.id} 
                            className="wishlist-heart-btn"
                          />
                        </div>
                      </div>
                      <div className="wishlist-item-info">
                        <div className="wishlist-item-header">
                          <h3 className="wishlist-item-title">{listing.title}</h3>
                          {listing.rating > 0 && (
                            <div className="wishlist-item-rating">
                              <span className="rating-stars">★</span>
                              <span>{listing.rating.toFixed(1)}</span>
                            </div>
                          )}
                        </div>
                        <p className="wishlist-item-location">{location || 'Location pending'}</p>
                        <p className="wishlist-item-category">{listing.category || 'Listing'}</p>
                        <div className="wishlist-item-price">
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
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default GuestDashboard;





