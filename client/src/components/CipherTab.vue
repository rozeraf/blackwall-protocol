<template>
  <div class="cipher-tab">
    <div class="tab-header">
      <h1 class="tab-title">Stream Cipher</h1>
      <p class="tab-desc">
        XOR-based stream cipher built on the 1024-bit CA keystream.
        Encryption and decryption are symmetric — same operation with the same keys.
      </p>
    </div>

    <div class="grid">
      <!-- ── Left: Inputs ──────────────────────── -->
      <div class="col">
        <!-- Mode toggle -->
        <div class="mode-toggle">
          <button :class="['mode-btn', { active: mode === 'encrypt' }]" @click="mode = 'encrypt'; result = ''">
            ⚡ Encrypt
          </button>
          <button :class="['mode-btn', { active: mode === 'decrypt' }]" @click="mode = 'decrypt'; result = ''">
            🔓 Decrypt
          </button>
        </div>

        <Panel icon="📝" title="Message">
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
            :placeholder="mode === 'encrypt'
              ? 'Enter plaintext…'
              : (inputType === 'hex' ? 'Paste hex ciphertext…' : 'Paste ciphertext…')"
            rows="4"
          />
        </Panel>

        <Panel icon="🗝️" title="Keys">
          <div class="field-group">
            <label class="field-label">Key 1 (k1)</label>
            <input v-model="k1" class="field-input" placeholder="DEADBEEF_KEY_ONE" />
          </div>
          <div class="field-group" style="margin-top:12px">
            <label class="field-label">Key 2 (k2)</label>
            <input v-model="k2" class="field-input" placeholder="CAFEBABE_KEY_TWO" />
          </div>
        </Panel>

        <button class="run-btn" @click="run" :disabled="!canRun || running">
          <span class="run-icon">{{ running ? '⟳' : (mode === 'encrypt' ? '⚡' : '🔓') }}</span>
          {{ running ? 'Processing…' : (mode === 'encrypt' ? 'Encrypt' : 'Decrypt') }}
        </button>
      </div>

      <!-- ── Right: Output ─────────────────────── -->
      <div class="col">
        <Panel icon="📤" title="Output">
          <template #header-extra>
            <div class="output-type-toggle" v-if="result">
              <button :class="{ active: outputView === 'hex' }"  @click="outputView = 'hex'">hex</button>
              <button :class="{ active: outputView === 'text' }" @click="outputView = 'text'">text</button>
            </div>
          </template>

          <HexOutput
            v-if="outputView === 'hex'"
            :value="result"
            :placeholder="mode === 'encrypt' ? 'Ciphertext appears here' : 'Plaintext appears here'"
          />
          <div v-else class="text-output">
            {{ resultText || '—' }}
          </div>
        </Panel>

        <!-- Stats -->
        <div class="stats" v-if="result">
          <div class="stat">
            <span class="stat-label">Input bytes</span>
            <span class="stat-value">{{ inputBytes }}</span>
          </div>
          <div class="stat">
            <span class="stat-label">Output bytes</span>
            <span class="stat-value">{{ result.length / 2 }}</span>
          </div>
          <div class="stat">
            <span class="stat-label">Operation</span>
            <span class="stat-value accent">{{ mode.toUpperCase() }}</span>
          </div>
          <div class="stat">
            <span class="stat-label">Time</span>
            <span class="stat-value">{{ elapsed }}ms</span>
          </div>
        </div>

        <!-- Wrong key demo -->
        <Panel icon="🔴" title="Wrong Key Demo" v-if="wrongKeyResult">
          <p class="demo-note">Decrypted with swapped keys (k2, k1) — garbage output:</p>
          <HexOutput :value="wrongKeyResult" />
        </Panel>

        <button class="demo-btn" @click="loadDemo" v-if="mode === 'encrypt' && !result">
          Load demo values
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import Panel     from './Panel.vue';
import HexOutput from './HexOutput.vue';
import { encrypt, decrypt, toBytes, toHex, fromHex } from '../lib/blackwall';

const mode        = ref<'encrypt' | 'decrypt'>('encrypt');
const inputType   = ref<'text' | 'hex'>('text');
const message     = ref('');
const k1          = ref('');
const k2          = ref('');
const result      = ref('');
const resultText  = ref('');
const running     = ref(false);
const elapsed     = ref(0);
const outputView  = ref<'hex' | 'text'>('hex');
const wrongKeyResult = ref('');
const inputBytes  = ref(0);

const canRun = computed(() => message.value.trim() && k1.value.trim() && k2.value.trim());

function getInputBytes(): Uint8Array {
  if (mode.value === 'decrypt' && inputType.value === 'hex') {
    return fromHex(message.value.trim());
  }
  return toBytes(message.value);
}

