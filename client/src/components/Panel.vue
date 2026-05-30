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
  gap: 10px;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding-left: 2px;
}
.panel-title {
  font-family: var(--mono);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--text-dim);
}

.panel-body {
  background: var(--bg-surface);
  border-radius: var(--radius-lg);
  padding: 16px;
  position: relative;
  box-shadow: var(--shadow-panel);
  transition: box-shadow 0.25s ease;
}
.panel-body:focus-within {
  box-shadow: var(--shadow-panel), var(--glow-focus);
}
</style>
