(function() {
  async function get(path) { const r = await fetch(path); return r.json(); }

  async function checkAuth() {
    try { const me = await get('/api/auth/me'); if (!me || !me.id) window.location.href = '/login'; return me; }
    catch { window.location.href = '/login'; return null; }
  }

  function projectIndia(lat, lng) {
    const minLat = 7.5, maxLat = 32.5, minLng = 68, maxLng = 90;
    return {
      left: ((lng - minLng) / (maxLng - minLng)) * 100,
      top: (1 - (lat - minLat) / (maxLat - minLat)) * 100
    };
  }

  document.addEventListener('DOMContentLoaded', async () => {
    const user = await checkAuth();
    if (!user) return;

    try {
      const plants = await get('/api/plants');
      const target = document.querySelector('.flex-grow.flex') || document.querySelector('[data-location="World"]') || document.querySelector('main');
      const parent = target.closest('.flex-grow') || target;
      parent.innerHTML = `
        <div class="w-full h-full min-h-[640px] rounded-2xl bg-gradient-to-br from-white via-[#f4f2ff] to-[#e9fffb] border border-outline-variant/30 p-5 relative overflow-hidden">
          <div class="absolute inset-8 rounded-[40px] border border-primary/10 bg-white/35"></div>
          <div class="absolute left-[12%] top-[12%] text-[160px] font-black text-primary/5 select-none">INDIA</div>
          <div class="absolute inset-0">
            ${plants.map(p => {
              const pos = projectIndia(p.lat, p.lng);
              const fault = p.status !== 'operational';
              return `<button class="absolute -translate-x-1/2 -translate-y-1/2 group" style="left:${pos.left}%;top:${pos.top}%;" data-plant-id="${p.id}">
                <span class="block w-7 h-7 rounded-full ${fault ? 'bg-error' : 'bg-secondary'} ring-4 ring-white shadow-[0_0_22px_rgba(65,63,214,.3)] animate-pulse"></span>
                <span class="absolute left-8 top-1/2 -translate-y-1/2 w-64 text-left rounded-xl bg-white/90 border border-outline-variant/40 shadow-xl p-3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <strong class="block text-sm">${p.name}</strong>
                  <span class="block text-xs text-on-surface-variant">${p.location}</span>
                  <span class="block text-xs text-primary font-bold mt-1">${p.domain || 'Facility'} · ${p._count.machines} machines</span>
                </span>
              </button>`;
            }).join('')}
          </div>
          <div class="absolute bottom-5 left-5 right-5 grid grid-cols-1 md:grid-cols-5 gap-3">
            ${plants.map(p => `<button data-plant-id="${p.id}" class="text-left rounded-xl bg-white/85 border border-outline-variant/40 p-3 hover:border-primary transition-colors">
              <p class="font-bold text-sm">${p.name}</p>
              <p class="text-[11px] text-on-surface-variant">${p.domain}</p>
              <p class="text-[11px] text-primary font-bold mt-1">OEE ${p.oee}% · Uptime ${p.uptime}%</p>
            </button>`).join('')}
          </div>
        </div>`;
      parent.querySelectorAll('[data-plant-id]').forEach(el => {
        el.addEventListener('click', () => { window.location.href = '/plant/' + el.dataset.plantId; });
      });
    } catch {}
  });
})();
