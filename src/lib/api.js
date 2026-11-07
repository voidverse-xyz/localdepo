import { API } from '@/core/constants.js';

/** Thin, DRY client for the backend API. Cookies ride along (same-origin). */

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

/** Parse a JSON response, throwing an ApiError for any non-2xx status. */
async function toResult(res) {
  const data = await res.json().catch(() => null); // tolerate empty / non-JSON bodies
  if (!res.ok) throw new ApiError(data?.error || res.statusText, res.status, data);
  return data;
}

async function request(url, { method = 'GET', body } = {}) {
  const init = { method, headers: {} };
  if (body !== undefined) {
    init.headers['content-type'] = 'application/json';
    init.body = JSON.stringify(body);
  }
  const response = await fetch(url, init);
  return toResult(response);
}

export const api = {
  // auth
  checkAuth: () => request(API.AUTH),
  login: (password) => request(API.AUTH, { method: 'POST', body: { password } }),
  logout: () => request(API.AUTH, { method: 'DELETE' }),

  // services
  addService: (service) => request(API.SERVICES, { method: 'POST', body: service }),
  updateService: (service) => request(API.SERVICES, { method: 'PUT', body: service }),
  deleteService: (id) => request(`${API.SERVICES}?id=${encodeURIComponent(id)}`, { method: 'DELETE' }),

  // discovery
  scan: () => request(API.SCAN, { method: 'POST' }),

  // layout + view
  saveLayout: (payload) => request(API.LAYOUT, { method: 'PUT', body: payload }),

  // background
  saveSettings: (background) => request(API.SETTINGS, { method: 'PUT', body: { background } }),

  // uploads (multipart, no JSON content-type)
  async uploadImage(file) {
    const form = new FormData();
    form.append('file', file);
    const response = await fetch(API.UPLOAD, { method: 'POST', body: form });
    return toResult(response);
  },
};
