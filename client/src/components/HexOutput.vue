<template>
  <div class="hex-output" :class="{ empty: !value }">
    <div class="hex-label" v-if="label">{{ label }}</div>
    <div class="hex-value">
      <template v-if="value">
        <span
          v-for="(chunk, i) in chunks"
          :key="i"
          class="hex-chunk"
          :style="{ animationDelay: `${i * 0.02}s` }"
        >{{ chunk }}</span>
      </template>
      <span v-else class="hex-placeholder">{{ placeholder || '—' }}</span>
    </div>
    <button v-if="value" class="copy-btn" @click="copy" :class="{ copied }">
      {{ copied ? '✓ copied' : 'copy' }}
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
  // split into groups of 8 hex chars (4 bytes)
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
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 14px 16px;
  position: relative;
  min-height: 56px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.hex-output.empty { opacity: 0.5; }

.hex-label {
  font-family: var(--mono);
  font-size: 10px;
  color: var(--text-dim);
  letter-spacing: 1.5px;
  text-transform: uppercase;
  margin-bottom: 2px;
}
.hex-value {
  font-family: var(--mono);
  font-size: 13px;
  color: var(--accent);
  word-break: break-all;
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  line-height: 1.6;
}
.hex-chunk {
  animation: fadeIn 0.3s ease both;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(2px); }
  to   { opacity: 1; transform: translateY(0); }
}
.hex-placeholder {
  color: var(--text-dim);
  font-size: 20px;
}
.copy-btn {
  position: absolute;
  top: 10px;
  right: 12px;
  background: none;
  border: 1px solid var(--border);
  border-radius: 4px;
  color: var(--text-dim);
  font-family: var(--mono);
  font-size: 10px;
  padding: 3px 8px;
  cursor: pointer;
  transition: all 0.2s;
  letter-spacing: 1px;
}
.copy-btn:hover { border-color: var(--accent); color: var(--accent); }
.copy-btn.copied { border-color: var(--accent); color: var(--accent); }
</style>
