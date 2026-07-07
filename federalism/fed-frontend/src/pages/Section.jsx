import React, { useState, useEffect } from 'react';
import { sectionAPI } from '../api/api';
import '../styles/section.css';

function Section() {
  const [sections, setSections] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    section_type: 'what_is',
    description: '',
    order: 0,
    is_published: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [filterType, setFilterType] = useState('');
  const [filterPublished, setFilterPublished] = useState('');

  const SECTION_TYPES = {
    what_is: 'What is Federalism?',
    benefits: 'Benefits',
    drawbacks: 'Drawbacks',
    comparisons: 'Comparisons',
    case_studies: 'Case Studies',
    quiz: 'Quiz/Assessment',
  };

  useEffect(() => {
    fetchSections();
  }, []);

  const fetchSections = async (filters = {}) => {
    try {
      setLoading(true);
      const response = await sectionAPI.getAll(filters);
      setSections(response.data.data || []);
      setError('');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to fetch sections');
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
    if (filterType) filters.section_type = filterType;
    if (filterPublished) filters.is_published = filterPublished;
    await fetchSections(filters);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Validate required fields
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
        response = await sectionAPI.update(editingId, formData);
        setSections(sections.map((s) => (s.id === editingId ? response.data.data : s)));
        setSuccess('Section updated successfully!');
        setEditingId(null);
      } else {
        response = await sectionAPI.create(formData);
        setSections([response.data.data, ...sections]);
        setSuccess('Section created successfully!');
      }

      // Reset form
      setFormData({
        title: '',
        section_type: 'what_is',
        description: '',
        order: 0,
        is_published: true,
      });

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save section');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (section) => {
    setFormData({
      title: section.title,
      section_type: section.section_type,
      description: section.description,
      order: section.order,
      is_published: section.is_published,
    });
    setEditingId(section.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this section?')) return;

    try {
      await sectionAPI.delete(id);
      setSections(sections.filter((s) => s.id !== id));
      setSuccess('Section deleted successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to delete section');
      console.error(err);
    }
  };

  const getSectionTypeIcon = (type) => {
    const icons = {
      what_is: '❓',
      benefits: '✅',
      drawbacks: '⚠️',
      comparisons: '⚖️',
      case_studies: '📖',
      quiz: '📝',
    };
    return icons[type] || '📌';
  };

  return (
    <div className="section-container">
      <h1>📚 Section Management</h1>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Section Form */}
      <div className="section-form-section">
        <h2>{editingId ? 'Edit Section' : 'Create New Section'}</h2>
        <form onSubmit={handleSubmit} className="section-form">
          <div className="form-group">
            <label htmlFor="title">Title *</label>
            <input
              id="title"
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              placeholder="Enter section title"
              maxLength="200"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="section_type">Section Type *</label>
              <select
                id="section_type"
                name="section_type"
                value={formData.section_type}
                onChange={handleChange}
                required
              >
                {Object.entries(SECTION_TYPES).map(([key, label]) => (
                  <option key={key} value={key}>
                    {getSectionTypeIcon(key)} {label}
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
              placeholder="Enter section description"
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
              <span>Publish Section</span>
            </label>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : editingId ? 'Update Section' : 'Create Section'}
            </button>
            {editingId && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setEditingId(null);
                  setFormData({
                    title: '',
                    section_type: 'what_is',
                    description: '',
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
            <label htmlFor="filterType">Section Type</label>
            <select
              id="filterType"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="">All Types</option>
              {Object.entries(SECTION_TYPES).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="filterPublished">Status</label>
            <select
              id="filterPublished"
              value={filterPublished}
              onChange={(e) => setFilterPublished(e.target.value)}
            >
              <option value="">All</option>
              <option value="true">Published</option>
              <option value="false">Draft</option>
            </select>
          </div>

          <button onClick={handleFilterChange} className="btn btn-filter">
            Apply Filters
          </button>
          <button
            onClick={() => {
              setFilterType('');
              setFilterPublished('');
              fetchSections();
            }}
            className="btn btn-filter-clear"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Section List */}
      <div className="section-list-section">
        <h2>All Sections</h2>
        {loading && !sections.length ? (
          <p className="loading">Loading sections...</p>
        ) : sections.length > 0 ? (
          <div className="section-grid">
            {sections.map((section) => (
              <div key={section.id} className="section-card">
                <div className="section-header">
                  <span className="section-type-icon">
                    {getSectionTypeIcon(section.section_type)}
                  </span>
                  <span className={`status-badge ${section.is_published ? 'published' : 'draft'}`}>
                    {section.is_published ? '✓ Published' : '✗ Draft'}
                  </span>
                </div>

                <div className="section-body">
                  <h3>{section.title}</h3>
                  <p className="section-type">{SECTION_TYPES[section.section_type]}</p>
                  <p className="description">{section.description}</p>

                  {section.contents && section.contents.length > 0 && (
                    <div className="contents-info">
                      <strong>Contents:</strong> {section.contents.length} item(s)
                    </div>
                  )}

                  <div className="section-meta">
                    <small>Order: {section.order}</small>
                    <small>Created: {new Date(section.created_at).toLocaleDateString()}</small>
                  </div>
                </div>

                <div className="section-actions">
                  <button onClick={() => handleEdit(section)} className="btn btn-edit">
                    Edit
                  </button>
                  <button onClick={() => handleDelete(section.id)} className="btn btn-delete">
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="no-sections">No sections available. Create one to get started!</p>
        )}
      </div>
    </div>
  );
}

export default Section;