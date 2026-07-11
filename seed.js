const prisma = require('./lib/prisma');
const bcrypt = require('bcryptjs');

const people = [
  { email: 'admin@yantramitra.com', name: 'Ananya Rao', role: 'admin', avatar: '/images/people-ananya-rao.svg', phone: '+91 98765 10011' },
  { email: 'operator@yantramitra.com', name: 'Rohan Mehta', role: 'operator', avatar: '/images/people-rohan-mehta.svg', phone: '+91 98765 10012' },
  { email: 'kavya.iyer@yantramitra.com', name: 'Kavya Iyer', role: 'plant_manager', avatar: '/images/people-kavya-iyer.svg', phone: '+91 98765 10013' },
  { email: 'farhan.shaikh@yantramitra.com', name: 'Farhan Shaikh', role: 'maintenance', avatar: '/images/people-farhan-shaikh.svg', phone: '+91 98765 10014' },
  { email: 'meera.nair@yantramitra.com', name: 'Meera Nair', role: 'maintenance', avatar: '/images/people-meera-nair.svg', phone: '+91 98765 10015' },
  { email: 'arjun.menon@yantramitra.com', name: 'Arjun Menon', role: 'operator', avatar: '/images/people-arjun-menon.svg', phone: '+91 98765 10016' },
  { email: 'neha.kulkarni@yantramitra.com', name: 'Neha Kulkarni', role: 'executive', avatar: '/images/people-neha-kulkarni.svg', phone: '+91 98765 10017' },
];

const plantData = [
  {
    name: 'Pune Auto Components',
    location: 'Pune, Maharashtra, India',
    domain: 'Automotive Components',
    status: 'operational',
    lat: 18.5204,
    lng: 73.8567,
    oee: 86.4,
    uptime: 99.1,
    image: '/images/plant-pune-auto.svg',
    floorLayout: { theme: 'automotive', zones: ['CNC Bay', 'Robotic Weld Cell', 'Final Gauging'], dimensions: { width: 34, depth: 22 } },
  },
  {
    name: 'Ahmedabad Process Textiles',
    location: 'Ahmedabad, Gujarat, India',
    domain: 'Textile & Chemical Processing',
    status: 'attention',
    lat: 23.0225,
    lng: 72.5714,
    oee: 78.6,
    uptime: 96.8,
    image: '/images/plant-ahmedabad-textile.svg',
    floorLayout: { theme: 'textile', zones: ['Dyeing Range', 'Chemical Dosing', 'Effluent Monitoring'], dimensions: { width: 38, depth: 24 } },
  },
  {
    name: 'Chennai Electronics Assembly',
    location: 'Chennai, Tamil Nadu, India',
    domain: 'Electronics Assembly',
    status: 'operational',
    lat: 13.0827,
    lng: 80.2707,
    oee: 91.2,
    uptime: 99.4,
    image: '/images/plant-chennai-electronics.svg',
    floorLayout: { theme: 'electronics', zones: ['SMT Line', 'AOI', 'Burn-In', 'Packing'], dimensions: { width: 36, depth: 20 } },
  },
  {
    name: 'Bengaluru Precision Fab Lab',
    location: 'Bengaluru, Karnataka, India',
    domain: 'Precision Engineering & R&D Fabrication',
    status: 'operational',
    lat: 12.9716,
    lng: 77.5946,
    oee: 88.9,
    uptime: 98.9,
    image: '/images/plant-bengaluru-precision.svg',
    floorLayout: { theme: 'precision', zones: ['Micro Machining', 'Metrology', 'Additive Cell'], dimensions: { width: 30, depth: 18 } },
  },
  {
    name: 'Nagpur Central Logistics Hub',
    location: 'Nagpur, Maharashtra, India',
    domain: 'Industrial Logistics & Spares',
    status: 'operational',
    lat: 21.1458,
    lng: 79.0882,
    oee: 82.7,
    uptime: 98.2,
    image: '/images/plant-nagpur-logistics.svg',
    floorLayout: { theme: 'logistics', zones: ['Inbound Dock', 'ASRS', 'Dispatch Lanes'], dimensions: { width: 40, depth: 24 } },
  },
];

