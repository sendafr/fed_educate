import React, { useState, useEffect } from 'react';
import { comparisonAPI } from '../api/api';
import '../styles/comparison.css';

function Comparison() {
  const [comparisons, setComparisons] = useState([]);
  const [formData, setFormData] = useState({
    system_type: 'unitary',
    title: '',
    description: '',
    advantages: [],
    disadvantages: [],
    examples: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [filterType, setFilterType] = useState('');
  const [itemInput, setItemInput] = useState('');
  const [itemType, setItemType] = useState('advantages');

  const SYSTEM_TYPES = {
    unitary: 'Unitary System',
    confederal: 'Confederal System',
    centralized: 'Centralized System',
  };

  useEffect(() => {
    fetchComparisons();
  }, []);

  const fetchComparisons = async (filters = {}) => {
    try {
      setLoading(true);
      const response = await comparisonAPI.getAll(filters);
      setComparisons(response.data.data || []);
      setError('');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to fetch comparisons');
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

  const handleAddItem = () => {
    if (itemInput.trim()) {
      setFormData((prev) => ({
        ...prev,
        [itemType]: [...prev[itemType], itemInput.trim()],
      }));
      setItemInput('');
    }
  };

  const handleRemoveItem = (type, index) => {
    setFormData((prev) => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index),
    }));
  };

  const handleFilterChange = async () => {
    const filters = {};
    if (filterType) filters.system_type = filterType;
    await fetchComparisons(filters);
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
        response = await comparisonAPI.update(editingId, formData);
        setComparisons(comparisons.map((c) => (c.id === editingId ? response.data.data : c)));
        setSuccess('Comparison updated successfully!');
        setEditingId(null);
      } else {
        response = await comparisonAPI.create(formData);
        setComparisons([response.data.data, ...comparisons]);
        setSuccess('Comparison created successfully!');
      }

      // Reset form
      setFormData({
        system_type: 'unitary',
        title: '',
        description: '',
        advantages: [],
        disadvantages: [],
        examples: [],
      });

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save comparison');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (comparison) => {
    setFormData({
      system_type: comparison.system_type,
      title: comparison.title,
      description: comparison.description,
      advantages: comparison.advantages || [],
      disadvantages: comparison.disadvantages || [],
      examples: comparison.examples || [],
    });
    setEditingId(comparison.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this comparison?')) return;

    try {
      await comparisonAPI.delete(id);
      setComparisons(comparisons.filter((c) => c.id !== id));
      setSuccess('Comparison deleted successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to delete comparison');
      console.error(err);
    }
  };

  const getSystemTypeIcon = (type) => {
    const icons = {
      unitary: '🏛️',
      confederal: '🤝',
      centralized: '📍',
    };
    return icons[type] || '⚖️';
  };

  return (
    <div className="comparison-container">
      <h1>⚖️ Governance System Comparisons</h1>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Comparison Form */}
      <div className="comparison-form-section">
        <h2>{editingId ? 'Edit Comparison' : 'Create New Comparison'}</h2>
        <form onSubmit={handleSubmit} className="comparison-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="system_type">System Type *</label>
              <select
                id="system_type"
                name="system_type"
                value={formData.system_type}
                onChange={handleChange}
                required
              >
                {Object.entries(SYSTEM_TYPES).map(([key, label]) => (
                  <option key={key} value={key}>
                    {getSystemTypeIcon(key)} {label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="title">Title *</label>
              <input
                id="title"
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                placeholder="Enter comparison title"
                maxLength="300"
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

          {/* Advantages Section */}
          <div className="items-section">
            <h3>✅ Advantages</h3>
            <div className="items-input">
              <input
                type="text"
                value={itemType === 'advantages' ? itemInput : ''}
                onChange={(e) => {
                  setItemType('advantages');
                  setItemInput(e.target.value);
                }}
                placeholder="Add an advantage"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    setItemType('advantages');
                    handleAddItem();
                  }
                }}
              />
              <button
                type="button"
                onClick={() => {
                  setItemType('advantages');
                  handleAddItem();
                }}
                className="btn btn-secondary"
              >
                Add
              </button>
            </div>
            <div className="items-list">
              {formData.advantages.map((item, index) => (
                <div key={index} className="item-tag">
                  <span>✅ {item}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveItem('advantages', index)}
                    className="btn-remove"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Disadvantages Section */}
          <div className="items-section">
            <h3>⚠️ Disadvantages</h3>
            <div className="items-input">
              <input
                type="text"
                value={itemType === 'disadvantages' ? itemInput : ''}
                onChange={(e) => {
                  setItemType('disadvantages');
                  setItemInput(e.target.value);
                }}
                placeholder="Add a disadvantage"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    setItemType('disadvantages');
                    handleAddItem();
                  }
                }}
              />
              <button
                type="button"
                onClick={() => {
                  setItemType('disadvantages');
                  handleAddItem();
                }}
                className="btn btn-secondary"
              >
                Add
              </button>
            </div>
            <div className="items-list">
              {formData.disadvantages.map((item, index) => (
                <div key={index} className="item-tag warning">
                  <span>⚠️ {item}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveItem('disadvantages', index)}
                    className="btn-remove"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Examples Section */}
          <div className="items-section">
            <h3>🌍 Examples (Countries)</h3>
            <div className="items-input">
              <input
                type="text"
                value={itemType === 'examples' ? itemInput : ''}
                onChange={(e) => {
                  setItemType('examples');
                  setItemInput(e.target.value);
                }}
                placeholder="Add a country example"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    setItemType('examples');
                    handleAddItem();
                  }
                }}
              />
              <button
                type="button"
                onClick={() => {
                  setItemType('examples');
                  handleAddItem();
                }}
                className="btn btn-secondary"
              >
                Add
              </button>
            </div>
            <div className="items-list">
              {formData.examples.map((item, index) => (
                <div key={index} className="item-tag info">
                  <span>🌍 {item}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveItem('examples', index)}
                    className="btn-remove"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : editingId ? 'Update Comparison' : 'Create Comparison'}
            </button>
            {editingId && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setEditingId(null);
                  setFormData({
                    system_type: 'unitary',
                    title: '',
                    description: '',
                    advantages: [],
                    disadvantages: [],
                    examples: [],
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
            <label htmlFor="filterType">System Type</label>
            <select
              id="filterType"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="">All Types</option>
              {Object.entries(SYSTEM_TYPES).map(([key, label]) => (
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
              setFilterType('');
              fetchComparisons();
            }}
            className="btn btn-filter-clear"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Comparison List */}
      <div className="comparison-list-section">
        <h2>All Comparisons</h2>
        {loading && !comparisons.length ? (
          <p className="loading">Loading comparisons...</p>
        ) : comparisons.length > 0 ? (
          <div className="comparison-grid">
            {comparisons.map((comparison) => (
              <div key={comparison.id} className="comparison-card">
                <div className="comparison-header">
                  <span className="system-type-icon">
                    {getSystemTypeIcon(comparison.system_type)}
                  </span>
                  <h3>{comparison.title}</h3>
                </div>

                <div className="comparison-body">
                  <p className="system-type">{SYSTEM_TYPES[comparison.system_type]}</p>
                  <p className="description">{comparison.description}</p>

                  {comparison.advantages && comparison.advantages.length > 0 && (
                    <div className="items-group">
                      <h4>✅ Advantages</h4>
                      <ul>
                        {comparison.advantages.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {comparison.disadvantages && comparison.disadvantages.length > 0 && (
                    <div className="items-group">
                      <h4>⚠️ Disadvantages</h4>
                      <ul>
                        {comparison.disadvantages.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {comparison.examples && comparison.examples.length > 0 && (
                    <div className="items-group">
                      <h4>🌍 Examples</h4>
                      <div className="examples-list">
                        {comparison.examples.map((item, idx) => (
                          <span key={idx} className="example-badge">
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="comparison-actions">
                  <button onClick={() => handleEdit(comparison)} className="btn btn-edit">
                    Edit
                  </button>
                  <button onClick={() => handleDelete(comparison.id)} className="btn btn-delete">
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="no-comparisons">No comparisons available. Create one to get started!</p>
        )}
      </div>
    </div>
  );
}

export default Comparison;