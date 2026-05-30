<template>
  <div class="fp-tab">
    <div class="tab-header">
      <h1 class="tab-title">Fingerprint</h1>
      <p class="tab-desc">
        Visual fingerprint derived from the Blackwall hash. Each input produces a unique,
        symmetric image using cellular automaton patterns and deterministic color palettes.
      </p>
    </div>

    <div class="grid">
      <!-- ── Left: input ──────────────────────── -->
      <div class="col-left">
        <Panel icon="📝" title="Input">
          <div class="input-type-row">
            <label class="field-label">Source</label>
            <div class="type-switch">
              <button :class="{ active: source === 'text' }"  @click="source = 'text'">text</button>
              <button :class="{ active: source === 'file' }"  @click="source = 'file'">file</button>
            </div>
          </div>

          <textarea
            v-if="source === 'text'"
            v-model="message"
            class="field-textarea"
            placeholder="Enter text to fingerprint…"
            rows="5"
            @input="autoRun"
          />

          <div v-else class="file-drop" @drop.prevent="onDrop" @dragover.prevent @click="fileInput?.click()">
            <span class="file-icon">📁</span>
            <span v-if="fileName">{{ fileName }}</span>
            <span v-else>Drop file here or click to select</span>
            <input ref="fileInput" type="file" @change="onFileChange" style="display:none" />
          </div>
        </Panel>

        <button class="run-btn" @click="run" :disabled="!canRun || running">
          <span>◉</span> {{ running ? 'Rendering…' : 'Generate Fingerprint' }}
        </button>

        <button class="demo-btn" @click="loadDemo">Load demo text</button>

        <!-- Meta info -->
        <Panel icon="ℹ️" title="Fingerprint Info" v-if="fpResult">
          <div class="meta-list">
            <div class="meta-row">
              <span class="meta-key">Rule</span>
              <span class="meta-val">{{ fpResult.rule }}</span>
            </div>
            <div class="meta-row">
              <span class="meta-key">Palette</span>
              <span class="meta-val">{{ fpResult.paletteName }}</span>
            </div>
            <div class="meta-row">
              <span class="meta-key">CA Width</span>
              <span class="meta-val">64 cells</span>
            </div>
            <div class="meta-row">
              <span class="meta-key">Image</span>
              <span class="meta-val">256×256 px</span>
            </div>
            <div class="meta-row">
              <span class="meta-key">Symmetry</span>
              <span class="meta-val">4-fold mirror</span>
            </div>
          </div>
        </Panel>

        <!-- Hash output -->
        <Panel icon="◈" title="Hash (256-bit)" v-if="fpResult">
          <HexOutput :value="fpResult.hex" />
        </Panel>
      </div>

      <!-- ── Right: image ─────────────────────── -->
      <div class="col-right">
        <div class="fp-display" :class="{ 'has-result': !!fpResult, running }">
          <div class="fp-placeholder" v-if="!fpResult && !running">
            <div class="fp-ghost">
              <div class="fp-ghost-ring"></div>
              <div class="fp-ghost-ring r2"></div>
              <span class="fp-ghost-text">◉</span>
            </div>
            <p>Fingerprint appears here</p>
          </div>

          <div class="fp-loading" v-else-if="running">
            <div class="fp-spinner"></div>
            <span>Computing CA evolution…</span>
          </div>

          <div class="fp-result" v-else-if="fpResult">
            <img :src="fpResult.dataUrl" alt="Blackwall Fingerprint" class="fp-img" />
            <a :href="fpResult.dataUrl" :download="`blackwall-fp-${fpResult.hex.slice(0,8)}.png`" class="download-btn">
              ⬇ Download PNG
            </a>
          </div>
        </div>

        <!-- Palette preview -->
        <Panel icon="🎨" title="Color Palette" v-if="fpResult">
          <div class="palette-swatches">
            <div
              v-for="(color, i) in currentPalette"
              :key="i"
              class="swatch"
              :style="{ background: `rgb(${color[0]},${color[1]},${color[2]})` }"
              :title="`rgb(${color[0]},${color[1]},${color[2]})`"
            />
          </div>
          <p class="palette-name">{{ fpResult.paletteName }}</p>
        </Panel>

        <!-- Wolfram rule viz -->
        <Panel icon="⚙️" title="Wolfram Rule Visualization" v-if="fpResult">
          <div class="rule-viz">
            <div v-for="(bit, i) in ruleBits" :key="i" class="rule-cell">
              <div class="rule-pattern">
                <span v-for="(b, j) in pattern(7 - i)" :key="j" :class="['rule-bit', b ? 'on' : 'off']"></span>
              </div>
              <div :class="['rule-output', bit ? 'on' : 'off']"></div>
              <span class="rule-idx">{{ 7 - i }}</span>
            </div>
          </div>
          <p class="rule-desc">Rule {{ fpResult.rule }} — Wolfram Elementary CA</p>
        </Panel>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import Panel     from './Panel.vue';
