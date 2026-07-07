import React, { useState } from 'react'
import api from '../api/api'
import '../styles/VideoUpload.css'

const VideoUpload = () => {
  const [file, setFile] = useState(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const [messageType, setMessageType] = useState('success')

  const handleFileChange = (e) => {
    setFile(e.target.files)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!file) {
      setMessage('Please select a file')
      setMessageType('error')
      return
    }

    if (!title.trim()) {
      setMessage('Please enter a title')
      setMessageType('error')
      return
    }

    try {
      setLoading(true)
      const formData = new FormData()
      formData.append('file', file)
      formData.append('title', title)
      formData.append('description', description)
      formData.append('media_type', 'video')
      formData.append('is_public', true)

      const response = await api.post('/media/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      setMessage('Video uploaded successfully!')
      setMessageType('success')
      setFile(null)
      setTitle('')
      setDescription('')

      // Clear message after 3 seconds
      setTimeout(() => setMessage(null), 3000)
    } catch (error) {
      setMessage(error.response?.data?.detail || 'Failed to upload video')
      setMessageType('error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="video-upload">
      <h2>📹 Upload Video</h2>
      
      {message && (
        <div className={`alert alert-${messageType}`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="upload-form">
        <div className="form-group">
          <label htmlFor="title">Title</label>
          <input
            type="text"
            id="title"
            className="form-control"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter video title"
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            className="form-control"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter video description"
            rows="4"
          ></textarea>
        </div>

        <div className="form-group">
          <label htmlFor="file">Select Video File</label>
          <input
            type="file"
            id="file"
            className="form-control"
            onChange={handleFileChange}
            accept="video/*"
          />
          {file && <p className="file-name">Selected: {file.name}</p>}
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading}
        >
          {loading ? 'Uploading...' : 'Upload Video'}
        </button>
      </form>
    </div>
  )
}

export default VideoUpload