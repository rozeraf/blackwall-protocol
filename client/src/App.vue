<template>
  <div class="app">
    <header class="header">
      <div class="header-inner">
        <div class="logo">
          <div class="logo-mark">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <rect x="1" y="1" width="18" height="18" stroke="currentColor" stroke-width="1.2" rx="2"/>
              <path d="M5 10h10M10 5v10" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
              <circle cx="10" cy="10" r="2.5" fill="currentColor" opacity="0.4"/>
            </svg>
          </div>
          <div class="logo-text">
            <span class="logo-name">Blackwall</span>
            <span class="logo-ver">v1.0</span>
          </div>
        </div>
        <nav class="nav">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            :class="['nav-tab', { active: activeTab === tab.id }]"
            @click="activeTab = tab.id"
          >{{ tab.label }}</button>
        </nav>
        <div class="header-end">
          <span class="status-indicator"></span>
        </div>
      </div>
    </header>

    <main class="main">
      <CipherTab      v-if="activeTab === 'cipher'" />
      <HashTab        v-else-if="activeTab === 'hash'" />
      <MacTab         v-else-if="activeTab === 'mac'" />
      <FingerprintTab v-else-if="activeTab === 'fp'" />
    </main>

    <footer class="footer">
      <span>Blackwall · 1024-bit cellular automaton cipher</span>
      <span class="footer-sep">·</span>
      <span>Davies-Meyer hash · MAC</span>
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
  { id: 'cipher', label: 'Cipher' },
  { id: 'hash',   label: 'Hash'   },
  { id: 'mac',    label: 'MAC'    },
  { id: 'fp',     label: 'Fingerprint' },
];

const activeTab = ref('cipher');
</script>

<style scoped>
.app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

/* ── Header ─────────────────────────────── */
.header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: var(--bg);
}
.header-inner {
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 24px;
  height: 56px;
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 32px;
}

/* Logo */
.logo { display: flex; align-items: center; gap: 10px; }
.logo-mark { color: var(--accent); display: flex; }
.logo-text { display: flex; align-items: baseline; gap: 6px; }
.logo-name {
  font-family: var(--body);
  font-size: 15px;
  font-weight: 600;
  color: var(--text-bright);
  letter-spacing: -0.02em;
}
.logo-ver {
  font-family: var(--mono);
  font-size: 10px;
  color: var(--text-muted);
}

/* Nav */
.nav {
  display: flex;
  align-items: center;
  gap: 2px;
}
.nav-tab {
  padding: 6px 14px;
  background: none;
  border: none;
  border-radius: var(--radius);
  color: var(--text-dim);
  font-family: var(--body);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: color 0.15s, background 0.15s;
}
.nav-tab:hover { color: var(--text); background: var(--bg-hover); }
.nav-tab.active {
  color: var(--text-bright);
  background: var(--bg-input);
}

/* Right side */
.header-end { display: flex; align-items: center; }
.status-indicator {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--accent);
  opacity: 0.8;
  animation: breathe 3s ease-in-out infinite;
}
@keyframes breathe {
  0%, 100% { opacity: 0.5; }
  50%       { opacity: 1; }
}

/* ── Main ────────────────────────────────── */
.main {
  flex: 1;
  max-width: 1100px;
  width: 100%;
  margin: 0 auto;
  padding: 32px 24px 48px;
}

/* ── Footer ─────────────────────────────── */
.footer {
  background: var(--bg-offset);
  padding: 14px 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-family: var(--mono);
  font-size: 11px;
  color: var(--text-muted);
}
.footer-sep { opacity: 0.3; }
</style>
