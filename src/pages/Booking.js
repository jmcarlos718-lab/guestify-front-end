/**
 * Booking Page - All Listings
 * 
 * Browse all listings with search, filters, sorting, and pagination
 */

import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Card from '../components/common/Card';
import { ROUTES, LISTING_CATEGORIES } from '../config/constants';
import { searchListings, subscribeToPublishedListings } from '../services/listingService';
import { formatCurrency } from '../utils/helpers';
import WishlistButton from '../components/common/WishlistButton';
import { toast } from 'react-toastify';
import './Booking.css';

const Booking = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState('popularity');
  
  const [filters, setFilters] = useState({
    query: searchParams.get('q') || '',
    location: searchParams.get('location') || '',
    category: searchParams.get('category') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    guests: searchParams.get('guests') || '1'
  });

  // Set up real-time listener for published listings
  useEffect(() => {
    setLoading(true);
    let unsubscribe = null;
    let initialTimeout = null;
    
    // Build search parameters for the real-time listener
    const searchParams = {
      query: filters.query,
      location: filters.location,
      category: filters.category || null,
      minPrice: filters.minPrice ? parseFloat(filters.minPrice) : null,
      maxPrice: filters.maxPrice ? parseFloat(filters.maxPrice) : null,
      guests: parseInt(filters.guests) || 1
    };

    // Process listings (sort, paginate, etc.)
    const processListings = (listings) => {
      // Sort results
      let sortedResults = [...listings];
      switch (sortBy) {
        case 'price-low':
          sortedResults.sort((a, b) => (a.pricing?.baseRate || 0) - (b.pricing?.baseRate || 0));
          break;
        case 'price-high':
          sortedResults.sort((a, b) => (b.pricing?.baseRate || 0) - (a.pricing?.baseRate || 0));
          break;
        case 'rating':
          sortedResults.sort((a, b) => (b.rating || 0) - (a.rating || 0));
          break;
        default:
          // popularity (default) - already sorted by createdAt desc from Firestore
          sortedResults.sort((a, b) => {
            // If createdAt exists, use it; otherwise use reviewCount
            if (a.createdAt && b.createdAt) {
              const aDate = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
              const bDate = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
              return bDate - aDate;
            }
            return (b.reviewCount || 0) - (a.reviewCount || 0);
          });
      }

      // Pagination (simple client-side pagination)
      const itemsPerPage = 12;
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const paginatedResults = sortedResults.slice(startIndex, endIndex);
      
      setListings(paginatedResults);
      setTotalPages(Math.ceil(sortedResults.length / itemsPerPage));
      setLoading(false);
    };

    // Fallback function to use regular search if real-time fails
    const loadListingsFallback = async () => {
      try {
        const results = await searchListings(searchParams);
        processListings(results);
      } catch (error) {
        console.error('Fallback search also failed:', error);
        toast.error('Failed to load listings. Please refresh the page.');
        setListings([]);
        setTotalPages(1);
        setLoading(false);
      }
    };

    // Set a timeout to use fallback if no response in 5 seconds
    initialTimeout = setTimeout(() => {
      console.warn('Real-time listener taking too long, using fallback');
      if (unsubscribe) unsubscribe();
      loadListingsFallback();
    }, 5000);

    // Subscribe to real-time updates
    unsubscribe = subscribeToPublishedListings(searchParams, (listings, error) => {
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
          loadListingsFallback();
        }, 1000);
        return;
      }

      // Success - process the listings
      processListings(listings);
    });

    // Cleanup subscription on unmount or when dependencies change
    return () => {
      if (unsubscribe) unsubscribe();
      if (initialTimeout) clearTimeout(initialTimeout);
    };
  }, [filters, currentPage, sortBy]);

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Update URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    setSearchParams(params);
  }, [filters, setSearchParams]);

  const clearFilters = () => {
    const clearedFilters = {
      query: '',
      location: '',
      category: '',
      minPrice: '',
      maxPrice: '',
      guests: '1'
    };
    setFilters(clearedFilters);
    setSearchParams({});
    setCurrentPage(1);
  };

  const ListingCard = ({ listing }) => (
    <Link
      to={`${ROUTES.LISTING_DETAIL.replace(':id', listing.id)}`}
      className="booking-listing-card"
    >
      <div className="booking-listing-image">
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
        <WishlistButton listingId={listing.id} className="wishlist-btn" />
      </div>
      <div className="booking-listing-info">
        <h3>{listing.title}</h3>
        <p className="listing-location">
          {listing.location?.city}, {listing.location?.country}
        </p>
        {listing.rating > 0 && (
          <div className="listing-rating">
            <span className="rating-stars">★</span>
            <span>{listing.rating.toFixed(1)}</span>
            <span className="rating-count">({listing.reviewCount || 0})</span>
          </div>
        )}
        <div className="listing-price">
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
  );

  return (
    <div className="booking-page">
      <Header />
      
      <main className="booking-main">
        <div className="booking-container">
          <div className="booking-header">
            <h1>Browse All Listings</h1>
            <p>Find your perfect stay from apartments, hotels, resorts, and more</p>
          </div>

          {/* Search and Filters */}
          <Card className="booking-filters-card">
            <div className="booking-filters">
              <div className="filter-row">
                <Input
                  label="Search"
                  name="query"
                  value={filters.query}
                  onChange={(e) => handleFilterChange('query', e.target.value)}
                  placeholder="Search listings..."
                  fullWidth
                />
                <Input
                  label="Location"
                  name="location"
                  value={filters.location}
                  onChange={(e) => handleFilterChange('location', e.target.value)}
                  placeholder="City, Country"
                  fullWidth
                />
              </div>

              <div className="filter-row">
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select
                    name="category"
                    value={filters.category}
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                    className="form-select"
                  >
                    <option value="">All Categories</option>
                    <option value={LISTING_CATEGORIES.APARTMENT}>Apartments</option>
                    <option value={LISTING_CATEGORIES.HOTEL}>Hotels</option>
                    <option value={LISTING_CATEGORIES.RESORT}>Resorts</option>
                    <option value={LISTING_CATEGORIES.ROOM}>Rooms</option>
                    <option value={LISTING_CATEGORIES.HOME}>Homes</option>
                  </select>
                </div>
                <Input
                  label="Min Price"
                  name="minPrice"
                  type="number"
                  value={filters.minPrice}
                  onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                  placeholder="0"
                  min="0"
                  fullWidth
                />
                <Input
                  label="Max Price"
                  name="maxPrice"
                  type="number"
                  value={filters.maxPrice}
                  onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                  placeholder="No limit"
                  min="0"
                  fullWidth
                />
                <Input
                  label="Guests"
                  name="guests"
                  type="number"
                  value={filters.guests}
                  onChange={(e) => handleFilterChange('guests', e.target.value)}
                  min="1"
                  fullWidth
                />
              </div>

              <div className="filter-actions">
                <Button variant="outline" size="lg" onClick={clearFilters}>
                  Clear Filters
                </Button>
                <p className="realtime-indicator">✨ Real-time updates enabled</p>
              </div>
            </div>
          </Card>

          {/* Sort and Results */}
          <div className="booking-results-header">
            <h2>
              {loading ? 'Searching...' : `${listings.length} ${listings.length === 1 ? 'listing' : 'listings'} found`}
            </h2>
            <div className="sort-controls">
              <label>Sort by:</label>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setCurrentPage(1);
                }}
                className="sort-select"
              >
                <option value="popularity">Popularity</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Rating</option>
              </select>
            </div>
          </div>

          {/* Listings Grid */}
          {loading ? (
            <div className="loading-grid">Loading listings...</div>
          ) : listings.length === 0 ? (
            <Card className="empty-results">
              <div className="empty-content">
                <h3>No listings found</h3>
                <p>Try adjusting your search filters</p>
              </div>
            </Card>
          ) : (
            <>
              <div className="booking-listings-grid">
                {listings.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="pagination">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <span className="pagination-info">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Booking;

