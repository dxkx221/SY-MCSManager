<script setup lang="ts">
import type { LayoutCard } from "@/types";
import {
  listRedeemPlans,
  createRedeemPlan,
  updateRedeemPlan,
  deleteRedeemPlans,
  type RedeemPlanItem
} from "@/services/apis/redeem";
import { remoteNodeList } from "@/services/apis";
import { message, Modal } from "ant-design-vue";
import { reportErrorMsg } from "@/tools/validator";
import { onMounted, ref } from "vue";
import { DeleteOutlined, EditOutlined } from "@ant-design/icons-vue";

defineProps<{ card: LayoutCard }>();

// ─── 套餐列表 ───
const plans = ref<RedeemPlanItem[]>([]);
const planNodes = ref<any[]>([]);
const plansLoading = ref(false);

const showPlanForm = ref(false);
const editingPlan = ref<RedeemPlanItem | null>(null);

const defaultPlanForm = () => ({
  name: "", durationUnit: "hour", durationValue: 24,
  productId: 1, daemonId: "", image: "",
  memory: 0, cpu: 0,
  portsEnabled: false, ports: "",
  envEnabled: false, env: "",
  startupCmd: "", stopCmd: "", cwd: "", maxSpace: 0,
  namePrefix: "", nameSuffixType: "userhash", nameSuffixValue: "",
  note: ""
});

const planForm = ref(defaultPlanForm());

const durationUnits = [
  { label: "小时", value: "hour" },
  { label: "天", value: "day" },
  { label: "月 (30天)", value: "month" },
  { label: "年 (365天)", value: "year" },
  { label: "永久", value: "permanent" }
];

const suffixTypes = [
  { label: "用户哈希 (6位)", value: "userhash" },
  { label: "用户名", value: "username" },
  { label: "数字递增", value: "increment" },
  { label: "自定义文本", value: "custom" },
  { label: "随机小写字母 (6位)", value: "random" }
];

const planColumns = [
  { title: "名称", key: "name", dataIndex: "name" },
  { title: "镜像", key: "image", dataIndex: "image" },
  { title: "时长", key: "duration" },
  { title: "操作", key: "actions" }
];

const formatDuration = (p: RedeemPlanItem) => {
  if (p.durationUnit === "permanent") return "永久";
  const map: Record<string, string> = { hour: "小时", day: "天", month: "月", year: "年" };
  return `${p.durationValue || 0} ${map[p.durationUnit] || "小时"}`;
};

const loadData = async () => {
  plansLoading.value = true;
  try {
    const [planRes, nodeRes] = await Promise.all([
      listRedeemPlans().execute(),
      remoteNodeList().execute()
    ]);
    plans.value = planRes.value ?? [];
    planNodes.value = nodeRes.value ?? [];
  } catch (err: any) { reportErrorMsg(err); }
  finally { plansLoading.value = false; }
};

const openNewPlan = () => {
  editingPlan.value = null;
  planForm.value = { ...defaultPlanForm() };
  showPlanForm.value = true;
};

const openEditPlan = (plan: RedeemPlanItem) => {
  editingPlan.value = plan;
  planForm.value = {
    name: plan.name || "",
    durationUnit: plan.durationUnit || "hour",
    durationValue: plan.durationValue || 24,
    productId: plan.productId || 1,
    daemonId: plan.daemonId || "",
    image: plan.image || "",
    memory: plan.memory || 0,
    cpu: plan.cpu || 0,
    portsEnabled: !!plan.portsEnabled,
    ports: plan.ports || "",
    envEnabled: !!plan.envEnabled,
    env: plan.env || "",
    startupCmd: plan.startupCmd || "",
    stopCmd: plan.stopCmd || "",
    cwd: plan.cwd || "",
    maxSpace: plan.maxSpace || 0,
    namePrefix: plan.namePrefix || "",
    nameSuffixType: plan.nameSuffixType || "userhash",
    nameSuffixValue: plan.nameSuffixValue || "",
    note: plan.note || ""
  };
  showPlanForm.value = true;
};

