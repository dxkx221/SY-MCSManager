<script setup lang="ts">
import { getProPanelUrl } from "@/components/IframeBox/config";
import IframeBox from "@/components/IframeBox/index.vue";
import LeftMenusPanel from "@/components/LeftMenusPanel.vue";
import Loading from "@/components/Loading.vue";
import { useUploadFileDialog } from "@/components/fc";
import { router } from "@/config/router";
import { SUPPORTED_LANGS, isCN, t } from "@/lang/i18n";
import { remoteNodeList, setSettingInfo, settingInfo } from "@/services/apis";
import { useAppConfigStore } from "@/stores/useAppConfigStore";
import { useLayoutConfigStore } from "@/stores/useLayoutConfig";
import { useLayoutContainerStore } from "@/stores/useLayoutContainerStore";
import { arrayFilter } from "@/tools/array";
import {
  listRedeemCodes,
  createRedeemCode,
  deleteRedeemCodes,
  listRedeemPlans,
  createRedeemPlan,
  updateRedeemPlan,
  deleteRedeemPlans,
  exportRedeemCodes,
  type RedeemCodeItem,
  type RedeemPlanItem
} from "@/services/apis/redeem";
import { reportErrorMsg } from "@/tools/validator";
import type { LayoutCard, Settings } from "@/types";
import {
  ApiOutlined,
  BankOutlined,
  BookOutlined,
  BugOutlined,
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
  GithubOutlined,
  GiftOutlined,
  LockOutlined,
  MailOutlined,
  MessageOutlined,
  MoneyCollectOutlined,
  PicLeftOutlined,
  PlusOutlined,
  ProjectOutlined,
  QuestionCircleOutlined,
  ShopOutlined
} from "@ant-design/icons-vue";
import { Modal, message, notification } from "ant-design-vue";
import { computed, onMounted, onUnmounted, ref, watch } from "vue";

defineProps<{
  card: LayoutCard;
}>();

const { execute, isReady } = settingInfo();
const { execute: submitExecute, isLoading: submitIsLoading } = setSettingInfo();
const { getSettingsConfig, setSettingsConfig } = useLayoutConfigStore();
const { setLogoImage, setBackgroundImage } = useAppConfigStore();
const { changeDesignMode, containerState } = useLayoutContainerStore();

interface MySettings extends Settings {
  pageTitle?: string;
  logoUrl?: string;
  faviconUrl?: string;
  bgUrl?: string;
  proLicenseKey?: string;
}

/** Main app navigation layout: "left" = sidebar, "right" = top header only. Synced from theme config. */
const sidebarPositionOptions = [
  { label: t("TXT_CODE_SETTINGS_LAYOUT_SIDEBAR_POSITION_LEFT"), value: "left" as const },
  { label: t("TXT_CODE_SETTINGS_LAYOUT_SIDEBAR_POSITION_RIGHT"), value: "right" as const }
];

const ApacheLicense = `Copyright ${new Date().getFullYear()} MCSManager

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.`;

const formData = ref<MySettings>();

const ssoSnapshot = ref({
  ssoType: "",
  ssoIssuer: "",
  ssoUserinfoUrl: "",
  ssoUserIdField: ""
});

/** Current sidebar position choice; persisted in layout config theme. */
const sidebarPosition = ref<"left" | "right">("left");

const submit = async (needReload: boolean = true) => {
  if (formData.value) {
    try {
      await submitExecute({
        data: {
          ...formData.value
        }
      });
      message.success(t("TXT_CODE_a7907771"));
      if (needReload) setTimeout(() => window.location.reload(), 600);
    } catch (error: any) {
      reportErrorMsg(error);
    }
  }
};

const menus = arrayFilter([
  {
    title: t("TXT_CODE_cdd555be"),
    key: "baseInfo",
    icon: ProjectOutlined
  },
  // {
  //   title: t("TXT_CODE_574ed474"),
  //   key: "pro",
  //   icon: SketchOutlined,
  //   condition: () => isCN()
  // },
  // {
  //   title: t("TXT_CODE_caf8ebb7"),
  //   key: "redeem",
  //   icon: KeyOutlined,
  //   condition: () => isCN()
  // },
  {
    title: t("TXT_CODE_1c18acc0"),
    key: "ui",
    icon: PicLeftOutlined
  },
  {
    title: t("TXT_CODE_9c3ca8f"),
    key: "security",
    icon: LockOutlined
  },
  {
    title: "邮箱注册",
    key: "mail",
    icon: MailOutlined
  },
  {
    title: "兑换码",
    key: "redeem",
    icon: GiftOutlined,
    click: () => { loadRedeemCodes(); loadRedeemPlansData(); }
  },
  {
    title: "套餐管理",
    key: "plans",
    icon: ShopOutlined,
    click: () => { loadRedeemPlansData(); }
  },
  {
    title: t("TXT_CODE_SSO_TAB_TITLE"),
    key: "sso",
    icon: ApiOutlined
  },
  {
    title: t("TXT_CODE_46cb40d5"),
    key: "sponsor",
    icon: MoneyCollectOutlined,
    condition: () => !isCN(),
    click: () => {
      let url = "https://www.patreon.com/mcsmanager";
      if (isCN()) url = "https://afdian.com/a/mcsmanager";
      window.open(url, "_blank");
    }
  },
  {
    title: t("TXT_CODE_3b4b656d"),
    key: "about",
    icon: QuestionCircleOutlined
  }
]);

const allLanguages = SUPPORTED_LANGS;

const allYesNo = [
  {
    label: t("TXT_CODE_52c8a730"),
    value: true
  },
  {
    label: t("TXT_CODE_718c9310"),
    value: false
  }
];

const totpDriftOptions = ref([
  {
    label: t("TXT_CODE_718c9310"),
    value: 0
  },
  {
    label: "30 s",
    value: 1
  },
  {
    label: "60 s",
    value: 2
  }
]);

const aboutLinks = computed(() => arrayFilter([
  {
    title: "GitHub",
    icon: GithubOutlined,
    url: (formData.value as any).brandGithub || "https://github.com/MCSManager/MCSManager"
  },
  ...((formData.value as any).brandWebsite ? [{
    title: "官方网站",
    icon: BankOutlined,
    url: (formData.value as any).brandWebsite
  }] : [])
]));

const contacts = computed(() => arrayFilter([
  {
    title: t("TXT_CODE_41dd4d19"),
    icon: BankOutlined,
    url: (formData.value as any).brandWebsite || "https://mcsmanager.com/"
  },
  ...((formData.value as any).brandEmail ? [{
    title: "联系邮箱",
    icon: MailOutlined,
    url: `mailto:${(formData.value as any).brandEmail}`
  }] : []),
  {
    title: t("TXT_CODE_74c3d3e5"),
    icon: BookOutlined,
    url: "https://docs.mcsmanager.com/"
  },
  {
    title: t("TXT_CODE_26407d1f"),
    icon: BugOutlined,
    url: "https://github.com/MCSManager/MCSManager/issues"
  }
]));

const ensureThemeConfig = async () => {
  const cfg = await getSettingsConfig();
  if (!cfg) {
    reportErrorMsg(t("TXT_CODE_b89780e2"));
    return null;
  }
  if (!cfg.theme) {
    cfg.theme = { pageTitle: "", logoImage: "", faviconImage: "", backgroundImage: "" };
  }
  return cfg;
};

const applyFavicon = (url?: string) => {
  let icon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
  if (!icon) {
    icon = document.createElement("link");
    icon.rel = "icon";
    document.head.appendChild(icon);
  }
  icon.href = url || "/favicon.ico";
};

const handleSavePageTitle = async () => {
  Modal.confirm({
    title: "保存网站标题",
    content: "保存后会刷新页面并立即生效。",
    async onOk() {
      const cfg = await ensureThemeConfig();
      if (!cfg?.theme) return;
      const newTitle = formData.value?.pageTitle?.trim() || t("TXT_CODE_47ae8ee6");
      cfg.theme.pageTitle = newTitle;
      document.title = newTitle;
      await setSettingsConfig(cfg);
      message.success(t("TXT_CODE_a7907771"));
    }
  });
};

const uploadLogo = async () => {
  if (formData.value) {
    const url = await useUploadFileDialog();
    if (url) {
      formData.value.logoUrl = url;
      setLogoImage(url);
    }
  }
};

const uploadFavicon = async () => {
  if (formData.value) {
    const url = await useUploadFileDialog();
    if (url) {
      formData.value.faviconUrl = url;
      applyFavicon(url);
    }
  }
};