const machineTemplates = [
  ['Pune Auto Components', 'CNC-PN-101', 'cnc', 'running', 94.4, 'CNC Bay A', -12, -5, 0],
  ['Pune Auto Components', 'CNC-PN-102', 'cnc', 'warning', 72.6, 'CNC Bay B', -6, -5, 0],
  ['Pune Auto Components', 'ROBO-WELD-PN-201', 'robotic_welder', 'running', 90.1, 'Robotic Weld Cell', 2, -3, 0.4],
  ['Pune Auto Components', 'PRESS-PN-301', 'servo_press', 'running', 87.5, 'Press Line', 9, -5, 0],
  ['Pune Auto Components', 'CMM-PN-401', 'metrology', 'running', 96.9, 'Final Gauging', 13, 4, -0.2],
  ['Ahmedabad Process Textiles', 'DYE-AH-101', 'dyeing_jigger', 'warning', 69.8, 'Dyeing Range 1', -13, -4, 0],
  ['Ahmedabad Process Textiles', 'STENTER-AH-201', 'stenter', 'running', 81.5, 'Heat Setting', -5, -4, 0],
  ['Ahmedabad Process Textiles', 'DOSING-AH-301', 'chemical_dosing', 'maintenance', 51.2, 'Dosing Skid', 4, -2, 0],
  ['Ahmedabad Process Textiles', 'ETP-AH-401', 'effluent_treatment', 'running', 88.3, 'ETP Bay', 12, -3, 0],
  ['Ahmedabad Process Textiles', 'DRYER-AH-501', 'dryer', 'running', 84.6, 'Drying Line', 2, 6, 0.15],
  ['Chennai Electronics Assembly', 'SMT-CH-101', 'smt_line', 'running', 95.4, 'SMT Line 1', -13, -3, 0],
  ['Chennai Electronics Assembly', 'AOI-CH-201', 'aoi', 'running', 93.2, 'Inspection Bay', -5, -3, 0],
  ['Chennai Electronics Assembly', 'PICK-CH-301', 'pick_place', 'warning', 74.1, 'Placement Cell', 3, -3, 0],
  ['Chennai Electronics Assembly', 'REFLOW-CH-401', 'reflow_oven', 'running', 90.7, 'Thermal Process', 11, -3, 0],
  ['Chennai Electronics Assembly', 'BURNIN-CH-501', 'burn_in', 'running', 89.9, 'Burn-In Rack', 5, 6, 0],
  ['Bengaluru Precision Fab Lab', 'MICRO-BL-101', 'micro_mill', 'running', 92.8, 'Micro Machining', -10, -4, 0],
  ['Bengaluru Precision Fab Lab', 'LASER-BL-201', 'laser_cutter', 'running', 89.1, 'Laser Cell', -2, -4, 0],
  ['Bengaluru Precision Fab Lab', 'AM-BL-301', 'additive_printer', 'warning', 67.4, 'Additive Cell', 7, -3, 0],
  ['Bengaluru Precision Fab Lab', 'CMM-BL-401', 'metrology', 'running', 97.2, 'Metrology Lab', 12, 4, 0],
  ['Bengaluru Precision Fab Lab', 'VAC-BL-501', 'vacuum_pump', 'running', 86.5, 'Clean Fabrication', -6, 5, 0],
  ['Nagpur Central Logistics Hub', 'ASRS-NG-101', 'asrs', 'running', 91.7, 'ASRS Aisle', -12, -4, 0],
  ['Nagpur Central Logistics Hub', 'SORT-NG-201', 'sorter', 'running', 85.2, 'Sortation Loop', -4, -3, 0],
  ['Nagpur Central Logistics Hub', 'AGV-NG-301', 'agv_charger', 'warning', 73.8, 'AGV Charging', 5, -4, 0],
  ['Nagpur Central Logistics Hub', 'DOCK-NG-401', 'dock_leveler', 'running', 88.8, 'Dispatch Dock', 13, -4, 0],
  ['Nagpur Central Logistics Hub', 'PACK-NG-501', 'packing_line', 'running', 90.3, 'Packing Lane', 4, 6, 0],
];

