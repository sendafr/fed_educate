// src/utils/mediaPolling.js

/**
 * Polls the media status until it is completed, failed, or times out.
 * @param {number} mediaId - The ID of the media item.
 * @param {string} apiUrl - The base URL of your API (e.g., 'https://prime-cordi-fed-educ-7c4aa839.koyeb.app/api').
 * @param {Function} onCompleted - Callback when status is 'completed'.
 * @param {Function} onFailed - Callback when status is 'failed'.
 * @param {Function} onError - Callback for network errors or timeout.
 */
export const pollMediaStatus = async (
  mediaId, 
  apiUrl, 
  onCompleted, 
  onFailed, 
  onError
) => {
  const maxAttempts = 60; // ~5 minutes (60 * 5s)
  const interval = 5000; // 5 seconds
  let attempts = 0;

  const checkStatus = async () => {
    try {
      // Adjust the endpoint to match your actual API route
      const response = await fetch(`${apiUrl}/media/${mediaId}/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // Add auth token if your API requires it
          // 'Authorization': `Token ${localStorage.getItem('token')}` 
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const status = data.data?.status;

      if (status === 'completed') {
        onCompleted(data.data);
        return; // Stop polling
      } else if (status === 'failed') {
        onFailed(data.data);
        return; // Stop polling
      } else {
        // Status is 'pending' or 'processing'
        attempts++;
        if (attempts >= maxAttempts) {
          onError('Timeout: Processing took too long.');
          return;
        }
        setTimeout(checkStatus, interval);
      }
    } catch (error) {
      // If it's a network error, retry once or call onError
      if (attempts < maxAttempts) {
        attempts++;
        setTimeout(checkStatus, interval);
      } else {
        onError(error.message);
      }
    }
  };

  checkStatus(); // Start the first check
};