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
  font-size: 20px;
  font-weight: 700;
  color: var(--text-bright);
  letter-spacing: 0.01em;
  margin-bottom: 8px;
  text-transform: uppercase;
}
.tab-desc {
  font-size: 13px;
  color: var(--text-dim);
  line-height: 1.65;
  max-width: 520px;
}

.grid {
  display: grid;
  grid-template-columns: 380px 1fr;
  gap: 18px;
  align-items: start;
}
@media (max-width: 800px) { .grid { grid-template-columns: 1fr; } }

.col-left, .col-right { display: flex; flex-direction: column; gap: 14px; }

.input-row, .bits-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}
.field-label {
  font-family: var(--mono);
  font-size: 9px;
  font-weight: 600;
  color: var(--text-dim);
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.type-switch, .bits-toggle {
  display: flex;
  background: var(--bg-elevated);
  border-radius: var(--radius);
  padding: 2px;
  gap: 2px;
  box-shadow: var(--shadow-input);
}
.type-switch button, .bits-toggle button {
  padding: 4px 12px;
  background: none;
  border: none;
  border-radius: calc(var(--radius) - 2px);
  color: var(--text-dim);
  font-family: var(--mono);
  font-size: 10px;
  cursor: pointer;
  transition: all 0.15s;
}
.type-switch button.active, .bits-toggle button.active {
  background: rgba(200, 16, 46, 0.18);
  color: var(--accent-bright);
  box-shadow: 0 0 8px rgba(200, 16, 46, 0.20);
}

.field-textarea {
  width: 100%;
  background: var(--bg-elevated);
  border: none;
  border-radius: var(--radius);
  color: var(--text);
  font-family: var(--mono);
  font-size: 13px;
  line-height: 1.55;
  padding: 12px 14px;
  outline: none;
  box-shadow: var(--shadow-input);
  transition: box-shadow 0.2s ease;
  resize: vertical;
}
.field-textarea:focus {
  box-shadow: var(--glow-focus);
}
.field-textarea::placeholder { color: var(--text-muted); }

.run-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px 20px;
  background: rgba(200, 16, 46, 0.10);
  border: none;
  border-radius: var(--radius-lg);
  color: var(--accent-bright);
  font-family: var(--body);
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.04em;
  cursor: pointer;
  transition: all 0.2s ease;
}
.run-btn:hover:not(:disabled) {
  background: rgba(200, 16, 46, 0.18);
  box-shadow: var(--glow-active);
  color: var(--text-bright);
}
.run-btn:disabled { opacity: 0.28; cursor: not-allowed; }

.demo-btn {
  align-self: flex-start;
  padding: 7px 14px;
  background: transparent;
  border: none;
  border-radius: var(--radius);
  color: var(--text-dim);
  font-family: var(--mono);
  font-size: 10px;
  cursor: pointer;
  transition: all 0.18s ease;
  letter-spacing: 0.04em;
}
.demo-btn:hover {
  background: var(--bg-elevated);
  color: var(--text);
  box-shadow: var(--glow-hover);
}

/* ── Avalanche ─────────────────────────── */
.avl-desc {
  font-size: 12px;
  color: var(--text-dim);
  margin-bottom: 12px;
  line-height: 1.55;
}
.avl-desc code {
  color: var(--text);
  font-family: var(--mono);
  background: var(--bg-elevated);
  padding: 1px 6px;
  border-radius: 3px;
  box-shadow: var(--shadow-input);
}
.avl-stats { margin-top: 14px; display: flex; flex-direction: column; gap: 8px; }
.avl-bar-wrap {
  height: 5px;
  background: var(--bg-elevated);
  border-radius: 3px;
  overflow: hidden;
}
.avl-bar {
  height: 100%;
  background: linear-gradient(90deg, var(--accent-dim), var(--accent-bright));
  border-radius: 3px;
  transition: width 0.7s cubic-bezier(0.4,0,0.2,1);
  box-shadow: 0 0 8px rgba(200, 16, 46, 0.5);
}
.avl-numbers {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.avl-flipped { font-family: var(--mono); font-size: 12px; color: var(--text); }
.avl-verdict { font-family: var(--mono); font-size: 12px; font-weight: 600; }
.avl-verdict.good { color: var(--success); }
.avl-verdict.warn { color: var(--warning); }

/* ── Stats ─────────────────────────────── */
.stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
}
.stat {
  background: var(--bg-surface);
  border-radius: var(--radius-lg);
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 5px;
  box-shadow: var(--shadow-panel);
}
.stat-label {
  font-family: var(--mono);
  font-size: 9px;
  color: var(--text-muted);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.stat-value {
  font-family: var(--mono);
  font-size: 15px;
  color: var(--text-bright);
  font-weight: 500;
}

/* ── Badges ────────────────────────────── */
.badge-row { display: flex; gap: 8px; flex-wrap: wrap; }
.badge {
  padding: 5px 12px;
  border-radius: var(--radius);
  font-family: var(--mono);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  background: var(--bg-surface);
  box-shadow: var(--shadow-panel);
}
.badge-ok   { color: var(--success); background: rgba(61, 220, 132, 0.07); box-shadow: 0 0 10px rgba(61, 220, 132, 0.12); }
.badge-fail { color: var(--danger);  background: rgba(239, 68, 68, 0.07);  box-shadow: 0 0 10px rgba(239, 68, 68, 0.12); }
.badge-info { color: var(--text-dim); }
</style>

