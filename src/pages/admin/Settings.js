/**
 * Admin Settings Page
 * 
 * Allows admins to update their profile information and password
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../../context/AuthContext';
import { updateUserPassword } from '../../services/authService';
import { uploadFile } from '../../services/storageService';
import { ROUTES } from '../../config/constants';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { toast } from 'react-toastify';
import '../guest/Settings.css';

const Settings = () => {
  const navigate = useNavigate();
  const { user, userProfile, adminProfile, updateProfile } = useAuthContext();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  
  // Use adminProfile if available, otherwise use userProfile
  const currentProfile = adminProfile || userProfile;
  
  // Profile form state
  const [profileData, setProfileData] = useState({
    displayName: '',
    phone: '',
    age: ''
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Password form state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (currentProfile) {
      setProfileData({
        displayName: currentProfile.displayName || '',
        phone: currentProfile.phone || '',
        age: currentProfile.age || ''
      });
      setAvatarPreview(currentProfile.photoURL || '');
    }
  }, [currentProfile]);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let photoURL = currentProfile?.photoURL || '';
      const uid = user?.uid || currentProfile?.id || currentProfile?.uid;
      if (photoFile && uid) {
        setUploadingPhoto(true);
        photoURL = await uploadFile(photoFile, `users/${uid}/avatar/`);
        setUploadingPhoto(false);
      }

      const updates = {
        displayName: profileData.displayName.trim(),
        phone: profileData.phone.trim(),
        age: profileData.age ? parseInt(profileData.age) : null,
        photoURL
      };

      // If admin is using separate auth, we might need different update logic
      // For now, use the same updateProfile function
      await updateProfile(updates);
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        toast.error('New passwords do not match');
        setLoading(false);
        return;
      }

      if (passwordData.newPassword.length < 6) {
        toast.error('Password must be at least 6 characters');
        setLoading(false);
        return;
      }

      await updateUserPassword(passwordData.currentPassword, passwordData.newPassword);
      toast.success('Password updated successfully');
      
      // Reset password form
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      toast.error(error.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  const currentUser = user || (adminProfile ? { email: adminProfile.email } : null);

  return (
    <DashboardLayout>
      <div className="settings-page">
        <div className="settings-header">
          <h1>Settings</h1>
          <p>Manage your account information and preferences</p>
        </div>

        <div className="settings-tabs">
          <button
            className={`tab-button ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            Profile Information
          </button>
          <button
            className={`tab-button ${activeTab === 'password' ? 'active' : ''}`}
            onClick={() => setActiveTab('password')}
          >
            Change Password
          </button>
        </div>

        <div className="settings-content">
          {activeTab === 'profile' && (
            <Card className="settings-card">
              <h2>Profile Information</h2>
              <div className="avatar-upload">
                <div className="avatar-circle">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Profile" />
                  ) : (
                    <span className="avatar-initial">
                      {(profileData.displayName || currentUser?.email || 'U').charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <label className="avatar-button">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setPhotoFile(file);
                        setAvatarPreview(URL.createObjectURL(file));
                      }
                    }}
                  />
                  {uploadingPhoto ? 'Uploading...' : 'Change Photo'}
                </label>
              </div>
              <form onSubmit={handleUpdateProfile}>
                <div className="form-group">
                  <Input
                    label="Full Name"
                    name="displayName"
                    type="text"
                    value={profileData.displayName}
                    onChange={handleProfileChange}
                    required
                    fullWidth
                  />
                </div>

                <div className="form-group">
                  <Input
                    label="Email"
                    name="email"
                    type="email"
                    value={currentUser?.email || ''}
                    disabled
                    fullWidth
                  />
                  <small className="form-hint">Email cannot be changed</small>
                </div>

                <div className="form-group">
                  <Input
                    label="Phone Number"
                    name="phone"
                    type="tel"
                    value={profileData.phone}
                    onChange={handleProfileChange}
                    placeholder="+1234567890"
                    fullWidth
                  />
                </div>

                <div className="form-group">
                  <Input
                    label="Age"
                    name="age"
                    type="number"
                    value={profileData.age}
                    onChange={handleProfileChange}
                    min="1"
                    max="120"
                    placeholder="Enter your age"
                    fullWidth
                  />
                </div>

                <div className="form-actions">
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={loading}
                    fullWidth
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {activeTab === 'password' && (
            <Card className="settings-card">
              <h2>Change Password</h2>
              <form onSubmit={handleUpdatePassword}>
                <div className="form-group">
                  <Input
                    label="Current Password"
                    name="currentPassword"
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    required
                    fullWidth
                  />
                </div>

                <div className="form-group">
                  <Input
                    label="New Password"
                    name="newPassword"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    required
                    minLength={6}
                    fullWidth
                  />
                  <small className="form-hint">Password must be at least 6 characters</small>
                </div>

                <div className="form-group">
                  <Input
                    label="Confirm New Password"
                    name="confirmPassword"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    required
                    minLength={6}
                    fullWidth
                  />
                </div>

                <div className="form-actions">
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={loading}
                    fullWidth
                  >
                    {loading ? 'Updating...' : 'Update Password'}
                  </Button>
                </div>
              </form>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Settings;





