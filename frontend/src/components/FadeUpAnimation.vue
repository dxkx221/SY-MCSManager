<script setup lang="ts">
// Glass surfaces must render in their final composited state immediately.
// Route-entry transitions were removed because they caused a border-first / glass-later flash.
</script>

<template>
  <slot></slot>
</template>