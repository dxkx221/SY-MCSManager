<script setup lang="ts">
import { t } from "@/lang/i18n";
import { router } from "@/config/router";
import { registerStatus, registerUser, sendVerificationCode, loginPageInfo } from "@/services/apis";
import { useAppStateStore } from "@/stores/useAppStateStore";
import { sleep } from "@/tools/common";
import { reportErrorMsg } from "@/tools/validator";
import {
  LockOutlined,
  MailOutlined,
  SafetyCertificateOutlined
} from "@ant-design/icons-vue";
import { message } from "ant-design-vue";
import { computed, onMounted, onUnmounted, reactive, ref } from "vue";

const { updateUserInfo, isAdmin } = useAppStateStore();

const regForm = reactive({
  email: "",
  password: "",
  code: ""
});

const sendingCode = ref(false);
const countdown = ref(0);
let countdownTimer: ReturnType<typeof setInterval> | null = null;

const countdownText = computed(() =>
  countdown.value > 0 ? `${countdown.value}s` : "获取验证码"
);

const startCountdown = () => {
  countdown.value = 60;
  countdownTimer = setInterval(() => {
    countdown.value--;
    if (countdown.value <= 0 && countdownTimer) {
      clearInterval(countdownTimer);
      countdownTimer = null;
    }
  }, 1000);
};

onUnmounted(() => {
  if (countdownTimer) clearInterval(countdownTimer);
});

const handleSendCode = async () => {
  if (countdown.value > 0) return;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regForm.email.trim())) {
    message.error("请输入正确的邮箱地址");
    return;
  }
  sendingCode.value = true;
  try {
    await sendVerificationCode().execute({ data: { email: regForm.email.trim().toLowerCase() } });
    message.success("验证码已发送，请查看邮箱");
    startCountdown();
  } catch (err: any) {
    reportErrorMsg(err);
  } finally {
    sendingCode.value = false;
  }
};

const regLoading = ref(false);

const handleRegister = async () => {
  if (!regForm.email.trim() || !regForm.password.trim() || !regForm.code.trim()) {
    message.error("请填写邮箱、密码和验证码");
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regForm.email.trim())) {
    message.error("请输入正确的邮箱地址");
    return;
  }
  if (regForm.password.length < 9 || regForm.password.length > 36) {
    message.error("密码长度必须为 9-36 位，且包含大小写字母和数字");
    return;
  }
  regLoading.value = true;
  try {
    await registerUser().execute({
      data: {
        email: regForm.email.trim().toLowerCase(),
        password: regForm.password,
        code: regForm.code.trim()
      }
    });
    message.success("注册成功");
    await sleep(600);
    await updateUserInfo();
    router.push({ path: isAdmin.value ? "/" : "/customer" });
  } catch (err: any) {
    reportErrorMsg(err);
  } finally {
    regLoading.value = false;
  }
};

const goLogin = () => router.push({ path: "/login" });

const pageInfoResult = ref<{ brandName?: string } | null>(null);

onMounted(async () => {
  try {
    const res = await loginPageInfo().execute();
    pageInfoResult.value = res.value ?? null;
  } catch { /* ignore */ }
  const { state: appConfig } = useAppStateStore();
  if (!appConfig.isInstall) {
    router.push({ path: "/install" });
    return;
  }
  try {
    const res = await registerStatus().execute();
    if (!res.value?.publicRegister) {
      message.error("暂未开放注册");
      router.push({ path: "/login" });
    }
  } catch {
    router.push({ path: "/login" });
  }
});
</script>

<template>
  <div class="register-page">
    <div class="register-blur-bg"></div>
    <div class="register-card-wrapper">
      <div class="register-card">
        <h1 class="register-title">注册账号</h1>
        <p class="register-sub">{{ pageInfoResult?.brandName ? `创建您的 ${pageInfoResult.brandName} 账号` : '创建您的 MCSManager 账号' }}</p>

        <div class="register-field mt-24">
          <label class="register-label">邮箱地址</label>
          <a-input
            v-model:value="regForm.email"
            size="large"
            type="email"
            autocomplete="email"
            placeholder="请输入邮箱地址"
          >
            <template #suffix>
              <MailOutlined style="color: rgba(0,0,0,0.35)" />
            </template>
          </a-input>
        </div>

        <div class="register-field">
          <label class="register-label">密码</label>
          <a-input
            v-model:value="regForm.password"
            size="large"
            type="password"
            autocomplete="new-password"
            placeholder="9-36 位，需包含大小写字母和数字"
          >
            <template #suffix>
              <LockOutlined style="color: rgba(0,0,0,0.35)" />
            </template>
          </a-input>
        </div>

        <div class="register-field">
          <label class="register-label">验证码</label>
          <div class="code-row">
            <a-input
              v-model:value="regForm.code"
              size="large"
              type="text"
              autocomplete="off"
              placeholder="请输入邮箱验证码"
              style="flex: 1"
            >
              <template #suffix>
                <SafetyCertificateOutlined style="color: rgba(0,0,0,0.35)" />
              </template>
            </a-input>
            <a-button
              size="large"
              :disabled="countdown > 0"
              :loading="sendingCode"
              class="code-btn"
              @click="handleSendCode"
            >
              {{ countdownText }}
            </a-button>
          </div>
        </div>

        <a-button
          size="large"
          type="primary"
          :loading="regLoading"
          block
          class="register-submit"
          @click="handleRegister"
        >
          注 册
        </a-button>

        <div class="register-footer">
          已有账号？<a class="register-link" @click="goLogin">立即登录</a>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.register-page {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow-y: auto;
}

.register-blur-bg {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.15);
  backdrop-filter: saturate(120%) blur(12px);
  z-index: 0;
}

.register-card-wrapper {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 400px;
  padding: 16px;
}

.register-card {
  background: #ffffff;
  border: 1px solid #e8e8e8;
  border-radius: 12px;
  padding: 40px 36px 32px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
}

.register-title {
  font-size: 22px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0 0 6px;
  text-align: center;
  letter-spacing: 2px;
}

.register-sub {
  font-size: 13px;
  color: #999;
  text-align: center;
  margin: 0 0 8px;
}

.register-field {
  margin-bottom: 16px;
}

.register-label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: #333;
  margin-bottom: 6px;
}

.code-row {
  display: flex;
  gap: 10px;
}

.code-btn {
  min-width: 110px;
}

.register-submit {
  margin-top: 24px;
  height: 44px;
  font-size: 15px;
  letter-spacing: 4px;
  border-radius: 8px;
}

.register-footer {
  margin-top: 20px;
  text-align: center;
  font-size: 13px;
  color: #999;
}

.register-link {
  color: #1677ff;
  cursor: pointer;
  margin-left: 4px;

  &:hover {
    color: #4096ff;
  }
}
</style>
