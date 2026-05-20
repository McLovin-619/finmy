// pnpm add plaid --filter @finmy/lib
import { Configuration, PlaidApi, PlaidEnvironments } from "plaid";
import * as crypto from "crypto";

export type PlaidConfig = {
  clientId: string;
  secret: string;
  env: "sandbox" | "development" | "production";
};

export function createPlaidClient(config: PlaidConfig): PlaidApi {
  const configuration = new Configuration({
    basePath: PlaidEnvironments[config.env],
    baseOptions: {
      headers: {
        "PLAID-CLIENT-ID": config.clientId,
        "PLAID-SECRET": config.secret,
      },
    },
  });
  return new PlaidApi(configuration);
}

function deriveKey(encryptionKey: string): Buffer {
  return crypto.createHash("sha256").update(encryptionKey).digest();
}

export function encryptAccessToken(
  plaintext: string,
  encryptionKey: string,
): { encrypted: string; iv: string } {
  const key = deriveKey(encryptionKey);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
    cipher.getAuthTag(),
  ]);
  return {
    encrypted: encrypted.toString("hex"),
    iv: iv.toString("hex"),
  };
}

export function decryptAccessToken(
  encrypted: string,
  iv: string,
  encryptionKey: string,
): string {
  const key = deriveKey(encryptionKey);
  const ivBuffer = Buffer.from(iv, "hex");
  const encryptedBuffer = Buffer.from(encrypted, "hex");
  // Auth tag is the last 16 bytes appended by encryptAccessToken
  const authTag = encryptedBuffer.subarray(encryptedBuffer.length - 16);
  const ciphertext = encryptedBuffer.subarray(0, encryptedBuffer.length - 16);
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, ivBuffer);
  decipher.setAuthTag(authTag);
  return decipher.update(ciphertext) + decipher.final("utf8");
}
