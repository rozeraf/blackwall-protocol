<template>
  <div class="hex-output" :class="{ empty: !value }">
    <div class="hex-label" v-if="label">{{ label }}</div>
    <div class="hex-value">
      <template v-if="value">
        <span
          v-for="(chunk, i) in chunks"
          :key="i"
          class="hex-chunk"
          :style="{ animationDelay: `${i * 0.015}s` }"
        >{{ chunk }}</span>
      </template>
      <span v-else class="hex-placeholder">{{ placeholder || '—' }}</span>
    </div>
    <button v-if="value" class="copy-btn" @click="copy" :class="{ copied }">
      {{ copied ? '✓' : 'copy' }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';

const props = defineProps<{
  value?: string;
  label?: string;
  placeholder?: string;
}>();

const copied = ref(false);

const chunks = computed(() => {
  if (!props.value) return [];
  return props.value.match(/.{1,8}/g) ?? [];
});

async function copy() {
  if (!props.value) return;
  await navigator.clipboard.writeText(props.value);
  copied.value = true;
  setTimeout(() => { copied.value = false; }, 1500);
}
</script>

<style scoped>
.hex-output {
  background: var(--bg-elevated);
  border-radius: var(--radius);
  padding: 12px 14px;
  position: relative;
  min-height: 54px;
  display: flex;
  flex-direction: column;
  gap: 5px;
  box-shadow: var(--shadow-input);
  transition: opacity 0.2s;
}
.hex-output.empty { opacity: 0.4; }

.hex-label {
  font-family: var(--mono);
  font-size: 9px;
  font-weight: 600;
  color: var(--text-dim);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  margin-bottom: 2px;
}

.hex-value {
  font-family: var(--mono);
  font-size: 12.5px;
  color: var(--text);
  word-break: break-all;
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  line-height: 1.65;
  padding-right: 44px;
}

.hex-chunk {
  color: var(--text-bright);
  opacity: 0;
  animation: hex-in 0.25s ease forwards;
  letter-spacing: 0.04em;
}
.hex-chunk:nth-child(odd) { color: var(--text); }

@keyframes hex-in {
  from { opacity: 0; transform: translateY(3px); }
  to   { opacity: 1; transform: translateY(0); }
}

.hex-placeholder {
  color: var(--text-muted);
  font-size: 13px;
  font-style: italic;
}

.copy-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  background: var(--bg-hover);
  border: none;
  border-radius: var(--radius);
  color: var(--text-dim);
  font-family: var(--mono);
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.08em;
  padding: 4px 10px;
  cursor: pointer;
  text-transform: uppercase;
  transition: all 0.18s ease;
}
.copy-btn:hover {
  background: rgba(200, 16, 46, 0.18);
  color: var(--accent-bright);
  box-shadow: var(--glow-hover);
}
.copy-btn.copied {
  background: rgba(200, 16, 46, 0.22);
  color: var(--accent-bright);
  box-shadow: var(--glow-focus);
}
</style>

