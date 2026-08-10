<script setup lang="ts">
import { useHeaderMenus } from "@/hooks/useHeaderMenus";
import {
  ApartmentOutlined,
  AppstoreOutlined,
  AreaChartOutlined,
  CloseOutlined,
  LinkOutlined,
  LoginOutlined,
  MenuOutlined,
  SettingOutlined,
  ShopOutlined,
  ShoppingOutlined,
  TeamOutlined,
  UserOutlined
} from "@ant-design/icons-vue";
import type { Component } from "vue";
import { onBeforeUnmount, ref, watch } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();
const { menus, handleToPage } = useHeaderMenus();
const isExpanded = ref(false);

const routePathIcons: Record<string, Component> = {
  "/instances": AppstoreOutlined,
  "/market": ShopOutlined,
  "/overview": AreaChartOutlined,
  "/users": TeamOutlined,
  "/node": ApartmentOutlined,
  "/settings": SettingOutlined,
  "/customer": UserOutlined,
  "/login": LoginOutlined,
  "/shop": ShoppingOutlined,
  "/_open_page": LinkOutlined
};

const getRouteIcon = (path: string): Component => routePathIcons[path] ?? MenuOutlined;

const isActive = (path: string): boolean => {
  if (route.path === path) return true;
  if (path === "/") return false;
  return route.path.startsWith(path + "/");
};

const toggleMenu = () => {
  isExpanded.value = !isExpanded.value;
};

const handleMenuItemClick = (path: string) => {
  handleToPage(path);
  isExpanded.value = false;
};

const closeMenu = () => {
  isExpanded.value = false;
};

watch(() => route.fullPath, closeMenu);
watch(isExpanded, (expanded) => {
  document.documentElement.classList.toggle("mobile-nav-open", expanded);
});
onBeforeUnmount(() => document.documentElement.classList.remove("mobile-nav-open"));
</script>

<template>
  <Transition name="fab-backdrop">
    <div v-if="isExpanded" class="fab-backdrop" @click="closeMenu" />
  </Transition>

  <div class="fab-container">
    <Transition name="fab-panel">
      <div v-if="isExpanded" class="fab-menu-panel">
        <button
          v-for="item in menus"
          :key="item.path"
          class="fab-menu-item"
          :class="{ 'fab-menu-item--active': isActive(item.path) }"
          @click="handleMenuItemClick(item.path)"
        >
          <span class="fab-menu-icon-wrap">
            <component :is="getRouteIcon(item.path)" class="fab-menu-icon" />
          </span>
          <span class="fab-menu-label">{{ item.name }}</span>
        </button>
      </div>
    </Transition>

    <button
      aria-label="Toggle navigation menu"
      class="fab-ball"
      :class="{ 'fab-ball--expanded': isExpanded }"
      @click="toggleMenu"
    >
      <Transition name="fab-icon" mode="out-in">
        <CloseOutlined v-if="isExpanded" class="fab-ball-icon" />
        <MenuOutlined v-else class="fab-ball-icon" />
      </Transition>
    </button>
  </div>
</template>

<style lang="scss" scoped>
.fab-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1001;
  background: rgba(0, 0, 0, 0.28);
  backdrop-filter: blur(2px);
}

.fab-container {
  position: fixed;
  bottom: calc(16px + env(safe-area-inset-bottom));
  right: max(12px, env(safe-area-inset-right));
  z-index: 1002;
  display: flex;
  align-items: center;
  gap: 10px;
  pointer-events: none;

  > * {
    pointer-events: auto;
  }
}

// ---- Menu Panel ----

.fab-menu-panel {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 6px;
  padding: 10px;
  width: min(250px, calc(100vw - 92px));
  max-width: calc(100vw - 92px);
  max-height: min(68dvh, 520px);
  overflow-y: auto;
  border-radius: 18px;
  background: var(--surface-elevated);
  border: 1px solid var(--border-subtle);
  backdrop-filter: saturate(150%) blur(18px);
  -webkit-backdrop-filter: saturate(150%) blur(18px);
  box-shadow:
    0 8px 32px var(--card-shadow-extend-color),
    0 2px 8px var(--card-shadow-color);
  transform-origin: bottom right;
}

