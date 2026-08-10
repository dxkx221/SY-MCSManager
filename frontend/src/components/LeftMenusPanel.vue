<script setup lang="ts">
import { useScreen } from "@/hooks/useScreen";
import { onMounted, ref, type FunctionalComponent } from "vue";
import LeftMenuBtn from "./LeftMenuBtn.vue";

const { isPhone } = useScreen();

interface LeftMenuItem {
  title: string;
  key: string;
  icon?: FunctionalComponent;
  click?: () => void;
}

const props = defineProps<{
  menus: LeftMenuItem[];
}>();

const activeKey = ref<string>();

const handleChangeMenu = (item: LeftMenuItem) => {
  activeKey.value = item.key;
  if (item.click) {
    item.click();
  }
};

const handleTabChange = (key: string | number) => {
  const item = props.menus.find((menu) => menu.key === String(key));
  if (item) handleChangeMenu(item);
};

const setActiveKey = (key: string) => {
  activeKey.value = key;
  const item = props.menus.find((menu) => menu.key === key);
  if (item?.click) item.click();
};

onMounted(() => {
  activeKey.value = props.menus[0].key;
});

defineExpose({
  setActiveKey
});
</script>

<template>
  <div v-if="!isPhone" class="menu-body">
    <div class="left-menu">
      <div v-for="item in props.menus" :key="item.key" class="mb-6" @click="handleChangeMenu(item)">
        <LeftMenuBtn
          :title="item.title"
          :icon="item.icon"
          :is-active="activeKey === item.key"
        ></LeftMenuBtn>
      </div>
    </div>
    <div class="right-content" style="text-align: left">
      <slot :name="activeKey"></slot>
    </div>
  </div>

  <div v-else class="ml-16 mr-16 mt-8 mb-8 mobile-menu-body">
    <a-tabs v-model:activeKey="activeKey" @change="handleTabChange">
      <a-tab-pane
        v-for="item in props.menus"
        :key="item.key"
        class="mb-6"
      >
        <template #tab>
          <!-- <component :is="item.icon"></component> -->
          {{ item.title }}
        </template>
        <div style="text-align: left">
          <slot :name="activeKey"></slot>
        </div>
      </a-tab-pane>
    </a-tabs>
  </div>
</template>

<style lang="scss" scoped>
.menu-body {
  height: 100%;
  .left-menu {
    height: 100%;
    float: left;
    width: 240px;
    padding: 12px 16px;
    background: var(--surface-inner, var(--background-color-white));
    border-right: 1px solid var(--border-subtle, var(--card-border-color));
    backdrop-filter: saturate(145%) blur(16px);
    -webkit-backdrop-filter: saturate(145%) blur(16px);
    border-top-left-radius: 12px;
    border-bottom-left-radius: 12px;
  }
  .right-content {
    padding-right: 1px;
    overflow: hidden;
    flex-grow: 1;
    text-align: left;
  }
}

.mobile-menu-body {
  overflow: visible;
  :deep(.ant-tabs-content-holder),
  :deep(.ant-tabs-content),
  :deep(.ant-tabs-tabpane) {
    overflow: visible;
  }
}
</style>
