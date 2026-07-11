(function() {
  async function get(path) { const r = await fetch(path); return r.json(); }
  async function post(path, body) { const r = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); return r.json(); }
  async function patch(path, body) { const r = await fetch(path, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); return r.json(); }

  async function checkAuth() {
    try { const me = await get('/api/auth/me'); if (!me || !me.id) window.location.href = '/login'; return me; }
    catch { window.location.href = '/login'; return null; }
  }

  document.addEventListener('DOMContentLoaded', async () => {
    const user = await checkAuth();
    if (!user) return;

    try {
      const profile = await get('/api/user/profile');
      const forms = document.querySelectorAll('form');
      forms.forEach(form => {
        const inputs = form.querySelectorAll('input');
        inputs.forEach(inp => {
          if (inp.type === 'email' && profile.email) inp.value = profile.email;
          if (inp.type === 'text' && !inp.placeholder?.includes('@') && profile.name) inp.value = profile.name;
          if (!inp.id) inp.id = 'settings-input-' + Math.random().toString(36).slice(2, 8);
        });

        form.addEventListener('submit', async (e) => {
          e.preventDefault();
          const formData = {};
          inputs.forEach(inp => {
            if (inp.type === 'email') formData.email = inp.value;
            else if (inp.type === 'text') formData.name = inp.value;
          });
          try {
            const result = await patch('/api/user/profile', formData);
            if (result && result.id) {
              const msg = document.createElement('p');
              msg.className = 'text-secondary text-sm mt-2';
              msg.textContent = 'Settings saved successfully!';
              form.appendChild(msg);
              setTimeout(() => msg.remove(), 3000);
            }
          } catch (err) {
            const msg = document.createElement('p');
            msg.className = 'text-error text-sm mt-2';
            msg.textContent = 'Failed to save settings';
            form.appendChild(msg);
            setTimeout(() => msg.remove(), 3000);
          }
        });
      });

      const logoutBtn = document.querySelector('a[href="#logout"], button:has(span:contains("logout"))');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', async (e) => {
          e.preventDefault();
          await post('/api/auth/logout', {});
          window.location.href = '/login';
        });
      }

    } catch {}

    document.querySelectorAll('a[href="#"]').forEach(a => {
      a.addEventListener('click', e => {
        e.preventDefault();
        const txt = a.textContent.trim().toLowerCase();
        if (txt.includes('dashboard')) window.location.href = '/dashboard';
        else if (txt.includes('asset')) window.location.href = '/assets';
        else if (txt.includes('work')) window.location.href = '/work-orders';
        else if (txt.includes('logout') || txt.includes('sign out')) {
          post('/api/auth/logout', {}).then(() => window.location.href = '/login');
        }
      });
    });
  });
})();
