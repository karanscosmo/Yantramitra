const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const TAG_LENGTH = 16;
const MASTER_KEY = crypto.createHash('sha256').update(process.env.SECRETS_MASTER_KEY || 'yantramitra-master-key-2026-change-in-production').digest().slice(0, 32);

const secrets = new Map();
const secretVersions = new Map();
const accessLog = [];

function encrypt(plaintext) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, MASTER_KEY, iv);
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag().toString('hex');
  return `${iv.toString('hex')}:${tag}:${encrypted}`;
}

function decrypt(ciphertext) {
  const parts = ciphertext.split(':');
  if (parts.length !== 3) throw new Error('Invalid ciphertext format');
  const iv = Buffer.from(parts[0], 'hex');
  const tag = Buffer.from(parts[1], 'hex');
  const encrypted = parts[2];
  const decipher = crypto.createDecipheriv(ALGORITHM, MASTER_KEY, iv);
  decipher.setAuthTag(tag);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

function storeSecret(name, value, category = 'general', metadata = {}) {
  const encrypted = encrypt(value);
  const version = (secretVersions.get(name) || 0) + 1;
  secretVersions.set(name, version);

  const entry = {
    name,
    category,
    encrypted,
    version,
    metadata: { ...metadata, createdAt: new Date().toISOString(), createdBy: metadata.createdBy || 'system' },
    rotatedAt: null,
    lastAccessed: null
  };

  secrets.set(name, entry);
  return { name, version, category, message: 'Secret stored securely' };
}

function getSecret(name, accessor = 'system') {
  const entry = secrets.get(name);
  if (!entry) throw new Error(`Secret '${name}' not found`);

  const plaintext = decrypt(entry.encrypted);
  entry.lastAccessed = new Date().toISOString();

  accessLog.push({
    name,
    accessor,
    timestamp: entry.lastAccessed,
    action: 'READ'
  });

  return { name, value: plaintext, version: entry.version, category: entry.category };
}

function rotateSecret(name, newValue, rotatedBy = 'system') {
  const entry = secrets.get(name);
  if (!entry) throw new Error(`Secret '${name}' not found`);

  const prevVersion = entry.version;
  const prevValue = decrypt(entry.encrypted);

  const encrypted = encrypt(newValue);
  const version = prevVersion + 1;
  secretVersions.set(name, version);

  entry.encrypted = encrypted;
  entry.version = version;
  entry.rotatedAt = new Date().toISOString();
  entry.metadata.rotatedBy = rotatedBy;

  accessLog.push({
    name,
    accessor: rotatedBy,
    timestamp: entry.rotatedAt,
    action: 'ROTATE',
    prevVersion
  });

  return { name, prevVersion, newVersion: version, rotatedAt: entry.rotatedAt, message: 'Secret rotated successfully' };
}

function deleteSecret(name) {
  if (!secrets.has(name)) throw new Error(`Secret '${name}' not found`);
  secrets.delete(name);
  return { deleted: true, name };
}

function listSecrets(category = null) {
  let entries = Array.from(secrets.values());
  if (category) entries = entries.filter(e => e.category === category);
  return entries.map(e => ({
    name: e.name,
    category: e.category,
    version: e.version,
    createdAt: e.metadata.createdAt,
    rotatedAt: e.rotatedAt,
    lastAccessed: e.lastAccessed
  }));
}

function getAccessLog(limit = 100) {
  return accessLog.slice(-limit).reverse();
}

function generateEncryptionKey() {
  return crypto.randomBytes(32).toString('hex');
}

function hashString(input) {
  return crypto.createHash('sha256').update(input).digest('hex');
}

module.exports = {
  encrypt,
  decrypt,
  storeSecret,
  getSecret,
  rotateSecret,
  deleteSecret,
  listSecrets,
  getAccessLog,
  generateEncryptionKey,
  hashString
};
