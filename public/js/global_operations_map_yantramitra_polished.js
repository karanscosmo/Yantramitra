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
      const plants = await get('/api/plants');
      const mapEl = document.querySelector('[data-location="World"]') || document.querySelector('.h-full.flex.items-center.justify-center') || document.querySelector('.flex-grow.flex');
      if (mapEl && plants.length > 0) {
        const parent = mapEl.closest('.flex-grow') || mapEl.closest('.h-full') || mapEl.parentElement;
        if (parent) {
          parent.innerHTML = '<div class="w-full h-full rounded-xl bg-surface-container-high/40 border border-outline-variant/20 p-4 overflow-auto"><div class="grid grid-cols-1 gap-2">' +
            plants.map(p => '<div class="flex items-center gap-3 p-3 bg-white/60 rounded-lg border border-outline-variant/20 cursor-pointer hover:bg-white/90 transition-colors" data-plant-id="' + p.id + '"><div class="w-2 h-2 rounded-full ' + (p.status === 'operational' ? 'bg-secondary' : 'bg-tertiary') + '"></div><div><p class="text-xs font-bold">' + p.name + '</p><p class="text-[10px] text-on-surface-variant">' + p.location + ' · ' + p._count.machines + ' machines</p></div></div>'
            ).join('') + '</div></div>';
          parent.querySelectorAll('[data-plant-id]').forEach(el => {
            el.addEventListener('click', () => { window.location.href = '/plant/' + el.dataset.plantId; });
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
        else if (txt.includes('agent')) window.location.href = '/agents';
        else if (txt.includes('work')) window.location.href = '/work-orders';
        else if (txt.includes('setting')) window.location.href = '/settings';
      });
    });
  });
})();
