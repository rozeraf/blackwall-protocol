/**
 * Blackwall Cipher — Browser port
 * Uses @noble/hashes for sync SHA-256 (no Node.js crypto dependency).
 */

import { sha256 } from '@noble/hashes/sha2.js';

// ─── Constants ───────────────────────────────────────────────────────────────

const WIDTH         = 1024;
const WORDS         = WIDTH / 32;
const RULE_INTERVAL = 64;
const HASH_BLOCK    = 32;

// ─── CA core ─────────────────────────────────────────────────────────────────

type State = Uint32Array;

function evolve(s: State, rule: number): State {
  const next = new Uint32Array(WORDS);
  for (let j = 0; j < WORDS; j++) {
    const lword = s[(j - 1 + WORDS) % WORDS];
    const rword = s[(j + 1) % WORDS];
    const L = ((s[j] << 1) >>> 0) | (lword >>> 31);
    const C = s[j];
    const R = (s[j] >>> 1) | ((rword & 1) << 31);
    let w = 0;
    for (let k = 0; k < 8; k++) {
      if ((rule >>> k) & 1) {
        const lm = (k >>> 2) & 1 ? L : ~L;
        const cm = (k >>> 1) & 1 ? C : ~C;
        const rm = (k      ) & 1 ? R : ~R;
        w |= lm & cm & rm;
      }
    }
    next[j] = w >>> 0;
  }
  return next;
}

// ─── Key derivation ──────────────────────────────────────────────────────────

function expand(key: Uint8Array, label: string, bytes: number): Uint8Array {
  const labelBytes = new TextEncoder().encode(label);
  const chunks: Uint8Array[] = [];
  let filled = 0;
  let counter = 0;
  while (filled < bytes) {
    const block = sha256.create()
      .update(labelBytes)
      .update(new Uint8Array([counter >>> 8, counter & 0xff]))
      .update(key)
      .digest();
    chunks.push(block);
    filled += block.length;
    counter++;
  }
  const result = new Uint8Array(bytes);
  let off = 0;
  for (const c of chunks) {
    result.set(c.slice(0, Math.min(c.length, bytes - off)), off);
    off += c.length;
    if (off >= bytes) break;
  }
  return result;
}

function stateFromKey(k: Uint8Array): State {
  const raw = expand(k, 'bw:s:', WORDS * 4);
  const s = new Uint32Array(WORDS);
  const view = new DataView(raw.buffer, raw.byteOffset, raw.byteLength);
  for (let i = 0; i < WORDS; i++) s[i] = view.getUint32(i * 4, true);
  return s;
}

function rulesFromKey(k: Uint8Array, n: number): number[] {
  return Array.from(expand(k, 'bw:r:', n));
}

// ─── Keystream ───────────────────────────────────────────────────────────────

class Keystream {
  private state: State;
  private rules: number[];
  private step = 0;

  constructor(k1: Uint8Array, k2: Uint8Array) {
    this.state = stateFromKey(k1);
    this.rules = rulesFromKey(k2, 512);
  }

  private rule(): number {
    return this.rules[Math.floor(this.step / RULE_INTERVAL) % this.rules.length];
  }

  nextBytes(n: number): Uint8Array {
    const aligned = (n + 3) & ~3;
    const out = new Uint8Array(aligned);
    const view = new DataView(out.buffer);
    for (let off = 0; off < aligned; off += 4) {
      view.setUint32(off, this.state[WORDS >>> 1] >>> 0, true);
      this.state = evolve(this.state, this.rule());
      this.step++;
    }
    return out.slice(0, n);
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function toBytes(s: string): Uint8Array {
  return new TextEncoder().encode(s);
}

export function toHex(b: Uint8Array): string {
  return Array.from(b).map(x => x.toString(16).padStart(2, '0')).join('');
}

export function fromHex(hex: string): Uint8Array {
  const clean = hex.replace(/\s/g, '');
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  return out;
}

export function xor(a: Uint8Array, b: Uint8Array): Uint8Array {
  return a.map((byte, i) => byte ^ b[i]);
}

// ─── Variant 1: Stream cipher ─────────────────────────────────────────────────

export function encrypt(plaintext: Uint8Array, k1: Uint8Array, k2: Uint8Array): Uint8Array {
  const ks = new Keystream(k1, k2).nextBytes(plaintext.length);
  return xor(plaintext, ks);
}

export const decrypt = encrypt;

// ─── Variant 2: Davies-Meyer hash ────────────────────────────────────────────

function dmPad(data: Uint8Array): Uint8Array {
  const lenBytes = 8;
  const padLen = HASH_BLOCK - ((data.length + 1 + lenBytes) % HASH_BLOCK);
  const out = new Uint8Array(data.length + 1 + padLen + lenBytes);
  out.set(data);
  out[data.length] = 0x80;
  const bitLen = BigInt(data.length) * 8n;
  const view = new DataView(out.buffer);
  view.setBigUint64(out.length - lenBytes, bitLen, false);
  return out;
}

export function hash(data: Uint8Array, outputBits = 256): Uint8Array {
  if (outputBits % 8 !== 0) throw new Error('outputBits must be a multiple of 8');

  const padded = dmPad(data);
  let H: Uint8Array = new Uint8Array(HASH_BLOCK);

  for (let off = 0; off < padded.length; off += HASH_BLOCK) {
    const M = padded.slice(off, off + HASH_BLOCK);
    const ks = new Keystream(M, H).nextBytes(HASH_BLOCK);
    H = xor(H, ks);
  }

  if (outputBits / 8 <= HASH_BLOCK) return H.slice(0, outputBits / 8);

  const parts: Uint8Array[] = [H];
  let prev: Uint8Array = H;
  let got = HASH_BLOCK;
  let idx = 0;
  while (got < outputBits / 8) {
    const ext = new Uint8Array([...prev, 0xff, idx++ & 0xff]);
    prev = hash(ext, 256);
    parts.push(prev);
    got += HASH_BLOCK;
  }
  const all = new Uint8Array(parts.reduce((s, p) => s + p.length, 0));
  let pos = 0;
  for (const p of parts) { all.set(p, pos); pos += p.length; }
  return all.slice(0, outputBits / 8);
}

// ─── Variant 3: MAC ──────────────────────────────────────────────────────────

export function mac(data: Uint8Array, key: Uint8Array, outputBits = 256): Uint8Array {
  const innerLabel = new TextEncoder().encode('bw:inner');
  const outerLabel = new TextEncoder().encode('bw:outer');
  const inner = hash(new Uint8Array([...key, ...innerLabel, ...data]));
  return hash(new Uint8Array([...key, ...outerLabel, ...inner]), outputBits);
}
