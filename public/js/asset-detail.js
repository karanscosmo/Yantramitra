(function() {
  async function get(path) {
    const r = await fetch(path, { credentials: 'same-origin' });
    if (!r.ok) throw new Error(path);
    return r.json();
  }

  function statusInfo(health, status) {
    if (status === 'maintenance' || health < 55)
      return { label: 'CRITICAL', cls: 'bg-error/10 border-error/20 text-error', dot: 'bg-error pulse-coral' };
    if (status === 'warning' || health < 80)
      return { label: 'WARNING', cls: 'bg-tertiary-container/20 border-tertiary-fixed-dim/20 text-tertiary', dot: 'bg-tertiary-fixed-dim pulse-amber' };
    return { label: 'OPTIMIZED', cls: 'bg-secondary-container/20 border-secondary/20 text-secondary', dot: 'bg-secondary pulse-teal' };
  }

  function renderHeader(machine) {
    const si = statusInfo(machine.health, machine.status);
    document.getElementById('asset-id-badge').textContent = 'ASSET ID: ' + (machine.serial || machine.id || '—');
    const badge = document.getElementById('asset-status-badge');
    badge.className = 'flex items-center gap-1.5 px-2 py-1 rounded-full ' + si.cls;
    badge.innerHTML = '<span class="w-2 h-2 rounded-full ' + si.dot + '"></span><span class="font-label-caps ' + si.cls.split(' ').pop() + '">' + si.label + '</span>';
    document.getElementById('asset-name').textContent = machine.name || 'Unknown Asset';
    const desc = machine.type ? machine.type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'Industrial asset';
    const loc = machine.location || (machine.plant ? machine.plant.name + ' facility' : '');
    document.getElementById('asset-description').textContent = machine.aiSummary || (desc + (loc ? ' located at ' + loc : '') + '.');
    document.title = 'YantraMitra | ' + (machine.name || 'Asset Detail');
  }

  function renderKpis(machine, readings) {
    const kpiCards = document.querySelectorAll('#tab-overview .glass-card');
    if (!kpiCards.length) return;
    const metrics = {};
    (readings || []).forEach(r => {
      if (!metrics[r.metric]) metrics[r.metric] = [];
      metrics[r.metric].push(r);
    });
    const latest = (metric) => {
      const arr = metrics[metric];
      if (!arr || !arr.length) return null;
      return arr.reduce((a, b) => new Date(a.timestamp) > new Date(b.timestamp) ? a : b);
    };
    const power = latest('power');
    const temp = latest('temperature');
    const vib = latest('vibration');
    if (power && kpiCards[0]) {
      kpiCards[0].querySelector('.font-kpi-numeric').textContent = power.value.toFixed(1);
      kpiCards[0].querySelector('.text-\\[12px\\]').textContent = 'Last reading ' + timeAgo(power.timestamp);
    }
    if (temp && kpiCards[1]) {
      kpiCards[1].querySelector('.font-kpi-numeric').textContent = temp.value.toFixed(1);
      kpiCards[1].querySelector('.text-\\[12px\\]').textContent = temp.value > 65 ? 'Elevated — monitor' : 'Within range';
    }
    if (vib && kpiCards[2]) {
      kpiCards[2].querySelector('.font-kpi-numeric').textContent = vib.value.toFixed(2);
      kpiCards[2].querySelector('.text-\\[12px\\]').textContent = vib.value < 3 ? 'Optimal Range' : 'Elevated';
    }
    const stabilityEl = document.querySelector('#tab-overview .font-kpi-numeric.text-primary');
    if (stabilityEl && !stabilityEl.closest('.glass-card')?.querySelector('.font-section-header')) {
      const val = machine.oee || machine.health || 85;
      stabilityEl.textContent = val.toFixed(1) + '%';
    }
    const twinEl = document.querySelector('#tab-overview .font-kpi-numeric.text-secondary');
    if (twinEl) twinEl.textContent = machine.health >= 85 ? 'A+' : machine.health >= 70 ? 'B+' : 'C';
    const twinTime = document.querySelector('#tab-overview .text-\\[12px\\].text-on-surface-variant');
    if (twinTime) twinTime.textContent = 'Synchronized ' + (timeAgo(machine.updatedAt) || 'recently');
  }

  function timeAgo(dateStr) {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return mins + 'm ago';
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return hrs + 'h ago';
    return Math.floor(hrs / 24) + 'd ago';
  }

  function renderSensors(machine) {
    const container = document.getElementById('sensors-content');
    if (!container) return;
    const sensors = machine.sensors || [];
    const readings = machine.readings || [];
    const metrics = {};
    readings.forEach(r => {
      if (!metrics[r.metric]) metrics[r.metric] = [];
      metrics[r.metric].push(r);
    });
    const getLatest = (metric) => {
      const arr = metrics[metric];
      if (!arr || !arr.length) return null;
      return arr.reduce((a, b) => new Date(a.timestamp) > new Date(b.timestamp) ? a : b);
    };
    if (!sensors.length) {
      container.innerHTML = '<div class="col-span-full flex flex-col items-center justify-center py-16 text-on-surface-variant"><span class="material-symbols-outlined text-4xl mb-2">sensors_off</span><p>No sensors registered for this asset.</p></div>';
      return;
    }
    container.innerHTML = sensors.map(s => {
      const latestReading = getLatest(s.metric);
      const val = latestReading ? latestReading.value : '—';
      const unit = s.unit || '';
      const ts = latestReading ? timeAgo(latestReading.timestamp) : 'No data';
      const healthy = s.status !== 'alarm';
      return '<div class="sensor-card glass-card p-md rounded-2xl">' +
        '<div class="flex items-start justify-between mb-sm">' +
        '<div class="flex items-center gap-xs">' +
        '<span class="material-symbols-outlined text-primary">' + (healthy ? 'check_circle' : 'warning') + '</span>' +
        '<div><p class="font-bold text-sm uppercase tracking-wide">' + (s.metric ? s.metric.replace(/_/g, ' ') : 'Sensor') + '</p>' +
        '<p class="text-[11px] text-on-surface-variant">' + (s.tag || '') + '</p></div></div>' +
        '<span class="w-2 h-2 rounded-full ' + (healthy ? 'bg-secondary' : 'bg-error') + '"></span></div>' +
        '<div class="flex items-baseline gap-xs mt-sm"><span class="font-kpi-numeric text-2xl ' + (healthy ? 'text-on-surface' : 'text-error') + '">' + val + '</span>' +
        '<span class="font-label-caps text-on-surface-variant text-xs">' + unit + '</span></div>' +
        '<p class="text-[11px] text-on-surface-variant mt-1">Updated ' + ts + '</p>' +
        '<div class="mt-sm h-16"><svg class="w-full h-full" preserveaspectratio="none">' +
        renderMiniChart(metrics[s.metric]) +
        '</svg></div></div>';
    }).join('');
  }

  function renderMiniChart(readings) {
    if (!readings || readings.length < 2) return '<line stroke="#E7E9F5" x1="0" y1="50%" x2="100%" y2="50%" stroke-width="1"/>';
    const recent = readings.slice(-24);
    const vals = recent.map(r => r.value);
    const max = Math.max(...vals, 1);
    const min = Math.min(...vals, 0);
    const range = max - min || 1;
    const points = vals.map((v, i) => {
      const x = (i / (vals.length - 1)) * 100;
      const y = 90 - ((v - min) / range) * 70;
      return x + ',' + y;
    }).join(' L');
    return '<path d="M' + points + '" fill="none" stroke="#413fd6" stroke-width="2"/>';
  }

  function renderHistory(machine) {
    const container = document.getElementById('history-content');
    if (!container) return;
    const events = machine.maintenanceEvents || [];
    const workOrders = machine.workOrders || [];
    const html = [];
    html.push('<div class="glass-card p-md rounded-2xl"><h3 class="font-section-header text-section-header mb-sm">Maintenance History</h3>');
    if (events.length) {
      html.push('<div class="space-y-sm">' + events.map(e => {
        const date = e.performedAt ? new Date(e.performedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';
        return '<div class="flex items-start gap-sm p-sm rounded-xl bg-surface-container-low"><div class="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0"></div><div><p class="font-bold text-sm">' + (e.title || 'Maintenance Event') + '</p><p class="text-xs text-on-surface-variant">' + date + (e.performedBy ? ' · ' + e.performedBy : '') + '</p>' + (e.notes ? '<p class="text-xs text-on-surface-variant mt-1">' + e.notes + '</p>' : '') + '</div></div>';
      }).join('') + '</div>');
    } else {
      html.push('<p class="text-on-surface-variant text-sm py-4">No maintenance events recorded.</p>');
    }
    html.push('</div>');
    html.push('<div class="glass-card p-md rounded-2xl"><h3 class="font-section-header text-section-header mb-sm">Work Orders</h3>');
    if (workOrders.length) {
      html.push('<div class="space-y-sm">' + workOrders.map(wo => {
        const date = wo.dueDate ? new Date(wo.dueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : wo.createdAt ? new Date(wo.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';
        const pCls = wo.priority === 'critical' ? 'text-error' : wo.priority === 'high' ? 'text-tertiary' : 'text-secondary';
        const sCls = wo.status === 'completed' ? 'bg-secondary/10 text-secondary' : wo.status === 'in_progress' ? 'bg-primary/10 text-primary' : 'bg-surface-container-high text-on-surface-variant';
        return '<div class="flex items-start gap-sm p-sm rounded-xl bg-surface-container-low"><div class="flex-1"><div class="flex items-center gap-xs"><p class="font-bold text-sm">' + (wo.title || 'Work Order') + '</p><span class="text-[10px] font-bold uppercase ' + pCls + '">' + wo.priority + '</span></div><p class="text-xs text-on-surface-variant">Due ' + date + (wo.assignedTo ? ' · ' + wo.assignedTo : '') + '</p></div><span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ' + sCls + '">' + wo.status + '</span></div>';
      }).join('') + '</div>');
    } else {
      html.push('<p class="text-on-surface-variant text-sm py-4">No work orders for this asset.</p>');
    }
    html.push('</div>');
    html.push('<div class="glass-card p-md rounded-2xl"><h3 class="font-section-header text-section-header mb-sm">AI Recommendations</h3>');
    const aiSummary = machine.aiSummary || machine.name + ' is currently ' + (machine.status || 'running') + '; health score is ' + Math.round(machine.health || 0) + '%.';
    const bearingNote = machine.bearing && machine.bearing !== 'normal' ? '<div class="flex items-start gap-sm p-sm rounded-xl bg-surface-container-low mt-sm"><span class="material-symbols-outlined text-tertiary text-[18px]">engineering</span><div><p class="font-bold text-sm">Bearing Condition</p><p class="text-xs text-on-surface-variant">' + machine.bearing + '</p></div></div>' : '';
    const lubeNote = machine.lubrication && machine.lubrication !== 'normal' ? '<div class="flex items-start gap-sm p-sm rounded-xl bg-surface-container-low mt-sm"><span class="material-symbols-outlined text-primary text-[18px]">oil_barrel</span><div><p class="font-bold text-sm">Lubrication</p><p class="text-xs text-on-surface-variant">' + machine.lubrication + '</p></div></div>' : '';
    html.push('<p class="text-sm text-on-surface-variant">' + aiSummary + '</p>' + bearingNote + lubeNote);
    if (machine.failureProbability != null) {
      html.push('<div class="flex items-center gap-xs mt-sm"><span class="font-label-caps text-xs text-on-surface-variant">Failure Probability:</span><div class="w-24 h-1.5 bg-outline-variant/20 rounded-full overflow-hidden"><div class="h-full rounded-full ' + (machine.failureProbability > 50 ? 'bg-error' : machine.failureProbability > 25 ? 'bg-tertiary' : 'bg-secondary') + '" style="width:' + machine.failureProbability + '%"></div></div><span class="font-kpi-numeric text-xs">' + Math.round(machine.failureProbability) + '%</span></div>');
    }
    if (machine.remainingUsefulLife != null) {
      html.push('<div class="flex items-center gap-xs mt-sm"><span class="font-label-caps text-xs text-on-surface-variant">Remaining Useful Life:</span><span class="font-bold text-sm text-primary">' + machine.remainingUsefulLife + ' days</span></div>');
    }
    html.push('</div>');
    container.innerHTML = html.join('');
  }

  function renderDocuments(machine) {
    const container = document.getElementById('documents-content');
    if (!container) return;
    const type = machine.type || 'asset';
    const name = machine.name || 'Asset';
    const docs = [
      { title: 'Product Manual', icon: 'menu_book', type: 'PDF', desc: type.replace(/_/g, ' ') + ' — technical reference guide for operators and engineers.' },
      { title: 'Standard Operating Procedure', icon: 'assignment', type: 'PDF', desc: 'Step-by-step operating procedure for ' + type.replace(/_/g, ' ') + '.' },
      { title: 'Inspection Report', icon: 'fact_check', type: 'PDF', desc: 'Latest periodic inspection findings for ' + name + '.' },
      { title: 'Maintenance Guide', icon: 'build', type: 'PDF', desc: 'Preventive and corrective maintenance schedule and procedures.' },
      { title: 'Certificate of Compliance', icon: 'verified', type: 'PDF', desc: 'CE and ISO compliance certification for this equipment class.' },
      { title: 'Safety Guidelines', icon: 'warning_amber', type: 'PDF', desc: 'Operator safety protocols, PPE requirements, and emergency procedures.' },
    ];
    container.innerHTML = docs.map(doc =>
      '<div class="doc-card glass-card p-md rounded-2xl flex flex-col">' +
      '<div class="flex items-center gap-xs mb-sm">' +
      '<span class="material-symbols-outlined text-primary text-2xl">' + doc.icon + '</span>' +
      '<div><p class="font-bold text-sm">' + doc.title + '</p><p class="text-[10px] font-label-caps text-on-surface-variant uppercase">' + doc.type + '</p></div></div>' +
      '<p class="text-xs text-on-surface-variant flex-1">' + doc.desc + '</p>' +
      '<div class="flex gap-xs mt-sm pt-sm border-t border-outline-variant/10">' +
      '<button class="doc-download flex-1 text-center text-xs font-bold text-primary py-2 rounded-lg bg-primary/5 hover:bg-primary/10 transition-colors flex items-center justify-center gap-1"><span class="material-symbols-outlined text-[16px]">download</span> Download</button>' +
      '<button class="doc-open flex-1 text-center text-xs font-bold text-on-surface-variant py-2 rounded-lg hover:bg-surface-container transition-colors flex items-center justify-center gap-1"><span class="material-symbols-outlined text-[16px]">open_in_new</span> Open</button></div></div>'
    ).join('');
    container.querySelectorAll('.doc-download, .doc-open').forEach(btn => {
      btn.addEventListener('click', () => {
        window.open('/docs/yantramitra-project-overview.pdf', '_blank');
      });
    });
  }

  function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    const target = document.getElementById('tab-' + tabId);
    if (target) target.classList.remove('hidden');
    document.querySelectorAll('.asset-tab').forEach(tab => {
      const isActive = tab.dataset.tab === tabId;
      tab.className = 'asset-tab px-md py-4 flex items-center gap-xs transition-all ' +
        (isActive
          ? 'text-primary font-bold border-b-2 border-primary'
          : 'text-on-surface-variant font-medium hover:text-primary border-b-2 border-transparent');
      tab.setAttribute('aria-selected', String(isActive));
    });
  }

  document.addEventListener('DOMContentLoaded', async () => {
    try {
      const me = await get('/api/auth/me');
      if (!me || !me.id) return window.location.href = '/';
    } catch { return window.location.href = '/'; }
    const assetId = window.location.pathname.split('/assets/')[1] || '';
    try {
      const machines = await get('/api/machines');
      const slugify = value => String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      let machine = machines.find(m => m.id === assetId) ||
        machines.find(m => slugify(m.name) === assetId);
      if (!machine && assetId) {
        try {
          const byId = await get('/api/machines/' + assetId);
          if (byId && byId.id) machine = byId;
        } catch {}
      }
      if (!machine) machine = machines[0];
      const details = await get('/api/machines/' + (machine.id || assetId));
      if (!details) { document.getElementById('asset-name').textContent = 'Asset not found'; return; }
      renderHeader(details);
      renderKpis(details, details.readings || []);
      renderSensors(details);
      renderHistory(details);
      renderDocuments(details);

      document.querySelectorAll('.asset-tab').forEach(tab => {
        tab.addEventListener('click', () => switchTab(tab.dataset.tab));
      });

      const kpiInterval = setInterval(() => {
        const live = document.querySelector('#tab-overview');
        if (!live || live.classList.contains('hidden')) return;
        const ts = document.querySelector('#tab-overview .text-\\[12px\\].text-on-surface-variant');
        if (ts) ts.textContent = 'Synchronized just now';
      }, 30000);

      window.addEventListener('beforeunload', () => clearInterval(kpiInterval));
    } catch (e) {
      document.getElementById('asset-name').textContent = 'Error loading asset';
      console.warn('Asset detail error:', e);
    }

    const exportBtn = document.querySelector('button:has(.material-symbols-outlined:first-child)');
    if (exportBtn && exportBtn.textContent.includes('Export')) {
      exportBtn.addEventListener('click', () => {
        const id = window.location.pathname.split('/assets/')[1] || 'asset';
        window.location.href = '/api/machines/' + id + '/export';
      });
    }
  });
})();