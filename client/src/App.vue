<template>
  <div class="app">
    <!-- ── Header ─────────────────────────────── -->
    <header class="header">
      <div class="header-inner">
        <div class="logo">
          <div class="logo-icon">
            <span class="logo-hex">BW</span>
            <div class="logo-ring"></div>
          </div>
          <div class="logo-text">
            <span class="logo-title">BLACKWALL</span>
            <span class="logo-sub">CIPHER PROTOCOL v1.0</span>
          </div>
        </div>
        <div class="header-status">
          <span class="status-dot"></span>
          <span class="status-text">SECURE CHANNEL</span>
        </div>
      </div>
    </header>

    <!-- ── Nav tabs ───────────────────────────── -->
    <nav class="nav">
      <div class="nav-inner">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          :class="['nav-tab', { active: activeTab === tab.id }]"
          @click="activeTab = tab.id"
        >
          <span class="tab-icon">{{ tab.icon }}</span>
          <span class="tab-label">{{ tab.label }}</span>
        </button>
      </div>
    </nav>

    <!-- ── Content ────────────────────────────── -->
    <main class="main">
      <CipherTab   v-if="activeTab === 'cipher'"      />
      <HashTab     v-else-if="activeTab === 'hash'"   />
      <MacTab      v-else-if="activeTab === 'mac'"    />
      <FingerprintTab v-else-if="activeTab === 'fp'"  />
    </main>

    <!-- ── Footer ────────────────────────────── -->
    <footer class="footer">
      <span>Blackwall Cipher · 1024-bit Cellular Automaton · Adaptive Wolfram Rules</span>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import CipherTab      from './components/CipherTab.vue';
import HashTab        from './components/HashTab.vue';
import MacTab         from './components/MacTab.vue';
import FingerprintTab from './components/FingerprintTab.vue';

const tabs = [
  { id: 'cipher', label: 'Stream Cipher', icon: '⚡' },
  { id: 'hash',   label: 'Hash',          icon: '◈'  },
  { id: 'mac',    label: 'MAC',           icon: '🔐' },
  { id: 'fp',     label: 'Fingerprint',   icon: '◉'  },
];

const activeTab = ref('cipher');
</script>

<style scoped>
.app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

/* ── Header ──────────────────────────────────── */
.header {
  border-bottom: 1px solid var(--border);
  background: rgba(5, 7, 9, 0.9);
  backdrop-filter: blur(12px);
  position: sticky;
  top: 0;
  z-index: 100;
}
.header-inner {
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 24px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.logo { display: flex; align-items: center; gap: 14px; }
.logo-icon {
  position: relative;
  width: 40px; height: 40px;
  display: flex; align-items: center; justify-content: center;
}
.logo-hex {
  font-family: var(--mono);
  font-size: 13px;
  color: var(--accent);
  letter-spacing: 1px;
  position: relative;
  z-index: 2;
}
.logo-ring {
  position: absolute;
  inset: 0;
  border: 1.5px solid var(--accent);
  border-radius: 50%;
  box-shadow: var(--glow-sm), inset 0 0 12px rgba(0,255,180,0.1);
  animation: spin 10s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
.logo-text { display: flex; flex-direction: column; gap: 1px; }
.logo-title {
  font-family: var(--sans);
  font-size: 20px;
  font-weight: 700;
  color: var(--text-bright);
  letter-spacing: 3px;
}
.logo-sub {
  font-family: var(--mono);
  font-size: 10px;
  color: var(--text-dim);
  letter-spacing: 2px;
}
.header-status { display: flex; align-items: center; gap: 8px; }
.status-dot {
  width: 8px; height: 8px;
  border-radius: 50%;
  background: var(--accent);
  box-shadow: 0 0 8px var(--accent);
  animation: pulse 2s ease-in-out infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
.status-text {
  font-family: var(--mono);
  font-size: 11px;
  color: var(--accent);
  letter-spacing: 2px;
}

/* ── Nav ─────────────────────────────────────── */
.nav {
  border-bottom: 1px solid var(--border);
  background: rgba(8, 12, 16, 0.6);
  backdrop-filter: blur(8px);
}
.nav-inner {
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 24px;
  display: flex;
  gap: 4px;
}
.nav-tab {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 20px;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  color: var(--text-dim);
  font-family: var(--sans);
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  bottom: -1px;
}
.nav-tab:hover { color: var(--text); }
.nav-tab.active {
  color: var(--accent);
  border-bottom-color: var(--accent);
  text-shadow: 0 0 12px rgba(0, 255, 180, 0.5);
}
.tab-icon { font-size: 15px; }

/* ── Main ─────────────────────────────────────── */
.main {
  flex: 1;
  max-width: 1100px;
  width: 100%;
  margin: 0 auto;
  padding: 40px 24px;
}

/* ── Footer ──────────────────────────────────── */
.footer {
  border-top: 1px solid var(--border);
  padding: 16px 24px;
  text-align: center;
  font-family: var(--mono);
  font-size: 11px;
  color: var(--text-dim);
  letter-spacing: 1px;
}
</style>
