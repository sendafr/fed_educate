// src/utils/helpers.js

/**
 * Returns the emoji icon for a specific media type
 */
export const getMediaTypeIcon = (type) => {
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

/**
 * Returns the CSS color for a specific status
 * Used for status badges in the UI
 */
export const getStatusColor = (status) => {
  const colors = {
    completed: '#28a745',   // Green
    processing: '#ffc107',  // Yellow/Orange (Celery processing)
    pending: '#17a2b8',     // Blue
    failed: '#dc3545',      // Red
    draft: '#6c757d',       // Grey
    published: '#28a745',
    archived: '#dc3545',
  };
  return colors[status] || '#6c757d';
};

/**
 * Returns the file extension based on media type
 * Used for download filenames
 */
export const getFileExtension = (mediaType) => {
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

/**
 * Formats seconds into MM:SS or HH:MM:SS
 */
export const formatDuration = (seconds) => {
  if (!seconds) return '0:00';
  const date = new Date(0);
  date.setSeconds(seconds);
  return date.toISOString().substr(11, 8).replace(/^00:/, '').replace(/^0:/, '');
};