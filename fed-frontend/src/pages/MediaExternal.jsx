import React, { useState, useEffect } from 'react';
import { mediaExternalAPI } from '../api/api';
import '../styles/media.css';

function MediaExternal() {
  const [externalMedia, setExternalMedia] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [previewMedia, setPreviewMedia] = useState(null);
  const [filterSource, setFilterSource] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterMediaType, setFilterMediaType] = useState('');

  const [formData, setFormData] = useState({
    source_type: 'youtube',
    media_type: 'video',
    external_url: '',
    embed_url: '',
    title: '',
    description: '',
    thumbnail_url: '',
    duration: '',
    status: 'draft',
    is_featured: false,
  });

  useEffect(() => {
    fetchExternalMedia();
  }, []);

  useEffect(() => {
    const params = {};
    if (filterSource) params.source_type = filterSource;
    if (filterStatus) params.status = filterStatus;
    if (filterMediaType) params.media_type = filterMediaType;
    fetchExternalMedia(params);
  }, [filterSource, filterStatus, filterMediaType]);

  const fetchExternalMedia = async (params = {}) => {
    setLoading(true);
    try {
      const response = await mediaExternalAPI.getAll(params);
      setExternalMedia(response.data.data || []);
      setError('');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load external media.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      source_type: 'youtube',
      media_type: 'video',
      external_url: '',
      embed_url: '',
      title: '',
      description: '',
      thumbnail_url: '',
      duration: '',
      status: 'draft',
      is_featured: false,
    });
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.title.trim() || !formData.external_url.trim()) {
      setError('Title and external URL are required.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        source_type: formData.source_type,
        media_type: formData.media_type,
        external_url: formData.external_url,
        embed_url: formData.embed_url || '',
        title: formData.title,
        description: formData.description,
        thumbnail_url: formData.thumbnail_url,
        duration: formData.duration ? Number(formData.duration) : null,
        status: formData.status,
        is_featured: formData.is_featured,
      };

      const response = editingId
        ? await mediaExternalAPI.update(editingId, payload)
        : await mediaExternalAPI.create(payload);

      const saved = response.data.data;
      if (editingId) {
        setExternalMedia((prev) => prev.map((item) => (item.id === saved.id ? saved : item)));
        setSuccess('External media updated successfully.');
      } else {
        setExternalMedia((prev) => [saved, ...prev]);
        setSuccess('External media added successfully.');
      }
      resetForm();
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          (typeof err.response?.data === 'object'
            ? JSON.stringify(err.response.data)
            : err.response?.data) ||
          'Failed to save external media.'
      );
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (media) => {
    setEditingId(media.id);
    setFormData({
      source_type: media.source_type || 'youtube',
      media_type: media.media_type || 'video',
      external_url: media.external_url || '',
      embed_url: media.embed_url || '',
      title: media.title || '',
      description: media.description || '',
      thumbnail_url: media.thumbnail_url || '',
      duration: media.duration || '',
      status: media.status || 'draft',
      is_featured: media.is_featured || false,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this external media?')) return;
    try {
      await mediaExternalAPI.delete(id);
      setExternalMedia((prev) => prev.filter((item) => item.id !== id));
      if (previewMedia?.id === id) setPreviewMedia(null);
      setSuccess('External media deleted successfully.');
      setError('');
    } catch (err) {
      setError('Failed to delete external media.');
      console.error(err);
    }
  };

  const openPreview = (media) => {
    setPreviewMedia(media);
  };

  const closePreview = () => {
    setPreviewMedia(null);
  };

  return (
    <div className="media-page">
      <section className="media-form-section">
        <h1>{editingId ? 'Edit External Media' : 'Add External Media'}</h1>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleSubmit} className="media-form">
          <div className="form-row">
            <label htmlFor="title">Title</label>
            <input
              id="title"
              name="title"
              type="text"
              value={formData.title}
              onChange={handleChange}
              placeholder="Enter a short title"
            />
          </div>

          <div className="form-row">
            <label htmlFor="source_type">Source</label>
            <select name="source_type" id="source_type" value={formData.source_type} onChange={handleChange}>
              <option value="youtube">YouTube</option>
              <option value="google_drive">Google Drive</option>
              <option value="facebook">Facebook</option>
              <option value="vimeo">Vimeo</option>
              <option value="tiktok">TikTok</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="form-row">
            <label htmlFor="media_type">Media Type</label>
            <select name="media_type" id="media_type" value={formData.media_type} onChange={handleChange}>
              <option value="video">Video</option>
              <option value="image">Image</option>
              <option value="document">Document</option>
              <option value="documentary">Documentary</option>
              <option value="map">Map</option>
              <option value="studycase">Study Case</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="form-row">
            <label htmlFor="external_url">External URL</label>
            <input
              id="external_url"
              name="external_url"
              type="url"
              value={formData.external_url}
              onChange={handleChange}
              placeholder="https://..."
              required
            />
          </div>

          <div className="form-row">
            <label htmlFor="embed_url">Embed URL</label>
            <input
              id="embed_url"
              name="embed_url"
              type="url"
              value={formData.embed_url}
              onChange={handleChange}
              placeholder="Optional embed URL for preview"
            />
          </div>

          <div className="form-row">
            <label htmlFor="thumbnail_url">Thumbnail URL</label>
            <input
              id="thumbnail_url"
              name="thumbnail_url"
              type="url"
              value={formData.thumbnail_url}
              onChange={handleChange}
              placeholder="Optional image URL"
            />
          </div>

          <div className="form-row">
            <label htmlFor="duration">Duration (seconds)</label>
            <input
              id="duration"
              name="duration"
              type="number"
              min="0"
              value={formData.duration}
              onChange={handleChange}
              placeholder="Optional duration"
            />
          </div>

          <div className="form-row">
            <label htmlFor="status">Status</label>
            <select name="status" id="status" value={formData.status} onChange={handleChange}>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <div className="form-row checkbox-row">
            <label htmlFor="is_featured">
              <input
                id="is_featured"
                name="is_featured"
                type="checkbox"
                checked={formData.is_featured}
                onChange={handleChange}
              />
              Featured
            </label>
          </div>

          <div className="form-row form-textarea">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Add a description for this media"
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {editingId ? 'Update External Media' : 'Save External Media'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={resetForm} disabled={loading}>
              Reset
            </button>
          </div>
        </form>
      </section>

      <section className="media-list-section">
        <div className="media-list-header">
          <h2>External Media Library</h2>
          <div className="media-filters">
            <select value={filterSource} onChange={(e) => setFilterSource(e.target.value)}>
              <option value="">All sources</option>
              <option value="youtube">YouTube</option>
              <option value="google_drive">Google Drive</option>
              <option value="facebook">Facebook</option>
              <option value="vimeo">Vimeo</option>
              <option value="tiktok">TikTok</option>
              <option value="other">Other</option>
            </select>
            <select value={filterMediaType} onChange={(e) => setFilterMediaType(e.target.value)}>
              <option value="">All media types</option>
              <option value="video">Video</option>
              <option value="image">Image</option>
              <option value="document">Document</option>
              <option value="documentary">Documentary</option>
              <option value="map">Map</option>
              <option value="studycase">Study Case</option>
              <option value="other">Other</option>
            </select>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="">All statuses</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>

        {loading && <p>Loading external media...</p>}

        {!loading && !externalMedia.length && <p>No external media found.</p>}

        <div className="media-grid">
          {externalMedia.map((media) => (
            <div key={media.id} className="media-card">
              <div className="media-card-header">
                <strong>{media.title}</strong>
                <div className="media-badges">
                  <span className="media-badge">{media.source_type}</span>
                  <span className="media-badge media-type-badge">{media.media_type}</span>
                </div>
              </div>
              {media.thumbnail_url ? (
                <img src={media.thumbnail_url} alt={media.title} className="media-thumbnail" />
              ) : (
                <div className="media-placeholder">No thumbnail</div>
              )}
              <p className="media-description">{media.description || 'No description provided.'}</p>
              <div className="media-meta-row">
                <small>Status: {media.status}</small>
                <small>Views: {media.views_count || 0}</small>
              </div>
              <div className="media-actions">
                <button className="btn btn-sm" type="button" onClick={() => openPreview(media)}>
                  Preview
                </button>
                <a href={media.external_url} target="_blank" rel="noreferrer" className="btn btn-sm btn-link">
                  Open
                </a>
                <button className="btn btn-sm" type="button" onClick={() => handleEdit(media)}>
                  Edit
                </button>
                <button className="btn btn-sm btn-danger" type="button" onClick={() => handleDelete(media.id)}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {previewMedia && (
        <div className="modal-overlay" onClick={closePreview}>
          <div className="media-preview-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closePreview}>&times;</button>
            <h3>{previewMedia.title}</h3>
            {previewMedia.embed_url ? (
              <div className="embed-wrapper">
                <iframe
                  title={previewMedia.title}
                  src={previewMedia.embed_url}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : (
              <div className="external-preview-link">
                <p>Embed URL is not available.</p>
                <a href={previewMedia.external_url} target="_blank" rel="noreferrer">
                  Open external media
                </a>
              </div>
            )}
            <p>{previewMedia.description}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default MediaExternal;
