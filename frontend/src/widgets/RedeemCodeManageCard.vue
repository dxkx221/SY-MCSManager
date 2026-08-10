<script setup lang="ts">
import type { LayoutCard } from "@/types";
import {
  listRedeemCodes,
  createRedeemCode,
  batchCreateRedeemCodes,
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

const pid = ref<string | undefined>(undefined);
const mode = ref<"plan" | "custom">("plan");
const count = ref(1);
const du = ref("hour"), dv = ref(24), mx = ref(1), nt = ref("");
const img = ref(""), mdaemon = ref("");
const gl = ref(false);
const gr = ref<{ code?: string; codes?: string[]; count?: number } | null>(null);
const plans = ref<RedeemPlanItem[]>([]), nds = ref<any[]>([]);

const gdaemon = computed(() => pid.value ? (plans.value.find(p => p.id === pid.value)?.daemonId ?? "") : mdaemon.value);
const gh = computed(() => du.value === "permanent" ? 876000 : u2h(du.value, dv.value));

const onModeChange = () => {
  gr.value = null;
  if (mode.value === "custom") pid.value = undefined;
};

const onp = (id: any) => {
  const planId = typeof id === "string" ? id : undefined;
  pid.value = planId;
  if (planId) {
    mode.value = "plan";
    const p = plans.value.find(x => x.id === planId);
    if (p) { du.value = p.durationUnit || "hour"; dv.value = p.durationValue || 24; nt.value = p.note || ""; }
  }
};

const onSelChange = (keys: any[]) => {
  sel.value = keys.map(String);
};

const exportGenerated = () => {
  if (!gr.value) return;
  const codes = gr.value.codes?.length ? gr.value.codes : [gr.value.code].filter(Boolean);
  if (!codes.length) return;
  const header = `MCSManager 兑换码 - 生成时间: ${new Date().toLocaleString('zh-CN')}${nt.value ? ' | 备注: ' + nt.value : ''}`;
  const body = [header, ...codes].join('\n');
  const blob = new Blob([body], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `MCSManager_兑换码_${Date.now()}.txt`;
  a.click();
  URL.revokeObjectURL(url);
  message.success(`已导出 ${codes.length} 个兑换码`);
};

const dg = async () => {
  const usePlan = mode.value === "plan" && !!pid.value;
  if (mode.value === "plan" && !pid.value) { message.warning("请选择套餐"); return; }
  if (!usePlan && !img.value.trim()) { message.warning("请输入 Docker 镜像"); return; }
  if (!gdaemon.value) { message.warning("请选择部署节点"); return; }
  if (count.value < 1 || count.value > 500) { message.warning("生成数量需在 1 到 500 之间"); return; }
  gl.value = true;
  try {
    let cfg: any = {};
    if (usePlan) cfg.planId = pid.value;
    else cfg = { config: { nickname: img.value.trim(), type: "docker", docker: { image: img.value.trim() } }, daemonId: gdaemon.value, productId: 1 };
    const data = { hours: gh.value, maxUses: mx.value, config: JSON.stringify(cfg), note: nt.value || undefined, planId: usePlan ? pid.value : undefined };
    if (count.value === 1) {
      const r = await createRedeemCode().execute({ data });
      gr.value = r.value ?? null;
      message.success("兑换码已生成");
    } else {
      const r = await batchCreateRedeemCodes().execute({ data: { ...data, count: count.value } });
      gr.value = r.value ?? null;
      message.success(`已生成 ${r.value?.count ?? count.value} 个兑换码`);
    }
    lc();
  } catch (e: any) { reportErrorMsg(e); }
  finally { gl.value = false; }
};

onMounted(async () => {
  await lc();
  try {
    const pr = await listRedeemPlans().execute();
    plans.value = pr.value ?? [];
  } catch (e: any) {
    plans.value = [];
    reportErrorMsg(e);
  }

  try {
    const nr = await remoteNodeList().execute();
    nds.value = nr.value ?? [];
  } catch {
    // 节点列表只影响手动生成配置，不应影响套餐模式读取服务器套餐。
    nds.value = [];
  }
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
            <div class="gen-label">生成模式</div>
            <a-radio-group v-model:value="mode" button-style="solid" @change="onModeChange">
              <a-radio-button value="plan">使用套餐</a-radio-button>
              <a-radio-button value="custom">自定义配置</a-radio-button>
            </a-radio-group>
          </div>

          <div v-if="mode==='plan'" class="gen-field">
            <div class="gen-label">选择套餐</div>
            <a-select v-model:value="pid" placeholder="选择要批量生成的套餐" @change="onp as any">
              <a-select-option v-for="p in plans" :key="p.id" :value="p.id">{{ p.name || p.image }} · {{ pd(p) }} · {{ p.memory }}MB</a-select-option>
            </a-select>
          </div>

          <div v-if="mode==='custom'" class="gen-field">
            <div class="gen-label">Docker 镜像</div>
            <a-input v-model:value="img" placeholder="例如: itzg/minecraft-server" />
          </div>

          <div v-if="mode==='custom'" class="gen-field">
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

          <div class="gen-field gen-inline">
            <div>
              <div class="gen-label">生成数量</div>
              <a-input-number v-model:value="count" :min="1" :max="500" style="width:130px" />
            </div>
            <div>
              <div class="gen-label">每码可用次数</div>
              <a-input-number v-model:value="mx" :min="1" :max="9999" style="width:130px" />
            </div>
          </div>

          <div class="gen-field">
            <div class="gen-label">备注</div>
            <a-input v-model:value="nt" placeholder="选填" />
          </div>

          <div class="gen-field">
            <a-button type="primary" :loading="gl" block @click="dg">生成兑换码</a-button>
          </div>

          <div v-if="gr" class="gen-ok">
            <div class="gen-ok-top">
              <span>✓ 已生成 {{ gr.codes?.length || 1 }} 个兑换码</span>
              <a-button size="small" type="link" @click="exportGenerated">📥 导出为文件</a-button>
            </div>
            <template v-if="gr.codes?.length">
              <div class="code-list">
                <a-typography-text v-for="code in gr.codes" :key="code" copyable strong>{{ code }}</a-typography-text>
              </div>
            </template>
            <template v-else>
              <a-typography-text copyable strong>{{ gr.code }}</a-typography-text>
            </template>
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
            :row-selection="{ selectedRowKeys: sel as any, onChange: onSelChange as any }"
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
  color: var(--text-primary, var(--text-color));
  margin-bottom: 14px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border-subtle, var(--card-border-color));
}

.gen-field {
  margin-bottom: 12px;
}

.gen-inline {
  display: flex;
  gap: 14px;
  align-items: flex-start;
  flex-wrap: wrap;
}

.gen-label {
  font-size: 13px;
  color: var(--text-secondary, var(--text-color));
  margin-bottom: 5px;
}

.gen-field :deep(.ant-select),
.gen-field :deep(.ant-input) {
  width: 100%;
}

.gen-hint {
  color: var(--text-muted, var(--text-color));
  font-size: 12px;
  margin-left: 8px;
}

.gen-ok {
  margin-top: 8px;
  padding: 10px 14px;
  color: var(--status-success);
  background: var(--status-success-soft);
  border: 1px solid color-mix(in srgb, var(--status-success) 28%, transparent);
  border-radius: 10px;
  backdrop-filter: saturate(140%) blur(12px);
  -webkit-backdrop-filter: saturate(140%) blur(12px);
  font-size: 13px;
}

.gen-ok-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 4px;
}

.code-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 12px;
  margin-top: 8px;
  max-height: 160px;
  overflow: auto;
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
  color: var(--text-primary, var(--text-color));
}
</style>
