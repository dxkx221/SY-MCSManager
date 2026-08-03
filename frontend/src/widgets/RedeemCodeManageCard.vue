<script setup lang="ts">
import type { LayoutCard } from "@/types";
import {
  listRedeemCodes,
  createRedeemCode,
  deleteRedeemCodes,
  listRedeemPlans,
  type RedeemCodeItem,
  type RedeemPlanItem
} from "@/services/apis/redeem";
import { remoteNodeList } from "@/services/apis";
import { message, Modal } from "ant-design-vue";
import { reportErrorMsg } from "@/tools/validator";
import { computed, onMounted, ref } from "vue";

defineProps<{ card: LayoutCard }>();

const DUR = [
  { label: "小时", value: "hour" },
  { label: "天", value: "day" },
  { label: "月 (30天)", value: "month" },
  { label: "年 (365天)", value: "year" },
  { label: "永久", value: "permanent" }
];

function u2h(u: string, v: number) {
  switch (u) { case "day": return v * 24; case "month": return v * 720; case "year": return v * 8760; case "permanent": return 876000; default: return v; }
}
function pd(p: RedeemPlanItem) {
  return p.durationUnit === "permanent" ? "永久" : `${p.durationValue} ${{ hour: "小时", day: "天", month: "月", year: "年" }[p.durationUnit] || "小时"}`;
}
function fh(h: number) {
  if (h >= 876000) return "永久";
  if (h % 8760 === 0) return `${h / 8760} 年`;
  if (h % 720 === 0) return `${h / 720} 月`;
  if (h % 24 === 0) return `${h / 24} 天`;
  return `${h} 小时`;
}

const codes = ref<RedeemCodeItem[]>([]);
const sel = ref<string[]>([]);
const l = ref(false);

const cols = [
  { title: "兑换码", key: "c", width: 180, fixed: "left" as const },
  { title: "时长", key: "h", width: 80 },
  { title: "使用", key: "u", width: 60 },
  { title: "备注", key: "n", ellipsis: true },
  { title: "创建", key: "by", width: 90 },
  { title: "时间", key: "at", width: 140 }
];

const lc = async () => {
  l.value = true;
  try { const r = await listRedeemCodes().execute({ params: { pageSize: 200 } }); codes.value = r.value?.data ?? []; }
  catch (e: any) { reportErrorMsg(e); }
  finally { l.value = false; }
};

const dc = async () => {
  if (!sel.value.length) return;
  Modal.confirm({
    title: "确定删除", content: `删除 ${sel.value.length} 个兑换码？`, okText: "删除", okType: "danger", cancelText: "取消",
    onOk: async () => { try { await deleteRedeemCodes().execute({ data: sel.value }); message.success("已删除"); lc(); } catch (e: any) { reportErrorMsg(e); } }
  });
};

const pid = ref<string | null>(null);
const du = ref("hour"), dv = ref(24), mx = ref(1), nt = ref("");
const img = ref(""), mdaemon = ref("");
const gl = ref(false);
const gr = ref<{ code: string } | null>(null);
const plans = ref<RedeemPlanItem[]>([]), nds = ref<any[]>([]);

const gdaemon = computed(() => pid.value ? (plans.value.find(p => p.id === pid.value)?.daemonId ?? "") : mdaemon.value);
const gh = computed(() => du.value === "permanent" ? 876000 : u2h(du.value, dv.value));

const onp = (id: string | null) => {
  pid.value = id || null;
  if (id) {
    const p = plans.value.find(x => x.id === id);
    if (p) { du.value = p.durationUnit || "hour"; dv.value = p.durationValue || 24; nt.value = p.note || ""; }
  }
};

const dg = async () => {
  if (!pid.value && !img.value.trim()) { message.warning("请选择套餐或输入 Docker 镜像"); return; }
  if (!gdaemon.value) { message.warning("请选择部署节点"); return; }
  gl.value = true;
  try {
    let cfg: any = {};
    if (pid.value) cfg.planId = pid.value;
    else cfg = { config: { nickname: img.value.trim(), type: "docker", docker: { image: img.value.trim() } }, daemonId: gdaemon.value, productId: 1 };
    const r = await createRedeemCode().execute({ data: { hours: gh.value, maxUses: mx.value, config: JSON.stringify(cfg), note: nt.value || undefined, planId: pid.value ?? undefined } });
    gr.value = r.value; message.success("兑换码已生成"); lc();
  } catch (e: any) { reportErrorMsg(e); }
  finally { gl.value = false; }
};

onMounted(async () => {
  await lc();
  try {
    const [pr, nr] = await Promise.all([listRedeemPlans().execute(), remoteNodeList().execute()]);
    plans.value = pr.value ?? [];
    nds.value = nr.value ?? [];
  } catch (e: any) { reportErrorMsg(e); }
});
</script>

