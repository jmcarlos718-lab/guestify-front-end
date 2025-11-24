/**
 * Listings Management Page
 * 
 * View and manage all host listings
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthContext } from '../../context/AuthContext';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import Loading from '../../components/common/Loading';
import { ROUTES, LISTING_STATUS } from '../../config/constants';
import { getListings, deleteListing, publishListing } from '../../services/listingService';
import { toast } from 'react-toastify';
import './Listings.css';

const Listings = () => {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [publishingId, setPublishingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    loadListings();
  }, [user, filter]);

  const loadListings = async () => {
    if (!user?.uid) return;

    try {
      setLoading(true);
      const filters = {
        hostId: user.uid,
        status: filter === 'all' ? null : filter
      };
      const data = await getListings(filters);
      setListings(data);
    } catch (error) {
      toast.error('Failed to load listings');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (listingId) => {
    if (!window.confirm('Are you sure you want to delete this listing?')) {
      return;
    }

    setDeletingId(listingId);
    try {
      await deleteListing(listingId);
      toast.success('Listing deleted successfully');
      await loadListings();
    } catch (error) {
      toast.error(error.message || 'Failed to delete listing');
      console.error('Delete error:', error);
    } finally {
      setDeletingId(null);
    }
  };

  const handlePublish = async (listingId) => {
    setPublishingId(listingId);
    try {
      await publishListing(listingId);
      toast.success('Listing published successfully');
      // Reload to ensure consistency
      await loadListings();
    } catch (error) {
      toast.error(error.message || 'Failed to publish listing');
      console.error('Publish error:', error);
      // Reload to revert any optimistic updates
      await loadListings();
    } finally {
      setPublishingId(null);
    }
  };

  const filteredListings = filter === 'all' 
    ? listings 
    : listings.filter(listing => listing.status === filter);

  if (loading) {
    return (
      <DashboardLayout>
        <Loading fullScreen message="Loading listings..." />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="listings-page">
        <div className="listings-header">
          <div>
            <h1>My Listings</h1>
            <p>Manage your listings and bookings</p>
          </div>
          <Link to={`${ROUTES.HOST_LISTINGS}/create`}>
            <Button variant="primary" size="lg">
              + Create New Listing
            </Button>
          </Link>
        </div>

        <div className="listings-filters">
          <button
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All ({listings.length})
          </button>
          <button
            className={`filter-btn ${filter === LISTING_STATUS.PUBLISHED ? 'active' : ''}`}
            onClick={() => setFilter(LISTING_STATUS.PUBLISHED)}
          >
            Published ({listings.filter(l => l.status === LISTING_STATUS.PUBLISHED).length})
          </button>
          <button
            className={`filter-btn ${filter === LISTING_STATUS.DRAFT ? 'active' : ''}`}
            onClick={() => setFilter(LISTING_STATUS.DRAFT)}
          >
            Drafts ({listings.filter(l => l.status === LISTING_STATUS.DRAFT).length})
          </button>
        </div>

        {filteredListings.length === 0 ? (
          <Card className="empty-state">
            <div className="empty-content">
              <h3>No listings found</h3>
              <p>
                {filter === 'all'
                  ? "You haven't created any listings yet. Create your first listing to get started!"
                  : `You don't have any ${filter} listings.`}
              </p>
              <Link to={`${ROUTES.HOST_LISTINGS}/create`}>
                <Button variant="primary" size="lg">
                  Create Your First Listing
                </Button>
              </Link>
            </div>
          </Card>
        ) : (
          <div className="listings-grid">
            {filteredListings.map((listing) => (
              <Card key={listing.id} className="listing-card" hover>
                <div className="listing-image">
                  {listing.images && listing.images.length > 0 ? (
                    <img src={listing.images[0]} alt={listing.title} />
                  ) : (
                    <div className="no-image">No Image</div>
                  )}
                  <div className="listing-status-badge">
                    <span className={`status ${listing.status}`}>
                      {listing.status}
                    </span>
                  </div>
                </div>

                <div className="listing-content">
                  <h3 className="listing-title">{listing.title}</h3>
                  <p className="listing-location">
                    {listing.location?.city}, {listing.location?.country}
                  </p>
                  <div className="listing-info">
                    <span className="listing-price">
                      ${listing.pricing?.baseRate || 0}
                      <small>/night</small>
                    </span>
                    <span className="listing-category">{listing.category}</span>
                  </div>
                </div>

                <div className="listing-actions">
                  <Link to={`${ROUTES.HOST_LISTINGS}/${listing.id}`}>
                    <Button variant="outline" size="sm">
                      View
                    </Button>
                  </Link>
                  <Link to={`${ROUTES.HOST_LISTINGS}/${listing.id}/edit`}>
                    <Button variant="ghost" size="sm">
                      Edit
                    </Button>
                  </Link>
                  {listing.status === LISTING_STATUS.DRAFT && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handlePublish(listing.id)}
                      loading={publishingId === listing.id}
                      disabled={publishingId === listing.id || deletingId === listing.id}
                    >
                      Publish
                    </Button>
                  )}
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDelete(listing.id)}
                    loading={deletingId === listing.id}
                    disabled={publishingId === listing.id || deletingId === listing.id}
                  >
                    Delete
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Listings;





