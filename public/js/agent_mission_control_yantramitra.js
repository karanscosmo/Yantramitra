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
      const agents = await get('/api/agents');
      const agentCards = document.querySelectorAll('[class*="rounded-2xl"], [class*="rounded-xl"]');
      const filterableCards = Array.from(agentCards).filter(c =>
        c.querySelector('h3') || c.querySelector('.font-section-header')
      );

      filterableCards.forEach((card, idx) => {
        if (idx < agents.length) {
          const agent = agents[idx];
          const nameEl = card.querySelector('h3, .font-section-header, .text-sm.font-bold');
          if (nameEl) nameEl.textContent = agent.name;
          const statusEl = card.querySelector('[class*="rounded-full"]');
          if (statusEl && statusEl.className.includes('rounded-full')) {
            statusEl.className = 'inline-block h-3 w-3 rounded-full ' +
              (agent.status === 'active' ? 'bg-secondary' : 'bg-outline-variant');
          }
          const missionEl = card.querySelectorAll('p');
          missionEl.forEach(p => {
            if (p.textContent.length > 20 && p.textContent !== agent.mission) {
              p.textContent = agent.mission || 'No active mission';
            }
          });
          card.addEventListener('click', () => {
            const newStatus = agent.status === 'active' ? 'idle' : 'active';
            patch('/api/agents/' + agent.id, { status: newStatus }).then(() => {
              window.location.reload();
            }).catch(() => {});
          });
        }
      });
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
