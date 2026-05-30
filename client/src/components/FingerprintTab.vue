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
        <Panel title="Input">
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
        <Panel title="Info" v-if="fpResult">
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
              <span class="meta-key">CA width</span>
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
        <Panel title="Hash (256-bit)" v-if="fpResult">
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
            <span>Computing…</span>
          </div>

          <div class="fp-result" v-else-if="fpResult">
            <img :src="fpResult.dataUrl" alt="Blackwall Fingerprint" class="fp-img" />
            <a :href="fpResult.dataUrl" :download="`blackwall-fp-${fpResult.hex.slice(0,8)}.png`" class="download-btn">
              ⬇ Download PNG
            </a>
          </div>
        </div>

        <!-- Palette preview -->
        <Panel title="Color Palette" v-if="fpResult">
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
        <Panel title="Wolfram Rule" v-if="fpResult">
          <div class="rule-viz">
            <div v-for="(bit, i) in ruleBits" :key="i" class="rule-cell">
              <div class="rule-pattern">
                <span v-for="(b, j) in pattern(7 - i)" :key="j" :class="['rule-bit', b ? 'on' : 'off']"></span>
              </div>
              <div :class="['rule-output', bit ? 'on' : 'off']"></div>
              <span class="rule-idx">{{ 7 - i }}</span>
            </div>
          </div>
          <p class="rule-desc">Rule {{ fpResult.rule }} — Elementary CA</p>
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
.fp-tab { display: flex; flex-direction: column; gap: 24px; }
.tab-header { margin-bottom: 4px; }
.tab-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-bright);
  letter-spacing: -0.01em;
  margin-bottom: 6px;
}
.tab-desc { font-size: 13px; color: var(--text-dim); line-height: 1.6; max-width: 520px; }

.grid {
  display: grid;
  grid-template-columns: 360px 1fr;
  gap: 16px;
  align-items: start;
}
@media (max-width: 800px) { .grid { grid-template-columns: 1fr; } }

.col-left, .col-right { display: flex; flex-direction: column; gap: 14px; }

.input-type-row {
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
.type-switch {
  display: flex;
  background: var(--bg-elevated);
  border-radius: var(--radius);
  padding: 2px;
  gap: 2px;
  box-shadow: var(--shadow-input);
}
.type-switch button {
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
.type-switch button.active {
  background: rgba(200, 16, 46, 0.18);
  color: var(--accent-bright);
  box-shadow: 0 0 8px rgba(200, 16, 46, 0.20);
}

.field-textarea {
  width: 100%;
  background: var(--bg-elevated);

  border-radius: var(--radius);
  color: var(--text);
  font-family: var(--mono);
  font-size: 13px;
  line-height: 1.55;
  padding: 12px 14px;
  outline: none;
  transition: box-shadow 0.2s ease;
  box-shadow: var(--shadow-input);
  resize: vertical;
}
.field-textarea:focus {
  box-shadow: var(--glow-focus);
}
.field-textarea::placeholder { color: var(--text-muted); }

.file-drop {
  background: var(--bg-surface);
  border-radius: var(--radius);
  padding: 28px 20px;
  text-align: center;
  color: var(--text-dim);
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-family: var(--body);
  box-shadow: var(--shadow-input);
}
.file-drop:hover {
  background: var(--bg-elevated);
  color: var(--text);
  box-shadow: var(--glow-hover);
}
.file-icon { font-size: 22px; opacity: 0.35; }

.run-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px 20px;
  background: rgba(200, 16, 46, 0.10);
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
  color: var(--text);
  box-shadow: var(--glow-hover);
}

/* ── Fingerprint display ─────────────────── */
.fp-display {
  background: var(--bg-surface);
  border-radius: var(--radius-xl);
  aspect-ratio: 1;
  max-width: 340px;
  margin: 0 auto;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-panel);
  transition: box-shadow 0.3s ease;
  overflow: hidden;
  position: relative;
}
.fp-display.has-result {
  box-shadow: 0 0 30px rgba(200, 16, 46, 0.12);
}