const metricProfile = {
  cnc: [62, 2.2, 6, 3200, 28, 0],
  robotic_welder: [78, 3.4, 3, 120, 35, 0],
  servo_press: [55, 2.4, 7, 80, 45, 0],
  metrology: [24, 0.4, 1, 20, 5, 0],
  dyeing_jigger: [92, 2.8, 4, 90, 30, 110],
  stenter: [168, 3.1, 5, 60, 80, 0],
  chemical_dosing: [48, 6.4, 6, 1400, 18, 65],
  effluent_treatment: [38, 2.2, 3, 450, 22, 180],
  dryer: [142, 3.5, 2, 70, 75, 0],
  smt_line: [36, 1.1, 1, 600, 12, 0],
  aoi: [28, 0.5, 1, 40, 4, 0],
  pick_place: [42, 4.2, 2, 2200, 18, 0],
  reflow_oven: [245, 1.8, 1, 55, 65, 0],
  burn_in: [58, 1.2, 1, 10, 25, 0],
  micro_mill: [58, 1.4, 5, 42000, 12, 0],
  laser_cutter: [44, 0.8, 5, 100, 22, 0],
  additive_printer: [72, 3.9, 2, 60, 16, 0],
  vacuum_pump: [64, 2.6, 8, 1800, 15, 45],
  asrs: [39, 1.2, 1, 180, 14, 0],
  sorter: [44, 2.1, 1, 320, 16, 0],
  agv_charger: [56, 1.3, 1, 0, 40, 0],
  dock_leveler: [42, 1.9, 160, 20, 8, 0],
  packing_line: [38, 1.5, 1, 240, 10, 0],
};

