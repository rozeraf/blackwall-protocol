<template>
  <div class="mac-tab">
    <div class="tab-header">
      <h1 class="tab-title">MAC</h1>
      <p class="tab-desc">
        Message Authentication Code — double-pass keyed hash (HMAC-like construction).
        Irreversible without the key. Verifies both integrity and authenticity.
      </p>
    </div>

    <div class="grid">
      <div class="col-left">
        <Panel icon="📝" title="Message">
          <textarea
            v-model="message"
            class="field-textarea"
            placeholder="Enter message to authenticate…"
            rows="5"
          />
        </Panel>

        <Panel icon="🔑" title="Key">
          <div class="field-group">
            <label class="field-label">Secret Key</label>
            <input v-model="key" class="field-input" placeholder="SECRET_KEY" type="password" />
            <button class="show-toggle" @click="showKey = !showKey">
              {{ showKey ? 'Hide' : 'Show' }} key
            </button>
            <input
              v-if="showKey"
              v-model="key"
              class="field-input"
              placeholder="SECRET_KEY"
              style="margin-top:8px"
            />
          </div>
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

        <button class="run-btn" @click="run" :disabled="!canRun || running">
          <span>🔐</span> {{ running ? 'Computing…' : 'Generate MAC' }}
        </button>

        <button class="demo-btn" @click="loadDemo">Load demo values</button>
      </div>

      <div class="col-right">
        <Panel icon="📤" :title="`MAC Output (${bits}-bit)`">
          <HexOutput :value="result" label="mac(message, key)" placeholder="MAC appears here…" />
        </Panel>

        <!-- Verify panel -->
        <Panel icon="✅" title="Verify MAC">
          <p class="verify-desc">Paste a MAC to verify against the current message + key:</p>
          <input v-model="verifyInput" class="field-input" placeholder="Paste MAC hex to verify…" />
          <div class="verify-result" v-if="verifyResult !== null">
            <span :class="['verify-badge', verifyResult ? 'ok' : 'fail']">
              {{ verifyResult ? '✓ VALID MAC' : '✗ INVALID MAC' }}
            </span>
          </div>
          <button class="verify-btn" @click="verify" :disabled="!verifyInput.trim() || !result">
            Verify
          </button>
        </Panel>

        <!-- Sensitivity demo -->
        <Panel icon="🧪" title="Key Sensitivity" v-if="altResult">
          <p class="alt-desc">Same message, different key (key + "!"):</p>
          <HexOutput :value="altResult" label="mac(message, key + '!')" />
          <div class="diff-badge" v-if="result && altResult">
            <span class="badge badge-ok">✓ Different keys → different MAC</span>
          </div>
        </Panel>

        <div class="stats" v-if="result">
          <div class="stat">
            <span class="stat-label">Msg bytes</span>
            <span class="stat-value">{{ msgLen }}</span>
          </div>
          <div class="stat">
            <span class="stat-label">Key bytes</span>
            <span class="stat-value">{{ keyLen }}</span>
          </div>
          <div class="stat">
            <span class="stat-label">Time</span>
            <span class="stat-value">{{ elapsed }}ms</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import Panel     from './Panel.vue';
import HexOutput from './HexOutput.vue';
import { mac, toBytes, toHex } from '../lib/blackwall';

const message     = ref('');
const key         = ref('');
const bits        = ref<256 | 512>(256);
const result      = ref('');
const altResult   = ref('');
const running     = ref(false);
const elapsed     = ref(0);
const msgLen      = ref(0);
const keyLen      = ref(0);
const showKey     = ref(false);
const verifyInput = ref('');
const verifyResult = ref<boolean | null>(null);

const canRun = computed(() => message.value.trim() && key.value.trim());

async function run() {
  if (!canRun.value || running.value) return;
  running.value = true;
  verifyResult.value = null;
  await new Promise(r => setTimeout(r, 0));

  const t0 = performance.now();
  const msgBytes = toBytes(message.value);
  const keyBytes = toBytes(key.value);
  msgLen.value = msgBytes.length;
  keyLen.value = keyBytes.length;

  result.value  = toHex(mac(msgBytes, keyBytes, bits.value));

  // Alt key for sensitivity demo
  const altKey  = new Uint8Array([...keyBytes, 0x21]);
  altResult.value = toHex(mac(msgBytes, altKey, bits.value));

  elapsed.value = Math.round(performance.now() - t0);
  running.value = false;
}

