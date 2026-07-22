const workOrders = [];
let woCounter = 5000;

function createAdapter() {
  return {
    type: 'CMMS',
    system: 'IBM Maximo',
    name: 'maximo',

    authenticate: async (credentials = {}) => {
      if (!credentials.baseUrl) throw new Error('Maximo baseUrl required');
      return { authenticated: true, system: 'IBM Maximo', token: `max-token-${Date.now()}`, baseUrl: credentials.baseUrl };
    },

    createWorkOrder: async (order) => {
      const wo = {
        wonum: `MX-${++woCounter}`,
        ...order,
        system: 'IBM Maximo',
        status: 'WAPPR',
        created: new Date().toISOString(),
        synced: null
      };
      workOrders.push(wo);
      return wo;
    },

    getWorkOrder: async (wonum) => {
      return workOrders.find(w => w.wonum === wonum) || null;
    },

    updateWorkOrderStatus: async (wonum, status) => {
      const wo = workOrders.find(w => w.wonum === wonum);
      if (!wo) throw new Error(`Maximo work order ${wonum} not found`);
      wo.status = status;
      wo.updated = new Date().toISOString();
      return wo;
    },

    completeWorkOrder: async (wonum, actualCost, actualHours) => {
      const wo = workOrders.find(w => w.wonum === wonum);
      if (!wo) throw new Error(`Maximo work order ${wonum} not found`);
      wo.status = 'COMPLETE';
      wo.actualCost = actualCost;
      wo.actualHours = actualHours;
      wo.completed = new Date().toISOString();
      return wo;
    },

    syncAssets: async (lastSync) => {
      return {
        syncedCount: 8,
        assets: [
          { assetnum: 'ASSET-001', description: 'VMC Machine', location: 'Pune', status: 'OPERATING' },
          { assetnum: 'ASSET-002', description: 'EDM Machine', location: 'Ahmedabad', status: 'OPERATING' },
          { assetnum: 'ASSET-003', description: 'CMM', location: 'Chennai', status: 'DOWN' },
          { assetnum: 'ASSET-004', description: 'Lathe', location: 'Bengaluru', status: 'OPERATING' },
          { assetnum: 'ASSET-005', description: 'Welding Robot', location: 'Nagpur', status: 'OPERATING' },
          { assetnum: 'ASSET-006', description: 'Cooling Tower', location: 'Pune', status: 'UNDER_REPAIR' },
          { assetnum: 'ASSET-007', description: 'Air Compressor', location: 'Ahmedabad', status: 'OPERATING' },
          { assetnum: 'ASSET-008', description: 'Transformer', location: 'Chennai', status: 'OPERATING' }
        ],
        lastSync: new Date().toISOString()
      };
    },

    syncPMPrograms: async () => {
      return {
        syncedCount: 4,
        programs: [
          { pmnum: 'PM-001', description: 'Weekly Lubrication', frequency: 7, unit: 'DAYS', asset: 'ASSET-001' },
          { pmnum: 'PM-002', description: 'Monthly Inspection', frequency: 30, unit: 'DAYS', asset: 'ASSET-002' },
          { pmnum: 'PM-003', description: 'Quarterly Overhaul', frequency: 90, unit: 'DAYS', asset: 'ASSET-003' },
          { pmnum: 'PM-004', description: 'Annual Certification', frequency: 365, unit: 'DAYS', asset: 'ASSET-004' }
        ],
        lastSync: new Date().toISOString()
      };
    },

    getStatus: () => ({
      system: 'IBM Maximo',
      connected: true,
      workOrderCount: workOrders.length,
      lastSync: workOrders.length > 0 ? workOrders[workOrders.length - 1].synced : null
    })
  };
}

module.exports = { createAdapter };
