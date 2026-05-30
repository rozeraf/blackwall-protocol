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
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}
.panel-title {
  font-family: var(--mono);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--text-dim);
}
.panel-body { 
  background: var(--bg-offset);
  border-radius: var(--radius-lg);
  padding: 16px;
}
</style>
