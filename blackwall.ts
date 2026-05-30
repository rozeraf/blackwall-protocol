/**
 * Blackwall Cipher
 *
 * Built on a 1024-bit cellular automaton with adaptive Wolfram rules.
 *
 * Variant 1 — Stream cipher:  encrypt/decrypt with (k1, k2). Irreversible without keys.
 * Variant 2 — Hash:           Davies-Meyer construction; CA stream cipher as block cipher.
 *                             One-way, no key needed.
 * Variant 3 — MAC:            Double-pass keyed hash. Irreversible without key.
 */

import { createHash } from "node:crypto";

// ─── Constants ───────────────────────────────────────────────────────────────

const WIDTH         = 1024;       // CA width in bits
const WORDS         = WIDTH / 32; // 32 uint32 words
const RULE_INTERVAL = 64;         // keystream steps between rule changes (1 step = 32 bits)
const HASH_BLOCK    = 32;         // Davies-Meyer block size in bytes (= hash output size)

// ─── CA core ─────────────────────────────────────────────────────────────────

type State = Uint32Array<ArrayBuffer>;

/**
 * One step of 1D Wolfram CA across 1024 bits.
 *
 * Processes all 32 uint32 words in parallel. For each bit b in word j:
 *   L[b] = cell (j*32 + b - 1) mod WIDTH  [left neighbor]
 *   C[b] = cell (j*32 + b)
 *   R[b] = cell (j*32 + b + 1) mod WIDTH  [right neighbor]
 *   new[b] = bit (L<<2 | C<<1 | R) of `rule`
 *
 * The inner loop ORs bitmasks for all 8 patterns where the rule maps to 1.
 */
function evolve(s: State, rule: number): State {
  const next = new Uint32Array(WORDS) as State;
  for (let j = 0; j < WORDS; j++) {
    const lword = s[(j - 1 + WORDS) % WORDS];
    const rword = s[(j + 1) % WORDS];
    // Align neighbor bits: shift word, bring in the crossing bit from the adjacent word.
    const L = ((s[j] << 1) >>> 0) | (lword >>> 31);
    const C = s[j];
    const R = (s[j] >>> 1) | ((rword & 1) << 31);
    let w = 0;
    for (let k = 0; k < 8; k++) {
      if ((rule >>> k) & 1) {
        const lm = (k >>> 2) & 1 ? L : ~L;
        const cm = (k >>> 1) & 1 ? C : ~C;
        const rm = (k       ) & 1 ? R : ~R;
        w |= lm & cm & rm;
      }
    }
    next[j] = w >>> 0;
  }
  return next;
}

// ─── Key derivation ──────────────────────────────────────────────────────────

function expand(key: Buffer, label: string, bytes: number): Buffer {
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

function stateFromKey(k: Buffer): State {
  const raw = expand(k, "bw:s:", WORDS * 4);
  const s = new Uint32Array(WORDS) as State;
  for (let i = 0; i < WORDS; i++) s[i] = raw.readUInt32LE(i * 4);
  return s;
}

function rulesFromKey(k: Buffer, n: number): number[] {
  return Array.from(expand(k, "bw:r:", n));
}

// ─── Keystream ───────────────────────────────────────────────────────────────

class Keystream {
  private state: State;
  private rules: number[];
  private step = 0;

  constructor(k1: Buffer, k2: Buffer) {
    this.state = stateFromKey(k1);
    this.rules = rulesFromKey(k2, 512);
  }

  private rule(): number {
    return this.rules[Math.floor(this.step / RULE_INTERVAL) % this.rules.length];
  }

  nextBytes(n: number): Buffer {
    const aligned = (n + 3) & ~3;
    const out = Buffer.allocUnsafe(aligned);
    for (let off = 0; off < aligned; off += 4) {
      out.writeUInt32LE(this.state[WORDS >>> 1] >>> 0, off);
      this.state = evolve(this.state, this.rule());
      this.step++;
    }
    return out.subarray(0, n);
  }
}

// ─── Variant 1: Stream cipher ────────────────────────────────────────────────

export function encrypt(plaintext: Buffer, k1: Buffer, k2: Buffer): Buffer {
  const ks = new Keystream(k1, k2).nextBytes(plaintext.length);
  return Buffer.from(plaintext.map((b, i) => b ^ ks[i]));
}

// XOR is symmetric: decrypt = re-encrypt with the same keys.
export const decrypt = encrypt;

// ─── Variant 2: Davies-Meyer hash ────────────────────────────────────────────
//
// H_0 = 0^256
// H_i = Encrypt_{k1=M_i, k2=H_{i-1}}(H_{i-1}) XOR H_{i-1}
//
// The CA stream cipher acts as the block cipher E.
// M_i sets the CA initial state (k1); H_{i-1} drives the rule schedule (k2).
// The XOR back of H_{i-1} is the feed-forward that ensures one-wayness.
//
// Padding: length-strengthened Merkle-Damgård.

function dmPad(data: Buffer): Buffer {
  const lenBytes = 8;
  const padLen = HASH_BLOCK - ((data.length + 1 + lenBytes) % HASH_BLOCK);
  const out = Buffer.alloc(data.length + 1 + padLen + lenBytes);
  data.copy(out);
  out[data.length] = 0x80;
  const bitLen = BigInt(data.length) * 8n;
  out.writeBigUInt64BE(bitLen, out.length - lenBytes);
  return out;
}

export function hash(data: Buffer, outputBits = 256): Buffer {
  if (outputBits % 8 !== 0) throw new Error("outputBits must be a multiple of 8");

  const padded = dmPad(data);
  let H = Buffer.alloc(HASH_BLOCK); // H_0 = 0^256

  for (let off = 0; off < padded.length; off += HASH_BLOCK) {
    const M = padded.subarray(off, off + HASH_BLOCK);
    // E_{k1=M, k2=H}(H): encrypt the current hash value using this block as k1
    const ks = new Keystream(M, H).nextBytes(HASH_BLOCK);
    H = Buffer.from(H.map((b, i) => b ^ ks[i])); // Davies-Meyer feed-forward
  }

  if (outputBits / 8 <= HASH_BLOCK) return H.subarray(0, outputBits / 8);

  // Extend output beyond 256 bits via chained re-hashing
  const parts = [H];
  let prev = H;
  let got = HASH_BLOCK;
  let idx = 0;
  while (got < outputBits / 8) {
    const ext = Buffer.from(Buffer.concat([prev, Buffer.from([0xff, idx++ & 0xff])]));
    prev = hash(ext, 256);
    parts.push(prev);
    got += HASH_BLOCK;
  }
  return Buffer.concat(parts).subarray(0, outputBits / 8);
}

// ─── Variant 3: MAC ──────────────────────────────────────────────────────────

/**
 * Double-pass keyed hash (HMAC-like construction).
 * Without the key, neither the inner nor outer pass can be reproduced.
 */
export function mac(data: Buffer, key: Buffer, outputBits = 256): Buffer {
  const inner = hash(Buffer.concat([key, Buffer.from("bw:inner"), data]));
  return hash(Buffer.concat([key, Buffer.from("bw:outer"), inner]), outputBits);
}
