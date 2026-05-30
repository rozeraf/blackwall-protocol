<template>
  <div class="hash-tab">
    <div class="tab-header">
      <h1 class="tab-title">Davies-Meyer Hash</h1>
      <p class="tab-desc">
        One-way hash function using the CA stream cipher as a block cipher.
        No key required. Supports 256-bit and 512-bit output.
      </p>
    </div>

    <div class="grid">
      <div class="col-left">
        <Panel icon="📝" title="Input">
          <div class="input-row">
            <label class="field-label">Input type</label>
            <div class="type-switch">
              <button :class="{ active: inputType === 'text' }" @click="inputType = 'text'">text</button>
              <button :class="{ active: inputType === 'hex' }"  @click="inputType = 'hex'">hex</button>
            </div>
          </div>
          <textarea
            v-model="message"
            class="field-textarea"
            placeholder="Enter message to hash…"
            rows="5"
          />
        </Panel>

        <Panel icon="⚙️" title="Options">
          <div class="bits-row">
            <label class="field-label">Output size</label>
            <div class="bits-toggle">
              <button :class="{ active: bits === 256 }" @click="bits = 256">256-bit</button>
              <button :class="{ active: bits === 512 }" @click="bits = 512">512-bit</button>
            </div>
          </div>
        </Panel>

        <button class="run-btn" @click="run" :disabled="!message.trim() || running">
          <span>◈</span> {{ running ? 'Hashing…' : 'Compute Hash' }}
        </button>

        <button class="demo-btn" @click="loadDemo">Load demo values</button>
      </div>

      <div class="col-right">
        <Panel icon="📤" :title="`Hash output (${bits}-bit)`">
          <HexOutput :value="result" placeholder="Hash appears here…" />
        </Panel>

        <!-- Avalanche effect -->
        <Panel icon="🌊" title="Avalanche Test" v-if="avalanche !== null">
          <p class="avl-desc">Input with one extra character (<code>!</code> appended) vs original:</p>
          <HexOutput :value="altResult" label="H(message + '!')" />
          <div class="avl-stats">
            <div class="avl-bar-wrap">
              <div class="avl-bar" :style="{ width: avalanchePct + '%' }"></div>
            </div>
            <div class="avl-numbers">
              <span class="avl-flipped">{{ avalanche }}/{{ bits }} bits flipped</span>
              <span :class="['avl-verdict', avalancheGood ? 'good' : 'warn']">
                {{ avalanchePct.toFixed(1) }}% · {{ avalancheGood ? '✓ IDEAL' : '⚠ WEAK' }}
              </span>
            </div>
          </div>
        </Panel>

        <!-- Stats -->
        <div class="stats" v-if="result">
          <div class="stat">
            <span class="stat-label">Input bytes</span>
            <span class="stat-value">{{ inputLen }}</span>
          </div>
          <div class="stat">
            <span class="stat-label">Output bytes</span>
            <span class="stat-value">{{ bits / 8 }}</span>
          </div>
          <div class="stat">
            <span class="stat-label">Time</span>
            <span class="stat-value">{{ elapsed }}ms</span>
          </div>
        </div>

        <!-- Determinism badge -->
        <div class="badge-row" v-if="deterministicOk !== null">
          <div :class="['badge', deterministicOk ? 'badge-ok' : 'badge-fail']">
            {{ deterministicOk ? '✓ Deterministic' : '✗ Non-deterministic' }}
          </div>
          <div class="badge badge-info">H(∅) ≠ H(msg)</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import Panel     from './Panel.vue';
import HexOutput from './HexOutput.vue';
import { hash, toBytes, toHex, fromHex } from '../lib/blackwall';

const message     = ref('');
const inputType   = ref<'text' | 'hex'>('text');
const bits        = ref<256 | 512>(256);
const result      = ref('');
const altResult   = ref('');
const avalanche   = ref<number | null>(null);
const elapsed     = ref(0);
const running     = ref(false);
const inputLen    = ref(0);
const deterministicOk = ref<boolean | null>(null);

const avalanchePct  = ref(0);
const avalancheGood = ref(false);

function getBytes(): Uint8Array {
  return inputType.value === 'hex' ? fromHex(message.value.trim()) : toBytes(message.value);
}

function hammingDistance(a: Uint8Array, b: Uint8Array): number {
  let bits = 0;
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    let x = a[i] ^ b[i];
    while (x) { bits += x & 1; x >>>= 1; }
  }
  return bits;
}

async function run() {
  if (!message.value.trim() || running.value) return;
  running.value = true;
  await new Promise(r => setTimeout(r, 0));

  const t0   = performance.now();
  const data  = getBytes();
  inputLen.value = data.length;

  // Main hash
  const h = hash(data, bits.value);
  result.value = toHex(h);

  // Alt hash for avalanche
  const alt  = new Uint8Array([...data, 0x21]); // append '!'
  const hAlt = hash(alt, bits.value);
  altResult.value = toHex(hAlt);

  // Avalanche
  const hd = hammingDistance(h, hAlt);
  avalanche.value = hd;
  avalanchePct.value = (hd / bits.value) * 100;
  avalancheGood.value = hd > (bits.value * 0.375) && hd < (bits.value * 0.625);

  // Determinism: rehash and compare
  const h2 = hash(data, bits.value);
  deterministicOk.value = toHex(h2) === result.value;

  elapsed.value = Math.round(performance.now() - t0);
  running.value = false;
}

