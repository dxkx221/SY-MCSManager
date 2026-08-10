<script setup lang="ts">
import { LinkOutlined } from "@ant-design/icons-vue";

defineProps<{
  icon?: any;
  title: string;
  click?: (...args: any) => any;
}>();
</script>

<template>
  <div class="actions-button w-100">
    <a-col :span="24">
      <div class="action-btn-item w-100 flex" @click="click">
        <div>
          <component :is="icon || LinkOutlined" />
        </div>
        <div class="ml-8">
          {{ title }}
        </div>
      </div>
    </a-col>
  </div>
</template>

<style scoped lang="scss">
.action-btn-item {
  padding: 20px 12px;
  border: 1px solid var(--card-border-color);
  background-color: var(--background-color-white);
  backdrop-filter: saturate(140%) blur(12px);
  -webkit-backdrop-filter: saturate(140%) blur(12px);

  cursor: pointer;
  user-select: none;
  transition: transform .16s ease, background-color .16s ease, border-color .16s ease, box-shadow .16s ease;
  border-radius: 10px;

  &:hover {
    border: 1px solid color-mix(in srgb, var(--color-primary) 32%, transparent);
    box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.16);
  }
}
</style>
