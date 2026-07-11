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
    energyUsage: 12.8,
    co2Tonnes: 5.4,
    utilization: 88.2,
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
    energyUsage: 18.6,
    co2Tonnes: 8.9,
    utilization: 81.4,
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
    energyUsage: 7.2,
    co2Tonnes: 3.1,
    utilization: 92.6,
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
    energyUsage: 6.8,
    co2Tonnes: 2.8,
    utilization: 84.7,
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
    energyUsage: 5.4,
    co2Tonnes: 2.2,
    utilization: 86.9,
    image: '/images/plant-nagpur-logistics.svg',
    floorLayout: { theme: 'logistics', zones: ['Inbound Dock', 'ASRS', 'Dispatch Lanes'], dimensions: { width: 40, depth: 24 } },
  },
];

const machineTemplates = [
  ['Pune Auto Components', 'CNC Milling PN-101', 'cnc', 'running', 94.4, 'Building A / Line 1 / CNC Bay', -14, -5, 0],
  ['Pune Auto Components', 'CNC Turning PN-102', 'cnc', 'warning', 72.6, 'Building A / Line 1 / Turning Cell', -9, -5, 0],
  ['Pune Auto Components', 'Robotic Welding PN-201', 'robotic_welder', 'running', 90.1, 'Building A / Line 2 / Weld Cell', -3, -3, 0.4],
  ['Pune Auto Components', 'Paint Booth PN-301', 'paint_booth', 'running', 87.5, 'Building B / Finishing Line', 3, -4, 0],
  ['Pune Auto Components', 'AGV Fleet PN-401', 'agv_charger', 'running', 88.8, 'Building B / Material Flow', 9, -4, 0],
  ['Pune Auto Components', 'CMM Inspection PN-501', 'metrology', 'running', 96.9, 'Building C / Quality Lab', 13, 4, -0.2],
  ['Pune Auto Components', 'Conveyor Line PN-601', 'conveyor', 'running', 89.3, 'Building B / Final Conveyor', 1, 6, 0],
  ['Ahmedabad Process Textiles', 'Spinning AH-101', 'spinning', 'running', 84.2, 'Building A / Spinning Line', -14, -4, 0],
  ['Ahmedabad Process Textiles', 'Weaving AH-201', 'weaving', 'running', 82.8, 'Building A / Loom Line', -8, -4, 0],
  ['Ahmedabad Process Textiles', 'Dyeing Tank AH-301', 'dyeing_jigger', 'warning', 69.8, 'Building B / Dyeing Range', -2, -4, 0],
  ['Ahmedabad Process Textiles', 'Steam Boiler AH-401', 'boiler', 'running', 79.5, 'Utility Block / Boiler House', 5, -3, 0],
  ['Ahmedabad Process Textiles', 'Chemical Mixer AH-501', 'chemical_dosing', 'maintenance', 51.2, 'Building B / Chemical Skid', 11, -2, 0],
  ['Ahmedabad Process Textiles', 'Fabric Inspection AH-601', 'fabric_inspection', 'running', 88.3, 'Building C / Inspection', 2, 6, 0.15],
  ['Chennai Electronics Assembly', 'SMT Pick & Place CH-101', 'pick_place', 'warning', 74.1, 'Building A / SMT Line', -13, -3, 0],
  ['Chennai Electronics Assembly', 'AOI CH-201', 'aoi', 'running', 93.2, 'Building A / Inspection Bay', -7, -3, 0],
  ['Chennai Electronics Assembly', 'Reflow Oven CH-301', 'reflow_oven', 'running', 90.7, 'Building A / Thermal Process', -1, -3, 0],
  ['Chennai Electronics Assembly', 'PCB Conveyor CH-401', 'pcb_conveyor', 'running', 92.8, 'Building A / PCB Conveyor', 5, -3, 0],
  ['Chennai Electronics Assembly', 'Laser Marker CH-501', 'laser_marker', 'running', 89.9, 'Building B / Traceability', 11, -3, 0],
  ['Chennai Electronics Assembly', 'Functional Test Bench CH-601', 'test_bench', 'running', 91.5, 'Building B / Test Cell', 4, 6, 0],
  ['Bengaluru Precision Fab Lab', '5 Axis CNC BL-101', 'five_axis_cnc', 'running', 92.8, 'Building A / Micro Machining', -12, -4, 0],
  ['Bengaluru Precision Fab Lab', 'Laser Metrology BL-201', 'laser_metrology', 'running', 89.1, 'Building A / Metrology', -6, -4, 0],
  ['Bengaluru Precision Fab Lab', 'CMM BL-301', 'metrology', 'running', 97.2, 'Building A / CMM Lab', 0, -4, 0],
  ['Bengaluru Precision Fab Lab', 'R&D Cell BL-401', 'rd_cell', 'running', 85.4, 'Building B / R&D Cell', 6, -3, 0],
  ['Bengaluru Precision Fab Lab', 'Prototype Printer BL-501', 'additive_printer', 'warning', 67.4, 'Building B / Additive Cell', 12, -3, 0],
  ['Bengaluru Precision Fab Lab', 'Tool Calibration BL-601', 'tool_calibration', 'running', 94.6, 'Building C / Calibration', 0, 6, 0],
  ['Nagpur Central Logistics Hub', 'Automated Storage NG-101', 'asrs', 'running', 91.7, 'Warehouse A / ASRS Aisle', -12, -4, 0],
  ['Nagpur Central Logistics Hub', 'Barcode Station NG-201', 'barcode_station', 'running', 88.2, 'Warehouse A / Inbound QA', -4, -3, 0],
  ['Nagpur Central Logistics Hub', 'Packing Robots NG-301', 'packing_robot', 'warning', 73.8, 'Warehouse B / Packing Cell', 5, -4, 0],
  ['Nagpur Central Logistics Hub', 'Dispatch Conveyor NG-401', 'dispatch_conveyor', 'running', 88.8, 'Warehouse B / Dispatch Dock', 13, -4, 0],
];

