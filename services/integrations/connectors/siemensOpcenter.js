const workOrders = [];
let woCounter = 7000;

function createAdapter() {
  return {
    type: 'MES',
    system: 'Siemens Opcenter',
    name: 'siemensOpcenter',

    authenticate: async (credentials = {}) => {
      if (!credentials.baseUrl) throw new Error('Opcenter baseUrl required');
      return { authenticated: true, system: 'Siemens Opcenter', token: `opc-token-${Date.now()}`, baseUrl: credentials.baseUrl };
    },

    createProductionOrder: async (order) => {
      const po = {
        id: `PO-${++woCounter}`,
        ...order,
        system: 'Siemens Opcenter',
        status: 'RELEASED',
        createdAt: new Date().toISOString(),
        syncedAt: null
      };
      workOrders.push(po);
      return po;
    },

    getProductionOrder: async (orderId) => {
      return workOrders.find(w => w.id === orderId) || null;
    },

    updateProductionOrderStatus: async (orderId, status) => {
      const po = workOrders.find(w => w.id === orderId);
      if (!po) throw new Error(`Opcenter order ${orderId} not found`);
      po.status = status;
      po.updatedAt = new Date().toISOString();
      return po;
    },

    reportProduction: async (orderId, goodCount, rejectCount, downtimeMinutes) => {
      const po = workOrders.find(w => w.id === orderId);
      if (!po) throw new Error(`Opcenter order ${orderId} not found`);
      po.goodCount = goodCount;
      po.rejectCount = rejectCount;
      po.downtimeMinutes = downtimeMinutes;
      po.reportedAt = new Date().toISOString();
      po.yield = Math.round((goodCount / (goodCount + rejectCount)) * 10000) / 100;
      return po;
    },

    syncProductionSchedule: async (lastSync) => {
      return {
        syncedCount: 6,
        schedule: [
          { orderId: 'PO-7001', product: 'Shaft Assembly', quantity: 500, dueDate: '2026-08-15', line: 'Line-A', priority: 'HIGH' },
          { orderId: 'PO-7002', product: 'Gear Housing', quantity: 300, dueDate: '2026-08-20', line: 'Line-B', priority: 'MEDIUM' },
          { orderId: 'PO-7003', product: 'Motor Base', quantity: 200, dueDate: '2026-08-25', line: 'Line-A', priority: 'LOW' },
          { orderId: 'PO-7004', product: 'Pump Casing', quantity: 150, dueDate: '2026-09-01', line: 'Line-C', priority: 'HIGH' },
          { orderId: 'PO-7005', product: 'Valve Body', quantity: 1000, dueDate: '2026-09-05', line: 'Line-B', priority: 'MEDIUM' },
          { orderId: 'PO-7006', product: 'Flange Kit', quantity: 800, dueDate: '2026-09-10', line: 'Line-C', priority: 'LOW' }
        ],
        lastSync: new Date().toISOString()
      };
    },

    getQualityMetrics: async () => {
      return {
        overallYield: 97.2,
        defectRate: 2.8,
        topDefects: [
          { defect: 'Surface Scratch', count: 45, percentage: 1.5 },
          { defect: 'Dimension Out-of-Tolerance', count: 22, percentage: 0.7 },
          { defect: 'Material Inclusion', count: 18, percentage: 0.6 }
        ],
        measuredAt: new Date().toISOString()
      };
    },

    getStatus: () => ({
      system: 'Siemens Opcenter',
      connected: true,
      productionOrderCount: workOrders.length,
      lastSync: workOrders.length > 0 ? workOrders[workOrders.length - 1].syncedAt : null
    })
  };
}

module.exports = { createAdapter };
