import crypto from 'crypto';

// Module-scoped encryption key — NEVER leaves main process
let encryptionKey: Buffer | null = null;
let lockTimer: NodeJS.Timeout | null = null;
let lockCallback: (() => void) | null = null;

const LOCK_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
const SCRYPT_PARAMS = { N: 2 ** 17, r: 8, p: 1, maxmem: 256 * 1024 * 1024 };
const KEY_LENGTH = 32; // AES-256

function resetLockTimer() {
  if (lockTimer) clearTimeout(lockTimer);
  lockTimer = setTimeout(() => {
    encryptionKey = null;
    if (lockCallback) lockCallback();
  }, LOCK_TIMEOUT_MS);
}

// Promisified scrypt to avoid blocking the main process
function scryptAsync(password: string, salt: string, keylen: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, keylen, SCRYPT_PARAMS, (err, derivedKey) => {
      if (err) reject(err);
      else resolve(derivedKey);
    });
  });
}

export function setLockCallback(cb: () => void) {
  lockCallback = cb;
}

export async function setup(password: string): Promise<{ salt: string; verificationHash: string }> {
  const salt = crypto.randomBytes(32).toString('base64');
  // Derive verification hash with prefixed salt (separate from encryption key derivation)
  const verificationHash = (await scryptAsync(password, 'verify:' + salt, KEY_LENGTH)).toString('base64');
  // Derive and store encryption key
  encryptionKey = await scryptAsync(password, salt, KEY_LENGTH);
  resetLockTimer();
  return { salt, verificationHash };
}

export async function unlock(password: string, salt: string, verificationHash: string): Promise<boolean> {
  // Verify password
  const computedHash = (await scryptAsync(password, 'verify:' + salt, KEY_LENGTH)).toString('base64');
  if (computedHash !== verificationHash) return false;
  // Derive encryption key
  encryptionKey = await scryptAsync(password, salt, KEY_LENGTH);
  resetLockTimer();
  return true;
}

export function lock(): void {
  encryptionKey = null;
  if (lockTimer) { clearTimeout(lockTimer); lockTimer = null; }
}

export function isUnlocked(): boolean {
  return encryptionKey !== null;
}

export function encrypt(plaintext: string): { encrypted: string; iv: string; authTag: string } {
  if (!encryptionKey) throw new Error('Vault is locked');
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', encryptionKey, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  resetLockTimer();
  return {
    encrypted: encrypted.toString('base64'),
    iv: iv.toString('base64'),
    authTag: authTag.toString('base64'),
  };
}

export function decrypt(encrypted: string, iv: string, authTag: string): string {
  if (!encryptionKey) throw new Error('Vault is locked');
  const decipher = crypto.createDecipheriv(
    'aes-256-gcm', encryptionKey, Buffer.from(iv, 'base64')
  );
  decipher.setAuthTag(Buffer.from(authTag, 'base64'));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encrypted, 'base64')),
    decipher.final(),
  ]);
  resetLockTimer();
  return decrypted.toString('utf8');
}

export async function changePassword(
  oldPassword: string, newPassword: string, salt: string, verificationHash: string
): Promise<{ salt: string; verificationHash: string }> {
  // Verify old password first
  const computedHash = (await scryptAsync(oldPassword, 'verify:' + salt, KEY_LENGTH)).toString('base64');
  if (computedHash !== verificationHash) throw new Error('Invalid old password');
  // Generate new salt and key
  const newSalt = crypto.randomBytes(32).toString('base64');
  const newVerificationHash = (await scryptAsync(newPassword, 'verify:' + newSalt, KEY_LENGTH)).toString('base64');
  encryptionKey = await scryptAsync(newPassword, newSalt, KEY_LENGTH);
  resetLockTimer();
  return { salt: newSalt, verificationHash: newVerificationHash };
}

export function ping(): void {
  if (encryptionKey) resetLockTimer();
}