const metricProfile = {
  cnc: [62, 2.2, 6, 3200, 28, 0],
  five_axis_cnc: [64, 1.8, 6, 18000, 32, 0],
  robotic_welder: [78, 3.4, 3, 120, 35, 0],
  paint_booth: [34, 1.0, 2, 120, 48, 18],
  conveyor: [42, 1.8, 1, 420, 12, 0],
  servo_press: [55, 2.4, 7, 80, 45, 0],
  metrology: [24, 0.4, 1, 20, 5, 0],
  spinning: [54, 2.7, 4, 1200, 42, 0],
  weaving: [48, 3.0, 3, 780, 38, 0],
  dyeing_jigger: [92, 2.8, 4, 90, 30, 110],
  boiler: [188, 2.1, 16, 80, 95, 120],
  stenter: [168, 3.1, 5, 60, 80, 0],
  chemical_dosing: [48, 6.4, 6, 1400, 18, 65],
  effluent_treatment: [38, 2.2, 3, 450, 22, 180],
  fabric_inspection: [30, 0.8, 1, 90, 8, 0],
  dryer: [142, 3.5, 2, 70, 75, 0],
  smt_line: [36, 1.1, 1, 600, 12, 0],
  aoi: [28, 0.5, 1, 40, 4, 0],
  pick_place: [42, 4.2, 2, 2200, 18, 0],
  reflow_oven: [245, 1.8, 1, 55, 65, 0],
  pcb_conveyor: [35, 1.0, 1, 360, 9, 0],
  laser_marker: [38, 0.7, 1, 120, 14, 0],
  test_bench: [32, 0.5, 1, 30, 10, 0],
  burn_in: [58, 1.2, 1, 10, 25, 0],
  micro_mill: [58, 1.4, 5, 42000, 12, 0],
  laser_cutter: [44, 0.8, 5, 100, 22, 0],
  laser_metrology: [25, 0.3, 1, 40, 7, 0],
  rd_cell: [36, 0.9, 1, 100, 18, 0],
  additive_printer: [72, 3.9, 2, 60, 16, 0],
  tool_calibration: [24, 0.2, 1, 20, 4, 0],
  vacuum_pump: [64, 2.6, 8, 1800, 15, 45],
  asrs: [39, 1.2, 1, 180, 14, 0],
  sorter: [44, 2.1, 1, 320, 16, 0],
  agv_charger: [56, 1.3, 1, 0, 40, 0],
  barcode_station: [31, 0.3, 1, 0, 3, 0],
  packing_robot: [45, 2.3, 1, 180, 12, 0],
  dock_leveler: [42, 1.9, 160, 20, 8, 0],
  dispatch_conveyor: [43, 1.7, 1, 320, 12, 0],
  packing_line: [38, 1.5, 1, 240, 10, 0],
};

