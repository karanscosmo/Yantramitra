(function() {
  let scene = null, plants = [], machines = [], currentPlant = null, plantMachines = [];
  let simRunning = false, simIteration = 0, simTimer = null;
  let baselineKPIs = null, kpiHistory = [];
  let detailPanelOpen = false, selectedMachine = null;

  const sliderConfig = {
    speed: { min: 0, max: 100, default: 85, unit: '%', label: 'Production Speed' },
    load: { min: 0, max: 100, default: 65, unit: '%', label: 'Machine Load' },
    delay: { min: 0, max: 72, default: 12, unit: 'h', label: 'Maintenance Delay' },
    operators: { min: 2, max: 30, default: 12, unit: '', label: 'Operator Count' },
  };

  const presets = {
    balanced: { label: 'Balanced', speed: 85, load: 65, delay: 12, operators: 12 },
    'energy-saver': { label: 'Energy Saver', speed: 60, load: 40, delay: 8, operators: 8 },
    'max-output': { label: 'Max Output', speed: 100, load: 90, delay: 4, operators: 20 },
    'maintenance': { label: 'Maintenance', speed: 40, load: 50, delay: 48, operators: 6 },
  };
  let activePreset = 'balanced';

  function get(path) { return fetch(path, { credentials: 'same-origin' }).then(r => { if (!r.ok) throw new Error(); return r.json(); }); }

  function toast(msg, type) {
    const el = document.getElementById('ym-toast');
    if (!el) return;
    document.getElementById('ym-toast-msg').textContent = msg;
    el.classList.remove('translate-y-32', 'opacity-0');
    el.querySelector('.material-symbols-outlined').textContent = type === 'error' ? 'error' : 'check_circle';
    clearTimeout(el._toastTimer);
    el._toastTimer = setTimeout(() => el.classList.add('translate-y-32', 'opacity-0'), 3000);
  }

  function escapeHtml(t) { const d = document.createElement('div'); d.textContent = t; return d.innerHTML; }

  function openModal(title, body) {
    document.querySelector('.modal-backdrop')?.remove();
    const wrap = document.createElement('div');
    wrap.className = 'modal-backdrop';
    wrap.innerHTML = '<div class="modal-card" role="dialog" aria-modal="true"><div style="display:flex;justify-content:space-between;gap:16px;align-items:start;margin-bottom:14px"><h2 style="font:900 24px/1.2 Inter,system-ui,sans-serif;color:#191a28">' + title + '</h2><button class="ym-close-modal" style="border:0;background:#eeecff;border-radius:999px;width:36px;height:36px;cursor:pointer;display:flex;align-items:center;justify-content:center"><span class="material-symbols-outlined">close</span></button></div><div>' + body + '</div></div>';
    wrap.addEventListener('click', e => { if (e.target === wrap || e.target.closest('.ym-close-modal')) wrap.remove(); });
    document.body.appendChild(wrap);
  }

  function getSliderValues() {
    const vals = {};
    document.querySelectorAll('#ym-sliders input[type="range"]').forEach(el => {
      vals[el.dataset.slider] = parseFloat(el.value);
    });
    return vals;
  }

  function formatSliderValue(key, val) {
    const cfg = sliderConfig[key];
    return val + cfg.unit;
  }

  function computeKPIs(vals) {
    const s = vals.speed, l = vals.load, d = vals.delay, o = vals.operators;
    const m = Math.min(95, Math.max(30, 50 + o * 2.5 + (100 - s) * 0.15));
    const t = Math.min(50, Math.max(10, 22 + s * 0.1 + l * 0.08 + (d > 36 ? 5 : 0)));
    const speedFactor = s / 100;
    const loadFactor = l / 100;
    const matFactor = m / 100;
    const opFactor = Math.min(1.3, 0.6 + o * 0.025);
    const tempFactor = Math.max(0.8, 1 - Math.abs(t - 25) * 0.008);
    const availability = Math.max(0.5, 1 - d / 200 - (100 - s) / 300);
    const performance = speedFactor * loadFactor * opFactor;
    const qualityRate = matFactor * tempFactor;
    const baseThroughput = 120 * speedFactor * loadFactor * opFactor;
    const throughput = Math.round(baseThroughput * tempFactor);
    const energy = Math.round(500 * loadFactor * (1 + Math.max(0, t - 25) * 0.02) * (0.9 + Math.random() * 0.2));
    const downtime = Math.max(0, Math.round((d * 0.8 + (100 - s) * 0.2 + (100 - m) * 0.15 + Math.max(0, t - 30) * 0.3) * (0.9 + Math.random() * 0.2)));
    const maintenanceCost = Math.round((d * 20 + (100 - m) * 12 + l * 2) * (0.95 + Math.random() * 0.1));
    const qualityLoss = Math.max(0, Math.round((100 - m) * (1 + t / 100) * 0.5 * speedFactor * loadFactor * opFactor));
    const profit = Math.round(throughput * 60 - maintenanceCost - energy * 6 - o * 320);
    const carbon = Math.round(energy * 0.45 * (0.95 + Math.random() * 0.1));
    const failureRate = Math.min(100, Math.round((100 - m) * 0.25 + (100 - s) * 0.15 + d * 0.6 + Math.max(0, t - 28) * 0.7));
    return { oee: Math.min(100, Math.round(availability * performance * qualityRate * 100)), throughput, energy, downtime, maintenanceCost, profit, qualityLoss, carbon, failureRate };
  }

  const kpiDefs = [
    { key: 'oee', label: 'OEE', icon: 'speed', color: '#413fd6', unit: '%', max: 100 },
    { key: 'throughput', label: 'Throughput', icon: 'production_quantity_limits', color: '#006b5f', unit: ' units', max: 200 },
    { key: 'energy', label: 'Energy', icon: 'bolt', color: '#774f00', unit: ' kWh', max: 1500 },
    { key: 'downtime', label: 'Downtime', icon: 'schedule', color: '#ba1a1a', unit: ' min', max: 80, inverse: true },
    { key: 'profit', label: 'Profit', icon: 'trending_up', color: '#006b5f', unit: ' ₹', max: 6000 },
    { key: 'qualityLoss', label: 'Quality Loss', icon: 'close', color: '#ba1a1a', unit: ' units', max: 50, inverse: true },
    { key: 'failureRate', label: 'Failure Rate', icon: 'warning', color: '#774f00', unit: '%', max: 100, inverse: true },
    { key: 'carbon', label: 'CO₂', icon: 'co2', color: '#464555', unit: ' kg', max: 600 },
    { key: 'maintenanceCost', label: 'Maint. Cost', icon: 'build', color: '#413fd6', unit: ' ₹', max: 4000, inverse: true },
  ];

  function renderKPIs(kpis) {
    const grid = document.getElementById('ym-charts-grid');
    if (!grid) return;
    const prevVals = grid.__prevVals || {};
    grid.innerHTML = kpiDefs.map(def => {
      const val = kpis[def.key] || 0;
      const pct = Math.min(100, Math.round(val / def.max * 100));
      const prev = prevVals[def.key] || 0;
      const dir = val > prev ? 'up' : val < prev ? 'down' : '';
      const flash = dir ? (dir === 'up' ? 'text-secondary' : 'text-error') : '';
      grid.__prevVals = grid.__prevVals || {};
      grid.__prevVals[def.key] = val;
      return '<div class="glass-panel rounded-xl p-3 bg-white/70 kpi-card"><div class="flex items-center justify-between mb-1.5"><div class="flex items-center gap-1.5"><span class="material-symbols-outlined" style="font-size:20px;color:' + def.color + '">' + def.icon + '</span><span class="font-bold text-on-surface-variant" style="font-size:12px">' + def.label + '</span></div><span class="font-kpi-numeric font-bold kpi-value" style="font-size:18px;color:' + def.color + '">' + val + (def.unit || '') + '</span></div><div style="height:5px;background:#e1dfff;border-radius:3px;overflow:hidden"><div class="kpi-bar" style="height:100%;width:' + pct + '%;background:' + def.color + ';border-radius:3px;transition:width .5s cubic-bezier(.4,0,.2,1)"></div></div></div>';
    }).join('');
    grid.querySelectorAll('.kpi-card').forEach((card, i) => {
      card.style.animation = 'none';
      card.offsetHeight;
      card.style.animation = 'kpiSlideIn .4s cubic-bezier(.4,0,.2,1) forwards';
      card.style.animationDelay = (i * 50) + 'ms';
    });
  }

  function updateSceneEffects(vals) {
    if (!scene || !scene.scene) return;
    const threeScene = scene.scene;
    const mat = Math.min(95, Math.max(30, 50 + vals.operators * 2.5 + (100 - vals.speed) * 0.15));
    const tmp = Math.min(50, Math.max(10, 22 + vals.speed * 0.1 + vals.load * 0.08 + (vals.delay > 36 ? 5 : 0)));
    const faultActive = vals.delay > 48 || mat < 30;
    threeScene._simState = {
      speed: vals.speed, load: vals.load, delay: vals.delay,
      operators: vals.operators, material: mat, temp: tmp,
      running: simRunning,
      faultActive
    };
    threeScene.children.forEach(child => {
      if (child.isPointLight) {
        child.intensity = 0.3 + (vals.load / 100) * 0.7;
      }
    });
    const machineGroup = scene.group;
    if (!machineGroup) return;
    machineGroup.children.forEach(mg => {
      const loadStress = vals.load / 100;
      const tempStress = Math.max(0, (tmp - 25) / 25);
      const stress = Math.min(1, loadStress * 0.5 + tempStress * 0.5);
      mg.traverse(mesh => {
        if (!mesh.isMesh || !mesh.material) return;
        if (mesh.userData.isBelt || mesh.userData.isIndicator || mesh.userData.isSensor) return;
        if (mesh.userData.isBeacon) {
          const warn = tmp > 38;
          let beaconColor, beaconIntensity;
          if (faultActive) { beaconColor = 0xba1a1a; beaconIntensity = 1.5; }
          else if (warn) { beaconColor = 0xffba4b; beaconIntensity = 1.2; }
          else { beaconColor = 0x5efae4; beaconIntensity = 0.8; }
          mesh.material.color.setHex(beaconColor);
          mesh.material.emissive.setHex(beaconColor);
          mesh.material.emissiveIntensity = beaconIntensity;
          mesh.material.needsUpdate = true;
          return;
        }
        const baseColor = mesh.userData._baseColor || mesh.material.color.getHex();
        mesh.userData._baseColor = baseColor;
        if (stress > 0.25) {
          const color = new THREE.Color(baseColor);
          const stressColor = new THREE.Color(faultActive ? 0xba1a1a : 0xffba4b);
          color.lerp(stressColor, stress * 0.35);
          mesh.material.color.copy(color);
          if (mesh.material.emissive) {
            mesh.material.emissive.setHex(0xffba4b);
            mesh.material.emissiveIntensity = stress * 0.2 * (Math.max(0, tmp - 20) / 30);
          }
        } else {
          mesh.material.color.setHex(baseColor);
          if (mesh.material.emissive) {
            mesh.material.emissive.setHex(0x000000);
            mesh.material.emissiveIntensity = 0;
          }
        }
        mesh.material.needsUpdate = true;
      });
    });
  }

  function renderPlantPills() {
    const container = document.getElementById('ym-plant-pills');
    if (!container) return;
    container.innerHTML = plants.map(p => '<button class="plant-pill' + (currentPlant && p.id === currentPlant.id ? ' active' : '') + '" data-id="' + p.id + '">' + escapeHtml(p.name) + '</button>').join('');
    container.querySelectorAll('.plant-pill').forEach(btn => {
      btn.addEventListener('click', function() { switchPlant(this.dataset.id); });
    });
  }

  function switchPlant(plantId) {
    const plant = plants.find(p => p.id === plantId);
    if (!plant || plant.id === currentPlant?.id) return;
    currentPlant = plant;
    plantMachines = (machines || []).filter(m => m.plantId === plant.id);
    if (scene && scene.destroy) { scene.destroy(); scene = null; }
    document.getElementById('ym-plant-name').textContent = plant.name;
    renderPlantPills();
    resetSimulation();
    buildScene();
  }

  function buildScene() {
    if (!currentPlant || !plantMachines.length) return;
    const host = document.getElementById('ym-three-container');
    if (!host) return;
    document.getElementById('ym-scene-loading').classList.add('hidden');
    try {
      scene = YMFactory3D.renderPlantFloor({
        host, plant: currentPlant, machines: plantMachines,
        onSelect: function(machine) { showMachineDetail(machine); },
        cameraX: 0, cameraY: 18, cameraZ: 28, fov: 50, radius: 32,
        background: 0xf8f7ff
      });
      updateSceneEffects(getSliderValues());
    } catch (e) { console.error('Scene build error:', e); }
  }

  function showMachineDetail(machine) {
    selectedMachine = machine;
    detailPanelOpen = true;
    const panel = document.getElementById('ym-machine-detail');
    if (!panel) return;
    panel.style.display = 'block';
    const health = machine.health || 80;
    const color = health >= 85 ? '#006b5f' : health >= 65 ? '#774f00' : '#ba1a1a';
    const record = window.findPlantRecord ? window.findPlantRecord(currentPlant) : null;
    const img = record ? record.image : (currentPlant.image || '/assets/images/home-pune-automotive.jpg');
    panel.innerHTML = '<div class="flex gap-3 mb-3"><img src="' + img + '" class="w-12 h-12 rounded-lg object-cover border border-white/10 shrink-0"/><div class="min-w-0 flex-1"><h4 class="text-white font-bold" style="font-size:16px">' + escapeHtml(machine.name) + '</h4><p class="text-white/60" style="font-size:12px">' + escapeHtml(machine.type || 'Machine') + ' · ' + escapeHtml(machine.status || 'operational') + '</p></div><button class="text-white/40 hover:text-white" id="ym-close-detail"><span class="material-symbols-outlined" style="font-size:20px">close</span></button></div><div class="grid grid-cols-2 gap-2 mb-3"><div class="bg-white/10 rounded-lg p-2 text-center"><p class="text-white/50 font-bold" style="font-size:10px">HEALTH</p><p class="text-white font-bold" style="font-size:15px;color:' + color + '">' + health + '%</p></div><div class="bg-white/10 rounded-lg p-2 text-center"><p class="text-white/50 font-bold" style="font-size:10px">OEE</p><p class="text-white font-bold" style="font-size:15px">' + (machine.oee || 0) + '%</p></div><div class="bg-white/10 rounded-lg p-2 text-center"><p class="text-white/50 font-bold" style="font-size:10px">RUL</p><p class="text-white font-bold" style="font-size:15px">' + (machine.remainingUsefulLife || 'N/A') + 'd</p></div><div class="bg-white/10 rounded-lg p-2 text-center"><p class="text-white/50 font-bold" style="font-size:10px">FAILURE</p><p class="text-white font-bold" style="font-size:15px">' + (machine.failureProbability || 0) + '%</p></div></div><div class="flex gap-2"><button class="flex-1 bg-primary rounded-lg py-2 text-white font-bold hover:opacity-90 transition-opacity" style="font-size:12px" onclick="window.location.href=\'/assets/' + machine.id + '\'">VIEW ASSET</button><button class="flex-1 bg-white/10 rounded-lg py-2 text-white/80 font-bold hover:bg-white/20 transition-all" style="font-size:12px" onclick="window.location.href=\'/digital-twin?machine=' + encodeURIComponent(machine.name) + '\'">DIGITAL TWIN</button></div>';
    document.getElementById('ym-close-detail')?.addEventListener('click', function() { panel.style.display = 'none'; detailPanelOpen = false; });
  }

  function getKPIs() {
    return computeKPIs(getSliderValues());
  }

  function formatProfit(val) {
    if (val >= 0) return '₹' + val.toLocaleString();
    return '-₹' + Math.abs(val).toLocaleString();
  }

  function renderAIPrediction(kpis) {
    const el = document.getElementById('ym-ai-prediction');
    if (!el) return;
    const parts = [];
    if (kpis.oee < 60) parts.push('OEE is critically low. Increase operators or reduce speed to improve availability.');
    else if (kpis.oee < 75) parts.push('OEE below target. Consider adjusting load or reducing maintenance delays.');
    else parts.push('OEE is healthy. Current params maintain good efficiency.');
    if (kpis.downtime > 40) parts.push('High downtime - reduce maintenance delay or increase operator count.');
    else if (kpis.downtime > 20) parts.push('Moderate downtime. Schedule preventive maintenance soon.');
    if (kpis.failureRate > 30) parts.push('Failure risk elevated. Slow production speed or increase quality checks.');
    if (kpis.qualityLoss > 20) parts.push('Quality loss is high. More operators would improve defect screening.');
    if (kpis.profit < 0) parts.push('Operation is running at a loss. Reduce energy costs or boost throughput.');
    el.textContent = parts.slice(0, 2).join(' ');
  }

  const eventLog = [];

  function pushEvent(vals, kpis) {
    const ts = new Date();
    const label = simRunning ? 'Iteration #' + simIteration : 'Parameter update';
    const summary = 'OEE:' + kpis.oee + '%  Units:' + kpis.throughput + '  Down:' + kpis.downtime + 'min';
    eventLog.unshift({ time: ts.toLocaleTimeString(), label, summary });
    if (eventLog.length > 20) eventLog.pop();
  }

  function renderEventLog() {
    const el = document.getElementById('ym-event-log');
    if (!el) return;
    if (!eventLog.length) { el.innerHTML = '<div class="text-on-surface-variant/50">No events yet</div>'; return; }
    el.innerHTML = eventLog.slice(0, 10).map(e =>
      '<div class="flex items-center gap-1"><span class="text-on-surface-variant/50 shrink-0">' + e.time + '</span><span class="text-on-surface-variant font-medium">' + e.label + '</span><span class="text-on-surface-variant/60 truncate">' + e.summary + '</span></div>'
    ).join('');
  }

  function renderAll() {
    const kpis = getKPIs();
    document.getElementById('ym-kpi-iteration').textContent = 'iteration #' + simIteration;
    renderKPIs(kpis);
    renderAIPrediction(kpis);
    pushEvent(getSliderValues(), kpis);
    renderEventLog();
  }

  function runSimulation() {
    if (simRunning) return;
    simRunning = true;
    document.getElementById('ym-sim-indicator').style.background = '#5efae4';
    document.getElementById('ym-sim-status').textContent = 'RUNNING';
    document.getElementById('ym-sim-run').disabled = true;

    const maxIter = 12;
    simTimer = setInterval(() => {
      simIteration++;
      document.getElementById('ym-iteration').textContent = '#' + simIteration;
      const vals = getSliderValues();
      const kpis = computeKPIs(vals);
      kpiHistory.push({ iteration: simIteration, time: new Date().toISOString(), ...vals, ...kpis });
      updateSceneEffects(vals);
      renderAll();
      if (baselineKPIs) renderCompareButton();
      if (simIteration >= maxIter) {
        clearInterval(simTimer);
        simTimer = null;
        simRunning = false;
        document.getElementById('ym-sim-indicator').style.background = '#5efae4';
        document.getElementById('ym-sim-status').textContent = 'COMPLETE';
        document.getElementById('ym-sim-run').disabled = false;
      }
    }, 800);
  }

  function pauseSimulation() {
    simRunning = false;
    if (simTimer) { clearInterval(simTimer); simTimer = null; }
    document.getElementById('ym-sim-indicator').style.background = '#774f00';
    document.getElementById('ym-sim-status').textContent = 'PAUSED';
    document.getElementById('ym-sim-run').disabled = false;
  }

  function resetSimulation() {
    pauseSimulation();
    simIteration = 0;
    kpiHistory = [];
    baselineKPIs = null;
    document.getElementById('ym-iteration').textContent = '#0';
    document.getElementById('ym-sim-indicator').style.background = '#c7c4d7';
    document.getElementById('ym-sim-status').textContent = 'READY';
    const defaultVals = {};
    Object.keys(sliderConfig).forEach(k => { defaultVals[k] = sliderConfig[k].default; });
    document.querySelectorAll('#ym-sliders input[type="range"]').forEach(el => {
      const key = el.dataset.slider;
      el.value = sliderConfig[key].default;
      document.getElementById('slider-' + key).textContent = formatSliderValue(key, sliderConfig[key].default);
    });
    activePreset = 'balanced';
    renderPresets();
    renderAll();
  }

  function setBaseline() {
    baselineKPIs = { ...getKPIs(), ...getSliderValues() };
    toast('Baseline captured');
    renderCompareButton();
  }

  function renderCompareButton() {
    const btn = document.getElementById('ym-sim-compare');
    if (btn && baselineKPIs) btn.classList.add('bg-primary/20');
  }

  function showCompareModal() {
    if (!baselineKPIs) { toast('Run simulation first and capture a baseline', 'error'); return; }
    const current = getKPIs();
    const currentVals = getSliderValues();
    const rows = kpiDefs.map(def => {
      const base = baselineKPIs[def.key] || 0;
      const cur = current[def.key] || 0;
      const diff = cur - base;
      const pct = base ? Math.round(diff / base * 100) : 0;
      const arrow = diff > 0 ? (!def.inverse ? '↑' : '↓') : diff < 0 ? (!def.inverse ? '↓' : '↑') : '→';
      const color = diff === 0 ? '#767586' : ((diff > 0 && !def.inverse) || (diff < 0 && def.inverse)) ? '#006b5f' : '#ba1a1a';
      return '<tr class="border-b border-outline-variant/10"><td class="py-1.5 text-xs font-medium">' + def.label + '</td><td class="py-1.5 text-xs text-center">' + base + '</td><td class="py-1.5 text-xs text-center">' + cur + '</td><td class="py-1.5 text-xs text-center" style="color:' + color + ';font-weight:700">' + arrow + ' ' + Math.abs(diff) + ' (' + (pct >= 0 ? '+' : '') + pct + '%)</td></tr>';
    }).join('');
    const sliderRows = Object.keys(sliderConfig).map(key => {
      const base = baselineKPIs[key];
      const cur = currentVals[key];
      const diff = cur - base;
      return '<tr class="border-b border-outline-variant/10"><td class="py-1 text-[10px] text-on-surface-variant">' + sliderConfig[key].label + '</td><td class="py-1 text-[10px] text-center text-on-surface-variant">' + formatSliderValue(key, base) + '</td><td class="py-1 text-[10px] text-center text-on-surface-variant">' + formatSliderValue(key, cur) + '</td><td class="py-1 text-[10px] text-center text-on-surface-variant">' + (diff > 0 ? '+' : '') + diff + '</td></tr>';
    }).join('');
    openModal('Baseline Comparison', '<div style="margin-bottom:16px"><p class="text-xs text-on-surface-variant mb-2">KPI Comparison</p><table style="width:100%;border-collapse:collapse"><thead><tr style="border-bottom:2px solid #e1dfff"><th class="py-1.5 text-[9px] text-left text-on-surface-variant">KPI</th><th class="py-1.5 text-[9px] text-center text-on-surface-variant">Baseline</th><th class="py-1.5 text-[9px] text-center text-on-surface-variant">Current</th><th class="py-1.5 text-[9px] text-center text-on-surface-variant">Change</th></tr></thead><tbody>' + rows + '</tbody></table></div><div><p class="text-xs text-on-surface-variant mb-2">Slider Settings</p><table style="width:100%;border-collapse:collapse"><thead><tr style="border-bottom:2px solid #e1dfff"><th class="py-1 text-[9px] text-left text-on-surface-variant">Parameter</th><th class="py-1 text-[9px] text-center text-on-surface-variant">Baseline</th><th class="py-1 text-[9px] text-center text-on-surface-variant">Current</th><th class="py-1 text-[9px] text-center text-on-surface-variant">Δ</th></tr></thead><tbody>' + sliderRows + '</tbody></table></div>');
  }

  function exportCSV() {
    if (!kpiHistory.length) { toast('No simulation data to export. Run the simulation first.', 'error'); return; }
    const headers = ['iteration', 'time', ...Object.keys(sliderConfig), ...kpiDefs.map(d => d.key)];
    const rows = kpiHistory.map(entry => headers.map(h => entry[h] ?? '').join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = 'simulation-data-' + new Date().toISOString().slice(0, 10) + '.csv';
    a.click();
    URL.revokeObjectURL(a.href);
    toast('CSV exported');
  }

  function showHistory() {
    if (!kpiHistory.length) { toast('No simulation history yet. Run the simulation.', 'error'); return; }
    const rows = kpiHistory.slice(-25).reverse().map(entry => {
      return '<tr class="border-b border-outline-variant/10"><td class="py-1.5 px-2" style="font-size:12px">#' + entry.iteration + '</td><td class="py-1.5 px-2" style="font-size:12px">' + (entry.oee || 0) + '%</td><td class="py-1.5 px-2" style="font-size:12px">' + entry.throughput + '</td><td class="py-1.5 px-2" style="font-size:12px">' + entry.energy + '</td><td class="py-1.5 px-2" style="font-size:12px">' + entry.downtime + '</td><td class="py-1.5 px-2" style="font-size:12px">' + formatProfit(entry.profit || 0) + '</td></tr>';
    }).join('');
    openModal('Simulation History (Last 25)', '<table style="width:100%;border-collapse:collapse"><thead><tr style="border-bottom:2px solid #e1dfff"><th class="py-1.5 px-2 text-left text-on-surface-variant font-bold" style="font-size:11px">#</th><th class="py-1.5 px-2 text-left text-on-surface-variant font-bold" style="font-size:11px">OEE</th><th class="py-1.5 px-2 text-left text-on-surface-variant font-bold" style="font-size:11px">Units</th><th class="py-1.5 px-2 text-left text-on-surface-variant font-bold" style="font-size:11px">kWh</th><th class="py-1.5 px-2 text-left text-on-surface-variant font-bold" style="font-size:11px">Down</th><th class="py-1.5 px-2 text-left text-on-surface-variant font-bold" style="font-size:11px">Profit</th></tr></thead><tbody>' + rows + '</tbody></table><p class="text-on-surface-variant mt-2" style="font-size:12px">' + kpiHistory.length + ' total iterations recorded.</p>');
  }

  function applyPreset(name) {
    const preset = presets[name];
    if (!preset) return;
    activePreset = name;
    Object.keys(sliderConfig).forEach(key => {
      const el = document.querySelector('#ym-sliders input[data-slider="' + key + '"]');
      if (el) {
        el.value = preset[key];
        document.getElementById('slider-' + key).textContent = formatSliderValue(key, preset[key]);
      }
    });
    document.querySelectorAll('#ym-presets button').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.preset === name);
    });
    renderAll();
    updateSceneEffects(getSliderValues());
  }

  function renderPresets() {
    const container = document.getElementById('ym-presets');
    if (!container) return;
    container.innerHTML = Object.entries(presets).map(([key, p]) =>
      '<button class="ym-preset-btn' + (key === activePreset ? ' active' : '') + '" data-preset="' + key + '">' + p.label + '</button>'
    ).join('');
    container.querySelectorAll('.ym-preset-btn').forEach(btn => {
      btn.addEventListener('click', function() { applyPreset(this.dataset.preset); });
    });
  }

  function setupSliders() {
    document.querySelectorAll('#ym-sliders input[type="range"]').forEach(el => {
      el.addEventListener('input', function() {
        const key = this.dataset.slider;
        const val = parseFloat(this.value);
        document.getElementById('slider-' + key).textContent = formatSliderValue(key, val);
        if (!simRunning) renderAll();
        updateSceneEffects(getSliderValues());
      });
    });
  }

  async function loadData() {
    try {
      const [plantsData, machinesData] = await Promise.all([get('/api/plants'), get('/api/machines').catch(() => [])]);
      plants = plantsData;
      machines = machinesData;
      currentPlant = plants[0] || null;
      if (currentPlant) {
        plantMachines = machines.filter(m => m.plantId === currentPlant.id);
        document.getElementById('ym-plant-name').textContent = currentPlant.name;
      }
      renderPlantPills();
      renderAll();
      buildScene();
    } catch (e) { console.error('Data load error:', e); }
  }

  async function checkAuth() {
    try { const r = await fetch('/api/auth/me', { credentials: 'same-origin' }); if (!r.ok) { window.location.href = '/'; return null; } const me = await r.json(); if (!me || !me.id) { window.location.href = '/'; return null; } return me; }
    catch { window.location.href = '/'; return null; }
  }

  document.addEventListener('DOMContentLoaded', async () => {
    const user = await checkAuth();
    if (!user) return;

    setupSliders();
    renderPresets();
    await loadData();

    document.getElementById('ym-sim-run')?.addEventListener('click', runSimulation);
    document.getElementById('ym-sim-pause')?.addEventListener('click', pauseSimulation);
    document.getElementById('ym-sim-reset')?.addEventListener('click', resetSimulation);
    document.getElementById('ym-sim-compare')?.addEventListener('click', function() {
      if (baselineKPIs) showCompareModal();
      else setBaseline();
    });
    document.getElementById('ym-sim-export')?.addEventListener('click', exportCSV);
    document.getElementById('ym-sim-history')?.addEventListener('click', showHistory);
  });
})();
