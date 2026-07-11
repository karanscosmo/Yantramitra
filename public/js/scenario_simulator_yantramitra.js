(function() {
  async function get(path) { const r = await fetch(path); return r.json(); }

  async function checkAuth() {
    try { const me = await get('/api/auth/me'); if (!me || !me.id) window.location.href = '/login'; return me; }
    catch { window.location.href = '/login'; return null; }
  }

  document.addEventListener('DOMContentLoaded', async () => {
    const user = await checkAuth();
    if (!user) return;

    const btns = document.querySelectorAll('button');
    btns.forEach(btn => {
      btn.addEventListener('click', function() {
        const original = this.textContent;
        this.textContent = 'Running Simulation...';
        this.disabled = true;
        this.innerHTML = '<span class="material-symbols-outlined animate-spin">sync</span> Simulating...';
        setTimeout(() => {
          this.innerHTML = '<span class="material-symbols-outlined">check_circle</span> Complete';
          setTimeout(() => {
            this.textContent = original;
            this.disabled = false;
          }, 2000);
        }, 2000);
      });
    });

    const selects = document.querySelectorAll('select');
    selects.forEach(sel => {
      try {
        get('/api/machines').then(machines => {
          if (machines && machines.length > 0) {
            sel.innerHTML = '<option value="">Select asset...</option>' +
              machines.map(m => '<option value="' + m.id + '">' + m.name + ' - ' + m.plant?.name + '</option>').join('');
          }
        }).catch(() => {});
      } catch {}
    });

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
