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
      const machines = await get('/api/machines');
      const container = document.querySelector('.grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-3') ||
        document.querySelector('[class*="grid-cols"]') ||
        document.querySelector('main') || document.querySelector('.overflow-y-auto');

      if (container && machines.length > 0) {
        let target = container;
        if (container.tagName === 'MAIN') {
          const inner = container.querySelector('.grid, .space-y, .flex-wrap');
          if (inner) target = inner;
        }

        const cards = target.querySelectorAll('[class*="rounded-xl"], [class*="rounded-2xl"], .glass-panel, [class*="group"]');
        const clickableCards = Array.from(cards).filter(c => c.querySelector('button') || c.querySelector('h3') || c.querySelector('img'));

        clickableCards.forEach((card, idx) => {
          if (idx < machines.length) {
            const m = machines[idx];
            const nameEl = card.querySelector('h3') || card.querySelector('.font-section-header') || card.querySelector('.text-sm.font-bold');
            if (nameEl) nameEl.textContent = m.name;
            const statusEl = card.querySelector('[class*="pulsing"]') || card.querySelector('.rounded-full.w-2');
            if (statusEl) {
              statusEl.className = (statusEl.className.includes('h-2') ? 'w-2 h-2 ' : 'w-3 h-3 ') + 'rounded-full ' +
                (m.status === 'running' ? 'bg-secondary pulsing-green' : m.status === 'warning' || m.status === 'maintenance' ? 'bg-tertiary pulsing-amber' : 'bg-outline');
            }
            const healthEl = card.querySelector('.font-kpi-numeric') || card.querySelector('[class*="text-xl"]');
            if (healthEl && !healthEl.textContent.includes('%')) {
              healthEl.textContent = m.health.toFixed(1) + '%';
            }
            card.style.cursor = 'pointer';
            card.addEventListener('click', () => {
              window.location.href = '/assets/' + m.id;
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
        else if (txt.includes('agent')) window.location.href = '/agents';
        else if (txt.includes('work')) window.location.href = '/work-orders';
        else if (txt.includes('setting')) window.location.href = '/settings';
      });
    });
  });
})();
