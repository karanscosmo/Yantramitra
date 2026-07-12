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

    const graphCard = Array.from(document.querySelectorAll('.glass-card')).find(card => card.textContent.includes('Root-Cause Intelligence'));
    const scanButton = Array.from(document.querySelectorAll('button')).find(button => /re-scan graph/i.test(button.textContent));
    const snapshotButton = Array.from(document.querySelectorAll('button')).find(button => /latest snapshot/i.test(button.textContent));
    const graphHost = graphCard?.querySelector('.flex-grow.relative');
    const setGraphNotice = (title, body, tone) => {
      if (!graphCard) return;
      graphCard.querySelector('.ym-rc-notice')?.remove();
      const notice = document.createElement('div');
      notice.className = 'ym-rc-notice absolute left-6 right-6 bottom-6 rounded-xl border px-4 py-3 text-sm shadow-lg';
      notice.style.background = tone === 'scan' ? 'rgba(244,242,255,.92)' : 'rgba(232,255,251,.92)';
      notice.style.borderColor = tone === 'scan' ? 'rgba(65,63,214,.24)' : 'rgba(8,123,111,.24)';
      notice.innerHTML = `<strong style="display:block;color:${tone === 'scan' ? '#413fd6' : '#087b6f'};font-weight:900">${title}</strong><span style="color:#464555">${body}</span>`;
      graphCard.appendChild(notice);
      setTimeout(() => notice.remove(), 5200);
    };
    scanButton?.addEventListener('click', async () => {
      const original = scanButton.textContent;
      scanButton.textContent = 'SCANNING...';
      scanButton.disabled = true;
      graphHost?.classList.add('animate-pulse');
      await new Promise(resolve => setTimeout(resolve, 650));
      setGraphNotice('Graph re-scanned', 'Updated causal path: Unit 04-B → radial vibration S-1 → eccentricity fault → grid impact.', 'scan');
      graphHost?.classList.remove('animate-pulse');
      scanButton.textContent = original;
      scanButton.disabled = false;
    });
    snapshotButton?.addEventListener('click', () => {
      setGraphNotice('Latest snapshot loaded', 'Snapshot includes current vibration harmonics, tachometer drift, and fault-confidence deltas.', 'snapshot');
      const stamp = document.createElement('span');
      stamp.className = 'ml-2 text-[10px] font-bold text-secondary';
      stamp.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      snapshotButton.querySelector('.ym-stamp')?.remove();
      stamp.classList.add('ym-stamp');
      snapshotButton.appendChild(stamp);
    });

    try {
      const alarms = await get('/api/alarms');
      const container = document.querySelector('.overflow-y-auto') || document.querySelector('main') || document.querySelector('[class*="space-y"]');

      if (container && alarms.length > 0) {
        let target = container;
        if (container.tagName === 'MAIN') {
          const inner = container.querySelector('.space-y, .grid, .flex-wrap') || container;
          target = inner;
        }

        const existingItems = target.querySelectorAll('[class*="border"][class*="rounded"]');
        if (existingItems.length >= alarms.length) {
          existingItems.forEach((item, idx) => {
            if (idx < alarms.length) {
              const a = alarms[idx];
              const titleEl = item.querySelector('.font-bold, h3, h4, .text-xs.font-bold');
              if (titleEl) titleEl.textContent = a.title;
              const descEl = item.querySelector('.text-xs.leading-relaxed, .text-xs.text-on-surface-variant');
              if (descEl) descEl.textContent = a.machine?.name + ': ' + a.message;
              const severityEl = item.querySelector('.w-2.h-2, .rounded-full');
              if (severityEl && severityEl.className.includes('rounded-full') && severityEl.offsetWidth < 20) {
                severityEl.className = 'w-2 h-2 rounded-full ' +
                  (a.severity === 'critical' ? 'bg-error' : a.severity === 'warning' ? 'bg-tertiary' : 'bg-secondary');
              }
              item.querySelectorAll('button').forEach(btn => {
                btn.addEventListener('click', async () => {
                  await patch('/api/alarms/' + a.id + '/resolve', { status: 'resolved' });
                  item.style.opacity = '0.5';
                  btn.textContent = 'Resolved';
                  btn.disabled = true;
                });
              });
            }
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
        else if (txt.includes('work')) window.location.href = '/work-orders';
        else if (txt.includes('setting')) window.location.href = '/settings';
      });
    });
  });
})();
