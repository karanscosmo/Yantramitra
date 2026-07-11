(function() {
  async function get(path) { const r = await fetch(path); return r.json(); }
  async function post(path, body) { const r = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); return r.json(); }
  async function patch(path, body) { const r = await fetch(path, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); return r.json(); }

  const columns = [
    { key: 'idle', title: 'Proposed', dot: 'bg-outline' },
    { key: 'active', title: 'In Progress', dot: 'bg-primary' },
    { key: 'paused', title: 'Awaiting Approval', dot: 'bg-tertiary-fixed-dim' },
    { key: 'done', title: 'Done', dot: 'bg-secondary' },
  ];

  async function checkAuth() {
    try { const me = await get('/api/auth/me'); if (!me || !me.id) window.location.href = '/login'; return me; }
    catch { window.location.href = '/login'; return null; }
  }

  function statusNext(status) {
    return status === 'idle' ? { status: 'active', progress: 25 } :
      status === 'active' ? { status: 'paused', progress: 75 } :
      status === 'paused' ? { status: 'done', progress: 100 } :
      { status: 'idle', progress: 0 };
  }

  function card(agent) {
    const progress = Math.max(0, Math.min(100, Number(agent.progress) || 0));
    return `
      <article class="glass-card rounded-xl p-md flex flex-col gap-md border border-outline-variant/30" data-agent-id="${agent.id}" data-status="${agent.status}">
        <div class="flex justify-between items-start gap-2">
          <h3 class="font-section-header text-body-md text-on-surface leading-tight">${agent.name}</h3>
          <span class="text-[10px] font-bold uppercase text-primary">${agent.model}</span>
        </div>
        <p class="text-sm text-on-surface-variant">${agent.mission || 'No active mission'}</p>
        <div class="w-full bg-surface-container rounded-full h-1.5"><div class="bg-primary h-1.5 rounded-full" style="width:${progress}%"></div></div>
        <div class="flex items-center justify-between font-label-caps text-[10px] text-on-surface-variant">
          <span>${agent.type}</span><span>${progress}%</span>
        </div>
        <button class="ym-advance-agent rounded-full border border-primary/30 text-primary py-2 font-bold hover:bg-primary hover:text-white transition-colors">${agent.status === 'done' ? 'Restart' : 'Advance State'}</button>
      </article>`;
  }

  async function render() {
    const main = document.querySelector('main');
    if (!main) return;
    const agents = await get('/api/agents');
    main.innerHTML = `
      <header class="mb-lg flex flex-col md:flex-row md:justify-between md:items-end gap-md">
        <div>
          <h1 class="font-headline-lg text-headline-lg text-primary mb-xs">Mission Control</h1>
          <p class="text-on-surface-variant font-body-md max-w-xl">Persisted autonomous missions across Pune, Ahmedabad, Chennai, Bengaluru, and Nagpur.</p>
        </div>
        <button id="ym-new-mission" class="shimmer bg-primary-container text-on-primary px-6 py-2.5 rounded-full font-label-caps flex items-center justify-center gap-xs shadow-[0_4px_10px_rgba(91,91,240,0.3)]">
          <span class="material-symbols-outlined text-[18px]">add</span>New Mission
        </button>
      </header>
      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-gutter">
        ${columns.map(col => {
          const items = agents.filter(a => (a.status || 'idle') === col.key);
          return `<section class="flex flex-col gap-sm">
            <div class="flex items-center justify-between px-xs mb-2">
              <span class="font-label-caps text-on-surface-variant flex items-center gap-2"><span class="w-1.5 h-1.5 rounded-full ${col.dot}"></span>${col.title}</span>
              <span class="bg-surface-container-high px-2 py-0.5 rounded text-[10px] font-bold text-on-surface-variant">${items.length}</span>
            </div>
            ${items.map(card).join('') || '<div class="rounded-xl border border-dashed border-outline-variant/60 p-md text-sm text-on-surface-variant">No missions here.</div>'}
          </section>`;
        }).join('')}
      </div>`;

    main.querySelector('#ym-new-mission').addEventListener('click', async () => {
      const title = prompt('Mission name', 'Investigate Pune CNC spindle drift');
      if (!title) return;
      const mission = prompt('Mission brief', 'Analyze latest alarms, sensor readings, and recommend maintenance action.');
      await post('/api/agents', { name: title, mission, type: 'analysis', model: 'Diagnostic-D2', status: 'idle', progress: 0 });
      await render();
    });

    main.querySelectorAll('.ym-advance-agent').forEach(btn => {
      btn.addEventListener('click', async () => {
        const cardEl = btn.closest('[data-agent-id]');
        await patch('/api/agents/' + cardEl.dataset.agentId, statusNext(cardEl.dataset.status));
        await render();
      });
    });
  }

  document.addEventListener('DOMContentLoaded', async () => {
    const user = await checkAuth();
    if (!user) return;
    await render();
  });
})();
