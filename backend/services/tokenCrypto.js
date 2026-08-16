const crypto = require('crypto');

// AES-256-GCM encryption for GitHub tokens at rest. The service-role key bypasses
// Supabase RLS, so RLS alone doesn't protect stored tokens — a database leak would
// hand out live GitHub access to every user's repos unless the tokens are encrypted.
const ALGORITHM = 'aes-256-gcm';

function getKey() {
  const keyB64 = process.env.TOKEN_ENCRYPTION_KEY;
  if (!keyB64) {
    throw new Error('TOKEN_ENCRYPTION_KEY is not set. Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'base64\'))"');
  }
  const key = Buffer.from(keyB64, 'base64');
  if (key.length !== 32) throw new Error('TOKEN_ENCRYPTION_KEY must decode to exactly 32 bytes');
  return key;
}

function encrypt(plaintext) {
  const key = getKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  // Store as iv:authTag:ciphertext, all base64 — self-contained, no extra columns needed.
  return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted.toString('base64')}`;
}

function decrypt(stored) {
  if (!stored) return stored;
  const parts = stored.split(':');
  if (parts.length !== 3) {
    // Not in encrypted form (e.g. a token stored before encryption was added) — return as-is
    // so existing accounts don't break; re-encrypt on next token write.
    return stored;
  }
  const [ivB64, authTagB64, dataB64] = parts;
  const key = getKey();
  const decipher = crypto.createDecipheriv(ALGORITHM, key, Buffer.from(ivB64, 'base64'));
  decipher.setAuthTag(Buffer.from(authTagB64, 'base64'));
  const decrypted = Buffer.concat([decipher.update(Buffer.from(dataB64, 'base64')), decipher.final()]);
  return decrypted.toString('utf8');
}

module.exports = { encrypt, decrypt };
