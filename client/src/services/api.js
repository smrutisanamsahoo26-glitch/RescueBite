/**
 * RescueBite REST API Client Layer
 * Handles credentialed requests with HttpOnly cookies and error normalization.
 */

const rawBaseUrl =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  'http://localhost:5000/api';

const normalizeApiBaseUrl = (url) => {
  const clean = (url || '').trim().replace(/\/+$/, '');
  if (!clean) return '/api';
  if (clean.endsWith('/api')) return clean;
  return `${clean}/api`;
};

const API_BASE_URL = normalizeApiBaseUrl(rawBaseUrl);

class ApiService {
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    // Attach Bearer token fallback for browsers restricting cross-site cookies
    try {
      const storedToken = localStorage.getItem('rescuebite_auth_token');
      if (storedToken && !headers['Authorization']) {
        headers['Authorization'] = `Bearer ${storedToken}`;
      }
    } catch {
      // LocalStorage unavailable in certain sandboxes
    }

    const config = {
      ...options,
      headers,
      credentials: 'include' // Transmit secure HttpOnly cookies across origin
    };

    if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const error = new Error(data.message || `API error (${response.status})`);
        error.status = response.status;
        error.data = data;
        throw error;
      }

      return data;
    } catch (err) {
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        console.warn(`[API Connection] Cannot connect to server at ${url}`);
      }
      throw err;
    }
  }

  // Auth Endpoints
  async register(payload) {
    const res = await this.request('/auth/register', { method: 'POST', body: payload });
    if (res?.data?.token) {
      try {
        localStorage.setItem('rescuebite_auth_token', res.data.token);
      } catch {}
    }
    return res;
  }

  async login(email, password) {
    const res = await this.request('/auth/login', { method: 'POST', body: { email, password } });
    if (res?.data?.token) {
      try {
        localStorage.setItem('rescuebite_auth_token', res.data.token);
      } catch {}
    }
    return res;
  }

  async logout() {
    try {
      localStorage.removeItem('rescuebite_auth_token');
    } catch {}
    return this.request('/auth/logout', { method: 'POST' });
  }

  async getMe() {
    return this.request('/auth/me', { method: 'GET' });
  }

  async updateProfile(payload) {
    return this.request('/auth/profile', { method: 'PUT', body: payload });
  }

  // Listings Endpoints
  async getListings(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/listings${query ? `?${query}` : ''}`, { method: 'GET' });
  }

  async getListingById(id) {
    return this.request(`/listings/${id}`, { method: 'GET' });
  }

  async createListing(payload) {
    return this.request('/listings', { method: 'POST', body: payload });
  }

  async updateListing(id, payload) {
    return this.request(`/listings/${id}`, { method: 'PUT', body: payload });
  }

  async deleteListing(id) {
    return this.request(`/listings/${id}`, { method: 'DELETE' });
  }

  async getMyListings() {
    return this.request('/listings/donor/mine', { method: 'GET' });
  }

  // Reservations Endpoints
  async createReservation(payload, idempotencyKey) {
    const headers = idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {};
    return this.request('/reservations', { method: 'POST', body: payload, headers });
  }

  async getMyReservations(status) {
    const query = status ? `?status=${status}` : '';
    return this.request(`/reservations/my${query}`, { method: 'GET' });
  }

  async getDonorReservations(status) {
    const query = status ? `?status=${status}` : '';
    return this.request(`/reservations/donor/inbound${query}`, { method: 'GET' });
  }

  async approveReservation(id, donorNotes) {
    return this.request(`/reservations/${id}/approve`, { method: 'PATCH', body: { donorNotes } });
  }

  async rejectReservation(id, reason) {
    return this.request(`/reservations/${id}/reject`, { method: 'PATCH', body: { reason } });
  }

  async cancelReservation(id, reason) {
    return this.request(`/reservations/${id}/cancel`, { method: 'PATCH', body: { reason } });
  }

  // Volunteer Task Endpoints
  async getTaskBoard() {
    return this.request('/tasks/board', { method: 'GET' });
  }

  async getMyTasks() {
    return this.request('/tasks/my', { method: 'GET' });
  }

  async getTaskById(id) {
    return this.request(`/tasks/${id}`, { method: 'GET' });
  }

  async claimTask(id) {
    return this.request(`/tasks/${id}/claim`, { method: 'POST' });
  }

  async updateTaskStatus(id, newStatus, candidateCode, extra = {}) {
    return this.request(`/tasks/${id}/status`, {
      method: 'PATCH',
      body: { newStatus, candidateCode, ...extra }
    });
  }

  async logTaskTemperature(id, temperatureCelsius, notes) {
    return this.request(`/tasks/${id}/temp-log`, {
      method: 'POST',
      body: { temperatureCelsius, notes }
    });
  }

  // Analytics
  async getAnalytics() {
    return this.request('/analytics', { method: 'GET' });
  }

  // Organizations
  async applyOrganization(payload) {
    return this.request('/organizations/apply', { method: 'POST', body: payload });
  }

  async getMyOrganization() {
    return this.request('/organizations/my-org', { method: 'GET' });
  }

  // Admin Endpoints
  async getAdminOverview() {
    return this.request('/admin/overview', { method: 'GET' });
  }

  async getAdminReports() {
    return this.request('/admin/reports', { method: 'GET' });
  }

  async resolveReport(id, status, adminNotes) {
    return this.request(`/admin/reports/${id}`, { method: 'PATCH', body: { status, adminNotes } });
  }

  async updateUserStatus(id, status, reason) {
    return this.request(`/admin/users/${id}/status`, { method: 'PATCH', body: { status, reason } });
  }

  async getAuditLogs(page = 1) {
    return this.request(`/admin/audit-logs?page=${page}`, { method: 'GET' });
  }

  async getOrgVerificationQueue(status = 'pending') {
    return this.request(`/organizations/admin/queue?status=${status}`, { method: 'GET' });
  }

  async reviewOrgVerification(id, status, reviewNotes) {
    return this.request(`/organizations/admin/${id}/verify`, {
      method: 'PATCH',
      body: { status, reviewNotes }
    });
  }

  // Reports
  async submitReport(payload) {
    return this.request('/reports', { method: 'POST', body: payload });
  }

  async getMyReports() {
    return this.request('/reports/my', { method: 'GET' });
  }
}

export const api = new ApiService();
