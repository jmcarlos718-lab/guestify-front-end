/**
 * View Listing Page
 * 
 * Host view of their listing details
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuthContext } from '../../context/AuthContext';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import Loading from '../../components/common/Loading';
import { ROUTES, LISTING_STATUS, BOOKING_STATUS } from '../../config/constants';
import { getListing } from '../../services/listingService';
import { getUserBookings, cancelBooking } from '../../services/bookingService';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import { formatCurrency, formatDate } from '../../utils/helpers';
import { toast } from 'react-toastify';
import './ViewListing.css';

const ViewListing = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const [listing, setListing] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [requestRefund, setRequestRefund] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (id) {
      loadListing();
      loadBookings();
    }
  }, [id]);

  const loadListing = async () => {
    try {
      setLoading(true);
      const data = await getListing(id);
      
      // Verify this listing belongs to the current host
      if (data.hostId !== user?.uid) {
        toast.error('You do not have permission to view this listing');
        navigate(ROUTES.HOST_LISTINGS);
        return;
      }
      
      setListing(data);
    } catch (error) {
      toast.error('Failed to load listing');
      console.error(error);
      navigate(ROUTES.HOST_LISTINGS);
    } finally {
      setLoading(false);
    }
  };

  const loadBookings = async () => {
    try {
      // Get bookings for this listing
      const allBookings = await getUserBookings(user.uid, 'host');
      const listingBookings = allBookings.filter(booking => booking.listingId === id);
      setBookings(listingBookings);
    } catch (error) {
      console.error('Error loading bookings:', error);
    }
  };

  const handleCancelClick = (booking) => {
    setSelectedBooking(booking);
    setShowCancelModal(true);
    setCancelReason('');
    setRequestRefund(false);
  };

  const handleCancelBooking = async () => {
    if (!selectedBooking || !cancelReason.trim()) {
      toast.error('Please provide a cancellation reason');
      return;
    }

    setCancelling(true);
    try {
      await cancelBooking(selectedBooking.id, cancelReason.trim(), null, 'host', requestRefund);
      if (requestRefund) {
        toast.success('Booking cancelled successfully. Refund request submitted.');
      } else {
        toast.success('Booking cancelled successfully');
      }
      setShowCancelModal(false);
      setSelectedBooking(null);
      setCancelReason('');
      setRequestRefund(false);
      await loadBookings();
    } catch (error) {
      toast.error(error.message || 'Failed to cancel booking');
      console.error('Cancel error:', error);
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <Loading fullScreen message="Loading listing..." />
      </DashboardLayout>
    );
  }

  if (!listing) {
    return null;
  }

  const locationParts = [
    listing.location?.city,
    listing.location?.state,
    listing.location?.country
  ].filter(Boolean);
  const locationText = locationParts.join(', ');

  return (
    <DashboardLayout>
      <div className="view-listing-page">
        <div className="view-listing-header">
          <div>
            <h1>{listing.title}</h1>
            <p className="listing-location">{locationText || 'Location not specified'}</p>
            <div className="listing-status-badge">
              <span className={`status ${listing.status}`}>
                {listing.status}
              </span>
            </div>
          </div>
          <div className="header-actions">
            <Link to={`${ROUTES.HOST_LISTINGS}/${id}/edit`}>
              <Button variant="primary" size="md">
                Edit Listing
              </Button>
            </Link>
            <Button variant="outline" size="md" onClick={() => navigate(ROUTES.HOST_LISTINGS)}>
              Back to Listings
            </Button>
          </div>
        </div>

        {/* Images Gallery */}
        {listing.images && listing.images.length > 0 && (
          <Card className="images-section">
            <h2>Images</h2>
            <div className="listing-images">
              <div className="main-image">
                <img src={listing.images[selectedImageIndex]} alt={listing.title} />
              </div>
              {listing.images.length > 1 && (
                <div className="image-thumbnails">
                  {listing.images.map((image, index) => (
                    <button
                      key={index}
                      className={`thumbnail ${selectedImageIndex === index ? 'active' : ''}`}
                      onClick={() => setSelectedImageIndex(index)}
                    >
                      <img src={image} alt={`${listing.title} ${index + 1}`} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </Card>
        )}

        <div className="view-listing-content">
          <div className="main-content">
            {/* Description */}
            <Card title="Description" className="section-card">
              <p>{listing.description || 'No description provided'}</p>
            </Card>

            {/* Details */}
            <Card title="Details" className="section-card">
              <div className="details-grid">
                <div className="detail-item">
                  <strong>Category:</strong> {listing.category || 'Not specified'}
                </div>
                <div className="detail-item">
                  <strong>Type:</strong> {listing.type || 'Not specified'}
                </div>
                <div className="detail-item">
                  <strong>Max Guests:</strong> {listing.rules?.maxGuests || 1}
                </div>
                <div className="detail-item">
                  <strong>Base Rate:</strong> {formatCurrency(listing.pricing?.baseRate || 0, listing.pricing?.currency)}
                </div>
                <div className="detail-item">
                  <strong>Cleaning Fee:</strong> {formatCurrency(listing.pricing?.cleaningFee || 0, listing.pricing?.currency)}
                </div>
                <div className="detail-item">
                  <strong>Minimum Stay:</strong> {listing.pricing?.minimumStay || 1} nights
                </div>
              </div>
            </Card>

            {/* Location */}
            {listing.location && (
              <Card title="Location" className="section-card">
                <div className="location-details">
                  {listing.location.address && (
                    <p><strong>Address:</strong> {listing.location.address}</p>
                  )}
                  <p><strong>City:</strong> {listing.location.city || 'Not specified'}</p>
                  <p><strong>State:</strong> {listing.location.state || 'Not specified'}</p>
                  <p><strong>Country:</strong> {listing.location.country || 'Not specified'}</p>
                  {listing.location.zipCode && (
                    <p><strong>Zip Code:</strong> {listing.location.zipCode}</p>
                  )}
                </div>
              </Card>
            )}

            {/* Amenities */}
            {listing.amenities && listing.amenities.length > 0 && (
              <Card title="Amenities" className="section-card">
                <div className="amenities-grid">
                  {listing.amenities.map((amenity, index) => (
                    <div key={index} className="amenity-item">
                      <span>✓</span> {amenity}
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* House Rules */}
            {listing.rules?.houseRules && listing.rules.houseRules.length > 0 && (
              <Card title="House Rules" className="section-card">
                <ul className="house-rules-list">
                  {listing.rules.houseRules.map((rule, index) => (
                    <li key={index}>{rule}</li>
                  ))}
                </ul>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="sidebar">
            {/* Bookings */}
            <Card title="Recent Bookings" className="bookings-card">
              {bookings.length === 0 ? (
                <p>No bookings yet</p>
              ) : (
                <div className="bookings-list">
                  {bookings.slice(0, 5).map((booking) => (
                    <div key={booking.id} className="booking-item">
                      <div className="booking-info">
                        <strong>Check-in:</strong> {formatDate(booking.checkIn)}
                      </div>
                      <div className="booking-info">
                        <strong>Check-out:</strong> {formatDate(booking.checkOut)}
                      </div>
                      <div className="booking-info">
                        <strong>Guests:</strong> {booking.guests}
                      </div>
                      {booking.guestInformation && booking.guestInformation.length > 0 && (
                        <div className="booking-info guest-info-section">
                          <strong>Primary Guest:</strong>
                          <div className="guest-details">
                            <div><strong>Name:</strong> {booking.guestInformation[0].fullName || 'N/A'}</div>
                            {booking.guestInformation[0].age && (
                              <div><strong>Age:</strong> {booking.guestInformation[0].age}</div>
                            )}
                            {booking.guestInformation[0].phone && (
                              <div><strong>Phone:</strong> {booking.guestInformation[0].phone}</div>
                            )}
                            {booking.guestInformation[0].email && (
                              <div><strong>Email:</strong> {booking.guestInformation[0].email}</div>
                            )}
                          </div>
                        </div>
                      )}
                      <div className="booking-info">
                        <strong>Status:</strong> <span className={`status ${booking.status}`}>{booking.status}</span>
                      </div>
                      {booking.pricing && (
                        <div className="booking-info">
                          <strong>Total:</strong> {formatCurrency(booking.pricing.total || 0, booking.pricing.currency)}
                        </div>
                      )}
                      {(booking.status === BOOKING_STATUS.CONFIRMED || booking.status === BOOKING_STATUS.PENDING) && (
                        <div className="booking-actions">
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleCancelClick(booking)}
                          >
                            Cancel
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Quick Stats */}
            <Card title="Quick Stats" className="stats-card">
              <div className="stats-list">
                <div className="stat-item">
                  <strong>Total Bookings:</strong> {bookings.length}
                </div>
                <div className="stat-item">
                  <strong>Views:</strong> {listing.views || 0}
                </div>
                <div className="stat-item">
                  <strong>Favorites:</strong> {listing.favoritesCount || 0}
                </div>
                {listing.rating > 0 && (
                  <div className="stat-item">
                    <strong>Rating:</strong> {listing.rating.toFixed(1)} ({listing.reviewCount || 0} reviews)
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Cancel Booking Modal */}
      <Modal
        isOpen={showCancelModal}
        onClose={() => {
          setShowCancelModal(false);
          setSelectedBooking(null);
          setCancelReason('');
        }}
        title="Cancel Booking"
      >
        <div className="cancel-booking-modal">
          {selectedBooking && (
            <>
              <p>Are you sure you want to cancel this booking?</p>
              <div className="booking-summary">
                <p><strong>Check-in:</strong> {formatDate(selectedBooking.checkIn)}</p>
                <p><strong>Check-out:</strong> {formatDate(selectedBooking.checkOut)}</p>
                <p><strong>Guests:</strong> {selectedBooking.guests}</p>
                {selectedBooking.guestInformation && selectedBooking.guestInformation.length > 0 && (
                  <div className="guest-info-summary">
                    <p><strong>Primary Guest Information:</strong></p>
                    <div style={{ marginLeft: '1rem', marginTop: '0.5rem' }}>
                      <p><strong>Name:</strong> {selectedBooking.guestInformation[0].fullName || 'N/A'}</p>
                      {selectedBooking.guestInformation[0].age && (
                        <p><strong>Age:</strong> {selectedBooking.guestInformation[0].age}</p>
                      )}
                      {selectedBooking.guestInformation[0].phone && (
                        <p><strong>Phone:</strong> {selectedBooking.guestInformation[0].phone}</p>
                      )}
                      {selectedBooking.guestInformation[0].email && (
                        <p><strong>Email:</strong> {selectedBooking.guestInformation[0].email}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">Cancellation Reason *</label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Please provide a reason for cancellation..."
                  rows={4}
                  className="form-textarea"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={requestRefund}
                    onChange={(e) => setRequestRefund(e.target.checked)}
                    style={{ cursor: 'pointer' }}
                  />
                  <span>Request refund for this cancellation</span>
                </label>
                {requestRefund && (
                  <p style={{ fontSize: '0.875rem', color: '#6B7280', marginTop: '0.5rem' }}>
                    A refund request will be created based on the listing's cancellation policy (50% for strict, 70% for moderate).
                  </p>
                )}
              </div>
              <div className="modal-actions">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCancelModal(false);
                    setSelectedBooking(null);
                    setCancelReason('');
                    setRequestRefund(false);
                  }}
                  disabled={cancelling}
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  onClick={handleCancelBooking}
                  loading={cancelling}
                  disabled={!cancelReason.trim() || cancelling}
                >
                  Confirm Cancellation
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </DashboardLayout>
  );
};

export default ViewListing;


