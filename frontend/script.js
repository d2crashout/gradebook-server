const STORAGE_KEYS = {
  apiBaseUrl: 'gradebook_api_base_url',
  accessToken: 'gradebook_access_token',
  userId: 'gradebook_user_id',
};

const outputEl = document.getElementById('output');
const apiBaseInput = document.getElementById('apiBaseUrl');
const loginForm = document.getElementById('loginForm');

const pretty = (value) => JSON.stringify(value, null, 2);

function setOutput(title, payload) {
  outputEl.textContent = `${title}\n\n${typeof payload === 'string' ? payload : pretty(payload)}`;
}

function getApiBaseUrl() {
  const value = apiBaseInput.value.trim().replace(/\/$/, '');
  if (!value) {
    throw new Error('Please set an API Base URL first.');
  }
  localStorage.setItem(STORAGE_KEYS.apiBaseUrl, value);
  return value;
}

async function apiRequest(path, options = {}) {
  const base = getApiBaseUrl();
  const token = localStorage.getItem(STORAGE_KEYS.accessToken);

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${base}${path}`, {
    ...options,
    headers,
  });

  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch (_error) {
    data = { raw: text };
  }

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${pretty(data)}`);
  }

  return data;
}

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  try {
    const body = {
      userId: document.getElementById('userId').value.trim(),
      pass: document.getElementById('password').value,
      schoolDistrict: document.getElementById('schoolDistrict').value.trim(),
    };

    const data = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    if (data.accessToken) {
      localStorage.setItem(STORAGE_KEYS.accessToken, data.accessToken);
    }

    if (data.user?._id) {
      localStorage.setItem(STORAGE_KEYS.userId, data.user._id);
    }

    setOutput('Login success', data);
  } catch (error) {
    setOutput('Login failed', error.message);
  }
});

document.getElementById('loadAccountBtn').addEventListener('click', async () => {
  try {
    const data = await apiRequest('/user/account');
    setOutput('Account', data);
  } catch (error) {
    setOutput('Load account failed', error.message);
  }
});

document.getElementById('loadGradesBtn').addEventListener('click', async () => {
  try {
    const data = await apiRequest('/grades');
    setOutput('Grades', data);
  } catch (error) {
    setOutput('Load grades failed', error.message);
  }
});

document.getElementById('loadGpaBtn').addEventListener('click', async () => {
  try {
    const data = await apiRequest('/grades/gpa');
    setOutput('GPA', data);
  } catch (error) {
    setOutput('Load GPA failed', error.message);
  }
});

document.getElementById('logoutBtn').addEventListener('click', async () => {
  try {
    const userId = localStorage.getItem(STORAGE_KEYS.userId);
    if (!userId) {
      throw new Error('No userId in local storage. Log in first.');
    }

    const data = await apiRequest('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });

    localStorage.removeItem(STORAGE_KEYS.accessToken);
    setOutput('Logged out', data);
  } catch (error) {
    setOutput('Logout failed', error.message);
  }
});

function init() {
  const savedBaseUrl = localStorage.getItem(STORAGE_KEYS.apiBaseUrl);
  if (savedBaseUrl) {
    apiBaseInput.value = savedBaseUrl;
  }
  setOutput(
    'Ready',
    'Configure API Base URL, then log in. This app is static and can be hosted on GitHub Pages.'
  );
}

init();