async function main() {
  console.log('Seeding realistic Indian multi-plant scenario...');

  await prisma.machineSensor.deleteMany();
  await prisma.component.deleteMany();
  await prisma.inventoryPart.deleteMany();
  await prisma.maintenanceEvent.deleteMany();
  await prisma.sensorReading.deleteMany();
  await prisma.alarm.deleteMany();
  await prisma.workOrder.deleteMany();
  await prisma.machine.deleteMany();
  await prisma.productionLine.deleteMany();
  await prisma.building.deleteMany();
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
  const productionLines = new Map();
  for (const p of plantData) {
    const plant = await prisma.plant.create({ data: p });
    plants.set(plant.name, plant);

    const hierarchy = p.name.includes('Nagpur')
      ? { 'Warehouse A': ['Inbound QA', 'ASRS Aisle'], 'Warehouse B': ['Packing Cell', 'Dispatch Dock'] }
      : p.domain.includes('Automotive')
        ? { 'Building A': ['Line 1', 'Line 2'], 'Building B': ['Finishing Line', 'Material Flow'], 'Building C': ['Quality Lab'] }
        : p.domain.includes('Textile')
          ? { 'Building A': ['Spinning Line', 'Loom Line'], 'Building B': ['Dyeing Range', 'Chemical Skid'], 'Utility Block': ['Boiler House'], 'Building C': ['Inspection'] }
          : p.domain.includes('Electronics')
            ? { 'Building A': ['SMT Line', 'Inspection Bay', 'Thermal Process', 'PCB Conveyor'], 'Building B': ['Traceability', 'Test Cell'] }
            : { 'Building A': ['Micro Machining', 'Metrology', 'CMM Lab'], 'Building B': ['R&D Cell', 'Additive Cell'], 'Building C': ['Calibration'] };
    for (const [name, lines] of Object.entries(hierarchy)) {
      const building = await prisma.building.create({ data: { name, code: name.split(' ').map(x => x[0]).join(''), plantId: plant.id } });
      for (const lineName of lines) {
        const line = await prisma.productionLine.create({ data: { name: lineName, code: lineName.toUpperCase().replace(/[^A-Z0-9]+/g, '-'), buildingId: building.id } });
        productionLines.set(`${plant.name}:${name}:${lineName}`, line);
      }
    }
  }

  const machines = [];
  for (const [plantName, name, type, status, health, location, posX, posZ, rotation] of machineTemplates) {
    const lineName = location.split('/')[1]?.trim() || location.split('/')[0]?.trim();
    const buildingName = location.split('/')[0]?.trim();
    const line = productionLines.get(`${plantName}:${buildingName}:${lineName}`) ||
      Array.from(productionLines.entries()).find(([key]) => key.startsWith(`${plantName}:`))?.[1];
    const machine = await prisma.machine.create({
      data: {
        name, type, status, health, location, posX, posZ, rotation,
        serial: `YMT-${name.replace(/[^A-Z0-9]/gi, '').slice(-8).toUpperCase()}-${Math.floor(1000 + Math.random() * 8999)}`,
        manufacturer: type.includes('cnc') ? 'Jyoti CNC Automation' : type.includes('boiler') ? 'Thermax' : type.includes('smt') || type.includes('pick') ? 'ASMPT India' : type.includes('robot') || type.includes('welder') ? 'Fanuc India' : 'Yantra Manufacturing Technologies',
        installationDate: new Date(2020 + Math.floor(Math.random() * 5), Math.floor(Math.random() * 12), 15),
        criticality: health < 75 ? 'high' : health > 92 ? 'medium' : 'medium',
        oee: Math.max(45, Math.min(99, health - 4 + Math.random() * 5)),
        failureProbability: Math.max(2, Math.min(88, 104 - health + Math.random() * 8)),
        remainingUsefulLife: Math.max(12, Math.round(health * 18)),
        bearing: health < 75 ? 'elevated vibration' : 'normal',
        lubrication: health < 75 ? 'inspection due' : 'within interval',
        aiSummary: `${name} is ${status}; primary risk is ${health < 75 ? 'fault escalation and downtime' : 'normal degradation under production load'}.`,
        productionLineId: line?.id,
        plantId: plants.get(plantName).id,
      }
    });
    machines.push(machine);
  }

  const metrics = ['temperature', 'vibration', 'pressure', 'rpm', 'power', 'flow_rate'];
  const units = ['C', 'mm/s', 'bar', 'RPM', 'kW', 'L/min'];
  const componentRows = [];
  const sensorRows = [];
  const inventoryRows = [];
  const maintenanceRows = [];
  for (const machine of machines) {
    const componentNames = machine.type.includes('cnc') || machine.type.includes('mill')
      ? ['Spindle', 'Servo Drive', 'Coolant Loop']
      : machine.type.includes('boiler') || machine.type.includes('dye') || machine.type.includes('chemical')
        ? ['Pump Train', 'Control Valve', 'Heat Exchanger']
        : machine.type.includes('conveyor') || machine.type.includes('asrs')
          ? ['Drive Motor', 'Belt Section', 'Photo Eye']
          : ['Main Drive', 'Control Cabinet', 'Safety Interlock'];
    for (const componentName of componentNames) {
      componentRows.push({
        name: componentName,
        type: componentName.toLowerCase().replace(/\s+/g, '_'),
        health: Math.max(35, Math.min(100, machine.health + (Math.random() - 0.5) * 12)),
        machineId: machine.id,
      });
    }
    for (let i = 0; i < metrics.length; i++) {
      sensorRows.push({
        tag: `${machine.name.split(' ')[0].toUpperCase()}-${metrics[i].toUpperCase()}-${i + 1}`,
        metric: metrics[i],
        unit: units[i],
        status: machine.status === 'running' ? 'normal' : i < 2 ? 'alarm' : 'normal',
        machineId: machine.id,
      });
    }
    inventoryRows.push(
      { machineId: machine.id, sku: `${machine.type.toUpperCase()}-BRG-01`, name: 'Bearing kit', quantity: machine.health < 75 ? 1 : 4, reorderAt: 2 },
      { machineId: machine.id, sku: `${machine.type.toUpperCase()}-FLT-02`, name: 'Filter and seal set', quantity: 6, reorderAt: 3 },
    );
    maintenanceRows.push(
      { machineId: machine.id, title: 'Quarterly inspection', notes: 'Baseline inspection and calibration check completed.', performedBy: 'Farhan Shaikh', performedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 42) },
      { machineId: machine.id, title: machine.health < 75 ? 'Fault investigation opened' : 'Lubrication service', notes: machine.health < 75 ? 'AI flagged rising risk trend.' : 'Lubrication interval completed inside tolerance.', performedBy: machine.health < 75 ? 'Meera Nair' : 'Arjun Menon', performedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8) },
    );

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
  await prisma.component.createMany({ data: componentRows });
  await prisma.machineSensor.createMany({ data: sensorRows });
  await prisma.inventoryPart.createMany({ data: inventoryRows });
  await prisma.maintenanceEvent.createMany({ data: maintenanceRows });

  const byName = Object.fromEntries(machines.map(m => [m.name, m]));
  await prisma.alarm.createMany({
    data: [
      { machineId: byName['CNC Turning PN-102'].id, severity: 'critical', title: 'Spindle thermal drift', message: 'Pune CNC Turning spindle bearing temperature rising above compensated tolerance.', status: 'active' },
      { machineId: byName['Chemical Mixer AH-501'].id, severity: 'critical', title: 'Caustic dosing pump vibration', message: 'Ahmedabad chemical mixer shows cavitation and flow instability.', status: 'active' },
      { machineId: byName['SMT Pick & Place CH-101'].id, severity: 'warning', title: 'Nozzle placement rejects', message: 'Chennai pick-and-place nozzle bank B has elevated reject rate.', status: 'active' },
      { machineId: byName['Prototype Printer BL-501'].id, severity: 'warning', title: 'Build chamber humidity drift', message: 'Bengaluru prototype printer chamber humidity is outside micro-fab control band.', status: 'active' },
      { machineId: byName['Packing Robots NG-301'].id, severity: 'warning', title: 'Robot gripper vacuum instability', message: 'Nagpur packing robot gripper circuit is losing vacuum under peak dispatch load.', status: 'active' },
      { machineId: byName['Dyeing Tank AH-301'].id, severity: 'warning', title: 'Dye bath temperature oscillation', message: 'Dyeing tank PID loop is overshooting during shade-change cycle.', status: 'active' },
      { machineId: byName['Functional Test Bench CH-601'].id, severity: 'info', title: 'Probe calibration due', message: 'Functional test fixture calibration due within 36 hours.', status: 'active' },
      { machineId: byName['CMM BL-301'].id, severity: 'info', title: 'Probe verification complete', message: 'Metrology probe verification completed successfully.', status: 'resolved', resolvedAt: new Date() },
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
      { title: 'Inspect CNC Turning spindle pack', description: 'Thermal drift and vibration trend require immediate mechanical inspection.', status: 'in_progress', priority: 'critical', machineId: byName['CNC Turning PN-102'].id, assignedTo: 'Farhan Shaikh', createdBy: users[0].id, dueDate: '2026-07-12' },
      { title: 'Flush Chemical Mixer suction strainer', description: 'Chemical mixer cavitation detected during shade-change cycle.', status: 'open', priority: 'critical', machineId: byName['Chemical Mixer AH-501'].id, assignedTo: 'Meera Nair', createdBy: users[3].id, dueDate: '2026-07-12' },
      { title: 'Replace SMT nozzle bank B', description: 'Elevated placement rejects during electronics assembly run.', status: 'open', priority: 'high', machineId: byName['SMT Pick & Place CH-101'].id, assignedTo: 'Arjun Menon', createdBy: users[4].id, dueDate: '2026-07-13' },
      { title: 'Service Prototype Printer dryer cartridge', description: 'Humidity drift affecting additive build chamber.', status: 'open', priority: 'high', machineId: byName['Prototype Printer BL-501'].id, assignedTo: 'Kavya Iyer', createdBy: users[2].id, dueDate: '2026-07-14' },
      { title: 'Inspect Packing Robot vacuum gripper', description: 'Vacuum instability throttling packing throughput.', status: 'open', priority: 'medium', machineId: byName['Packing Robots NG-301'].id, assignedTo: 'Rohan Mehta', createdBy: users[5].id, dueDate: '2026-07-16' },
      { title: 'Functional Test Bench probe calibration', description: 'Preventive fixture calibration for electronics run.', status: 'completed', priority: 'medium', machineId: byName['Functional Test Bench CH-601'].id, assignedTo: 'Arjun Menon', createdBy: users[4].id, dueDate: '2026-07-10' },
    ]
  });

  console.log('Seeding complete!');
  console.log(`  ${await prisma.user.count()} users`);
  console.log(`  ${await prisma.plant.count()} Indian facilities`);
  console.log(`  ${await prisma.building.count()} buildings`);
  console.log(`  ${await prisma.productionLine.count()} production lines`);
  console.log(`  ${await prisma.machine.count()} domain-specific machines`);
  console.log(`  ${await prisma.component.count()} components`);
  console.log(`  ${await prisma.machineSensor.count()} sensors`);
  console.log(`  ${await prisma.inventoryPart.count()} inventory parts`);
  console.log(`  ${await prisma.maintenanceEvent.count()} maintenance history events`);
  console.log(`  ${await prisma.sensorReading.count()} sensor readings`);
  console.log(`  ${await prisma.alarm.count()} alarms`);
  console.log(`  ${await prisma.agent.count()} agents`);
  console.log(`  ${await prisma.plan.count()} plans`);
  console.log(`  ${await prisma.workOrder.count()} work orders`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
