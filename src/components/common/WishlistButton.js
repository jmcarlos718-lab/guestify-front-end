/**
 * Wishlist Button Component
 * 
 * Reusable button for adding/removing items from wishlist
 */

import React, { useState, useEffect } from 'react';
import { useAuthContext } from '../../context/AuthContext';
import { addToWishlist, removeFromWishlist, isInWishlist } from '../../services/wishlistService';
import { toast } from 'react-toastify';
import './WishlistButton.css';

const WishlistButton = ({ listingId, className = '' }) => {
  const { user, isAuthenticated } = useAuthContext();
  const [inWishlist, setInWishlist] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (isAuthenticated && user && listingId) {
      checkWishlistStatus();
    } else {
      setChecking(false);
    }
  }, [isAuthenticated, user, listingId]);

  const checkWishlistStatus = async () => {
    try {
      const status = await isInWishlist(user.uid, listingId);
      setInWishlist(status);
    } catch (error) {
      console.error('Error checking wishlist status:', error);
    } finally {
      setChecking(false);
    }
  };

  const handleToggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      toast.info('Please sign in to add items to your wishlist');
      return;
    }

    setLoading(true);

    try {
      if (inWishlist) {
        await removeFromWishlist(user.uid, listingId);
        setInWishlist(false);
        toast.success('Removed from wishlist');
      } else {
        await addToWishlist(user.uid, listingId);
        setInWishlist(true);
        toast.success('Added to wishlist');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to update wishlist');
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <button
        className={`wishlist-button ${className}`}
        disabled
        aria-label="Loading wishlist status"
      >
        ...
      </button>
    );
  }

  return (
    <button
      className={`wishlist-button ${inWishlist ? 'active' : ''} ${className}`}
      onClick={handleToggle}
      disabled={loading}
      aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
    >
      {inWishlist ? '♥' : '♡'}
    </button>
  );
};

export default WishlistButton;



