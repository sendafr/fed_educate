import React, { useState, useEffect } from 'react';
import { userAPI } from '../api/api';
import '../styles/profile.css';

function Profile() {
  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await userAPI.getProfile();
      const userData = response.data.data;
      setProfile(userData);
      setFormData({
        first_name: userData.first_name || '',
        last_name: userData.last_name || '',
        email: userData.email || '',
      });
      setError('');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to fetch profile');
      console.error('Profile fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await userAPI.updateProfile(formData);
      setProfile(response.data.data);
      setSuccess('Profile updated successfully!');
      setIsEditing(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update profile');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you sure? This action cannot be undone.')) return;

    try {
      setLoading(true);
      await userAPI.deleteAccount();
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      window.location.href = '/login';
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete account');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !profile) {
    return <div className="profile-container"><p>Loading profile...</p></div>;
  }

  return (
    <div className="profile-container">
      <h1>👤 My Profile</h1>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {profile && (
        <>
          <div className="profile-info">
            <h2>Account Information</h2>
            <div className="info-grid">
              <div className="info-item">
                <label>Username</label>
                <p>{profile.username}</p>
              </div>
              <div className="info-item">
                <label>Email</label>
                <p>{profile.email}</p>
              </div>
              <div className="info-item">
                <label>Member Since</label>
                <p>{new Date(profile.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          {isEditing ? (
            <div className="profile-form">
              <h2>Edit Profile</h2>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="first_name">First Name</label>
                  <input
                    id="first_name"
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    placeholder="Enter first name"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="last_name">Last Name</label>
                  <input
                    id="last_name"
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    placeholder="Enter last name"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input
                    id="email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter email"
                  />
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setIsEditing(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="profile-actions">
              <button
                className="btn btn-primary"
                onClick={() => setIsEditing(true)}
              >
                Edit Profile
              </button>
              <button
                className="btn btn-danger"
                onClick={handleDeleteAccount}
              >
                Delete Account
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Profile;