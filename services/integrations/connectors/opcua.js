const subscriptions = new Map();
let nodeIdCounter = 1000;

function generateNodeId() {
  return `ns=2;i=${++nodeIdCounter}`;
}

function createConnector() {
  const state = {
    connected: false,
    endpoint: null,
    lastRead: null,
    browseCache: [],
    subscribeCallbacks: new Map()
  };

  return {
    type: 'OPC-UA',
    name: 'opcua',

    connect: (endpoint) => {
      state.endpoint = endpoint;
      state.connected = true;
      state.browseCache = [
        { nodeId: 'ns=2;i=1001', displayName: 'Temperature', dataType: 'Float', value: 72.3 },
        { nodeId: 'ns=2;i=1002', displayName: 'Pressure', dataType: 'Float', value: 101.2 },
        { nodeId: 'ns=2;i=1003', displayName: 'Vibration', dataType: 'Float', value: 0.04 },
        { nodeId: 'ns=2;i=1004', displayName: 'MotorSpeed', dataType: 'Int16', value: 1450 },
        { nodeId: 'ns=2;i=1005', displayName: 'PowerConsumption', dataType: 'Float', value: 12.7 }
      ];
      return { connected: true, endpoint, nodesAvailable: state.browseCache.length };
    },

    disconnect: () => {
      state.connected = false;
      state.browseCache = [];
      state.subscribeCallbacks.clear();
      return { connected: false };
    },

    isConnected: () => state.connected,

    readNode: (nodeId) => {
      if (!state.connected) throw new Error('OPC-UA not connected');
      state.lastRead = new Date().toISOString();
      const node = state.browseCache.find(n => n.nodeId === nodeId);
      if (!node) throw new Error(`Node ${nodeId} not found`);
      const simulatedValue = node.value * (0.95 + Math.random() * 0.1);
      return { nodeId, displayName: node.displayName, value: Math.round(simulatedValue * 100) / 100, dataType: node.dataType, timestamp: state.lastRead };
    },

    browseNodes: () => {
      if (!state.connected) throw new Error('OPC-UA not connected');
      return state.browseCache.map(n => ({ nodeId: n.nodeId, displayName: n.displayName, dataType: n.dataType }));
    },

    subscribe: (nodeId, callback, intervalMs = 5000) => {
      if (!state.connected) throw new Error('OPC-UA not connected');
      const node = state.browseCache.find(n => n.nodeId === nodeId);
      if (!node) throw new Error(`Node ${nodeId} not found for subscription`);
      const subId = `sub-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      state.subscribeCallbacks.set(subId, { nodeId, callback, intervalMs, node });
      subscriptions.set(subId, { nodeId, callback, intervalMs, node });
      return { subscriptionId: subId, nodeId, intervalMs };
    },

    unsubscribe: (subId) => {
      state.subscribeCallbacks.delete(subId);
      subscriptions.delete(subId);
      return { unsubscribed: true, subscriptionId: subId };
    },

    getStatus: () => ({
      connected: state.connected,
      endpoint: state.endpoint,
      lastRead: state.lastRead,
      activeSubscriptions: state.subscribeCallbacks.size,
      browsedNodes: state.browseCache.length
    })
  };
}

module.exports = { createConnector };
