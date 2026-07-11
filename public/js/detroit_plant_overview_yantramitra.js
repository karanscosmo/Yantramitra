(function() {
  async function get(path) { const r = await fetch(path); return r.json(); }

  async function checkAuth() {
    try { const me = await get('/api/auth/me'); if (!me || !me.id) window.location.href = '/login'; return me; }
    catch { window.location.href = '/login'; return null; }
  }

  document.addEventListener('DOMContentLoaded', async () => {
    const user = await checkAuth();
    if (!user) return;

    const plantId = window.location.pathname.split('/plant/')[1] || '';
    try {
      const plants = await get('/api/plants');
      const plant = plants.find(p => p.id === plantId) || plants[0];
      if (!plant) return;

      const heroTitle = document.querySelector('h1');
      if (heroTitle) heroTitle.textContent = plant.name;
      const subtitle = Array.from(document.querySelectorAll('p')).find(p => p.textContent.includes('Detroit') || p.textContent.includes('factory') || p.textContent.includes('plant'));
      if (subtitle) subtitle.textContent = `${plant.domain || 'Industrial facility'} in ${plant.location}. OEE ${plant.oee || 'n/a'}%, uptime ${plant.uptime || 'n/a'}%.`;
      document.querySelectorAll('img').forEach(img => {
        if (img.src.includes('factory') || img.src.includes('control') || img.src.includes('digital-twin')) img.src = plant.image || img.src;
      });

      const detail = await get('/api/plants/' + (plant.id || plantId));
      if (detail && detail.machines) {
        const machineList = document.querySelector('.grid-cols-1.md\\:grid-cols-3') ||
          document.querySelector('[class*="grid-cols"]');
        if (machineList) {
          const machineCards = machineList.querySelectorAll('.glass-panel, [class*="rounded-xl"]');
          machineCards.forEach((card, idx) => {
            if (idx < detail.machines.length) {
              const m = detail.machines[idx];
              const nameEl = card.querySelector('h3, h4, .font-section-header');
              if (nameEl) nameEl.textContent = m.name;
              const healthEl = card.querySelector('.font-kpi-numeric');
              if (healthEl) healthEl.textContent = m.health.toFixed(1) + '%';
              const statusEl = card.querySelector('.pulsing-green, .pulsing-amber');
              if (statusEl) {
                statusEl.className = 'w-3 h-3 rounded-full ' + (m.status === 'running' ? 'bg-secondary pulsing-green' : 'bg-tertiary pulsing-amber');
              }
            }
          });
        }
      }

      const drilldownBtns = document.querySelectorAll('button');
      drilldownBtns.forEach(btn => {
        if (btn.textContent.includes('DRILLDOWN') || btn.textContent.includes('ASSET')) {
          btn.addEventListener('click', () => { window.location.href = btn.textContent.toLowerCase().includes('digital') ? '/digital-twin' : '/assets'; });
        }
      });
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
