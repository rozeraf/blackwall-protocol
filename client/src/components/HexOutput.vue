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
  background: var(--bg-input);
  border-radius: var(--radius);
  padding: 12px 14px;
  position: relative;
  min-height: 52px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.hex-output.empty { opacity: 0.5; }

.hex-label {
  font-family: var(--mono);
  font-size: 10px;
  color: var(--text-muted);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  margin-bottom: 2px;
}

.hex-value {
  font-family: var(--mono);
  font-size: 13px;
  color: var(--text-bright);
  word-break: break-all;
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  line-height: 1.6;
  padding-right: 40px;
}

.hex-placeholder {
  color: var(--text-muted);
  font-size: 13px;
}

.copy-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  background: var(--bg-hover);
  border: none;
  border-radius: 4px;
  color: var(--text-dim);
  font-family: var(--mono);
  font-size: 10px;
  padding: 4px 10px;
  cursor: pointer;
  transition: all 0.15s;
  letter-spacing: 0.04em;
}
.copy-btn:hover { background: var(--accent-mute); color: var(--text-bright); }
.copy-btn.copied { background: var(--accent); color: var(--text-bright); }
</style>