const handleSavePlan = async () => {
  if (!planForm.value.name.trim()) {
    planForm.value.name = planForm.value.image.trim() || "Docker 套餐";
  }
  if (!planForm.value.image.trim()) {
    message.warning("请填写 Docker 镜像");
    return;
  }
  if (!planForm.value.daemonId.trim()) {
    message.warning("请选择部署节点");
    return;
  }
  planForm.value.productId = planForm.value.productId || 1;
  try {
    if (editingPlan.value) {
      await updateRedeemPlan().execute({ data: { id: editingPlan.value.id, ...planForm.value } });
      message.success("套餐已更新");
    } else {
      await createRedeemPlan().execute({ data: planForm.value });
      message.success("套餐已创建");
    }
    showPlanForm.value = false;
    await loadData();
  } catch (err: any) { reportErrorMsg(err); }
};

const handleDeletePlan = async (id: string) => {
  Modal.confirm({
    title: "确定删除",
    content: "删除套餐后，已生成的兑换码不受影响，但不能再选择此套餐生成新兑换码。确定删除吗？",
    okText: "删除",
    okType: "danger",
    cancelText: "取消",
    onOk: async () => {
      try {
        await deleteRedeemPlans().execute({ data: [id] });
        message.success("已删除");
        await loadData();
      } catch (err: any) { reportErrorMsg(err); }
    }
  });
};

onMounted(() => { loadData(); });
</script>

