<script setup lang="ts">
import { useScreen } from "@/hooks/useScreen";
import { verifyEULA } from "@/hooks/useInstance";
import { userInfoApi } from "@/services/apis";
import { openInstance, restartInstance, stopInstance } from "@/services/apis/instance";
import { useAppStateStore } from "@/stores/useAppStateStore";
import { INSTANCE_STATUS_CODE } from "@/types/const";
import type { UserInstance } from "@/types/user";
import { CodeOutlined, MoreOutlined, PauseCircleOutlined, PlayCircleOutlined, RedoOutlined } from "@ant-design/icons-vue";
import { message, Modal } from "ant-design-vue";
import { computed, h, ref, watch } from "vue";
import { useRouter } from "vue-router";

type ActionName = "start" | "stop" | "restart";
const { isPhone } = useScreen();
const { isLogged } = useAppStateStore();
const router = useRouter();
const open = ref(false);
const instances = ref<UserInstance[]>([]);
const loading = ref(false);
const actingKey = ref("");
const visible = computed(() => isPhone.value && isLogged.value);

const refresh = async () => {
  if (!visible.value) return;
  loading.value = true;
  try {
    const res = await userInfoApi().execute({ params: { advanced: true } });
    instances.value = res.value?.instances || [];
  } finally {
    loading.value = false;
  }
};
watch(open, (value) => value && refresh());

const apiMap = { start: openInstance, stop: stopInstance, restart: restartInstance };
const labelMap = { start: "启动", stop: "停止", restart: "重启" };
const canStart = (instance: UserInstance) => instance.status === INSTANCE_STATUS_CODE.STOPPED;
const canStop = (instance: UserInstance) => instance.status === INSTANCE_STATUS_CODE.RUNNING;
const canRestart = (instance: UserInstance) => instance.status === INSTANCE_STATUS_CODE.RUNNING;
const statusText = (instance: UserInstance) => ({
  [INSTANCE_STATUS_CODE.BUSY]: "状态未知",
  [INSTANCE_STATUS_CODE.STOPPED]: "已停止",
  [INSTANCE_STATUS_CODE.STOPPING]: "停止中",
  [INSTANCE_STATUS_CODE.STARTING]: "启动中",
  [INSTANCE_STATUS_CODE.RUNNING]: "运行中"
}[instance.status] || "未知状态");
const executeAction = (action: ActionName, instance: UserInstance) => {
  Modal.confirm({
    title: `${labelMap[action]}实例？`,
    content: instance.nickname || instance.instanceUuid,
    okText: "确认",
    cancelText: "取消",
    okType: action === "stop" ? "danger" : "primary",
    async onOk() {
      if (action === "start") {
        const accepted = await verifyEULA(instance.instanceUuid, instance.daemonId);
        if (!accepted) return;
      }
      const key = `${action}:${instance.daemonId}:${instance.instanceUuid}`;
      actingKey.value = key;
      try {
        await apiMap[action]().execute({ params: { uuid: instance.instanceUuid, daemonId: instance.daemonId } });
        message.success(`${labelMap[action]}指令已发送`);
        await refresh();
      } catch (error: any) {
        message.error(error?.message || `${labelMap[action]}失败`);
        throw error;
      } finally {
        actingKey.value = "";
      }
    }
  });
};
const toTerminal = (instance: UserInstance) => {
  open.value = false;
  router.push({ path: "/instances/terminal", query: { daemonId: instance.daemonId, instanceId: instance.instanceUuid } });
};
</script>

<template>
  <a-button v-if="visible" class="mobile-actions-fab" type="primary" shape="circle" :icon="h(MoreOutlined)" @click="open = true" />
  <a-drawer v-model:open="open" title="我的实例" placement="bottom" height="72vh">
    <a-spin :spinning="loading">
      <div v-for="instance in instances" :key="`${instance.daemonId}:${instance.instanceUuid}`" class="instance-action-card">
        <div class="instance-summary"><strong>{{ instance.nickname || instance.instanceUuid }}</strong><small>{{ statusText(instance) }} · {{ instance.daemonId }} · {{ instance.instanceUuid }}</small></div>
        <div class="instance-buttons">
          <a-button :disabled="!canStart(instance)" :icon="h(PlayCircleOutlined)" :loading="actingKey === `start:${instance.daemonId}:${instance.instanceUuid}`" @click="executeAction('start', instance)">启动</a-button>
          <a-button danger :disabled="!canStop(instance)" :icon="h(PauseCircleOutlined)" :loading="actingKey === `stop:${instance.daemonId}:${instance.instanceUuid}`" @click="executeAction('stop', instance)">停止</a-button>
          <a-button :disabled="!canRestart(instance)" :icon="h(RedoOutlined)" :loading="actingKey === `restart:${instance.daemonId}:${instance.instanceUuid}`" @click="executeAction('restart', instance)">重启</a-button>
          <a-button type="primary" :icon="h(CodeOutlined)" @click="toTerminal(instance)">终端</a-button>
        </div>
      </div>
      <a-empty v-if="!loading && instances.length === 0" description="暂无可管理的实例" />
    </a-spin>
  </a-drawer>
</template>

<style scoped lang="scss">
.mobile-actions-fab { position: fixed; right: 18px; bottom: 82px; z-index: 22; width: 48px; height: 48px; box-shadow: 0 8px 24px rgba(0,0,0,.2); }
.instance-action-card { padding: 14px 0; border-bottom: 1px solid var(--border-default); }
.instance-summary { display: flex; flex-direction: column; gap: 4px; margin-bottom: 12px; color: var(--text-primary); }
.instance-summary small { color: var(--text-muted); overflow-wrap: anywhere; }
.instance-buttons { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
</style>
