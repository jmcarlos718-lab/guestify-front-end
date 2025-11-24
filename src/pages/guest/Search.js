/**
 * Search/Browse Listings Page
 * 
 * Search and filter listings for guests
 */

import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Card from '../../components/common/Card';
import Loading from '../../components/common/Loading';
import WishlistButton from '../../components/common/WishlistButton';
import { ROUTES, LISTING_CATEGORIES } from '../../config/constants';
import { searchListings } from '../../services/listingService';
import { formatCurrency } from '../../utils/helpers';
import { toast } from 'react-toastify';
import './Search.css';

const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    query: searchParams.get('q') || '',
    location: searchParams.get('location') || '',
    checkIn: searchParams.get('checkIn') || '',
    checkOut: searchParams.get('checkOut') || '',
    guests: searchParams.get('guests') || '1',
    category: searchParams.get('category') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || ''
  });

  useEffect(() => {
    if (filters.query || filters.location) {
      handleSearch();
    }
  }, []);

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSearch = async () => {
    setLoading(true);
    try {
      const searchParams = {
        query: filters.query,
        location: filters.location,
        checkIn: filters.checkIn || null,
        checkOut: filters.checkOut || null,
        guests: parseInt(filters.guests) || 1,
        category: filters.category || null,
        minPrice: filters.minPrice ? parseFloat(filters.minPrice) : null,
        maxPrice: filters.maxPrice ? parseFloat(filters.maxPrice) : null
      };

      const results = await searchListings(searchParams);
      setListings(results);
      
      // Update URL params
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.set(key, value);
      });
      setSearchParams(params);
    } catch (error) {
      toast.error('Failed to search listings');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    const clearedFilters = {
      query: '',
      location: '',
      checkIn: '',
      checkOut: '',
      guests: '1',
      category: '',
      minPrice: '',
      maxPrice: ''
    };
    setFilters(clearedFilters);
    setSearchParams({});
    setListings([]);
  };

  return (
    <DashboardLayout>
      <div className="search-page">
        <div className="search-header">
          <h1>Explore Listings</h1>
          <p>Find your perfect stay, experience, or service</p>
        </div>

        {/* Search Filters */}
        <Card className="search-filters-card">
          <div className="search-filters">
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
              <Input
                label="Check-in"
                name="checkIn"
                type="date"
                value={filters.checkIn}
                onChange={(e) => handleFilterChange('checkIn', e.target.value)}
                fullWidth
              />
              <Input
                label="Check-out"
                name="checkOut"
                type="date"
                value={filters.checkOut}
                onChange={(e) => handleFilterChange('checkOut', e.target.value)}
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
                  <option value={LISTING_CATEGORIES.HOME}>Home</option>
                  <option value={LISTING_CATEGORIES.EXPERIENCE}>Experience</option>
                  <option value={LISTING_CATEGORIES.SERVICE}>Service</option>
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
            </div>

            <div className="filter-actions">
              <Button variant="primary" size="lg" onClick={handleSearch} loading={loading}>
                Search
              </Button>
              <Button variant="outline" size="lg" onClick={clearFilters}>
                Clear Filters
              </Button>
            </div>
          </div>
        </Card>

        {/* Results */}
        {loading ? (
          <Loading message="Searching listings..." />
        ) : listings.length === 0 && (filters.query || filters.location) ? (
          <Card className="empty-results">
            <div className="empty-content">
              <h3>No listings found</h3>
              <p>Try adjusting your search filters</p>
            </div>
          </Card>
        ) : (
          <>
            <div className="results-header">
              <h2>{listings.length} {listings.length === 1 ? 'listing' : 'listings'} found</h2>
            </div>
            <div className="listings-grid">
              {listings.map((listing) => (
                <Link
                  key={listing.id}
                  to={`${ROUTES.LISTING_DETAIL.replace(':id', listing.id)}`}
                  className="listing-card-link"
                >
                  <Card className="listing-card" hover>
                    <div className="listing-image">
                      {listing.images && listing.images.length > 0 ? (
                        <img src={listing.images[0]} alt={listing.title} />
                      ) : (
                        <div className="no-image">No Image</div>
                      )}
                      <div className="listing-category-badge">
                        {listing.category}
                      </div>
                      <WishlistButton listingId={listing.id} className="wishlist-btn" />
                    </div>
                    <div className="listing-content">
                      <h3 className="listing-title">{listing.title}</h3>
                      <p className="listing-location">
                        {listing.location?.city}, {listing.location?.country}
                      </p>
                      {listing.rating > 0 && (
                        <div className="listing-rating">
                          <span className="rating-stars">★</span>
                          <span>{listing.rating.toFixed(1)}</span>
                          <span className="rating-count">({listing.reviewCount})</span>
                        </div>
                      )}
                      <div className="listing-price">
                        <span className="price-amount">
                          {formatCurrency(listing.pricing?.baseRate || 0, listing.pricing?.currency)}
                        </span>
                        <span className="price-period">/night</span>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Search;





