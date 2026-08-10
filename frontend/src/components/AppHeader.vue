<script setup lang="ts">
import logo from "@/assets/logo.png";
import { useHeaderMenus } from "@/hooks/useHeaderMenus";
import { useScreen } from "@/hooks/useScreen";
import { useAppConfigStore } from "@/stores/useAppConfigStore";
import { useLayoutContainerStore } from "@/stores/useLayoutContainerStore";
import { MenuUnfoldOutlined } from "@ant-design/icons-vue";
import { computed, h } from "vue";
import { useRoute } from "vue-router";
import CardPanel from "./CardPanel.vue";
import GlobalSearch from "./GlobalSearch.vue";

const route = useRoute();
const { containerState } = useLayoutContainerStore();
const { logoImage } = useAppConfigStore();

const { menus, appMenus, handleToPage } = useHeaderMenus();

/** Whether route menu item is active (current path equals or is child of this path) */
const isRouteActive = (path: string): boolean => {
  if (route.path === path) return true;
  if (path === "/") return false;
  return route.path.startsWith(path + "/");
};

const headerStyle = computed(() => {
  return {
    "--header-height": "64px"
  };
});

const { isPhone } = useScreen();

const openPhoneMenu = (b = false) => {
  containerState.showPhoneMenu = b;
};
</script>

<template>
  <header class="app-header-wrapper" :style="headerStyle">
    <div v-if="!isPhone" class="app-header-content">
      <nav class="btns">
        <a href="." style="margin-right: 12px">
          <div class="logo">
            <img :src="logoImage" style="height:20px; max-width:180px; object-fit:contain" />
          </div>
        </a>

        <div
          v-for="item in menus"
          :key="item.path"
          class="nav-button"
          :class="[item.customClass, { 'nav-button-active': isRouteActive(item.path) }]"
          @click="handleToPage(item.path)"
        >
          <span>{{ item.name }}</span>
        </div>
      </nav>
      <div class="btns">
        <GlobalSearch />
        <div v-for="(item, index) in appMenus as any" :key="index">
          <a-dropdown v-if="item.menus && item.conditions" placement="bottom">
            <div
              :class="item.customClass"
              class="nav-button right-nav-button flex-center"
              @click.prevent
            >
              <component :is="item.icon" v-if="item.icon"></component>
            </div>
            <template #overlay>
              <a-menu @click="(e: any) => item.click(String(e.key))">
                <a-menu-item v-for="m in item.menus" :key="m.value">
                  {{ m.title }}
                </a-menu-item>
              </a-menu>
            </template>
          </a-dropdown>
          <a-tooltip v-else-if="item.conditions" placement="bottom">
            <template #title>
              <span>{{ item.title }}</span>
            </template>
            <div
              :class="item.customClass"
              class="nav-button right-nav-button flex-center"
              type="text"
              @click="(e: any) => item.click(e.key)"
            >
              <component :is="item.icon" v-if="item.icon"></component>
              <span v-if="item?.iconText" class="ml-6" style="font-size: 12px">
                {{ item?.iconText }}
              </span>
            </div>
          </a-tooltip>
        </div>
      </div>
    </div>
  </header>
  <div v-if="!isPhone" style="height: 64px"></div>

  <!-- Menus for phone -->
  <header v-if="isPhone" class="app-header-content-for-phone">
    <CardPanel class="card-panel">
      <template #body>
        <div class="phone-header-row">
          <div class="phone-header-actions phone-header-actions--left">
            <a-button
              type="text"
              :icon="h(MenuUnfoldOutlined)"
              size="small"
              @click="openPhoneMenu(true)"
            ></a-button>
            <div v-for="(item, index) in appMenus" :key="index">
              <a-dropdown
                v-if="item.menus && item.conditions && !item.onlyPC"
                class="phone-nav-button"
                placement="bottom"
              >
                <a-button type="text" :icon="h(item.icon)" size="small" @click.prevent></a-button>
                <template #overlay>
                  <a-menu @click="(e: any) => item.click(String(e.key))">
                    <a-menu-item v-for="m in item.menus" :key="m.value">
                      {{ m.title }}
                    </a-menu-item>
                  </a-menu>
                </template>
              </a-dropdown>
            </div>
          </div>
          <div class="phone-header-logo">
            <img :src="logoImage || logo" alt="MCSManager" />
          </div>
          <div class="phone-header-actions phone-header-actions--right">
            <GlobalSearch />
            <div v-for="(item, index) in appMenus" :key="index">
              <a-button
                v-if="item.conditions && !item.onlyPC && !item.menus"
                class="phone-nav-button"
                type="text"
                :icon="h(item.icon)"
                size="small"
                @click="item.click"
              ></a-button>
            </div>
          </div>
        </div>
      </template>
    </CardPanel>
  </header>

  <a-drawer
    class="phone-menu-drawer"
    :height="isPhone ? 'min(76dvh, 620px)' : 500"
    title="导航菜单"
    placement="top"
    :open="containerState.showPhoneMenu"
    @close="() => (containerState.showPhoneMenu = false)"
  >
    <div class="phone-menu">
      <div
        v-for="item in menus"
        :key="item.path"
        class="phone-menu-btn"
        :class="{ 'phone-menu-btn-active': isRouteActive(item.path) }"
        @click="handleToPage(item.path)"
      >
        {{ item.name }}
      </div>
    </div>
  </a-drawer>
</template>

<style lang="scss" scoped>
@import "@/assets/global.scss";