const handleSaveLogoUrl = async (url?: string) => {
  Modal.confirm({
    title: "保存网站 Logo",
    content: "用于左上角品牌标识，建议使用横向透明 PNG/SVG。",
    async onOk() {
      const cfg = await ensureThemeConfig();
      if (!cfg?.theme) return;
      cfg.theme.logoImage = url ?? formData.value?.logoUrl ?? "";
      setLogoImage(cfg.theme.logoImage);
      await setSettingsConfig(cfg);
    }
  });
};

const handleSaveFaviconUrl = async (url?: string) => {
  Modal.confirm({
    title: "保存网站图标",
    content: "用于浏览器标签页图标，建议使用正方形 PNG/ICO。",
    async onOk() {
      const cfg = await ensureThemeConfig();
      if (!cfg?.theme) return;
      cfg.theme.faviconImage = url ?? formData.value?.faviconUrl ?? "";
      applyFavicon(cfg.theme.faviconImage);
      await setSettingsConfig(cfg);
    }
  });
};

const uploadBackground = async () => {
  const body = document.querySelector("body");
  if (formData.value && body) {
    const url = await useUploadFileDialog();
    if (url) {
      formData.value.bgUrl = url;
      setBackgroundImage(url);
    }
  }
};

const handleSaveBgUrl = async (url?: string) => {
  Modal.confirm({
    title: t("TXT_CODE_c0606ef4"),
    content: t("TXT_CODE_cf95364f"),
    async onOk() {
      const cfg = await ensureThemeConfig();
      if (!cfg?.theme) return;
      cfg.theme.backgroundImage = url ?? formData.value?.bgUrl ?? "";
      await setSettingsConfig(cfg);
    }
  });
};

/** Persist sidebar position to layout config; reloads the app so initAppTheme picks it up. */
const handleSaveSidebarPosition = async () => {
  const cfg = await getSettingsConfig();
  if (!cfg) {
    return reportErrorMsg(t("TXT_CODE_b89780e2"));
  }
  if (!cfg.theme) {
    cfg.theme = { pageTitle: "", logoImage: "", faviconImage: "", backgroundImage: "" };
  }
  cfg.theme.sidebarPosition = sidebarPosition.value;
  await setSettingsConfig(cfg);
  message.success(t("TXT_CODE_a7907771"));
};

const startDesignUI = async () => {
  changeDesignMode(true);
  notification.warning({
    placement: "bottom",
    type: "warning",
    message: t("TXT_CODE_7b1adf35"),
    description: t("TXT_CODE_6b6f1d3")
  });
};

const ssoMode = computed({
  get(): string {
    const fd = formData.value as any;
    if (!fd?.ssoEnabled) return "disabled";
    return fd.ssoType === "oauth2" ? "oauth2" : "oidc";
  },
  set(val: string) {
    const fd = formData.value as any;
    if (!fd) return;
    if (val === "disabled") {
      fd.ssoEnabled = false;
    } else {
      fd.ssoEnabled = true;
      fd.ssoType = val;
    }
  }
});

const isSsoIdentityChanged = (): boolean => {
  const fd = formData.value as any;
  if (!fd) return false;
  const snap = ssoSnapshot.value;
  const curType = fd.ssoType || "oidc";
  if (curType !== snap.ssoType) return true;
  if (curType === "oidc" && (fd.ssoIssuer || "") !== snap.ssoIssuer) return true;
  if (curType === "oauth2") {
    if ((fd.ssoUserinfoUrl || "") !== snap.ssoUserinfoUrl) return true;
    if ((fd.ssoUserIdField || "id") !== snap.ssoUserIdField) return true;
  }
  return false;
};

const doSubmitSso = async () => {
  await submit(false);
  const fd = formData.value as any;
  if (fd) {
    ssoSnapshot.value = {
      ssoType: fd.ssoType || "oidc",
      ssoIssuer: fd.ssoIssuer || "",
      ssoUserinfoUrl: fd.ssoUserinfoUrl || "",
      ssoUserIdField: fd.ssoUserIdField || "id"
    };
  }
};

const submitSso = async () => {
  const fd = formData.value as any;
  if (fd?.ssoEnabled) {
    if (!fd.ssoClientId?.trim() || !fd.ssoClientSecret?.trim()) {
      return message.error(t("TXT_CODE_SSO_ENABLE_REQUIRES_CONFIG"));
    }
    if (fd.ssoType === "oauth2") {
      if (!fd.ssoAuthorizeUrl?.trim() || !fd.ssoTokenUrl?.trim() || !fd.ssoUserinfoUrl?.trim()) {
        return message.error(t("TXT_CODE_SSO_OAUTH2_REQUIRES_URLS"));
      }
    } else {
      if (!fd.ssoIssuer?.trim()) {
        return message.error(t("TXT_CODE_SSO_ENABLE_REQUIRES_CONFIG"));
      }
    }
  }
  if (isSsoIdentityChanged()) {
    Modal.confirm({
      title: t("TXT_CODE_SSO_IDENTITY_CHANGE_TITLE"),
      content: t("TXT_CODE_SSO_IDENTITY_CHANGE_CONFIRM"),
      okType: "danger",
      async onOk() {
        await doSubmitSso();
      }
    });
    return;
  }
  await doSubmitSso();
};

// ─── Redeem code state ───
const DUR_OPTIONS = [
  { label: "小时", value: "hour" },
  { label: "天", value: "day" },
  { label: "月 (30天)", value: "month" },
  { label: "年 (365天)", value: "year" },
  { label: "永久", value: "permanent" }
];

const formatHours = (h: number) => {
  if (h >= 876000) return "永久";
  if (h % 8760 === 0) return `${h / 8760} 年`;
  if (h % 720 === 0) return `${h / 720} 月`;
  if (h % 24 === 0) return `${h / 24} 天`;
  return `${h} 小时`;
};

const pd = (p: RedeemPlanItem) => {
  if (!p.durationUnit) return `${p.hours} 小时`;
  return p.durationUnit === "permanent" ? "永久" : `${p.durationValue} ${{ hour: "小时", day: "天", month: "月", year: "年" }[p.durationUnit] || "小时"}`;
};

const genDurationUnit = ref("hour");
const genDurationValue = ref(24);
const genHours = computed(() => {
  if (genDurationUnit.value === "permanent") return 876000;
  const v = genDurationValue.value;
  switch (genDurationUnit.value) {
    case "day": return v * 24;
    case "month": return v * 720;
    case "year": return v * 8760;
    default: return v;
  }
});
const genMaxUses = ref(1);
const genNote = ref("");
const genImage = ref("");
const genDaemonId = ref("");
const genLoading = ref(false);
const genResult = ref("");

const redeemCodes = ref<RedeemCodeItem[]>([]);
const redeemLoading = ref(false);
const selectedCodes = ref<string[]>([]);

const redeemColumns = [
  { title: "兑换码", key: "code", dataIndex: "code" },
  { title: "时长", key: "hours", dataIndex: "hours" },
  { title: "使用次数", key: "uses" },
  { title: "备注", key: "note", dataIndex: "note" },
  { title: "创建时间", key: "createdAt", dataIndex: "createdAt" },
  { title: "创建人", key: "createdBy", dataIndex: "createdBy" }
];

const onCodeSelectChange = (keys: string[]) => {
  selectedCodes.value = keys;
};

const handleGenerateCode = async () => {
  if (!genPlanId.value) {
    if (!genImage.value.trim()) {
      message.warning("请填写 Docker 镜像名");
      return;
    }
    if (!genDaemonId.value.trim()) {
      message.warning("请选择要部署的节点");
      return;
    }
  }
  genLoading.value = true;
  genResult.value = "";
  try {
    const res = await createRedeemCode().execute({
      data: {
        hours: genHours.value,
        maxUses: genMaxUses.value,
        config: genPlanId.value
          ? "{}"
          : JSON.stringify({
              productId: 1,
              daemonId: genDaemonId.value,
              config: {
                nickname: genImage.value.trim(),
                type: "docker",
                docker: {
                  image: genImage.value.trim()
                }
              }
            }),
        planId: genPlanId.value ?? undefined,
        note: genNote.value
      }
    });
    genResult.value = res.value?.code ?? "";
    await loadRedeemCodes();
  } catch (err: any) {
    reportErrorMsg(err);
  } finally {
    genLoading.value = false;
  }
};

const loadRedeemCodes = async () => {
  redeemLoading.value = true;
  try {
    const res = await listRedeemCodes().execute({ params: { pageSize: 100 } });
    redeemCodes.value = res.value?.data ?? [];
  } catch {
    // ignore
  } finally {
    redeemLoading.value = false;
  }
};

const handleDeleteCodes = async () => {
  if (selectedCodes.value.length === 0) return;
  Modal.confirm({
    title: "确认删除选中的兑换码？",
    content: `将删除 ${selectedCodes.value.length} 个兑换码，此操作不可撤销。`,
    okType: "danger",
    async onOk() {
      try {
        await deleteRedeemCodes().execute({ data: selectedCodes.value });
        message.success("已删除");
        selectedCodes.value = [];
        await loadRedeemCodes();
      } catch (err: any) {
        reportErrorMsg(err);
      }
    }
  });
};

