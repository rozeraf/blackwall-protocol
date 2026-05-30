import { Keystream } from "./keystream";

// ─── Variant 1: Stream cipher ─────────────────────────────────────────────────

export function encrypt(plaintext: Buffer, k1: Buffer, k2: Buffer): Buffer {
  const ks = new Keystream(k1, k2).nextBytes(plaintext.length);
  return Buffer.from(plaintext.map((b, i) => b ^ ks[i]));
}

// XOR is symmetric: decrypt = re-encrypt with the same keys.
export const decrypt = encrypt;
