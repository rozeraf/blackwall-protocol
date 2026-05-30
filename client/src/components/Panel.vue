<template>
  <div class="panel">
    <div v-if="title" class="panel-header">
      <span class="panel-title">{{ title }}</span>
      <slot name="header-extra" />
    </div>
    <div class="panel-body">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ title?: string; icon?: string }>();
</script>

<style scoped>
.panel {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  backdrop-filter: blur(8px);
  overflow: hidden;
  transition: border-color 0.2s;
}
.panel:hover { border-color: rgba(220, 38, 38, 0.2); }

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 11px 16px;
  border-bottom: 1px solid var(--border);
}
.panel-title {
  font-family: var(--mono);
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-dim);
}
.panel-body { padding: 16px; }
</style>
