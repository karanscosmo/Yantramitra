let brokerState = {
  connected: false,
  host: null,
  port: null,
  clientId: null,
  reconnectAttempts: 0,
  maxReconnectAttempts: 10,
  subscriptions: new Map(),
  publishedCount: 0,
  receivedCount: 0
};

function createConnector() {
  return {
    type: 'MQTT',
    name: 'mqtt',

    connect: (config = {}) => {
      brokerState.host = config.host || 'localhost';
      brokerState.port = config.port || 1883;
      brokerState.clientId = config.clientId || `ym-${Date.now()}`;
      brokerState.maxReconnectAttempts = config.maxReconnectAttempts || 10;
      brokerState.connected = true;
      brokerState.reconnectAttempts = 0;
      return { connected: true, host: brokerState.host, port: brokerState.port, clientId: brokerState.clientId };
    },

    disconnect: () => {
      brokerState.connected = false;
      brokerState.subscriptions.clear();
      return { connected: false };
    },

    isConnected: () => brokerState.connected,

    publish: (topic, payload, qos = 0) => {
      if (!brokerState.connected) throw new Error('MQTT not connected');
      brokerState.publishedCount++;
      const messageId = `pub-${Date.now()}-${brokerState.publishedCount}`;
      const simulatedDelivered = Math.random() > 0.05;
      return {
        messageId,
        topic,
        payload: typeof payload === 'string' ? payload : JSON.stringify(payload),
        qos,
        delivered: simulatedDelivered,
        publishedAt: new Date().toISOString()
      };
    },

    subscribe: (topic, qos = 0) => {
      if (!brokerState.connected) throw new Error('MQTT not connected');
      const subId = `sub-${topic.replace(/[/+#]/g, '_')}-${Date.now()}`;
      const entry = { subId, topic, qos, createdAt: new Date().toISOString() };
      brokerState.subscriptions.set(subId, entry);
      return { subscriptionId: subId, topic, qos };
    },

    unsubscribe: (subId) => {
      brokerState.subscriptions.delete(subId);
      return { unsubscribed: true, subscriptionId: subId };
    },

    getSubscriptions: () => Array.from(brokerState.subscriptions.values()),

    reconnect: () => {
      if (brokerState.reconnectAttempts >= brokerState.maxReconnectAttempts) {
        return { reconnected: false, error: 'Max reconnect attempts exceeded' };
      }
      brokerState.reconnectAttempts++;
      brokerState.connected = true;
      return { reconnected: true, attempt: brokerState.reconnectAttempts };
    },

    simulateMessage: (topic, payload) => {
      brokerState.receivedCount++;
      return { topic, payload, receivedAt: new Date().toISOString(), totalReceived: brokerState.receivedCount };
    },

    getStatus: () => ({
      connected: brokerState.connected,
      host: brokerState.host,
      port: brokerState.port,
      clientId: brokerState.clientId,
      reconnectAttempts: brokerState.reconnectAttempts,
      activeSubscriptions: brokerState.subscriptions.size,
      publishedCount: brokerState.publishedCount,
      receivedCount: brokerState.receivedCount
    })
  };
}

module.exports = { createConnector };
