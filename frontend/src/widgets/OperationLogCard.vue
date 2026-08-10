<script setup lang="ts">
import CardPanel from "@/components/CardPanel.vue";
import { t } from "@/lang/i18n";
import type { LayoutCard } from "@/types";

import { useOperationLog } from "@/hooks/useOperationLog";
import dayjs from "dayjs";
import { onMounted } from "vue";

const { fetchData, formattedLogs } = useOperationLog();

defineProps<{
  card: LayoutCard;
}>();

onMounted(() => {
  fetchData();
});
</script>

<template>
  <card-panel>
    <template #title>
      {{ card.title }}
    </template>
    <template #body>
      <div class="time-line full-card-body-container scrollbar-hidden">
        <div v-if="formattedLogs.length === 0" class="empty-state">
          <div class="empty-text">{{ t("TXT_CODE_54469e02") }}</div>
          <div class="empty-description">{{ t("TXT_CODE_73102f2b") }}</div>
        </div>
        <a-timeline v-else>
          <a-timeline-item v-for="(item, index) in formattedLogs" :key="index" :color="item.color">
            <div class="log-item">
              <div class="log-content">{{ item.text }}</div>
              <div class="log-time">
                {{ dayjs(Number(item.operation_time)).format("YYYY-MM-DD HH:mm:ss") }}
              </div>
            </div>
          </a-timeline-item>
        </a-timeline>
      </div>
    </template>
  </card-panel>
</template>

<style lang="scss" scoped>
.time-line {
  // fix the top content of the component is blocked
  padding-top: 10px;
}

.log-item {
  margin-bottom: 12px;
  padding: 10px 12px;
  border-radius: 10px;
  background: var(--surface-inner, rgba(255, 255, 255, 0.08));
  border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.16));
  box-shadow: inset 0 1px rgba(255, 255, 255, 0.08);
  backdrop-filter: saturate(135%) blur(12px);
  -webkit-backdrop-filter: saturate(135%) blur(12px);
  transition: transform 0.16s ease, background-color 0.16s ease, border-color 0.16s ease;

  &:hover {
    background: var(--surface-hover, rgba(255, 255, 255, 0.13));
    border-color: color-mix(in srgb, var(--accent-primary) 24%, transparent);
    transform: translateY(-1px);
  }

  &:last-child {
    margin-bottom: 0;
  }
}

.log-content {
  font-size: 14px;
  line-height: 1.5;
  color: var(--text-primary, var(--text-color));
  margin-bottom: 4px;
  word-break: break-word;
}

.log-time {
  font-size: 12px;
  color: var(--text-muted, var(--text-color));
  font-family: "Consolas", "Monaco", monospace;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
  min-height: 120px;
}

.empty-text {
  font-size: 16px;
  color: var(--text-secondary, var(--text-color));
  margin-bottom: 8px;
  font-weight: 500;
}

.empty-description {
  font-size: 14px;
  color: var(--text-muted, var(--text-color));
  line-height: 1.4;
}
</style>
