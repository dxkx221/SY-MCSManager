<script setup lang="ts">
import { useAppStateStore } from "@/stores/useAppStateStore";
import { useLayoutConfigStore } from "@/stores/useLayoutConfig";
import { computed, onMounted, onUnmounted, ref } from "vue";

const { state: appState } = useAppStateStore();
const { getSettingsConfig } = useLayoutConfigStore();

const host = ref(window.location.host);
const now = ref(new Date());
const viewport = ref({ width: window.innerWidth, height: window.innerHeight });
let timer: ReturnType<typeof setInterval> | null = null;

const isLogged = computed(() => (appState?.userInfo?.permission ?? 0) > 0);
const watermarkEnabled = ref(true);
const username = computed(() => appState?.userInfo?.userName || "");

const timeStr = computed(() => {
  const d = now.value;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
});

const watermarkItems = computed(() => {
  const account = username.value || "MCSManager";
  const { width, height } = viewport.value;
  const mobile = width <= 420;
  const tablet = width <= 768;
  const cellWidth = mobile ? 172 : tablet ? 210 : 285;
  const cellHeight = mobile ? 132 : tablet ? 155 : 205;
  const inset = mobile ? 110 : tablet ? 130 : 160;
  const columns = Math.ceil((width + inset * 2) / cellWidth);
  const rows = Math.ceil((height + inset * 2) / cellHeight);
  const count = Math.max(80, columns * rows + columns * 2);
  return Array.from({ length: count }, (_, index) => ({
    id: index,
    host: host.value,
    account,
    time: timeStr.value
  }));
});

function updateViewport() {
  viewport.value = { width: window.innerWidth, height: window.innerHeight };
}

onMounted(async () => {
  host.value = window.location.host;
  updateViewport();
  window.addEventListener("resize", updateViewport, { passive: true });
  try {
    const cfg = await getSettingsConfig();
    watermarkEnabled.value = cfg?.theme?.watermarkEnabled !== false;
  } catch {
    /* default on */
  }
  timer = setInterval(() => {
    now.value = new Date();
  }, 1000);
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
  window.removeEventListener("resize", updateViewport);
});
</script>

<template>
  <div v-if="isLogged && watermarkEnabled" class="watermark-overlay" aria-hidden="true">
    <div v-for="item in watermarkItems" :key="item.id" class="watermark-cell">
      <div class="watermark-tile">
        <div class="watermark-line watermark-host">{{ item.host }}</div>
        <div class="watermark-line watermark-account">{{ item.account }}</div>
        <div class="watermark-line watermark-time">{{ item.time }}</div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.watermark-overlay {
  position: fixed;
  inset: -160px;
  z-index: 9999;
  pointer-events: none;
  overflow: hidden;
  user-select: none;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(285px, 1fr));
  grid-auto-rows: 205px;
  align-items: center;
  justify-items: center;
  opacity: 1;
}

.watermark-cell {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.watermark-tile {
  width: 255px;
  min-height: 88px;
  padding: 11px 18px;
  box-sizing: border-box;
  transform: rotate(-18deg);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  border-radius: 12px;
  color: rgba(96, 76, 48, 0.18);
  font-family:
    "Microsoft YaHei UI", "PingFang SC", "Hiragino Sans GB", "幼圆", "YouYuan", sans-serif;
  font-size: clamp(16px, 1.15vw, 19px);
  font-weight: 600;
  letter-spacing: 0.03em;
  line-height: 1.25;
  text-align: center;
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.42);
}

.watermark-line {
  width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.watermark-host {
  font-size: 1em;
}

.watermark-account {
  font-size: 0.96em;
}

.watermark-time {
  font-size: 0.92em;
  letter-spacing: 0.02em;
}

@media (max-width: 768px) {
  .watermark-overlay {
    inset: -130px;
    grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
    grid-auto-rows: 155px;
  }

  .watermark-tile {
    width: 198px;
    min-height: 78px;
    padding: 9px 13px;
    font-size: 14px;
    color: rgba(96, 76, 48, 0.2);
  }
}

@media (max-width: 420px) {
  .watermark-overlay {
    inset: -110px;
    grid-template-columns: repeat(auto-fill, minmax(172px, 1fr));
    grid-auto-rows: 132px;
  }

  .watermark-tile {
    width: 164px;
    min-height: 70px;
    font-size: 13px;
  }
}
</style>
