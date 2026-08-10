<script setup lang="ts">
import type { FunctionalComponent } from "vue";

defineProps<{
  title: string;
  textStyle?: any;
  icon?: FunctionalComponent;
  isActive?: boolean;
}>();
</script>

<template>
  <div :class="{ btn: true, isActive: isActive }">
    <component :is="icon" v-if="icon"></component>
    <a-typography-text class="text ml-6" :style="textStyle">
      {{ title }}
    </a-typography-text>
  </div>
</template>

<style lang="scss" scoped>
.isActive {
  background: var(--accent-soft, rgba(103, 184, 194, .12));
  color: var(--accent-primary, var(--color-primary)) !important;
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--accent-primary) 20%, transparent);
}
.btn {
  display: flex;
  text-align: center;
  display: flex;
  align-items: center;
  height: 40px;
  padding: 0px 12px;
  min-width: 40px;
  cursor: pointer;
  border-radius: 10px;
  transition: color .16s ease, background-color .16s ease, box-shadow .16s ease, transform .16s ease;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  width: 100%;

  .text {
    overflow: hidden;
    text-overflow: ellipsis;
    color: var(--text-secondary, var(--text-color));
  }

  &:hover {
    background: var(--surface-hover, rgba(103, 184, 194, .08));
    color: var(--accent-primary, var(--color-primary));
  }

  &:active { transform: scale(.985); }
}
</style>