async function run() {
  if (!canRun.value) return;
  running.value = true;
  wrongKeyResult.value = '';

  await new Promise(r => setTimeout(r, 0)); // yield to UI

  const t0 = performance.now();
  const msgBytes = getInputBytes();
  inputBytes.value = msgBytes.length;
  const bk1 = toBytes(k1.value);
  const bk2 = toBytes(k2.value);

  const fn = mode.value === 'encrypt' ? encrypt : decrypt;
  const out = fn(msgBytes, bk1, bk2);
  result.value = toHex(out);

  // Try to decode as text for the "text" view
  try { resultText.value = new TextDecoder('utf-8', { fatal: true }).decode(out); }
  catch { resultText.value = '[binary — not valid UTF-8]'; }

  // Wrong key demo (only for encrypt)
  if (mode.value === 'encrypt') {
    const wrong = decrypt(out, bk2, bk1);
    wrongKeyResult.value = toHex(wrong);
  }

  elapsed.value = Math.round(performance.now() - t0);
  running.value = false;
}

function loadDemo() {
  message.value = 'BLACKWALL PROTOCOL BREACH DETECTED';
  k1.value = 'DEADBEEF_BLACKWALL_KEY_ONE';
  k2.value = 'CAFEBABE_BLACKWALL_KEY_TWO';
}
</script>

<style scoped>
.cipher-tab { display: flex; flex-direction: column; gap: 24px; }

.tab-header { margin-bottom: 4px; }
.tab-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-bright);
  letter-spacing: -0.01em;
  margin-bottom: 6px;
}
.tab-desc {
  font-size: 13px;
  color: var(--text-dim);
  line-height: 1.6;
  max-width: 520px;
}

.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
@media (max-width: 720px) {
  .grid { grid-template-columns: 1fr; }
}

.col { display: flex; flex-direction: column; gap: 12px; }

/* Mode toggle */
.mode-toggle {
  display: flex;
  background: var(--bg-offset);
  border-radius: var(--radius-lg);
  padding: 4px;
  gap: 4px;
}
.mode-btn {
  flex: 1;
  padding: 10px;
  background: transparent;
  border: none;
  border-radius: var(--radius);
  color: var(--text-dim);
  font-family: var(--body);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}
.mode-btn.active {
  background: var(--bg-hover);
  color: var(--text-bright);
}

/* Field row header */
.input-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}
.field-label {
  font-family: var(--mono);
  font-size: 10px;
  color: var(--text-dim);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

/* Segmented controls */
.type-switch, .output-type-toggle {
  display: flex;
  background: var(--bg-input);
  border-radius: var(--radius);
  padding: 2px;
  gap: 2px;
}
.type-switch button, .output-type-toggle button {
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
.type-switch button.active, .output-type-toggle button.active {
  background: var(--bg-hover);
  color: var(--text-bright);
}

/* Inputs */
.field-textarea, .field-input {
  width: 100%;
  background: var(--bg-input);
  border: none;
  border-radius: var(--radius);
  color: var(--text);
  font-family: var(--mono);
  font-size: 13px;
  line-height: 1.5;
  padding: 12px 14px;
  outline: none;
  transition: background 0.15s;
  resize: vertical;
}
.field-textarea:focus, .field-input:focus {
  background: var(--bg-hover);
}
.field-textarea::placeholder, .field-input::placeholder {
  color: var(--text-muted);
}

.field-group { display: flex; flex-direction: column; gap: 6px; }

/* Run button */
.run-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px 20px;
  background: var(--accent-mute);
  border: none;
  border-radius: var(--radius-lg);
  color: var(--accent);
  font-family: var(--body);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}
.run-btn:hover:not(:disabled) {
  background: var(--accent);
  color: var(--text-bright);
}
.run-btn:disabled { opacity: 0.35; cursor: not-allowed; }
.run-icon { font-size: 14px; }

/* Output */
.text-output {
  font-family: var(--mono);
  font-size: 13px;
  color: var(--text);
  word-break: break-all;
  min-height: 48px;
  line-height: 1.6;
}

/* Stats row */
.stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
}
.stat {
  background: var(--bg-offset);
  border-radius: var(--radius-lg);
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.stat-label {
  font-family: var(--mono);
  font-size: 9px;
  color: var(--text-muted);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.stat-value {
  font-family: var(--mono);
  font-size: 15px;
  color: var(--text-bright);
  font-weight: 500;
}
.stat-value.accent { color: var(--accent); }

.demo-note {
  font-size: 12px;
  color: var(--text-dim);
  margin-bottom: 8px;
}

.demo-btn {
  align-self: flex-start;
  padding: 8px 16px;
  background: var(--bg-offset);
  border: none;
  border-radius: var(--radius);
  color: var(--text-dim);
  font-family: var(--mono);
  font-size: 11px;
  cursor: pointer;
  transition: all 0.15s;
}
.demo-btn:hover { background: var(--bg-hover); color: var(--text-bright); }
</style>

