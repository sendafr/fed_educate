import React, { useState, useEffect } from 'react';
import { drawbackAPI } from '../api/api';
import '../styles/drawbacks.css';

function Drawbacks() {
  const [drawbacks, setDrawbacks] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'political',
    severity: 'medium',
    icon: '',
    order: 0,
    is_published: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [filterCategory, setFilterCategory] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('');

  const CATEGORIES = {
    political: 'Political',
    economic: 'Economic',
    social: 'Social',
    administrative: 'Administrative',
  };

  const SEVERITIES = {
    low: 'Low',
    medium: 'Medium',
    high: 'High',
  };

  const ICONS = {
    political: '⚠️',
    economic: '💸',
    social: '⚡',
    administrative: '📍',
  };

  useEffect(() => {
    fetchDrawbacks();
  }, []);

  const fetchDrawbacks = async (filters = {}) => {
    try {
      setLoading(true);
      const response = await drawbackAPI.getAll(filters);
      setDrawbacks(response.data.data || []);
      setError('');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to fetch drawbacks');
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
    if (filterSeverity) filters.severity = filterSeverity;
    await fetchDrawbacks(filters);
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
        response = await drawbackAPI.update(editingId, formData);
        setDrawbacks(drawbacks.map((d) => (d.id === editingId ? response.data.data : d)));
        setSuccess('Drawback updated successfully!');
        setEditingId(null);
      } else {
        response = await drawbackAPI.create(formData);
        setDrawbacks([response.data.data, ...drawbacks]);
        setSuccess('Drawback created successfully!');
      }

      setFormData({
        title: '',
        description: '',
        category: 'political',
        severity: 'medium',
        icon: '',
        order: 0,
        is_published: true,
      });

      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save drawback');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (drawback) => {
    setFormData(drawback);
    setEditingId(drawback.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure?')) return;

    try {
      await drawbackAPI.delete(id);
      setDrawbacks(drawbacks.filter((d) => d.id !== id));
      setSuccess('Drawback deleted successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to delete drawback');
      console.error(err);
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'low':
        return '#ffc107';
      case 'medium':
        return '#ff9800';
      case 'high':
        return '#dc3545';
      default:
        return '#6c757d';
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      title: '',
      description: '',
      category: 'political',
      severity: 'medium',
      icon: '',
      order: 0,
      is_published: true,
    });
  };

  return (
    <div className="drawbacks-container">
      <h1>⚠️ Drawbacks of Federalism</h1>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Form */}
      <div className="drawbacks-form-section">
        <h2>{editingId ? 'Edit Drawback' : 'Add New Drawback'}</h2>
        <form onSubmit={handleSubmit} className="drawbacks-form">
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
                placeholder="Enter drawback title"
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

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="severity">Severity *</label>
              <select
                id="severity"
                name="severity"
                value={formData.severity}
                onChange={handleChange}
              >
                {Object.entries(SEVERITIES).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
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

          <div className="form-group checkbox">
            <label htmlFor="is_published">
              <input
                id="is_published"
                type="checkbox"
                name="is_published"
                checked={formData.is_published}
                onChange={handleChange}
              />
              <span>Publish Drawback</span>
            </label>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : editingId ? 'Update Drawback' : 'Add Drawback'}
            </button>
            {editingId && (
              <button type="button" className="btn btn-secondary" onClick={resetForm}>
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

          <div className="filter-group">
            <label htmlFor="filterSeverity">Severity</label>
            <select
              id="filterSeverity"
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
            >
              <option value="">All Severities</option>
              {Object.entries(SEVERITIES).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <button className="btn btn-secondary" onClick={handleFilterChange} disabled={loading}>
            Apply Filters
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => {
              setFilterCategory('');
              setFilterSeverity('');
              fetchDrawbacks();
            }}
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Drawbacks List */}
      <div className="drawbacks-list-section">
        <h2>Drawbacks ({drawbacks.length})</h2>
        {loading && <p className="loading">Loading...</p>}
        {!loading && drawbacks.length === 0 && <p className="no-data">No drawbacks found</p>}
        {!loading && drawbacks.length > 0 && (
          <div className="drawbacks-grid">
            {drawbacks.map((drawback) => (
              <div key={drawback.id} className="drawback-card">
                <div className="drawback-header">
                  <h3>{ICONS[drawback.category]} {drawback.title}</h3>
                  <span
                    className="severity-badge"
                    style={{ backgroundColor: getSeverityColor(drawback.severity) }}
                  >
                    {SEVERITIES[drawback.severity]}
                  </span>
                </div>
                <p className="drawback-description">{drawback.description}</p>
                <div className="drawback-meta">
                  <span className="category">{CATEGORIES[drawback.category]}</span>
                  <span className="status">{drawback.is_published ? '✓ Published' : '○ Draft'}</span>
                </div>
                <div className="drawback-actions">
                  <button className="btn btn-sm btn-primary" onClick={() => handleEdit(drawback)}>
                    Edit
                  </button>
                  <button className="btn btn-sm btn-danger" onClick={() => handleDelete(drawback.id)}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Drawbacks;