import HexOutput from './HexOutput.vue';
import { hash, toBytes } from '../lib/blackwall';
import { renderFingerprint, type FingerprintResult } from '../lib/fingerprint';
import { PALETTES } from '../lib/palettes';

const source   = ref<'text' | 'file'>('text');
const message  = ref('');
const fileName = ref('');
const fileData = ref<Uint8Array | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);
const running  = ref(false);
const fpResult = ref<FingerprintResult | null>(null);

const canRun = computed(() => {
  if (source.value === 'text') return message.value.trim().length > 0;
  return fileData.value !== null;
});

const currentPalette = computed(() => {
  if (!fpResult.value) return [];
  const idx = ['purple + teal','amber + coral','blue + teal','pink + purple','green + amber','coral + pink']
    .indexOf(fpResult.value.paletteName);
  return idx >= 0 ? PALETTES[idx] : [];
});

const ruleBits = computed(() => {
  if (!fpResult.value) return [];
  return Array.from({ length: 8 }, (_, i) => (fpResult.value!.rule >> i) & 1);
});

function pattern(n: number): number[] {
  return [(n >> 2) & 1, (n >> 1) & 1, n & 1];
}

let autoTimer: ReturnType<typeof setTimeout> | null = null;
function autoRun() {
  if (autoTimer) clearTimeout(autoTimer);
  autoTimer = setTimeout(() => { if (message.value.trim()) run(); }, 600);
}

async function run() {
  if (!canRun.value || running.value) return;
  running.value = true;
  await new Promise(r => setTimeout(r, 20));

  const data = source.value === 'text' ? toBytes(message.value) : fileData.value!;
  const h = hash(data, 256);
  fpResult.value = renderFingerprint(h);

  running.value = false;
}

function onDrop(e: DragEvent) {
  const file = e.dataTransfer?.files[0];
  if (file) readFile(file);
}

function onFileChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (file) readFile(file);
}

function readFile(file: File) {
  fileName.value = file.name;
  const reader = new FileReader();
  reader.onload = (e) => {
    fileData.value = new Uint8Array(e.target!.result as ArrayBuffer);
    run();
  };
  reader.readAsArrayBuffer(file);
}

function loadDemo() {
  source.value = 'text';
  message.value = 'BLACKWALL PROTOCOL BREACH DETECTED';
  run();
}
</script>

<style scoped>
.fp-tab { display: flex; flex-direction: column; gap: 28px; }
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
  grid-template-columns: 360px 1fr;
  gap: 20px;
  align-items: start;
}
@media (max-width: 800px) { .grid { grid-template-columns: 1fr; } }

.col-left, .col-right { display: flex; flex-direction: column; gap: 14px; }