/* Semantic button highlights */
.nav-button-warning:hover { background-color: rgba(245,158,11,0.12) !important; color: #D97706 !important; }
.nav-button-success:hover { background-color: rgba(16,185,129,0.1) !important; color: #059669 !important; }
.nav-button-danger:hover  { background-color: rgba(239,68,68,0.1) !important; color: #DC2626 !important; }
.nav-button-primary:hover { background-color: color-mix(in srgb, var(--color-primary) 11%, transparent) !important; color: var(--color-primary) !important; }

.phone-menu {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;

  .phone-menu-btn {
    min-width: 0;
    padding: 13px 12px;
    border: 1px solid var(--border-subtle);
    border-radius: 12px;
    background: var(--surface-inner);
    color: var(--text-primary);
    text-align: center;
    overflow-wrap: anywhere;
  }
  .phone-menu-btn-active {
    background-color: var(--accent-soft);
    color: var(--accent-primary) !important;
  }
}

@media (max-width: 360px) {
  .app-header-content-for-phone .card-panel .ant-card-body { padding-left: 6px !important; padding-right: 6px !important; }
  .app-header-content-for-phone .phone-header-logo img { max-width: 78px; }
  .app-header-content-for-phone .phone-header-row { gap: 2px; }
  .app-header-content-for-phone .ant-btn { padding-left: 3px; padding-right: 3px; }
  .phone-menu { grid-template-columns: 1fr; }
}

.app-header-content-for-phone {
  position: relative;
  z-index: 30;
  min-height: calc(60px + env(safe-area-inset-top));
  width: 100%;
  padding-top: env(safe-area-inset-top);
  box-sizing: border-box;

  .card-panel {
    background-color: var(--app-header-bg);
    margin-top: 8px;
    button { color: var(--app-header-text-color) !important; }
  }

  .phone-header-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
    align-items: center;
    gap: 6px;
    width: 100%;
    min-width: 0;
  }

  .phone-header-actions {
    display: flex;
    align-items: center;
    min-width: 0;
    overflow: hidden;
  }

  .phone-header-actions--left { justify-content: flex-start; }
  .phone-header-actions--right { justify-content: flex-end; }
  .phone-header-actions > div { display: flex; flex: 0 0 auto; }

  .phone-header-logo {
    display: flex;
    justify-content: center;
    min-width: 0;
    pointer-events: none;
  }

  .phone-header-logo img {
    display: block;
    width: auto;
    height: 18px;
    max-width: min(112px, 30vw);
    object-fit: contain;
  }

  .phone-nav-button, .phone-nav-button * { margin: 0 1px; }
}

@media (max-width: 480px) {
  .app-header-content-for-phone {
    min-height: calc(56px + env(safe-area-inset-top));
    padding: env(safe-area-inset-top) 8px 0;
    box-sizing: border-box;

    .card-panel {
      margin-top: 4px;
      border-radius: 12px;
    }

    .card-panel > * { min-width: 0; }
    .card-panel .ant-card-body { padding: 8px 10px !important; }
    .phone-header-logo img { max-width: min(96px, 28vw); height: 16px !important; }
    .phone-nav-button { margin: 0 !important; }
    :deep(.ant-btn) { min-width: 32px; min-height: 32px; padding: 4px 5px; }
  }
}


.app-header-wrapper {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background:
    linear-gradient(135deg, rgba(255, 248, 252, 0.28), rgba(248, 240, 248, 0.20));
  backdrop-filter: saturate(150%) blur(22px);
  -webkit-backdrop-filter: saturate(150%) blur(22px);
  border-bottom: 1px solid rgba(236, 72, 153, 0.10);
  box-shadow: 0 10px 30px rgba(100, 70, 110, 0.06);
  color: var(--app-header-text-color);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 20;
  transition: background-color 0.2s ease, border-color 0.2s ease;

  .app-header-content {
    @extend .global-app-container;
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    height: var(--header-height);

    .btns { display: flex; align-items: center; }
  }

  .nav-button {
    margin: 0 2px;
    font-size: 13.5px;
    font-weight: 500;
    transition: all 0.2s ease;
    color: var(--app-header-text-color) !important;
    text-align: center;
    padding: 6px 14px;
    min-width: 36px;
    cursor: pointer;
    border-radius: 8px;
    user-select: none;
    letter-spacing: 0.2px;

    &:hover {
      color: #DB2777 !important;
      background: rgba(255, 255, 255, 0.56);
      box-shadow: inset 0 0 0 1px rgba(236, 72, 153, 0.10), 0 6px 16px rgba(100, 70, 110, 0.07);
      transform: translateY(-1px);
    }
  }

  .nav-button-active {
    color: #EC4899 !important;
    background: linear-gradient(135deg, rgba(236, 72, 153, 0.14), rgba(255, 255, 255, 0.12)) !important;
    box-shadow: inset 0 0 0 1px rgba(236, 72, 153, 0.18), 0 8px 20px rgba(236, 72, 153, 0.10);
    font-weight: 600;
  }

  .right-nav-button {
    margin: 0 1px;
    font-size: 14px;
    padding: 6px 8px;
  }

  .icon-button { font-size: 16px !important; }

  .logo {
    cursor: pointer;
    display: flex;
    align-items: center;
    img { border-radius: 4px; }
  }

  .pro-mode-order-container {
    @extend .nav-button;
    @extend .nav-button-success;
  }

  @media (max-width: 1470px) {
    .app-header-content, .app-header-content-for-phone { margin: 0px 25px; }
  }
  @media (max-width: 992px) {
    .app-header-content { margin: 0px 8px; }
  }

  @media (max-width: 480px) {
    .app-header-content-for-phone { margin: 0; }
  }
}
</style>
