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
      <img :src="logoImage" style="max-width:150px; max-height:34px; object-fit:contain" />
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
.left-sidebar {
  display: flex;
  flex: 0 0 224px;
  width: 224px;
  flex-direction: column;
  padding: 22px 12px;
  overflow: hidden;
  backdrop-filter: saturate(150%) blur(20px);
  -webkit-backdrop-filter: saturate(150%) blur(20px);
  border-right: 1px solid var(--card-border-color);
  transition: width .22s ease, background-color .25s ease, border-color .25s ease;

  &:hover { width: 238px; }
  .logo { display: flex; align-items: center; height: 44px; padding: 0 10px 24px; flex-shrink: 0; }
  .sidebar-menu { display: flex; flex: 1; flex-direction: column; gap: 2px; padding: 0 2px; overflow-y: auto; }
  .sidebar-item {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    padding: 9px 14px;
    border-radius: 10px;
    color: var(--text-color);
    font-size: 13.5px;
    font-weight: 480;
    text-decoration: none;
    white-space: nowrap;
    cursor: pointer;
    transition: color .16s ease, background-color .16s ease, transform .16s ease, box-shadow .2s ease;

    &:active { transform: scale(.985); }
  }
  .sidebar-item-active { font-weight: 600; }
  .sidebar-item-icon { flex-shrink: 0; color: inherit; font-size: 16px; }
  .sidebar-divider { width: 100%; height: 1px; margin: 6px 0; background: var(--card-border-color); }
}
</style>
