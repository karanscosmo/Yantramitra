(function() {
  const plantImages = {
    'pune-auto': '/images/home-pune-automotive.jpg',
    'ahmedabad-textiles': '/images/home-ahmedabad-process.jpg',
    'chennai-electronics': '/images/home-chennai-electronics.jpg',
    'bengaluru-fab': '/images/home-bengaluru-precision.jpg',
    'nagpur-logistics': '/images/home-nagpur-logistics.jpg'
  };

  const dotPositions = [
    { left: 28, top: 38 }, { left: 42, top: 28 }, { left: 58, top: 43 },
    { left: 68, top: 60 }, { left: 36, top: 68 }, { left: 52, top: 72 }
  ];

  async function get(path) {
    const response = await fetch(path, { credentials: 'same-origin' });
    if (!response.ok) throw new Error(path);
    return response.json();
  }

  async function post(path, body) {
    const response = await fetch(path, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!response.ok) throw new Error(path);
    return response.json();
  }

  function injectStyles() {
    if (document.getElementById('ym-scenario-styles')) return;
    const style = document.createElement('style');
    style.id = 'ym-scenario-styles';
    style.textContent = `
      #ym-scenario-plants { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:10px; margin-top:18px; }
      .ym-scenario-plant { text-align:left; border:1px solid rgba(199,196,215,.55); border-radius:16px; padding:10px 12px; background:rgba(255,255,255,.72); transition:.18s ease; }
      .ym-scenario-plant:hover, .ym-scenario-plant.is-active { border-color:#413fd6; box-shadow:0 12px 28px rgba(65,63,214,.14); transform:translateY(-1px); }
      .ym-scenario-plant strong { display:block; font:900 12px/1.15 Inter,system-ui,sans-serif; color:#191a28; }
      .ym-scenario-plant span { display:block; margin-top:3px; font:800 10px/1.15 Inter,system-ui,sans-serif; color:#6f6d7d; text-transform:uppercase; letter-spacing:.08em; }
      #ym-scenario-overlay { position:absolute; inset:0; z-index:3; pointer-events:none; background:linear-gradient(135deg,rgba(65,63,214,.08),rgba(94,250,228,.06)); }
      .ym-scenario-dot { position:absolute; transform:translate(-50%,-50%); pointer-events:auto; }
      .ym-scenario-dot button { display:flex; align-items:center; gap:8px; border:1px solid rgba(255,255,255,.55); border-radius:999px; background:rgba(255,255,255,.84); color:#191a28; padding:7px 10px; font:900 10px/1 Inter,system-ui,sans-serif; box-shadow:0 12px 30px rgba(0,0,0,.18); }
      .ym-scenario-dot i { width:10px; height:10px; border-radius:999px; background:#5efae4; box-shadow:0 0 0 8px rgba(94,250,228,.16); }
      .ym-scenario-dot.is-risk i { background:#c61c1c; box-shadow:0 0 0 8px rgba(198,28,28,.14); }
      .ym-scenario-dot.is-applied i { background:#087b6f; box-shadow:0 0 0 10px rgba(8,123,111,.16); }
      .ym-scenario-banner { position:absolute; left:28px; right:28px; top:86px; z-index:4; border-radius:18px; border:1px solid rgba(94,250,228,.35); background:rgba(255,255,255,.84); backdrop-filter:blur(18px); padding:14px 16px; box-shadow:0 18px 46px rgba(65,63,214,.18); }
      .ym-scenario-banner strong { display:block; color:#087b6f; font-weight:900; }
      .ym-scenario-banner span { color:#464555; font-size:13px; }
      .ym-scenario-chart { transform-origin:bottom; transition:clip-path .25s ease, opacity .25s ease; }
      @media (max-width:900px) { #ym-scenario-plants { grid-template-columns:1fr; } }
    `;
    document.head.appendChild(style);
  }

  function imageFor(plant) {
    return plantImages[plant.id] || plant.imageUrl || '/images/ym-digital-twin-factory.jpg';
  }

  function yieldGain() {
    const speed = Number(document.querySelector('input[type="range"][max="100"]')?.value || 85);
    const delay = Number(document.querySelector('input[type="range"][max="50"]')?.value || 12);
    const power = Number(document.querySelector('input[type="range"][max="1000"]')?.value || 420);
    return Math.max(2.8, Math.min(18.5, (speed - 70) * 0.38 + (power - 350) * 0.018 - delay * 0.08)).toFixed(1);
  }

  function setViewMode(mode) {
    const three = document.getElementById('view-3d');
    const two = document.getElementById('view-2d');
    const overlay = document.getElementById('ym-scenario-overlay');
    if (!three || !two) return;
    three.classList.toggle('bg-primary', mode === '3d');
    three.classList.toggle('text-white', mode === '3d');
    two.classList.toggle('bg-primary', mode === '2d');
    two.classList.toggle('text-white', mode === '2d');
    two.classList.toggle('text-on-surface-variant', mode !== '2d');
    if (overlay) overlay.style.background = mode === '2d'
      ? 'repeating-linear-gradient(0deg,rgba(65,63,214,.12) 0 1px,transparent 1px 44px),repeating-linear-gradient(90deg,rgba(65,63,214,.12) 0 1px,transparent 1px 44px),linear-gradient(135deg,rgba(94,250,228,.08),rgba(65,63,214,.08))'
      : 'linear-gradient(135deg,rgba(65,63,214,.08),rgba(94,250,228,.06))';
  }

  function updateRecommendation(plant) {
    const gain = yieldGain();
    const power = document.getElementById('power-val')?.textContent || '420 kW';
    const card = Array.from(document.querySelectorAll('h4')).find(node => node.textContent.includes('Increase Load'));
    const desc = card?.nextElementSibling;
    if (card) card.textContent = `Tune ${plant.name.split(' ')[0]} load to ${power}`;
    if (desc) desc.textContent = `Simulation predicts a ${gain}% yield improvement using ${plant.location.split(',')[0]} asset telemetry. Deploy to update the plant 3D map.`;
    const chart = document.querySelector('.area-chart-simulated');
    if (chart) {
      chart.classList.add('ym-scenario-chart');
      chart.style.clipPath = `polygon(0 ${82 - Number(gain) * 2}%, 22% 62%, 44% ${58 - Number(gain)}%, 66% 42%, 100% 26%, 100% 100%, 0 100%)`;
    }
  }

  function renderOverlay(plant, machines, applied) {
    const leftPane = document.querySelector('main > section:first-child');
    if (!leftPane) return;
    let overlay = document.getElementById('ym-scenario-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'ym-scenario-overlay';
      leftPane.appendChild(overlay);
    }
    const plantMachines = machines.filter(machine => machine.plantId === plant.id).slice(0, 6);
    const rows = (plantMachines.length ? plantMachines : [{ name: plant.name + ' primary line', status: plant.status }]).map((machine, index) => {
      const pos = dotPositions[index % dotPositions.length];
      const risky = /critical|warning|attention|fault/i.test(machine.status || plant.status || '') || index === 1;
      return `<div class="ym-scenario-dot ${applied ? 'is-applied' : risky ? 'is-risk' : ''}" style="left:${pos.left}%;top:${pos.top}%">
        <button type="button" title="${machine.name}">
          <i></i><span>${machine.name}</span>
        </button>
      </div>`;
    }).join('');
    overlay.innerHTML = `
      ${applied ? `<div class="ym-scenario-banner"><strong>Scenario deployed to ${plant.name}</strong><span>3D twin now reflects ${yieldGain()}% projected yield lift, safer load balancing, and updated machine risk states.</span></div>` : ''}
      ${rows}
    `;
  }

  function renderPlantSwitcher(plants, selected, onSelect) {
    const header = document.querySelector('main > section:last-child header');
    if (!header) return;
    let switcher = document.getElementById('ym-scenario-plants');
    if (!switcher) {
      switcher = document.createElement('div');
      switcher.id = 'ym-scenario-plants';
      header.appendChild(switcher);
    }
    switcher.innerHTML = plants.map(plant => `
      <button type="button" class="ym-scenario-plant ${plant.id === selected.id ? 'is-active' : ''}" data-plant-id="${plant.id}">
        <strong>${plant.name}</strong>
        <span>${plant.location.split(',')[0]} · OEE ${plant.oee || 'n/a'}%</span>
      </button>
    `).join('');
    switcher.querySelectorAll('[data-plant-id]').forEach(button => {
      button.addEventListener('click', () => onSelect(plants.find(plant => plant.id === button.dataset.plantId)));
    });
  }

  function setPlant(plant, plants, machines, applied, onSelect) {
    if (!plant) return;
    const image = document.querySelector('img[alt="Factory Digital Twin"]');
    if (image) image.src = imageFor(plant);
    renderPlantSwitcher(plants, plant, onSelect);
    renderOverlay(plant, machines, applied);
    updateRecommendation(plant);
  }

  async function checkAuth() {
    try {
      const me = await get('/api/auth/me');
      if (!me || !me.id) window.location.href = '/login';
      return me;
    } catch {
      window.location.href = '/login';
      return null;
    }
  }

  document.addEventListener('DOMContentLoaded', async () => {
    injectStyles();
    const user = await checkAuth();
    if (!user) return;

    const [plants, machines] = await Promise.all([
      get('/api/plants').catch(() => []),
      get('/api/machines').catch(() => [])
    ]);
    if (!plants.length) return;

    let current = plants[0];
    let applied = false;
    const selectPlant = plant => {
      current = plant || current;
      applied = false;
      setPlant(current, plants, machines, applied, selectPlant);
    };
    setPlant(current, plants, machines, applied, selectPlant);

    document.getElementById('view-3d')?.addEventListener('click', () => setViewMode('3d'));
    document.getElementById('view-2d')?.addEventListener('click', () => setViewMode('2d'));
    document.querySelectorAll('input[type="range"]').forEach(input => {
      input.addEventListener('input', () => {
        applied = false;
        renderOverlay(current, machines, applied);
        updateRecommendation(current);
      });
    });

    document.querySelectorAll('main > section:first-child button').forEach(button => {
      if (button.id === 'view-3d' || button.id === 'view-2d') return;
      button.title = button.title || (button.textContent.trim() || 'Toggle simulator layer');
      button.addEventListener('click', () => {
        const overlay = document.getElementById('ym-scenario-overlay');
        if (overlay) overlay.classList.toggle('ring-4');
      });
    });

    const deploy = Array.from(document.querySelectorAll('button')).find(button => /deploy scenario/i.test(button.textContent));
    deploy?.addEventListener('click', async () => {
      if (applied) {
        window.location.href = `/digital-twin?plant=${encodeURIComponent(current.id)}`;
        return;
      }
      const original = deploy.innerHTML;
      deploy.disabled = true;
      deploy.innerHTML = '<span class="material-symbols-outlined animate-spin">sync</span><span>Deploying to 3D twin...</span>';
      await post('/api/plans', {
        title: `${current.name} simulation deployment`,
        description: `Scenario simulator applied ${yieldGain()}% projected yield lift to ${current.location}.`,
        type: 'optimization',
        status: 'pending',
        priority: 'medium'
      }).catch(() => {});
      applied = true;
      renderOverlay(current, machines, applied);
      deploy.innerHTML = '<span class="material-symbols-outlined">check_circle</span><span>Applied — Open 3D Plant Map</span>';
      deploy.disabled = false;
      setTimeout(() => { if (deploy.innerHTML.includes('Applied')) deploy.innerHTML = original; }, 7000);
    });
  });
})();
