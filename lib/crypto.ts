import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // recommended for GCM

function getKey(): Buffer {
  const secret = process.env.SECRET_KEY;
  if (!secret) {
    throw new Error("Missing environment variable: SECRET_KEY");
  }
  if (secret.length !== 32) {
    throw new Error("SECRET_KEY must be exactly 32 characters");
  }
  return Buffer.from(secret, "utf8");
}

/**
 * Encrypts plaintext using AES-256-GCM.
 *
 * Output format (base64): iv:tag:ciphertext
 */
export function encrypt(text: string): string {
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const ciphertext = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return [
    iv.toString("base64"),
    tag.toString("base64"),
    ciphertext.toString("base64"),
  ].join(":");
}

export function decrypt(hash: string): string {
  const key = getKey();
  const [ivB64, tagB64, dataB64] = hash.split(":");
  if (!ivB64 || !tagB64 || !dataB64) {
    throw new Error("Invalid encrypted payload");
  }

  const iv = Buffer.from(ivB64, "base64");
  const tag = Buffer.from(tagB64, "base64");
  const data = Buffer.from(dataB64, "base64");

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  const plaintext = Buffer.concat([decipher.update(data), decipher.final()]);
  return plaintext.toString("utf8");
}