<template>
  <CardPanel>
    <template #title>{{ card.title || "兑换码管理" }}</template>
    <template #body>
      <div class="redeem-root">

        <!-- ═══ 生成新兑换码 ═══ -->
        <div class="gen-box">
          <div class="gen-title">生成新兑换码</div>

          <div class="gen-field">
            <div class="gen-label">选择套餐</div>
            <a-select v-model:value="pid" allow-clear placeholder="不选则手动指定镜像和节点" @change="onp">
              <a-select-option v-for="p in plans" :key="p.id" :value="p.id">{{ p.name || p.image }} · {{ pd(p) }} · {{ p.memory }}MB</a-select-option>
            </a-select>
          </div>

          <div v-if="!pid" class="gen-field">
            <div class="gen-label">Docker 镜像</div>
            <a-input v-model:value="img" placeholder="例如: itzg/minecraft-server" />
          </div>

          <div v-if="!pid" class="gen-field">
            <div class="gen-label">部署节点</div>
            <a-select v-model:value="mdaemon" placeholder="选择部署节点">
              <a-select-option v-for="n in nds" :key="n.uuid" :value="n.uuid">{{ n.remarks || n.ip || n.uuid }}</a-select-option>
            </a-select>
          </div>

          <div class="gen-field">
            <div class="gen-label">时长</div>
            <a-select v-model:value="du" :options="DUR" style="width:130px" />
            <a-input-number v-if="du!=='permanent'" v-model:value="dv" :min="1" :max="9999" style="width:90px; margin-left:8px" />
            <span class="gen-hint">→ {{ fh(gh) }}</span>
          </div>

          <div class="gen-field">
            <div class="gen-label">使用次数</div>
            <a-input-number v-model:value="mx" :min="1" :max="9999" style="width:130px" />
          </div>

          <div class="gen-field">
            <div class="gen-label">备注</div>
            <a-input v-model:value="nt" placeholder="选填" />
          </div>

          <div class="gen-field">
            <a-button type="primary" :loading="gl" block @click="dg">生成兑换码</a-button>
          </div>

          <div v-if="gr" class="gen-ok">
            ✓ 兑换码 <a-typography-text copyable strong>{{ gr.code }}</a-typography-text>
          </div>
        </div>

        <!-- ═══ 全部兑换码 ═══ -->
        <div>
          <div class="list-header">
            <span class="list-title">全部兑换码</span>
            <a-button size="small" danger :disabled="!sel.length" @click="dc">删除选中 ({{ sel.length }})</a-button>
          </div>
          <a-table
            :columns="cols" :data-source="codes" :loading="l"
            :row-selection="{ selectedRowKeys: sel, onChange: (ks: string[])=>{ sel = ks } }"
            row-key="id" size="small" :pagination="{ pageSize: 20, showTotal: (t: number)=> `共 ${t} 个` }" :scroll="{ x: 700 }"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key==='c'">
                <a-typography-text copyable style="font-family:monospace;font-size:12px">{{ record.code }}</a-typography-text>
              </template>
              <template v-else-if="column.key==='h'">{{ fh(record.hours) }}</template>
              <template v-else-if="column.key==='u'">
                <span :style="{ color: record.usedCount >= record.maxUses ? '#bbb' : undefined }">{{ record.usedCount }}/{{ record.maxUses }}</span>
              </template>
              <template v-else-if="column.key==='at'">{{ new Date(record.createdAt).toLocaleString('zh-CN') }}</template>
            </template>
          </a-table>
        </div>

      </div>
    </template>
  </CardPanel>
</template>

<style lang="scss" scoped>
.redeem-root {
  text-align: left;
}

.gen-box {
  max-width: 480px;
  margin-bottom: 24px;
}

.gen-title {
  font-weight: 600;
  font-size: 14px;
  color: #303133;
  margin-bottom: 14px;
  padding-bottom: 8px;
  border-bottom: 1px solid #ebeef5;
}

.gen-field {
  margin-bottom: 12px;
}

.gen-label {
  font-size: 13px;
  color: #606266;
  margin-bottom: 5px;
}

.gen-field :deep(.ant-select),
.gen-field :deep(.ant-input) {
  width: 100%;
}

.gen-hint {
  color: #909399;
  font-size: 12px;
  margin-left: 8px;
}

.gen-ok {
  margin-top: 8px;
  padding: 10px 14px;
  background: #f0f9eb;
  border: 1px solid #c2e7b0;
  border-radius: 6px;
  font-size: 13px;
}

.list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.list-title {
  font-weight: 600;
  font-size: 14px;
  color: #303133;
}
</style>
