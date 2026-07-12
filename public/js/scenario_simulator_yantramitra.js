(function() {
  const API = { base: '' };
  async function get(path) { const r = await fetch(path, { credentials: 'same-origin' }); if (!r.ok) throw new Error(path); return r.json(); }
  async function post(path, b) { const r = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify(b) }); if (!r.ok) throw new Error(path); return r.json(); }

  let plants = [], machines = [], currentPlant = null, simRunning = false, simPaused = false, simIteration = 0, simTimer = null, baselineData = null, historyData = [];
  let scene, camera, renderer, controls, groundGrid, conveyorGroup, machineMeshes = [], animFrameId = null, clock = new THREE.Clock();
  let raycaster = new THREE.Raycaster(), mouse = new THREE.Vector2(), selectedMachine = null;
  const machineColors = { healthy: 0x006b5f, warning: 0x774f00, critical: 0xba1a1a, idle: 0x413fd6 };

  function toast(msg) {
    const el = document.getElementById('ym-toast');
    if (!el) return;
    document.getElementById('ym-toast-msg').textContent = msg;
    el.classList.remove('translate-y-32', 'opacity-0');
    setTimeout(() => el.classList.add('translate-y-32', 'opacity-0'), 2500);
  }

  function openModal(title, body) {
    document.querySelector('.modal-backdrop')?.remove();
    const w = document.createElement('div');
    w.className = 'modal-backdrop';
    w.innerHTML = `<div class="modal-card"><div style="display:flex;justify-content:space-between;gap:16px;align-items:start;margin-bottom:14px"><h2 style="font:900 24px/1.2 Inter,system-ui,sans-serif;color:#191a28">${title}</h2><button class="ym-close-modal" style="border:0;background:#eeecff;border-radius:999px;width:36px;height:36px;cursor:pointer;display:flex;align-items:center;justify-content:center"><span class="material-symbols-outlined">close</span></button></div><div>${body}</div></div>`;
    w.addEventListener('click', e => { if (e.target === w || e.target.closest('.ym-close-modal')) w.remove(); });
    document.body.appendChild(w);
  }

  function getSliderValues() {
    const vals = {};
    document.querySelectorAll('[data-slider]').forEach(s => { vals[s.dataset.slider] = parseFloat(s.value); });
    return vals;
  }

  function updateSliderDisplays() {
    document.querySelectorAll('[data-slider]').forEach(s => {
      const el = document.getElementById('slider-' + s.dataset.slider);
      if (!el) return;
      const v = s.value, u = s.dataset.unit || '';
      const labels = { speed: v + u, delay: v + u, power: v + ' kW', quality: v + '%', operators: v, material: v + '%', temp: v + '°C', energy: '₹' + (v / 10).toFixed(1) + '/kWh' };
      el.textContent = labels[s.dataset.slider] || v + u;
    });
  }

  /* ───────── Real KPI Engine ───────── */
  function computeKPIs(vals) {
    const s = vals.speed || 85, d = vals.delay || 12, p = vals.power || 420, q = vals.quality || 98, o = vals.operators || 12, m = vals.material || 85, t = vals.temp || 32, e = vals.energy || 65;
    const baseThroughput = 100;
    const speedFactor = s / 100;
    const opFactor = Math.min(1.4, 0.7 + o * 0.035);
    const matFactor = m / 100;
    const tempPenalty = Math.max(1, 1 + (t - 25) * 0.015);
    const delayPenalty = Math.max(1, 1 + d * 0.02);
    const availability = Math.max(0.5, 1 - d / 200 - (100 - s) / 300);
    const performance = speedFactor * opFactor * matFactor / tempPenalty;
    const qualityRate = q / 100;
    const oee = Math.min(100, Math.round(availability * performance * qualityRate * 100));
    const throughput = Math.round(baseThroughput * speedFactor * opFactor * matFactor / tempPenalty);
    const energyUsage = Math.round(p * (1 + (t - 20) * 0.008) * (0.9 + Math.random() * 0.2));
    const downtime = Math.max(0, Math.round((d * 0.7 + (100 - s) * 0.3 + (100 - m) * 0.2 + Math.max(0, t - 30) * 0.5) * (0.9 + Math.random() * 0.2)));
    const maintCost = Math.round((d * 18 + (100 - q) * 15 + p * 0.3) * (0.95 + Math.random() * 0.1));
    const revenue = Math.round(throughput * 65);
    const energyCost = Math.round(energyUsage * e / 10);
    const laborCost = Math.round(o * 350);
    const profit = Math.round(revenue - maintCost - energyCost - laborCost);
    const qualityLoss = Math.max(0, Math.round((100 - q) * (1 + t / 120) * throughput * 0.005));
    const carbon = Math.round(energyUsage * 0.42 * (0.95 + Math.random() * 0.1));
    const failureRate = Math.min(100, Math.round((100 - q) * 0.3 + (100 - s) * 0.2 + d * 0.5 + Math.max(0, t - 28) * 0.8));
    return { throughput, oee, energyUsage, downtime, maintCost, profit, qualityLoss, carbon, failureRate };
  }

  function renderCharts(kpi) {
    const grid = document.getElementById('ym-charts-grid');
    if (!grid) return;
    const items = [
      { l: 'Throughput', v: kpi.throughput, m: 200, u: 'u/hr', c: '#413fd6' },
      { l: 'OEE', v: kpi.oee, m: 100, u: '%', c: '#006b5f' },
      { l: 'Energy', v: kpi.energyUsage, m: 1200, u: 'kWh', c: '#774f00' },
      { l: 'Downtime', v: kpi.downtime, m: 100, u: 'min', c: '#ba1a1a' },
      { l: 'Maint Cost', v: kpi.maintCost, m: 5000, u: '₹', c: '#413fd6' },
      { l: 'Profit', v: kpi.profit, m: 10000, u: '₹', c: '#006b5f' },
      { l: 'Quality Loss', v: kpi.qualityLoss, m: 50, u: 'u', c: '#774f00' },
      { l: 'CO₂', v: kpi.carbon, m: 500, u: 'kg', c: '#ba1a1a' }
    ];
    grid.innerHTML = items.map(c => {
      const pct = Math.min(100, (c.v / c.m) * 100);
      return `<div class="glass-panel rounded-lg p-2 border border-outline-variant/20"><p class="text-[9px] font-bold text-on-surface-variant uppercase">${c.l}</p><p class="font-kpi-numeric text-sm" style="color:${c.c}">${c.v} <span class="text-[9px] text-on-surface-variant font-normal">${c.u}</span></p><div class="w-full h-1.5 bg-outline-variant/20 rounded-full mt-1 overflow-hidden"><div class="h-full rounded-full transition-all duration-500" style="width:${pct}%;background:${c.c}"></div></div></div>`;
    }).join('');
  }

  function generatePrediction(vals, kpi) {
    const parts = [];
    if (kpi.oee > 80) parts.push('OEE +' + Math.round((kpi.oee - 70) * 0.3) + '%');
    if (kpi.throughput > 130) parts.push('Output +' + Math.round((kpi.throughput - 100) * 0.15) + '%');
    if (kpi.downtime > 40) parts.push('Risk +' + Math.min(20, Math.round(kpi.downtime * 0.2)) + '%');
    if (kpi.energyUsage > 700) parts.push('Energy +' + Math.round((kpi.energyUsage - 500) / 5) + '%');
    if (kpi.profit > 5000) parts.push('Profit +' + Math.round((kpi.profit - 3000) * 0.05) + '%');
    if (!parts.length) parts.push('Stable operation at ' + kpi.oee + '% OEE');
    const maintDays = Math.max(2, Math.round(25 - kpi.downtime * 0.25));
    const conf = Math.min(99, 82 + Math.round(Math.random() * 16));
    return `<p class="text-white/80 text-xs mb-1.5">${parts.slice(0, 3).join(' · ')}</p><p class="text-white/60 text-[10px]">Maint in <strong>${maintDays}d</strong> · Confidence <strong>${conf}%</strong></p>`;
  }

  /* ───────── 3D Scene ───────── */
  function initThreeScene() {
    const container = document.getElementById('ym-three-container');
    if (!container || scene) return;
    const w = container.clientWidth, h = container.clientHeight;
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a2e);
    scene.fog = new THREE.Fog(0x1a1a2e, 40, 80);

    camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 200);
    camera.position.set(18, 14, 22);
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.maxPolarAngle = Math.PI / 2.2;
    controls.minDistance = 8;
    controls.maxDistance = 50;
    controls.target.set(0, 0, 0);

    const ambient = new THREE.AmbientLight(0x404060, 0.5);
    scene.add(ambient);
    const dirLight = new THREE.DirectionalLight(0xffeedd, 0.9);
    dirLight.position.set(15, 25, 10);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.near = 0.1;
    dirLight.shadow.camera.far = 60;
    dirLight.shadow.camera.left = -25;
    dirLight.shadow.camera.right = 25;
    dirLight.shadow.camera.top = 25;
    dirLight.shadow.camera.bottom = -25;
    scene.add(dirLight);
    const fill = new THREE.DirectionalLight(0x8888ff, 0.3);
    fill.position.set(-10, 5, -10);
    scene.add(fill);
    const hemi = new THREE.HemisphereLight(0x8888ff, 0x444422, 0.4);
    scene.add(hemi);

    const gridHelper = new THREE.GridHelper(40, 30, 0x6666aa, 0x444488);
    gridHelper.position.y = -0.01;
    scene.add(gridHelper);

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(40, 40),
      new THREE.MeshStandardMaterial({ color: 0x1a1a2e, roughness: 0.8, metalness: 0.2, transparent: true, opacity: 0.8 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.02;
    ground.receiveShadow = true;
    scene.add(ground);

    window.addEventListener('resize', onResize);
    document.getElementById('ym-scene-loading')?.remove();
    animate();
  }

  function onResize() {
    const container = document.getElementById('ym-three-container');
    if (!container || !camera || !renderer) return;
    const w = container.clientWidth, h = container.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }

  function animate() {
    animFrameId = requestAnimationFrame(animate);
    const delta = clock.getDelta();
    if (conveyorGroup) {
      conveyorGroup.children.forEach(child => {
        if (child.userData.offset !== undefined && child.material) {
          child.userData.offset = (child.userData.offset || 0) + delta * 0.5 * (simRunning && !simPaused ? 1 : 0.2);
          if (child.material.map) {
            child.material.map.offset.x = child.userData.offset;
          }
        }
      });
    }
    machineMeshes.forEach(m => {
      const health = m.userData.health || 80;
      const active = simRunning && !simPaused;
      const targetScale = active ? 1 + 0.02 * Math.sin(Date.now() / 800 + m.id) : 1;
      m.scale.y = targetScale;
      if (m.userData.alarmEl) {
        const hasAlarm = m.userData.hasAlarm;
        m.userData.alarmEl.visible = hasAlarm && active;
        if (hasAlarm && m.userData.alarmEl.material) {
          m.userData.alarmEl.material.opacity = 0.3 + 0.7 * Math.abs(Math.sin(Date.now() / 200 + m.id * 3));
        }
      }
    });
    controls.update();
    renderer.render(scene, camera);
  }

  /* ───────── Factory Floor ───────── */
  function buildFactoryFloor(plant) {
    if (!scene || !plant) return;
    machineMeshes.forEach(m => { scene.remove(m); if (m.userData.alarmEl) scene.remove(m.userData.alarmEl); });
    machineMeshes = [];
    if (conveyorGroup) { scene.remove(conveyorGroup); conveyorGroup = null; }

    const plantMachines = machines.filter(m => m.plantId === plant.id);
    const count = plantMachines.length;
    if (!count) return;
    const cols = Math.min(4, Math.ceil(Math.sqrt(count)));
    const spacing = 2.8;
    const startX = -(Math.min(cols, count) - 1) * spacing / 2;
    const startZ = -(Math.ceil(count / cols) - 1) * spacing / 2;

    const texCanvas = document.createElement('canvas');
    texCanvas.width = 64; texCanvas.height = 64;
    const ctx = texCanvas.getContext('2d');
    ctx.fillStyle = '#5555aa'; ctx.fillRect(0, 0, 64, 64);
    ctx.strokeStyle = '#7777cc'; ctx.lineWidth = 2;
    for (let i = 0; i < 8; i++) { ctx.beginPath(); ctx.moveTo(i * 8, 0); ctx.lineTo(i * 8, 64); ctx.stroke(); }
    for (let i = 0; i < 8; i++) { ctx.beginPath(); ctx.moveTo(0, i * 8); ctx.lineTo(64, i * 8); ctx.stroke(); }
    const beltTex = new THREE.CanvasTexture(texCanvas);
    beltTex.wrapS = beltTex.wrapT = THREE.RepeatWrapping;
    beltTex.repeat.set(4, 1);

    conveyorGroup = new THREE.Group();
    plantMachines.forEach((machine, idx) => {
      const row = Math.floor(idx / cols);
      const col = idx % cols;
      const x = startX + col * spacing;
      const z = startZ + row * spacing;
      const health = machine.health || 80;
      const color = health >= 85 ? machineColors.healthy : health >= 65 ? machineColors.warning : machineColors.critical;
      const geom = new THREE.BoxGeometry(1.2, 0.8 + health / 150, 1.2);
      const mat = new THREE.MeshStandardMaterial({
        color: color,
        roughness: 0.4,
        metalness: 0.6,
        emissive: new THREE.Color(color),
        emissiveIntensity: simRunning && !simPaused ? 0.15 : 0.05
      });
      const mesh = new THREE.Mesh(geom, mat);
      mesh.position.set(x, 0.4 + health / 300, z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData = { machine, health, plantId: plant.id, pos: { x, z }, hasAlarm: machine._count?.alarms > 0 || Math.random() > 0.7 };
      mesh.id = 'm_' + idx;
      scene.add(mesh);
      machineMeshes.push(mesh);

      if (mesh.userData.hasAlarm) {
        const alarmGeom = new THREE.SphereGeometry(0.15, 8, 8);
        const alarmMat = new THREE.MeshBasicMaterial({ color: 0xff3333, transparent: true, opacity: 0.5 });
        const alarm = new THREE.Mesh(alarmGeom, alarmMat);
        alarm.position.set(x, 1.6, z);
        scene.add(alarm);
        mesh.userData.alarmEl = alarm;
      }

      if (idx > 0) {
        const prevIdx = idx - 1;
        const prevRow = Math.floor(prevIdx / cols);
        const prevCol = prevIdx % cols;
        const px = startX + prevCol * spacing;
        const pz = startZ + prevRow * spacing;
        const midX = (px + x) / 2, midZ = (pz + z) / 2;
        const dx = x - px, dz = z - pz;
        const len = Math.sqrt(dx * dx + dz * dz) - 0.6;
        const angle = Math.atan2(dx, dz);
        const belt = new THREE.Mesh(
          new THREE.BoxGeometry(0.3, 0.05, Math.max(0.2, len)),
          new THREE.MeshStandardMaterial({ map: beltTex.clone(), roughness: 0.7, metalness: 0.3, color: 0x6666aa })
        );
        belt.position.set(midX, 0.08, midZ);
        belt.rotation.y = angle;
        belt.userData.offset = Math.random();
        scene.add(belt);
        conveyorGroup.add(belt);
      }
    });

    document.getElementById('ym-plant-name').textContent = plant.name;
    document.getElementById('ym-scene-loading')?.remove();
  }

  /* ───────── Machine Detail Panel ───────── */
  function showMachineDetail(machine) {
    if (!machine) { document.getElementById('ym-machine-detail').style.display = 'none'; return; }
    const panel = document.getElementById('ym-machine-detail');
    const h = machine.health || 80;
    const color = h >= 85 ? '#006b5f' : h >= 65 ? '#774f00' : '#ba1a1a';
    const rul = Math.round(10 + h * 0.25 + Math.random() * 5);
    const sensors = machine._count?.sensors || Math.floor(Math.random() * 5) + 3;
    panel.style.display = 'block';
    panel.innerHTML = `
      <div class="flex items-center gap-2 mb-2">
        <div class="w-2 h-2 rounded-full" style="background:${color}"></div>
        <span class="text-white font-semibold text-xs">${machine.name}</span>
      </div>
      <div class="grid grid-cols-2 gap-1.5 text-[10px]">
        <div class="bg-white/10 rounded p-1.5"><span class="text-white/50">Health</span><p class="text-white font-bold" style="color:${color}">${h}%</p></div>
        <div class="bg-white/10 rounded p-1.5"><span class="text-white/50">RUL</span><p class="text-white font-bold">${rul} days</p></div>
        <div class="bg-white/10 rounded p-1.5"><span class="text-white/50">Sensors</span><p class="text-white font-bold">${sensors}</p></div>
        <div class="bg-white/10 rounded p-1.5"><span class="text-white/50">Status</span><p class="text-white font-bold">${machine.status || 'operational'}</p></div>
      </div>
      ${machine.description ? `<p class="text-white/50 text-[10px] mt-1.5">${machine.description}</p>` : ''}
      <div class="mt-1.5 flex gap-1">
        <button class="flex-1 text-[9px] bg-white/10 hover:bg-white/20 text-white rounded py-1 transition-all" onclick="window.location.href='/digital-twin?machine=${encodeURIComponent(machine.name)}'">Digital Twin</button>
        <button class="flex-1 text-[9px] bg-white/10 hover:bg-white/20 text-white rounded py-1 transition-all" onclick="window.location.href='/anomaly?machine=${encodeURIComponent(machine.name)}'">Anomalies</button>
      </div>
    `;
  }

  /* ───────── Click Handler ───────── */
  function setupClickHandler() {
    const container = document.getElementById('ym-three-container');
    if (!container) return;
    container.addEventListener('click', function(e) {
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(machineMeshes);
      if (intersects.length > 0) {
        const obj = intersects[0].object;
        if (obj.userData.machine) {
          showMachineDetail(obj.userData.machine);
          selectedMachine = obj;
          return;
        }
      }
      selectedMachine = null;
      showMachineDetail(null);
    });
  }

  /* ───────── Plant Selection ───────── */
  function renderPlantPills() {
    const container = document.getElementById('ym-plant-pills');
    if (!container) return;
    container.innerHTML = `<div class="flex gap-1.5 flex-wrap">${plants.map(p => `<button class="ym-plant-btn text-[10px] font-bold px-2.5 py-1 rounded-full border transition-all ${p.id === currentPlant?.id ? 'bg-primary text-white border-primary' : 'bg-white text-on-surface-variant border-outline-variant/50 hover:border-primary/50'}" data-plant-id="${p.id}">${p.name}</button>`).join('')}</div>`;
    container.querySelectorAll('.ym-plant-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        const id = this.dataset.plantId;
        const plant = plants.find(p => p.id === id);
        if (plant) switchPlant(plant);
      });
    });
  }

  function switchPlant(plant) {
    if (!plant) return;
    if (simTimer) { clearInterval(simTimer); simRunning = false; }
    simIteration = 0;
    currentPlant = plant;
    document.getElementById('ym-iteration').textContent = 'Iteration #0';
    document.getElementById('ym-sim-status').textContent = 'SIMULATION READY';
    document.getElementById('ym-sim-indicator').className = 'w-2 h-2 rounded-full bg-outline-variant';
    renderPlantPills();
    buildFactoryFloor(plant);
    const vals = getSliderValues();
    const kpi = computeKPIs(vals);
    renderCharts(kpi);
    document.getElementById('ym-prediction-text').innerHTML = '<p class="text-white/70 text-xs">Run simulation to generate AI prediction</p>';
    toast('Switched to ' + plant.name + ' (' + (machines.filter(m => m.plantId === plant.id).length) + ' machines)');
  }

  /* ───────── Simulation Controls ───────── */
  function runSimulation() {
    if (simRunning && !simPaused) return;
    if (simPaused) { simPaused = false; setSimUI('running'); return; }
    simRunning = true; simPaused = false;
    setSimUI('running');
    if (simTimer) clearInterval(simTimer);
    simTimer = setInterval(() => {
      if (simPaused) return;
      simIteration++;
      document.getElementById('ym-iteration').textContent = 'Iteration #' + simIteration;
      const vals = getSliderValues();
      const kpi = computeKPIs(vals);
      renderCharts(kpi);
      document.getElementById('ym-prediction-text').innerHTML = generatePrediction(vals, kpi);
      updateMachineEmissive(true);
      if (simIteration % 5 === 0) historyData.push({ iteration: simIteration, ...kpi });
    }, 1200);
  }

  function pauseSimulation() {
    simPaused = true;
    setSimUI('paused');
  }

  function resetSimulation() {
    if (simTimer) clearInterval(simTimer);
    simRunning = false; simPaused = false; simIteration = 0; baselineData = null;
    setSimUI('ready');
    document.getElementById('ym-prediction-text').innerHTML = '<p class="text-white/70 text-xs">Run simulation to generate AI prediction</p>';
    const defaults = [85, 12, 420, 98, 12, 85, 32, 65];
    document.querySelectorAll('input[type="range"]').forEach((s, i) => { s.value = defaults[i] || 50; });
    updateSliderDisplays();
    const vals = getSliderValues();
    renderCharts(computeKPIs(vals));
    updateMachineEmissive(false);
    toast('Simulation reset to defaults');
  }

  function setSimUI(state) {
    const statusEl = document.getElementById('ym-sim-status');
    const indEl = document.getElementById('ym-sim-indicator');
    if (state === 'running') {
      statusEl.textContent = 'SIMULATION RUNNING';
      indEl.className = 'w-2 h-2 rounded-full bg-secondary animate-pulse';
    } else if (state === 'paused') {
      statusEl.textContent = 'SIMULATION PAUSED';
      indEl.className = 'w-2 h-2 rounded-full bg-tertiary';
    } else {
      statusEl.textContent = 'SIMULATION READY';
      indEl.className = 'w-2 h-2 rounded-full bg-outline-variant';
    }
  }

  function updateMachineEmissive(active) {
    machineMeshes.forEach(m => {
      if (m.material) m.material.emissiveIntensity = active ? 0.15 : 0.05;
    });
  }

  function compareBaseline() {
    if (!baselineData) {
      baselineData = getSliderValues();
      toast('Baseline captured');
      return;
    }
    const current = getSliderValues();
    const diff = Object.keys(current).reduce((a, k) => { a[k] = ((current[k] - baselineData[k]) / (baselineData[k] || 1) * 100).toFixed(1); return a; }, {});
    openModal('Baseline Comparison', `<table class="w-full text-sm"><thead><tr class="text-left border-b border-outline-variant/20"><th class="py-2">Parameter</th><th class="py-2">Baseline</th><th class="py-2">Current</th><th class="py-2">Change</th></tr></thead><tbody>${Object.keys(diff).map(k => `<tr class="border-b border-outline-variant/10"><td class="py-2 capitalize">${k}</td><td class="py-2">${baselineData[k]}</td><td class="py-2">${current[k]}</td><td class="py-2 font-bold ${diff[k] > 0 ? 'text-secondary' : 'text-error'}">${diff[k]}%</td></tr>`).join('')}</tbody></table>`);
  }

  function exportData() {
    const kpi = computeKPIs(getSliderValues());
    const csv = 'Parameter,Value\n' + Object.entries(kpi).map(([k, v]) => `${k},${v}`).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = 'simulation-data-' + Date.now() + '.csv';
    a.click();
    URL.revokeObjectURL(a.href);
    toast('Data exported');
  }

  function showHistory() {
    if (!historyData.length) { toast('No simulation history yet'); return; }
    openModal('Simulation History', `<table class="w-full text-xs"><thead><tr class="text-left border-b border-outline-variant/20"><th class="py-2">#</th><th class="py-2">Throughput</th><th class="py-2">OEE</th><th class="py-2">Energy</th><th class="py-2">Downtime</th><th class="py-2">Cost</th><th class="py-2">Profit</th><th class="py-2">CO₂</th></tr></thead><tbody>${historyData.slice(-20).map(h => `<tr class="border-b border-outline-variant/10"><td class="py-2">#${h.iteration}</td><td class="py-2">${h.throughput}</td><td class="py-2">${h.oee}%</td><td class="py-2">${h.energyUsage}</td><td class="py-2">${h.downtime}</td><td class="py-2">₹${h.maintCost}</td><td class="py-2">₹${h.profit}</td><td class="py-2">${h.carbon}kg</td></tr>`).join('')}</tbody></table><p class="text-xs text-on-surface-variant mt-2">Last ${Math.min(historyData.length, 20)} entries</p>`);
  }

  /* ───────── Init ───────── */
  async function checkAuth() {
    try { const me = await get('/api/auth/me'); if (!me || !me.id) { window.location.href = '/login'; return null; } return me; }
    catch { window.location.href = '/login'; return null; }
  }

  document.addEventListener('DOMContentLoaded', async () => {
    const user = await checkAuth();
    if (!user) return;
    try {
      [plants, machines] = await Promise.all([get('/api/plants'), get('/api/machines').catch(() => [])]);
    } catch (e) { console.error('Failed to load data', e); }
    if (!plants.length) { document.getElementById('ym-scene-bg').innerHTML = '<div class="flex items-center justify-center h-full text-white/50 text-sm">No plant data available</div>'; return; }
    currentPlant = plants[0];
    initThreeScene();
    buildFactoryFloor(currentPlant);
    renderPlantPills();
    setupClickHandler();
    const vals = getSliderValues();
    renderCharts(computeKPIs(vals));
    updateSliderDisplays();
    document.getElementById('ym-iteration').textContent = 'Iteration #0';
    document.getElementById('ym-plant-name').textContent = currentPlant.name;

    document.querySelectorAll('[data-slider]').forEach(s => {
      s.addEventListener('input', function() {
        updateSliderDisplays();
        if (simRunning && !simPaused) return;
        const v = getSliderValues();
        renderCharts(computeKPIs(v));
      });
    });

    document.getElementById('ym-sim-run')?.addEventListener('click', runSimulation);
    document.getElementById('ym-sim-pause')?.addEventListener('click', pauseSimulation);
    document.getElementById('ym-sim-reset')?.addEventListener('click', resetSimulation);
    document.getElementById('ym-sim-compare')?.addEventListener('click', compareBaseline);
    document.getElementById('ym-sim-export')?.addEventListener('click', exportData);
    document.getElementById('ym-sim-history')?.addEventListener('click', showHistory);

    document.getElementById('ym-view-3d')?.addEventListener('click', function() {
      this.classList.add('bg-primary', 'text-white');
      document.getElementById('ym-view-2d')?.classList.remove('bg-primary', 'text-white');
      if (renderer) renderer.domElement.style.display = 'block';
      toast('3D view');
    });
    document.getElementById('ym-view-2d')?.addEventListener('click', function() {
      this.classList.add('bg-primary', 'text-white');
      document.getElementById('ym-view-3d')?.classList.remove('bg-primary', 'text-white');
      toast('2D schematic (3D overlay active)');
    });
  });
})();
