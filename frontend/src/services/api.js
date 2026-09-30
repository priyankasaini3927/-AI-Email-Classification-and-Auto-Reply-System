/**
 * API Service Layer
 * Centralized communication layer connecting React frontend to Python FastAPI backend.
 * Uses HTTP-only secure session cookies and clean error translation.
 */

class ApiService {
  /**
   * Universal fetch helper ensuring credentials: 'include' for session cookies
   * and clean error normalization.
   */
  async _fetch(url, options = {}) {
    const defaultHeaders = {
      'Accept': 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    };

    let res;
    try {
      res = await fetch(url, {
        ...options,
        headers: defaultHeaders,
        credentials: 'include', // Sends HTTP-only session cookie with every request
      });
    } catch (networkError) {
      console.error('[API Network Error]', networkError);
      const err = new Error('Backend server is unreachable. Please verify Python FastAPI is running.');
      err.status = 0;
      throw err;
    }

    if (!res.ok) {
      let errData = {};
      try {
        errData = await res.json();
      } catch {
        errData = { detail: res.statusText };
      }

      let message = errData.detail || errData.message;

      // Handle standard HTTP statuses gracefully
      if (res.status === 401) {
        message = message || 'Session expired or unauthorized. Please sign in again.';
      } else if (res.status === 403) {
        message = 'Access forbidden. You do not have permission for this resource.';
      } else if (res.status === 404) {
        message = message || 'The requested resource was not found.';
      } else if (res.status >= 500) {
        message = message || 'Internal server error occurred. Please check backend logs.';
      }

      const err = new Error(typeof message === 'string' ? message : 'Request failed.');
      err.status = res.status;
      err.data = errData;
      throw err;
    }

    return res.json();
  }

  // =========================================================================
  // AUTHENTICATION APIS
  // =========================================================================

  /**
   * POST /api/auth/login
   */
  async login(email, password) {
    return this._fetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  /**
   * POST /api/auth/logout
   */
  async logout() {
    return this._fetch('/api/auth/logout', {
      method: 'POST',
    });
  }

  /**
   * GET /api/auth/me
   */
  async getMe() {
    return this._fetch('/api/auth/me');
  }

  async getCurrentUser() {
    return this.getMe();
  }

  // =========================================================================
  // STATS & MONITORING APIS
  // =========================================================================

  /**
   * GET /api/stats
   */
  async getStats() {
    return this._fetch('/api/stats');
  }

  /**
   * GET /api/status
   */
  async getStatus() {
    return this._fetch('/api/status');
  }

  async getSystemStatus() {
    return this.getStatus();
  }

  // =========================================================================
  // EMAIL REPOSITORY APIS
  // =========================================================================

  /**
   * GET /api/emails
   */
  async getEmails() {
    return this._fetch('/api/emails');
  }

  /**
   * GET /api/emails/:id
   */
  async getEmailById(id) {
    return this._fetch(`/api/emails/${id}`);
  }

  async getEmail(id) {
    return this.getEmailById(id);
  }

  /**
   * POST /api/process-email (Manual simulation / insertion)
   */
  async processNewEmail(emailPayload) {
    return this._fetch('/api/process-email', {
      method: 'POST',
      body: JSON.stringify(emailPayload),
    });
  }

  // =========================================================================
  // AUDIT LOGS APIS
  // =========================================================================

  /**
   * GET /api/logs
   */
  async getLogs() {
    return this._fetch('/api/logs');
  }

  // =========================================================================
  // PIPELINE INGESTION & AUTOMATION
  // =========================================================================

  /**
   * POST /api/ingest
   * Triggers real inbox read (IMAP), Gemini classification, confidence scoring,
   * routing, response rendering, and audit logging.
   */
  async runIngestion() {
    return this._fetch('/api/ingest', {
      method: 'POST',
    });
  }

  // =========================================================================
  // CONFIGURATION & LIVE TESTS
  // =========================================================================

  /**
   * GET /api/settings
   */
  async getSettings() {
    return this._fetch('/api/settings');
  }

  /**
   * PUT /api/settings
   */
  async updateSettings(newSettings) {
    return this._fetch('/api/settings', {
      method: 'PUT',
      body: JSON.stringify(newSettings),
    });
  }

  /**
   * POST /api/settings/execution-mode
   * @param {'dry_run' | 'live'} mode
   */
  async updateExecutionMode(mode) {
    return this._fetch('/api/settings/execution-mode', {
      method: 'POST',
      body: JSON.stringify({ mode }),
    });
  }

  /**
   * POST /api/test/gmail
   */
  async testGmail() {
    return this._fetch('/api/test/gmail', {
      method: 'POST',
    });
  }

  /**
   * POST /api/test/smtp
   */
  async testSMTP() {
    return this._fetch('/api/test/smtp', {
      method: 'POST',
    });
  }

  /**
   * POST /api/test/gemini
   */
  async testGemini() {
    return this._fetch('/api/test/gemini', {
      method: 'POST',
    });
  }
}

export const api = new ApiService();
export default api;
