import React, { useState, useEffect } from 'react';
import { benefitAPI } from '../api/api';
import '../styles/benefits.css';

function Benefits() {
  const [benefits, setBenefits] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'political',
    icon: '',
    order: 0,
    is_published: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [filterCategory, setFilterCategory] = useState('');

  const CATEGORIES = {
    political: 'Political',
    economic: 'Economic',
    social: 'Social',
    administrative: 'Administrative',
  };

  const ICONS = {
    political: '🏛️',
    economic: '💰',
    social: '👥',
    administrative: '📋',
  };

  useEffect(() => {
    fetchBenefits();
  }, []);

  const fetchBenefits = async (filters = {}) => {
    try {
      setLoading(true);
      const response = await benefitAPI.getAll(filters);
      setBenefits(response.data.data || []);
      setError('');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to fetch benefits');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : name === 'order' ? parseInt(value) : value,
    }));
  };

  const handleFilterChange = async () => {
    const filters = {};
    if (filterCategory) filters.category = filterCategory;
    await fetchBenefits(filters);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (!formData.title.trim()) {
      setError('Title is required');
      setLoading(false);
      return;
    }

    if (!formData.description.trim()) {
      setError('Description is required');
      setLoading(false);
      return;
    }

    try {
      let response;
      if (editingId) {
        response = await benefitAPI.update(editingId, formData);
        setBenefits(benefits.map((b) => (b.id === editingId ? response.data.data : b)));
        setSuccess('Benefit updated successfully!');
        setEditingId(null);
      } else {
        response = await benefitAPI.create(formData);
        setBenefits([response.data.data, ...benefits]);
        setSuccess('Benefit created successfully!');
      }

      setFormData({
        title: '',
        description: '',
        category: 'political',
        icon: '',
        order: 0,
        is_published: true,
      });

      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save benefit');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (benefit) => {
    setFormData(benefit);
    setEditingId(benefit.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure?')) return;

    try {
      await benefitAPI.delete(id);
      setBenefits(benefits.filter((b) => b.id !== id));
      setSuccess('Benefit deleted successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to delete benefit');
      console.error(err);
    }
  };

  return (
    <div className="benefits-container">
      <h1>✅ Benefits of Federalism</h1>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Form */}
      <div className="benefits-form-section">
        <h2>{editingId ? 'Edit Benefit' : 'Add New Benefit'}</h2>
        <form onSubmit={handleSubmit} className="benefits-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="title">Title *</label>
              <input
                id="title"
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                placeholder="Enter benefit title"
                maxLength="300"
              />
            </div>

            <div className="form-group">
              <label htmlFor="category">Category *</label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
              >
                {Object.entries(CATEGORIES).map(([key, label]) => (
                  <option key={key} value={key}>
                    {ICONS[key]} {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="description">Description *</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              placeholder="Enter detailed description"
              rows="4"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="icon">Icon (emoji or class)</label>
              <input
                id="icon"
                type="text"
                name="icon"
                value={formData.icon}
                onChange={handleChange}
                placeholder="e.g., ✅ or icon-class"
                maxLength="50"
              />
            </div>

            <div className="form-group">
              <label htmlFor="order">Order</label>
              <input
                id="order"
                type="number"
                name="order"
                value={formData.order}
                onChange={handleChange}
                min="0"
              />
            </div>
          </div>

          <div className="form-group checkbox">
            <label htmlFor="is_published">
              <input
                id="is_published"
                type="checkbox"
                name="is_published"
                checked={formData.is_published}
                onChange={handleChange}
              />
              <span>Publish Benefit</span>
            </label>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : editingId ? 'Update Benefit' : 'Add Benefit'}
            </button>
            {editingId && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setEditingId(null);
                  setFormData({
                    title: '',
                    description: '',
                    category: 'political',
                    icon: '',
                    order: 0,
                    is_published: true,
                  });
                }}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <h2>Filters</h2>
        <div className="filters">
          <div className="filter-group">
            <label htmlFor="filterCategory">Category</label>
            <select
              id="filterCategory"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="">All Categories</option>
              {Object.entries(CATEGORIES).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <button onClick={handleFilterChange} className="btn btn-filter">
            Apply Filters
          </button>
          <button
            onClick={() => {
              setFilterCategory('');
              fetchBenefits();
            }}
            className="btn btn-filter-clear"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Benefits List */}
      <div className="benefits-list-section">
        <h2>All Benefits</h2>
        {loading && !benefits.length ? (
          <p className="loading">Loading benefits...</p>
        ) : benefits.length > 0 ? (
          <div className="benefits-grid">
            {benefits.map((benefit) => (
              <div key={benefit.id} className="benefit-card">
                <div className="benefit-header">
                  <span className="benefit-icon">
                    {benefit.icon || ICONS[benefit.category]}
                  </span>
                  <span className={`status-badge ${benefit.is_published ? 'published' : 'draft'}`}>
                    {benefit.is_published ? '✓' : '✗'}
                  </span>
                </div>

                <div className="benefit-body">
                  <h3>{benefit.title}</h3>
                  <p className="category">{CATEGORIES[benefit.category]}</p>
                  <p className="description">{benefit.description}</p>

                  <div className="benefit-meta">
                    <small>Order: {benefit.order}</small>
                    <small>Created: {new Date(benefit.created_at).toLocaleDateString()}</small>
                  </div>
                </div>

                <div className="benefit-actions">
                  <button onClick={() => handleEdit(benefit)} className="btn btn-edit">
                    Edit
                  </button>
                  <button onClick={() => handleDelete(benefit.id)} className="btn btn-delete">
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="no-benefits">No benefits available.</p>
        )}
      </div>
    </div>
  );
}

export default Benefits;