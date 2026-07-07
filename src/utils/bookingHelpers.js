import { calculateNights } from './helpers';

export const buildCompleteBookingData = ({
  listing,
  user,
  userProfile = null,
  checkIn,
  checkOut,
  guests,
  guestInformation = [],
  pricing = {},
  payment = {},
  specialRequests = ''
}) => {
  const primaryGuest = guestInformation[0] || {};
  const nights = pricing.nights ?? calculateNights(checkIn, checkOut);

  return {
    listingId: listing.id,
    hostId: listing.hostId,
    guestId: user.uid,
    checkIn: new Date(checkIn),
    checkOut: new Date(checkOut),
    guests: Number(guests) || 1,
    guestInformation,
    guestContact: {
      fullName: primaryGuest.fullName || userProfile?.displayName || user?.displayName || '',
      email: primaryGuest.email || userProfile?.email || user?.email || '',
      phone: primaryGuest.phone || userProfile?.phone || ''
    },
    listingSnapshot: {
      title: listing.title || '',
      image: listing.images?.[0] || null,
      city: listing.location?.city || '',
      country: listing.location?.country || '',
      address: listing.location?.address || ''
    },
    pricing: {
      baseRate: pricing.baseRate || 0,
      nights,
      subtotal: pricing.subtotal ?? pricing.total ?? 0,
      discount: pricing.discount || 0,
      discountAmount: pricing.discountAmount || 0,
      cleaningFee: pricing.cleaningFee || 0,
      serviceFee: pricing.serviceFee || 0,
      total: pricing.total || 0,
      currency: listing.pricing?.currency || pricing.currency || 'PHP'
    },
    specialRequests,
    paymentMethod: payment.paymentMethod || null,
    transactionId: payment.transactionId || null,
    paymentStatus: payment.paymentStatus,
    status: payment.status
  };
};

export const getBookingListingTitle = (booking) =>
  booking.listing?.title || booking.listingSnapshot?.title || 'Listing';

export const getBookingListingLocation = (booking) => {
  if (booking.listing?.location) {
    const { city, country } = booking.listing.location;
    return [city, country].filter(Boolean).join(', ');
  }

  const { city, country, address } = booking.listingSnapshot || {};
  return [address, city, country].filter(Boolean).join(', ');
};

export const getBookingListingImage = (booking) =>
  booking.listing?.images?.[0] || booking.listingSnapshot?.image || null;
