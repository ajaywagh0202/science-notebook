import { promisify } from 'util';
import { randomBytes, scrypt, timingSafeEqual } from 'crypto';

const scryptAsync = promisify(scrypt);
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 128;
const KEY_LENGTH = 64;

export function validatePassword(password) {
  if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
  }
  if (password.length > MAX_PASSWORD_LENGTH) {
    return `Password must be no more than ${MAX_PASSWORD_LENGTH} characters`;
  }
  return null;
}

export async function hashPassword(password) {
  const validationError = validatePassword(password);
  if (validationError) throw new Error(validationError);

  const salt = randomBytes(16);
  const derivedKey = await scryptAsync(password, salt, KEY_LENGTH);
  return {
    algorithm: 'scrypt',
    salt: salt.toString('base64url'),
    hash: derivedKey.toString('base64url'),
  };
}

export async function verifyPassword(password, passwordAuth) {
  if (
    validatePassword(password) !== null ||
    passwordAuth?.algorithm !== 'scrypt' ||
    !passwordAuth.salt ||
    !passwordAuth.hash
  ) {
    return false;
  }

  try {
    const salt = Buffer.from(passwordAuth.salt, 'base64url');
    const expectedHash = Buffer.from(passwordAuth.hash, 'base64url');
    if (salt.length !== 16 || expectedHash.length !== KEY_LENGTH) return false;
    const actualHash = await scryptAsync(password, salt, expectedHash.length);
    return expectedHash.length === actualHash.length && timingSafeEqual(expectedHash, actualHash);
  } catch {
    return false;
  }
}

export function toPublicPerson(person) {
  if (!person) return person;
  const { passwordAuth, ...publicPerson } = person;
  return {
    ...publicPerson,
    passwordProtected: Boolean(passwordAuth),
  };
}
