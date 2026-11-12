// API Service for Smart CEMS
const API_BASE = '/api';

function getAuthHeader(customToken) {
  const token = customToken || (typeof localStorage !== 'undefined' ? localStorage.getItem('rkv_cems_token') : null);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(url, options = {}, token) {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(token),
    ...(options.headers || {})
  };

  const res = await fetch(url, { ...options, headers });
  const contentType = res.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await res.json() : await res.text();

  if (!res.ok) {
    const message = (data && data.error) || (typeof data === 'string' ? data : 'Request failed');
    const err = new Error(message);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

export const api = {
  // Events
  async getEvents(params = {}) {
    const q = new URLSearchParams(params).toString();
    return request(`${API_BASE}/events?${q}`);
  },

  async getEventById(id) {
    return request(`${API_BASE}/events/${id}`);
  },

  async createEvent(eventData, token) {
    return request(`${API_BASE}/events`, {
      method: 'POST',
      body: JSON.stringify(eventData)
    }, token);
  },

  async deleteEvent(id, token) {
    return request(`${API_BASE}/events/${id}`, {
      method: 'DELETE'
    }, token);
  },

  async updateEventStatus(id, status, token) {
    return request(`${API_BASE}/events/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    }, token);
  },

  // Auth
  async login(identifier, password, role) {
    return request(`${API_BASE}/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ identifier, password, role })
    });
  },

  async register(userData) {
    return request(`${API_BASE}/auth/register`, {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  },

  async updateUserProfile(userId, updates, token) {
    return request(`${API_BASE}/users/${userId}/profile`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    }, token);
  },

  async getCurrentUser(token) {
    return request(`${API_BASE}/auth/me`, {}, token);
  },

  // Registrations & Tickets
  async getRegistrations(params = {}, token) {
    const q = new URLSearchParams(params).toString();
    return request(`${API_BASE}/registrations?${q}`, {}, token);
  },

  async registerForEvent(payload, token) {
    return request(`${API_BASE}/registrations`, {
      method: 'POST',
      body: JSON.stringify(payload)
    }, token);
  },

  async verifyTicket(ticketCode, token) {
    return request(`${API_BASE}/registrations/verify`, {
      method: 'POST',
      body: JSON.stringify({ ticketCode })
    }, token);
  },

  async updateRegistrationPayment(regId, paymentStatus, token) {
    return request(`${API_BASE}/registrations/${regId}/payment`, {
      method: 'PATCH',
      body: JSON.stringify({ payment_status: paymentStatus })
    }, token);
  },

  // Venues & Announcements
  async getVenues() {
    return request(`${API_BASE}/venues`);
  },

  async getAnnouncements() {
    return request(`${API_BASE}/announcements`);
  },

  async broadcastAnnouncement(data, token) {
    return request(`${API_BASE}/announcements`, {
      method: 'POST',
      body: JSON.stringify(data)
    }, token);
  },

  async getAnalytics() {
    return request(`${API_BASE}/analytics`);
  },

  // Python AI Microservice Endpoints
  async getAIRecommendations(department, interests = []) {
    return request(`${API_BASE}/ai/recommend`, {
      method: 'POST',
      body: JSON.stringify({ department, interests })
    });
  },

  async verifyCertificateHash(studentId, eventId, ticketCode, certificateHash) {
    return request(`${API_BASE}/ai/verify-certificate`, {
      method: 'POST',
      body: JSON.stringify({ studentId, eventId, ticketCode, certificateHash })
    });
  }
};
