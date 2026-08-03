<script setup lang="ts">
import logo from "@/assets/logo.png";
import { useHeaderMenus } from "@/hooks/useHeaderMenus";
import { useScreen } from "@/hooks/useScreen";
import { useAppConfigStore } from "@/stores/useAppConfigStore";
import { useLayoutContainerStore } from "@/stores/useLayoutContainerStore";
import { MenuUnfoldOutlined } from "@ant-design/icons-vue";
import { useScroll } from "@vueuse/core";
import { computed, h } from "vue";
import { useRoute } from "vue-router";
import CardPanel from "./CardPanel.vue";

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

const { y } = useScroll(document.body);

const isScroll = computed(() => {
  return y.value > 10;
});

const headerStyle = computed(() => {
  return {
    "--header-height": isScroll.value ? "60px" : "64px"
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
        <div style="display: flex; justify-content: space-between; align-items: center">
          <div style="width: 100px" class="flex">
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
          <div>
            <img :src="logo" style="height: 18px" />
          </div>
          <div style="width: 100px" class="justify-end">
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
    :width="500"
    title="MENU"
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
.nav-button-primary:hover { background-color: rgba(59,130,246,0.1) !important; color: #2563EB !important; }

.phone-menu {
  .phone-menu-btn {
    padding: 16px 8px;
    border-bottom: 1px solid var(--color-gray-4);
    color: var(--color-gray-12);
  }
  .phone-menu-btn-active {
    background-color: rgba(64, 156, 216, 0.12);
  }
}

.app-header-content-for-phone {
  height: 60px;
  width: 100%;
  .card-panel {
    background-color: var(--app-header-bg);
    margin-top: 8px;
    button { color: var(--color-always-white) !important; }
  }
  .phone-nav-button, .phone-nav-button * { margin: 0px 6px; }
}

.app-header-wrapper {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: saturate(180%) blur(24px);
  -webkit-backdrop-filter: saturate(180%) blur(24px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  color: #475569;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 20;
  transition: height 0.3s ease;

  .app-header-content {
    @extend .global-app-container;
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    height: var(--header-height);
    transition: height 0.3s ease;

    .btns { display: flex; align-items: center; }
  }

  .nav-button {
    margin: 0 2px;
    font-size: 13.5px;
    font-weight: 500;
    transition: all 0.2s ease;
    color: #475569 !important;
    text-align: center;
    padding: 6px 14px;
    min-width: 36px;
    cursor: pointer;
    border-radius: 8px;
    user-select: none;
    letter-spacing: 0.2px;

    &:hover {
      color: #1E293B !important;
      background: rgba(0, 0, 0, 0.04);
    }
  }

  .nav-button-active {
    color: #B8860B !important;
    background: rgba(197, 151, 36, 0.08) !important;
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
}
</style>
