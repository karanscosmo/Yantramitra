(function() {
  async function get(path) { const r = await fetch(path); return r.json(); }
  async function post(path, body) { const r = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); return r.json(); }

  async function checkAuth() {
    try { const me = await get('/api/auth/me'); if (!me || !me.id) window.location.href = '/login'; return me; }
    catch { window.location.href = '/login'; return null; }
  }

  document.addEventListener('DOMContentLoaded', async () => {
    const user = await checkAuth();
    if (!user) return;

    const data = await get('/api/dashboard/summary');
    if (!data) return;

    document.querySelectorAll('.nav-link, nav a').forEach(a => {
      a.addEventListener('click', e => {
        e.preventDefault();
        const txt = a.textContent.trim().toLowerCase();
        const map = { 'dashboard': '/dashboard', 'assets': '/assets', 'agents': '/agents', 'work orders': '/work-orders', 'settings': '/settings' };
        const href = a.getAttribute('href');
        if (href && href !== '#') return;
        for (const [key, val] of Object.entries(map)) {
          if (txt.includes(key)) { window.location.href = val; return; }
        }
      });
    });

    const plantBtns = document.querySelectorAll('button');
    plantBtns.forEach((btn, i) => {
      if (btn.textContent.includes('PLANT DRILLDOWN') || btn.textContent.includes('DRILLDOWN')) {
        btn.addEventListener('click', async () => {
          try {
            const plants = await get('/api/plants');
            if (plants && plants.length > 0) {
              const idx = Array.from(plantBtns).filter(b => b.textContent.includes('DRILLDOWN')).indexOf(btn);
              const plant = plants[idx] || plants[0];
              window.location.href = '/plant/' + plant.id;
            }
          } catch { window.location.href = '/plant/demo'; }
        });
      }
    });

    const viewAllBtn = Array.from(document.querySelectorAll('button')).find(btn =>
      btn.textContent.trim().toUpperCase().includes('VIEW ALL')
    );
    if (viewAllBtn) {
      viewAllBtn.addEventListener('click', () => { window.location.href = '/map'; });
    }

    const agentTerminalBtns = document.querySelectorAll('button');
    agentTerminalBtns.forEach(btn => {
      if (btn.textContent.includes('AGENT TERMINAL')) {
        btn.addEventListener('click', () => { window.location.href = '/agents'; });
      }
    });

    const allLinks = document.querySelectorAll('a[href="#"]');
    allLinks.forEach(a => {
      if (a.textContent.includes('Sitemap') || a.textContent.includes('Privacy') || a.textContent.includes('Terms')) return;
      a.addEventListener('click', e => {
        e.preventDefault();
        const text = a.textContent.trim().toLowerCase();
        if (text.includes('asset')) window.location.href = '/assets';
        else if (text.includes('agent')) window.location.href = '/agents';
        else if (text.includes('work')) window.location.href = '/work-orders';
        else if (text.includes('setting')) window.location.href = '/settings';
        else if (text.includes('map')) window.location.href = '/map';
      });
    });
  });
})();