// ─── Export ───
const exportPlanId = ref<string | null>(null);
const handleExportAll = async () => {
  try {
    await exportRedeemCodes();
    message.success("导出成功");
  } catch (e: any) {
    reportErrorMsg(e);
  }
};
const handleExportByPlan = async () => {
  if (!exportPlanId.value) { message.warning("请先选择套餐"); return; }
  try {
    await exportRedeemCodes(exportPlanId.value);
    message.success("导出成功");
  } catch (e: any) {
    reportErrorMsg(e);
  }
};

// ─── 套餐 state ───
const plans = ref<RedeemPlanItem[]>([]);
const planNodes = ref<any[]>([]);
const plansLoading = ref(false);
const showPlanForm = ref(false);
const editingPlan = ref<RedeemPlanItem | null>(null);
const planForm = ref({
  name: "",
  durationUnit: "hour",
  durationValue: 24,
  productId: 1,
  daemonId: "",
  image: "",
  memory: 0,
  cpu: 0,
  ports: "",
  env: "",
  startupCmd: "",
  stopCmd: "",
  cwd: "",
  maxSpace: 0,
  note: ""
});
// In redeem gen form: selected plan (null = manual)
const genPlanId = ref<string | null>(null);

const loadRedeemPlansData = async () => {
  plansLoading.value = true;
  try {
    const [planRes, nodeRes] = await Promise.all([
      listRedeemPlans().execute(),
      remoteNodeList().execute()
    ]);
    plans.value = planRes.value ?? [];
    planNodes.value = nodeRes.value ?? [];
  } catch {
    // ignore
  } finally {
    plansLoading.value = false;
  }
};

const openNewPlan = () => {
  editingPlan.value = null;
  planForm.value = {
    name: "", durationUnit: "hour", durationValue: 24, productId: 1, daemonId: "", image: "", memory: 0, cpu: 0,
    ports: "", env: "", startupCmd: "", stopCmd: "", cwd: "", maxSpace: 0, note: ""
  };
  showPlanForm.value = true;
};

const openEditPlan = (plan: RedeemPlanItem) => {
  editingPlan.value = plan;
  planForm.value = {
    name: plan.name, durationUnit: plan.durationUnit || "hour", durationValue: plan.durationValue || 24,
    productId: plan.productId || 1, daemonId: plan.daemonId || "", image: plan.image,
    memory: plan.memory, cpu: plan.cpu, ports: plan.ports,
    env: plan.env, startupCmd: plan.startupCmd, stopCmd: plan.stopCmd,
    cwd: plan.cwd, maxSpace: plan.maxSpace, note: plan.note
  };
  showPlanForm.value = true;
};

const handleSavePlan = async () => {
  if (!planForm.value.name.trim()) {
    planForm.value.name = planForm.value.image.trim() || "Docker 套餐";
  }
  if (!planForm.value.image.trim()) {
    message.warning("请填写 Docker 镜像名");
    return;
  }
  if (!planForm.value.daemonId.trim()) {
    message.warning("请选择要部署的节点");
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
    await loadRedeemPlansData();
  } catch (err: any) {
    reportErrorMsg(err);
  }
};

const handleDeletePlan = async (id: string) => {
  Modal.confirm({
    title: "确认删除套餐？",
    content: "该套餐会被永久删除，已生成的兑换码不受影响。",
    okType: "danger",
    async onOk() {
      try {
        await deleteRedeemPlans().execute({ data: [id] });
        message.success("已删除");
        await loadRedeemPlansData();
      } catch (err: any) {
        reportErrorMsg(err);
      }
    }
  });
};

const onGenPlanSelect = (planId: string) => {
  genPlanId.value = planId || null;
  if (planId) {
    const plan = plans.value.find((p) => p.id === planId);
    if (plan) {
      genDurationUnit.value = plan.durationUnit || "hour";
      genDurationValue.value = plan.durationValue || 24;
      genNote.value = plan.note || "";
    }
  }
};

const leftMenusPanelRef = ref<InstanceType<typeof LeftMenusPanel>>();

const toTemplate = {
  path: "/market/editor",
  new: () =>
    router.push({
      path: toTemplate.path,
      query: {
        newTemplate: "true"
      }
    }),
  edit: () =>
    router.push({
      path: toTemplate.path,
      query: {}
    })
};

onMounted(async () => {
  const res = await execute();
  const cfg = await getSettingsConfig();
  formData.value = res.value!;
  const fd = formData.value as any;
  ssoSnapshot.value = {
    ssoType: fd.ssoType || "oidc",
    ssoIssuer: fd.ssoIssuer || "",
    ssoUserinfoUrl: fd.ssoUserinfoUrl || "",
    ssoUserIdField: fd.ssoUserIdField || "id"
  };
  if (cfg?.theme?.logoImage) {
    formData.value.logoUrl = cfg.theme.logoImage;
  }
  if (cfg?.theme?.faviconImage) {
    formData.value.faviconUrl = cfg.theme.faviconImage;
    applyFavicon(cfg.theme.faviconImage);
  }
  if (cfg?.theme?.backgroundImage) {
    formData.value.bgUrl = cfg.theme.backgroundImage;
  }
  if (cfg?.theme?.pageTitle) {
    formData.value.pageTitle = cfg.theme.pageTitle;
  } else {
    formData.value.pageTitle = t("TXT_CODE_47ae8ee6");
  }
  if (cfg?.theme?.sidebarPosition === "left" || cfg?.theme?.sidebarPosition === "right") {
    sidebarPosition.value = cfg.theme.sidebarPosition;
  }
  setTimeout(() => {
    if (router.currentRoute.value.query.tab === "pro") {
      leftMenusPanelRef.value?.setActiveKey("pro");
    }
    if (router.currentRoute.value.query.tab === "mail") {
      leftMenusPanelRef.value?.setActiveKey("mail");
    }
    if (router.currentRoute.value.query.tab === "redeem") {
      leftMenusPanelRef.value?.setActiveKey("redeem");
      loadRedeemCodes();
      loadRedeemPlansData();
    }
    if (router.currentRoute.value.query.tab === "plans") {
      leftMenusPanelRef.value?.setActiveKey("plans");
      loadRedeemPlansData();
    }
  }, 100);
});



onUnmounted(() => {
  const route = router.currentRoute.value;
  router.replace({
    query: {
      ...route.query,
      tab: undefined
    }
  });
});
</script>

