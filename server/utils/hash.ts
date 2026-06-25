import crypto from 'crypto';

/**
 * Hashes a PIN using scrypt.
 * Uses a fixed format: salt:hash
 */
export async function hashPin(pin: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString('hex');
    crypto.scrypt(pin, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      resolve(`${salt}:${derivedKey.toString('hex')}`);
    });
  });
}

/**
 * Verifies a PIN against a hash.
 * If the stored hash doesn't contain a ':', it is assumed to be a legacy plaintext PIN.
 */
export async function verifyPin(pin: string, storedHashOrPlaintext: string): Promise<boolean> {
  if (!storedHashOrPlaintext) return false;

  if (!storedHashOrPlaintext.includes(':')) {
    // Legacy plaintext verification
    return pin === storedHashOrPlaintext;
  }

  const [salt, key] = storedHashOrPlaintext.split(':');
  
  return new Promise((resolve, reject) => {
    crypto.scrypt(pin, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      // Use timingSafeEqual to prevent timing attacks
      try {
        const keyBuffer = Buffer.from(key, 'hex');
        const match = crypto.timingSafeEqual(keyBuffer, derivedKey);
        resolve(match);
      } catch (e) {
        resolve(false);
      }
    });
  });
}
