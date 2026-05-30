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
          <span class="status-dot"></span>
          <span class="status-label">online</span>
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

/* ── Header ──────────────────────────────────────────────────── */
.header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(8, 6, 8, 0.85);
  backdrop-filter: blur(20px) saturate(1.5);
  -webkit-backdrop-filter: blur(20px) saturate(1.5);
  box-shadow: 0 4px 32px rgba(0, 0, 0, 0.6), 0 1px 0 rgba(255,255,255,0.03) inset;
}
.header-inner {
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 28px;
  height: 58px;
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 32px;
}

/* ── Logo ──────────────────────────────────────────────────────── */
.logo {
  display: flex;
  align-items: center;
  gap: 11px;
  text-decoration: none;
  user-select: none;
}
.logo-mark {
  color: var(--accent);
  display: flex;
  filter: drop-shadow(0 0 6px rgba(200, 16, 46, 0.6));
  transition: filter 0.3s ease;
}
.logo:hover .logo-mark {
  filter: drop-shadow(0 0 10px rgba(232, 32, 62, 0.85));
}
.logo-text { display: flex; align-items: baseline; gap: 7px; }
.logo-name {
  font-family: var(--body);
  font-size: 15px;
  font-weight: 700;
  color: var(--text-bright);
  letter-spacing: 0.02em;
  text-transform: uppercase;
}
.logo-ver {
  font-family: var(--mono);
  font-size: 9px;
  color: var(--accent-dim);
  letter-spacing: 0.08em;
}

/* ── Nav ───────────────────────────────────────────────────────── */
.nav {
  display: flex;
  align-items: center;
  gap: 2px;
}
.nav-tab {
  position: relative;
  padding: 6px 16px;
  background: none;
  border: none;
  border-radius: var(--radius);
  color: var(--text-dim);
  font-family: var(--body);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: color 0.2s, background 0.2s;
  letter-spacing: 0.01em;
}
.nav-tab::after {
  content: '';
  position: absolute;
  bottom: 0; left: 50%;
  transform: translateX(-50%);
  width: 0; height: 1.5px;
  background: var(--accent);
  transition: width 0.25s ease;
  border-radius: 1px;
}
.nav-tab:hover {
  color: var(--text);
  text-shadow: 0 0 12px rgba(200, 16, 46, 0.25);
}
.nav-tab.active {
  color: var(--text-bright);
  text-shadow: 0 0 16px rgba(232, 32, 62, 0.5);
}
.nav-tab.active::after { width: calc(100% - 24px); }

/* ── Header right ──────────────────────────────────────────────── */
.header-end { display: flex; align-items: center; gap: 8px; }
.status-dot {
  width: 7px; height: 7px;
  border-radius: 50%;
  background: var(--accent-bright);
  box-shadow: 0 0 8px rgba(200, 16, 46, 0.8);
  animation: pulse 2.8s ease-in-out infinite;
}
.status-label {
  font-family: var(--mono);
  font-size: 9px;
  letter-spacing: 0.1em;
  color: var(--text-dim);
  text-transform: uppercase;
}
@keyframes pulse {
  0%, 100% { opacity: 0.55; box-shadow: 0 0 5px rgba(200, 16, 46, 0.5); }
  50%       { opacity: 1;    box-shadow: 0 0 12px rgba(200, 16, 46, 0.9); }
}

/* ── Main ────────────────────────────────────────────────────────── */
.main {
  flex: 1;
  max-width: 1100px;
  width: 100%;
  margin: 0 auto;
  padding: 36px 28px 56px;
}

/* ── Footer ──────────────────────────────────────────────────────── */
.footer {
  box-shadow: 0 -1px 24px rgba(0, 0, 0, 0.4);
  padding: 16px 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  font-family: var(--mono);
  font-size: 10px;
  letter-spacing: 0.06em;
  color: var(--text-muted);
}
.footer-sep { opacity: 0.25; color: var(--accent-dim); }
</style>
