const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

function getToken() {
  return localStorage.getItem('blog_admin_token');
}

async function request(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  // Public endpoints: /api/posts/:slug/comments (GET + POST)
  // Never attach admin Authorization token for these.
  const isPublicComments = /^\/api\/posts\/[^/]+\/comments(\?.*)?$/.test(path);

  if (!isPublicComments) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  // Debug helper (remove after confirming fix)
  // console.debug('[api]', { path, isPublicComments, hasToken: !!getToken() });



  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers
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
