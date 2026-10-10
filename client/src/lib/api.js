const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';
let csrfToken = null;

export class ApiError extends Error {
  constructor(message, status, code, data = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.data = data;
  }
}

/**
 * Shared fetch client configured for the LernErne backend.
 */
export async function apiClient(endpoint, options = {}) {
  const url = endpoint.startsWith('http')
    ? endpoint
    : `${API_BASE_URL.replace(/\/$/, '')}/${endpoint.replace(/^\//, '')}`;

  const method = (options.method || 'GET').toUpperCase();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  try {
    const hasCsrfHeader = Object.keys(headers).some((key) => key.toLowerCase() === 'x-csrf-token');
    if (!['GET', 'HEAD', 'OPTIONS'].includes(method) && !hasCsrfHeader) {
      if (!csrfToken && !endpoint.endsWith('/auth/csrf')) {
        const tokenResponse = await apiClient('/auth/csrf');
        csrfToken = tokenResponse.data.csrfToken;
      }
      if (csrfToken) headers['X-CSRF-Token'] = csrfToken;
    }

    const config = {
      ...options,
      method,
      headers,
      credentials: options.credentials || 'include',
    };
    const response = await fetch(url, config);
    const contentType = response.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');

    const data = isJson ? await response.json() : null;

    if (!response.ok) {
      const errorCode = data?.error?.code || `HTTP_${response.status}`;
      const errorMessage = data?.error?.message || response.statusText || 'Request failed';
      throw new ApiError(errorMessage, response.status, errorCode, data);
    }

    if (endpoint.endsWith('/auth/csrf') || data?.data?.csrfToken) {
      csrfToken = data?.data?.csrfToken ?? null;
    }
    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    // Network or parse error
    throw new ApiError(
      error.message || 'Unable to connect to server',
      0,
      'NETWORK_ERROR'
    );
  }
}

export function setCsrfToken(token) {
  csrfToken = typeof token === 'string' ? token : null;
}

/**
 * Check backend and database health.
 */
export async function checkBackendHealth() {
  try {
    const result = await apiClient('/health', { method: 'GET' });
    return {
      available: true,
      data: result.data,
      error: null,
    };
  } catch (err) {
    // If the backend responded with 503 degraded, we still received the health payload
    if (err.data && err.data.data) {
      return {
        available: true,
        data: err.data.data,
        error: err.message,
      };
    }
    return {
      available: false,
      data: null,
      error: err.message || 'Backend service unreachable',
    };
  }
}

export default apiClient;
