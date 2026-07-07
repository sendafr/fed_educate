import axios from 'axios';

const API_BASE = process.argv[2] || 'http://localhost:8000';
const MEDIA_ID = process.argv[3] || '1';

async function main() {
  const url = `${API_BASE}/api/media_manager/media_file/${MEDIA_ID}/signed_url/`;
  console.log(`Requesting signed URL from ${url}`);

  try {
    const response = await axios.get(url, { headers: { Accept: 'application/json' } });
    if (!response.data?.signed_url) {
      console.error('No signed_url found in response:', response.data);
      process.exit(1);
    }
    console.log('Signed URL received:', response.data.signed_url);

    const signedUrlResponse = await axios.get(response.data.signed_url, {
      responseType: 'stream',
      headers: { 'User-Agent': 'fed-frontend-signed-url-test/1.0' },
      validateStatus: (status) => status < 500,
    });

    console.log('Signed URL request status:', signedUrlResponse.status);
    if (signedUrlResponse.status !== 200) {
      console.error('Signed URL request failed');
      process.exit(1);
    }

    console.log('Frontend signed URL smoke test passed.');
  } catch (error) {
    console.error('Error testing signed URL:', error.message || error);
    process.exit(1);
  }
}

main();
