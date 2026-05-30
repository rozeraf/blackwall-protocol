import type { State } from "./types";

// ─── Constants ────────────────────────────────────────────────────────────────

export const WIDTH = 1024;       // CA width in bits
export const WORDS = WIDTH / 32; // 32 uint32 words

// ─── CA core ──────────────────────────────────────────────────────────────────

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
export function evolve(s: State, rule: number): State {
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
