import crypto from 'crypto';

/**
 * Generate a cryptographically secure 6-character verification code e.g. "RB-7492"
 */
export const generatePlainCode = () => {
  const digits = crypto.randomInt(1000, 9999);
  return `RB-${digits}`;
};

/**
 * Hash confirmation code using SHA-256 for secure database storage.
 * Only the hash is persisted; plaintext is provided only once to authorized participants.
 */
export const hashVerificationCode = (plainCode) => {
  if (!plainCode) return null;
  const sanitized = plainCode.trim().toUpperCase();
  return crypto.createHash('sha256').update(sanitized).digest('hex');
};

/**
 * Compare candidate plaintext code against stored SHA-256 hash in constant time
 */
export const verifyConfirmationCode = (candidatePlainCode, storedHash) => {
  if (!candidatePlainCode || !storedHash) return false;
  const candidateHash = hashVerificationCode(candidatePlainCode);
  try {
    return crypto.timingSafeEqual(Buffer.from(candidateHash), Buffer.from(storedHash));
  } catch (err) {
    return false;
  }
};
