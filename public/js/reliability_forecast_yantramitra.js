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
      const reliability = await get('/api/analytics/reliability');
      const container = document.querySelector('[class*="grid"]') || document.querySelector('main') || document.querySelector('[class*="flex-wrap"]');

      if (container && reliability.length > 0) {
        const cards = container.querySelectorAll('[class*="rounded-2xl"], [class*="rounded-xl"], .glass-panel');
        cards.forEach((card, idx) => {
          if (idx < reliability.length) {
            const r = reliability[idx];
            const nameEl = card.querySelector('h3, .font-section-header');
            if (nameEl) nameEl.textContent = r.plantName;
            const valEl = card.querySelector('.font-kpi-numeric, .text-3xl, .text-2xl.font-bold');
            if (valEl) valEl.textContent = r.avgHealth.toFixed(1) + '%';
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
      });
    });
  });
})();
