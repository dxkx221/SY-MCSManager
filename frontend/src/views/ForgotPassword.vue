<script setup lang="ts">
import { router } from "@/config/router";
import { loginPageInfo, resetPassword, sendPasswordResetCode } from "@/services/apis";
import { sleep } from "@/tools/common";
import { reportErrorMsg } from "@/tools/validator";
import {
  LockOutlined,
  MailOutlined,
  SafetyCertificateOutlined
} from "@ant-design/icons-vue";
import { message } from "ant-design-vue";
import { computed, onMounted, onUnmounted, reactive, ref } from "vue";

const form = reactive({
  email: "",
  password: "",
  confirmPassword: "",
  code: ""
});

const pageInfoResult = ref<{ brandName?: string } | null>(null);
const sendingCode = ref(false);
const resetLoading = ref(false);
const countdown = ref(0);
let countdownTimer: ReturnType<typeof setInterval> | null = null;

const countdownText = computed(() =>
  countdown.value > 0 ? `${countdown.value}s` : "获取验证码"
);

const normalizedEmail = computed(() => form.email.trim().toLowerCase());
const isEmailValid = () => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail.value);

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

const handleSendCode = async () => {
  if (countdown.value > 0) return;
  if (!isEmailValid()) {
    message.error("请输入注册时使用的邮箱地址");
    return;
  }
  sendingCode.value = true;
  try {
    await sendPasswordResetCode().execute({ data: { email: normalizedEmail.value } });
    message.success("验证码已发送，请查看邮箱");
    startCountdown();
  } catch (err: any) {
    reportErrorMsg(err);
  } finally {
    sendingCode.value = false;
  }
};

const handleReset = async () => {
  if (!isEmailValid()) {
    message.error("请输入注册时使用的邮箱地址");
    return;
  }
  if (!form.code.trim() || !form.password.trim() || !form.confirmPassword.trim()) {
    message.error("请填写验证码和新密码");
    return;
  }
  if (form.password !== form.confirmPassword) {
    message.error("两次输入的新密码不一致");
    return;
  }
  if (form.password.length < 9 || form.password.length > 36) {
    message.error("密码长度必须为 9-36 位，且包含大小写字母和数字");
    return;
  }
  resetLoading.value = true;
  try {
    await resetPassword().execute({
      data: {
        email: normalizedEmail.value,
        password: form.password,
        code: form.code.trim()
      }
    });
    message.success("密码已重置，请使用新密码登录");
    await sleep(600);
    router.push({ path: "/login" });
  } catch (err: any) {
    reportErrorMsg(err);
  } finally {
    resetLoading.value = false;
  }
};

const goLogin = () => router.push({ path: "/login" });

onMounted(async () => {
  try {
    const res = await loginPageInfo().execute();
    pageInfoResult.value = res.value ?? null;
  } catch { /* ignore */ }
});

onUnmounted(() => {
  if (countdownTimer) clearInterval(countdownTimer);
});
</script>

<template>
  <div class="forgot-page">
    <div class="forgot-blur-bg"></div>
    <div class="forgot-card-wrapper">
      <div class="forgot-card">
        <h1 class="forgot-title">找回密码</h1>
        <p class="forgot-sub">
          {{ pageInfoResult?.brandName ? `重置您的 ${pageInfoResult.brandName} 账号密码` : '通过注册邮箱重置账号密码' }}
        </p>

        <div class="forgot-field mt-24">
          <label class="forgot-label">注册邮箱</label>
          <a-input
            v-model:value="form.email"
            size="large"
            type="email"
            autocomplete="email"
            placeholder="请输入注册时使用的邮箱"
          >
            <template #suffix>
              <MailOutlined style="color: rgba(0,0,0,0.35)" />
            </template>
          </a-input>
        </div>

        <div class="forgot-field">
          <label class="forgot-label">验证码</label>
          <div class="code-row">
            <a-input
              v-model:value="form.code"
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

        <div class="forgot-field">
          <label class="forgot-label">新密码</label>
          <a-input
            v-model:value="form.password"
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

        <div class="forgot-field">
          <label class="forgot-label">确认新密码</label>
          <a-input
            v-model:value="form.confirmPassword"
            size="large"
            type="password"
            autocomplete="new-password"
            placeholder="请再次输入新密码"
            @press-enter="handleReset"
          >
            <template #suffix>
              <LockOutlined style="color: rgba(0,0,0,0.35)" />
            </template>
          </a-input>
        </div>

        <a-button
          size="large"
          type="primary"
          :loading="resetLoading"
          block
          class="forgot-submit"
          @click="handleReset"
        >
          重置密码
        </a-button>

        <div class="forgot-footer">
          想起密码了？<a class="forgot-link" @click="goLogin">返回登录</a>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.forgot-page {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow-y: auto;
}

.forgot-blur-bg {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.15);
  backdrop-filter: saturate(120%) blur(12px);
  z-index: 0;
}

.forgot-card-wrapper {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 420px;
  padding: 16px;
}

.forgot-card {
  background: rgba(255,250,253,.16);
  border: 1px solid rgba(255,255,255,.24);
  border-radius: 12px;
  padding: 40px 36px 32px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
}

.forgot-title {
  font-size: 22px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0 0 6px;
  text-align: center;
  letter-spacing: 2px;
}

.forgot-sub {
  font-size: 13px;
  color: #999;
  text-align: center;
  margin: 0 0 8px;
}

.forgot-field {
  margin-bottom: 18px;
}

.forgot-label {
  display: block;
  font-size: 13px;
  color: #666;
  margin-bottom: 8px;
}

.code-row {
  display: flex;
  gap: 10px;
}

.code-btn {
  min-width: 112px;
}

.forgot-submit {
  height: 42px;
  margin-top: 6px;
}

.forgot-footer {
  text-align: center;
  margin-top: 20px;
  font-size: 13px;
  color: #999;
}

.forgot-link {
  color: var(--accent-primary, var(--color-primary));
  cursor: pointer;
}

.mt-24 {
  margin-top: 24px;
}

@media (max-width: 480px) {
  .forgot-page {
    align-items: flex-start;
    padding-top: 28px;
  }
  .forgot-card-wrapper {
    max-width: none;
    padding: 14px;
  }
  .forgot-card {
    padding: 30px 20px 26px;
  }
  .code-row {
    gap: 8px;
  }
  .code-btn {
    min-width: 96px;
    padding-left: 10px;
    padding-right: 10px;
  }
}
</style>