<template>
  <CardPanel>
    <template #title>{{ card.title || "套餐管理" }}</template>
    <template #body>
      <div class="plan-manage-card">
        <div class="mb-16" style="text-align: right">
          <a-button type="primary" @click="openNewPlan">新建套餐</a-button>
        </div>

        <a-table
          :columns="planColumns"
          :data-source="plans"
          :loading="plansLoading"
          row-key="id"
          size="small"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'duration'">
              {{ formatDuration(record as RedeemPlanItem) }}
            </template>
            <template v-else-if="column.key === 'actions'">
              <a-button size="small" type="link" @click="openEditPlan(record as RedeemPlanItem)">
                <EditOutlined />
              </a-button>
              <a-button size="small" type="link" danger @click="handleDeletePlan(record.id)">
                <DeleteOutlined />
              </a-button>
            </template>
          </template>
        </a-table>

        <!-- 套餐表单弹窗 -->
        <a-modal
          v-model:visible="showPlanForm"
          :title="editingPlan ? '编辑套餐' : '新建套餐'"
          @ok="handleSavePlan"
          width="720px"
        >
          <a-form :model="planForm" layout="vertical">
            <!-- 基本信息 -->
            <a-row :gutter="16">
              <a-col :span="8">
                <a-form-item label="套餐名称">
                  <a-input v-model:value="planForm.name" placeholder="可选，留空用镜像名" />
                </a-form-item>
              </a-col>
              <a-col :span="8">
                <a-form-item label="时长单位">
                  <a-select v-model:value="planForm.durationUnit" :options="durationUnits" />
                </a-form-item>
              </a-col>
              <a-col :span="8" v-if="planForm.durationUnit !== 'permanent'">
                <a-form-item label="时长数值">
                  <a-input-number v-model:value="planForm.durationValue" :min="1" :max="9999" style="width: 100%" />
                </a-form-item>
              </a-col>
            </a-row>

            <!-- 资源 -->
            <a-row :gutter="16">
              <a-col :span="8">
                <a-form-item label="内存 (MB)">
                  <a-input-number v-model:value="planForm.memory" :min="0" :step="256" style="width: 100%" placeholder="例如 2048" />
                </a-form-item>
              </a-col>
              <a-col :span="8">
                <a-form-item label="CPU">
                  <a-input-number v-model:value="planForm.cpu" :min="0" :max="100" style="width: 100%" placeholder="例如 2" />
                </a-form-item>
              </a-col>
              <a-col :span="8">
                <a-form-item label="磁盘上限 (MB)">
                  <a-input-number v-model:value="planForm.maxSpace" :min="0" :step="1024" style="width: 100%" placeholder="0=不限制" />
                </a-form-item>
              </a-col>
            </a-row>

            <!-- Docker 镜像 + 节点 -->
            <a-row :gutter="16">
              <a-col :span="12">
                <a-form-item label="Docker 镜像" required>
                  <a-input v-model:value="planForm.image" placeholder="例如：itzg/minecraft-server" />
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item label="部署节点" required>
                  <a-select v-model:value="planForm.daemonId" placeholder="请选择节点" style="width: 100%">
                    <a-select-option v-for="n in planNodes" :key="n.uuid" :value="n.uuid">
                      {{ n.remarks || n.ip || n.uuid }}
                    </a-select-option>
                  </a-select>
                </a-form-item>
              </a-col>
            </a-row>

            <!-- 端口映射（开关 + 内容） -->
            <a-form-item>
              <template #label>
                <a-space>
                  端口映射
                  <a-switch v-model:checked="planForm.portsEnabled" size="small" />
                </a-space>
              </template>
              <a-textarea
                v-if="planForm.portsEnabled"
                v-model:value="planForm.ports"
                placeholder="25565:25565/tcp"
                :rows="2"
              />
            </a-form-item>

            <!-- 环境变量（开关 + 内容） -->
            <a-form-item>
              <template #label>
                <a-space>
                  环境变量
                  <a-switch v-model:checked="planForm.envEnabled" size="small" />
                </a-space>
              </template>
              <a-textarea
                v-if="planForm.envEnabled"
                v-model:value="planForm.env"
                placeholder="EULA=TRUE&#10;VERSION=1.21"
                :rows="3"
              />
            </a-form-item>

            <!-- 启动/停止/工作目录 -->
            <a-form-item label="启动命令">
              <a-input v-model:value="planForm.startupCmd" placeholder="留空使用镜像默认" />
            </a-form-item>
            <a-form-item label="停止命令">
              <a-input v-model:value="planForm.stopCmd" placeholder="留空使用镜像默认" />
            </a-form-item>
            <a-form-item label="工作目录">
              <a-input v-model:value="planForm.cwd" placeholder="容器内工作目录" />
            </a-form-item>

            <!-- 实例命名 -->
            <a-divider>实例命名规则</a-divider>
            <a-row :gutter="16">
              <a-col :span="12">
                <a-form-item label="名称前缀">
                  <a-input v-model:value="planForm.namePrefix" placeholder="例如：MC-" />
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item label="后缀类型">
                  <a-select v-model:value="planForm.nameSuffixType" :options="suffixTypes" />
                </a-form-item>
              </a-col>
            </a-row>
            <a-form-item v-if="planForm.nameSuffixType === 'custom'" label="自定义后缀文本">
              <a-input v-model:value="planForm.nameSuffixValue" placeholder="输入自定义后缀" />
            </a-form-item>
            <a-typography-paragraph type="secondary" style="font-size: 12px;">
              预览：<strong>{{ planForm.namePrefix || '无前缀' }} + {{ suffixTypes.find(s=>s.value===planForm.nameSuffixType)?.label || planForm.nameSuffixType }}</strong>
              — 下次兑换时生效
            </a-typography-paragraph>

            <!-- 备注 -->
            <a-form-item label="管理员备注">
              <a-input v-model:value="planForm.note" placeholder="管理员备注" />
            </a-form-item>
          </a-form>
        </a-modal>
      </div>
    </template>
  </CardPanel>
</template>

<style scoped lang="scss">
.plan-manage-card {
  padding: 16px;
  text-align: left;
}
.mb-16 { margin-bottom: 16px; }
</style>
