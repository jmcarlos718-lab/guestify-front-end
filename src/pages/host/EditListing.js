/**
 * Edit Listing Page
 * 
 * Form for hosts to edit existing listings
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthContext } from '../../context/AuthContext';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Card from '../../components/common/Card';
import Loading from '../../components/common/Loading';
import { LISTING_CATEGORIES, LISTING_STATUS, ROUTES } from '../../config/constants';
import { getListing, updateListing, saveDraft } from '../../services/listingService';
import { fileToDataURL, compressImage, validateFile } from '../../services/storageService';
import { toast } from 'react-toastify';
import './CreateListing.css';
import './EditListing.css';

const EditListing = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const [loading, setLoading] = useState(true);
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
  const [existingImages, setExistingImages] = useState([]);

  useEffect(() => {
    if (id) {
      loadListing();
    }
  }, [id]);

  const loadListing = async () => {
    try {
      setLoading(true);
      const listing = await getListing(id);
      
      // Verify this listing belongs to the current host
      if (listing.hostId !== user?.uid) {
        toast.error('You do not have permission to edit this listing');
        navigate(ROUTES.HOST_LISTINGS);
        return;
      }

      // Populate form with existing data
      setFormData({
        title: listing.title || '',
        description: listing.description || '',
        category: listing.category || LISTING_CATEGORIES.HOME,
        type: listing.type || '',
        location: {
          address: listing.location?.address || '',
          city: listing.location?.city || '',
          state: listing.location?.state || '',
          country: listing.location?.country || '',
          zipCode: listing.location?.zipCode || '',
          neighborhood: listing.location?.neighborhood || ''
        },
        pricing: {
          baseRate: listing.pricing?.baseRate || 0,
          currency: listing.pricing?.currency || 'PHP',
          discount: listing.pricing?.discount || 0,
          promoCode: listing.pricing?.promoCode || '',
          cleaningFee: listing.pricing?.cleaningFee || 0,
          serviceFee: listing.pricing?.serviceFee || 10,
          minimumStay: listing.pricing?.minimumStay || 1,
          maximumStay: listing.pricing?.maximumStay || null
        },
        amenities: listing.amenities || [],
        availability: {
          instantBook: listing.availability?.instantBook || false,
          checkInTime: listing.availability?.checkInTime || '15:00',
          checkOutTime: listing.availability?.checkOutTime || '11:00',
          cancellationPolicy: listing.availability?.cancellationPolicy || 'moderate'
        },
        rules: {
          houseRules: listing.rules?.houseRules || [],
          petFriendly: listing.rules?.petFriendly || false,
          smokingAllowed: listing.rules?.smokingAllowed || false,
          partiesAllowed: listing.rules?.partiesAllowed || false,
          maxGuests: listing.rules?.maxGuests || 1,
          ageRestriction: listing.rules?.ageRestriction || null
        },
        images: listing.images || []
      });

      setExistingImages(listing.images || []);
    } catch (error) {
      toast.error('Failed to load listing');
      console.error(error);
      navigate(ROUTES.HOST_LISTINGS);
    } finally {
      setLoading(false);
    }
  };

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

  const removeExistingImage = (index) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const [newAmenity, setNewAmenity] = useState('');
  const [newHouseRule, setNewHouseRule] = useState('');

  const addAmenity = () => {
    if (newAmenity.trim()) {
      setFormData(prev => ({
        ...prev,
        amenities: [...prev.amenities, newAmenity.trim()]
      }));
      setNewAmenity('');
    }
  };

  const removeAmenity = (index) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.filter((_, i) => i !== index)
    }));
  };

  const addHouseRule = () => {
    if (newHouseRule.trim()) {
      setFormData(prev => ({
        ...prev,
        rules: {
          ...prev.rules,
          houseRules: [...prev.rules.houseRules, newHouseRule.trim()]
        }
      }));
      setNewHouseRule('');
    }
  };

  const removeHouseRule = (index) => {
    setFormData(prev => ({
      ...prev,
      rules: {
        ...prev.rules,
        houseRules: prev.rules.houseRules.filter((_, i) => i !== index)
      }
    }));
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

    const totalImages = existingImages.length + imagePreviews.length;
    if (totalImages === 0) {
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
      // Upload new images if any
      let allImages = [...existingImages];
      if (imageFiles.length > 0) {
        const uploadedUrls = await uploadImages();
        allImages = [...allImages, ...uploadedUrls];
      }

      const listingData = {
        ...formData,
        images: allImages,
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

      await saveDraft(id, listingData);
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
      toast.error('You must be signed in as a host to update listings.');
      return;
    }

    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload new images if any
      let allImages = [...existingImages];
      if (imageFiles.length > 0) {
        const uploadedUrls = await uploadImages();
        allImages = [...allImages, ...uploadedUrls];
      }

      const listingData = {
        ...formData,
        images: allImages,
        pricing: {
          ...formData.pricing,
          baseRate: parseFloat(formData.pricing.baseRate) || 0,
          cleaningFee: parseFloat(formData.pricing.cleaningFee) || 0,
          discount: parseFloat(formData.pricing.discount) || 0
        },
        rules: {
          ...formData.rules,
          maxGuests: parseInt(formData.rules.maxGuests) || 1
        },
        updatedAt: new Date()
      };

      await updateListing(id, listingData);
      toast.success('Listing updated successfully!');
      navigate(`${ROUTES.HOST_LISTINGS}/${id}`);
    } catch (error) {
      console.error('Update error:', error);
      toast.error(error.message || 'Failed to update listing');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <Loading fullScreen message="Loading listing..." />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="create-listing-page">
        <div className="listing-header">
          <h1>Edit Listing</h1>
          <Button variant="outline" onClick={() => navigate(`${ROUTES.HOST_LISTINGS}/${id}`)}>
            Cancel
          </Button>
        </div>

        <form onSubmit={handleSubmit}>
          <Card title="Basic Information" className="form-section">
            <Input
              label="Title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              error={errors.title}
              required
              fullWidth
            />

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={6}
                className={`form-textarea ${errors.description ? 'error' : ''}`}
                required
              />
              {errors.description && (
                <span className="form-error">{errors.description}</span>
              )}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Category</label>
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
                placeholder="e.g., Apartment, Villa, etc."
                fullWidth
              />
            </div>
          </Card>

          <Card title="Location" className="form-section">
            <div className="form-row">
              <Input
                label="Address"
                name="location.address"
                value={formData.location.address}
                onChange={handleChange}
                fullWidth
              />
              <Input
                label="City"
                name="location.city"
                value={formData.location.city}
                onChange={handleChange}
                error={errors.city}
                required
                fullWidth
              />
            </div>

            <div className="form-row">
              <Input
                label="State/Province"
                name="location.state"
                value={formData.location.state}
                onChange={handleChange}
                fullWidth
              />
              <Input
                label="Country"
                name="location.country"
                value={formData.location.country}
                onChange={handleChange}
                fullWidth
              />
            </div>

            <div className="form-row">
              <Input
                label="Zip Code"
                name="location.zipCode"
                value={formData.location.zipCode}
                onChange={handleChange}
                fullWidth
              />
              <Input
                label="Neighborhood"
                name="location.neighborhood"
                value={formData.location.neighborhood}
                onChange={handleChange}
                fullWidth
              />
            </div>
          </Card>

          <Card title="Pricing" className="form-section">
            <div className="form-row">
              <Input
                label="Base Rate (per night)"
                name="pricing.baseRate"
                type="number"
                value={formData.pricing.baseRate}
                onChange={handleChange}
                error={errors.baseRate}
                required
                min="0"
                step="0.01"
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
                  <option value="PHP">PHP</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <Input
                label="Cleaning Fee"
                name="pricing.cleaningFee"
                type="number"
                value={formData.pricing.cleaningFee}
                onChange={handleChange}
                min="0"
                step="0.01"
                fullWidth
              />
              <Input
                label="Discount (%)"
                name="pricing.discount"
                type="number"
                value={formData.pricing.discount}
                onChange={handleChange}
                min="0"
                max="100"
                fullWidth
              />
            </div>

            <div className="form-row">
              <Input
                label="Minimum Stay (nights)"
                name="pricing.minimumStay"
                type="number"
                value={formData.pricing.minimumStay}
                onChange={handleChange}
                min="1"
                fullWidth
              />
              <Input
                label="Maximum Stay (nights)"
                name="pricing.maximumStay"
                type="number"
                value={formData.pricing.maximumStay || ''}
                onChange={handleChange}
                min="1"
                placeholder="Leave empty for no limit"
                fullWidth
              />
            </div>
          </Card>

          <Card title="Images" className="form-section">
            {errors.images && (
              <div className="error-message" style={{ marginBottom: '1rem' }}>
                {errors.images}
              </div>
            )}

            {/* Existing Images */}
            {existingImages.length > 0 && (
              <div className="existing-images">
                <h4>Current Images</h4>
                <div className="image-preview-grid">
                  {existingImages.map((image, index) => (
                    <div key={index} className="image-preview">
                      <img src={image} alt={`Listing ${index + 1}`} />
                      <button
                        type="button"
                        className="remove-image-btn"
                        onClick={() => removeExistingImage(index)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* New Image Previews */}
            {imagePreviews.length > 0 && (
              <div className="new-images">
                <h4>New Images</h4>
                <div className="image-preview-grid">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="image-preview">
                      <img src={preview} alt={`Preview ${index + 1}`} />
                      <button
                        type="button"
                        className="remove-image-btn"
                        onClick={() => removeImage(index)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Add More Images</label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageChange}
                className="form-input"
                disabled={uploadingImages}
              />
              {uploadingImages && <p>Uploading images...</p>}
            </div>
          </Card>

          <Card title="Amenities" className="form-section">
            <div className="amenities-list">
              {formData.amenities.map((amenity, index) => (
                <div key={index} className="amenity-tag">
                  <span>{amenity}</span>
                  <button
                    type="button"
                    onClick={() => removeAmenity(index)}
                    className="remove-tag-btn"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <div className="add-amenity-form">
              <Input
                label="Add Amenity"
                value={newAmenity}
                onChange={(e) => setNewAmenity(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addAmenity();
                  }
                }}
                placeholder="e.g., WiFi, Pool, Parking"
                fullWidth
              />
              <Button type="button" variant="outline" onClick={addAmenity}>
                Add
              </Button>
            </div>
          </Card>

          <Card title="Rules & Availability" className="form-section">
            <div className="form-row">
              <Input
                label="Max Guests"
                name="rules.maxGuests"
                type="number"
                value={formData.rules.maxGuests}
                onChange={handleChange}
                min="1"
                fullWidth
              />
              <div className="form-group">
                <label className="form-label">Check-in Time</label>
                <input
                  type="time"
                  name="availability.checkInTime"
                  value={formData.availability.checkInTime}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Check-out Time</label>
                <input
                  type="time"
                  name="availability.checkOutTime"
                  value={formData.availability.checkOutTime}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>
            </div>

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

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="availability.instantBook"
                  checked={formData.availability.instantBook}
                  onChange={handleChange}
                />
                Enable Instant Book
              </label>
            </div>

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="rules.petFriendly"
                  checked={formData.rules.petFriendly}
                  onChange={handleChange}
                />
                Pet Friendly
              </label>
            </div>

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="rules.smokingAllowed"
                  checked={formData.rules.smokingAllowed}
                  onChange={handleChange}
                />
                Smoking Allowed
              </label>
            </div>

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="rules.partiesAllowed"
                  checked={formData.rules.partiesAllowed}
                  onChange={handleChange}
                />
                Parties Allowed
              </label>
            </div>

            {/* House Rules */}
            <div className="house-rules-section">
              <label className="form-label">House Rules</label>
              <div className="house-rules-list">
                {formData.rules.houseRules.map((rule, index) => (
                  <div key={index} className="house-rule-item">
                    <span>{rule}</span>
                    <button
                      type="button"
                      onClick={() => removeHouseRule(index)}
                      className="remove-tag-btn"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <div className="add-rule-form">
                <Input
                  value={newHouseRule}
                  onChange={(e) => setNewHouseRule(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addHouseRule();
                    }
                  }}
                  placeholder="e.g., No smoking, No parties after 10pm"
                  fullWidth
                />
                <Button type="button" variant="outline" onClick={addHouseRule}>
                  Add Rule
                </Button>
              </div>
            </div>
          </Card>

          <div className="form-actions">
            <Button
              type="button"
              variant="outline"
              onClick={handleSaveDraft}
              loading={isSavingDraft}
              disabled={isSubmitting}
            >
              Save as Draft
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={isSubmitting}
              disabled={isSavingDraft}
            >
              Update Listing
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default EditListing;

