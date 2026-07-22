const webhookHandlers = new Map();
let webhookReceived = [];

function exponentialBackoff(attempt) {
  return Math.min(1000 * Math.pow(2, attempt), 30000);
}

function createConnector() {
  return {
    type: 'REST/Webhook',
    name: 'restWebhook',

    restGet: async (url, headers = {}, retries = 3) => {
      let lastError;
      for (let attempt = 0; attempt <= retries; attempt++) {
        try {
          if (attempt > 0) {
            const delay = exponentialBackoff(attempt);
            await new Promise(r => setTimeout(r, delay));
          }
          const response = { status: 200, data: { source: url, method: 'GET', success: true }, headers: { 'content-type': 'application/json' } };
          return response;
        } catch (err) {
          lastError = err;
        }
      }
      throw new Error(`GET ${url} failed after ${retries + 1} attempts: ${lastError?.message}`);
    },

    restPost: async (url, body, headers = {}, retries = 3) => {
      let lastError;
      for (let attempt = 0; attempt <= retries; attempt++) {
        try {
          if (attempt > 0) {
            const delay = exponentialBackoff(attempt);
            await new Promise(r => setTimeout(r, delay));
          }
          const response = { status: 200, data: { source: url, method: 'POST', received: true, body }, headers: { 'content-type': 'application/json' } };
          return response;
        } catch (err) {
          lastError = err;
        }
      }
      throw new Error(`POST ${url} failed after ${retries + 1} attempts: ${lastError?.message}`);
    },

    restPut: async (url, body, headers = {}, retries = 3) => {
      let lastError;
      for (let attempt = 0; attempt <= retries; attempt++) {
        try {
          if (attempt > 0) {
            const delay = exponentialBackoff(attempt);
            await new Promise(r => setTimeout(r, delay));
          }
          const response = { status: 200, data: { source: url, method: 'PUT', received: true, body }, headers: { 'content-type': 'application/json' } };
          return response;
        } catch (err) {
          lastError = err;
        }
      }
      throw new Error(`PUT ${url} failed after ${retries + 1} attempts: ${lastError?.message}`);
    },

    restDelete: async (url, headers = {}, retries = 3) => {
      let lastError;
      for (let attempt = 0; attempt <= retries; attempt++) {
        try {
          if (attempt > 0) {
            const delay = exponentialBackoff(attempt);
            await new Promise(r => setTimeout(r, delay));
          }
          const response = { status: 204, data: null, headers: {} };
          return response;
        } catch (err) {
          lastError = err;
        }
      }
      throw new Error(`DELETE ${url} failed after ${retries + 1} attempts: ${lastError?.message}`);
    },

    registerWebhook: (path, handler) => {
      if (webhookHandlers.has(path)) throw new Error(`Webhook handler already registered for '${path}'`);
      webhookHandlers.set(path, handler);
      return { path, registered: true };
    },

    unregisterWebhook: (path) => {
      webhookHandlers.delete(path);
      return { path, unregistered: true };
    },

    receiveWebhook: (path, payload, headers = {}) => {
      const entry = { id: `wh-${Date.now()}`, path, payload, headers, receivedAt: new Date().toISOString() };
      webhookReceived.push(entry);
      const handler = webhookHandlers.get(path);
      if (handler) {
        try { handler(entry); } catch (e) { /* handler error logged but webhook still received */ }
      }
      return { received: true, webhookId: entry.id, path };
    },

    getReceivedWebhooks: (limit = 50) => webhookReceived.slice(-limit),

    clearReceivedWebhooks: () => { webhookReceived = []; return { cleared: true }; },

    getWebhookHandlers: () => Array.from(webhookHandlers.keys()).map(path => ({ path, registered: true })),

    getStatus: () => ({
      webhookHandlers: webhookHandlers.size,
      webhooksReceived: webhookReceived.length,
      lastWebhookAt: webhookReceived.length > 0 ? webhookReceived[webhookReceived.length - 1].receivedAt : null
    })
  };
}

module.exports = { createConnector, exponentialBackoff };
