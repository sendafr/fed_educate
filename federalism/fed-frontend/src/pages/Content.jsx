import React, { useState, useEffect } from 'react';
import { contentAPI, sectionAPI } from '../api/api';
import '../styles/content.css';

function Content() {
  const [contents, setContents] = useState([]);
  const [sections, setSections] = useState([]);
  const [formData, setFormData] = useState({
    section: '',
    title: '',
    content_type: 'text',
    description: '',
    text_content: '',
    media_url: '',
    media_file: null,
    order: 0,
    is_published: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [filterSection, setFilterSection] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterPublished, setFilterPublished] = useState('');
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    fetchContents();
    fetchSections();
  }, []);

  const fetchContents = async (filters = {}) => {
    try {
      setLoading(true);
      const response = await contentAPI.getAll(filters);
      setContents(response.data.data || []);
      setError('');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to fetch contents');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSections = async () => {
    try {
      const response = await sectionAPI.getAll();
      setSections(response.data.data || []);
    } catch (err) {
      console.error('Failed to fetch sections:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : name === 'order' ? parseInt(value) : value,
    }));
  };

  const handleFileChange = (e) => {
    const fileList = e.target.files;
    const file = (fileList && fileList) || null;
    if (file) {
      setFormData((prev) => ({ ...prev, media_file: file }));
      // Create preview for videos
      if (file.type.startsWith('video/')) {
        const videoUrl = URL.createObjectURL(file);
        setPreview(videoUrl);
      }
    }
  };

  const handleFilterChange = async () => {
    const filters = {};
    if (filterSection) filters.section_id = filterSection;
    if (filterType) filters.content_type = filterType;
    if (filterPublished) filters.is_published = filterPublished;
    await fetchContents(filters);
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

    if (!formData.section) {
      setError('Section is required');
      setLoading(false);
      return;
    }

    if (!formData.text_content.trim() && !formData.media_url.trim() && !formData.media_file) {
      setError('At least one of text content, media URL, or media file is required');
      setLoading(false);
      return;
    }

    try {
      const submitData = new FormData();
      submitData.append('section', formData.section);
      submitData.append('title', formData.title);
      submitData.append('content_type', formData.content_type);
      submitData.append('description', formData.description);
      submitData.append('text_content', formData.text_content);
      submitData.append('media_url', formData.media_url);
      submitData.append('order', formData.order);
      submitData.append('is_published', formData.is_published);

      if (formData.media_file) {
        submitData.append('media_file', formData.media_file);
      }

      let response;
      if (editingId) {
        response = await contentAPI.update(editingId, submitData);
        setContents(contents.map((c) => (c.id === editingId ? response.data.data : c)));
        setSuccess('Content updated successfully!');
        setEditingId(null);
      } else {
        response = await contentAPI.create(submitData);
        setContents([response.data.data, ...contents]);
        setSuccess('Content created successfully!');
      }

      // Reset form
      setFormData({
        section: '',
        title: '',
        content_type: 'text',
        description: '',
        text_content: '',
        media_url: '',
        media_file: null,
        order: 0,
        is_published: true,
      });
      setPreview(null);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save content');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (content) => {
    setFormData({
      section: content.section,
      title: content.title,
      content_type: content.content_type,
      description: content.description,
      text_content: content.text_content,
      media_url: content.media_url,
      media_file: null,
      order: content.order,
      is_published: content.is_published,
    });
    setEditingId(content.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this content?')) return;

    try {
      await contentAPI.delete(id);
      setContents(contents.filter((c) => c.id !== id));
      setSuccess('Content deleted successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to delete content');
      console.error(err);
    }
  };

  const getContentTypeIcon = (type) => {
    const icons = {
      text: '📝',
      video: '🎥',
      image: '🖼️',
      infographic: '📊',
      chart: '📈',
      map: '🗺️',
      documentary: '🎬',
    };
    return icons[type] || '📄';
  };

  const getContentTypeLabel = (type) => {
    const labels = {
      text: 'Text',
      video: 'Video',
      image: 'Image',
      infographic: 'Infographic',
      chart: 'Chart',
      map: 'Map',
      documentary: 'Documentary',
    };
    return labels[type] || type;
  };

  return (
    <div className="content-container">
      <h1>📚 Content Management</h1>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Content Form */}
      <div className="content-form-section">
        <h2>{editingId ? 'Edit Content' : 'Create New Content'}</h2>
        <form onSubmit={handleSubmit} className="content-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="section">Section *</label>
              <select
                id="section"
                name="section"
                value={formData.section}
                onChange={handleChange}
                required
              >
                <option value="">Select a section</option>
                {sections.map((section) => (
                  <option key={section.id} value={section.id}>
                    {section.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="content_type">Content Type *</label>
              <select
                id="content_type"
                name="content_type"
                value={formData.content_type}
                onChange={handleChange}
                required
              >
                <option value="text">📝 Text</option>
                <option value="video">🎥 Video</option>
                <option value="image">🖼️ Image</option>
                <option value="infographic">📊 Infographic</option>
                <option value="chart">📈 Chart</option>
                <option value="map">🗺️ Map</option>
                <option value="documentary">🎬 Documentary</option>
              </select>
            </div>
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
              placeholder="Enter content title"
              maxLength="300"
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Enter content description"
              rows="2"
            />
          </div>

          <div className="form-group">
            <label htmlFor="text_content">Text Content</label>
            <textarea
              id="text_content"
              name="text_content"
              value={formData.text_content}
              onChange={handleChange}
              placeholder="Enter text content"
              rows="6"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="media_url">Media URL</label>
              <input
                id="media_url"
                type="url"
                name="media_url"
                value={formData.media_url}
                onChange={handleChange}
                placeholder="https://example.com/media"
              />
            </div>

            <div className="form-group">
              <label htmlFor="media_file">Media File</label>
              <input
                id="media_file"
                type="file"
                name="media_file"
                onChange={handleFileChange}
                accept="video/*,image/*,.pdf"
              />
            </div>
          </div>

          {/* File Preview */}
          {preview && (
            <div className="preview-section">
              <h4>Video Preview</h4>
              <video src={preview} controls width="100%" className="video-preview" />
            </div>
          )}

          <div className="form-row">
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

            <div className="form-group checkbox">
              <label htmlFor="is_published">
                <input
                  id="is_published"
                  type="checkbox"
                  name="is_published"
                  checked={formData.is_published}
                  onChange={handleChange}
                />
                <span>Publish Content</span>
              </label>
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : editingId ? 'Update Content' : 'Create Content'}
            </button>
            {editingId && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setEditingId(null);
                  setFormData({
                    section: '',
                    title: '',
                    content_type: 'text',
                    description: '',
                    text_content: '',
                    media_url: '',
                    media_file: null,
                    order: 0,
                    is_published: true,
                  });
                  setPreview(null);
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
            <label htmlFor="filterSection">Section</label>
            <select
              id="filterSection"
              value={filterSection}
              onChange={(e) => setFilterSection(e.target.value)}
            >
              <option value="">All Sections</option>
              {sections.map((section) => (
                <option key={section.id} value={section.id}>
                  {section.title}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="filterType">Content Type</label>
            <select
              id="filterType"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="">All Types</option>
              <option value="text">Text</option>
              <option value="video">Video</option>
              <option value="image">Image</option>
              <option value="infographic">Infographic</option>
              <option value="chart">Chart</option>
              <option value="map">Map</option>
              <option value="documentary">Documentary</option>
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
              setFilterSection('');
              setFilterType('');
              setFilterPublished('');
              fetchContents();
            }}
            className="btn btn-filter-clear"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Content List */}
      <div className="content-list-section">
        <h2>All Contents</h2>
        {loading && !contents.length ? (
          <p className="loading">Loading contents...</p>
        ) : contents.length > 0 ? (
          <div className="content-grid">
            {contents.map((content) => (
              <div key={content.id} className="content-card">
                <div className="content-header">
                  <span className="content-type-icon">{getContentTypeIcon(content.content_type)}</span>
                  <span className={`status-badge ${content.is_published ? 'published' : 'draft'}`}>
                    {content.is_published ? '✓ Published' : '✗ Draft'}
                  </span>
                </div>

                <div className="content-body">
                  <h3>{content.title}</h3>
                  <p className="content-type">{getContentTypeLabel(content.content_type)}</p>
                  
                  {content.description && (
                    <p className="description">{content.description}</p>
                  )}

                  {content.section_title && (
                    <p className="section">
                      <strong>Section:</strong> {content.section_title}
                    </p>
                  )}

                  {content.text_content && (
                    <div className="text-preview">
                      <p>{content.text_content.substring(0, 150)}...</p>
                    </div>
                  )}

                  {content.media_url && (
                    <p className="media-url">
                      <strong>Media:</strong>{' '}
                      <a href={content.media_url} target="_blank" rel="noopener noreferrer">
                        View Media
                      </a>
                    </p>
                  )}

                  {content.media_file && (
                    <p className="media-file">
                      <strong>File:</strong>{' '}
                      <a href={content.media_file} target="_blank" rel="noopener noreferrer">
                        Download
                      </a>
                    </p>
                  )}

                  <div className="content-meta">
                    <small>Order: {content.order}</small>
                    <small>Created: {new Date(content.created_at).toLocaleDateString()}</small>
                  </div>
                </div>

                <div className="content-actions">
                  <button onClick={() => handleEdit(content)} className="btn btn-edit">
                    Edit
                  </button>
                  <button onClick={() => handleDelete(content.id)} className="btn btn-delete">
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="no-content">No contents available. Create one to get started!</p>
        )}
      </div>
    </div>
  );
}

export default Content;