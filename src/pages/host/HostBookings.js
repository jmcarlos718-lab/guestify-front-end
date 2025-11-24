/**
 * Host Bookings Page
 * 
 * View and manage bookings for host listings
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthContext } from '../../context/AuthContext';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import Loading from '../../components/common/Loading';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import { ROUTES, BOOKING_STATUS } from '../../config/constants';
import { getUserBookings, cancelBooking } from '../../services/bookingService';
import { getListing } from '../../services/listingService';
import { formatCurrency, formatDate, calculateNights } from '../../utils/helpers';
import { toast } from 'react-toastify';
import './HostBookings.css';

const HostBookings = () => {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [requestRefund, setRequestRefund] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (user?.uid) {
      loadBookings();
    }
  }, [user, filter]);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const filters = {
        status: filter === 'all' ? null : filter
      };
      const data = await getUserBookings(user.uid, 'host', filters);
      
      // Load listing details for each booking
      const bookingsWithListings = await Promise.all(
        data.map(async (booking) => {
          try {
            const listing = await getListing(booking.listingId);
            return { ...booking, listing };
          } catch (error) {
            return { ...booking, listing: null };
          }
        })
      );
      
      setBookings(bookingsWithListings);
    } catch (error) {
      toast.error('Failed to load bookings');
      console.error(error);
    } finally {
      setLoading(false);
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

  const getStatusColor = (status) => {
    switch (status) {
      case BOOKING_STATUS.CONFIRMED:
        return '#10B981';
      case BOOKING_STATUS.PENDING:
        return '#F59E0B';
      case BOOKING_STATUS.CANCELLED:
        return '#EF4444';
      case BOOKING_STATUS.COMPLETED:
        return '#6366F1';
      default:
        return '#6B7280';
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <Loading fullScreen message="Loading bookings..." />
      </DashboardLayout>
    );
  }

  const filteredBookings = filter === 'all'
    ? bookings
    : bookings.filter(booking => booking.status === filter);

  return (
    <DashboardLayout>
      <div className="host-bookings-page">
        <div className="bookings-header">
          <div>
            <h1>My Bookings</h1>
            <p>Manage bookings for your listings</p>
          </div>
          <Link to={ROUTES.HOST_LISTINGS}>
            <Button variant="outline" size="lg">
              View Listings
            </Button>
          </Link>
        </div>

        <div className="bookings-filters">
          <button
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All ({bookings.length})
          </button>
          <button
            className={`filter-btn ${filter === BOOKING_STATUS.CONFIRMED ? 'active' : ''}`}
            onClick={() => setFilter(BOOKING_STATUS.CONFIRMED)}
          >
            Confirmed ({bookings.filter(b => b.status === BOOKING_STATUS.CONFIRMED).length})
          </button>
          <button
            className={`filter-btn ${filter === BOOKING_STATUS.PENDING ? 'active' : ''}`}
            onClick={() => setFilter(BOOKING_STATUS.PENDING)}
          >
            Pending ({bookings.filter(b => b.status === BOOKING_STATUS.PENDING).length})
          </button>
          <button
            className={`filter-btn ${filter === BOOKING_STATUS.CANCELLED ? 'active' : ''}`}
            onClick={() => setFilter(BOOKING_STATUS.CANCELLED)}
          >
            Cancelled ({bookings.filter(b => b.status === BOOKING_STATUS.CANCELLED).length})
          </button>
        </div>

        {filteredBookings.length === 0 ? (
          <Card className="empty-state">
            <div className="empty-content">
              <h3>No bookings found</h3>
              <p>
                {filter === 'all'
                  ? "You don't have any bookings yet."
                  : `You don't have any ${filter} bookings.`}
              </p>
            </div>
          </Card>
        ) : (
          <div className="bookings-list">
            {filteredBookings.map((booking) => (
              <Card key={booking.id} className="booking-card">
                <div className="booking-content">
                  {booking.listing && booking.listing.images && booking.listing.images.length > 0 && (
                    <div className="booking-image">
                      <img src={booking.listing.images[0]} alt={booking.listing.title} />
                    </div>
                  )}
                  <div className="booking-details">
                    <div className="booking-header">
                      <h3>{booking.listing?.title || 'Listing'}</h3>
                      <span
                        className="booking-status"
                        style={{ backgroundColor: getStatusColor(booking.status) + '20', color: getStatusColor(booking.status) }}
                      >
                        {booking.status}
                      </span>
                    </div>
                    <p className="booking-location">
                      {booking.listing?.location?.city}, {booking.listing?.location?.country}
                    </p>
                    <div className="booking-info-grid">
                      <div>
                        <strong>Check-in:</strong> {formatDate(booking.checkIn)}
                      </div>
                      <div>
                        <strong>Check-out:</strong> {formatDate(booking.checkOut)}
                      </div>
                      <div>
                        <strong>Guests:</strong> {booking.guests}
                      </div>
                      <div>
                        <strong>Nights:</strong> {calculateNights(booking.checkIn, booking.checkOut)}
                      </div>
                      {booking.pricing && (
                        <div>
                          <strong>Total:</strong> {formatCurrency(booking.pricing.total || 0, booking.pricing.currency)}
                        </div>
                      )}
                      {booking.guestInformation && booking.guestInformation.length > 0 && (
                        <div className="guest-info-full">
                          <strong>Primary Guest:</strong>
                          <div className="guest-details-inline">
                            <span>{booking.guestInformation[0].fullName || 'N/A'}</span>
                            {booking.guestInformation[0].age && (
                              <span> • Age: {booking.guestInformation[0].age}</span>
                            )}
                            {booking.guestInformation[0].phone && (
                              <span> • Phone: {booking.guestInformation[0].phone}</span>
                            )}
                            {booking.guestInformation[0].email && (
                              <span> • Email: {booking.guestInformation[0].email}</span>
                            )}
                          </div>
                        </div>
                      )}
                      {booking.cancellationReason && (
                        <div>
                          <strong>Cancellation Reason:</strong> {booking.cancellationReason}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="booking-actions">
                  {booking.listing && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`${ROUTES.HOST_LISTINGS}/${booking.listingId}`)}
                    >
                      View Listing
                    </Button>
                  )}
                  {(booking.status === BOOKING_STATUS.CONFIRMED || booking.status === BOOKING_STATUS.PENDING) && (
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleCancelClick(booking)}
                    >
                      Cancel Booking
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}

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
                  <p><strong>Listing:</strong> {selectedBooking.listing?.title || 'N/A'}</p>
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
      </div>
    </DashboardLayout>
  );
};

export default HostBookings;