<template>
  <div>
    <CardPanel v-if="isReady && formData" class="CardWrapper" style="height: 100%" :padding="false">
      <template #body>
        <LeftMenusPanel ref="leftMenusPanelRef" :menus="menus">
          <template #baseInfo>
            <div class="content-box" :style="{ maxHeight: card.height }">
              <a-typography-title :level="4" class="mb-24">
                {{ t("TXT_CODE_5206cf41") }}
              </a-typography-title>
              <div style="text-align: left">
                <a-form :model="formData" layout="vertical">
                  <a-form-item>
                    <a-typography-title :level="5">{{ t("TXT_CODE_a1a59b08") }}</a-typography-title>
                    <a-typography-paragraph>
                      <a-typography-text type="secondary">
                        {{ t("TXT_CODE_2abeb185") }}
                        <br />
                        {{ t("TXT_CODE_d648ff91") }}
                      </a-typography-text>
                    </a-typography-paragraph>
                    <a-select v-model:value="formData.language" style="max-width: 320px">
                      <a-select-option
                        v-for="item in allLanguages"
                        :key="item.value"
                        :value="item.value"
                      >
                        {{ item.label }}
                      </a-select-option>
                    </a-select>
                  </a-form-item>

                  <a-form-item>
                    <a-typography-title :level="5">{{ t("TXT_CODE_7f0017d2") }}</a-typography-title>
                    <a-typography-paragraph type="secondary">
                      {{ t("TXT_CODE_233624ad") }}
                    </a-typography-paragraph>
                    <a-input
                      v-model:value="formData.httpPort"
                      style="max-width: 320px"
                      :placeholder="t('TXT_CODE_4ea93630')"
                    />
                  </a-form-item>

                  <a-form-item>
                    <a-typography-title :level="5">{{ t("TXT_CODE_6265ae47") }}</a-typography-title>
                    <a-typography-paragraph type="secondary">
                      {{ t("TXT_CODE_24c4768a") }}
                    </a-typography-paragraph>
                    <a-input
                      v-model:value="formData.presetPackAddr"
                      :placeholder="t('TXT_CODE_4ea93630')"
                      style="max-width: 320px"
                    />

                    <a-button class="mx-8" type="primary" @click="toTemplate.edit">
                      {{ t("TXT_CODE_ad207008") }}
                      <EditOutlined />
                    </a-button>
                    <a-button @click="toTemplate.new">
                      {{ t("TXT_CODE_53499d7") }}
                      <PlusOutlined />
                    </a-button>
                  </a-form-item>

                  <a-form-item>
                    <a-typography-title :level="5">{{ t("TXT_CODE_514e064a") }}</a-typography-title>
                    <a-typography-paragraph type="secondary">
                      {{ t("TXT_CODE_328191e") }}
                    </a-typography-paragraph>
                    <a-input
                      v-model:value="formData.httpIp"
                      style="max-width: 320px"
                      :placeholder="t('TXT_CODE_4ea93630')"
                    />
                  </a-form-item>

                  <a-form-item>
                    <a-typography-title :level="5">面板 ID</a-typography-title>
                    <a-typography-paragraph type="secondary">
                      {{ t("TXT_CODE_e2976753") }}
                      <br />
                      <span v-if="formData.panelId">
                        {{ t("TXT_CODE_e56cced3") }}
                      </span>
                      <span v-else>
                        {{ t("TXT_CODE_699b4b66") }}
                      </span>
                    </a-typography-paragraph>
                    <a-input
                      v-model:value="formData.panelId"
                      :placeholder="t('TXT_CODE_4ea93630')"
                    />
                  </a-form-item>

                  <div class="button">
                    <a-button type="primary" :loading="submitIsLoading" @click="submit()">
                      {{ t("TXT_CODE_abfe9512") }}
                    </a-button>
                  </div>
                </a-form>
              </div>
            </div>
          </template>

          <template #ui>
            <div class="content-box" :style="{ maxHeight: card.height }">
              <a-typography-title :level="4" class="mb-24">
                {{ t("TXT_CODE_1c18acc0") }}
              </a-typography-title>
              <div style="text-align: left">
                <a-form :model="formData" layout="vertical">
                  <a-form-item>
                    <a-typography-title :level="5">
                      {{ t("TXT_CODE_SETTINGS_LAYOUT_SIDEBAR_POSITION_TITLE") }}
                    </a-typography-title>
                    <a-typography-paragraph type="secondary">
                      {{ t("TXT_CODE_SETTINGS_LAYOUT_SIDEBAR_POSITION_DESCRIPTION") }}
                    </a-typography-paragraph>
                    <a-select v-model:value="sidebarPosition" style="max-width: 320px">
                      <a-select-option
                        v-for="opt in sidebarPositionOptions"
                        :key="opt.value"
                        :value="opt.value"
                      >
                        {{ opt.label }}
                      </a-select-option>
                    </a-select>
                    <a-button
                      type="primary"
                      class="ml-6 mt-2"
                      :loading="submitIsLoading"
                      @click="handleSaveSidebarPosition"
                    >
                      {{ t("TXT_CODE_abfe9512") }}
                    </a-button>
                  </a-form-item>

                  <a-form-item>
                    <a-typography-title :level="5">网站标题</a-typography-title>
                    <a-typography-paragraph type="secondary">
                      显示在浏览器标签页和窗口标题，用于商用品牌命名。
                    </a-typography-paragraph>
                    <a-input
                      v-model:value="formData.pageTitle"
                      style="max-width: 420px"
                      placeholder="例如：云端开服控制台"
                    />
                  </a-form-item>

                  <div class="button mb-24">
                    <a-button
                      type="primary"
                      :loading="submitIsLoading"
                      @click="handleSavePageTitle()"
                    >
                      {{ t("TXT_CODE_abfe9512") }}
                    </a-button>
                  </div>

                  <a-form-item>
                    <a-typography-title :level="5">{{ t("TXT_CODE_ebd2a6a1") }}</a-typography-title>
                    <a-typography-paragraph>
                      <a-typography-text type="secondary">
                        <div>
                          {{ t("TXT_CODE_ba717ff3") }}
                        </div>
                      </a-typography-text>
                    </a-typography-paragraph>
                    <a-button
                      v-if="!containerState.isDesignMode"
                      type="default"
                      :loading="submitIsLoading"
                      @click="startDesignUI()"
                    >
                      {{ t("TXT_CODE_bc46c15b") }}
                    </a-button>
                    <p v-if="containerState.isDesignMode">
                      {{ t("TXT_CODE_3b24a247") }}
                    </p>
                  </a-form-item>

                  <a-form-item>
                    <a-typography-title :level="5">{{ t("TXT_CODE_b5b33dd4") }}</a-typography-title>
                    <a-typography-paragraph>
                      <a-typography-text type="secondary">
                        {{ t("TXT_CODE_c26e5fb7") }}
                      </a-typography-text>
                    </a-typography-paragraph>
                    <a-textarea
                      v-model:value="formData.loginInfo"
                      :rows="4"
                      :placeholder="t('TXT_CODE_4ea93630')"
                    />
                  </a-form-item>

                  <div class="button mb-24">
                    <a-button type="primary" :loading="submitIsLoading" @click="submit()">
                      {{ t("TXT_CODE_abfe9512") }}
                    </a-button>
                  </div>

                  <a-form-item>
                    <a-typography-title :level="5">网站图标 Favicon</a-typography-title>
                    <a-typography-paragraph>
                      <a-typography-text type="secondary">
                        浏览器标签页的小图标，建议上传 64x64 或 128x128 的 PNG/ICO。
                      </a-typography-text>
                    </a-typography-paragraph>
                    <a-typography-paragraph>
                      <div class="flex">
                        <a-input
                          v-model:value="formData.faviconUrl"
                          style="max-width: 420px"
                          placeholder="上传后自动填入图片地址"
                        />
                        <a-button class="ml-6" @click="() => uploadFavicon()">
                          上传图标
                        </a-button>
                      </div>
                    </a-typography-paragraph>
                    <a-button type="primary" class="mr-6" @click="handleSaveFaviconUrl()">
                      保存图标
                    </a-button>
                    <a-button danger @click="handleSaveFaviconUrl('')">
                      清除
                    </a-button>
                  </a-form-item>

                  <a-form-item>
                    <a-typography-title :level="5">网站 Logo</a-typography-title>
                    <a-typography-paragraph>
                      <a-typography-text type="secondary">
                        左上角品牌 Logo，替换原 MCSM 横向图片。建议上传透明背景的长方形 PNG/SVG。
                      </a-typography-text>
                    </a-typography-paragraph>
                    <a-typography-paragraph>
                      <div class="flex">
                        <a-input
                          v-model:value="formData.logoUrl"
                          style="max-width: 420px"
                          placeholder="上传后自动填入图片地址"
                        />
                        <a-button class="ml-6" @click="() => uploadLogo()">
                          上传 Logo
                        </a-button>
                      </div>
                    </a-typography-paragraph>
                    <a-button type="primary" class="mr-6" @click="handleSaveLogoUrl()">
                      保存 Logo
                    </a-button>
                    <a-button danger @click="handleSaveLogoUrl('')">
                      清除
                    </a-button>
                  </a-form-item>

                  <a-form-item>
                    <a-typography-title :level="5">{{ t("TXT_CODE_8ae0dc90") }}</a-typography-title>
                    <a-typography-paragraph>
                      <a-typography-text type="secondary">
                        <div>
                          {{ t("TXT_CODE_434786c9") }}
                        </div>
                        <div>
                          {{ t("TXT_CODE_cf95364f") }}
                        </div>
                      </a-typography-text>
                    </a-typography-paragraph>
                    <a-typography-paragraph>
                      <div class="flex">
                        <a-input
                          v-model:value="formData.bgUrl"
                          style="max-width: 320px"
                          :placeholder="t('TXT_CODE_4ea93630')"
                        />
                        <a-button class="ml-6" @click="() => uploadBackground()">
                          {{ t("TXT_CODE_ae09d79d") }}
                        </a-button>
                      </div>
                    </a-typography-paragraph>
                    <a-button type="primary" class="mr-6" @click="handleSaveBgUrl()">
                      {{ t("TXT_CODE_abfe9512") }}
                    </a-button>
                    <a-button danger @click="handleSaveBgUrl('')">
                      {{ t("TXT_CODE_50d471b2") }}
                    </a-button>
                  </a-form-item>

                  <!-- 品牌基础信息 -->
                  <a-divider />
                  <a-typography-title :level="5">
                    品牌信息
                    <a-tag color="blue" style="margin-left:8px;vertical-align:middle">神之翼</a-tag>
                  </a-typography-title>
                  <a-typography-paragraph type="secondary">
                    自定义面板品牌标识。默认使用「神之翼工作室」，可按需修改为您的品牌。
                    修改后登录页、注册页、页面标题等处将自动更新。
                  </a-typography-paragraph>

                  <a-form-item label="品牌名称">
                    <a-input
                      v-model:value="(formData as any).brandName"
                      style="max-width: 420px"
                      placeholder="例如：XX 游戏云面板"
                    />
                    <div style="color:#909399;font-size:12px;margin-top:4px">
                      登录页副标题、注册页提示、页面导航栏将显示此名称。修改后需退出登录才能看到新名称。
                    </div>
                  </a-form-item>

                  <a-form-item label="品牌所有者">
                    <a-input
                      v-model:value="(formData as any).brandOwner"
                      style="max-width: 420px"
                      placeholder="公司名称 / 个人名称"
                    />
                  </a-form-item>

                  <a-form-item label="联系邮箱">
                    <a-input
                      v-model:value="(formData as any).brandEmail"
                      style="max-width: 420px"
                      placeholder="admin@example.com"
                    />
                  </a-form-item>

                  <a-form-item label="GitHub 仓库">
                    <a-input
                      v-model:value="(formData as any).brandGithub"
                      style="max-width: 420px"
                      placeholder="https://github.com/your/repo"
                    />
                  </a-form-item>

                  <a-form-item label="官网地址">
                    <a-input
                      v-model:value="(formData as any).brandWebsite"
                      style="max-width: 420px"
                      placeholder="https://your-site.com"
                    />
                  </a-form-item>

                  <div class="button mb-24">
                    <a-button type="primary" :loading="submitIsLoading" @click="submit()">
                      {{ t("TXT_CODE_abfe9512") }}
                    </a-button>
                  </div>
                </a-form>
              </div>
            </div>
          </template>

          <template #security>
            <div class="content-box" :style="{ maxHeight: card.height }">
              <a-typography-title :level="4" class="mb-24">
                {{ t("TXT_CODE_9c3ca8f") }}
              </a-typography-title>
              <div style="text-align: left">
                <a-form :model="formData" layout="vertical">
                  <a-typography-title :level="5">
                    {{ t("TXT_CODE_ef0ce2e") }}
                  </a-typography-title>
                  <a-typography-paragraph>
                    <a-typography-text type="secondary">
                      {{ t("TXT_CODE_fcde7b2e") }}
                      <br />
                      {{ t("TXT_CODE_af19b7b5") }}
                    </a-typography-text>
                  </a-typography-paragraph>

                  <a-form-item>
                    <a-typography-title :level="5">
                      {{ t("TXT_CODE_95192169") }}
                    </a-typography-title>
                    <a-typography-paragraph>
                      <a-typography-text type="secondary">
                        {{ t("TXT_CODE_820260c5") }}
                      </a-typography-text>
                    </a-typography-paragraph>
                    <a-select
                      v-model:value.prop="(formData as any).enableApiKey"
                      style="max-width: 320px"
                    >
                      <a-select-option
                        v-for="item in allYesNo"
                        :key="item.value"
                        :value="item.value"
                      >
                        {{ item.label }}
                      </a-select-option>
                    </a-select>
                  </a-form-item>

                  <a-form-item>
                    <a-typography-title :level="5">
                      {{ t("TXT_CODE_a583cae4") }}
                    </a-typography-title>
                    <a-typography-paragraph>
                      <a-typography-text type="secondary">
                        {{ t("TXT_CODE_bfbdf579") }}
                      </a-typography-text>
                    </a-typography-paragraph>
                    <a-select
                      v-model:value.prop="(formData as any).allowChangeCmd"
                      style="max-width: 320px"
                    >
                      <a-select-option
                        v-for="item in allYesNo"
                        :key="item.value"
                        :value="item.value"
                      >
                        {{ item.label }}
                      </a-select-option>
                    </a-select>
                  </a-form-item>

                  <a-form-item>
                    <a-typography-title :level="5">
                      {{ t("TXT_CODE_adab942e") }}
                    </a-typography-title>
                    <a-typography-paragraph>
                      <a-typography-text type="secondary">
                        {{ t("TXT_CODE_ceb783a9") }}
                        <br />
                        {{ t("TXT_CODE_e5b7522d") }}
                      </a-typography-text>
                    </a-typography-paragraph>
                    <a-select
                      v-model:value.prop="(formData as any).canFileManager"
                      style="max-width: 320px"
                    >
                      <a-select-option
                        v-for="item in allYesNo"
                        :key="item.value"
                        :value="item.value"
                      >
                        {{ item.label }}
                      </a-select-option>
                    </a-select>
                  </a-form-item>

                  <a-form-item>
                    <a-typography-title :level="5">
                      {{ t("TXT_CODE_3c93920b") }}
                    </a-typography-title>
                    <a-typography-paragraph>
                      <a-typography-text type="secondary">
                        {{ t("TXT_CODE_bc2e52a0") }}
                      </a-typography-text>
                    </a-typography-paragraph>
                    <a-select
                      v-model:value.prop="(formData as any).allowUsePreset"
                      style="max-width: 320px"
                    >
                      <a-select-option
                        v-for="item in allYesNo"
                        :key="item.value"
                        :value="item.value"
                      >
                        {{ item.label }}
                      </a-select-option>
                    </a-select>
                  </a-form-item>

                  <a-form-item>
                    <a-typography-title :level="5">
                      {{ t("TXT_CODE_405cd346") }}
                    </a-typography-title>
                    <a-typography-paragraph>
                      <a-typography-text type="secondary">
                        {{ t("TXT_CODE_6655c905") }}
                      </a-typography-text>
                    </a-typography-paragraph>

                    <a-select
                      v-model:value.prop="(formData as any).crossDomain"
                      style="max-width: 320px"
                    >
                      <a-select-option
                        v-for="item in allYesNo"
                        :key="item.value"
                        :value="item.value"
                      >
                        {{ item.label }}
                      </a-select-option>
                    </a-select>
                  </a-form-item>

                  <a-form-item>
                    <a-typography-title :level="5">
                      {{ t("TXT_CODE_gzip_compress") }}
                    </a-typography-title>
                    <a-typography-paragraph>
                      <a-typography-text type="secondary">
                        {{ t("TXT_CODE_gzip_compress_desc") }}
                      </a-typography-text>
                    </a-typography-paragraph>

                    <a-select v-model:value.prop="(formData as any).gzip" style="max-width: 320px">
                      <a-select-option
                        v-for="item in allYesNo"
                        :key="item.value"
                        :value="item.value"
                      >
                        {{ item.label }}
                      </a-select-option>
                    </a-select>
                  </a-form-item>

                  <a-form-item>
                    <a-typography-title :level="5">
                      {{ t("TXT_CODE_f0789d81") }}
                    </a-typography-title>
                    <a-typography-paragraph>
                      <a-typography-text type="secondary">
                        {{ t("TXT_CODE_2b85af6d") }}
                      </a-typography-text>
                    </a-typography-paragraph>

                    <a-select
                      v-model:value.prop="(formData as any).reverseProxyMode"
                      style="max-width: 320px"
                    >
                      <a-select-option
                        v-for="item in allYesNo"
                        :key="item.value"
                        :value="item.value"
                      >
                        {{ item.label }}
                      </a-select-option>
                    </a-select>
                  </a-form-item>

                  <a-form-item v-show="(formData as any).reverseProxyMode">
                    <a-typography-title :level="5">
                      {{ t("TXT_CODE_66aeac82") }}
                    </a-typography-title>
                    <a-typography-paragraph>
                      <a-typography-text type="secondary">
                        {{ t("TXT_CODE_fd8bc51f") }}
                      </a-typography-text>
                    </a-typography-paragraph>

                    <a-input
                      v-model:value="(formData as any).reverseProxyHeader"
                      style="max-width: 320px"
                      :placeholder="t('TXT_CODE_4ea93630')"
                    />
                  </a-form-item>

                  <a-form-item>
                    <a-typography-title :level="5">
                      {{ t("TXT_CODE_1d67c9c6") }}
                    </a-typography-title>
                    <a-typography-paragraph>
                      <a-typography-text type="secondary">
                        {{ t("TXT_CODE_745fc959") }}
                      </a-typography-text>
                    </a-typography-paragraph>

                    <a-select
                      v-model:value.prop="(formData as any).loginCheckIp"
                      style="max-width: 320px"
                    >
                      <a-select-option
                        v-for="item in allYesNo"
                        :key="item.value"
                        :value="item.value"
                      >
                        {{ item.label }}
                      </a-select-option>
                    </a-select>
                  </a-form-item>

                  <a-form-item>
                    <a-typography-title :level="5">
                      {{ t("TXT_CODE_b026be33") }}
                    </a-typography-title>
                    <a-typography-paragraph>
                      <a-typography-text type="secondary">
                        {{ t("TXT_CODE_a77b1a21") }}
                      </a-typography-text>
                    </a-typography-paragraph>

                    <a-select
                      v-model:value="formData.totpDriftToleranceSteps"
                      style="max-width: 320px"
                    >
                      <a-select-option
                        v-for="item in totpDriftOptions"
                        :key="item.value"
                        :value="item.value"
                      >
                        {{ item.label }}
                      </a-select-option>
                    </a-select>
                  </a-form-item>

                  <div class="button">
                    <a-button type="primary" :loading="submitIsLoading" @click="submit(false)">
                      {{ t("TXT_CODE_abfe9512") }}
                    </a-button>
                  </div>
                </a-form>
              </div>
            </div>
          </template>

          <template #sso>
            <div class="content-box" :style="{ maxHeight: card.height }">
              <a-typography-title :level="4" class="mb-24">
                {{ t("TXT_CODE_SSO_TAB_TITLE") }}
              </a-typography-title>
              <div style="text-align: left">
                <a-form :model="formData" layout="vertical">
                  <a-form-item>
                    <a-typography-title :level="5">
                      {{ t("TXT_CODE_SSO_ENABLE") }}
                    </a-typography-title>
                    <a-typography-paragraph type="secondary">
                      {{ t("TXT_CODE_SSO_ENABLE_DESC") }}
                    </a-typography-paragraph>
                    <a-select v-model:value="ssoMode" style="max-width: 320px">
                      <a-select-option value="disabled">
                        {{ t("TXT_CODE_718c9310") }}
                      </a-select-option>
                      <a-select-option value="oidc">OpenID Connect (OIDC)</a-select-option>
                      <a-select-option value="oauth2">OAuth 2.0</a-select-option>
                    </a-select>
                  </a-form-item>

                  <template v-if="(formData as any).ssoEnabled">
                    <a-form-item>
                      <a-typography-title :level="5">
                        {{ t("TXT_CODE_SSO_PROVIDER_NAME") }}
                      </a-typography-title>
                      <a-typography-paragraph type="secondary">
                        {{ t("TXT_CODE_SSO_PROVIDER_NAME_DESC") }}
                      </a-typography-paragraph>
                      <a-input
                        v-model:value="(formData as any).ssoProviderName"
                        style="max-width: 320px"
                        :placeholder="t('TXT_CODE_4ea93630')"
                      />
                    </a-form-item>

                    <a-form-item>
                      <a-typography-title :level="5">
                        {{ t("TXT_CODE_SSO_ICON_URL") }}
                      </a-typography-title>
                      <a-typography-paragraph type="secondary">
                        {{ t("TXT_CODE_SSO_ICON_URL_DESC") }}
                      </a-typography-paragraph>
                      <a-input
                        v-model:value="(formData as any).ssoIconUrl"
                        style="max-width: 320px"
                        :placeholder="t('TXT_CODE_4ea93630')"
                      />
                    </a-form-item>

                    <!-- OIDC-specific: Issuer URL -->
                    <a-form-item v-if="ssoMode === 'oidc'">
                      <a-typography-title :level="5">
                        {{ t("TXT_CODE_SSO_ISSUER") }}
                      </a-typography-title>
                      <a-typography-paragraph type="secondary">
                        {{ t("TXT_CODE_SSO_ISSUER_DESC") }}
                      </a-typography-paragraph>
                      <a-input
                        v-model:value="(formData as any).ssoIssuer"
                        style="max-width: 480px"
                        placeholder="https://accounts.example.com"
                      />
                    </a-form-item>

                    <!-- OAuth 2.0-specific fields -->
                    <template v-if="ssoMode === 'oauth2'">
                      <a-form-item>
                        <a-typography-title :level="5">
                          {{ t("TXT_CODE_SSO_AUTHORIZE_URL") }}
                        </a-typography-title>
                        <a-typography-paragraph type="secondary">
                          {{ t("TXT_CODE_SSO_AUTHORIZE_URL_DESC") }}
                        </a-typography-paragraph>
                        <a-input
                          v-model:value="(formData as any).ssoAuthorizeUrl"
                          style="max-width: 480px"
                          placeholder="https://github.com/login/oauth/authorize"
                        />
                      </a-form-item>

                      <a-form-item>
                        <a-typography-title :level="5">
                          {{ t("TXT_CODE_SSO_TOKEN_URL") }}
                        </a-typography-title>
                        <a-typography-paragraph type="secondary">
                          {{ t("TXT_CODE_SSO_TOKEN_URL_DESC") }}
                        </a-typography-paragraph>
                        <a-input
                          v-model:value="(formData as any).ssoTokenUrl"
                          style="max-width: 480px"
                          placeholder="https://github.com/login/oauth/access_token"
                        />
                      </a-form-item>

                      <a-form-item>
                        <a-typography-title :level="5">
                          {{ t("TXT_CODE_SSO_USERINFO_URL") }}
                        </a-typography-title>
                        <a-typography-paragraph type="secondary">
                          {{ t("TXT_CODE_SSO_USERINFO_URL_DESC") }}
                        </a-typography-paragraph>
                        <a-input
                          v-model:value="(formData as any).ssoUserinfoUrl"
                          style="max-width: 480px"
                          placeholder="https://api.github.com/user"
                        />
                      </a-form-item>

                      <a-form-item>
                        <a-typography-title :level="5">
                          {{ t("TXT_CODE_SSO_USER_ID_FIELD") }}
                        </a-typography-title>
                        <a-typography-paragraph type="secondary">
                          {{ t("TXT_CODE_SSO_USER_ID_FIELD_DESC") }}
                        </a-typography-paragraph>
                        <a-input
                          v-model:value="(formData as any).ssoUserIdField"
                          style="max-width: 320px"
                          placeholder="id"
                        />
                      </a-form-item>

                      <a-form-item>
                        <a-typography-title :level="5">
                          {{ t("TXT_CODE_SSO_SCOPES") }}
                        </a-typography-title>
                        <a-typography-paragraph type="secondary">
                          {{ t("TXT_CODE_SSO_SCOPES_DESC") }}
                        </a-typography-paragraph>
                        <a-input
                          v-model:value="(formData as any).ssoScopes"
                          style="max-width: 320px"
                          placeholder="read:user"
                        />
                      </a-form-item>
                    </template>

                    <a-form-item>
                      <a-typography-title :level="5">客户端 ID</a-typography-title>
                      <a-typography-paragraph type="secondary">
                        {{ t("TXT_CODE_SSO_CLIENT_ID_DESC") }}
                      </a-typography-paragraph>
                      <a-input
                        v-model:value="(formData as any).ssoClientId"
                        style="max-width: 480px"
                        :placeholder="t('TXT_CODE_4ea93630')"
                      />
                    </a-form-item>

                    <a-form-item>
                      <a-typography-title :level="5">客户端密钥</a-typography-title>
                      <a-typography-paragraph type="secondary">
                        {{ t("TXT_CODE_SSO_CLIENT_SECRET_DESC") }}
                      </a-typography-paragraph>
                      <a-input-password
                        v-model:value="(formData as any).ssoClientSecret"
                        style="max-width: 480px"
                        :placeholder="t('TXT_CODE_4ea93630')"
                      />
                    </a-form-item>

                    <a-form-item>
                      <a-typography-title :level="5">
                        {{ t("TXT_CODE_SSO_CALLBACK_URL") }}
                      </a-typography-title>
                      <a-typography-paragraph type="secondary">
                        {{ t("TXT_CODE_SSO_CALLBACK_URL_DESC") }}
                      </a-typography-paragraph>
                      <a-input
                        v-model:value="(formData as any).ssoCallbackUrl"
                        style="max-width: 480px"
                        placeholder="https://your-panel.com/api/auth/sso/callback"
                      />
                    </a-form-item>

                    <a-form-item>
                      <a-typography-title :level="5">
                        {{ t("TXT_CODE_SSO_ONLY_MODE") }}
                      </a-typography-title>
                      <a-typography-paragraph type="secondary">
                        {{ t("TXT_CODE_SSO_ONLY_MODE_DESC") }}
                      </a-typography-paragraph>
                      <a-select
                        v-model:value.prop="(formData as any).ssoOnlyMode"
                        style="max-width: 320px"
                      >
                        <a-select-option
                          v-for="item in allYesNo"
                          :key="item.value"
                          :value="item.value"
                        >
                          {{ item.label }}
                        </a-select-option>
                      </a-select>
                    </a-form-item>

                    <a-form-item>
                      <a-typography-title :level="5">
                        {{ t("TXT_CODE_SSO_AUTO_REDIRECT") }}
                      </a-typography-title>
                      <a-typography-paragraph type="secondary">
                        {{ t("TXT_CODE_SSO_AUTO_REDIRECT_DESC") }}
                      </a-typography-paragraph>
                      <a-select
                        v-model:value.prop="(formData as any).ssoAutoRedirect"
                        style="max-width: 320px"
                      >
                        <a-select-option
                          v-for="item in allYesNo"
                          :key="item.value"
                          :value="item.value"
                        >
                          {{ item.label }}
                        </a-select-option>
                      </a-select>
                    </a-form-item>
                  </template>

                  <div class="button">
                    <a-button type="primary" :loading="submitIsLoading" @click="submitSso">
                      {{ t("TXT_CODE_abfe9512") }}
                    </a-button>
                  </div>
                </a-form>
              </div>
            </div>
          </template>

          <template #pro>
            <IframeBox :src="getProPanelUrl('/status')" :height="card.height" />
          </template>

          <!-- ─── 邮箱注册设置 Card ─── -->
          <template #mail>
            <div class="content-box" :style="{ maxHeight: card.height }">
              <a-typography-title :level="4" class="mb-24">
                邮箱注册设置
              </a-typography-title>
              <div style="text-align: left">
                <a-form :model="formData" layout="vertical">
                  <a-form-item>
                    <a-typography-title :level="5">启用邮件发送</a-typography-title>
                    <a-typography-paragraph type="secondary">
                      用于给用户发送注册验证码。
                    </a-typography-paragraph>
                    <a-select v-model:value.prop="(formData as any).smtpEnabled" style="max-width: 320px">
                      <a-select-option v-for="item in allYesNo" :key="item.value" :value="item.value">
                        {{ item.label }}
                      </a-select-option>
                    </a-select>
                  </a-form-item>

                  <template v-if="(formData as any).smtpEnabled">
                    <a-form-item>
                      <a-typography-title :level="5">SMTP 服务器</a-typography-title>
                      <a-typography-paragraph type="secondary">
                        例如：smtp.qq.com、smtp.163.com
                      </a-typography-paragraph>
                      <a-input v-model:value="(formData as any).smtpHost" style="max-width: 320px" placeholder="smtp.qq.com" />
                    </a-form-item>

                    <a-form-item>
                      <a-typography-title :level="5">SMTP 端口</a-typography-title>
                      <a-typography-paragraph type="secondary">
                        常用 587（TLS）或 465（SSL）。
                      </a-typography-paragraph>
                      <a-input-number v-model:value="(formData as any).smtpPort" style="max-width: 200px" :min="1" :max="65535" />
                    </a-form-item>

                    <a-form-item>
                      <a-typography-title :level="5">SSL/TLS 加密</a-typography-title>
                      <a-typography-paragraph type="secondary">
                        465 端口通常开启，587 端口通常关闭。
                      </a-typography-paragraph>
                      <a-select v-model:value.prop="(formData as any).smtpSecure" style="max-width: 320px">
                        <a-select-option v-for="item in allYesNo" :key="item.value" :value="item.value">
                          {{ item.label }}
                        </a-select-option>
                      </a-select>
                    </a-form-item>

                    <a-form-item>
                      <a-typography-title :level="5">SMTP 账号</a-typography-title>
                      <a-typography-paragraph type="secondary">
                        用于发送邮件的邮箱账号。
                      </a-typography-paragraph>
                      <a-input v-model:value="(formData as any).smtpUser" style="max-width: 320px" placeholder="发信邮箱账号" />
                    </a-form-item>

                    <a-form-item>
                      <a-typography-title :level="5">SMTP 密码/授权码</a-typography-title>
                      <a-typography-paragraph type="secondary">
                        QQ/163 等邮箱请填写授权码，不要填写登录密码。
                      </a-typography-paragraph>
                      <a-input-password v-model:value="(formData as any).smtpPass" style="max-width: 320px" placeholder="邮箱授权码" />
                    </a-form-item>

                    <a-form-item>
                      <a-typography-title :level="5">发件人显示</a-typography-title>
                      <a-typography-paragraph type="secondary">
                        邮件中显示的发件人，留空则自动使用 SMTP 账号。
                      </a-typography-paragraph>
                      <a-input v-model:value="(formData as any).smtpFrom" style="max-width: 320px" placeholder="MCSManager <noreply@example.com>" />
                    </a-form-item>

                    <a-form-item>
                      <a-typography-title :level="5">开放邮箱注册</a-typography-title>
                      <a-typography-paragraph type="secondary">
                        允许用户在登录页通过邮箱 + 验证码注册账号。
                      </a-typography-paragraph>
                      <a-select v-model:value.prop="(formData as any).publicRegister" style="max-width: 320px">
                        <a-select-option v-for="item in allYesNo" :key="item.value" :value="item.value">
                          {{ item.label }}
                        </a-select-option>
                      </a-select>
                    </a-form-item>

                    <div class="button">
                      <a-button type="primary" :loading="submitIsLoading" @click="submit(false)">
                        {{ t("TXT_CODE_abfe9512") }}
                      </a-button>
                    </div>
                  </template>
                </a-form>
              </div>
            </div>
          </template>

          <!-- ─── Redeem Code Card ─── -->
          <template #redeem>
            <div class="content-box" :style="{ maxHeight: card.height }">
              <a-typography-title :level="4" class="mb-24">
                兑换码管理
              </a-typography-title>
              <div style="text-align: left">
                <!-- 生成兑换码 Section -->
                <a-card size="small" class="mb-20" title="生成兑换码">
                  <div class="gen-form-v">
                    <div class="gen-f">
                      <div class="gen-l">选择套餐</div>
                      <a-select
                        v-model:value="genPlanId"
                        placeholder="不选则手动配置"
                        allow-clear
                        @change="onGenPlanSelect"
                        style="width:100%"
                      >
                        <a-select-option
                          v-for="p in plans"
                          :key="p.id"
                          :value="p.id"
                        >
                          {{ p.name }} · {{ pd(p) }} · {{ p.memory }}MB
                        </a-select-option>
                      </a-select>
                    </div>

                    <div v-if="!genPlanId" class="gen-f">
                      <div class="gen-l">Docker 镜像</div>
                      <a-input v-model:value="genImage" placeholder="例如: itzg/minecraft-server" style="width:100%" />
                    </div>

                    <div v-if="!genPlanId" class="gen-f">
                      <div class="gen-l">部署节点</div>
                      <a-select v-model:value="genDaemonId" placeholder="选择部署节点" style="width:100%">
                        <a-select-option v-for="n in planNodes" :key="n.uuid" :value="n.uuid">
                          {{ n.remarks || n.ip || n.uuid }}
                        </a-select-option>
                      </a-select>
                    </div>

                    <div class="gen-f">
                      <div class="gen-l">时长</div>
                      <div style="display:flex; gap:8px; align-items:center">
                        <a-select v-model:value="genDurationUnit" :options="DUR_OPTIONS" style="width:140px" />
                        <a-input-number v-if="genDurationUnit!=='permanent'" v-model:value="genDurationValue" :min="1" :max="9999" style="width:100px" />
                        <span style="color:#909399; font-size:12px; white-space:nowrap">→ {{ formatHours(genHours) }}</span>
                      </div>
                    </div>

                    <div class="gen-f">
                      <div class="gen-l">最大使用次数</div>
                      <a-input-number v-model:value="genMaxUses" :min="1" :max="9999" style="width:100%" />
                    </div>

                    <div class="gen-f">
                      <div class="gen-l">备注</div>
                      <a-input v-model:value="genNote" placeholder="选填" style="width:100%" />
                    </div>

                    <div class="gen-f">
                      <a-button type="primary" :loading="genLoading" block @click="handleGenerateCode">
                        生成兑换码
                      </a-button>
                    </div>
                  </div>
                  <div v-if="genResult" class="mt-12">
                    <a-alert type="success" :show-icon="false">
                      <template #message>
                        兑换码已生成：
                        <a-typography-text copyable strong>{{ genResult }}</a-typography-text>
                      </template>
                    </a-alert>
                  </div>
                </a-card>

                <!-- Code List Section -->
                <a-card size="small" title="全部兑换码">
                  <template #extra>
                    <a-space :size="8">
                      <a-button size="small" @click="handleExportAll"><DownloadOutlined /> 导出未使用</a-button>
                      <a-select v-model:value="exportPlanId" allow-clear placeholder="按套餐" size="small" style="width:140px">
                        <a-select-option v-for="p in plans" :key="p.id" :value="p.id">{{ p.name || p.image }}</a-select-option>
                      </a-select>
                      <a-button size="small" type="default" :disabled="!exportPlanId" @click="handleExportByPlan">导出</a-button>
                      <a-divider type="vertical" />
                      <a-button size="small" danger :disabled="selectedCodes.length === 0" @click="handleDeleteCodes">
                        <DeleteOutlined /> 删除选中
                      </a-button>
                    </a-space>
                  </template>
                  <a-table
                    :columns="redeemColumns"
                    :data-source="redeemCodes"
                    :loading="redeemLoading"
                    :row-selection="{ selectedRowKeys: selectedCodes, onChange: onCodeSelectChange as any }"
                    row-key="id"
                    size="small"
                  >
                    <template #bodyCell="{ column, record }">
                      <template v-if="column.key === 'code'">
                        <a-typography-text copyable>{{ record.code }}</a-typography-text>
                      </template>
                      <template v-else-if="column.key === 'uses'">
                        {{ record.usedCount }}/{{ record.maxUses }}
                      </template>
                      <template v-else-if="column.key === 'createdAt'">
                        {{ new Date(record.createdAt).toLocaleString() }}
                      </template>
                      <template v-else-if="column.key === 'hours'">
                        {{ formatHours(record.hours) }}
                      </template>
                    </template>
                  </a-table>
                </a-card>
              </div>
            </div>
          </template>

          <template #plans>
            <div class="content-box" :style="{ maxHeight: card.height }">
              <a-typography-title :level="4" class="mb-24">
                套餐管理
              </a-typography-title>
              <div style="text-align: left">
                <div class="mb-16">
                  <a-button type="primary" @click="openNewPlan">
                    <PlusOutlined /> 新建套餐
                  </a-button>
                </div>

                <!-- 套餐 Form Modal -->
                <a-modal
                  v-model:visible="showPlanForm"
                  :title="editingPlan ? '编辑套餐' : '新建套餐'"
                  width="640px"
                  @ok="handleSavePlan"
                >
                  <a-form layout="vertical">
                    <a-form-item label="套餐名称">
                      <a-input v-model:value="planForm.name" placeholder="可选，留空则使用镜像名" />
                    </a-form-item>
                    <a-row :gutter="16">
                      <a-col :span="12">
                        <a-form-item label="时长">
                          <div style="display:flex; gap:6px">
                            <a-select v-model:value="planForm.durationUnit" :options="DUR_OPTIONS" style="width:130px" />
                            <a-input-number v-if="planForm.durationUnit!=='permanent'" v-model:value="planForm.durationValue" :min="1" :max="9999" style="width:90px" />
                          </div>
                        </a-form-item>
                      </a-col>
                      <a-col :span="8">
                        <a-form-item label="内存（MB）">
                          <a-input-number v-model:value="planForm.memory" :min="0" :step="256" style="width: 100%" />
                        </a-form-item>
                      </a-col>
                      <a-col :span="8">
                        <a-form-item label="CPU（0-100%）">
                          <a-input-number v-model:value="planForm.cpu" :min="0" :max="100" style="width: 100%" />
                        </a-form-item>
                      </a-col>
                    </a-row>
                    <a-form-item label="Docker 镜像 *" required>
                      <a-input v-model:value="planForm.image" placeholder="例如：itzg/minecraft-server" />
                    </a-form-item>
                    <a-form-item label="部署节点">
                      <a-select v-model:value="planForm.daemonId" placeholder="请选择节点" style="width: 100%">
                        <a-select-option v-for="n in planNodes" :key="n.uuid" :value="n.uuid">
                          {{ n.remarks || n.ip || n.uuid }}
                        </a-select-option>
                      </a-select>
                    </a-form-item>
                    <a-row :gutter="16">
                      <a-col :span="12">
                        <a-form-item label="最大磁盘（MB，0 表示不限）">
                          <a-input-number v-model:value="planForm.maxSpace" :min="0" :step="1024" style="width: 100%" />
                        </a-form-item>
                      </a-col>
                    </a-row>
                    <a-form-item label="端口映射（每行一个）">
                      <a-textarea v-model:value="planForm.ports" placeholder="25565:25565/tcp" :rows="2" />
                    </a-form-item>
                    <a-form-item label="环境变量（每行一个）">
                      <a-textarea v-model:value="planForm.env" placeholder="EULA=TRUE&#10;VERSION=1.21" :rows="3" />
                    </a-form-item>
                    <a-row :gutter="16">
                      <a-col :span="12">
                        <a-form-item label="启动命令">
                          <a-input v-model:value="planForm.startupCmd" placeholder="留空使用默认值" />
                        </a-form-item>
                      </a-col>
                      <a-col :span="12">
                        <a-form-item label="停止命令">
                          <a-input v-model:value="planForm.stopCmd" placeholder="留空使用默认值" />
                        </a-form-item>
                      </a-col>
                    </a-row>
                    <a-form-item label="工作目录">
                      <a-input v-model:value="planForm.cwd" placeholder="容器工作目录" />
                    </a-form-item>
                    <a-form-item label="备注">
                      <a-input v-model:value="planForm.note" placeholder="管理员备注" />
                    </a-form-item>
                  </a-form>
                </a-modal>

                <!-- 套餐 List -->
                <a-table
                  :columns="[
                    { title: '套餐名', key: 'name', dataIndex: 'name' },
                    { title: '镜像', key: 'image', dataIndex: 'image' },
                    { title: '内存', key: 'memory' },
                    { title: 'CPU', key: 'cpu' },
                    { title: '时长', key: 'duration' },
                    { title: '操作', key: 'actions' }
                  ]"
                  :data-source="plans"
                  :loading="plansLoading"
                  row-key="id"
                  size="small"
                >
                  <template #bodyCell="{ column, record }">
                    <template v-if="column.key === 'memory'">
                      {{ record.memory ? record.memory + ' MB' : '-' }}
                    </template>
                    <template v-else-if="column.key === 'cpu'">
                      {{ record.cpu ? record.cpu + '%' : '-' }}
                    </template>
                    <template v-else-if="column.key === 'duration'">
                      {{ pd(record) }}
                    </template>
                    <template v-else-if="column.key === 'image'">
                      {{ record.image || '-' }}
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
              </div>
            </div>
          </template>

          <template #about>
            <div class="content-box" :style="{ maxHeight: card.height }">
              <a-typography-title :level="4" class="mb-24">
                {{ t("TXT_CODE_3b4b656d") }}
              </a-typography-title>
              <a-typography-paragraph>
                <p>
                  {{ $t("TXT_CODE_d0c670df") }}
                </p>
              </a-typography-paragraph>
              <div class="pb-4 flex">
                <div v-for="item in aboutLinks" :key="item.url" class="mr-12 mb-12">
                  <a :href="item.url" target="_blank">
                    <a-button>
                      <component :is="item.icon" />
                      {{ item.title }}
                    </a-button>
                  </a>
                </div>
              </div>
              <a-typography-paragraph>
                <p>
                  {{ $t("TXT_CODE_97433ac4") }}
                </p>
              </a-typography-paragraph>
              <div class="pb-4 flex">
                <div v-for="item in contacts" :key="item.url" class="mr-12 mb-12">
                  <a :href="item.url" target="_blank">
                    <a-button>
                      <component :is="item.icon" />
                      {{ item.title }}
                    </a-button>
                  </a>
                </div>
              </div>
              <a-typography-paragraph>
                <p>
                  {{ $t("TXT_CODE_e57bd50f") }}
                </p>
                <pre style="font-size: 13px">{{ ApacheLicense }}</pre>
              </a-typography-paragraph>
              <a-divider />
              <a-typography-title :level="5">二次开发</a-typography-title>
              <a-typography-paragraph>
                <p style="color:#606266;font-size:13px">
                  本版本由 <strong>神之翼工作室</strong> 基于 MCSManager 二次开发，保留原始版权及许可证。
                </p>
                <p style="color:#909399;font-size:12px">
                  原始项目：<a href="https://github.com/MCSManager/MCSManager" target="_blank">MCSManager</a>
                  &nbsp;|&nbsp;
                  二次开发：神之翼工作室
                </p>
              </a-typography-paragraph>
            </div>
          </template>

          <template #sponsor>
            <div class="content-box" :style="{ maxHeight: card.height }">
              <a-typography-title :level="4" class="mb-24">
                {{ t("TXT_CODE_46cb40d5") }}
              </a-typography-title>
              <a-typography-paragraph>
                <p>
                  {{ $t("TXT_CODE_d0c670df") }}
                </p>
              </a-typography-paragraph>
            </div>
          </template>
        </LeftMenusPanel>
      </template>
    </CardPanel>
    <div v-if="!isReady" class="loading flex-center w-100 h-100">
      <Loading></Loading>
    </div>
  </div>
</template>

<style lang="scss" scoped>
div {
  position: relative;
  .loading {
    position: absolute;
    top: 0;
    left: 0;
  }
}

.content-box {
  padding: 16px;
  overflow-y: auto;
}

// ─── 兑换码生成竖列 ───
.gen-form-v {
  max-width: 500px;
}
.gen-f {
  margin-bottom: 12px;
}
.gen-l {
  font-size: 13px;
  color: #606266;
  margin-bottom: 5px;
}
</style>










