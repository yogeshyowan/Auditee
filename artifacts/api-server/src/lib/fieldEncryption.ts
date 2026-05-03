/**
 * Field-level AES-256-GCM encryption for PII columns.
 *
 * Applies to: payments.email, payments.contact
 *
 * Format of encrypted values:
 *   "enc:v1:<base64(iv)>:<base64(authTag)>:<base64(ciphertext)>"
 *
 * If DATA_ENCRYPTION_KEY is not set the helpers return plaintext unchanged
 * (with a one-time startup warning). This allows graceful degradation in
 * development without breaking existing rows.
 *
 * Key provisioning:
 *   Generate a 32-byte key:  openssl rand -base64 32
 *   Store in DATA_ENCRYPTION_KEY environment variable.
 */
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { logger } from "./logger";

const PREFIX = "enc:v1:";
const ALGO = "aes-256-gcm";
const IV_BYTES = 12; // 96-bit IV recommended for GCM
const TAG_BYTES = 16;

let _key: Buffer | null = null;
let _warned = false;

function getKey(): Buffer | null {
  if (_key) return _key;
  const raw = process.env.DATA_ENCRYPTION_KEY;
  if (!raw) {
    if (!_warned) {
      logger.warn(
        "DATA_ENCRYPTION_KEY is not set — PII fields will be stored in plaintext. " +
          "Set this to a 32-byte base64-encoded key in production.",
      );
      _warned = true;
    }
    return null;
  }
  try {
    const buf = Buffer.from(raw, "base64");
    if (buf.length !== 32) {
      logger.error(
        { keyLength: buf.length },
        "DATA_ENCRYPTION_KEY must decode to exactly 32 bytes (256 bits). PII stored in plaintext.",
      );
      return null;
    }
    _key = buf;
    return _key;
  } catch {
    logger.error("DATA_ENCRYPTION_KEY is not valid base64. PII stored in plaintext.");
    return null;
  }
}

/**
 * Encrypt a string value. Returns the encrypted token, or the original
 * value unchanged if no key is configured (with a logged warning).
 */
export function encryptField(plaintext: string | null | undefined): string | null {
  if (plaintext == null) return null;
  const key = getKey();
  if (!key) return plaintext; // graceful degradation — logged at startup

  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGO, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return (
    PREFIX +
    iv.toString("base64") +
    ":" +
    authTag.toString("base64") +
    ":" +
    encrypted.toString("base64")
  );
}

/**
 * Decrypt a value previously encrypted by `encryptField`.
 * Returns the original value if it wasn't encrypted (backwards-compatible
 * with rows written before encryption was enabled).
 */
export function decryptField(value: string | null | undefined): string | null {
  if (value == null) return null;
  if (!value.startsWith(PREFIX)) return value; // plaintext (legacy row)

  const key = getKey();
  if (!key) {
    logger.warn("DATA_ENCRYPTION_KEY not set — cannot decrypt field, returning raw token");
    return value;
  }

  try {
    const parts = value.slice(PREFIX.length).split(":");
    if (parts.length !== 3) throw new Error("malformed token");
    const iv = Buffer.from(parts[0], "base64");
    const authTag = Buffer.from(parts[1], "base64");
    const ciphertext = Buffer.from(parts[2], "base64");

    const decipher = createDecipheriv(ALGO, key, iv);
    decipher.setAuthTag(authTag);
    return decipher.update(ciphertext) + decipher.final("utf8");
  } catch (err) {
    logger.error({ err }, "fieldEncryption: decryption failed — authentication tag mismatch or corrupt data");
    return null;
  }
}

/**
 * Returns true if this value is an encrypted token (useful for UI display).
 */
export function isEncrypted(value: string | null | undefined): boolean {
  return typeof value === "string" && value.startsWith(PREFIX);
}
