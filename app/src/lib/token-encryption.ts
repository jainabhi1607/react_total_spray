import CryptoJS from "crypto-js";

function getEncryptionKey(): string {
  const key = process.env.TOKEN_ENCRYPTION_KEY;
  if (!key) {
    throw new Error("TOKEN_ENCRYPTION_KEY environment variable is not set");
  }
  return key;
}

export function encryptToken(data: Record<string, unknown>): string {
  const json = JSON.stringify(data);
  return CryptoJS.AES.encrypt(json, getEncryptionKey()).toString();
}

export function decryptToken(ciphertext: string): Record<string, unknown> {
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, getEncryptionKey());
    const json = bytes.toString(CryptoJS.enc.Utf8);
    if (!json) {
      throw new Error("Decryption produced empty result");
    }
    return JSON.parse(json);
  } catch {
    return {};
  }
}
