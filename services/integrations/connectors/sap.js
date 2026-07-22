const workOrders = [];
let woCounter = 3000;

function createAdapter() {
  return {
    type: 'ERP',
    system: 'SAP PM',
    name: 'sap',

    authenticate: async (credentials = {}) => {
      if (!credentials.baseUrl) throw new Error('SAP baseUrl required');
      return { authenticated: true, system: 'SAP PM', sessionId: `sap-sess-${Date.now()}`, baseUrl: credentials.baseUrl };
    },

    createWorkOrder: async (order) => {
      const wo = {
        id: `WO-${++woCounter}`,
        ...order,
        system: 'SAP PM',
        status: 'CREATED',
        createdAt: new Date().toISOString(),
        syncedAt: null
      };
      workOrders.push(wo);
      return wo;
    },

    getWorkOrder: async (woId) => {
      return workOrders.find(w => w.id === woId) || null;
    },

    updateWorkOrder: async (woId, updates) => {
      const wo = workOrders.find(w => w.id === woId);
      if (!wo) throw new Error(`SAP work order ${woId} not found`);
      Object.assign(wo, updates, { updatedAt: new Date().toISOString() });
      return wo;
    },

    closeWorkOrder: async (woId, completionNotes) => {
      const wo = workOrders.find(w => w.id === woId);
      if (!wo) throw new Error(`SAP work order ${woId} not found`);
      wo.status = 'CLOSED';
      wo.completionNotes = completionNotes;
      wo.closedAt = new Date().toISOString();
      return wo;
    },

    syncWorkOrders: async (lastSync) => {
      const filtered = lastSync
        ? workOrders.filter(w => !w.syncedAt || new Date(w.syncedAt) > new Date(lastSync))
        : workOrders;
      filtered.forEach(w => { w.syncedAt = new Date().toISOString(); });
      return { syncedCount: filtered.length, workOrders: filtered, lastSync: new Date().toISOString() };
    },

    getEquipmentList: async () => {
      return [
        { equipmentId: 'EQ-1001', description: 'CNC Milling Machine', plant: 'Pune', status: 'OPERATIONAL' },
        { equipmentId: 'EQ-1002', description: 'Hydraulic Press', plant: 'Ahmedabad', status: 'MAINTENANCE' },
        { equipmentId: 'EQ-1003', description: 'Conveyor Belt', plant: 'Chennai', status: 'OPERATIONAL' },
        { equipmentId: 'EQ-1004', description: 'Industrial Robot', plant: 'Bengaluru', status: 'OPERATIONAL' },
        { equipmentId: 'EQ-1005', description: 'Compressor Unit', plant: 'Nagpur', status: 'SHUTDOWN' }
      ];
    },

    getStatus: () => ({
      system: 'SAP PM',
      connected: true,
      workOrderCount: workOrders.length,
      lastSync: workOrders.length > 0 ? workOrders[workOrders.length - 1].syncedAt : null
    })
  };
}

module.exports = { createAdapter };
