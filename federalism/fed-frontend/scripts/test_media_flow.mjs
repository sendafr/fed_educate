import axios from 'axios';

const API_BASE = process.argv[2] || 'http://localhost:8000';
const MEDIA_ID = process.argv[3] || '1';

async function main() {
  const endpoint = `${API_BASE}/api/media_manager/media_file/${MEDIA_ID}/signed_url/`;
  console.log(`Requesting signed URL from ${endpoint}`);

  const response = await axios.get(endpoint, { headers: { Accept: 'application/json' } });
  if (!response.data?.signed_url) {
    console.error('Error: signed_url not returned by backend.', response.data);
    process.exit(1);
  }

  const signedUrl = response.data.signed_url;
  console.log('Signed URL received:', signedUrl);

  console.log('Fetching signed URL to simulate preview/download...');
  const signedResponse = await axios.get(signedUrl, {
    responseType: 'stream',
    validateStatus: (status) => status < 500,
  });

  console.log(`Signed URL response status: ${signedResponse.status}`);
  if (signedResponse.status !== 200) {
    console.error('Failed to fetch signed URL content.');
    process.exit(1);
  }

  const contentType = signedResponse.headers['content-type'] || 'unknown';
  console.log('Signed URL content-type:', contentType);
  console.log('Media flow test passed.');
}

main().catch((error) => {
  console.error('Media flow automation failed:', error.message || error);
  process.exit(1);
});
