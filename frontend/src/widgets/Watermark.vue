<script setup lang="ts">
import { useAppStateStore } from "@/stores/useAppStateStore";
import { computed, onMounted, onUnmounted, ref } from "vue";

const { state: appState } = useAppStateStore();

const now = ref(new Date());
let timer: ReturnType<typeof setInterval> | null = null;

const host = ref(window.location.host);

const isLogged = computed(() => (appState?.userInfo?.permission ?? 0) > 0);

const username = computed(() => appState?.userInfo?.userName || "");

const timeStr = computed(() => {
  const d = now.value;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
});

const lines = computed(() => [host.value, username.value, timeStr.value].filter(Boolean));

const cols = 4;
const rows = 4;
const cells = computed(() => {
  const arr: { row: number; col: number }[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      arr.push({ row: r, col: c });
    }
  }
  return arr;
});

onMounted(() => {
  // Refresh host on mount (just in case)
  host.value = window.location.host;
  // Update time every second
  timer = setInterval(() => { now.value = new Date(); }, 1000);
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
});
</script>

<template>
  <div v-if="isLogged" class="watermark-overlay" aria-hidden="true">
    <div
      v-for="cell in cells"
      :key="`${cell.row}-${cell.col}`"
      class="watermark-cell"
      :style="{ top: `${(cell.row / rows) * 100}%`, left: `${(cell.col / cols) * 100}%` }"
    >
      <div
        v-for="(line, i) in lines"
        :key="i"
        class="watermark-line"
      >{{ line }}</div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.watermark-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  pointer-events: none;
  overflow: hidden;
  user-select: none;
}

.watermark-cell {
  position: absolute;
  transform: translate(-50%, -50%) rotate(-18deg);
  transform-origin: center center;
  white-space: nowrap;
}

.watermark-line {
  font-size: 16px;
  line-height: 1.7;
  color: rgba(128, 128, 128, 0.22);
  text-align: center;
  font-family: "Microsoft YaHei", "PingFang SC", sans-serif;
}
</style>
