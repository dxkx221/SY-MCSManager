<script setup lang="ts">
import { deleteAnnouncement, listAnnouncements, updateAnnouncement, type Announcement } from "@/services/apis/announcement";
import { useAppStateStore } from "@/stores/useAppStateStore";
import type { LayoutCard } from "@/types";
import { DeleteOutlined, NotificationOutlined } from "@ant-design/icons-vue";
import { Modal, message } from "ant-design-vue";
import { computed, onMounted, ref } from "vue";

defineProps<{ card: LayoutCard }>();
const { isAdmin } = useAppStateStore();
const announcements = ref<Announcement[]>([]);
const loading = ref(false);
const visibleItems = computed(() => isAdmin.value ? announcements.value : announcements.value.filter((item) => item.active));
const formatTime = (value?: number) => { if (!value) return ""; const date = new Date(value); return Number.isNaN(date.getTime()) ? "" : date.toLocaleString(); };
const load = async () => { loading.value = true; try { const result = await listAnnouncements().execute({ forceRequest: true }); announcements.value = result.value ?? []; } catch (error: any) { message.error(error?.message || "公告加载失败"); } finally { loading.value = false; } };
const toggleActive = async (item: Announcement, active: boolean) => { try { await updateAnnouncement(item.id)().execute({ data: { active } }); item.active = active; message.success(active ? "公告已启用" : "公告已停用"); } catch (error: any) { message.error(error?.message || "操作失败"); } };
const remove = (item: Announcement) => Modal.confirm({ title: "删除公告", content: `确定删除“${item.title}”吗？此操作无法撤销。`, okType: "danger", async onOk() { await deleteAnnouncement(item.id)().execute(); announcements.value = announcements.value.filter((entry) => entry.id !== item.id); message.success("公告已删除"); } });
onMounted(load);
</script>

<template><CardPanel><template #title>{{ card.title || "公告中心" }}</template><template #body>
  <div class="announcement-page">
    <div class="page-intro"><div><span class="eyebrow"><NotificationOutlined /> NOTICE BOARD</span><h2>平台公告</h2><p>重要通知、服务动态与更新记录都在这里。</p></div><a-button @click="load" :loading="loading">刷新</a-button></div>
    <a-spin :spinning="loading"><a-empty v-if="!visibleItems.length" description="暂无公告" /><div v-else class="announcement-list">
      <article v-for="item in visibleItems" :key="item.id" class="announcement-item"><div class="item-line" /><div class="item-main">
        <div class="item-heading"><div><a-tag :class="item.active ? 'status-tag-active' : 'status-tag-disabled'">{{ item.active ? "发布中" : "已停用" }}</a-tag><span class="item-time">{{ formatTime(item.createdAt) }} · {{ item.publisher }}</span></div><div v-if="isAdmin" class="admin-actions"><span>{{ item.active ? "启用" : "停用" }}</span><a-switch :checked="item.active" @change="(value: any) => toggleActive(item, Boolean(value))" /><a-button danger type="text" @click="remove(item)"><DeleteOutlined /></a-button></div></div>
        <h3>{{ item.title }}</h3><div class="content">{{ item.content }}</div>
      </div></article>
    </div></a-spin>
  </div>
</template></CardPanel></template>

<style scoped lang="scss">
.announcement-page{padding:clamp(16px,3vw,34px);text-align:left}.page-intro{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;padding-bottom:24px;border-bottom:1px solid var(--border-default)}.eyebrow{color:var(--accent-primary);font-size:12px;font-weight:700;letter-spacing:.12em}h2{margin:8px 0 4px;font-size:clamp(24px,4vw,36px);line-height:1.15}.page-intro p{margin:0;opacity:.62}.announcement-list{display:grid;gap:16px;padding-top:22px}.announcement-item{display:flex;overflow:hidden;border:1px solid var(--border-default);border-radius:14px;background:var(--surface-inner);transition:.2s ease}.announcement-item:hover{transform:translateY(-2px);border-color:var(--accent-primary)}.item-line{flex:0 0 5px;background:linear-gradient(180deg,var(--accent-primary),transparent)}.item-main{flex:1;min-width:0;padding:20px 22px}.item-heading{display:flex;justify-content:space-between;align-items:center;gap:12px}.status-tag-active{color:var(--accent-primary);border-color:var(--border-default);background:var(--accent-soft)}.status-tag-disabled{color:var(--text-muted);border-color:var(--border-default);background:var(--surface-control)}.item-time{margin-left:8px;font-size:12px;opacity:.52}.admin-actions{display:flex;align-items:center;gap:8px;font-size:12px;opacity:.8}h3{margin:14px 0 8px;font-size:19px}.content{white-space:pre-wrap;overflow-wrap:anywhere;line-height:1.75;opacity:.82}@media(max-width:600px){.item-heading{align-items:flex-start;flex-direction:column}.item-main{padding:16px}.page-intro{align-items:center}}
</style>
