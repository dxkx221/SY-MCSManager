<script setup lang="ts">
import { originRouterConfig, type RouterConfig } from "@/config/router";
import { getUserInfo, remoteInstancesGlobal, remoteNodeList, userInfoApi } from "@/services/apis";
import { useAppStateStore } from "@/stores/useAppStateStore";
import type { InstanceDetail, NodeStatus } from "@/types";
import type { BaseUserInfo, UserInstance } from "@/types/user";
import { SearchOutlined } from "@ant-design/icons-vue";
import { debounce } from "lodash";
import { computed, h, onBeforeUnmount, ref, watch } from "vue";
import { useRouter } from "vue-router";

type SearchKind = "route" | "node" | "instance" | "user";
interface SearchResult {
  key: string;
  kind: SearchKind;
  title: string;
  subtitle: string;
  path: string;
  query?: Record<string, string>;
}

const router = useRouter();
const { state: appState, isAdmin, isLogged } = useAppStateStore();
const open = ref(false);
const keyword = ref("");
const loading = ref(false);
const remoteResults = ref<SearchResult[]>([]);
let requestSerial = 0;

const kindLabels: Record<SearchKind, string> = { route: "页面", node: "节点", instance: "实例", user: "用户" };

const accessibleRoutes = computed<SearchResult[]>(() => {
  const permission = Number(appState.userInfo?.permission || 0);
  const output: SearchResult[] = [];
  const visit = (items: RouterConfig[]) => {
    for (const item of items) {
      const required = Number(item.meta.permission || 0);
      const allowed = required <= permission && item.path !== "/404" && !item.path.includes("_open_page");
      if (allowed && item.name && (!item.meta.condition || item.meta.condition())) {
        output.push({ key: `route:${item.path}`, kind: "route", title: item.name, subtitle: item.path, path: item.path });
      }
      if (item.children) visit(item.children);
    }
  };
  visit(originRouterConfig);
  return output.filter((item, index, array) => array.findIndex((x) => x.path === item.path) === index);
});

const routeResults = computed(() => {
  const q = keyword.value.trim().toLocaleLowerCase();
  if (!q) return accessibleRoutes.value.slice(0, 8);
  return accessibleRoutes.value.filter((item) => `${item.title} ${item.subtitle}`.toLocaleLowerCase().includes(q));
});
const results = computed(() => [...routeResults.value, ...remoteResults.value]);

const instanceResult = (instance: Partial<InstanceDetail> | UserInstance, daemonId: string, owner = ""): SearchResult => {
  const uuid = instance.instanceUuid || "";
  const title = ("nickname" in instance && instance.nickname) || ("config" in instance && instance.config?.nickname) || uuid;
  return {
    key: `instance:${daemonId}:${uuid}`,
    kind: "instance",
    title,
    subtitle: [owner, daemonId, uuid].filter(Boolean).join(" · "),
    path: "/instances/terminal",
    query: { daemonId, instanceId: uuid }
  };
};

const loadRemoteResults = debounce(async (rawKeyword: string) => {
  const q = rawKeyword.trim();
  const serial = ++requestSerial;
  if (!q || !isLogged.value) {
    remoteResults.value = [];
    loading.value = false;
    return;
  }
  loading.value = true;
  try {
    const next: SearchResult[] = [];
    if (isAdmin.value) {
      const [nodesRes, instancesRes, usersRes] = await Promise.all([
        remoteNodeList().execute(),
        remoteInstancesGlobal().execute({ params: { page: 1, page_size: 100, instance_name: q } }),
        getUserInfo().execute({ params: { userName: q, page: 1, page_size: 50, role: "" } })
      ]);
      for (const node of nodesRes.value || ([] as NodeStatus[])) {
        if (`${node.remarks} ${node.ip} ${node.uuid}`.toLocaleLowerCase().includes(q.toLocaleLowerCase())) {
          next.push({ key: `node:${node.uuid}`, kind: "node", title: node.remarks || node.uuid,
            subtitle: `${node.ip}:${node.port} · ${node.available ? "在线" : "离线"}`, path: "/instances", query: { daemonId: node.uuid } });
        }
      }
      for (const [daemonId, group] of Object.entries(instancesRes.value || {})) {
        for (const instance of group.instances || []) next.push(instanceResult(instance, daemonId));
      }
      for (const user of usersRes.value?.data || ([] as BaseUserInfo[])) {
        next.push({ key: `user:${user.uuid}`, kind: "user", title: user.userName, subtitle: user.uuid,
          path: "/users/resources", query: { uuid: user.uuid } });
      }
    } else {
      const ownRes = await userInfoApi().execute({ params: { advanced: true } });
      const own = ownRes.value;
      for (const instance of own?.instances || []) {
        if (`${instance.nickname || ""} ${instance.instanceUuid} ${instance.daemonId}`.toLocaleLowerCase().includes(q.toLocaleLowerCase())) {
          next.push(instanceResult(instance, instance.daemonId, own?.userName || ""));
        }
      }
    }
    if (serial === requestSerial) remoteResults.value = next;
  } finally {
    if (serial === requestSerial) loading.value = false;
  }
}, 320);

watch(keyword, (value) => {
  loading.value = Boolean(value.trim() && isLogged.value);
  loadRemoteResults(value);
});
const show = () => { open.value = true; keyword.value = ""; remoteResults.value = []; };
const go = async (item: SearchResult) => { open.value = false; await router.push({ path: item.path, query: item.query }); };
onBeforeUnmount(() => loadRemoteResults.cancel());
</script>

<template>
  <a-tooltip title="全局搜索">
    <a-button class="global-search-trigger" type="text" :icon="h(SearchOutlined)" @click="show" />
  </a-tooltip>
  <a-modal v-model:open="open" class="global-search-modal" title="全局搜索" :footer="null" :width="680">
    <a-input v-model:value="keyword" autofocus allow-clear size="large" placeholder="搜索页面、节点、实例或用户" :prefix="h(SearchOutlined)" />
    <div class="search-body">
      <a-spin :spinning="loading">
        <button v-for="item in results" :key="item.key" class="search-result" @click="go(item)">
          <span class="result-kind">{{ kindLabels[item.kind] }}</span>
          <span class="result-content"><strong>{{ item.title }}</strong><small>{{ item.subtitle }}</small></span>
        </button>
        <a-empty v-if="!loading && results.length === 0" description="没有找到匹配结果" />
      </a-spin>
    </div>
  </a-modal>
</template>

<style scoped lang="scss">
.global-search-trigger { color: inherit !important; }
.search-body { min-height: 160px; max-height: min(62vh, 560px); overflow: auto; margin-top: 14px; }
.search-result { width: 100%; display: flex; align-items: center; gap: 12px; padding: 12px; color: var(--text-primary); background: transparent; border: 0; border-radius: 10px; text-align: left; cursor: pointer; transition: background .18s ease; &:hover { background: var(--surface-hover); } }
.result-kind { flex: 0 0 42px; padding: 3px 6px; border-radius: 6px; text-align: center; font-size: 12px; color: var(--accent-primary); background: var(--accent-soft); }
.result-content { min-width: 0; display: flex; flex-direction: column; gap: 3px; }
.result-content strong, .result-content small { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.result-content small { color: var(--text-muted); }
</style>
