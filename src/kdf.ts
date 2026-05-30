import { createHash } from "node:crypto";
import { WORDS } from "./ca";
import type { State } from "./types";

// ─── Constants ────────────────────────────────────────────────────────────────

export const RULE_INTERVAL = 64; // keystream steps between rule changes (1 step = 32 bits)

// ─── Key derivation ───────────────────────────────────────────────────────────

export function expand(key: Buffer, label: string, bytes: number): Buffer {
  const chunks: Buffer[] = [];
  let filled = 0, counter = 0;
  while (filled < bytes) {
    const block = createHash("sha256")
      .update(label)
      .update(Buffer.from([counter >>> 8, counter & 0xff]))
      .update(key)
      .digest();
    chunks.push(block);
    filled += block.length;
    counter++;
  }
  return Buffer.concat(chunks).subarray(0, bytes);
}

export function stateFromKey(k: Buffer): State {
  const raw = expand(k, "bw:s:", WORDS * 4);
  const s = new Uint32Array(WORDS) as State;
  for (let i = 0; i < WORDS; i++) s[i] = raw.readUInt32LE(i * 4);
  return s;
}

export function rulesFromKey(k: Buffer, n: number): number[] {
  return Array.from(expand(k, "bw:r:", n));
}
