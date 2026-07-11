(function() {
  async function get(path) { const r = await fetch(path); return r.json(); }
  async function patch(path, body) { const r = await fetch(path, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); return r.json(); }

  async function checkAuth() {
    try { const me = await get('/api/auth/me'); if (!me || !me.id) window.location.href = '/login'; return me; }
    catch { window.location.href = '/login'; return null; }
  }

  document.addEventListener('DOMContentLoaded', async () => {
    const user = await checkAuth();
    if (!user) return;

    try {
      const alarms = await get('/api/alarms');
      const container = document.querySelector('.overflow-y-auto') || document.querySelector('main') || document.querySelector('[class*="space-y"]');

      if (container && alarms.length > 0) {
        let target = container;
        if (container.tagName === 'MAIN') {
          const inner = container.querySelector('.space-y, .grid, .flex-wrap') || container;
          target = inner;
        }

        const existingItems = target.querySelectorAll('[class*="border"][class*="rounded"]');
        if (existingItems.length >= alarms.length) {
          existingItems.forEach((item, idx) => {
            if (idx < alarms.length) {
              const a = alarms[idx];
              const titleEl = item.querySelector('.font-bold, h3, h4, .text-xs.font-bold');
              if (titleEl) titleEl.textContent = a.title;
              const descEl = item.querySelector('.text-xs.leading-relaxed, .text-xs.text-on-surface-variant');
              if (descEl) descEl.textContent = a.machine?.name + ': ' + a.message;
              const severityEl = item.querySelector('.w-2.h-2, .rounded-full');
              if (severityEl && severityEl.className.includes('rounded-full') && severityEl.offsetWidth < 20) {
                severityEl.className = 'w-2 h-2 rounded-full ' +
                  (a.severity === 'critical' ? 'bg-error' : a.severity === 'warning' ? 'bg-tertiary' : 'bg-secondary');
              }
              item.querySelectorAll('button').forEach(btn => {
                btn.addEventListener('click', async () => {
                  await patch('/api/alarms/' + a.id + '/resolve', { status: 'resolved' });
                  item.style.opacity = '0.5';
                  btn.textContent = 'Resolved';
                  btn.disabled = true;
                });
              });
            }
          });
        }
      }
    } catch {}

    document.querySelectorAll('a[href="#"]').forEach(a => {
      a.addEventListener('click', e => {
        e.preventDefault();
        const txt = a.textContent.trim().toLowerCase();
        if (txt.includes('dashboard')) window.location.href = '/dashboard';
        else if (txt.includes('asset')) window.location.href = '/assets';
        else if (txt.includes('work')) window.location.href = '/work-orders';
        else if (txt.includes('setting')) window.location.href = '/settings';
      });
    });
  });
})();