.fab-menu-item {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 10px;
  width: 100%;
  min-height: 46px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 12px;
  padding: 5px 10px;
  color: var(--text-primary);
  cursor: pointer;
  outline: none;
  -webkit-tap-highlight-color: transparent;
}

.fab-menu-icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  transition: all 0.2s ease;

  .fab-menu-icon {
    font-size: 20px;
    color: var(--text-secondary);
    transition: all 0.2s ease;
  }
}

.fab-menu-item--active {
  color: var(--accent-primary);
  background: var(--accent-soft);
  border-color: var(--border-default);
}

.fab-menu-item--active .fab-menu-icon-wrap {
  background: var(--accent-soft);

  .fab-menu-icon {
    font-size: 22px;
    color: var(--accent-primary);
  }
}

.fab-menu-label {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 14px;
  font-weight: 600;
}

.fab-menu-item:not(.fab-menu-item--active):hover .fab-menu-icon-wrap {
  background: var(--bottom-nav-background-color-hover);
  opacity: 0.7;
}

.fab-menu-item:active .fab-menu-icon-wrap {
  transform: scale(0.88);
}

// ---- Floating Ball ----

.fab-ball {
  width: 54px;
  height: 54px;
  border-radius: 50%;
  border: 1px solid var(--border-default);
  cursor: pointer;
  outline: none;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--accent-primary);
  background: var(--surface-elevated);
  backdrop-filter: saturate(150%) blur(18px);
  -webkit-backdrop-filter: saturate(150%) blur(18px);
  box-shadow:
    0 8px 24px var(--card-shadow-extend-color),
    0 2px 8px var(--card-shadow-color);
  transition:
    transform 0.22s ease,
    box-shadow 0.22s ease;
  -webkit-tap-highlight-color: transparent;
}

.fab-ball:hover {
  transform: scale(1.08);
  box-shadow:
    0 12px 32px var(--card-shadow-extend-color),
    0 4px 12px var(--card-shadow-color);
}

.fab-ball:active {
  transform: scale(0.92);
}

.fab-ball--expanded {
  box-shadow:
    0 12px 32px var(--card-shadow-extend-color),
    0 4px 12px var(--card-shadow-color);
}

.fab-ball-icon {
  font-size: 20px;
  color: var(--accent-primary);
}

@media (max-width: 360px) {
  .fab-container { right: max(8px, env(safe-area-inset-right)); }
  .fab-menu-panel { width: min(228px, calc(100vw - 82px)); max-width: calc(100vw - 82px); }
  .fab-menu-item { min-height: 44px; padding: 4px 8px; }
}

// ---- Transitions ----

.fab-backdrop-enter-active,
.fab-backdrop-leave-active {
  transition: opacity 0.25s ease;
}
.fab-backdrop-enter-from,
.fab-backdrop-leave-to {
  opacity: 0;
}

.fab-panel-enter-active {
  transition:
    opacity 0.22s ease,
    transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.fab-panel-leave-active {
  transition:
    opacity 0.18s ease,
    transform 0.18s ease;
}
.fab-panel-enter-from,
.fab-panel-leave-to {
  opacity: 0;
  transform: scale(0.8) translateY(12px);
}

.fab-icon-enter-active,
.fab-icon-leave-active {
  transition:
    opacity 0.15s ease,
    transform 0.15s ease;
}
.fab-icon-enter-from {
  opacity: 0;
  transform: rotate(-90deg) scale(0.6);
}
.fab-icon-leave-to {
  opacity: 0;
  transform: rotate(90deg) scale(0.6);
}
</style>
