const API_URL = import.meta.env.DEV ? 'http://localhost:3000' : '';

function getToken() {
  return localStorage.getItem('blog_admin_token');
}

async function request(path, options = {}) {
  const isFormData = options.body instanceof FormData;
  const headers = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(options.headers || {})
  };

  const isPublicComments = /^\/api\/posts\/[^/]+\/comments(\?.*)?$/.test(path);

  if (!isPublicComments) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let body = options.body;
  if (body && !isFormData && typeof body === 'object') {
    body = JSON.stringify(body);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    ...(body ? { body } : {})
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || 'Request failed');
  }

  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return response.json();
  }

  return response.text();
}

export { API_URL, request };
