(function() {
  async function get(path) { const r = await fetch(path); return r.json(); }

  async function checkAuth() {
    try { const me = await get('/api/auth/me'); if (!me || !me.id) window.location.href = '/login'; return me; }
    catch { window.location.href = '/login'; return null; }
  }

  document.addEventListener('DOMContentLoaded', async () => {
    const user = await checkAuth();
    if (!user) return;

    try {
      const [machines, workOrders] = await Promise.all([
        get('/api/machines'),
        get('/api/work-orders')
      ]);
      const container = document.querySelector('[class*="space-y"]') || document.querySelector('main') || document.querySelector('[class*="overflow-y-auto"]');

      if (container && machines.length > 0) {
        let target = container;
        if (container.tagName === 'MAIN') {
          target = container.querySelector('.space-y, .grid, .flex') || container;
        }
        const cards = target.querySelectorAll('[class*="rounded-2xl"], [class*="rounded-xl"], .glass-panel');
        const relevantCards = Array.from(cards).filter(c =>
          c.querySelector('h3, .font-section-header, .text-sm.font-bold')
        );

        relevantCards.forEach((card, idx) => {
          if (idx < machines.length) {
            const m = machines[idx];
            const nameEl = card.querySelector('h3, .font-section-header, .text-sm.font-bold');
            if (nameEl) nameEl.textContent = m.name + ' — ' + (m.plant?.name || '');
            const statusEl = card.querySelector('[class*="rounded-full"]');
            if (statusEl && statusEl.offsetWidth < 20) {
              statusEl.className = 'w-3 h-3 rounded-full ' +
                (m.health > 80 ? 'bg-secondary' : m.health > 60 ? 'bg-tertiary' : 'bg-error');
            }
            card.querySelectorAll('button').forEach(btn => {
              btn.addEventListener('click', () => {
                window.location.href = '/work-orders';
              });
            });
          }
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
        else if (txt.includes('setting')) window.location.href = '/settings';
      });
    });
  });
})();
