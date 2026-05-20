const API_BASE = '';

function getToken() {
  return localStorage.getItem('access_token') || '';
}

function setToken(token) {
  localStorage.setItem('access_token', token);
}

function clearToken() {
  localStorage.removeItem('access_token');
}

async function apiFetch(path, options = {}) {
  const url = API_BASE + path;
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', headers.get('Content-Type') || 'application/json');

  const token = getToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(url, { ...options, headers });
  const contentType = res.headers.get('content-type') || '';
  const body = contentType.includes('application/json') ? await res.json() : await res.text();
  return { res, body };
}

function $(id) { return document.getElementById(id); }

function requireAuth() {
  const token = getToken();
  if (!token) {
    window.location.href = '/app/login';
    return false;
  }
  return true;
}

function renderNav(active) {
  const nav = document.querySelector('nav');
  if (!nav) return;
  const token = getToken();

  const links = token
    ? [
        { href: '/app/dashboard', label: 'Dashboard', key: 'dashboard' },
        { href: '/app/recommendation', label: 'Rekomendasi', key: 'recommendation' },
        { href: '/app/history', label: 'History', key: 'history' },
        { href: '/app/profile', label: 'Update Progres', key: 'profile' },
      ]
    : [
        { href: '/app/login', label: 'Login', key: 'login' },
        { href: '/app/register', label: 'Register', key: 'register' },
      ];

  nav.innerHTML = links
    .map((l) => {
      const isActive = active === l.key ? ' (aktif)' : '';
      return `<a href="${l.href}">${l.label}${isActive}</a>`;
    })
    .join('');

  if (token) {
    nav.innerHTML += ` <button id="logoutBtn" type="button">Logout</button>`;
    const btn = $('logoutBtn');
    if (btn) {
      btn.addEventListener('click', () => {
        clearToken();
        window.location.href = '/app/login';
      });
    }
  }
}
