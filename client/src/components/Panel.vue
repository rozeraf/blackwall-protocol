<template>
  <div class="panel">
    <div v-if="title" class="panel-header">
      <span class="panel-icon" v-if="icon">{{ icon }}</span>
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
  backdrop-filter: blur(12px);
  overflow: hidden;
  transition: border-color 0.3s;
}
.panel:hover { border-color: rgba(255, 30, 40, 0.25); }

.panel-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 20px;
  border-bottom: 1px solid var(--border);
  background: rgba(255, 30, 40, 0.03);
}
.panel-icon { font-size: 16px; }
.panel-title {
  font-family: var(--sans);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: var(--text-dim);
  flex: 1;
}
.panel-body { padding: 20px; }
</style>
