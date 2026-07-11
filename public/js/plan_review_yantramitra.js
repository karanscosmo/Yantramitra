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

    async function loadPlans() {
      try {
        const plans = await get('/api/plans');
        const container = document.querySelector('[class*="space-y"]') || document.querySelector('main') || document.querySelector('[class*="overflow-y-auto"]');
        if (!container || !plans.length) return;

        let target = container;
        if (container.tagName === 'MAIN') {
          target = container.querySelector('.space-y, .grid') || container;
        }

        const planCards = target.querySelectorAll('[class*="rounded-2xl"], [class*="rounded-xl"], .glass-panel');
        const relevantCards = Array.from(planCards).filter(c =>
          c.querySelector('h3, .font-section-header') ||
          c.querySelector('button') || c.textContent.includes('Pending') || c.textContent.includes('Review')
        );

        relevantCards.forEach((card, idx) => {
          if (idx < plans.length) {
            const plan = plans[idx];
            const titleEl = card.querySelector('h3, .font-section-header, .text-sm.font-bold');
            if (titleEl) titleEl.textContent = plan.title;
            const statusEls = card.querySelectorAll('span, .text-xs.font-medium, .px-2.py-1');
            statusEls.forEach(el => {
              if (['pending', 'approved', 'rejected', 'draft'].includes(el.textContent.trim().toLowerCase())) {
                el.textContent = plan.status.charAt(0).toUpperCase() + plan.status.slice(1);
                el.className = 'px-2 py-0.5 rounded-full text-[10px] font-bold ' +
                  (plan.status === 'approved' ? 'bg-secondary-container text-on-secondary-container' :
                   plan.status === 'rejected' ? 'bg-error-container text-on-error-container' :
                   'bg-tertiary-fixed-dim text-on-tertiary-fixed-variant');
              }
            });

            const approveBtn = card.querySelector('button:first-child');
            const rejectBtn = card.querySelector('button:last-child');
            if (approveBtn && rejectBtn) {
              approveBtn.addEventListener('click', async (e) => {
                e.stopPropagation();
                await patch('/api/plans/' + plan.id, { status: 'approved' });
                await loadPlans();
              });
              rejectBtn.addEventListener('click', async (e) => {
                e.stopPropagation();
                await patch('/api/plans/' + plan.id, { status: 'rejected' });
                await loadPlans();
              });
            }
          }
        });
      } catch {}
    }

    await loadPlans();

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
