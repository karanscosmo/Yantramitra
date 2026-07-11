(function() {
  const API = { base: '' };
  async function get(path) { const r = await fetch(API.base + path); return r.json(); }
  async function post(path, body) { const r = await fetch(API.base + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); return r.json(); }

  document.addEventListener('DOMContentLoaded', () => {
    const loginBtn = document.querySelector('a[href="#login"], .btn-primary-gradient, a[href*="login"]');
    if (loginBtn) loginBtn.addEventListener('click', e => { e.preventDefault(); window.location.href = '/login'; });

    const signupBtn = document.querySelector('a[href="#signup"], a[href*="signup"]');
    if (signupBtn) signupBtn.addEventListener('click', e => { e.preventDefault(); window.location.href = '/signup'; });

    (async () => {
      try {
        const me = await get('/api/auth/me');
        if (me && me.id) {
          document.querySelectorAll('.auth-show').forEach(el => el.style.display = '');
          document.querySelectorAll('.auth-hide').forEach(el => el.style.display = 'none');
        }
      } catch {}
    })();
  });
})();
