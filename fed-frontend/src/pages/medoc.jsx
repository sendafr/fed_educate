{/*const renderPreviewContent = (media) => {
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
  };*/}