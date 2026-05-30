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

.field-label {
  font-family: var(--mono);
  font-size: 10px;
  color: var(--text-dim);
  letter-spacing: 1.5px;
  text-transform: uppercase;
  margin-bottom: 6px;
  display: block;
}
.field-textarea, .field-input {
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
.field-textarea:focus, .field-input:focus { border-color: var(--border-hi); }
.field-textarea::placeholder, .field-input::placeholder { color: var(--text-dim); }

.field-group { display: flex; flex-direction: column; gap: 0; }
.show-toggle {
  align-self: flex-start;
  margin-top: 6px;
  padding: 4px 10px;
  background: none;
  border: 1px solid var(--border);
  border-radius: 4px;
  color: var(--text-dim);
  font-family: var(--mono);
  font-size: 10px;
  cursor: pointer;
  transition: all 0.2s;
}
.show-toggle:hover { border-color: var(--accent); color: var(--accent); }

.bits-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.bits-toggle {
  display: flex;
  gap: 4px;
  background: rgba(0,0,0,0.4);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 3px;
}
.bits-toggle button {
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
.bits-toggle button.active { background: rgba(255,30,40,0.15); color: var(--accent); }

.run-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 14px;
  background: linear-gradient(135deg, rgba(255,30,40,0.15), rgba(255,74,90,0.06));
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

/* Verify */
.verify-desc { font-size: 12px; color: var(--text-dim); margin-bottom: 10px; }
.verify-result { margin-top: 10px; }
.verify-badge {
  display: inline-block;
  padding: 6px 14px;
  border-radius: 6px;
  font-family: var(--mono);
  font-size: 12px;
  letter-spacing: 1px;
  font-weight: bold;
}
.verify-badge.ok   { background: rgba(255,30,40,0.1); color: var(--accent); border: 1px solid rgba(255,30,40,0.3); }
.verify-badge.fail { background: rgba(255,69,96,0.1); color: var(--danger); border: 1px solid rgba(255,69,96,0.3); }
.verify-btn {
  margin-top: 10px;
  padding: 8px 20px;
  background: none;
  border: 1px solid var(--border);
  border-radius: 6px;
  color: var(--text-dim);
  font-family: var(--mono);
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s;
  letter-spacing: 1px;
  display: block;
}
.verify-btn:hover:not(:disabled) { border-color: var(--accent2); color: var(--accent2); }
.verify-btn:disabled { opacity: 0.4; cursor: not-allowed; }

.alt-desc { font-size: 12px; color: var(--text-dim); margin-bottom: 12px; }
.diff-badge { margin-top: 10px; }
.badge { padding: 5px 12px; border-radius: 6px; font-family: var(--mono); font-size: 11px; letter-spacing: 1px; border: 1px solid; display: inline-block; }
.badge-ok { color: var(--accent); border-color: rgba(255,30,40,0.3); background: rgba(255,30,40,0.07); }

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
</style>
