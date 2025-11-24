/**
 * Create Listing Page
 * 
 * Form for hosts to create new listings
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../../context/AuthContext';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Card from '../../components/common/Card';
import { LISTING_CATEGORIES, LISTING_STATUS, ROUTES } from '../../config/constants';
import { createListing, saveDraft } from '../../services/listingService';
import { fileToDataURL, compressImage, validateFile } from '../../services/storageService';
import { toast } from 'react-toastify';
import './CreateListing.css';

const CreateListing = () => {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: LISTING_CATEGORIES.HOME,
    type: '',
    location: {
      address: '',
      city: '',
      state: '',
      country: '',
      zipCode: '',
      neighborhood: ''
    },
    pricing: {
      baseRate: '',
      currency: 'PHP',
      discount: 0,
      promoCode: '',
      cleaningFee: 0,
      serviceFee: 10,
      minimumStay: 1,
      maximumStay: null
    },
    amenities: [],
    availability: {
      instantBook: false,
      checkInTime: '15:00',
      checkOutTime: '11:00',
      cancellationPolicy: 'moderate'
    },
    rules: {
      houseRules: [],
      petFriendly: false,
      smokingAllowed: false,
      partiesAllowed: false,
      maxGuests: 1,
      ageRestriction: null
    },
    images: []
  });

  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleImageChange = async (e) => {
    const files = Array.from(e.target.files);
    
    // Validate files
    for (const file of files) {
      const validation = validateFile(file, {
        maxSize: 10 * 1024 * 1024, // 10MB
        allowedTypes: ['image/jpeg', 'image/png', 'image/webp']
      });

      if (!validation.valid) {
        toast.error(validation.error);
        return;
      }
    }

    // Create previews
    const previews = files.map(file => URL.createObjectURL(file));
    setImagePreviews(prev => [...prev, ...previews]);
    setImageFiles(prev => [...prev, ...files]);
  };

  const removeImage = (index) => {
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
    setImageFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadImages = async () => {
    if (imageFiles.length === 0) return [];

    if (!user?.uid) {
      throw new Error('You must be signed in to upload listing images.');
    }

    setUploadingImages(true);
    const uploadedUrls = [];

    try {
      for (const file of imageFiles) {
        // Compress to keep payloads manageable when embedding directly in Firestore
        const compressedFile = await compressImage(file, 1280, 720, 0.7);
        const dataUrl = await fileToDataURL(compressedFile);
        uploadedUrls.push(dataUrl);
      }
    } catch (error) {
      console.error('Image upload error:', error);
      throw new Error('Failed to upload images');
    } finally {
      setUploadingImages(false);
    }

    return uploadedUrls;
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title || formData.title.trim().length < 5) {
      newErrors.title = 'Title must be at least 5 characters';
    }

    if (!formData.description || formData.description.trim().length < 20) {
      newErrors.description = 'Description must be at least 20 characters';
    }

    if (!formData.location.city) {
      newErrors.city = 'City is required';
    }

    if (!formData.pricing.baseRate || formData.pricing.baseRate <= 0) {
      newErrors.baseRate = 'Base rate must be greater than 0';
    }

    if (imageFiles.length === 0) {
      newErrors.images = 'At least one image is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveDraft = async () => {
    if (isSavingDraft || isSubmitting) return;

    if (!user?.uid) {
      toast.error('You must be signed in as a host to save a draft.');
      return;
    }
    
    setIsSavingDraft(true);

    try {
      const listingData = {
        ...formData,
        hostId: user.uid,
        pricing: {
          ...formData.pricing,
          baseRate: parseFloat(formData.pricing.baseRate) || 0,
          cleaningFee: parseFloat(formData.pricing.cleaningFee) || 0,
          discount: parseFloat(formData.pricing.discount) || 0
        },
        rules: {
          ...formData.rules,
          maxGuests: parseInt(formData.rules.maxGuests) || 1
        }
      };

      // Upload images if any
      if (imageFiles.length > 0) {
        const uploadedUrls = await uploadImages();
        listingData.images = uploadedUrls;
      }

      const listingId = await saveDraft(null, listingData);
      console.log('Draft saved with ID:', listingId);
      toast.success('Draft saved successfully!');
      navigate(ROUTES.HOST_LISTINGS);
    } catch (error) {
      console.error('Save draft error:', error);
      toast.error(error.message || 'Failed to save draft');
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isSubmitting || isSavingDraft) return;

    if (!user?.uid) {
      toast.error('You must be signed in as a host to publish listings.');
      return;
    }

    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload images
      const uploadedUrls = await uploadImages();

      const listingData = {
        ...formData,
        hostId: user.uid,
        images: uploadedUrls,
        pricing: {
          ...formData.pricing,
          baseRate: parseFloat(formData.pricing.baseRate),
          cleaningFee: parseFloat(formData.pricing.cleaningFee) || 0,
          discount: parseFloat(formData.pricing.discount) || 0
        },
        rules: {
          ...formData.rules,
          maxGuests: parseInt(formData.rules.maxGuests) || 1
        },
        status: LISTING_STATUS.PUBLISHED
      };

      const listingId = await createListing(listingData);
      console.log('Listing created with ID:', listingId);
      toast.success('Your listing is now live!');
      // Optional: Redirect to Booking page to see the listing
      // navigate(ROUTES.BOOKING);
      // Or keep the current behavior of going to listing detail
      navigate(`${ROUTES.HOST_LISTINGS}/${listingId}`);
    } catch (error) {
      console.error('Create listing error:', error);
      toast.error(error.message || 'Failed to create listing');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="create-listing">
        <div className="listing-header">
          <h1>Create New Listing</h1>
          <p>Share your space, experience, or service with the world</p>
        </div>

        <form onSubmit={handleSubmit} className="listing-form">
          {/* Basic Information */}
          <Card title="Basic Information" className="form-section">
            <Input
              label="Listing Title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              error={errors.title}
              placeholder="e.g., Beautiful Apartment in Downtown"
              required
              fullWidth
            />

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">
                  Category <span className="required">*</span>
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="form-select"
                >
                  <option value={LISTING_CATEGORIES.HOME}>Home</option>
                  <option value={LISTING_CATEGORIES.EXPERIENCE}>Experience</option>
                  <option value={LISTING_CATEGORIES.SERVICE}>Service</option>
                </select>
              </div>

              <Input
                label="Type"
                name="type"
                value={formData.type}
                onChange={handleChange}
                placeholder="e.g., Apartment, Cooking Class, Photography"
                fullWidth
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                Description <span className="required">*</span>
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="form-textarea"
                rows="6"
                placeholder="Describe your listing in detail..."
                required
              />
              {errors.description && (
                <span className="form-error">{errors.description}</span>
              )}
            </div>
          </Card>

          {/* Location */}
          <Card title="Location" className="form-section">
            <Input
              label="Address"
              name="location.address"
              value={formData.location.address}
              onChange={handleChange}
              placeholder="Street address"
              fullWidth
            />

            <div className="form-row">
              <Input
                label="City"
                name="location.city"
                value={formData.location.city}
                onChange={handleChange}
                error={errors.city}
                placeholder="City"
                required
                fullWidth
              />
              <Input
                label="State/Province"
                name="location.state"
                value={formData.location.state}
                onChange={handleChange}
                placeholder="State or Province"
                fullWidth
              />
            </div>

            <div className="form-row">
              <Input
                label="Country"
                name="location.country"
                value={formData.location.country}
                onChange={handleChange}
                placeholder="Country"
                fullWidth
              />
              <Input
                label="ZIP/Postal Code"
                name="location.zipCode"
                value={formData.location.zipCode}
                onChange={handleChange}
                placeholder="ZIP Code"
                fullWidth
              />
            </div>
          </Card>

          {/* Pricing */}
          <Card title="Pricing" className="form-section">
            <div className="form-row">
              <Input
                label="Base Rate (per night/day)"
                name="pricing.baseRate"
                type="number"
                value={formData.pricing.baseRate}
                onChange={handleChange}
                error={errors.baseRate}
                placeholder="0.00"
                min="0"
                step="0.01"
                required
                fullWidth
              />
              <div className="form-group">
                <label className="form-label">Currency</label>
                <select
                  name="pricing.currency"
                  value={formData.pricing.currency}
                  onChange={handleChange}
                  className="form-select"
                >
                  <option value="PHP">PHP (₱)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <Input
                label="Discount (%)"
                name="pricing.discount"
                type="number"
                value={formData.pricing.discount}
                onChange={handleChange}
                placeholder="0"
                min="0"
                max="100"
                fullWidth
              />
              <Input
                label="Cleaning Fee"
                name="pricing.cleaningFee"
                type="number"
                value={formData.pricing.cleaningFee}
                onChange={handleChange}
                placeholder="0.00"
                min="0"
                step="0.01"
                fullWidth
              />
            </div>

            <div className="form-row">
              <Input
                label="Minimum Stay (nights/days)"
                name="pricing.minimumStay"
                type="number"
                value={formData.pricing.minimumStay}
                onChange={handleChange}
                placeholder="1"
                min="1"
                fullWidth
              />
              <Input
                label="Maximum Guests"
                name="rules.maxGuests"
                type="number"
                value={formData.rules.maxGuests}
                onChange={handleChange}
                placeholder="1"
                min="1"
                fullWidth
              />
            </div>
          </Card>

          {/* Images */}
          <Card title="Images" className="form-section">
            <div className="image-upload-section">
              <input
                type="file"
                id="image-upload"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={handleImageChange}
                className="image-upload-input"
              />
              <label htmlFor="image-upload" className="image-upload-label">
                <span>+ Add Images</span>
                <small>Upload up to 10 images (max 10MB each)</small>
              </label>
            </div>

            {errors.images && (
              <span className="form-error">{errors.images}</span>
            )}

            {uploadingImages && (
              <p className="upload-status">Uploading images...</p>
            )}

            <div className="image-preview-grid">
              {imagePreviews.map((preview, index) => (
                <div key={index} className="image-preview-item">
                  <img src={preview} alt={`Preview ${index + 1}`} />
                  <button
                    type="button"
                    className="image-remove-btn"
                    onClick={() => removeImage(index)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </Card>

          {/* Rules & Availability */}
          <Card title="Rules & Availability" className="form-section">
            <div className="form-checkboxes">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="availability.instantBook"
                  checked={formData.availability.instantBook}
                  onChange={handleChange}
                />
                <span>Enable Instant Booking</span>
              </label>

              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="rules.petFriendly"
                  checked={formData.rules.petFriendly}
                  onChange={handleChange}
                />
                <span>Pet Friendly</span>
              </label>

              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="rules.smokingAllowed"
                  checked={formData.rules.smokingAllowed}
                  onChange={handleChange}
                />
                <span>Smoking Allowed</span>
              </label>

              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="rules.partiesAllowed"
                  checked={formData.rules.partiesAllowed}
                  onChange={handleChange}
                />
                <span>Parties Allowed</span>
              </label>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Cancellation Policy</label>
                <select
                  name="availability.cancellationPolicy"
                  value={formData.availability.cancellationPolicy}
                  onChange={handleChange}
                  className="form-select"
                >
                  <option value="flexible">Flexible</option>
                  <option value="moderate">Moderate</option>
                  <option value="strict">Strict</option>
                </select>
              </div>

              <Input
                label="Check-in Time"
                name="availability.checkInTime"
                type="time"
                value={formData.availability.checkInTime}
                onChange={handleChange}
                fullWidth
              />
            </div>
          </Card>

          {/* Form Actions */}
          <div className="form-actions">
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={handleSaveDraft}
              loading={isSavingDraft}
              disabled={isSubmitting || isSavingDraft}
            >
              Save as Draft
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={isSubmitting || uploadingImages}
              disabled={isSubmitting || isSavingDraft || uploadingImages}
            >
              Publish Listing
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default CreateListing;



