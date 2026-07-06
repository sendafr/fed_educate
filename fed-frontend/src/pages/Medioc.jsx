import React, { useState, useEffect, useCallback, useRef } from 'react';
import { mediaUploadAPI, mediaFileAPI, mediaCategoryAPI, mediaTagAPI } from '../api/api';
import '../styles/media.css';

function Media() {
  const [mediaUploads, setMediaUploads] = useState([]);
  const [mediaFiles, setMediaFiles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [activeTab, setActiveTab] = useState('uploads');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    media_type: 'video',
    file: null,
    thumbnail: null,
    category_id: '',
    tag_ids: [],
    duration: '',
    status: 'draft',
    is_featured: false,
  });

  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [downloadProgress, setDownloadProgress] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const [filePreview, setFilePreview] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);

  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewMedia, setPreviewMedia] = useState(null);

  const [showUploadPreview, setShowUploadPreview] = useState(false);

  const [isDragging, setIsDragging] = useState(false);
  const dropZoneRef = useRef(null);

  const objectUrlsRef = useRef([]);

  const createObjectUrl = (file) => {
    const url = URL.createObjectURL(file);
    objectUrlsRef.current.push(url);
    return url;
  };

  useEffect(() => {
    return () => {
      objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  useEffect(() => {
    fetchMediaUploads();
    fetchMediaFiles();
    fetchCategories();
    fetchTags();
  }, []);

  useEffect(() => {
    const filters = {};
    if (filterType) filters.media_type = filterType;
    if (filterStatus && activeTab === 'files') filters.status = filterStatus;

    if (activeTab === 'uploads') {
      fetchMediaUploads(filters);
    } else {
      fetchMediaFiles(filters);
    }
  }, [filterType, filterStatus, activeTab]);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        closePreview();
        setShowUploadPreview(false);
      }
    };
    if (showPreviewModal || showUploadPreview) {
      document.addEventListener('keydown', onKeyDown);
    }
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [showPreviewModal, showUploadPreview]);

  const fetchMediaUploads = async (filters = {}) => {
    try {
      setLoading(true);
      const response = await mediaUploadAPI.getAll(filters);
      setMediaUploads(response.data.data || []);
      setError('');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to fetch media uploads');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMediaFiles = async (filters = {}) => {
    try {
      setLoading(true);
      const response = await mediaFileAPI.getAll(filters);
      setMediaFiles(response.data.data || []);
      setError('');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to fetch media files');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await mediaCategoryAPI.getAll();
      setCategories(response.data.data || []);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  const fetchTags = async () => {
    try {
      const response = await mediaTagAPI.getAll();
      setTags(response.data.data || []);
    } catch (err) {
      console.error('Failed to fetch tags:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === 'checkbox'
          ? checked
          : name === 'duration'
          ? value ? parseInt(value, 10) : ''
          : value,
    }));
  };

  const applyFilePreview = (file) => {
    if (!file) return;
    const previewableTypes = ['video/', 'image/', 'audio/'];
    if (previewableTypes.some((t) => file.type.startsWith(t))) {
      setFilePreview({ url: createObjectUrl(file), type: file.type, name: file.name });
    } else {
      setFilePreview({ url: null, type: file.type, name: file.name });
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData((prev) => ({ ...prev, file }));
      applyFilePreview(file);
    }
  };

  const handleThumbnailChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData((prev) => ({ ...prev, thumbnail: file }));
      setThumbnailPreview(createObjectUrl(file));
    }
  };

  const handleTagToggle = (tagId) => {
    setFormData((prev) => ({
      ...prev,
      tag_ids: prev.tag_ids.includes(tagId)
        ? prev.tag_ids.filter((id) => id !== tagId)
        : [...prev.tag_ids, tagId],
    }));
  };

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setFormData((prev) => ({ ...prev, file }));
      applyFilePreview(file);
    }
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      title: '',
      description: '',
      media_type: 'video',
      file: null,
      thumbnail: null,
      category_id: '',
      tag_ids: [],
      duration: '',
      status: 'draft',
      is_featured: false,
    });
    setFilePreview(null);
    setThumbnailPreview(null);
    setUploadProgress(0);
    setError('');
    setShowUploadPreview(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.title.trim()) {
      setError('Title is required');
      return;
    }
    if (!editingId && !formData.file) {
      setError('A file is required for new media');
      return;
    }

    setLoading(true);
    setUploadProgress(0);

    try {
      const submitData = new FormData();
      submitData.append('title', formData.title);
      submitData.append('description', formData.description);
      submitData.append('media_type', formData.media_type);

      if (activeTab === 'files') {
        submitData.append('status', formData.status);
        submitData.append('is_featured', formData.is_featured);
        if (formData.category_id) submitData.append('category_id', formData.category_id);
        formData.tag_ids.forEach((id) => submitData.append('tag_ids', id));
      }

      if (formData.file) submitData.append('file', formData.file);
      if (formData.thumbnail) submitData.append('thumbnail', formData.thumbnail);
      if (formData.duration) submitData.append('duration', formData.duration);

      const api = activeTab === 'uploads' ? mediaUploadAPI : mediaFileAPI;
      const setDataState = activeTab === 'uploads' ? setMediaUploads : setMediaFiles;

      const config = {
        onUploadProgress: (progressEvent) => {
          const percent = Math.round(
            (progressEvent.loaded * 100) / (progressEvent.total || 1)
          );
          setUploadProgress(percent);
        },
      };

      let response;
      if (editingId) {
        response = await api.update(editingId, submitData, config);
        setDataState((prev) =>
          prev.map((m) => (m.id === editingId ? response.data.data : m))
        );
        setSuccess('Media updated successfully!');
      } else {
        response = await api.create(submitData, config);
        setDataState((prev) => [response.data.data, ...prev]);
        setSuccess('Media uploaded successfully!');
      }

      resetForm();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save media');
      console.error(err);
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  const handleEdit = (media) => {
    setFormData({
      title: media.title,
      description: media.description || '',
      media_type: media.media_type,
      file: null,
      thumbnail: null,
      category_id: media.category?.id || '',
      tag_ids: media.tags?.map((t) => t.id) || [],
      duration: media.duration || '',
      status: media.status || 'draft',
      is_featured: media.is_featured || false,
    });
    setEditingId(media.id);
    setFilePreview(null);
    setThumbnailPreview(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this media?')) return;
    try {
      const api = activeTab === 'uploads' ? mediaUploadAPI : mediaFileAPI;
      const setDataState = activeTab === 'uploads' ? setMediaUploads : setMediaFiles;
      await api.delete(id);
      setDataState((prev) => prev.filter((m) => m.id !== id));
      setSuccess('Media deleted successfully!');
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError('Failed to delete media');
      console.error(err);
    }
  };

  /**
   * Handle file download with progress tracking
   */
  const handleDownload = async (media) => {
    const mediaId = media.id;
    const fileUrl = media.file;
    const fileName = media.title || `download-${mediaId}`;

    if (!fileUrl) {
      setError('No file available for download');
      return;
    }

    try {
      setDownloadProgress((prev) => ({ ...prev, [mediaId]: 0 }));

      const isAbsoluteUrl = fileUrl.startsWith('http');
      const url = isAbsoluteUrl ? fileUrl : `${window.location.origin}${fileUrl}`;

      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Download failed with status ${response.status}`);
      }

      const contentLength = response.headers.get('content-length');
      const total = parseInt(contentLength, 10);

      const reader = response.body.getReader();
      const chunks = [];
      let loaded = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        chunks.push(value);
        loaded += value.length;

        if (total) {
          const percent = Math.round((loaded * 100) / total);
          setDownloadProgress((prev) => ({ ...prev, [mediaId]: percent }));
        }
      }

      const blob = new Blob(chunks);
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `${fileName}${getFileExtension(media.media_type)}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);

      setSuccess(`Downloaded: ${fileName}`);
      setTimeout(() => setSuccess(''), 3000);

      setTimeout(() => {
        setDownloadProgress((prev) => {
          const updated = { ...prev };
          delete updated[mediaId];
          return updated;
        });
      }, 1000);
    } catch (err) {
      console.error('Download error:', err);
      setError(`Failed to download ${fileName}: ${err.message}`);

      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = fileName;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  /**
   * Get file extension based on media type
   */
  const getFileExtension = (mediaType) => {
    const extensions = {
      video: '.mp4',
      image: '.jpg',
      audio: '.mp3',
      document: '.pdf',
      infographic: '.png',
      chart: '.png',
      map: '.png',
    };
    return extensions[mediaType] || '';
  };

  const openPreview = (media) => {
    setPreviewMedia(media);
    setShowPreviewModal(true);
  };

  const closePreview = () => {
    setShowPreviewModal(false);
    setPreviewMedia(null);
  };

  const getMediaTypeIcon = (type) => {
    const icons = {
      video: '🎥',
      image: '🖼️',
      document: '📄',
      audio: '🎵',
      infographic: '📊',
      chart: '📈',
      map: '🗺️',
    };
    return icons[type] || '📁';
  };

  const getStatusColor = (status) => {
    const colors = {
      published: '#28a745',
      draft: '#ffc107',
      archived: '#dc3545',
    };
    return colors[status] || '#6c757d';
  };

  const renderPreviewContent = (media) => {
    const { media_type, file, title } = media;

    if (!file) {
      return <p className="preview-unavailable">No file available for preview.</p>;
    }

    switch (media_type) {
      case 'video':
        return (
          <div style={{ width: '100%', backgroundColor: '#000' }}>
            <video
              src={file}
              controls
              autoPlay
              crossOrigin="anonymous"
              className="modal-preview-video"
              style={{ width: '100%', maxHeight: '70vh', objectFit: 'contain', display: 'block' }}
              onError={(e) => {
                console.error('Video error:', e);
                console.error('Video src:', file);
              }}
            />
          </div>
        );
      case 'audio':
        return (
          <div className="modal-preview-audio" style={{ textAlign: 'center', padding: '2rem' }}>
            <span className="audio-icon" style={{ fontSize: '3rem' }}>🎵</span>
            <p style={{ marginTop: '1rem', fontSize: '1.2rem' }}>{title}</p>
            <audio
              src={file}
              controls
              autoPlay
              crossOrigin="anonymous"
              style={{ width: '100%', marginTop: '1rem' }}
              onError={(e) => console.error('Audio error:', e)}
            />
          </div>
        );
      case 'image':
      case 'infographic':
      case 'chart':
      case 'map':
        return (
          <img
            src={file}
            alt={title}
            className="modal-preview-image"
            style={{ width: '100%', maxHeight: '70vh', objectFit: 'contain' }}
            crossOrigin="anonymous"
            onError={(e) => console.error('Image error:', e)}
          />
        );
      case 'document':
        return (
          <div className="modal-preview-document" style={{ textAlign: 'center', padding: '2rem' }}>
            <span style={{ fontSize: '3rem' }}>📄</span>
            <p style={{ marginTop: '1rem' }}>Documents cannot be previewed inline.</p>
            <a
              href={file}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary"
              style={{ marginTop: '1rem', display: 'inline-block' }}
            >
              Open Document
            </a>
          </div>
        );
      default:
        return (
          <div className="modal-preview-document" style={{ textAlign: 'center', padding: '2rem' }}>
            <p>Preview not available for this file type.</p>
            <a
              href={file}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary"
              style={{ marginTop: '1rem', display: 'inline-block' }}
            >
              Download File
            </a>
          </div>
        );
    }
  };

  const renderUploadPreviewContent = () => {
    if (!filePreview) return null;

    if (filePreview.url) {
      return (
        <>
          {filePreview.type.startsWith('video/') && (
            <video
              src={filePreview.url}
              controls
              style={{ width: '100%', maxHeight: '70vh', objectFit: 'contain' }}
            />
          )}
          {filePreview.type.startsWith('image/') && (
            <img
              src={filePreview.url}
              alt="Preview"
              style={{ width: '100%', maxHeight: '70vh', objectFit: 'contain' }}
            />
          )}
          {filePreview.type.startsWith('audio/') && (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <span style={{ fontSize: '3rem' }}>🎵</span>
              <p style={{ marginTop: '1rem', fontSize: '1.2rem' }}>
                {formData.title || filePreview.name}
              </p>
              <audio
                src={filePreview.url}
                controls
                style={{ width: '100%', marginTop: '1rem' }}
              />
            </div>
          )}
        </>
      );
    }

    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <span style={{ fontSize: '3rem' }}>📄</span>
        <p style={{ marginTop: '1rem' }}>{filePreview.name}</p>
        <small>Preview not available for this file type</small>
      </div>
    );
  };

  const renderMediaGrid = (mediaList) => {
    if (!mediaList || mediaList.length === 0) {
      return <p className="no-media">No media found. Start by uploading one!</p>;
    }

    return (
      <div className="media-grid">
        {mediaList.map((media) => (
          <div key={media.id} className="media-card">
            <div className="media-header">
              <span className="media-type-icon">{getMediaTypeIcon(media.media_type)}</span>
              {media.status && (
                <span
                  className="status-badge"
                  style={{ backgroundColor: getStatusColor(media.status) }}
                >
                  {media.status}
                </span>
              )}
            </div>

            {media.thumbnail && (
              <div className="media-thumbnail">
                <img src={media.thumbnail} alt={media.title} />
              </div>
            )}

            <div className="media-content">
              <h3>{media.title}</h3>
              <p className="description">{media.description || 'No description'}</p>

              {media.category && (
                <p className="category">
                  <strong>Category:</strong> {media.category.name}
                </p>
              )}

              {media.tags && media.tags.length > 0 && (
                <div className="tags">
                  {media.tags.map((tag) => (
                    <span key={tag.id} className="tag">
                      {tag.name}
                    </span>
                  ))}
                </div>
              )}

              <div className="media-meta">
                {media.duration_formatted && (
                  <span>⏱️ {media.duration_formatted}</span>
                )}
                {media.file_size_mb && (
                  <span>💾 {media.file_size_mb} MB</span>
                )}
                {media.views_count && (
                  <span>👁️ {media.views_count} views</span>
                )}
                {media.downloads_count && (
                  <span>⬇️ {media.downloads_count} downloads</span>
                )}
              </div>

              <div className="media-dates">
                <small>Created: {new Date(media.created_at).toLocaleDateString()}</small>
                {media.published_at && (
                  <small>Published: {new Date(media.published_at).toLocaleDateString()}</small>
                )}
              </div>
            </div>

            <div className="media-actions">
              {media.file && (
                <button onClick={() => openPreview(media)} className="btn btn-view">
                  👁️ Preview
                </button>
              )}
              {media.file && (
                <button
                  onClick={() => handleDownload(media)}
                  className="btn btn-download"
                  disabled={downloadProgress[media.id] !== undefined && downloadProgress[media.id] < 100}
                >
                  {downloadProgress[media.id] !== undefined
                    ? `⬇️ ${downloadProgress[media.id]}%`
                    : '⬇️ Download'}
                </button>
              )}
              <button onClick={() => handleEdit(media)} className="btn btn-edit">
                ✏️ Edit
              </button>
              <button onClick={() => handleDelete(media.id)} className="btn btn-delete">
                🗑️ Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const currentMediaList = activeTab === 'uploads' ? mediaUploads : mediaFiles;

  return (
    <div className="media-container">
      <h1>📁 Media Management</h1>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="media-tabs">
        <button
          className={`tab-button ${activeTab === 'uploads' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('uploads');
            resetForm();
            setFilterType('');
            setFilterStatus('');
          }}
        >
          📤 Media Uploads
        </button>
        <button
          className={`tab-button ${activeTab === 'files' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('files');
            resetForm();
            setFilterType('');
            setFilterStatus('');
          }}
        >
          📋 Media Files
        </button>
      </div>

      <div className="media-form-section">
        <h2>{editingId ? '✏️ Edit Media' : `📤 Upload New ${activeTab === 'uploads' ? 'Upload' : 'File'}`}</h2>
        <form onSubmit={handleSubmit} className="media-form">
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
                placeholder="Enter media title"
                maxLength="300"
              />
            </div>

            <div className="form-group">
              <label htmlFor="media_type">Media Type *</label>
              <select
                id="media_type"
                name="media_type"
                value={formData.media_type}
                onChange={handleChange}
                required
              >
                <option value="video">🎥 Video</option>
                <option value="image">🖼️ Image</option>
                <option value="document">📄 Document</option>
                <option value="audio">🎵 Audio</option>
                <option value="infographic">📊 Infographic</option>
                <option value="chart">📈 Chart</option>
                <option value="map">🗺️ Map</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Enter media description"
              rows="3"
            />
          </div>

          <div className="form-row">
            {activeTab === 'files' && (
              <div className="form-group">
                <label htmlFor="category_id">Category</label>
                <select
                  id="category_id"
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleChange}
                >
                  <option value="">Select a category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {activeTab === 'files' && (
              <div className="form-group">
                <label htmlFor="status">Status</label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            )}
          </div>

          {activeTab === 'files' && (
            <div className="form-group">
              <label>Tags</label>
              <div className="tags-list">
                {tags.map((tag) => (
                  <label key={tag.id} className="tag-checkbox">
                    <input
                      type="checkbox"
                      checked={formData.tag_ids.includes(tag.id)}
                      onChange={() => handleTagToggle(tag.id)}
                    />
                    <span>{tag.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="duration">Duration (seconds)</label>
              <input
                id="duration"
                type="number"
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                min="0"
                placeholder="e.g., 120"
              />
            </div>

            {activeTab === 'files' && (
              <div className="form-group checkbox">
                <label htmlFor="is_featured">
                  <input
                    id="is_featured"
                    type="checkbox"
                    name="is_featured"
                    checked={formData.is_featured}
                    onChange={handleChange}
                  />
                  <span>⭐ Feature this media</span>
                </label>
              </div>
            )}
          </div>

          <div className="form-row">
            <div
              className="form-group"
              ref={dropZoneRef}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              style={{
                border: isDragging ? '2px dashed #007bff' : '2px dashed #ccc',
                borderRadius: '8px',
                padding: '1rem',
                backgroundColor: isDragging ? '#f0f8ff' : 'transparent',
                transition: 'all 0.3s ease',
              }}
            >
              <label htmlFor="file">Media File {!editingId && '*'}</label>
              <input
                id="file"
                type="file"
                name="file"
                onChange={handleFileChange}
                accept="video/*,image/*,audio/*,.pdf,.doc,.docx"
              />
              <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.5rem' }}>
                Drag & drop a file here or click to select
              </p>
              {formData.file && (
                <p style={{ marginTop: '0.5rem', color: '#28a745', fontWeight: 'bold' }}>
                  ✓ {formData.file.name}
                </p>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="thumbnail">Thumbnail</label>
              <input
                id="thumbnail"
                type="file"
                name="thumbnail"
                onChange={handleThumbnailChange}
                accept="image/*"
              />
              {formData.thumbnail && (
                <p style={{ marginTop: '0.5rem', color: '#28a745', fontWeight: 'bold' }}>
                  ✓ {formData.thumbnail.name}
                </p>
              )}
            </div>
          </div>

          {filePreview?.url && (
            <div className="preview-section">
              <h4>📺 File Preview</h4>
              {filePreview.type.startsWith('video/') && (
                <video src={filePreview.url} controls width="100%" className="video-preview" />
              )}
              {filePreview.type.startsWith('image/') && (
                <img src={filePreview.url} alt="Preview" className="image-preview" style={{ maxWidth: '100%', maxHeight: '300px' }} />
              )}
              {filePreview.type.startsWith('audio/') && (
                <audio src={filePreview.url} controls style={{ width: '100%' }} />
              )}
            </div>
          )}

          {filePreview && !filePreview.url && (
            <div className="preview-section">
              <h4>📄 File Selected</h4>
              <p>{filePreview.name}</p>
              <small>Preview not available for this file type</small>
            </div>
          )}

          {thumbnailPreview && (
            <div className="preview-section">
              <h4>🖼️ Thumbnail Preview</h4>
              <img src={thumbnailPreview} alt="Thumbnail" className="thumbnail-preview" style={{ maxWidth: '100%', maxHeight: '300px' }} />
            </div>
          )}

          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="progress-section">
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${uploadProgress}%` }} />
              </div>
              <p>{uploadProgress}% uploaded</p>
            </div>
          )}

          <div className="form-actions">
            {formData.file && !editingId && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowUploadPreview(true)}
              >
                👁️ Preview Before Upload
              </button>
            )}

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading
                ? `${uploadProgress > 0 ? uploadProgress + '% - ' : ''}Saving...`
                : editingId
                ? '✏️ Update Media'
                : '📤 Upload Media'}
            </button>

            {editingId && (
              <button type="button" className="btn btn-secondary" onClick={resetForm}>
                ✕ Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="filters-section">
        <h2>🔍 Filters</h2>
        <div className="filters">
          <div className="filter-group">
            <label htmlFor="filterType">Media Type</label>
            <select
              id="filterType"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="">All Types</option>
              <option value="video">Video</option>
              <option value="image">Image</option>
              <option value="document">Document</option>
              <option value="audio">Audio</option>
              <option value="infographic">Infographic</option>
              <option value="chart">Chart</option>
              <option value="map">Map</option>
            </select>
          </div>

          {activeTab === 'files' && (
            <div className="filter-group">
              <label htmlFor="filterStatus">Status</label>
              <select
                id="filterStatus"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          )}

          <button
            onClick={() => {
              setFilterType('');
              setFilterStatus('');
            }}
            className="btn btn-filter-clear"
          >
            Clear Filters
          </button>
        </div>
      </div>

      <div className="media-list-section">
        <h2>
          {activeTab === 'uploads' ? '📤 Media Uploads' : '📋 Media Files'} ({currentMediaList.length})
        </h2>
        {loading && !currentMediaList.length ? (
          <div className="loading-skeleton">
            <p>⏳ Loading media...</p>
          </div>
        ) : (
          renderMediaGrid(currentMediaList)
        )}
      </div>

      {showPreviewModal && previewMedia && (
        <div className="modal-overlay" onClick={closePreview}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>{previewMedia.title}</h2>
                <p className="modal-media-type">
                  {getMediaTypeIcon(previewMedia.media_type)} {previewMedia.media_type}
                </p>
              </div>
              <button className="btn btn-close" onClick={closePreview}>
                ✕
              </button>
            </div>

            <div className="modal-preview-body">
              {renderPreviewContent(previewMedia)}
            </div>

            <div className="modal-details">
              <div className="details-grid">
                {previewMedia.description && (
                  <div className="detail-item">
                    <strong>Description:</strong>
                    <p>{previewMedia.description}</p>
                  </div>
                )}
                {previewMedia.duration_formatted && (
                  <div className="detail-item">
                    <strong>⏱️ Duration:</strong>
                    <p>{previewMedia.duration_formatted}</p>
                  </div>
                )}
                {previewMedia.file_size_mb && (
                  <div className="detail-item">
                    <strong>💾 Size:</strong>
                    <p>{previewMedia.file_size_mb} MB</p>
                  </div>
                )}
                {previewMedia.category && (
                  <div className="detail-item">
                    <strong>Category:</strong>
                    <p>{previewMedia.category.name}</p>
                  </div>
                )}
                {previewMedia.tags && previewMedia.tags.length > 0 && (
                  <div className="detail-item">
                    <strong>Tags:</strong>
                    <div className="tags">
                      {previewMedia.tags.map((tag) => (
                        <span key={tag.id} className="tag">
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {previewMedia.views_count && (
                  <div className="detail-item">
                    <strong>👁️ Views:</strong>
                    <p>{previewMedia.views_count}</p>
                  </div>
                )}
                
              </div>
            </div>

            <div className="modal-footer">
              {previewMedia.file && (
                <button
                  onClick={() => handleDownload(previewMedia)}
                  className="btn btn-primary"
                  disabled={downloadProgress[previewMedia.id] !== undefined && downloadProgress[previewMedia.id] < 100}
                >
                  {downloadProgress[previewMedia.id] !== undefined
                    ? `⬇️ ${downloadProgress[previewMedia.id]}%`
                    : '⬇️ Download'}
                </button>
              )}
              <button onClick={closePreview} className="btn btn-secondary">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pre-Upload Preview Modal */}
      {showUploadPreview && (
        <div className="modal-overlay" onClick={() => setShowUploadPreview(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>{formData.title || 'Untitled'}</h2>
                <p className="modal-media-type">
                  {getMediaTypeIcon(formData.media_type)} {formData.media_type}
                </p>
              </div>
              <button
                className="btn btn-close"
                onClick={() => setShowUploadPreview(false)}
              >
                ✕
              </button>
            </div>

            <div className="modal-preview-body">
              {renderUploadPreviewContent()}

              {thumbnailPreview && (
                <div style={{ marginTop: '1rem' }}>
                  <strong>🖼️ Thumbnail:</strong>
                  <img
                    src={thumbnailPreview}
                    alt="Thumbnail"
                    style={{ display: 'block', maxWidth: '200px', marginTop: '0.5rem', borderRadius: '6px' }}
                  />
                </div>
              )}
            </div>

            <div className="modal-details">
              <div className="details-grid">
                {formData.description && (
                  <div className="detail-item">
                    <strong>Description:</strong>
                    <p>{formData.description}</p>
                  </div>
                )}
                {formData.duration && (
                  <div className="detail-item">
                    <strong>⏱️ Duration:</strong>
                    <p>{formData.duration}s</p>
                  </div>
                )}
                <div className="detail-item">
                  <strong>Type:</strong>
                  <p>{formData.media_type}</p>
                </div>
                {activeTab === 'files' && formData.status && (
                  <div className="detail-item">
                    <strong>Status:</strong>
                    <p>{formData.status}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  setShowUploadPreview(false);
                  document.querySelector('.media-form').requestSubmit();
                }}
              >
                📤 Confirm & Upload
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowUploadPreview(false)}
              >
                ✕ Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Media;