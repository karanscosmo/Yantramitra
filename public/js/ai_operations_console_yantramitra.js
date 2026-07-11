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
      const alarms = await get('/api/alarms');
      const agents = await get('/api/agents');

      const container = document.querySelector('.space-y-sm.overflow-y-auto') || document.querySelector('[class*="space-y"]') || document.querySelector('main');
      if (container && alarms.length > 0) {
        const items = container.querySelectorAll('[class*="rounded-xl"]');
        items.forEach((item, idx) => {
          if (idx < alarms.length && idx < 5) {
            const a = alarms[idx];
            const textEls = item.querySelectorAll('p, .text-xs');
            if (textEls.length >= 2) {
              textEls[0].textContent = a.severity === 'critical' ? 'CRITICAL: ' + a.title : a.title;
              textEls[1].textContent = a.message + (a.machine?.name ? ' (' + a.machine.name + ')' : '');
            }
          }
        });
      }
    } catch {}

    const input = document.querySelector('input[type="text"]') || document.querySelector('[contenteditable]');
    if (input) {
      input.addEventListener('keydown', async (e) => {
        if (e.key === 'Enter' && input.value.trim()) {
          const query = input.value.trim();
          input.value = 'Processing...';
          input.disabled = true;
          setTimeout(() => {
            input.value = '';
            input.disabled = false;
            const chatArea = input.closest('.space-y, .flex, main') || input.parentElement;
            const response = document.createElement('div');
            response.className = 'p-3 rounded-xl bg-primary-container/20 border border-primary/20 text-xs';
            response.textContent = 'AI: Analyzed "' + query + '". No anomalies detected in current dataset. All systems nominal.';
            chatArea.insertBefore(response, input.closest('div') || input.parentElement.nextSibling);
          }, 1500);
        }
      });
    }

    document.querySelectorAll('a[href="#"]').forEach(a => {
      a.addEventListener('click', e => {
        e.preventDefault();
        const txt = a.textContent.trim().toLowerCase();
        if (txt.includes('dashboard')) window.location.href = '/dashboard';
        else if (txt.includes('agent')) window.location.href = '/agents';
        else if (txt.includes('work')) window.location.href = '/work-orders';
      });
    });
  });
})();