async function main() {
  console.log('Seeding realistic Indian multi-plant scenario...');

  await prisma.sensorReading.deleteMany();
  await prisma.alarm.deleteMany();
  await prisma.workOrder.deleteMany();
  await prisma.machine.deleteMany();
  await prisma.plant.deleteMany();
  await prisma.agent.deleteMany();
  await prisma.plan.deleteMany();
  await prisma.user.deleteMany();

  const hashedPassword = await bcrypt.hash('password123', 10);
  const users = [];
  for (const person of people) {
    users.push(await prisma.user.create({
      data: {
        ...person,
        password: hashedPassword,
        prefs: { criticalAlerts: true, shiftDigest: true, agentActions: true, weeklyReport: false },
        integrations: { CMMS: true, ERP: false, SCADA: true, Historian: true },
        sessions: [
          { device: 'Chrome on macOS', city: 'Pune', lastSeen: 'just now', current: true },
          { device: 'Edge on Windows', city: 'Bengaluru', lastSeen: '2h ago', current: false },
        ],
      }
    }));
  }

  const plants = new Map();
  for (const p of plantData) {
    const plant = await prisma.plant.create({ data: p });
    plants.set(plant.name, plant);
  }

  const machines = [];
  for (const [plantName, name, type, status, health, location, posX, posZ, rotation] of machineTemplates) {
    machines.push(await prisma.machine.create({
      data: {
        name, type, status, health, location, posX, posZ, rotation,
        plantId: plants.get(plantName).id,
      }
    }));
  }

  const metrics = ['temperature', 'vibration', 'pressure', 'rpm', 'power', 'flow_rate'];
  const units = ['C', 'mm/s', 'bar', 'RPM', 'kW', 'L/min'];
  for (const machine of machines) {
    const profile = metricProfile[machine.type] || [50, 2, 2, 500, 15, 0];
    const readingsBatch = [];
    for (let hour = 0; hour < 96; hour++) {
      metrics.forEach((metric, idx) => {
        const base = profile[idx];
        const stress = machine.status === 'maintenance' ? 1.35 : machine.status === 'warning' ? 1.18 : 1;
        const value = base * stress + (Math.random() - 0.5) * Math.max(base * 0.14, 1);
        readingsBatch.push({
          machineId: machine.id,
          metric,
          value: Math.round(value * 100) / 100,
          unit: units[idx],
          timestamp: new Date(Date.now() - (96 - hour) * 3600000),
        });
      });
    }
    await prisma.sensorReading.createMany({ data: readingsBatch });
  }

  const byName = Object.fromEntries(machines.map(m => [m.name, m]));
  await prisma.alarm.createMany({
    data: [
      { machineId: byName['CNC-PN-102'].id, severity: 'critical', title: 'Spindle thermal drift', message: 'Pune CNC-PN-102 spindle bearing temperature rising above compensated tolerance.', status: 'active' },
      { machineId: byName['DOSING-AH-301'].id, severity: 'critical', title: 'Caustic dosing pump vibration', message: 'Ahmedabad chemical dosing skid shows cavitation and flow instability.', status: 'active' },
      { machineId: byName['PICK-CH-301'].id, severity: 'warning', title: 'Nozzle placement rejects', message: 'Chennai pick-and-place nozzle bank B has elevated reject rate.', status: 'active' },
      { machineId: byName['AM-BL-301'].id, severity: 'warning', title: 'Build chamber humidity drift', message: 'Bengaluru additive printer chamber humidity is outside micro-fab control band.', status: 'active' },
      { machineId: byName['AGV-NG-301'].id, severity: 'warning', title: 'AGV charger imbalance', message: 'Nagpur AGV fast charger is throttling module 3 under load.', status: 'active' },
      { machineId: byName['DYE-AH-101'].id, severity: 'warning', title: 'Dye bath temperature oscillation', message: 'Dyeing jigger PID loop is overshooting during shade-change cycle.', status: 'active' },
      { machineId: byName['SMT-CH-101'].id, severity: 'info', title: 'Feeder calibration due', message: 'SMT feeder calibration due within 36 hours.', status: 'active' },
      { machineId: byName['CMM-BL-401'].id, severity: 'info', title: 'Probe verification complete', message: 'Metrology probe verification completed successfully.', status: 'resolved', resolvedAt: new Date() },
    ]
  });

  await prisma.agent.createMany({
    data: [
      { name: 'Sentinel Pune', type: 'monitoring', status: 'active', model: 'Sentinel-X1', mission: 'Watch CNC spindle drift and robotic weld cycle anomalies in Pune.', progress: 82 },
      { name: 'Rang AI', type: 'analysis', status: 'active', model: 'Diagnostic-D2', mission: 'Investigate Ahmedabad dye-bath temperature oscillation and dosing cavitation.', progress: 58 },
      { name: 'SMT Guardian', type: 'inspection', status: 'active', model: 'Inspector-I1', mission: 'Track Chennai placement rejects and AOI false positives.', progress: 76 },
      { name: 'MicroFab Planner', type: 'planning', status: 'paused', model: 'Planner-P3', mission: 'Build a controlled intervention plan for Bengaluru additive printer humidity drift.', progress: 44 },
      { name: 'Spares Optimizer', type: 'optimization', status: 'idle', model: 'Optimizer-O2', mission: 'Rebalance Nagpur spares inventory for critical maintenance kits.', progress: 18 },
      { name: 'Approval Sentinel', type: 'approval', status: 'done', model: 'Sentinel-X1', mission: 'Validate last approved maintenance plan against open alarms.', progress: 100 },
    ]
  });

  await prisma.plan.createMany({
    data: [
      { title: 'Pune CNC-PN-102 spindle intervention', description: 'Inspect spindle bearing pack, rebalance tool carousel, and verify thermal compensation.', type: 'maintenance', status: 'pending', priority: 'critical', createdBy: users[0].id, plantId: plants.get('Pune Auto Components').id },
      { title: 'Ahmedabad dosing skid flush window', description: 'Schedule controlled flush, inspect suction strainers, and recalibrate caustic dosing loop.', type: 'maintenance', status: 'pending', priority: 'critical', createdBy: users[3].id, plantId: plants.get('Ahmedabad Process Textiles').id },
      { title: 'Chennai placement reject reduction', description: 'Replace nozzle bank B, run feeder calibration, and verify AOI recipe.', type: 'optimization', status: 'approved', priority: 'high', createdBy: users[4].id, approvedBy: users[0].id, approvedAt: new Date(), plantId: plants.get('Chennai Electronics Assembly').id },
      { title: 'Bengaluru additive humidity control', description: 'Service dryer cartridge and tune chamber purge control.', type: 'upgrade', status: 'pending', priority: 'high', createdBy: users[2].id, plantId: plants.get('Bengaluru Precision Fab Lab').id },
      { title: 'Nagpur AGV charger module swap', description: 'Swap charger module 3 and rebalance pack charge curves.', type: 'replacement', status: 'approved', priority: 'medium', createdBy: users[5].id, approvedBy: users[0].id, approvedAt: new Date(), plantId: plants.get('Nagpur Central Logistics Hub').id },
    ]
  });

  await prisma.workOrder.createMany({
    data: [
      { title: 'Inspect CNC-PN-102 spindle pack', description: 'Thermal drift and vibration trend require immediate mechanical inspection.', status: 'in_progress', priority: 'critical', machineId: byName['CNC-PN-102'].id, assignedTo: 'Farhan Shaikh', createdBy: users[0].id, dueDate: '2026-07-12' },
      { title: 'Flush DOSING-AH-301 suction strainer', description: 'Caustic dosing skid cavitation detected during shade-change cycle.', status: 'open', priority: 'critical', machineId: byName['DOSING-AH-301'].id, assignedTo: 'Meera Nair', createdBy: users[3].id, dueDate: '2026-07-12' },
      { title: 'Replace PICK-CH-301 nozzle bank B', description: 'Elevated placement rejects during electronics assembly run.', status: 'open', priority: 'high', machineId: byName['PICK-CH-301'].id, assignedTo: 'Arjun Menon', createdBy: users[4].id, dueDate: '2026-07-13' },
      { title: 'Service AM-BL-301 dryer cartridge', description: 'Humidity drift affecting additive printer build chamber.', status: 'open', priority: 'high', machineId: byName['AM-BL-301'].id, assignedTo: 'Kavya Iyer', createdBy: users[2].id, dueDate: '2026-07-14' },
      { title: 'Swap AGV-NG-301 charger module 3', description: 'Module imbalance throttling AGV charge bay throughput.', status: 'open', priority: 'medium', machineId: byName['AGV-NG-301'].id, assignedTo: 'Rohan Mehta', createdBy: users[5].id, dueDate: '2026-07-16' },
      { title: 'SMT-CH-101 feeder calibration', description: 'Preventive feeder calibration for active electronics run.', status: 'completed', priority: 'medium', machineId: byName['SMT-CH-101'].id, assignedTo: 'Arjun Menon', createdBy: users[4].id, dueDate: '2026-07-10' },
    ]
  });

  console.log('Seeding complete!');
  console.log(`  ${await prisma.user.count()} users`);
  console.log(`  ${await prisma.plant.count()} Indian facilities`);
  console.log(`  ${await prisma.machine.count()} domain-specific machines`);
  console.log(`  ${await prisma.sensorReading.count()} sensor readings`);
  console.log(`  ${await prisma.alarm.count()} alarms`);
  console.log(`  ${await prisma.agent.count()} agents`);
  console.log(`  ${await prisma.plan.count()} plans`);
  console.log(`  ${await prisma.workOrder.count()} work orders`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
