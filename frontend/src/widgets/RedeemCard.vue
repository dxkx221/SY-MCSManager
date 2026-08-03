<script setup lang="ts">
import type { LayoutCard } from "@/types";
import { requestBuyInstanceLocal } from "@/services/apis/redeem";
import { message } from "ant-design-vue";
import { ref } from "vue";
import { reportErrorMsg } from "@/tools/validator";
import { useRouter } from "vue-router";

defineProps<{
  card: LayoutCard;
}>();

const router = useRouter();
const code = ref("");
const loading = ref(false);
const result = ref<any>(null);

const handleRedeem = async () => {
  const value = code.value.trim().toUpperCase();
  if (!value) {
    message.warning("请输入兑换码");
    return;
  }
  loading.value = true;
  try {
    const res = await requestBuyInstanceLocal().execute({
      data: {
        code: value
      }
    });
    result.value = res.value;
    message.success("兑换成功，实例已开通");
  } catch (err: any) {
    reportErrorMsg(err);
  } finally {
    loading.value = false;
  }
};

const openInstance = () => {
  if (!result.value?.instance_id || !result.value?.daemon_id) return;
  router.push({
    path: "/instances/terminal",
    query: {
      instanceId: result.value.instance_id,
      daemonId: result.value.daemon_id
    }
  });
};
</script>

<template>
  <CardPanel>
    <template #title>{{ card.title || "兑换码" }}</template>
    <template #body>
      <div class="redeem-card">
        <a-typography-title :level="5">兑换实例开通码</a-typography-title>
        <a-input-search
          v-model:value="code"
          placeholder="请输入兑换码"
          enter-button="兑换"
          :loading="loading"
          @search="handleRedeem"
        />
        <a-alert v-if="result" type="success" class="mt-16" show-icon>
          <template #message>实例已成功开通</template>
          <template #description>
            <div>实例 ID： <a-typography-text copyable>{{ result.instance_id }}</a-typography-text></div>
            <div v-if="result.expire">到期时间： {{ new Date(result.expire).toLocaleString() }}</div>
            <a-button class="mt-12" type="primary" size="small" @click="openInstance">打开实例</a-button>
          </template>
        </a-alert>
        <a-typography-paragraph class="hint">
          If this code is a renewal code, open your instance first and use the renewal entrance there.
        </a-typography-paragraph>
      </div>
    </template>
  </CardPanel>
</template>

<style scoped lang="scss">
.redeem-card {
  padding: 16px;
  text-align: left;
}
.mt-16 { margin-top: 16px; }
.mt-12 { margin-top: 12px; }
.hint { margin-top: 16px; color: #888; }
</style>

