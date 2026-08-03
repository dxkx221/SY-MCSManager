<script setup lang="ts">
import type { LayoutCard } from "@/types";
import { message } from "ant-design-vue";
import { ref, onMounted, watch } from "vue";
import { settingInfo, setSettingInfo } from "@/services/apis";
import { t } from "@/lang/i18n";
import Loading from "@/components/Loading.vue";

defineProps<{ card: LayoutCard }>();

const { state, isReady, execute } = settingInfo();
const loading = ref(false);

const mailForm = ref<Record<string, any>>({
  smtpEnabled: false,
  smtpHost: "",
  smtpPort: 587,
  smtpSecure: false,
  smtpUser: "",
  smtpPass: "",
  smtpFrom: "",
  publicRegister: false
});

const saveMailSettings = async () => {
  loading.value = true;
  try {
    await setSettingInfo().execute({ data: { ...state.value, ...mailForm.value } });
    message.success(t("TXT_CODE_a7907771"));
    setTimeout(() => window.location.reload(), 600);
  } catch (err: any) {
    message.error(err?.response?.data ?? err?.message ?? String(err));
  } finally {
    loading.value = false;
  }
};

const initForm = () => {
  if (!isReady.value || !state.value) return;
  mailForm.value = {
    smtpEnabled: (state.value as any).smtpEnabled ?? false,
    smtpHost: (state.value as any).smtpHost ?? "",
    smtpPort: (state.value as any).smtpPort ?? 587,
    smtpSecure: (state.value as any).smtpSecure ?? false,
    smtpUser: (state.value as any).smtpUser ?? "",
    smtpPass: (state.value as any).smtpPass ?? "",
    smtpFrom: (state.value as any).smtpFrom ?? "",
    publicRegister: (state.value as any).publicRegister ?? false
  };
};

onMounted(async () => {
  await execute();
  initForm();
});
</script>

<template>
  <CardPanel>
    <template #title>{{ card.title || "邮箱注册配置" }}</template>
    <template #body>
      <div class="mail-config-card">
        <a-form :model="mailForm" layout="vertical" v-if="isReady">
          <a-form-item>
            <a-typography-title :level="5">启用邮件发送</a-typography-title>
            <a-switch v-model:checked="mailForm.smtpEnabled" />
          </a-form-item>
          <template v-if="mailForm.smtpEnabled">
            <a-form-item>
              <a-typography-title :level="5">SMTP 服务器</a-typography-title>
              <a-typography-paragraph type="secondary">例如：smtp.qq.com、smtp.163.com</a-typography-paragraph>
              <a-input v-model:value="mailForm.smtpHost" style="max-width: 320px" placeholder="smtp.qq.com" />
            </a-form-item>
            <a-form-item>
              <a-typography-title :level="5">SMTP 端口</a-typography-title>
              <a-input-number v-model:value="mailForm.smtpPort" style="max-width: 200px" :min="1" :max="65535" />
            </a-form-item>
            <a-form-item>
              <a-typography-title :level="5">SSL/TLS 加密</a-typography-title>
              <a-switch v-model:checked="mailForm.smtpSecure" />
            </a-form-item>
            <a-form-item>
              <a-typography-title :level="5">SMTP 账号</a-typography-title>
              <a-input v-model:value="mailForm.smtpUser" style="max-width: 320px" placeholder="发信邮箱账号" />
            </a-form-item>
            <a-form-item>
              <a-typography-title :level="5">SMTP 密码/授权码</a-typography-title>
              <a-input-password v-model:value="mailForm.smtpPass" style="max-width: 320px" placeholder="邮箱授权码" />
            </a-form-item>
            <a-form-item>
              <a-typography-title :level="5">发件人（可选）</a-typography-title>
              <a-typography-paragraph type="secondary">邮件中显示的发件人，留空则自动使用 SMTP 账号。</a-typography-paragraph>
              <a-input v-model:value="mailForm.smtpFrom" style="max-width: 320px" placeholder="MCSManager &lt;noreply@example.com&gt;" />
            </a-form-item>
          </template>
          <a-form-item>
            <a-typography-title :level="5">开放邮箱注册</a-typography-title>
            <a-typography-paragraph type="secondary">开启后，用户可在登录页使用邮箱注册账号。</a-typography-paragraph>
            <a-switch v-model:checked="mailForm.publicRegister" />
          </a-form-item>
          <a-form-item>
            <a-button type="primary" :loading="loading" @click="saveMailSettings">保存</a-button>
          </a-form-item>
        </a-form>
        <Loading v-else />
      </div>
    </template>
  </CardPanel>
</template>

<style scoped lang="scss">
.mail-config-card {
  padding: 16px;
  text-align: left;
}
</style>
