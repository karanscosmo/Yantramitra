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
      const twinContainer = document.querySelector('[class*="rounded-2xl"]') || document.querySelector('[class*="h-80"]') || document.querySelector('.flex-grow');
      if (twinContainer && machines.length > 0) {
        const infoPanel = twinContainer.querySelector('.text-center.opacity-40') || twinContainer.querySelector('.flex.items-center.justify-center');
        if (infoPanel) {
          infoPanel.innerHTML = '<div class="grid grid-cols-2 gap-2 w-full max-w-md"><div class="col-span-2 text-left"><p class="font-label-caps text-primary">LIVE MACHINE STATUS (' + machines.length + ' assets)</p></div>' +
            machines.slice(0, 8).map(m => '<div class="p-2 bg-white/60 rounded-lg border border-outline-variant/20 flex items-center gap-2"><div class="w-2 h-2 rounded-full ' + (m.status === 'running' ? 'bg-secondary' : m.status === 'warning' || m.status === 'maintenance' ? 'bg-tertiary' : 'bg-outline') + '"></div><span class="text-xs">' + m.name + '</span></div>').join('') +
            '</div>';
        }
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
