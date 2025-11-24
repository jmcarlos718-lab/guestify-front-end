/**
 * Guest Profile Page
 * 
 * User profile with wishlist and settings
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../../context/AuthContext';
import { ROUTES } from '../../config/constants';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { toast } from 'react-toastify';
import './Profile.css';

const Profile = () => {
  const navigate = useNavigate();
  const { user, userProfile, updateProfile } = useAuthContext();
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    displayName: '',
    phone: '',
    email: ''
  });

  useEffect(() => {
    if (user && userProfile) {
      setFormData({
        displayName: userProfile.displayName || '',
        phone: userProfile.phone || '',
        email: user?.email || ''
      });
      setLoading(false);
    }
  }, [user, userProfile]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    try {
      await updateProfile({
        displayName: formData.displayName,
        phone: formData.phone
      });
      toast.success('Profile updated successfully');
      setEditMode(false);
    } catch (error) {
      toast.error('Failed to update profile');
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="profile-page">
          <div className="loading-container">Loading...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="profile-page">
        <div className="profile-header">
          <h1>My Profile</h1>
          <Button
            variant={editMode ? 'outline' : 'primary'}
            onClick={() => editMode ? handleSave() : setEditMode(true)}
          >
            {editMode ? 'Save Changes' : 'Edit Profile'}
          </Button>
        </div>

        <div className="profile-content">
          <Card className="profile-card">
            <h2>Personal Information</h2>
            {editMode ? (
              <div className="profile-form">
                <Input
                  label="Full Name"
                  name="displayName"
                  value={formData.displayName}
                  onChange={handleChange}
                  fullWidth
                />
                <Input
                  label="Email"
                  name="email"
                  value={formData.email}
                  disabled
                  fullWidth
                />
                <Input
                  label="Phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  fullWidth
                />
              </div>
            ) : (
              <div className="profile-info">
                <div className="info-item">
                  <strong>Name:</strong> {userProfile?.displayName || 'N/A'}
                </div>
                <div className="info-item">
                  <strong>Email:</strong> {user?.email || 'N/A'}
                </div>
                <div className="info-item">
                  <strong>Phone:</strong> {userProfile?.phone || 'N/A'}
                </div>
              </div>
            )}
          </Card>


          <Card className="profile-card">
            <h2>Quick Actions</h2>
            <div className="quick-actions">
              <Button
                variant="outline"
                onClick={() => navigate(ROUTES.GUEST_BOOKINGS)}
              >
                My Bookings
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate(ROUTES.GUEST_WISHLIST)}
              >
                Wishlist
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate(ROUTES.GUEST_SETTINGS)}
              >
                Settings
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Profile;



