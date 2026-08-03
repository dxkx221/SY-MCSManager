<script setup lang="ts">
import { t } from "@/lang/i18n";
import { onMounted } from "vue";
import type { LayoutCard } from "@/types";
import { userInfoApi } from "@/services/apis/index";
import { requestBuyInstanceLocal } from "@/services/apis/redeem";
import { message } from "ant-design-vue";
import { ref } from "vue";
import { reportErrorMsg } from "@/tools/validator";
import { useRouter } from "vue-router";
import { INSTANCE_STATUS, INSTANCE_STATUS_CODE } from "@/types/const";
import { parseTimestamp } from "../tools/time";

defineProps<{
  card: LayoutCard;
}>();

const router = useRouter();

const { execute, state } = userInfoApi();
const redeemCode = ref("");
const redeemLoading = ref(false);

const columns = [
  {
    title: t("TXT_CODE_f70badb9"),
    dataIndex: "nickname",
    key: "nickname"
  },
  {
    title: t("TXT_CODE_5476e012"),
    dataIndex: "status",
    key: "status",
    customRender: (e: { text: INSTANCE_STATUS_CODE }) => {
      return INSTANCE_STATUS[e.text] || e.text;
    }
  },
  {
    title: t("TXT_CODE_5ab2062d"),
    dataIndex: "lastDatetime",
    key: "lastDatetime",
    customRender: (e: { text: number }) => {
      return parseTimestamp(e.text);
    }
  },
  {
    title: t("TXT_CODE_fa920c0"),
    dataIndex: "endTime",
    key: "endTime",
    customRender: (e: { text: number }) => {
      return parseTimestamp(e.text) || t("TXT_CODE_abc080d");
    }
  },
  {
    title: t("TXT_CODE_fe731dfc"),
    key: "operate"
  }
];

const getInstanceList = async () => {
  await execute({
    params: {
      advanced: true
    }
  });
};

const handleRedeem = async () => {
  const code = redeemCode.value.trim().toUpperCase();
  if (!code) {
    message.warning("请输入兑换码");
    return;
  }
  redeemLoading.value = true;
  try {
    await requestBuyInstanceLocal().execute({ data: { code } });
    message.success("兑换成功，实例已开通");
    redeemCode.value = "";
    await getInstanceList();
  } catch (err: any) {
    reportErrorMsg(err);
  } finally {
    redeemLoading.value = false;
  }
};

const operate = (daemonId: string, instanceId: string) => {
  router.push({
    path: "/instances/terminal",
    query: {
      daemonId,
      instanceId
    }
  });
};

onMounted(() => {
  getInstanceList();
});
</script>

<template>
  <CardPanel>
    <template #title>{{ card.title }}</template>
    <template #body>
      <div class="redeem-bar">
        <a-input-search
          v-model:value="redeemCode"
          placeholder="请输入兑换码"
          enter-button="兑换"
          :loading="redeemLoading"
          @search="handleRedeem"
        />
      </div>
      <a-table
        :data-source="state?.instances"
        :columns="columns"
        :pagination="false"
        :scroll="{ x: 'max-content' }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'operate'">
            <a-button
              :disabled="record.status === INSTANCE_STATUS_CODE.BUSY"
              @click="operate(record.daemonId, record.instanceUuid)"
            >
              {{ t("TXT_CODE_aa43b248") }}
            </a-button>
          </template>
        </template>
      </a-table>
    </template>
  </CardPanel>
</template>

<style scoped lang="scss">
.redeem-bar {
  margin-bottom: 12px;
  max-width: 420px;
}
</style>

