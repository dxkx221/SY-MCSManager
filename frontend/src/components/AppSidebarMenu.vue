<script setup lang="ts">
import {
  useHeaderMenus,
  type SidebarAppDropdownEntry,
  type SidebarEntry
} from "@/hooks/useHeaderMenus";
import { useAppConfigStore } from "@/stores/useAppConfigStore";
import {
  ApartmentOutlined,
  AppstoreOutlined,
  AreaChartOutlined,
  LinkOutlined,
  LoginOutlined,
  MenuOutlined,
  SettingOutlined,
  ShopOutlined,
  ShoppingOutlined,
  TeamOutlined,
  UserOutlined
} from "@ant-design/icons-vue";
import type { Key } from "ant-design-vue/es/table/interface";
import type { Component } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();
const { sidebarItems, handleToPage } = useHeaderMenus();
const { logoImage } = useAppConfigStore();

const isRouteActive = (path: string): boolean => {
  if (route.path === path) return true;
  if (path === "/") return false;
  return route.path.startsWith(path + "/");
};

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

const getRouteIcon = (path: string): Component => {
  return routePathIcons[path] ?? MenuOutlined;
};

const getItemKey = (entry: SidebarEntry, index: number): string => {
  if (entry.type === "divider") return "sidebar-divider";
  if (entry.type === "route") return entry.path;
  return `app-${index}-${entry.title}`;
};

const onAppDropdownClick = (item: SidebarAppDropdownEntry, info: { key: Key }) => {
  item.click(String(info.key));
};
</script>

<template>
  <aside class="left-sidebar">
    <a href="." class="logo">
      <img :src="logoImage" />
    </a>
    <nav class="sidebar-menu">
      <template v-for="(entry, index) in sidebarItems" :key="getItemKey(entry, index)">
        <div v-if="entry.type === 'divider'" class="sidebar-divider" />
        <a
          v-else-if="entry.type === 'route'"
          class="sidebar-item"
          :class="[entry.customClass, { 'sidebar-item-active': isRouteActive(entry.path) }]"
          @click.prevent="handleToPage(entry.path)"
        >
          <component :is="getRouteIcon(entry.path)" class="sidebar-item-icon" />
          <span class="sidebar-item-text">{{ entry.name }}</span>
        </a>
        <a-dropdown v-else-if="entry.type === 'app-dropdown'" trigger="click" placement="topRight">
          <a class="sidebar-item" @click.prevent>
            <component :is="entry.icon" v-if="entry.icon" class="sidebar-item-icon" />
            <span class="sidebar-item-text">{{ entry.title }}</span>
          </a>
          <template #overlay>
            <a-menu @click="(info) => onAppDropdownClick(entry, info)">
              <a-menu-item v-for="m in entry.menus" :key="String(m.value)">
                {{ m.title }}
              </a-menu-item>
            </a-menu>
          </template>
        </a-dropdown>
        <a
          v-else-if="entry.type === 'app'"
          class="sidebar-item"
          :class="entry.customClass"
          @click.prevent="entry.click()"
        >
          <component :is="entry.icon" v-if="entry.icon" class="sidebar-item-icon" />
          <span class="sidebar-item-text">{{ entry.title }}</span>
        </a>
      </template>
    </nav>
  </aside>
</template>

<style lang="scss">
/* ═══════════════════════════════════════════
   SIDEBAR — Dark Tech (unscoped to override)
   ═══════════════════════════════════════════ */
.left-sidebar {
  --sidebar-bg: #060B14;
  --sidebar-text: #6B7280;
  --sidebar-hover-bg: rgba(255,255,255,0.04);
  --sidebar-hover-text: #D1D5DB;
  --sidebar-active-bg: rgba(37,99,235,0.12);
  --sidebar-active-text: #FFFFFF;
  --sidebar-active-line: #3B82F6;
  --sidebar-divider: rgba(255,255,255,0.05);

  display: flex !important;
  flex-direction: column !important;
  flex: 0 0 220px !important;
  width: 220px !important;
  text-align: left !important;
  background: var(--sidebar-bg) !important;
  border-right: 1px solid rgba(255,255,255,0.04) !important;
  padding: 20px 10px !important;
  transition: width 0.22s ease !important;
  overflow: hidden !important;

  &:hover {
    width: 236px !important;
  }
}

.left-sidebar .logo {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  height: 44px;
  padding: 0 10px 22px;
  flex-shrink: 0;

  img {
    max-width: 144px;
    max-height: 30px;
    object-fit: contain;
  }
}

.left-sidebar .sidebar-menu {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 4px 4px;
  flex: 1;
  gap: 2px;
  width: 100%;
  overflow-y: auto;
  color: var(--sidebar-text);
  font-size: 13.5px;
}

.left-sidebar .sidebar-item {
  display: flex !important;
  align-items: center !important;
  gap: 10px !important;
  padding: 9px 12px !important;
  color: var(--sidebar-text) !important;
  text-decoration: none !important;
  cursor: pointer !important;
  border-radius: 8px !important;
  transition: all 0.16s ease !important;
  width: 100% !important;
  font-weight: 450 !important;
  font-size: 13.5px !important;
  white-space: nowrap !important;

  &:hover {
    color: var(--sidebar-hover-text) !important;
    background: var(--sidebar-hover-bg) !important;
  }

  &.sidebar-item-active {
    color: var(--sidebar-active-text) !important;
    background: var(--sidebar-active-bg) !important;
    box-shadow: inset 3px 0 0 var(--sidebar-active-line) !important;
  }

  .sidebar-item-icon {
    font-size: 16px;
    flex-shrink: 0;
    color: inherit !important;
  }

  .sidebar-item-text {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

.left-sidebar .sidebar-divider {
  height: 1px;
  background: var(--sidebar-divider);
  margin: 6px 0;
  flex-shrink: 0;
  width: 100%;
}
</style>
