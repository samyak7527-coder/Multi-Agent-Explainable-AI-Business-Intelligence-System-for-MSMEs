export const API_BASE_URL = 'http://127.0.0.1:8000';

export const apiCall = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  let response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch (err) {
    if (err.name === 'TypeError' || err.message?.includes('fetch')) {
      throw new Error(`Cannot connect to backend server at ${API_BASE_URL}. Please verify FastAPI is running on port 8000.`);
    }
    throw err;
  }

  // Response was received from backend
  let data = null;
  const rawText = await response.text();
  if (rawText) {
    try {
      data = JSON.parse(rawText);
    } catch (e) {
      data = { raw: rawText };
    }
  }

  if (!response.ok) {
    const errorMessage = data?.detail 
      ? (typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail))
      : (data?.raw || `Request failed with status ${response.status}`);
    throw new Error(errorMessage);
  }

  return data;
};

