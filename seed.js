const prisma = require('./lib/prisma');
const bcrypt = require('bcryptjs');

async function main() {
  console.log('Seeding database...');

  await prisma.sensorReading.deleteMany();
  await prisma.alarm.deleteMany();
  await prisma.workOrder.deleteMany();
  await prisma.machine.deleteMany();
  await prisma.plant.deleteMany();
  await prisma.agent.deleteMany();
  await prisma.plan.deleteMany();
  await prisma.user.deleteMany();

  const hashedPassword = await bcrypt.hash('password123', 10);

  const user = await prisma.user.create({
    data: {
      email: 'admin@yantramitra.com',
      password: hashedPassword,
      name: 'Admin User',
      role: 'admin',
    }
  });

  await prisma.user.create({
    data: {
      email: 'operator@yantramitra.com',
      password: hashedPassword,
      name: 'Operator One',
      role: 'operator',
    }
  });

  const plants = [];
  const plantData = [
    { name: 'Detroit Auto Assembly', location: 'Detroit, MI, USA', status: 'operational', lat: 42.3314, lng: -83.0458 },
    { name: 'Mumbai Heavy Industries', location: 'Mumbai, MH, India', status: 'operational', lat: 19.0760, lng: 72.8777 },
    { name: 'Berlin Precision Manufacturing', location: 'Berlin, Germany', status: 'operational', lat: 52.5200, lng: 13.4050 },
    { name: 'Singapore Electronics Hub', location: 'Singapore', status: 'operational', lat: 1.3521, lng: 103.8198 },
    { name: 'Sao Paulo Processing Plant', location: 'Sao Paulo, Brazil', status: 'maintenance', lat: -23.5505, lng: -46.6333 },
  ];

  for (const p of plantData) {
    const plant = await prisma.plant.create({ data: p });
    plants.push(plant);
  }

  const machineTemplates = [
    { name: 'CNC-101', type: 'cnc', status: 'running', health: 94.2, plantIdx: 0 },
    { name: 'CNC-102', type: 'cnc', status: 'running', health: 97.8, plantIdx: 0 },
    { name: 'CNC-103', type: 'cnc', status: 'warning', health: 72.5, plantIdx: 0 },
    { name: 'Pump P-101', type: 'pump', status: 'running', health: 99.1, plantIdx: 1 },
    { name: 'Pump P-102', type: 'pump', status: 'maintenance', health: 45.3, plantIdx: 1 },
    { name: 'Conveyor C-201', type: 'conveyor', status: 'running', health: 88.7, plantIdx: 2 },
    { name: 'Robot Arm R-301', type: 'robot', status: 'running', health: 91.5, plantIdx: 0 },
    { name: 'Turbine T-401', type: 'turbine', status: 'running', health: 96.3, plantIdx: 3 },
    { name: 'Compressor K-501', type: 'compressor', status: 'warning', health: 68.9, plantIdx: 1 },
    { name: 'Boiler B-601', type: 'boiler', status: 'running', health: 93.4, plantIdx: 4 },
    { name: 'Mixer M-701', type: 'mixer', status: 'running', health: 87.2, plantIdx: 4 },
    { name: 'Press P-801', type: 'press', status: 'idle', health: 100.0, plantIdx: 0 },
    { name: 'Welder W-901', type: 'welder', status: 'running', health: 82.1, plantIdx: 2 },
    { name: 'Labeler L-111', type: 'labeler', status: 'running', health: 95.0, plantIdx: 3 },
    { name: 'Sorter S-222', type: 'sorter', status: 'maintenance', health: 52.8, plantIdx: 3 },
    { name: 'Drill D-333', type: 'drill', status: 'running', health: 90.3, plantIdx: 2 },
  ];

  const machines = [];
  for (const mt of machineTemplates) {
    const machine = await prisma.machine.create({
      data: {
        name: mt.name,
        type: mt.type,
        status: mt.status,
        health: mt.health,
        plantId: plants[mt.plantIdx].id,
        location: `${mt.name} area`,
      }
    });
    machines.push(machine);
  }

  const metrics = ['temperature', 'vibration', 'pressure', 'rpm', 'power', 'flow_rate'];
  const units = { temperature: '°C', vibration: 'mm/s', pressure: 'bar', rpm: 'RPM', power: 'kW', flow_rate: 'L/min' };
  const baseValues = {
    temperature: { cnc: 65, pump: 80, conveyor: 45, robot: 55, turbine: 400, compressor: 120, boiler: 250, mixer: 70, press: 50, welder: 90, labeler: 40, sorter: 38, drill: 60 },
    vibration: { cnc: 2.5, pump: 4.2, conveyor: 1.8, robot: 3.1, turbine: 6.5, compressor: 5.2, boiler: 3.8, mixer: 2.9, press: 2.1, welder: 3.5, labeler: 1.2, sorter: 1.5, drill: 4.0 },
    pressure: { cnc: 6.0, pump: 10.0, conveyor: 2.0, robot: 4.0, turbine: 30.0, compressor: 8.0, boiler: 15.0, mixer: 5.0, press: 7.0, welder: 3.0, labeler: 1.5, sorter: 1.0, drill: 5.0 },
    rpm: { cnc: 3000, pump: 1800, conveyor: 600, robot: 120, turbine: 3600, compressor: 1400, boiler: 200, mixer: 400, press: 100, welder: 50, labeler: 200, sorter: 300, drill: 2500 },
    power: { cnc: 25, pump: 55, conveyor: 12, robot: 18, turbine: 500, compressor: 90, boiler: 200, mixer: 35, press: 40, welder: 30, labeler: 5, sorter: 8, drill: 20 },
    flow_rate: { cnc: 0, pump: 120, conveyor: 0, robot: 0, turbine: 0, compressor: 80, boiler: 60, mixer: 45, press: 0, welder: 0, labeler: 0, sorter: 0, drill: 0 },
  };

  for (const machine of machines) {
    const readingsBatch = [];
    for (let hour = 0; hour < 168; hour++) {
      for (const metric of metrics) {
        const base = baseValues[metric][machine.type] || 50;
        const variation = (Math.random() - 0.5) * base * 0.2;
        const value = base + variation;
        readingsBatch.push({
          machineId: machine.id,
          metric,
          value: Math.round(value * 100) / 100,
          unit: units[metric],
          timestamp: new Date(Date.now() - (168 - hour) * 3600000),
        });
      }
    }
    await prisma.sensorReading.createMany({ data: readingsBatch });
  }

  await prisma.alarm.createMany({
    data: [
      { machineId: machines[2].id, severity: 'critical', title: 'Spindle Overheating', message: 'CNC-103 spindle temperature exceeds threshold', status: 'active' },
      { machineId: machines[4].id, severity: 'critical', title: 'Pump Cavitation Detected', message: 'Pump P-102 showing cavitation patterns', status: 'active' },
      { machineId: machines[8].id, severity: 'warning', title: 'Compressor Pressure Drop', message: 'Compressor K-501 pressure dropped 15%', status: 'active' },
      { machineId: machines[2].id, severity: 'warning', title: 'Vibration Anomaly', message: 'Unusual vibration pattern on CNC-103', status: 'active' },
      { machineId: machines[14].id, severity: 'warning', title: 'Sorter Misfeed Rate High', message: 'Sorter S-222 misfeed rate above threshold', status: 'active' },
      { machineId: machines[5].id, severity: 'info', title: 'Conveyor Belt Wear', message: 'Conveyor C-201 belt wear at 72%', status: 'active' },
      { machineId: machines[4].id, severity: 'critical', title: 'Bearing Failure Imminent', message: 'Pump P-102 bearing temperature critical', status: 'active' },
      { machineId: machines[0].id, severity: 'info', title: 'Routine Maintenance Due', message: 'CNC-101 scheduled maintenance in 48h', status: 'active' },
    ]
  });

  await prisma.agent.createMany({
    data: [
      { name: 'Sentinel', type: 'monitoring', status: 'active', model: 'Sentinel-X1', mission: 'Real-time threat detection across all plants', progress: 100 },
      { name: 'Diagnostic', type: 'analysis', status: 'active', model: 'Diagnostic-D2', mission: 'Root cause analysis of CNC-103 anomaly', progress: 67 },
      { name: 'Planner', type: 'planning', status: 'idle', model: 'Planner-P3', mission: 'Optimize Q4 maintenance schedule', progress: 34 },
      { name: 'Monitor', type: 'monitoring', status: 'active', model: 'Monitor-M1', mission: 'Watch Detroit plant floor round-the-clock', progress: 89 },
      { name: 'Optimizer', type: 'optimization', status: 'active', model: 'Optimizer-O2', mission: 'Reduce energy consumption by 15%', progress: 72 },
      { name: 'Inspector', type: 'inspection', status: 'idle', model: 'Inspector-I1', mission: 'Quality check batch B-2024-Q3', progress: 100 },
    ]
  });

  await prisma.plan.createMany({
    data: [
      { title: 'Q4 Maintenance Overhaul', description: 'Complete overhaul of all CNC machines in Detroit plant', type: 'maintenance', status: 'pending', priority: 'high', createdBy: user.id, plantId: plants[0].id },
      { title: 'Pump P-102 Replacement', description: 'Replace Pump P-102 at Mumbai plant with new high-efficiency model', type: 'replacement', status: 'pending', priority: 'critical', createdBy: user.id, plantId: plants[1].id },
      { title: 'Energy Efficiency Program', description: 'Implement energy-saving protocols across Berlin facility', type: 'optimization', status: 'approved', priority: 'medium', createdBy: user.id, approvedBy: user.id, approvedAt: new Date(), plantId: plants[2].id },
      { title: 'Sensor Network Upgrade', description: 'Upgrade all vibration sensors to newest model', type: 'upgrade', status: 'pending', priority: 'low', createdBy: user.id, plantId: plants[3].id },
      { title: 'Safety Training Module', description: 'Mandatory safety training for all operators', type: 'training', status: 'approved', priority: 'high', createdBy: user.id, approvedBy: user.id, approvedAt: new Date(), plantId: plants[4].id },
      { title: 'Conveyor Belt Replacement', description: 'Replace aging conveyor belts on Line 2', type: 'maintenance', status: 'rejected', priority: 'medium', createdBy: user.id, plantId: plants[2].id },
    ]
  });

  await prisma.workOrder.createMany({
    data: [
      { title: 'CNC-103 Emergency Repair', description: 'Spindle overheating requires immediate inspection', status: 'in_progress', priority: 'critical', machineId: machines[2].id, assignedTo: 'Mike Chen', createdBy: user.id, dueDate: '2026-07-14' },
      { title: 'Pump P-102 Seal Replacement', description: 'Replace worn seals on Pump P-102', status: 'open', priority: 'critical', machineId: machines[4].id, assignedTo: 'Sarah Patel', createdBy: user.id, dueDate: '2026-07-13' },
      { title: 'Compressor K-501 Filter Change', description: 'Replace air intake filters', status: 'open', priority: 'high', machineId: machines[8].id, assignedTo: 'Hans Mueller', createdBy: user.id, dueDate: '2026-07-15' },
      { title: 'Routine Lubrication - Detroit', description: 'Monthly lubrication of all CNC machines', status: 'completed', priority: 'medium', machineId: machines[0].id, assignedTo: 'Mike Chen', createdBy: user.id, dueDate: '2026-07-10' },
      { title: 'Conveyor Belt Tensioning', description: 'Adjust tension on Conveyor C-201', status: 'open', priority: 'medium', machineId: machines[5].id, assignedTo: 'Klaus Weber', createdBy: user.id, dueDate: '2026-07-16' },
      { title: 'Sorter Calibration', description: 'Recalibrate Sorter S-222 after maintenance', status: 'open', priority: 'high', machineId: machines[14].id, assignedTo: 'Wei Zhang', createdBy: user.id, dueDate: '2026-07-12' },
      { title: 'Turbine Blade Inspection', description: 'Annual inspection of Turbine T-401 blades', status: 'open', priority: 'medium', machineId: machines[7].id, assignedTo: 'Ana Silva', createdBy: user.id, dueDate: '2026-07-30' },
      { title: 'Boiler Pressure Test', description: 'Weekly pressure safety test', status: 'completed', priority: 'high', machineId: machines[9].id, assignedTo: 'Carlos Oliveira', createdBy: user.id, dueDate: '2026-07-11' },
    ]
  });

  console.log('Seeding complete!');
  console.log(`  ${await prisma.user.count()} users`);
  console.log(`  ${await prisma.plant.count()} plants`);
  console.log(`  ${await prisma.machine.count()} machines`);
  console.log(`  ${await prisma.sensorReading.count()} sensor readings`);
  console.log(`  ${await prisma.alarm.count()} alarms`);
  console.log(`  ${await prisma.agent.count()} agents`);
  console.log(`  ${await prisma.plan.count()} plans`);
  console.log(`  ${await prisma.workOrder.count()} work orders`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
