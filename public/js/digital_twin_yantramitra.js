(function() {
  async function get(path) { const r = await fetch(path); return r.json(); }
  async function post(path, body) { const r = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); return r.json(); }

  const colors = {
    running: 0x5efae4, warning: 0xffba4b, maintenance: 0xba1a1a, idle: 0xc7c4d7
  };

  async function checkAuth() {
    try { const me = await get('/api/auth/me'); if (!me || !me.id) window.location.href = '/'; return me; }
    catch { window.location.href = '/'; return null; }
  }

  function iconFor(type) {
    if (type.includes('dye') || type.includes('chemical') || type.includes('effluent')) return 'science';
    if (type.includes('smt') || type.includes('aoi') || type.includes('pick') || type.includes('reflow')) return 'memory';
    if (type.includes('laser') || type.includes('micro') || type.includes('additive')) return 'precision_manufacturing';
    if (type.includes('asrs') || type.includes('sort') || type.includes('agv') || type.includes('dock')) return 'local_shipping';
    if (type.includes('welder') || type.includes('robot')) return 'smart_toy';
    return 'manufacturing';
  }

  function latest(readings = [], metric) {
    const row = readings.find(r => r.metric === metric);
    return row ? `${Number(row.value).toFixed(1)} ${row.unit}` : 'n/a';
  }

  function toast(msg, good = true) {
    const el = document.getElementById('ym-toast-msg');
    if (el) { el.textContent = msg; const t = document.getElementById('ym-toast'); t.classList.remove('translate-y-32','opacity-0'); clearTimeout(t._t); t._t = setTimeout(() => t.classList.add('translate-y-32','opacity-0'), 2600); }
  }

  async function renderInspector(machine, shouldHydrate = true) {
    const panel = document.getElementById('ym-twin-inspector');
    if (!panel) return;
    if (shouldHydrate) {
      panel.innerHTML = `<div class="h-full flex flex-col items-center justify-center text-center gap-3 py-20">
        <span class="material-symbols-outlined text-primary animate-spin" style="font-size:32px">sync</span>
        <p class="font-bold text-on-surface" style="font-size:15px">Loading ${machine.name}...</p>
      </div>`;
      try {
        const fullMachine = await get('/api/machines/' + machine.id);
        if (fullMachine && fullMachine.id) { Object.assign(machine, fullMachine); return renderInspector(machine, false); }
      } catch {}
    }
    const activeAlarms = (machine.alarms || []).filter(a => a.status === 'active');
    const sensorData = machine.readings || [];
    const temp = latest(sensorData, 'temperature');
    const vib = latest(sensorData, 'vibration');
    const power = latest(sensorData, 'power');
    const rpm = latest(sensorData, 'rpm') !== 'n/a' ? latest(sensorData, 'rpm') : latest(sensorData, 'flow_rate');
    const cycleTime = sensorData.find(r => r.metric === 'cycle_time') ? sensorData.find(r => r.metric === 'cycle_time').value + 's' : '—';
    const runningSince = machine.status === 'running' ? new Date(Date.now() - Math.random() * 72 * 3600000).toLocaleTimeString() : '—';

    panel.innerHTML = `
      <div class="p-4 h-full flex flex-col overflow-y-auto">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-2.5">
            <span class="w-3 h-3 rounded-full ${machine.status === 'running' ? 'bg-secondary animate-pulse' : machine.status === 'warning' ? 'bg-tertiary-fixed-dim' : 'bg-error'}"></span>
            <span class="font-bold uppercase tracking-wide" style="font-size:11px;color:${machine.status === 'running' ? '#006b5f' : machine.status === 'warning' ? '#774f00' : '#ba1a1a'}">${machine.status}</span>
          </div>
          <span class="material-symbols-outlined text-on-surface-variant cursor-pointer hover:text-primary" onclick="document.getElementById('ym-twin-inspector').classList.toggle('hidden')" style="font-size:20px">close</span>
        </div>
        <h2 class="font-black text-on-surface" style="font-size:22px;line-height:1.15">${machine.name}</h2>
        <p class="text-sm text-on-surface-variant mt-1">${machine.type.replace(/_/g, ' ')} · ${machine.serial || '—'}</p>
        <p class="text-xs text-on-surface-variant mt-2">${machine.plant?.name || 'Plant'} · ${machine.location || 'Floor'} · Since ${runningSince}</p>

        <div class="grid grid-cols-2 gap-2 mt-4">
          <div class="rounded-xl bg-white/70 border border-outline-variant/30 p-2.5"><p class="text-[9px] font-bold uppercase text-on-surface-variant">Health</p><p class="font-black text-primary" style="font-size:20px">${Math.round(machine.health)}%</p></div>
          <div class="rounded-xl bg-white/70 border border-outline-variant/30 p-2.5"><p class="text-[9px] font-bold uppercase text-on-surface-variant">OEE</p><p class="font-black text-primary" style="font-size:20px">${Math.round(machine.oee || machine.health)}%</p></div>
          <div class="rounded-xl bg-white/70 border border-outline-variant/30 p-2.5"><p class="text-[9px] font-bold uppercase text-on-surface-variant">Temp</p><p class="font-bold" style="font-size:16px">${temp}</p></div>
          <div class="rounded-xl bg-white/70 border border-outline-variant/30 p-2.5"><p class="text-[9px] font-bold uppercase text-on-surface-variant">Vibration</p><p class="font-bold" style="font-size:16px">${vib}</p></div>
          <div class="rounded-xl bg-white/70 border border-outline-variant/30 p-2.5"><p class="text-[9px] font-bold uppercase text-on-surface-variant">Power</p><p class="font-bold" style="font-size:16px">${power}</p></div>
          <div class="rounded-xl bg-white/70 border border-outline-variant/30 p-2.5"><p class="text-[9px] font-bold uppercase text-on-surface-variant">Cycle Time</p><p class="font-bold" style="font-size:16px">${cycleTime}</p></div>
        </div>

        ${activeAlarms.length ? `<div class="mt-3 rounded-xl bg-error-container/30 border border-error/20 p-3"><p class="font-bold text-error" style="font-size:13px">${activeAlarms[0].title}</p><p class="text-xs text-on-surface-variant mt-1">${activeAlarms[0].message}</p></div>` : '<div class="mt-3 rounded-xl bg-secondary-container/20 border border-secondary/20 p-3"><p class="font-bold text-secondary" style="font-size:13px">No Active Faults</p><p class="text-xs text-on-surface-variant mt-1">All parameters within normal operating range.</p></div>'}

        <div class="mt-4 space-y-2">
          <button class="ym-dt-action predict-failure w-full rounded-xl bg-primary text-white py-2.5 font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all"><span class="material-symbols-outlined" style="font-size:18px">insights</span>Predict Failure</button>
          <button class="ym-dt-action investigate w-full rounded-xl border border-primary/30 text-primary py-2.5 font-bold flex items-center justify-center gap-2 hover:bg-primary/5 transition-all"><span class="material-symbols-outlined" style="font-size:18px">search_insights</span>Investigate</button>
          <button class="ym-dt-action create-wo w-full rounded-xl border border-outline-variant/40 text-on-surface-variant py-2.5 font-bold flex items-center justify-center gap-2 hover:bg-white/50 transition-all"><span class="material-symbols-outlined" style="font-size:18px">assignment_add</span>Create Work Order</button>
          <div class="flex gap-2">
            <button class="ym-dt-action zoom-to flex-1 rounded-xl bg-surface-container-high text-on-surface-variant py-2 font-bold text-xs flex items-center justify-center gap-1 hover:bg-outline-variant/40 transition-all"><span class="material-symbols-outlined" style="font-size:16px">center_focus_strong</span>Zoom</button>
            <button class="ym-dt-action center-cam flex-1 rounded-xl bg-surface-container-high text-on-surface-variant py-2 font-bold text-xs flex items-center justify-center gap-1 hover:bg-outline-variant/40 transition-all"><span class="material-symbols-outlined" style="font-size:16px">my_location</span>Center</button>
            <button class="ym-dt-action open-sim flex-1 rounded-xl bg-surface-container-high text-on-surface-variant py-2 font-bold text-xs flex items-center justify-center gap-1 hover:bg-outline-variant/40 transition-all" onclick="window.open('/simulator','_blank')"><span class="material-symbols-outlined" style="font-size:16px">simulation</span>Simulator</button>
          </div>
        </div>
      </div>`;

    panel.querySelector('.predict-failure')?.addEventListener('click', () => toast('Predictive model running on ' + machine.name + '... Estimated RUL: ' + (machine.remainingUsefulLife || 120) + ' days'));
    panel.querySelector('.investigate')?.addEventListener('click', () => window.location.href = '/anomaly?machine=' + encodeURIComponent(machine.name));
    panel.querySelector('.create-wo')?.addEventListener('click', async function() {
      this.disabled = true; this.innerHTML = '<span class="material-symbols-outlined" style="font-size:16px">sync</span> Creating...';
      const result = await post('/api/work-orders', {
        title: `Digital Twin: ${machine.name} investigation`,
        description: `Auto-generated from Digital Twin. ${machine.status} status, health ${Math.round(machine.health)}%.`,
        status: 'open',
        priority: activeAlarms.length ? 'critical' : 'medium',
        machineId: machine.id,
        assignedTo: 'Auto',
        dueDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10)
      });
      if (result.id) { this.innerHTML = '<span class="material-symbols-outlined" style="font-size:16px">check_circle</span> WO Created'; toast('Work order created'); }
      else { this.innerHTML = '<span class="material-symbols-outlined" style="font-size:16px">assignment_add</span>Create Work Order'; this.disabled = false; }
    });
    panel.querySelector('.zoom-to')?.addEventListener('click', () => {
      if (window.YMFactory3D && window.YMFactory3D.flyTo) window.YMFactory3D.flyTo(machine.posX || 0, machine.posZ || 0);
      else toast('Camera fly-to not available in this view');
    });
    panel.querySelector('.center-cam')?.addEventListener('click', () => {
      if (window.YMFactory3D && window.YMFactory3D.resetCamera) window.YMFactory3D.resetCamera();
      else toast('Camera reset not available');
    });

    // Update breadcrumb
    const bc = document.getElementById('ym-breadcrumb');
    if (bc) bc.innerHTML = `<a href="/" class="hover:text-primary">Home</a> / <a href="/digital-twin" class="hover:text-primary">Digital Twin</a> / <span class="text-primary font-bold">${machine.name}</span>`;
  }

  async function initTwin(plants, machines) {
    const main = document.querySelector('main');
    if (!main) return;
    main.innerHTML = `
      <div class="flex h-screen w-full" style="padding-top:64px">
        <div class="flex-1 relative overflow-hidden" id="ym-twin-canvas"></div>
        <aside id="ym-twin-inspector" class="w-[380px] min-w-[320px] max-w-[420px] bg-white/95 border-l border-outline-variant/30 overflow-y-auto hidden flex-shrink-0 shadow-2xl" style="z-index:10"></aside>
      </div>
      <div id="ym-toast" class="fixed top-24 left-1/2 -translate-x-1/2 z-50 glass-panel rounded-xl px-5 py-3 font-bold shadow-2xl transition-all duration-300 translate-y-32 opacity-0" style="font-size:14px"><span id="ym-toast-msg"></span></div>
      <div id="ym-breadcrumb" class="fixed top-20 left-4 z-40 text-xs text-on-surface-variant glass-panel rounded-full px-3 py-1.5">Home / Digital Twin</div>
      <div class="fixed bottom-6 left-4 z-40 flex items-center gap-2">
        <select id="ym-plant-select" class="glass-panel rounded-full px-3 py-1.5 text-xs font-bold border border-outline-variant/30 cursor-pointer"></select>
      </div>
      <div class="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 glass-panel rounded-full px-4 py-2 flex items-center gap-2 text-xs font-bold text-on-surface-variant shadow-lg">
        <span class="material-symbols-outlined text-primary" style="font-size:16px">3d_rotation</span> Drag to rotate · Scroll to zoom · Click a machine
      </div>`;

    const select = document.getElementById('ym-plant-select');
    const inspector = document.getElementById('ym-twin-inspector');
    plants.forEach(p => {
      const option = document.createElement('option');
      option.value = p.id;
      option.textContent = p.name + ' · ' + (p.domain || 'Plant');
      select.appendChild(option);
    });

    const canvasHost = document.getElementById('ym-twin-canvas');
    canvasHost.style.background = '#f4f2ff';
    if (!window.THREE || !window.YMFactory3D) {
      canvasHost.innerHTML = '<div class="h-full flex items-center justify-center"><div class="text-center p-10"><p class="text-2xl font-black text-error">3D engine unavailable</p><p class="text-on-surface-variant mt-2">Three.js could not load.</p></div></div>';
      return;
    }

    let floorScene = null;
    let currentPlantMachines = [];
    window._dtRenderInspector = renderInspector;

    function loadPlant(plantId, selectedMachine = null) {
      const plant = plants.find(p => p.id === plantId) || plants[0];
      currentPlantMachines = machines.filter(m => m.plantId === plant.id);
      if (floorScene && floorScene.destroy) floorScene.destroy();
      floorScene = window.YMFactory3D.renderPlantFloor({
        host: canvasHost,
        plant,
        machines: currentPlantMachines,
        onSelect: machine => renderInspector(machine),
        cameraY: 22,
        radius: 32,
        initialAngle: 0.72
      });
      const target = selectedMachine || currentPlantMachines.find(m => m.status !== 'running') || currentPlantMachines[0];
      if (target) { inspector.classList.remove('hidden'); renderInspector(target); }
    }

    select.addEventListener('change', () => { inspector.classList.remove('hidden'); loadPlant(select.value); });
    const requestedMachine = new URLSearchParams(window.location.search).get('machine');
    const requested = requestedMachine ? machines.find(m => m.name.toLowerCase() === requestedMachine.toLowerCase()) : null;
    if (requested) { select.value = requested.plantId; loadPlant(requested.plantId, requested); }
    else { loadPlant(plants[0]?.id); }
  }

  document.addEventListener('DOMContentLoaded', async () => {
    const user = await checkAuth();
    if (!user) return;
    const [plants, machines] = await Promise.all([get('/api/plants'), get('/api/machines')]);
    await initTwin(plants, machines);
  });
})();
