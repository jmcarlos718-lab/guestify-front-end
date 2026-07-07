/**
 * Guest Bookings Page
 * 
 * View and manage guest bookings
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuthContext } from '../../context/AuthContext';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import Loading from '../../components/common/Loading';
import { ROUTES, BOOKING_STATUS } from '../../config/constants';
import { getUserBookings, cancelBooking, getBooking } from '../../services/bookingService';
import { getListing } from '../../services/listingService';
import { requestRefund } from '../../services/refundService';
import { getPaymentByBookingId } from '../../services/paymentService';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import BookingDetailsPanel from '../../components/booking/BookingDetailsPanel';
import { getBookingListingImage, getBookingListingLocation, getBookingListingTitle } from '../../utils/bookingHelpers';
import { formatCurrency, formatDate } from '../../utils/helpers';
import { toast } from 'react-toastify';
import './Bookings.css';

const Bookings = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthContext();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [requestingRefund, setRequestingRefund] = useState(false);

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
      const data = await getUserBookings(user.uid, 'guest', filters);
      
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

  const handleCancelClick = async (booking) => {
    // Get listing to check cancellation policy
    try {
      const listing = await getListing(booking.listingId);
      setSelectedBooking({ ...booking, listing });
      setShowCancelModal(true);
      setCancelReason('');
    } catch (error) {
      toast.error('Failed to load listing details');
      console.error(error);
    }
  };

  const handleCancelBooking = async () => {
    if (!selectedBooking || !cancelReason.trim()) {
      toast.error('Please provide a cancellation reason');
      return;
    }

    setCancelling(true);
    try {
      const cancellationPolicy = selectedBooking.listing?.availability?.cancellationPolicy || 'moderate';
      await cancelBooking(selectedBooking.id, cancelReason.trim(), cancellationPolicy, 'guest');
      
      // Show appropriate message based on cancellation policy
      if (cancellationPolicy === 'flexible') {
        toast.success('Booking cancelled successfully. An 85% refund has been automatically processed.');
      } else {
        toast.success('Booking cancelled successfully. You can request a refund below.');
      }
      
      setShowCancelModal(false);
      setSelectedBooking(null);
      setCancelReason('');
      await loadBookings();
    } catch (error) {
      toast.error(error.message || 'Failed to cancel booking');
      console.error('Cancel error:', error);
    } finally {
      setCancelling(false);
    }
  };

  const handleRequestRefundClick = (booking) => {
    setSelectedBooking(booking);
    setShowRefundModal(true);
    setRefundReason('');
  };

  const handleRequestRefund = async () => {
    if (!selectedBooking || !refundReason.trim()) {
      toast.error('Please provide a refund reason');
      return;
    }

    setRequestingRefund(true);
    try {
      await requestRefund(selectedBooking.id, refundReason.trim());
      toast.success('Refund request submitted successfully. The host will review your request.');
      setShowRefundModal(false);
      setSelectedBooking(null);
      setRefundReason('');
      await loadBookings();
    } catch (error) {
      toast.error(error.message || 'Failed to request refund');
      console.error('Refund request error:', error);
    } finally {
      setRequestingRefund(false);
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

  const getRefundStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return '#10B981';
      case 'rejected':
        return '#EF4444';
      case 'pending':
        return '#F59E0B';
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
      <div className="bookings-page">
        <div className="bookings-header">
          <div>
            <h1>My Bookings</h1>
            <p>Manage your reservations and trips</p>
          </div>
          <Link to={ROUTES.SEARCH}>
            <Button variant="primary" size="lg">
              + New Booking
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
            className={`filter-btn ${filter === BOOKING_STATUS.UPCOMING ? 'active' : ''}`}
            onClick={() => setFilter(BOOKING_STATUS.UPCOMING)}
          >
            Upcoming ({bookings.filter(b => b.status === BOOKING_STATUS.CONFIRMED || b.status === BOOKING_STATUS.PENDING).length})
          </button>
          <button
            className={`filter-btn ${filter === BOOKING_STATUS.COMPLETED ? 'active' : ''}`}
            onClick={() => setFilter(BOOKING_STATUS.COMPLETED)}
          >
            Completed ({bookings.filter(b => b.status === BOOKING_STATUS.COMPLETED).length})
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
                  ? "You haven't made any bookings yet. Start exploring!"
                  : `You don't have any ${filter} bookings.`}
              </p>
              <Link to={ROUTES.SEARCH}>
                <Button variant="primary" size="lg">
                  Explore Listings
                </Button>
              </Link>
            </div>
          </Card>
        ) : (
          <div className="bookings-list">
            {filteredBookings.map((booking) => (
              <Card key={booking.id} className="booking-card">
                <div className="booking-content">
                  {getBookingListingImage(booking) && (
                    <div className="booking-image">
                      <img src={getBookingListingImage(booking)} alt={getBookingListingTitle(booking)} />
                    </div>
                  )}
                  <div className="booking-details">
                    <div className="booking-header">
                      <h3>{getBookingListingTitle(booking)}</h3>
                      <span
                        className="booking-status"
                        style={{ backgroundColor: getStatusColor(booking.status) + '20', color: getStatusColor(booking.status) }}
                      >
                        {booking.status}
                      </span>
                    </div>
                    <p className="booking-location">{getBookingListingLocation(booking)}</p>
                    <BookingDetailsPanel booking={booking} />
                    {booking.status === BOOKING_STATUS.CANCELLED && booking.refundRequested && (
                      <div className="refund-status">
                        <strong>Refund Status:</strong>{' '}
                        <span
                          style={{
                            color: getRefundStatusColor(booking.refundStatus),
                            fontWeight: '600'
                          }}
                        >
                          {booking.refundStatus || 'pending'}
                        </span>
                        {booking.refundAmount && (
                          <span className="refund-amount">
                            {' '}({formatCurrency(booking.refundAmount, booking.pricing?.currency || 'PHP')})
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="booking-actions">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`${ROUTES.LISTING_DETAIL.replace(':id', booking.listingId)}`)}
                  >
                    View Listing
                  </Button>
                  {(booking.status === BOOKING_STATUS.CONFIRMED || booking.status === BOOKING_STATUS.PENDING) && (
                    <>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleCancelClick(booking)}
                      >
                        Cancel Booking
                      </Button>
                      {booking.status === BOOKING_STATUS.CONFIRMED && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => navigate(`${ROUTES.GUEST_MESSAGES}?booking=${booking.id}`)}
                        >
                          Message Host
                        </Button>
                      )}
                    </>
                  )}
                  {booking.status === BOOKING_STATUS.CANCELLED && !booking.refundRequested && (() => {
                    const cancellationPolicy = booking.listing?.availability?.cancellationPolicy || 'moderate';
                    // Only show refund request button for strict and moderate policies
                    // Flexible policy automatically processes refunds
                    if (cancellationPolicy === 'flexible') {
                      return null;
                    }
                    const refundPercentage = cancellationPolicy === 'strict' ? '50%' : '70%';
                    return (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleRequestRefundClick(booking)}
                      >
                        Request Refund ({refundPercentage})
                      </Button>
                    );
                  })()}
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
                  <p><strong>Total:</strong> {formatCurrency(selectedBooking.pricing?.total || 0, selectedBooking.pricing?.currency)}</p>
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
                <div className="refund-info">
                  <p><strong>Note:</strong> After cancellation, you can request a refund of 80% of your payment.</p>
                </div>
                <div className="modal-actions">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowCancelModal(false);
                      setSelectedBooking(null);
                      setCancelReason('');
                    }}
                    disabled={cancelling}
                  >
                    Keep Booking
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

        {/* Request Refund Modal */}
        <Modal
          isOpen={showRefundModal}
          onClose={() => {
            setShowRefundModal(false);
            setSelectedBooking(null);
            setRefundReason('');
          }}
          title="Request Refund"
        >
          <div className="refund-request-modal">
            {selectedBooking && (
              <>
                <p>You are requesting a refund for this cancelled booking.</p>
                <div className="booking-summary">
                  <p><strong>Listing:</strong> {selectedBooking.listing?.title || 'N/A'}</p>
                  <p><strong>Original Amount:</strong> {formatCurrency(selectedBooking.pricing?.total || 0, selectedBooking.pricing?.currency)}</p>
                  <p><strong>Refund Amount (80%):</strong> {formatCurrency((selectedBooking.pricing?.total || 0) * 0.8, selectedBooking.pricing?.currency)}</p>
                </div>
                <div className="refund-terms">
                  <h4>Refund Terms & Conditions:</h4>
                  <ul>
                    <li>Refund amount is 80% of the original payment</li>
                    <li>20% is retained as a cancellation fee</li>
                    <li>When a guest requests a refund, a platform service fee of less than 5% of the booking total may be retained</li>
                    <li>Refund request will be reviewed by the host</li>
                    <li>Host can approve or reject the refund request</li>
                    <li>If approved, refund will be processed within 5-7 business days</li>
                  </ul>
                </div>
                <div className="form-group">
                  <label className="form-label">Refund Reason *</label>
                  <textarea
                    value={refundReason}
                    onChange={(e) => setRefundReason(e.target.value)}
                    placeholder="Please provide a reason for requesting a refund..."
                    rows={4}
                    className="form-textarea"
                    required
                  />
                </div>
                <div className="modal-actions">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowRefundModal(false);
                      setSelectedBooking(null);
                      setRefundReason('');
                    }}
                    disabled={requestingRefund}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleRequestRefund}
                    loading={requestingRefund}
                    disabled={!refundReason.trim() || requestingRefund}
                  >
                    Submit Refund Request
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

export default Bookings;