.input-type-row {
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
.type-switch {
  display: flex;
  gap: 4px;
  background: rgba(0,0,0,0.4);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 3px;
}
.type-switch button {
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
.type-switch button.active { background: rgba(255,30,40,0.15); color: var(--accent); }

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

.file-drop {
  border: 2px dashed var(--border);
  border-radius: 8px;
  padding: 32px 20px;
  text-align: center;
  color: var(--text-dim);
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}
.file-drop:hover { border-color: var(--border-hi); color: var(--text); }
.file-icon { font-size: 28px; }

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

/* Fingerprint display */
.fp-display {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  aspect-ratio: 1;
  max-width: 360px;
  margin: 0 auto;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
  overflow: hidden;
  position: relative;
}
.fp-display.has-result {
  border-color: rgba(255,30,40,0.3);
  box-shadow: 0 0 40px rgba(255,30,40,0.1), inset 0 0 40px rgba(0,0,0,0.4);
}

.fp-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  color: var(--text-dim);
  font-family: var(--mono);
  font-size: 12px;
  letter-spacing: 1px;
}
.fp-ghost { position: relative; width: 80px; height: 80px; display: flex; align-items: center; justify-content: center; }
.fp-ghost-ring {
  position: absolute;
  inset: 0;
  border: 1px solid rgba(255,30,40,0.2);
  border-radius: 50%;
  animation: ripple 3s ease-in-out infinite;
}
.fp-ghost-ring.r2 {
  inset: -16px;
  border-color: rgba(255,30,40,0.1);
  animation-delay: 1.5s;
}
@keyframes ripple {
  0%, 100% { transform: scale(1); opacity: 0.5; }
  50% { transform: scale(1.1); opacity: 1; }
}
.fp-ghost-text { font-size: 32px; color: rgba(255,30,40,0.3); }

.fp-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  color: var(--text-dim);
  font-family: var(--mono);
  font-size: 12px;
}
.fp-spinner {
  width: 40px; height: 40px;
  border: 2px solid rgba(255,30,40,0.2);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.fp-result {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 16px;
  width: 100%;
}
.fp-img {
  width: 256px;
  height: 256px;
  image-rendering: pixelated;
  border-radius: 50%;
  box-shadow: 0 0 30px rgba(255,30,40,0.2);
  animation: fadeIn 0.4s ease;
}
@keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }

.download-btn {
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
  text-decoration: none;
  display: inline-block;
}
.download-btn:hover { border-color: var(--accent); color: var(--accent); }

/* Meta */
.meta-list { display: flex; flex-direction: column; gap: 8px; }
.meta-row { display: flex; justify-content: space-between; align-items: center; }
.meta-key { font-family: var(--mono); font-size: 11px; color: var(--text-dim); letter-spacing: 1px; }
.meta-val { font-family: var(--mono); font-size: 12px; color: var(--accent); }

/* Palette */
.palette-swatches { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 8px; }
.swatch {
  width: 28px; height: 28px;
  border-radius: 4px;
  border: 1px solid rgba(255,255,255,0.1);
  transition: transform 0.2s;
  cursor: default;
}
.swatch:hover { transform: scale(1.15); }
.palette-name { font-family: var(--mono); font-size: 11px; color: var(--text-dim); letter-spacing: 1px; }

/* Rule viz */
.rule-viz { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 8px; }
.rule-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}
.rule-pattern { display: flex; gap: 2px; }
.rule-bit {
  width: 10px; height: 10px;
  border-radius: 2px;
  border: 1px solid var(--border);
}
.rule-bit.on  { background: var(--accent); box-shadow: 0 0 4px rgba(255,30,40,0.5); }
.rule-bit.off { background: rgba(0,0,0,0.5); }
.rule-output {
  width: 22px; height: 10px;
  border-radius: 2px;
  border: 1px solid var(--border);
}
.rule-output.on  { background: var(--accent); box-shadow: 0 0 6px rgba(255,30,40,0.5); }
.rule-output.off { background: rgba(0,0,0,0.5); }
.rule-idx { font-family: var(--mono); font-size: 9px; color: var(--text-dim); }
.rule-desc { font-family: var(--mono); font-size: 11px; color: var(--text-dim); letter-spacing: 1px; }
</style>
