// src/pages/Media.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useMediaForm } from '../hooks/useMediaForm';
import { MediaPreview } from '../components/MediaPreview';
import { getMediaTypeIcon, getStatusColor, getFileExtension } from '../utils/helpers';
import { mediaCategoryAPI, mediaTagAPI } from '../api/api';
import { mediaUploadAPI, mediaFileAPI } from '../api/api'; // Ensure this import exists

function Media() {
  const [activeTab, setActiveTab] = useState('uploads');
  const [mediaUploads, setMediaUploads] = useState([]);
  const [mediaFiles, setMediaFiles] = useState([]);
  const [mediaCategory, setMediaCategory] = useState([]);
  const [mediaTag, setMediaTag] = useState([]);
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showUploadPreview, setShowUploadPreview] = useState(false);
  const [previewMedia, setPreviewMedia] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [downloadProgress, setDownloadProgress] = useState({});
  const dropZoneRef = useRef(null);

  // 1. Initialize the Hook (This handles all form logic + Celery)
  const {
    formData,
    editingId,
    loading,
    uploadStatus,
    uploadProgress,
    error,
    success,
    handleChange,
    handleFileChange,
    handleThumbnailChange,
    handleMediaTagToggle,
    handleEdit,
    handleSubmit,
    resetForm,
    setFormData,
    setEditingId,
  } = useMediaForm(activeTab, () => {
    // This function is called when the form submission (Celery task) is done
    if (activeTab === 'uploads') fetchMediaUploads();
    else fetchMediaFile();
  });

  // 2. Fetch Data
  const fetchMediaUploads = async (filters = {}) => {
    try {
      const response = await mediaUploadAPI.getAll(filters);
      setMediaUploads(response.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMediaFile = async (filters = {}) => {
    try {
      const response = await mediaFileAPI.getAll(filters);
      setMediaFiles(response.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await mediaCategoryAPI.getAll();
      setMediaCategory(res.data.data || []);
    } catch (err) { console.error(err); }
  };

  const fetchTags = async () => {
    try {
      const res = await mediaTagAPI.getAll();
      setMediaTag(res.data.data || []);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    fetchMediaUploads();
    fetchMediaFile();
    fetchCategories();
    fetchTags();
  }, []);

  // 3. Other Handlers (Delete, Download, Preview)
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this media?')) return;
    try {
      const api = activeTab === 'uploads' ? mediaUploadAPI : mediaFileAPI;
      await api.delete(id);
      if (activeTab === 'uploads') fetchMediaUploads();
      else fetchMediaFile();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const handleDownload = async (media) => {
    // ... (Paste your existing handleDownload logic here if you haven't moved it)
    // For brevity, assuming it's still here or moved to a separate hook.
    // If you moved it to a hook, import it here.
  };

  const openPreview = (media) => {
    setPreviewMedia(media);
    setShowPreviewModal(true);
  };

  const closePreview = () => {
    setShowPreviewModal(false);
    setPreviewMedia(null);
  };

  const applyFilePreview = (file) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setFilePreview({ url, type: file.type, name: file.name });
  };

  // 4. Render Helpers
  const renderMediaGrid = (list) => {
    if (!list || list.length === 0) return <p className="no-media">No media found.</p>;
    return (
      <div className="media-grid">
        {list.map((media) => (
          <div key={media.id} className="media-card">
            <div className="media-header">
              <span>{getMediaTypeIcon(media.media_type)}</span>
              {media.status && (
                <span className="status-badge" style={{ backgroundColor: getStatusColor(media.status) }}>
                  {media.status}
                </span>
              )}
            </div>
            {/* ... (Keep your existing card rendering logic here) ... */}
            

            <div className="media-content">
              <h3>{media.title}</h3>
              <p>{media.description || 'No description'}</p>
              {/* ... (Add category, tags, meta, dates) ... */}
            </div>
            <div className="media-actions">
              <button onClick={() => openPreview(media)}>👁️ Preview</button>
              <button onClick={() => handleDownload(media)}>⬇️ Download</button>
              <button onClick={() => handleEdit(media)}>✏️ Edit</button>
              <button onClick={() => handleDelete(media.id)}>🗑️ Delete</button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // 5. Main Render
  const currentMediaList = activeTab === 'uploads' ? mediaUploads : mediaFiles;

  return (
    <div className="media-container">
      <h1>📁 Media Management</h1>
      
      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Tabs */}
      <div className="media-tabs">
        <button className={activeTab === 'uploads' ? 'active' : ''} onClick={() => { setActiveTab('uploads'); resetForm(); }}>📤 Media Uploads</button>
        <button className={activeTab === 'files' ? 'active' : ''} onClick={() => { setActiveTab('files'); resetForm(); }}>📋 Media Files</button>
      </div>

      {/* Form Section */}
      <div className="media-form-section">
        <h2>{editingId ? '✏️ Edit Media' : `📤 Upload New ${activeTab === 'uploads' ? 'Upload' : 'File'}`}</h2>
        <form onSubmit={handleSubmit} className="media-form">
          {/* Title */}
          <div className="form-group">
            <label>Title *</label>
            <input type="text" name="title" value={formData.title} onChange={handleChange} required />
          </div>

          {/* Type */}
          <div className="form-group">
            <label>Type *</label>
            <select name="media_type" value={formData.media_type} onChange={handleChange} required>
              <option value="video">Video</option>
              <option value="image">Image</option>
              <option value="document">Document</option>
              <option value="audio">Audio</option>
              <option value="infographic">Infographic</option>
            </select>
          </div>

          {/* Description */}
          <div className="form-group">
            <label>Description</label>
            <textarea name="description" value={formData.description} onChange={handleChange} />
          </div>

          {/* File Input */}
          <div className="form-group">
            <label>File {!editingId && '*'}</label>
            <input type="file" onChange={(e) => { handleFileChange(e); applyFilePreview(e.target.files?.[0]); }} accept="*" />
            {formData.file && <p style={{ color: '#28a745' }}>✓ {formData.file.name}</p>}
          </div>

          {/* Thumbnail */}
          <div className="form-group">
            <label>Thumbnail</label>
            <input type="file" onChange={(e) => { handleThumbnailChange(e); setThumbnailPreview(URL.createObjectURL(e.target.files?.[0])); }} accept="image/*" />
            {formData.thumbnail && <p style={{ color: '#28a745' }}>✓ {formData.thumbnail.name}</p>}
          </div>

          {/* Render Previews from Component */}
          <MediaPreview filePreview={filePreview} thumbnailPreview={thumbnailPreview} />

          {/* Progress Bar */}
          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="progress-section">
              <div className="progress-bar"><div className="progress-fill" style={{ width: `${uploadProgress}%` }} /></div>
              <p>{uploadProgress}% uploaded</p>
            </div>
          )}

          {/* Actions */}
          <div className="form-actions">
            {formData.file && !editingId && (
              <button type="button" className="btn btn-secondary" onClick={() => setShowUploadPreview(true)}>👁️ Preview Before Upload</button>
            )}
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? `${uploadProgress > 0 ? uploadProgress + '% - ' : ''}Saving...` : editingId ? '✏️ Update' : '📤 Upload'}
            </button>
            {editingId && <button type="button" className="btn btn-secondary" onClick={resetForm}>Cancel</button>}
          </div>
        </form>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
          <option value="">All Types</option>
          <option value="video">Video</option>
          <option value="image">Image</option>
        </select>
        {activeTab === 'files' && (
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">All Status</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        )}
      </div>

      {/* Media Grid */}
      <div className="media-list-section">
        <h2>{activeTab === 'uploads' ? 'Uploads' : 'Files'} ({currentMediaList.length})</h2>
        {renderMediaGrid(currentMediaList)}
      </div>

      {/* Modals (Keep your existing Preview and Upload Preview Modals here) */}
      {/* ... (Paste your existing Modal JSX code here) ... */}
    </div>
  );
}

export default Media;