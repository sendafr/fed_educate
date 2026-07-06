import React, { useState, useEffect } from 'react';
import { caseStudyAPI } from '../api/api';
import '../styles/caseStudy.css';

function CaseStudy() {
  const [caseStudies, setCaseStudies] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    country: '',
    description: '',
    key_points: [],
    image: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [filterCountry, setFilterCountry] = useState('');
  const [pointInput, setPointInput] = useState('');
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    fetchCaseStudy();
  }, []);

  const fetchCaseStudy = async (filters = {}) => {
    try {
      setLoading(true);
      const response = await caseStudyAPI.getAll(filters);
      setCaseStudies(response.data.data || []);
      setError('');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to fetch case studies');
      console.error(err);
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

  const handleImageChange = (e) => {
  const file = e.target.files?.[0];  // ✅ Get first file, not FileList
  if (file) {
    setFormData((prev) => ({ ...prev, image: file }));
    const imageUrl = URL.createObjectURL(file);
    setImagePreview(imageUrl);
  }
};

  const handleAddPoint = () => {
    if (pointInput.trim()) {
      setFormData((prev) => ({
        ...prev,
        key_points: [...prev.key_points, pointInput.trim()],
      }));
      setPointInput('');
    }
  };

  const handleRemovePoint = (index) => {
    setFormData((prev) => ({
      ...prev,
      key_points: prev.key_points.filter((_, i) => i !== index),
    }));
  };

  const handleFilterChange = async () => {
    const filters = {};
    if (filterCountry) filters.country = filterCountry;
    await fetchCaseStudy(filters);
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

  if (!formData.country.trim()) {
    setError('Country is required');
    setLoading(false);
    return;
  }

  if (!formData.description.trim()) {
    setError('Description is required');
    setLoading(false);
    return;
  }

  try {
    const submitData = new FormData();
    submitData.append('title', formData.title);
    submitData.append('country', formData.country);
    submitData.append('description', formData.description);

    // Send key_points as JSON string
    submitData.append('key_points', JSON.stringify(formData.key_points));

    // Only add image if it's a File object (not a string URL)
    if (formData.image && typeof formData.image === 'object' && formData.image instanceof File) {
      submitData.append('image', formData.image);
    }

    let response;
    if (editingId) {
      response = await caseStudyAPI.update(editingId, submitData);
      setCaseStudies(caseStudies.map((cs) => (cs.id === editingId ? response.data.data : cs)));
      setSuccess('Case study updated successfully!');
      setEditingId(null);
    } else {
      response = await caseStudyAPI.create(submitData);
      setCaseStudies([response.data.data, ...caseStudies]);
      setSuccess('Case study created successfully!');
    }

    // Reset form
    setFormData({
      title: '',
      country: '',
      description: '',
      key_points: [],
      image: null,
    });
    setImagePreview(null);

    setTimeout(() => setSuccess(''), 3000);
  } catch (err) {
    console.error('Full error:', err.response?.data);
    setError(err.response?.data?.detail || JSON.stringify(err.response?.data) || 'Failed to save case study');
  } finally {
    setLoading(false);
  }
};
 const handleEdit = (caseStudy) => {
    setFormData({
      title: caseStudy.title,
      country: caseStudy.country,
      description: caseStudy.description,
      key_points: caseStudy.key_points || [],
      image: null,
    });
    if (caseStudy.image) {
      setImagePreview(caseStudy.image);
    }
    setEditingId(caseStudy.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this case study?')) return;

    try {
      await caseStudyAPI.delete(id);
      setCaseStudies(caseStudies.filter((cs) => cs.id !== id));
      setSuccess('Case study deleted successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to delete case study');
      console.error(err);
    }
  };

  return (
    <div className="case-study-container">
      <h1>📖 Case Studies</h1>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Case Study Form */}
      <div className="case-study-form-section">
        <h2>{editingId ? 'Edit Case Study' : 'Create New Case Study'}</h2>
        <form onSubmit={handleSubmit} className="case-study-form" encType='multipart/form-data'>
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
                placeholder="Enter case study title"
                maxLength="300"
              />
            </div>

            <div className="form-group">
              <label htmlFor="country">Country *</label>
              <input
                id="country"
                type="text"
                name="country"
                value={formData.country}
                onChange={handleChange}
                required
                placeholder="Enter country name"
                maxLength="100"
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
              rows="5"
            />
          </div>

          {/* Key Points Section */}
          <div className="items-section">
            <h3>📌 Key Points</h3>
            <div className="items-input">
              <input
                type="text"
                value={pointInput}
                onChange={(e) => setPointInput(e.target.value)}
                placeholder="Add a key point"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddPoint();
                  }
                }}
              />
              <button
                type="button"
                onClick={handleAddPoint}
                className="btn btn-secondary"
              >
                Add
              </button>
            </div>
            <div className="items-list">
              {formData.key_points.map((point, index) => (
                <div key={index} className="item-tag">
                  <span>📌 {point}</span>
                  <button
                    type="button"
                    onClick={() => handleRemovePoint(index)}
                    className="btn-remove"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Image Upload */}
          <div className="form-group">
            <label htmlFor="image">Image</label>
            <input
              id="image"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
            />
          </div>

          {/* Image Preview */}
          {imagePreview && (
            <div className="preview-section">
              <h4>Image Preview</h4>
              <img src={imagePreview} alt="Preview" className="image-preview" />
            </div>
          )}

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : editingId ? 'Update Case Study' : 'Create Case Study'}
            </button>
            {editingId && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setEditingId(null);
                  setFormData({
                    title: '',
                    country: '',
                    description: '',
                    key_points: [],
                    image: null,
                  });
                  setImagePreview(null);
                }}
              >
                Cancel
              </button>
   
            )}
          </div>
                     {CaseStudy.image && (
  <div className="case-study-image">
    <img 
      src={CaseStudy.image}  // ✅ This is the full URL from server
      alt={CaseStudy.title} 
    />
  </div>
)}
        </form>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <h2>Filters</h2>
        <div className="filters">
          <div className="filter-group">
            <label htmlFor="filterCountry">Country</label>
            <input
              id="filterCountry"
              type="text"
              value={filterCountry}
              onChange={(e) => setFilterCountry(e.target.value)}
              placeholder="Search by country"
            />
          </div>

          <button onClick={handleFilterChange} className="btn btn-filter">
            Apply Filters
          </button>
          <button
            onClick={() => {
              setFilterCountry('');
              fetchCaseStudy();
            }}
            className="btn btn-filter-clear"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Case Study List */}
      <div className="case-study-list-section">
        <h2>All Case Studies</h2>
        {loading && !caseStudies.length ? (
          <p className="loading">Loading case studies...</p>
        ) : caseStudies.length > 0 ? (
          <div className="case-study-grid">
            {caseStudies.map((caseStudy) => (
              <div key={caseStudy.id} className="case-study-card">
                {caseStudy.image && (
                  <div className="case-study-image">
                    <img src={caseStudy.image} alt={caseStudy.title} />
                  </div>
                )}

                <div className="case-study-body">
                  <h3>{caseStudy.title}</h3>
                  <p className="country">🌍 {caseStudy.country}</p>
                  <p className="description">{caseStudy.description}</p>

                  {caseStudy.key_points && caseStudy.key_points.length > 0 && (
                    <div className="key-points">
                      <h4>📌 Key Points</h4>
                      <ul>
                        {caseStudy.key_points.map((point, idx) => (
                          <li key={idx}>{point}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="case-study-meta">
                    <small>Created: {new Date(caseStudy.created_at).toLocaleDateString()}</small>
                  </div>
                </div>

                <div className="case-study-actions">
                  <button onClick={() => handleEdit(caseStudy)} className="btn btn-edit">
                    Edit
                  </button>
                  <button onClick={() => handleDelete(caseStudy.id)} className="btn btn-delete">
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="no-case-studies">No case studies available. Create one to get started!</p>
        )}
      </div>
    </div>
  );
}

export default CaseStudy;