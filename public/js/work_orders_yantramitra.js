(function() {
  async function get(path) { const r = await fetch(path); return r.json(); }
  async function post(path, body) { const r = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); return r.json(); }
  async function patch(path, body) { const r = await fetch(path, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); return r.json(); }

  async function checkAuth() {
    try { const me = await get('/api/auth/me'); if (!me || !me.id) window.location.href = '/login'; return me; }
    catch { window.location.href = '/login'; return null; }
  }

  document.addEventListener('DOMContentLoaded', async () => {
    const user = await checkAuth();
    if (!user) return;

    function toast(message) {
      document.querySelector('.ym-work-toast')?.remove();
      const el = document.createElement('div');
      el.className = 'ym-work-toast fixed left-1/2 top-24 -translate-x-1/2 z-[120] rounded-full border border-primary/20 bg-white/95 px-5 py-3 text-sm font-bold text-primary shadow-xl';
      el.textContent = message;
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 2600);
    }

    async function loadOrders() {
      try {
        const orders = await get('/api/work-orders');
        const container = document.querySelector('[class*="space-y"]') || document.querySelector('main') || document.querySelector('[class*="overflow-y-auto"]');

        if (!container || !orders.length) return;

        let target = container;
        if (container.tagName === 'MAIN') {
          target = container.querySelector('.space-y, .grid') || container;
        }

        const orderCards = target.querySelectorAll('[class*="rounded-2xl"], [class*="rounded-xl"], .glass-panel, [class*="border"]');
        const relevantCards = Array.from(orderCards).filter(c =>
          c.querySelector('h3, .font-section-header, .text-sm.font-bold') ||
          c.querySelector('img[class*="rounded-full"]')
        );

        relevantCards.forEach((card, idx) => {
          if (idx < orders.length) {
            const o = orders[idx];
            const titleEl = card.querySelector('h3, .font-section-header, .text-sm.font-bold');
            if (titleEl) titleEl.textContent = o.title;
            const descEls = card.querySelectorAll('p, .text-xs');
            descEls.forEach(p => {
              if (p.textContent.length > 20 && p !== titleEl) {
                p.textContent = o.description || o.title;
              }
            });
            const badgeEl = card.querySelector('[class*="rounded-full"], [class*="px-2"]');
            if (badgeEl && badgeEl.offsetWidth < 50) {
              badgeEl.className = 'px-2 py-0.5 rounded-full text-[10px] font-bold ' +
                (o.status === 'completed' ? 'bg-secondary-container text-on-secondary-container' :
                 o.status === 'in_progress' || o.status === 'in-progress' ? 'bg-primary-container text-on-primary-container' :
                 'bg-tertiary-fixed-dim text-on-tertiary-fixed-variant');
              badgeEl.textContent = o.status === 'in_progress' ? 'In Progress' : o.status.charAt(0).toUpperCase() + o.status.slice(1);
            }

            card.querySelectorAll('button, .cursor-pointer').forEach(btn => {
              btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const newStatus = o.status === 'open' ? 'in_progress' : o.status === 'in_progress' ? 'completed' : 'open';
                await patch('/api/work-orders/' + o.id, { status: newStatus });
                await loadOrders();
              });
            });
          }
        });
      } catch {}
    }

    await loadOrders();

    const createButton = Array.from(document.querySelectorAll('button')).find(button => /create order/i.test(button.textContent));
    createButton?.addEventListener('click', async () => {
      const original = createButton.innerHTML;
      createButton.disabled = true;
      createButton.innerHTML = '<span class="material-symbols-outlined animate-spin">sync</span> CREATING';
      await post('/api/work-orders', {
        title: 'Inspect Conveyor Line PN-601',
        description: 'Created from Work Orders dashboard for Pune Auto Components pressure-valve calibration.',
        status: 'open',
        priority: 'high',
        assignedTo: 'Elias Thorne',
        dueDate: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
      }).catch(() => {});
      toast('Work order created and assigned to Elias Thorne');
      createButton.innerHTML = original;
      createButton.disabled = false;
      await loadOrders();
    });

    document.querySelectorAll('.glass-drawer [class*="radio_button_unchecked"], .glass-drawer [class*="check_circle"]').forEach(icon => {
      icon.closest('div')?.addEventListener('click', () => {
        const checked = icon.textContent.trim() === 'check_circle';
        icon.textContent = checked ? 'radio_button_unchecked' : 'check_circle';
        icon.classList.toggle('text-secondary', !checked);
        icon.classList.toggle('text-outline', checked);
        const text = icon.parentElement?.querySelector('span:not(.material-symbols-outlined)');
        text?.classList.toggle('line-through', !checked);
        toast(checked ? 'Checklist item reopened' : 'Checklist item completed');
      });
    });

    Array.from(document.querySelectorAll('button')).forEach(button => {
      const text = button.textContent.trim().toLowerCase();
      if (text.includes('pause session')) {
        button.addEventListener('click', () => {
          button.textContent = button.textContent.includes('RESUME') ? 'PAUSE SESSION' : 'RESUME SESSION';
          toast(button.textContent.includes('RESUME') ? 'Work session paused' : 'Work session resumed');
        });
      }
      if (text.includes('mark as complete')) {
        button.addEventListener('click', async () => {
          button.textContent = 'COMPLETED';
          button.disabled = true;
          button.classList.add('opacity-80');
          toast('WO-9302 marked complete');
        });
      }
    });

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
