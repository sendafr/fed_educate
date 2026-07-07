// src/hooks/useMediaForm.js
import { useState, useCallback } from 'react';
import { mediaUploadAPI, mediaFileAPI } from '../api/api';
import { pollMediaStatus } from '../utils/mediaPolling';

export const useMediaForm = (activeTab, fetchMediaList) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    media_type: 'video',
    file: null,
    thumbnail: null,
    mediaCategory_id: '',
    mediaTag_ids: [],
    duration: '',
    status: 'draft',
    is_featured: false,
  });

  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('idle'); // idle, uploading, processing, completed, error
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // --- Form Handlers ---
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : name === 'duration' ? (value ? parseInt(value, 10) : '') : value,
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) setFormData((prev) => ({ ...prev, file }));
  };

  const handleThumbnailChange = (e) => {
    const file = e.target.files?.[0];
    if (file) setFormData((prev) => ({ ...prev, thumbnail: file }));
  };

  const handleMediaTagToggle = (id) => {
    setFormData((prev) => ({
      ...prev,
      mediaTag_ids: prev.mediaTag_ids.includes(id)
        ? prev.mediaTag_ids.filter((i) => i !== id)
        : [...prev.mediaTag_ids, id],
    }));
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      title: '',
      description: '',
      media_type: 'video',
      file: null,
      thumbnail: null,
      mediaCategory_id: '',
      mediaTag_ids: [],
      duration: '',
      status: 'draft',
      is_featured: false,
    });
    setUploadProgress(0);
    setError('');
    setSuccess('');
  };

  const handleEdit = (media) => {
    setFormData({
      title: media.title || '',
      description: media.description || '',
      media_type: media.media_type || 'video',
      file: null,
      thumbnail: null,
      mediaCategory_id: media.category?.id || '',
      mediaTag_ids: media.tags?.map((t) => t.id) || [],
      duration: media.duration || '',
      status: media.status || 'draft',
      is_featured: media.is_featured || false,
    });
    setEditingId(media.id);
  };

  // --- Submit Logic with Celery ---
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
        submitData.append('is_featured', formData.is_featured ? 'true' : 'false');
        if (formData.mediaCategory_id) submitData.append('category_id', formData.mediaCategory_id);
        (formData.mediaTag_ids || []).forEach((id) => submitData.append('tag_ids', id));
      }

      if (formData.file) submitData.append('file', formData.file);
      if (formData.thumbnail) submitData.append('thumbnail', formData.thumbnail);
      if (formData.duration) submitData.append('duration', formData.duration);

      const api = activeTab === 'uploads' ? mediaUploadAPI : mediaFileAPI;
      const config = {
        onUploadProgress: (progressEvent) => {
          const percent = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
          setUploadProgress(percent);
        },
      };

      let response;
      if (editingId) {
        response = await api.update(editingId, submitData, config);
        setSuccess('Media updated successfully!');
        resetForm();
      } else {
        // --- NEW: Celery Integration ---
        response = await api.create(submitData, config);
        const newId = response.data.data.id;
        
        setUploadStatus('processing');
        setSuccess('File uploaded! Processing video in the background...');

        const API_BASE_URL = 'https://prime-cordi-fed-educ-7c4aa839.koyeb.app || http://localhost:8000'; // Update for production

        pollMediaStatus(
          newId,
          API_BASE_URL,
          (completedData) => {
            setUploadStatus('completed');
            setSuccess('✅ Video processed successfully!');
            fetchMediaList(); // Refresh list
            resetForm();
          },
          (failedData) => {
            setUploadStatus('error');
            setError('❌ Video processing failed.');
            fetchMediaList();
            resetForm();
          },
          (pollError) => {
            setUploadStatus('error');
            setError(`⚠️ ${pollError}`);
            resetForm();
          }
        );
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save media');
    } finally {
      if (uploadStatus !== 'processing') {
        setLoading(false);
        setUploadProgress(0);
      }
    }
  };

  return {
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
  };
};