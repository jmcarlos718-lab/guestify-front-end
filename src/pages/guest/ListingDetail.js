/**
 * Listing Detail Page
 * 
 * Detailed view of a listing with images, amenities, reviews, and booking
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import Loading from '../../components/common/Loading';
import WishlistButton from '../../components/common/WishlistButton';
import PayPalModal from '../../components/payment/PayPalModal';
import GuestInformationForm from '../../components/booking/GuestInformationForm';
import { ROUTES, BOOKING_STATUS, PAYMENT_STATUS } from '../../config/constants';
import { getListing } from '../../services/listingService';
import { getListingReviews, calculateAverageRating } from '../../services/reviewService';
import { getListingBookings, checkDateAvailability, subscribeToListingBookings } from '../../services/bookingService';
import { createBooking, updateBooking } from '../../services/bookingService';
import { createPaymentDocument } from '../../models/paymentModel';
import { buildCompleteBookingData } from '../../utils/bookingHelpers';
import { calculateListingPrice } from '../../models/listingModel';
import * as firestoreService from '../../services/firestoreService';
import { useAuthContext } from '../../context/AuthContext';
import { formatCurrency, formatDate, calculateNights, toLocalDateString } from '../../utils/helpers';
import { toast } from 'react-toastify';
import './ListingDetail.css';

const ListingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, userProfile } = useAuthContext();
  const [listing, setListing] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [bookedDates, setBookedDates] = useState([]);
  const [dateError, setDateError] = useState('');
  const [bookingDates, setBookingDates] = useState({
    checkIn: '',
    checkOut: '',
    guests: 1
  });
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarMode, setCalendarMode] = useState('checkIn'); // 'checkIn' or 'checkOut'
  const [showGuestInfoForm, setShowGuestInfoForm] = useState(false);
  const [showPayPalModal, setShowPayPalModal] = useState(false);
  const [pricing, setPricing] = useState(null);
  const [guestInformation, setGuestInformation] = useState([]);

  // Restore dates after returning from sign-up / login
  useEffect(() => {
    const saved = location.state?.bookingDates;
    if (saved?.checkIn || saved?.checkOut) {
      setBookingDates((prev) => ({
        ...prev,
        checkIn: saved.checkIn || prev.checkIn,
        checkOut: saved.checkOut || prev.checkOut,
        guests: saved.guests || prev.guests
      }));
    }
  }, [location.state?.bookingDates]);

  useEffect(() => {
    loadListing();
    loadReviews();
    
    // Set up real-time listener for bookings
    let unsubscribe = null;
    if (id) {
      unsubscribe = subscribeToListingBookings(id, (bookings, error) => {
        if (error) {
          console.error('Error loading bookings:', error);
          return;
        }
        
        // Convert bookings to date ranges
        const dates = bookings.map(booking => {
          const checkIn = booking.checkIn?.toDate ? booking.checkIn.toDate() : new Date(booking.checkIn);
          const checkOut = booking.checkOut?.toDate ? booking.checkOut.toDate() : new Date(booking.checkOut);
          return {
            checkIn: toLocalDateString(checkIn),
            checkOut: toLocalDateString(checkOut),
            checkInDate: checkIn,
            checkOutDate: checkOut
          };
        });
        setBookedDates(dates);
      });
    }
    
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [id]);

  useEffect(() => {
    setSelectedImageIndex(0);
  }, [listing?.id]);

  const loadListing = async () => {
    try {
      setLoading(true);
      const data = await getListing(id);
      setListing(data);
    } catch (error) {
      toast.error('Failed to load listing');
      navigate(ROUTES.SEARCH);
    } finally {
      setLoading(false);
    }
  };

  const loadReviews = async () => {
    try {
      const data = await getListingReviews(id);
      setReviews(data);
    } catch (error) {
      console.error('Failed to load reviews:', error);
    }
  };

  const loadBookedDates = async () => {
    try {
      const bookings = await getListingBookings(id);
      // Convert bookings to date ranges
      const dates = bookings.map(booking => {
        const checkIn = booking.checkIn?.toDate ? booking.checkIn.toDate() : new Date(booking.checkIn);
        const checkOut = booking.checkOut?.toDate ? booking.checkOut.toDate() : new Date(booking.checkOut);
        return {
          checkIn: toLocalDateString(checkIn),
          checkOut: toLocalDateString(checkOut),
          checkInDate: checkIn,
          checkOutDate: checkOut
        };
      });
      setBookedDates(dates);
    } catch (error) {
      console.error('Failed to load booked dates:', error);
    }
  };

  // Check if a date is booked
  const isDateBooked = (dateString) => {
    if (!dateString) return false;
    const date = new Date(dateString);
    date.setHours(0, 0, 0, 0);
    
    return bookedDates.some(booking => {
      const checkIn = new Date(booking.checkInDate);
      const checkOut = new Date(booking.checkOutDate);
      checkIn.setHours(0, 0, 0, 0);
      checkOut.setHours(0, 0, 0, 0);
      
      // Date is booked if it's between check-in (inclusive) and check-out (exclusive)
      return date >= checkIn && date < checkOut;
    });
  };

  // Check if a date should be disabled in calendar
  const isDateDisabled = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);

    if (d < today) {
      return true;
    }

    // When selecting check-out, disable dates on or before check-in
    if (calendarMode === 'checkOut' && bookingDates.checkIn) {
      const checkIn = new Date(bookingDates.checkIn);
      checkIn.setHours(0, 0, 0, 0);
      if (d <= checkIn) {
        return true;
      }
    }

    return isDateBooked(toLocalDateString(d));
  };

  const getDateRangeLabel = () => {
    if (bookingDates.checkIn && bookingDates.checkOut) {
      const nights = calculateNights(bookingDates.checkIn, bookingDates.checkOut);
      return `${formatDate(bookingDates.checkIn)} → ${formatDate(bookingDates.checkOut)} (${nights} night${nights !== 1 ? 's' : ''})`;
    }
    if (bookingDates.checkIn) {
      return `${formatDate(bookingDates.checkIn)} — select check-out`;
    }
    return '';
  };

  const getEstimatedTotal = () => {
    if (!listing || !bookingDates.checkIn || !bookingDates.checkOut) return null;
    const nights = calculateNights(bookingDates.checkIn, bookingDates.checkOut);
    const guests = parseInt(bookingDates.guests) || 1;
    const rate = listing.pricing?.baseRate || 0;
    return formatCurrency(rate * nights * guests, listing.pricing?.currency);
  };

  // Handle calendar date change
  const handleCalendarChange = (date) => {
    const dateString = toLocalDateString(date);
    
    if (calendarMode === 'checkIn') {
      handleDateChange('checkIn', dateString);
      setCalendarMode('checkOut');
      // If check-out is before new check-in, clear it
      if (bookingDates.checkOut && dateString >= bookingDates.checkOut) {
        setBookingDates(prev => ({ ...prev, checkOut: '' }));
      }
    } else {
      handleDateChange('checkOut', dateString);
      setShowCalendar(false);
    }
  };

  // Get all disabled dates for calendar
  const getDisabledDates = () => {
    const disabled = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Add all booked date ranges
    bookedDates.forEach(booking => {
      const checkIn = new Date(booking.checkInDate);
      const checkOut = new Date(booking.checkOutDate);
      checkIn.setHours(0, 0, 0, 0);
      checkOut.setHours(0, 0, 0, 0);
      
      let currentDate = new Date(checkIn);
      while (currentDate < checkOut) {
        if (currentDate >= today) {
          disabled.push(new Date(currentDate));
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }
    });
    
    return disabled;
  };

  // Check if date range overlaps with any booking
  const validateDateRange = async (checkIn, checkOut) => {
    if (!checkIn || !checkOut) {
      setDateError('');
      return true;
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    
    if (checkOutDate <= checkInDate) {
      setDateError('Check-out date must be after check-in date');
      return false;
    }

    // Check each date in the range
    const datesInRange = [];
    const currentDate = new Date(checkInDate);
    while (currentDate < checkOutDate) {
      datesInRange.push(toLocalDateString(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Check if any date in the range is booked
    for (const dateStr of datesInRange) {
      if (isDateBooked(dateStr)) {
        setDateError('Selected dates are not available. Please choose different dates.');
        return false;
      }
    }

    // Also check using the service function for double verification
    try {
      const availability = await checkDateAvailability(id, checkIn, checkOut);
      if (!availability.available) {
        setDateError('Selected dates are not available. Please choose different dates.');
        return false;
      }
    } catch (error) {
      console.error('Error checking availability:', error);
      // Don't block booking if service check fails, but show warning
    }

    setDateError('');
    return true;
  };

  const handleBooking = async () => {
    if (!bookingDates.checkIn || !bookingDates.checkOut) {
      toast.error('Please select check-in and check-out dates');
      return;
    }

    if (!user) {
      toast.info('Create an account to reserve this listing');
      navigate(ROUTES.REGISTER, {
        state: {
          from: { pathname: `/listing/${id}` },
          bookingDates
        }
      });
      return;
    }

    // Validate guests
    const numGuests = parseInt(bookingDates.guests) || 1;
    if (numGuests < 1) {
      toast.error('Number of guests must be at least 1');
      return;
    }
    const maxGuests = listing.rules?.maxGuests || 10;
    if (numGuests > maxGuests) {
      toast.error(`Maximum ${maxGuests} guests allowed`);
      return;
    }

    // Check if user is trying to book their own listing
    if (user && listing && user.uid === listing.hostId) {
      toast.error('You cannot book your own listing');
      return;
    }

    // Validate date range
    const isValid = await validateDateRange(bookingDates.checkIn, bookingDates.checkOut);
    if (!isValid) {
      return;
    }

    // Calculate pricing (price * number of guests)
    const calculatedPricing = calculateListingPrice(
      listing,
      new Date(bookingDates.checkIn),
      new Date(bookingDates.checkOut),
      numGuests
    );
    
    setPricing({
      ...calculatedPricing,
      totalWithServiceFee: calculatedPricing.total // Total is already price * guests
    });

    // Show guest information form first
    setShowGuestInfoForm(true);
  };

  const handleGuestInfoContinue = (guestData) => {
    // Store guest information
    setGuestInformation(guestData);
    
    // Close guest info form and show PayPal modal
    setShowGuestInfoForm(false);
    setShowPayPalModal(true);
  };

  const handlePayPalSuccess = async (details) => {
    if (!listing || !bookingDates.checkIn || !bookingDates.checkOut || !pricing) return;

    // Double-check: Prevent host from booking their own listing
    if (user && listing && user.uid === listing.hostId) {
      toast.error('You cannot book your own listing');
      setShowPayPalModal(false);
      return;
    }

    try {
      const transactionId =
        details.id || details.purchase_units?.[0]?.payments?.captures?.[0]?.id || null;

      const bookingDoc = buildCompleteBookingData({
        listing,
        user,
        userProfile,
        checkIn: bookingDates.checkIn,
        checkOut: bookingDates.checkOut,
        guests: bookingDates.guests,
        guestInformation,
        pricing,
        payment: {
          paymentMethod: 'paypal',
          transactionId,
          paymentStatus: PAYMENT_STATUS.COMPLETED,
          status: BOOKING_STATUS.CONFIRMED
        }
      });

      const bookingId = await createBooking(bookingDoc);

      const totalAmount = bookingDoc.pricing.total;
      const adminIncome = totalAmount * 0.15;
      const hostIncome = totalAmount * 0.85;

      const paymentDoc = createPaymentDocument({
        bookingId,
        userId: user.uid,
        hostId: listing.hostId,
        amount: totalAmount,
        currency: bookingDoc.pricing.currency,
        paymentMethod: 'paypal',
        transactionId,
        adminIncome,
        hostIncome,
        payoutStatus: 'pending',
        hostPayoutStatus: 'pending',
        adminPayoutStatus: 'pending',
        status: PAYMENT_STATUS.COMPLETED
      });

      const paymentId = await firestoreService.createDocument('payments', paymentDoc);
      await updateBooking(bookingId, { paymentId });

      toast.success('Payment successful! Booking confirmed.');
      setShowPayPalModal(false);
      navigate(`${ROUTES.GUEST_BOOKINGS}?booking=${bookingId}`);
    } catch (error) {
      toast.error(error.message || 'Payment processing failed. Please contact support.');
      console.error('Payment error:', error);
    }
  };

  const handlePayPalError = (error) => {
    console.error('PayPal error:', error);
    toast.error('PayPal payment failed. Please try again.');
  };

  const handleDateChange = async (field, value) => {
    const newDates = {
      ...bookingDates,
      [field]: value
    };
    
    // If check-out is being set and it's before check-in, adjust check-in
    if (field === 'checkOut' && newDates.checkIn && value < newDates.checkIn) {
      toast.error('Check-out date must be after check-in date');
      return;
    }
    
    // If check-in is being set and it's after check-out, clear check-out
    if (field === 'checkIn' && newDates.checkOut && value > newDates.checkOut) {
      newDates.checkOut = '';
    }
    
    setBookingDates(newDates);
    
    // Validate the date range
    if (newDates.checkIn && newDates.checkOut) {
      await validateDateRange(newDates.checkIn, newDates.checkOut);
    } else {
      setDateError('');
    }
  };

  const handleShare = async (platform) => {
    const url = window.location.href;
    
    if (platform === 'copy') {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard!');
      return;
    }

    // Social media sharing URLs
    const shareUrls = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(listing?.title || '')}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(url)}`
    };

    if (shareUrls[platform]) {
      window.open(shareUrls[platform], '_blank', 'width=600,height=400');
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

  const ratingStats = calculateAverageRating(reviews);
  const locationParts = [
    listing.location?.city,
    listing.location?.state,
    listing.location?.country
  ].filter(Boolean);
  const locationText = locationParts.join(', ');

  const keyDetails = [
    { label: 'Category', value: listing.category || 'Not specified' },
    { label: 'Type', value: listing.type || 'Not specified' },
    { label: 'Max guests', value: `${listing.rules?.maxGuests || 1} guests` },
    { label: 'Check-in', value: listing.availability?.checkInTime || 'Flexible' },
    { label: 'Check-out', value: listing.availability?.checkOutTime || 'Flexible' },
    { label: 'Cancellation', value: listing.availability?.cancellationPolicy || 'Standard' },
    { label: 'Instant book', value: listing.availability?.instantBook ? 'Enabled' : 'Request to book' }
  ];

  const houseRules = listing.rules?.houseRules || [];

  return (
    <DashboardLayout>
      <div className="listing-detail">
        {/* Images Gallery */}
        {listing.images && listing.images.length > 0 && (
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
        )}

        <div className="listing-detail-content">
          <div className="listing-main">
            {/* Header */}
            <div className="listing-header">
              <div>
                <h1>{listing.title}</h1>
                <div className="listing-meta">
                  <span className="location">
                    {locationText || 'Location details coming soon'}
                  </span>
                  {ratingStats.count > 0 && (
                    <div className="rating">
                      <span className="stars">★</span>
                      <span>{ratingStats.average}</span>
                      <span className="review-count">({ratingStats.count} reviews)</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="listing-actions">
                <div className="favorite-action">
                  <WishlistButton listingId={listing.id} className="wishlist-button--detail" />
                  <span>Save</span>
                </div>
                <div className="share-buttons">
                  <button
                    className="share-btn"
                    onClick={() => handleShare('copy')}
                    title="Copy link"
                  >
                    🔗 Copy Link
                  </button>
                  <button
                    className="share-btn"
                    onClick={() => handleShare('facebook')}
                    title="Share on Facebook"
                  >
                    Facebook
                  </button>
                  <button
                    className="share-btn"
                    onClick={() => handleShare('twitter')}
                    title="Share on Twitter"
                  >
                    Twitter
                  </button>
                </div>
              </div>
            </div>

            {/* Description */}
            <Card title="About this listing" className="section-card">
              <p className="description">{listing.description}</p>
            </Card>

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

            {/* Key Details */}
            <Card title="Key details" className="section-card">
              <div className="key-details-grid">
                {keyDetails.map((detail) => (
                  <div key={detail.label} className="detail-item">
                    <span className="detail-label">{detail.label}</span>
                    <span className="detail-value">{detail.value}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* House Rules */}
            {houseRules.length > 0 && (
              <Card title="House rules" className="section-card">
                <ul className="house-rules-list">
                  {houseRules.map((rule, index) => (
                    <li key={`${rule}-${index}`}>{rule}</li>
                  ))}
                </ul>
              </Card>
            )}

            {/* Location Map */}
            {listing.location && (
              <Card title="Where you'll be" className="section-card">
                <div className="location-map-container">
                  {listing.location.latitude && listing.location.longitude ? (
                    <>
                      {/* Use OpenStreetMap - no API key required */}
                      <iframe
                        width="100%"
                        height="400"
                        style={{ border: 0, borderRadius: '0.75rem' }}
                        loading="lazy"
                        allowFullScreen
                        referrerPolicy="no-referrer-when-downgrade"
                        src={`https://www.openstreetmap.org/export/embed.html?bbox=${(parseFloat(listing.location.longitude) - 0.01)},${(parseFloat(listing.location.latitude) - 0.01)},${(parseFloat(listing.location.longitude) + 0.01)},${(parseFloat(listing.location.latitude) + 0.01)}&layer=mapnik&marker=${listing.location.latitude},${listing.location.longitude}`}
                      />
                      <div className="map-link">
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${listing.location.latitude},${listing.location.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="view-map-link"
                        >
                          View on Google Maps →
                        </a>
                      </div>
                    </>
                  ) : (
                    <div className="map-placeholder">
                      <p>📍 {locationText || 'Location information'}</p>
                      {listing.location.address && (
                        <p className="map-address">{listing.location.address}</p>
                      )}
                      {/* Use OpenStreetMap for address-based search - no API key required */}
                      <iframe
                        width="100%"
                        height="400"
                        style={{ border: 0, borderRadius: '0.75rem', marginTop: '1rem' }}
                        loading="lazy"
                        allowFullScreen
                        referrerPolicy="no-referrer-when-downgrade"
                        src={`https://www.openstreetmap.org/export/embed.html?bbox=-180,-90,180,90&layer=mapnik&q=${encodeURIComponent(locationText || listing.location.city || listing.location.country || '')}`}
                      />
                      <div className="map-link">
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locationText || listing.location.city || '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="view-map-link"
                        >
                          View on Google Maps →
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Reviews */}
            <Card title={`Reviews (${ratingStats.count})`} className="section-card">
              {reviews.length === 0 ? (
                <p>No reviews yet. Be the first to review!</p>
              ) : (
                <div className="reviews-list">
                  {reviews.slice(0, 5).map((review) => (
                    <div key={review.id} className="review-item">
                      <div className="review-header">
                        <div>
                          <strong>{review.guestId}</strong>
                          <div className="review-rating">
                            {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                          </div>
                        </div>
                        <span className="review-date">
                          {formatDate(review.createdAt)}
                        </span>
                      </div>
                      <p className="review-comment">{review.comment}</p>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Booking Sidebar */}
          <div className="booking-sidebar">
            <Card className="booking-card">
              <div className="booking-price">
                <span className="price">
                  {formatCurrency(listing.pricing?.baseRate || 0, listing.pricing?.currency)}
                </span>
                <span className="period">/night</span>
              </div>

              <div className="booking-form">
                <div className="form-group">
                  <label>Dates</label>
                  <div className="date-input-wrapper">
                    <input
                      type="text"
                      value={getDateRangeLabel()}
                      placeholder="Add check-in and check-out dates"
                      readOnly
                      onClick={() => {
                        setCalendarMode(bookingDates.checkIn && !bookingDates.checkOut ? 'checkOut' : 'checkIn');
                        setShowCalendar(true);
                      }}
                      className="form-input date-input date-range-input"
                    />
                    <button
                      type="button"
                      className="calendar-toggle-btn"
                      onClick={() => {
                        setCalendarMode(bookingDates.checkIn && !bookingDates.checkOut ? 'checkOut' : 'checkIn');
                        setShowCalendar(!showCalendar);
                      }}
                      aria-label="Open calendar"
                    >
                      📅
                    </button>
                  </div>
                  {getEstimatedTotal() && (
                    <small className="booking-estimate">
                      Estimated total: {getEstimatedTotal()}
                    </small>
                  )}
                </div>
                {showCalendar && (
                  <div className="calendar-container">
                    <p className="calendar-hint">
                      {calendarMode === 'checkIn'
                        ? 'Step 1: Select your check-in date'
                        : 'Step 2: Select your check-out date'}
                    </p>
                    <Calendar
                      onChange={handleCalendarChange}
                      value={
                        calendarMode === 'checkIn' && bookingDates.checkIn
                          ? new Date(bookingDates.checkIn + 'T12:00:00')
                          : calendarMode === 'checkOut' && bookingDates.checkOut
                            ? new Date(bookingDates.checkOut + 'T12:00:00')
                            : bookingDates.checkIn
                              ? new Date(bookingDates.checkIn + 'T12:00:00')
                              : new Date()
                      }
                      minDate={
                        calendarMode === 'checkOut' && bookingDates.checkIn
                          ? (() => {
                              const d = new Date(bookingDates.checkIn + 'T12:00:00');
                              d.setDate(d.getDate() + 1);
                              return d;
                            })()
                          : new Date()
                      }
                      tileDisabled={({ date }) => isDateDisabled(date)}
                      className="booking-calendar"
                    />
                    <div className="calendar-legend">
                      <div className="legend-item">
                        <span className="legend-color available"></span>
                        <span>Available</span>
                      </div>
                      <div className="legend-item">
                        <span className="legend-color booked"></span>
                        <span>Booked</span>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowCalendar(false)}
                      style={{ marginTop: '0.5rem', width: '100%' }}
                    >
                      Close Calendar
                    </Button>
                  </div>
                )}
                {dateError && (
                  <div className="form-error" style={{ color: '#ff4444', marginBottom: '10px', fontSize: '14px' }}>
                    {dateError}
                  </div>
                )}
                <div className="form-group">
                  <label>Guests</label>
                  <input
                    type="number"
                    value={bookingDates.guests}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Allow empty value while typing
                      if (value === '') {
                        setBookingDates(prev => ({ ...prev, guests: '' }));
                      } else {
                        const numValue = parseInt(value);
                        if (!isNaN(numValue) && numValue >= 1) {
                          const maxGuests = listing.rules?.maxGuests || 10;
                          setBookingDates(prev => ({ ...prev, guests: Math.min(numValue, maxGuests) }));
                        }
                      }
                    }}
                    onBlur={(e) => {
                      // Ensure minimum value of 1 when field loses focus
                      const value = parseInt(e.target.value);
                      if (isNaN(value) || value < 1) {
                        setBookingDates(prev => ({ ...prev, guests: 1 }));
                      }
                    }}
                    min="1"
                    max={listing.rules?.maxGuests || 10}
                    className="form-input"
                  />
                </div>

                {user && listing && user.uid === listing.hostId ? (
                  <div className="host-booking-message">
                    <p style={{ color: '#ef4444', marginBottom: '0.5rem', fontSize: '0.875rem', textAlign: 'center' }}>
                      ⚠️ You cannot book your own listing
                    </p>
                    <Button
                      variant="outline"
                      size="lg"
                      fullWidth
                      onClick={() => navigate(`${ROUTES.HOST_LISTINGS}/${listing.id}`)}
                    >
                      Manage Listing
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="primary"
                    size="lg"
                    fullWidth
                    onClick={handleBooking}
                    disabled={!bookingDates.checkIn || !bookingDates.checkOut || !!dateError || !bookingDates.guests || bookingDates.guests < 1}
                  >
                    {user ? 'Reserve' : 'Sign up to Reserve'}
                  </Button>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Guest Information Form Modal */}
      {listing && pricing && (
        <GuestInformationForm
          isOpen={showGuestInfoForm}
          onClose={() => setShowGuestInfoForm(false)}
          numberOfGuests={bookingDates.guests || 1}
          onContinue={handleGuestInfoContinue}
        />
      )}

      {/* PayPal Payment Modal */}
      {listing && pricing && (
        <PayPalModal
          isOpen={showPayPalModal}
          onClose={() => setShowPayPalModal(false)}
          listing={listing}
          bookingData={{
            checkIn: bookingDates.checkIn,
            checkOut: bookingDates.checkOut,
            guests: bookingDates.guests
          }}
          pricing={pricing}
          onSuccess={handlePayPalSuccess}
          onError={handlePayPalError}
        />
      )}
    </DashboardLayout>
  );
};

export default ListingDetail;

