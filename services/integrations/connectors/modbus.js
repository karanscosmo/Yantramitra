const pollingJobs = new Map();

function createConnector() {
  const state = {
    connected: false,
    host: null,
    port: null,
    unitId: 1
  };

  const holdingRegisters = new Map();
  for (let i = 0; i < 50; i++) {
    holdingRegisters.set(i, Math.floor(Math.random() * 1000));
  }

  return {
    type: 'Modbus',
    name: 'modbus',

    connect: (config = {}) => {
      state.host = config.host || '127.0.0.1';
      state.port = config.port || 502;
      state.unitId = config.unitId || 1;
      state.connected = true;
      return { connected: true, host: state.host, port: state.port, unitId: state.unitId };
    },

    disconnect: () => {
      state.connected = false;
      pollingJobs.forEach((jobId) => clearInterval(jobId));
      pollingJobs.clear();
      return { connected: false };
    },

    isConnected: () => state.connected,

    readHoldingRegisters: (address, length = 1) => {
      if (!state.connected) throw new Error('Modbus not connected');
      const values = [];
      for (let i = 0; i < length; i++) {
        const addr = address + i;
        const value = holdingRegisters.has(addr) ? holdingRegisters.get(addr) : 0;
        values.push({ address: addr, value });
      }
      return { unitId: state.unitId, address, length, values, timestamp: new Date().toISOString() };
    },

    writeHoldingRegister: (address, value) => {
      if (!state.connected) throw new Error('Modbus not connected');
      if (value < 0 || value > 65535) throw new Error('Value out of range (0–65535)');
      holdingRegisters.set(address, value);
      return { unitId: state.unitId, address, value, written: true, timestamp: new Date().toISOString() };
    },

    writeMultipleRegisters: (address, values) => {
      if (!state.connected) throw new Error('Modbus not connected');
      const written = [];
      values.forEach((val, i) => {
        const clamped = Math.max(0, Math.min(65535, val));
        holdingRegisters.set(address + i, clamped);
        written.push({ address: address + i, value: clamped });
      });
      return { unitId: state.unitId, startAddress: address, count: values.length, written, timestamp: new Date().toISOString() };
    },

    startPolling: (jobName, address, length, intervalMs, callback) => {
      if (!state.connected) throw new Error('Modbus not connected');
      if (pollingJobs.has(jobName)) throw new Error(`Polling job '${jobName}' already exists`);
      const timerId = setInterval(() => {
        try {
          const data = this.readHoldingRegisters(address, length);
          if (callback) callback(null, data);
        } catch (err) {
          if (callback) callback(err);
        }
      }, intervalMs);
      pollingJobs.set(jobName, { timerId, address, length, intervalMs, createdAt: new Date().toISOString() });
      return { jobName, address, length, intervalMs, started: true };
    },

    stopPolling: (jobName) => {
      const job = pollingJobs.get(jobName);
      if (!job) throw new Error(`Polling job '${jobName}' not found`);
      clearInterval(job.timerId);
      pollingJobs.delete(jobName);
      return { jobName, stopped: true };
    },

    listPollingJobs: () => {
      return Array.from(pollingJobs.entries()).map(([name, job]) => ({
        name,
        address: job.address,
        length: job.length,
        intervalMs: job.intervalMs,
        createdAt: job.createdAt
      }));
    },

    getStatus: () => ({
      connected: state.connected,
      host: state.host,
      port: state.port,
      unitId: state.unitId,
      activePollingJobs: pollingJobs.size
    })
  };
}

module.exports = { createConnector };
