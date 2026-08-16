const crypto = require('crypto');

describe('tokenCrypto', () => {
  beforeAll(() => {
    process.env.TOKEN_ENCRYPTION_KEY = crypto.randomBytes(32).toString('base64');
  });

  // Re-require per test file run — module reads the key lazily via getKey(), not at import time.
  const { encrypt, decrypt } = require('../services/tokenCrypto');

  it('round-trips a plaintext token through encrypt/decrypt', () => {
    const token = 'ghp_thisIsATotallyFakeGithubTokenForTesting123456';
    const encrypted = encrypt(token);
    expect(encrypted).not.toEqual(token);
    expect(decrypt(encrypted)).toEqual(token);
  });

  it('produces a different ciphertext each time (random IV)', () => {
    const token = 'ghp_sameTokenTwice';
    expect(encrypt(token)).not.toEqual(encrypt(token));
  });

  it('passes through a legacy plaintext token unchanged (pre-encryption accounts)', () => {
    const legacyPlaintextToken = 'ghp_storedBeforeEncryptionWasAdded';
    expect(decrypt(legacyPlaintextToken)).toEqual(legacyPlaintextToken);
  });

  it('throws when TOKEN_ENCRYPTION_KEY is missing', () => {
    const original = process.env.TOKEN_ENCRYPTION_KEY;
    delete process.env.TOKEN_ENCRYPTION_KEY;
    expect(() => encrypt('anything')).toThrow(/TOKEN_ENCRYPTION_KEY/);
    process.env.TOKEN_ENCRYPTION_KEY = original;
  });
});
