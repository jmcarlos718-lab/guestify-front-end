/**
 * Host Dashboard
 * 
 * Main dashboard page for hosts
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Loading from '../../components/common/Loading';
import { ROUTES, BOOKING_STATUS } from '../../config/constants';
import { useAuthContext } from '../../context/AuthContext';
import { getListings } from '../../services/listingService';
import { getUserBookings } from '../../services/bookingService';
import { getHostRefundRequests, approveRefund, rejectRefund, getHostInitiatedRefundRequests } from '../../services/refundService';
import * as firestoreService from '../../services/firestoreService';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import { formatCurrency, formatDate } from '../../utils/helpers';
import { toast } from 'react-toastify';
import './HostDashboard.css';

const HostDashboard = () => {
  const { user } = useAuthContext();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    activeListings: 0,
    upcomingBookings: 0,
    totalEarnings: 0
  });
  const [todayBookings, setTodayBookings] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [refundRequests, setRefundRequests] = useState([]); // Guest-initiated refund requests
  const [hostRefundRequests, setHostRefundRequests] = useState([]); // Host-initiated refund requests
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [selectedRefund, setSelectedRefund] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processingRefund, setProcessingRefund] = useState(false);

  useEffect(() => {
    if (user?.uid) {
      loadDashboardData();
    }
  }, [user?.uid]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load all data in parallel
      const [listings, bookings, payments] = await Promise.all([
        loadListings(),
        loadBookings(),
        loadPayments()
      ]);

      // Load refund requests (both guest and host initiated)
      await Promise.all([
        loadRefundRequests(),
        loadHostRefundRequests()
      ]);

      // Calculate stats
      const activeListings = listings.filter(l => l.status === 'published').length;
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const upcomingBookings = bookings.filter(booking => {
        const checkIn = booking.checkIn?.toDate ? booking.checkIn.toDate() : new Date(booking.checkIn);
        checkIn.setHours(0, 0, 0, 0);
        return (booking.status === BOOKING_STATUS.CONFIRMED || booking.status === BOOKING_STATUS.PENDING) &&
               checkIn >= today;
      }).length;

      // Calculate total earnings from payments
      const totalEarnings = payments.reduce((sum, payment) => {
        return sum + (payment.hostIncome || 0);
      }, 0);

      // Get today's bookings
      const todayBookingsList = bookings.filter(booking => {
        try {
          const checkIn = booking.checkIn?.toDate ? booking.checkIn.toDate() : new Date(booking.checkIn);
          checkIn.setHours(0, 0, 0, 0);
          const todayDate = new Date();
          todayDate.setHours(0, 0, 0, 0);
          return checkIn.getTime() === todayDate.getTime() &&
                 (booking.status === BOOKING_STATUS.CONFIRMED || booking.status === BOOKING_STATUS.PENDING);
        } catch (error) {
          console.error('Error processing booking date:', error);
          return false;
        }
      });

      // Get recent activity (recent bookings and payments)
      // Load listing details for bookings
      const bookingsWithListings = await Promise.all(
        bookings.slice(0, 5).map(async (booking) => {
          try {
            const { getListing } = await import('../../services/listingService');
            const listing = await getListing(booking.listingId);
            return {
              ...booking,
              listingTitle: listing?.title || 'Listing'
            };
          } catch (error) {
            return {
              ...booking,
              listingTitle: 'Listing'
            };
          }
        })
      );

      const recentBookings = bookingsWithListings.map(booking => ({
        type: 'booking',
        id: booking.id,
        title: `New booking: ${booking.listingTitle}`,
        date: booking.createdAt?.toDate ? booking.createdAt.toDate() : new Date(booking.createdAt),
        status: booking.status
      }));

      const recentPayments = payments
        .slice(0, 5)
        .map(payment => ({
          type: 'payment',
          id: payment.id,
          title: `Payment received: ${formatCurrency(payment.hostIncome || 0, payment.currency)}`,
          date: payment.createdAt?.toDate ? payment.createdAt.toDate() : new Date(payment.createdAt),
          amount: payment.hostIncome
        }));

      const activity = [...recentBookings, ...recentPayments]
        .sort((a, b) => b.date - a.date)
        .slice(0, 5);

      setStats({
        activeListings,
        upcomingBookings,
        totalEarnings
      });
      setTodayBookings(todayBookingsList);
      setRecentActivity(activity);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const loadListings = async () => {
    try {
      const listings = await getListings({ hostId: user.uid });
      return listings || [];
    } catch (error) {
      console.error('Error loading listings:', error);
      return [];
    }
  };

  const loadBookings = async () => {
    try {
      const bookings = await getUserBookings(user.uid, 'host');
      return bookings || [];
    } catch (error) {
      console.error('Error loading bookings:', error);
      return [];
    }
  };

  const loadPayments = async () => {
    try {
      // Get all payments for this host
      const payments = await firestoreService.getDocuments(
        'payments',
        [{ field: 'hostId', operator: '==', value: user.uid }],
        null, // No orderBy to avoid index requirement
        'asc'
      );

      // Sort client-side by createdAt (most recent first)
      payments.sort((a, b) => {
        const aDate = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
        const bDate = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
        return bDate - aDate; // Descending order
      });

      return payments || [];
    } catch (error) {
      console.error('Error loading payments:', error);
      return [];
    }
  };

  const loadRefundRequests = async () => {
    try {
      const requests = await getHostRefundRequests(user.uid);
      setRefundRequests(requests);
    } catch (error) {
      console.error('Error loading refund requests:', error);
    }
  };

  const loadHostRefundRequests = async () => {
    try {
      const requests = await getHostInitiatedRefundRequests(user.uid);
      setHostRefundRequests(requests);
    } catch (error) {
      console.error('Error loading host refund requests:', error);
    }
  };

  const handleApproveRefund = async (refundRequest) => {
    if (!window.confirm(`Approve refund of ${formatCurrency(refundRequest.refundAmount, refundRequest.payment?.currency || 'PHP')}? This will deduct from your earnings.`)) {
      return;
    }

    setProcessingRefund(true);
    try {
      await approveRefund(refundRequest.id);
      toast.success('Refund approved successfully');
      await loadRefundRequests();
      await loadDashboardData(); // Reload dashboard to update earnings
    } catch (error) {
      toast.error(error.message || 'Failed to approve refund');
      console.error('Approve refund error:', error);
    } finally {
      setProcessingRefund(false);
    }
  };

  const handleRejectRefund = () => {
    if (!selectedRefund || !rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    setProcessingRefund(true);
    rejectRefund(selectedRefund.id, rejectionReason.trim())
      .then(() => {
        toast.success('Refund request rejected');
        setShowRefundModal(false);
        setSelectedRefund(null);
        setRejectionReason('');
        loadRefundRequests();
      })
      .catch((error) => {
        toast.error(error.message || 'Failed to reject refund');
        console.error('Reject refund error:', error);
      })
      .finally(() => {
        setProcessingRefund(false);
      });
  };

  if (loading) {
    return (
      <DashboardLayout>
        <Loading fullScreen message="Loading dashboard..." />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="host-dashboard">
        <div className="dashboard-header">
          <h1 className="dashboard-title">Host Dashboard</h1>
          <p className="dashboard-subtitle">Manage your listings and bookings</p>
        </div>

        <div className="dashboard-stats">
          <Card className="stat-card">
            <h3 className="stat-value">{stats.activeListings}</h3>
            <p className="stat-label">Active Listings</p>
          </Card>
          <Card className="stat-card">
            <h3 className="stat-value">{stats.upcomingBookings}</h3>
            <p className="stat-label">Upcoming Bookings</p>
          </Card>
          <Card className="stat-card">
            <h3 className="stat-value">{formatCurrency(stats.totalEarnings, 'PHP')}</h3>
            <p className="stat-label">Total Earnings</p>
          </Card>
        </div>

        <div className="dashboard-sections">
          <Card title="Today's Bookings" className="dashboard-section">
            {todayBookings.length === 0 ? (
              <p>No bookings today</p>
            ) : (
              <div className="bookings-list">
                {todayBookings.map((booking) => (
                  <div key={booking.id} className="booking-item">
                    <div className="booking-info">
                      <strong>Booking #{booking.id.substring(0, 8)}</strong>
                      <span className="booking-status">{booking.status}</span>
                    </div>
                    <div className="booking-details">
                      <span>Check-in: {formatDate(booking.checkIn)}</span>
                      <span>Guests: {booking.guests}</span>
                      {booking.pricing && (
                        <span>Total: {formatCurrency(booking.pricing.total || 0, booking.pricing.currency)}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <Link to={ROUTES.HOST_BOOKINGS}>
              <Button variant="outline" size="md" style={{ marginTop: '1rem' }}>
                View All Bookings
              </Button>
            </Link>
          </Card>

          <Card title="Recent Activity" className="dashboard-section">
            {recentActivity.length === 0 ? (
              <p>No recent activity</p>
            ) : (
              <div className="activity-list">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="activity-item">
                    <div className="activity-icon">
                      {activity.type === 'booking' ? '📅' : '💰'}
                    </div>
                    <div className="activity-content">
                      <p className="activity-title">{activity.title}</p>
                      <p className="activity-date">{formatDate(activity.date)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Guest Refund Requests Section */}
        <Card title="Guest Refund Requests" className="dashboard-section">
          {refundRequests.length === 0 ? (
            <p>No pending refund requests from guests</p>
          ) : (
            <div className="refund-requests-list">
              {refundRequests.map((request) => (
                <div key={request.id} className="refund-request-item">
                  <div className="refund-request-info">
                    <strong>{request.listing?.title || 'Listing'}</strong>
                    <div className="refund-request-details">
                      <span>Booking ID: {request.id.substring(0, 8)}</span>
                      <span>Refund Amount: {formatCurrency(request.refundAmount || 0, request.payment?.currency || 'PHP')}</span>
                      <span>Policy: {request.cancellationPolicy || 'moderate'}</span>
                    </div>
                    {request.refundReason && (
                      <p className="refund-request-reason">
                        <strong>Guest Reason:</strong> {request.refundReason}
                      </p>
                    )}
                  </div>
                  <div className="refund-request-actions">
                    <Button
                      variant="success"
                      size="sm"
                      onClick={() => handleApproveRefund(request)}
                      loading={processingRefund}
                      disabled={processingRefund}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => {
                        setSelectedRefund(request);
                        setShowRefundModal(true);
                      }}
                      disabled={processingRefund}
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Host Refund Requests Section */}
        <Card title="My Refund Requests" className="dashboard-section">
          {hostRefundRequests.length === 0 ? (
            <p>No refund requests sent</p>
          ) : (
            <div className="refund-requests-list">
              {hostRefundRequests.map((request) => (
                <div key={request.id} className="refund-request-item">
                  <div className="refund-request-info">
                    <strong>{request.listing?.title || 'Listing'}</strong>
                    <div className="refund-request-details">
                      <span>Booking ID: {request.id.substring(0, 8)}</span>
                      <span>Refund Amount: {formatCurrency(request.refundAmount || 0, request.payment?.currency || 'PHP')}</span>
                      <span>Status: <span className={`refund-status-${request.refundStatus || 'pending'}`}>{request.refundStatus || 'pending'}</span></span>
                      <span>Policy: {request.cancellationPolicy || 'moderate'}</span>
                    </div>
                    {request.refundReason && (
                      <p className="refund-request-reason">
                        <strong>Reason:</strong> {request.refundReason}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Reject Refund Modal */}
      <Modal
        isOpen={showRefundModal}
        onClose={() => {
          setShowRefundModal(false);
          setSelectedRefund(null);
          setRejectionReason('');
        }}
        title="Reject Refund Request"
      >
        <div className="reject-refund-modal">
          {selectedRefund && (
            <>
              <p>Are you sure you want to reject this refund request?</p>
              <div className="refund-summary">
                <p><strong>Listing:</strong> {selectedRefund.listing?.title || 'N/A'}</p>
                <p><strong>Refund Amount:</strong> {formatCurrency(selectedRefund.refundAmount || 0, selectedRefund.payment?.currency || 'PHP')}</p>
                <p><strong>Guest Reason:</strong> {selectedRefund.refundReason || 'N/A'}</p>
              </div>
              <div className="form-group">
                <label className="form-label">Rejection Reason *</label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Please provide a reason for rejecting this refund request..."
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
                    setSelectedRefund(null);
                    setRejectionReason('');
                  }}
                  disabled={processingRefund}
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  onClick={handleRejectRefund}
                  loading={processingRefund}
                  disabled={!rejectionReason.trim() || processingRefund}
                >
                  Confirm Rejection
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </DashboardLayout>
  );
};

export default HostDashboard;