.fp-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  color: var(--text-muted);
  font-family: var(--mono);
  font-size: 10px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.fp-ghost { position: relative; width: 64px; height: 64px; display: flex; align-items: center; justify-content: center; }
.fp-ghost-ring {
  position: absolute;
  inset: 0;
  border: 1px solid rgba(200, 16, 46, 0.18);
  border-radius: 50%;
  animation: ripple 4s ease-in-out infinite;
}
.fp-ghost-ring.r2 {
  inset: -14px;
  border-color: rgba(200, 16, 46, 0.07);
  animation-delay: 2s;
}
@keyframes ripple {
  0%, 100% { transform: scale(1); opacity: 0.4; }
  50% { transform: scale(1.06); opacity: 0.85; }
}
.fp-ghost-text { font-size: 26px; color: var(--accent-dim); opacity: 0.4; }

.fp-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  color: var(--text-muted);
  font-family: var(--mono);
  font-size: 10px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.fp-spinner {
  width: 32px; height: 32px;
  border: 1.5px solid var(--bg-elevated);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.9s linear infinite;
  box-shadow: 0 0 10px rgba(200, 16, 46, 0.3);
}
@keyframes spin { to { transform: rotate(360deg); } }

.fp-result {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 12px;
  width: 100%;
}
.fp-img {
  width: 240px;
  height: 240px;
  image-rendering: pixelated;
  border-radius: 50%;
  animation: fadeIn 0.4s ease;
  box-shadow: 0 0 24px rgba(200, 16, 46, 0.15);
}
@keyframes fadeIn { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: scale(1); } }

.download-btn {
  padding: 7px 14px;
  background: transparent;
  border-radius: var(--radius);
  color: var(--text-dim);
  font-family: var(--mono);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.06em;
  cursor: pointer;
  transition: all 0.18s ease;
  text-decoration: none;
  display: inline-block;
  text-transform: uppercase;
}
.download-btn:hover {
  background: var(--bg-elevated);
  color: var(--text);
  box-shadow: var(--glow-hover);
}

/* ── Meta ──────────────────────────────── */
.meta-list { display: flex; flex-direction: column; gap: 8px; }
.meta-row { display: flex; justify-content: space-between; align-items: center; }
.meta-key { font-family: var(--mono); font-size: 10px; color: var(--text-muted); letter-spacing: 0.06em; }
.meta-val { font-family: var(--mono); font-size: 11px; color: var(--text); }

/* ── Palette swatches ──────────────────── */
.palette-swatches { display: flex; gap: 5px; flex-wrap: wrap; margin-bottom: 6px; }
.swatch {
  width: 22px; height: 22px;
  border-radius: 3px;
  transition: transform 0.15s;
  cursor: default;
}
.swatch:hover { transform: scale(1.15); }
.palette-name { font-family: var(--mono); font-size: 10px; color: var(--text-muted); letter-spacing: 0.05em; }

/* ── Rule viz ──────────────────────────── */
.rule-viz { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 6px; }
.rule-cell { display: flex; flex-direction: column; align-items: center; gap: 3px; }
.rule-pattern { display: flex; gap: 2px; }
.rule-bit {
  width: 8px; height: 8px;
  border-radius: 1px;
}
.rule-bit.on  { background: var(--accent); opacity: 0.75; }
.rule-bit.off { background: var(--bg-elevated); }
.rule-output { width: 18px; height: 8px; border-radius: 1px; }
.rule-output.on  { background: var(--accent); opacity: 0.75; }
.rule-output.off { background: var(--bg-elevated); }
.rule-idx { font-family: var(--mono); font-size: 9px; color: var(--text-muted); }
.rule-desc { font-family: var(--mono); font-size: 11px; color: var(--text-dim); }
</style>

