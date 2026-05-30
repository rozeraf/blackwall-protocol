import { WORDS, evolve } from "./ca";
import { RULE_INTERVAL, stateFromKey, rulesFromKey } from "./kdf";
import type { State } from "./types";

// ─── Keystream ────────────────────────────────────────────────────────────────

export class Keystream {
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