function loadDemo() {
  message.value = 'BLACKWALL PROTOCOL BREACH DETECTED';
  inputType.value = 'text';
}
</script>

<style scoped>
.hash-tab { display: flex; flex-direction: column; gap: 28px; }
.tab-header { margin-bottom: 4px; }
.tab-title {
  font-family: var(--sans);
  font-size: 28px;
  font-weight: 700;
  color: var(--text-bright);
  letter-spacing: 2px;
  margin-bottom: 8px;
}
.tab-desc { font-size: 14px; color: var(--text-dim); line-height: 1.6; max-width: 600px; }

.grid {
  display: grid;
  grid-template-columns: 380px 1fr;
  gap: 20px;
  align-items: start;
}
@media (max-width: 800px) { .grid { grid-template-columns: 1fr; } }

.col-left, .col-right { display: flex; flex-direction: column; gap: 14px; }

.input-row, .bits-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}
.field-label {
  font-family: var(--mono);
  font-size: 10px;
  color: var(--text-dim);
  letter-spacing: 1.5px;
  text-transform: uppercase;
}
.type-switch, .bits-toggle {
  display: flex;
  gap: 4px;
  background: rgba(0,0,0,0.4);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 3px;
}
.type-switch button, .bits-toggle button {
  padding: 4px 12px;
  background: none;
  border: none;
  border-radius: 4px;
  color: var(--text-dim);
  font-family: var(--mono);
  font-size: 10px;
  cursor: pointer;
  transition: all 0.2s;
}
.type-switch button.active, .bits-toggle button.active {
  background: rgba(0, 255, 180, 0.15);
  color: var(--accent);
}
.field-textarea {
  width: 100%;
  background: rgba(0,0,0,0.5);
  border: 1px solid var(--border);
  border-radius: 8px;
  color: var(--text);
  font-family: var(--mono);
  font-size: 13px;
  padding: 10px 12px;
  outline: none;
  transition: border-color 0.2s;
  resize: vertical;
}
.field-textarea:focus { border-color: var(--border-hi); }
.field-textarea::placeholder { color: var(--text-dim); }

.run-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 14px;
  background: linear-gradient(135deg, rgba(0,255,180,0.15), rgba(0,207,255,0.1));
  border: 1px solid var(--border-hi);
  border-radius: var(--radius);
  color: var(--accent);
  font-family: var(--sans);
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 2px;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: var(--glow-sm);
}
.run-btn:hover:not(:disabled) { box-shadow: var(--glow); }
.run-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.demo-btn {
  align-self: flex-start;
  padding: 8px 16px;
  background: none;
  border: 1px solid var(--border);
  border-radius: 6px;
  color: var(--text-dim);
  font-family: var(--mono);
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s;
  letter-spacing: 1px;
}
.demo-btn:hover { border-color: var(--accent); color: var(--accent); }

/* Avalanche */
.avl-desc {
  font-size: 12px;
  color: var(--text-dim);
  margin-bottom: 12px;
}
.avl-desc code {
  color: var(--accent2);
  font-family: var(--mono);
  background: rgba(0,207,255,0.1);
  padding: 1px 5px;
  border-radius: 3px;
}
.avl-stats { margin-top: 14px; display: flex; flex-direction: column; gap: 8px; }
.avl-bar-wrap {
  height: 6px;
  background: rgba(255,255,255,0.06);
  border-radius: 3px;
  overflow: hidden;
}
.avl-bar {
  height: 100%;
  background: linear-gradient(90deg, var(--accent), var(--accent2));
  border-radius: 3px;
  transition: width 0.6s ease;
}
.avl-numbers {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.avl-flipped { font-family: var(--mono); font-size: 12px; color: var(--text); }
.avl-verdict { font-family: var(--mono); font-size: 12px; }
.avl-verdict.good { color: var(--accent); }
.avl-verdict.warn { color: #ffb800; }

.stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}
.stat {
  background: rgba(0,0,0,0.3);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.stat-label { font-family: var(--mono); font-size: 9px; color: var(--text-dim); letter-spacing: 1px; text-transform: uppercase; }
.stat-value { font-family: var(--mono); font-size: 16px; color: var(--text-bright); font-weight: bold; }

.badge-row { display: flex; gap: 8px; flex-wrap: wrap; }
.badge {
  padding: 6px 12px;
  border-radius: 6px;
  font-family: var(--mono);
  font-size: 11px;
  letter-spacing: 1px;
  border: 1px solid;
}
.badge-ok    { color: var(--accent);  border-color: rgba(0,255,180,0.3); background: rgba(0,255,180,0.07); }
.badge-fail  { color: var(--danger);  border-color: rgba(255,69,96,0.3);  background: rgba(255,69,96,0.07); }
.badge-info  { color: var(--accent2); border-color: rgba(0,207,255,0.3);  background: rgba(0,207,255,0.07); }
</style>
