(function() {
  async function get(path) { const r = await fetch(path); return r.json(); }
  async function patch(path, body) { const r = await fetch(path, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); return r.json(); }

  document.addEventListener('DOMContentLoaded', async () => {
    try {
      const me = await get('/api/auth/me');
      if (!me || !me.id) { window.location.href = '/login'; return; }
    } catch { window.location.href = '/login'; return; }

    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
          await patch('/api/user/profile', {
            name: (form.querySelector('input[type="text"]') || {}).value || undefined
          });
        } catch {}
        window.location.href = '/dashboard';
      });
    });

    const buttons = document.querySelectorAll('button');
    buttons.forEach(btn => {
      if (btn.type !== 'submit') {
        btn.addEventListener('click', () => {
          window.location.href = '/dashboard';
        });
      }
    });

    const links = document.querySelectorAll('a');
    links.forEach(a => {
      a.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = a.getAttribute('href') === '#' ? '/dashboard' : a.href;
      });
    });

    const inputs = document.querySelectorAll('input');
    const nextBtn = document.querySelector('button[type="submit"]') || document.querySelector('button:last-child');
    inputs.forEach(inp => {
      inp.addEventListener('input', () => {
        const filled = Array.from(inputs).every(i => i.value.trim().length > 0);
        if (nextBtn) nextBtn.disabled = !filled;
      });
    });
  });
})();
