const sessions = new Map();
const deviceRegistry = new Map();
const MAX_CONCURRENT_SESSIONS = 5;
const SESSION_TIMEOUT_MS = 24 * 60 * 60 * 1000;
const IDLE_TIMEOUT_MS = 30 * 60 * 1000;

function createSession(userId, deviceInfo = {}) {
  const currentSessions = getUserSessions(userId);
  if (currentSessions.length >= MAX_CONCURRENT_SESSIONS) {
    const oldest = currentSessions.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))[0];
    revokeSession(oldest.sessionId, 'Max concurrent sessions reached');
  }

  const sessionId = `sess-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const deviceId = deviceInfo.deviceId || `dev-${Math.random().toString(36).slice(2, 8)}`;

  const session = {
    sessionId,
    userId,
    deviceId,
    deviceName: deviceInfo.deviceName || 'Unknown Device',
    deviceType: deviceInfo.deviceType || 'browser',
    ip: deviceInfo.ip || null,
    userAgent: deviceInfo.userAgent || null,
    createdAt: new Date().toISOString(),
    lastActivity: new Date().toISOString(),
    expiresAt: new Date(Date.now() + SESSION_TIMEOUT_MS).toISOString(),
    idleTimeout: IDLE_TIMEOUT_MS,
    active: true,
    metadata: deviceInfo.metadata || {}
  };

  sessions.set(sessionId, session);

  if (!deviceRegistry.has(deviceId)) {
    deviceRegistry.set(deviceId, {
      deviceId,
      deviceName: deviceInfo.deviceName || 'Unknown Device',
      deviceType: deviceInfo.deviceType || 'browser',
      firstSeen: new Date().toISOString(),
      lastSeen: new Date().toISOString(),
      userIds: new Set()
    });
  }
  const device = deviceRegistry.get(deviceId);
  device.lastSeen = new Date().toISOString();
  device.userIds.add(userId);

  return session;
}

function getSession(sessionId) {
  const session = sessions.get(sessionId);
  if (!session) return null;
  if (!session.active) return { ...session, expired: true };
  if (new Date(session.expiresAt) < new Date()) {
    session.active = false;
    return { ...session, expired: true };
  }
  return session;
}

function touchSession(sessionId) {
  const session = sessions.get(sessionId);
  if (!session || !session.active) return null;
  session.lastActivity = new Date().toISOString();
  return session;
}

function revokeSession(sessionId, reason = 'Manual revocation') {
  const session = sessions.get(sessionId);
  if (!session) throw new Error(`Session '${sessionId}' not found`);
  session.active = false;
  session.revokedAt = new Date().toISOString();
  session.revokeReason = reason;
  return { revoked: true, sessionId, reason };
}

function revokeAllUserSessions(userId, reason = 'Administrative logout') {
  const userSessions = getUserSessions(userId);
  userSessions.forEach(s => revokeSession(s.sessionId, reason));
  return { revoked: userSessions.length, userId, reason };
}

function getUserSessions(userId) {
  return Array.from(sessions.values()).filter(s => s.userId === userId);
}

function getActiveSessions(userId) {
  return getUserSessions(userId).filter(s => s.active && new Date(s.expiresAt) > new Date());
}

function getExpiredSessions(limit = 100) {
  return Array.from(sessions.values())
    .filter(s => !s.active || new Date(s.expiresAt) < new Date())
    .slice(-limit);
}

function cleanupExpiredSessions() {
  let cleaned = 0;
  sessions.forEach((session, sessionId) => {
    if (!session.active || new Date(session.expiresAt) < new Date()) {
      sessions.delete(sessionId);
      cleaned++;
    }
  });
  return { cleaned };
}

function registerDevice(deviceInfo) {
  const deviceId = deviceInfo.deviceId || `dev-${Math.random().toString(36).slice(2, 8)}`;
  deviceRegistry.set(deviceId, {
    deviceId,
    deviceName: deviceInfo.deviceName || 'Unknown Device',
    deviceType: deviceInfo.deviceType || 'browser',
    firstSeen: deviceRegistry.has(deviceId) ? deviceRegistry.get(deviceId).firstSeen : new Date().toISOString(),
    lastSeen: new Date().toISOString(),
    userIds: deviceRegistry.has(deviceId) ? deviceRegistry.get(deviceId).userIds : new Set()
  });
  return deviceRegistry.get(deviceId);
}

function getDevice(deviceId) {
  return deviceRegistry.get(deviceId) || null;
}

function listDevices(userId) {
  return Array.from(deviceRegistry.values())
    .filter(d => d.userIds.has(userId));
}

function getSessionsSummary() {
  const all = Array.from(sessions.values());
  const active = all.filter(s => s.active && new Date(s.expiresAt) > new Date());
  return {
    totalSessions: all.length,
    activeSessions: active.length,
    expiredSessions: all.length - active.length,
    uniqueUsers: new Set(all.map(s => s.userId)).size,
    uniqueDevices: deviceRegistry.size,
    maxConcurrentSessions: MAX_CONCURRENT_SESSIONS
  };
}

function setMaxConcurrentSessions(max) {
  if (max < 1) throw new Error('Max concurrent sessions must be at least 1');
  MAX_CONCURRENT_SESSIONS = max;
  return { maxConcurrentSessions: MAX_CONCURRENT_SESSIONS };
}

module.exports = {
  createSession,
  getSession,
  touchSession,
  revokeSession,
  revokeAllUserSessions,
  getUserSessions,
  getActiveSessions,
  getExpiredSessions,
  cleanupExpiredSessions,
  registerDevice,
  getDevice,
  listDevices,
  getSessionsSummary,
  setMaxConcurrentSessions
};