function verify() {
  if (!verifyInput.value.trim() || !result.value) return;
  verifyResult.value = verifyInput.value.trim().toLowerCase() === result.value.toLowerCase();
}

function loadDemo() {
  message.value = 'BLACKWALL PROTOCOL BREACH DETECTED';
  key.value = 'DEADBEEF_BLACKWALL_KEY_ONE';
}
</script>

<style scoped>
.mac-tab { display: flex; flex-direction: column; gap: 28px; }
.tab-header { margin-bottom: 4px; }
.tab-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-bright);
  letter-spacing: 0.01em;
  margin-bottom: 8px;
  text-transform: uppercase;
}
.tab-desc { font-size: 13px; color: var(--text-dim); line-height: 1.65; max-width: 520px; }

.grid {
  display: grid;
  grid-template-columns: 380px 1fr;
  gap: 18px;
  align-items: start;
}
@media (max-width: 800px) { .grid { grid-template-columns: 1fr; } }

.col-left, .col-right { display: flex; flex-direction: column; gap: 14px; }

.field-label {
  font-family: var(--mono);
  font-size: 9px;
  font-weight: 600;
  color: var(--text-dim);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  margin-bottom: 5px;
  display: block;
}
.field-textarea, .field-input {
  width: 100%;
  background: var(--bg-elevated);
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
.field-textarea:focus, .field-input:focus {
  box-shadow: var(--glow-focus);
}
.field-textarea::placeholder, .field-input::placeholder { color: var(--text-muted); }

.field-group { display: flex; flex-direction: column; gap: 0; }
.show-toggle {
  align-self: flex-start;
  margin-top: 6px;
  padding: 4px 10px;
  background: transparent;
  border-radius: var(--radius);
  color: var(--text-dim);
  font-family: var(--mono);
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.18s ease;
}
.show-toggle:hover { background: var(--bg-elevated); color: var(--text); box-shadow: var(--glow-hover); }

.bits-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.bits-toggle {
  display: flex;
  background: var(--bg-elevated);
  border-radius: var(--radius);
  padding: 2px;
  gap: 2px;
  box-shadow: var(--shadow-input);
}
.bits-toggle button {
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
.bits-toggle button.active {
  background: rgba(200, 16, 46, 0.18);
  color: var(--accent-bright);
  box-shadow: 0 0 8px rgba(200, 16, 46, 0.20);
}

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
  background: rgba(200, 16, 46, 0.22);
  box-shadow: var(--glow-active);
  color: var(--text-bright);
}
.run-btn:disabled { opacity: 0.28; cursor: not-allowed; }

.demo-btn {
  align-self: flex-start;
  padding: 7px 14px;
  background: transparent;
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
  box-shadow: var(--glow-hover);
  color: var(--text);
}

/* ── Verify ─────────────────────────────── */
.verify-desc { font-size: 12px; color: var(--text-dim); margin-bottom: 8px; line-height: 1.55; }
.verify-result { margin-top: 8px; }
.verify-badge {
  display: inline-block;
  padding: 5px 14px;
  border-radius: var(--radius);
  font-family: var(--mono);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  background: var(--bg-surface);
}
.verify-badge.ok   { color: var(--success); background: rgba(61, 220, 132, 0.08); box-shadow: 0 0 10px rgba(61,220,132,0.12); }
.verify-badge.fail { color: var(--danger);  background: rgba(239, 68, 68, 0.08);  box-shadow: 0 0 10px rgba(239,68,68,0.12); }

.verify-btn {
  margin-top: 10px;
  padding: 8px 16px;
  background: var(--bg-surface);
  border: none;
  border-radius: var(--radius);
  color: var(--text-dim);
  font-family: var(--mono);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.18s ease;
  display: block;
}
.verify-btn:hover:not(:disabled) {
  background: var(--bg-elevated);
  box-shadow: var(--glow-hover);
  color: var(--text);
}
.verify-btn:disabled { opacity: 0.30; cursor: not-allowed; }

.alt-desc { font-size: 12px; color: var(--text-dim); margin-bottom: 10px; line-height: 1.55; }
.diff-badge { margin-top: 8px; }
.badge {
  padding: 5px 10px;
  border-radius: var(--radius);
  font-family: var(--mono);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  background: var(--bg-surface);
  display: inline-block;
}
.badge-ok { color: var(--success); background: rgba(61, 220, 132, 0.07); box-shadow: 0 0 10px rgba(61,220,132,0.12); }

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
</style>

