<script setup lang="ts">
import type { Component } from "vue";

defineProps<{
  option: {
    label: string;
    icon: Component;
    description: string;
    action: (e: Event) => void;
  };
}>();

const handleClick = (e: Event, action: (e: Event) => void) => { action(e); };
</script>

<template>
  <div class="install-option-button" role="button" tabindex="0"
    @click="(e) => handleClick(e, option.action)"
    @keydown.enter.space.prevent="(e) => handleClick(e, option.action)">
    <div class="button-inner">
      <div class="button-icon"><component :is="option.icon" /></div>
      <div class="button-content">
        <span class="button-label">{{ option.label }}</span>
        <span class="button-desc">{{ option.description }}</span>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.install-option-button {
  cursor: pointer;
  border-radius: 14px;
  padding: 1px;
  height: 130px;
  border: 1px solid rgba(255,255,255,0.22);
  background: rgba(255, 252, 248, 0.12);
  backdrop-filter: saturate(140%) blur(16px);
  -webkit-backdrop-filter: saturate(140%) blur(16px);
  box-shadow: 0 6px 18px rgba(150,80,120,0.06), inset 0 1px 0 rgba(255,255,255,0.32);
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    border-color: rgba(236,72,153,0.28);
    box-shadow: 0 10px 26px rgba(180,80,130,0.10), inset 0 0 0 1px rgba(255,255,255,0.14);
  }
  &:active { transform: translateY(0) scale(0.99); }

  .button-inner {
    display: flex; align-items: center; gap: 14px;
    padding: 16px 18px; border-radius: 13px; height: 100%;
    background: rgba(255, 255, 255, 0.00);
  }
  .button-icon {
    flex-shrink: 0; width: 50px; height: 50px;
    display: flex; align-items: center; justify-content: center;
    border-radius: 11px; font-size: 20px;
    color: #d65a8a;
    background: rgba(236, 72, 153, 0.14);
    border: 1px solid rgba(236,72,153,0.18);
  }
  &:hover .button-icon { color: #be185d; background: rgba(236,72,153,0.22); }
  .button-content { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
  .button-label { font-size: 15px; font-weight: 600; color: #4a243e; }
  .button-desc { font-size: 13px; color: #6e5260; line-height: 1.35; }
}

/* 深色模式 */
:global(.app-dark-theme) .install-option-button {
  border-color: rgba(167,139,250,0.16);
  background: rgba(14, 12, 30, 0.14);
  box-shadow: 0 6px 20px rgba(0,0,0,0.24), inset 0 1px 0 rgba(255,255,255,0.04);
}
:global(.app-dark-theme) .install-option-button:hover {
  border-color: rgba(167,139,250,0.30);
}
:global(.app-dark-theme) .install-option-button .button-icon {
  color: var(--accent-primary, var(--color-primary));
  background: rgba(124, 92, 252, 0.14);
  border-color: rgba(124,92,252,0.20);
}
:global(.app-dark-theme) .install-option-button:hover .button-icon {
  color: #C4B5FD;
  background: rgba(124,92,252,0.22);
}
:global(.app-dark-theme) .install-option-button .button-label { color: rgba(240,237,255,0.88); }
:global(.app-dark-theme) .install-option-button .button-desc { color: rgba(210,205,235,0.66); }
</style>
