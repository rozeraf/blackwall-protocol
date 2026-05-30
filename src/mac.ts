import { hash } from "./hash";

// ─── Variant 3: MAC ───────────────────────────────────────────────────────────

/**
 * Double-pass keyed hash (HMAC-like construction).
 * Without the key, neither the inner nor outer pass can be reproduced.
 */
export function mac(data: Buffer, key: Buffer, outputBits = 256): Buffer {
  const inner = hash(Buffer.concat([key, Buffer.from("bw:inner"), data]));
  return hash(Buffer.concat([key, Buffer.from("bw:outer"), inner]), outputBits);
}
