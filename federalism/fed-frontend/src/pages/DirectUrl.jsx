const handleUpload = async (file) => {
  // 1. Ask where to upload
  const {data: ep} = await axios.post('/api/media_manager/get-upload-endpoint/', {
    filename: file.name, filesize: file.size, filetype: file.type
  });

  // 2. Upload direct to B2/Supabase
  await axios.put(ep.url, file, {headers: {'Content-Type': file.type}});

  // 3. Tell backend to create DB + start celery
  const {data: final} = await axios.post('/api/media_manager/upload-final/', {
    public_url: ep.public_url, filename: file.name, filesize: file.size, endpoint: ep.endpoint
  });
  
  pollProgress(final.data.task_id);
}