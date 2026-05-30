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
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05);
}
.panel:hover { 
  border-color: rgba(255, 30, 40, 0.3);
  transform: translateY(-2px);
  box-shadow: 0 12px 40px rgba(255, 30, 45, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

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
