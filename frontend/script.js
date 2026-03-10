const STORAGE_KEYS = {
  apiBaseUrl: 'gradebook_api_base_url',
  accessToken: 'gradebook_access_token',
  userId: 'gradebook_user_id',
};

const els = {
  apiBaseUrl: document.getElementById('apiBaseUrl'),
  loginForm: document.getElementById('loginForm'),
  output: document.getElementById('output'),
  status: document.getElementById('status'),
  districtList: document.getElementById('districtList'),
  schoolDistrict: document.getElementById('schoolDistrict'),
};

const toPrettyJson = (value) => JSON.stringify(value, null, 2);

function setStatus(message, tone = 'neutral') {
  els.status.textContent = message;
  els.status.className = `status ${tone}`;
}

function setOutput(title, payload) {
  const body = typeof payload === 'string' ? payload : toPrettyJson(payload);
  els.output.textContent = `${title}\n\n${body}`;
}

function getSavedApiBaseUrl() {
  return localStorage.getItem(STORAGE_KEYS.apiBaseUrl) || '';
}

function setApiBaseUrl(value) {
  const normalized = value.trim().replace(/\/$/, '');
  if (!normalized) {
    throw new Error('Please set an API Base URL first.');
  }
  localStorage.setItem(STORAGE_KEYS.apiBaseUrl, normalized);
  return normalized;
}

function getApiBaseUrl() {
  const current = els.apiBaseUrl.value.trim();
  if (current) {
    return setApiBaseUrl(current);
  }
  const saved = getSavedApiBaseUrl();
  if (!saved) {
    throw new Error('Missing API Base URL.');
  }
  return saved;
}

async function apiRequest(path, options = {}) {
  const baseUrl = getApiBaseUrl();
  const token = localStorage.getItem(STORAGE_KEYS.accessToken);
  const { skipAuth = false, ...requestOptions } = options;

  const headers = {
    'Content-Type': 'application/json',
    ...(requestOptions.headers || {}),
  };

  if (token && !skipAuth) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${baseUrl}${path}`, {
    ...requestOptions,
    headers,
  });

  const text = await response.text();
  let body = {};
  try {
    body = text ? JSON.parse(text) : {};
  } catch (_error) {
    body = { raw: text };
  }

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${toPrettyJson(body)}`);
  }

  return body;
}

function saveSessionFromLogin(loginResponse) {
  if (loginResponse.accessToken) {
    localStorage.setItem(STORAGE_KEYS.accessToken, loginResponse.accessToken);
  }
  if (loginResponse.user?._id) {
    localStorage.setItem(STORAGE_KEYS.userId, loginResponse.user._id);
  }
}

function clearSession() {
  localStorage.removeItem(STORAGE_KEYS.accessToken);
  localStorage.removeItem(STORAGE_KEYS.userId);
}

function renderDistricts(districts) {
  els.districtList.innerHTML = '';
  districts.forEach((district) => {
    const option = document.createElement('option');
    option.value = district;
    els.districtList.appendChild(option);
  });

  if (districts.length > 0 && !els.schoolDistrict.value.trim()) {
    [els.schoolDistrict.value] = districts;
  }
}

async function withUiFeedback(actionLabel, fn) {
  try {
    setStatus(`${actionLabel}...`, 'working');
    const result = await fn();
    setStatus(`${actionLabel} completed.`, 'ok');
    return result;
  } catch (error) {
    setStatus(`${actionLabel} failed.`, 'error');
    setOutput(`${actionLabel} failed`, error.message);
    throw error;
  }
}

async function handleLoadDistricts() {
  const data = await withUiFeedback('Load districts', () =>
    apiRequest('/auth/districts', { method: 'GET', skipAuth: true })
  );

  const districts = Array.isArray(data.districts) ? data.districts : [];
  renderDistricts(districts);
  setOutput('Supported districts', { districts });
}

async function handleLogin(event) {
  event.preventDefault();

  const payload = {
    userId: document.getElementById('userId').value.trim(),
    pass: document.getElementById('password').value,
    schoolDistrict: els.schoolDistrict.value.trim(),
  };

  const data = await withUiFeedback('Login', () =>
    apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  );

  saveSessionFromLogin(data);
  setOutput('Login success', data);
}

async function handleHealthCheck() {
  const data = await withUiFeedback('Connection test', () =>
    apiRequest('/', { method: 'GET', skipAuth: true })
  );
  setOutput('Connection test result', data);
}

async function handleEndpointFetch(path) {
  const data = await withUiFeedback(`Fetch ${path}`, () =>
    apiRequest(path, { method: 'GET' })
  );
  setOutput(`Response: ${path}`, data);
}

async function handleLogout() {
  const userId = localStorage.getItem(STORAGE_KEYS.userId);
  if (!userId) {
    throw new Error('No user ID found in local session. Login first.');
  }

  const data = await withUiFeedback('Logout', () =>
    apiRequest('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    })
  );

  clearSession();
  setOutput('Logged out', data);
}

function setupEvents() {
  document.getElementById('saveBaseUrlBtn').addEventListener('click', () => {
    try {
      const value = setApiBaseUrl(els.apiBaseUrl.value);
      setStatus('API URL saved.', 'ok');
      setOutput('Saved API URL', value);
    } catch (error) {
      setStatus('Failed to save API URL.', 'error');
      setOutput('Save API URL failed', error.message);
    }
  });

  document.getElementById('healthCheckBtn').addEventListener('click', () => {
    handleHealthCheck().catch(() => {});
  });

  document.getElementById('loadDistrictsBtn').addEventListener('click', () => {
    handleLoadDistricts().catch(() => {});
  });

  els.loginForm.addEventListener('submit', (event) => {
    handleLogin(event).catch(() => {});
  });

  document.querySelectorAll('.endpointBtn').forEach((button) => {
    button.addEventListener('click', () => {
      handleEndpointFetch(button.dataset.endpoint).catch(() => {});
    });
  });

  document.getElementById('logoutBtn').addEventListener('click', () => {
    handleLogout().catch((error) => {
      setStatus('Logout failed.', 'error');
      setOutput('Logout failed', error.message);
    });
  });

  document.getElementById('clearSessionBtn').addEventListener('click', () => {
    clearSession();
    setStatus('Local session cleared.', 'ok');
    setOutput('Local session', 'Access token and user ID removed from localStorage.');
  });
}

function init() {
  const savedBaseUrl = getSavedApiBaseUrl();
  if (savedBaseUrl) {
    els.apiBaseUrl.value = savedBaseUrl;
  }

  setStatus('Ready.', 'ok');
  setOutput(
    'Ready',
    'Set your API URL, run Test connection, use Find districts, then login.'
  );

  setupEvents();
}

init();
