import Router from "@koa/router";
import axios from "axios";
import Koa from "koa";
import { GlobalVariable } from "mcsmanager-common";
import SystemConfig from "../entity/setting";
import { ROLE } from "../entity/user";
import { $t } from "../i18n";
import permission from "../middleware/permission";
import validator from "../middleware/validator";
import { logger } from "../service/log";
import mailService from "../service/mail_service";
import { operationLogger } from "../service/operation_logger";
import { check, checkBanIp, login, logout, register } from "../service/passport_service";
import userSystem, { TwoFactorError } from "../service/user_service";
import { systemConfig } from "../setting";

const router = new Router({ prefix: "/auth" });

// [Public Permission]
// login route
router.post(
  "/login",
  permission({ token: false, level: null }),
  validator({ body: { username: String, password: String } }),
  async (ctx: Koa.ParameterizedContext) => {
    if (systemConfig?.ssoEnabled && systemConfig?.ssoOnlyMode) {
      ctx.body = new Error("Password login is disabled. Please use SSO.");
      return;
    }
    const userName = String(ctx.request.body.username);
    const passWord = String(ctx.request.body.password);
    const code = String(ctx.request.body.code);
    if (!checkBanIp(ctx)) throw new Error($t("TXT_CODE_router.login.ban"));
    if (check(ctx)) return (ctx.body = "Logined");
    try {
      ctx.body = login(ctx, userName, passWord, code);
      operationLogger.info("user_login", {
        operator_ip: ctx.ip,
        operator_name: userName,
        login_result: true
      });
    } catch (error: any) {
      if (error instanceof TwoFactorError && !code) {
        ctx.body = "NEED_2FA";
        return;
      }
      ctx.body = error;
      operationLogger.warning("user_login", {
        operator_ip: ctx.ip,
        operator_name: userName,
        login_result: false
      });
    }
  }
);

// [Public Permission]
// exit route
router.get(
  "/logout",
  permission({ token: false, level: null, speedLimit: false }),
  async (ctx: Koa.ParameterizedContext) => {
    logout(ctx);
    ctx.body = true;
  }
);

// [Public Permission]
// Display the text of the login interface
router.all(
  "/login_info",
  permission({ token: false, level: null, speedLimit: false }),
  async (ctx: Koa.ParameterizedContext) => {
    ctx.body = {
      loginInfo: systemConfig?.loginInfo,
      brandName: systemConfig?.brandName || "",
      developer: "神之翼工作室"
    };
  }
);

// [Public Permission]
// Get the state information that the panel can expose
router.all(
  "/status",
  permission({ token: false, level: null, speedLimit: false }),
  async (ctx: Koa.ParameterizedContext) => {
    let isInstall = true;
    if (userSystem.objects.size === 0) {
      isInstall = false;
    }
    ctx.body = {
      versionChange: GlobalVariable.get("versionChange", null),
      isInstall,
      language: systemConfig?.language || null,
      settings: {
        canFileManager: systemConfig?.canFileManager || false,
        allowUsePreset: systemConfig?.allowUsePreset || false,
        businessMode: systemConfig?.businessMode || false,
        businessId: systemConfig?.businessId || null,
        allowChangeCmd: systemConfig?.allowChangeCmd || false,
        panelId: systemConfig?.panelId || null,
        ssoEnabled: systemConfig?.ssoEnabled || false,
        ssoOnlyMode: systemConfig?.ssoOnlyMode || false
      } as Partial<SystemConfig>
    };
  }
);

// [Public Permission]
// Install the panel, only available when the number of user entities is 0
router.all(
  "/install",
  permission({ token: false, level: null }),
  validator({ body: { username: String, password: String } }),
  async (ctx: Koa.ParameterizedContext) => {
    const userName = String(ctx.request.body.username);
    const passWord = String(ctx.request.body.password);
    if (userSystem.objects.size === 0) {
      if (!userSystem.validatePassword(passWord))
        throw new Error($t("TXT_CODE_router.user.passwordCheck"));
      logger.info($t("TXT_CODE_router.login.init", { userName }));
      await userSystem.create({
        userName,
        passWord,
        permission: 10
      });
      operationLogger.log("user_create", {
        operator_ip: ctx.ip,
        operator_name: userName,
        target_user_name: userName
      });
      login(ctx, userName, passWord);
      return (ctx.body = true);
    }
    throw new Error($t("TXT_CODE_router.user.installed"));
  }
);

// [Public Permission]
// Check if public registration is enabled
router.get(
  "/register_status",
  permission({ token: false, level: null, speedLimit: false }),
  async (ctx: Koa.ParameterizedContext) => {
    ctx.body = {
      publicRegister: systemConfig?.publicRegister || false
    };
  }
);

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// [Public Permission]
// Send verification code to email for registration
router.post(
  "/send_code",
  permission({ token: false, level: null }),
  validator({ body: { email: String } }),
  async (ctx: Koa.ParameterizedContext) => {
    if (!systemConfig?.publicRegister) {
      ctx.body = new Error("Public registration is disabled");
      return;
    }
    const email = String(ctx.request.body.email).trim().toLowerCase();
    if (!emailRegex.test(email)) {
      ctx.body = new Error("Invalid email address");
      return;
    }
    // Check if user already exists
    if (userSystem.getUserByUserName(email)) {
      ctx.body = new Error("Email already registered");
      return;
    }
    const code = mailService.generateCode();
    mailService.storeCode(email, code);
    const sent = await mailService.sendVerificationCode(email, code);
    if (!sent) {
      mailService.deleteCode(email);
      ctx.body = new Error("邮件发送失败，请联系管理员检查 SMTP 配置");
      return;
    }
    ctx.body = { success: true, message: "Verification code sent" };
  }
);

// [Public Permission]
// Send verification code to registered email for password reset
router.post(
  "/password_reset/send_code",
  permission({ token: false, level: null }),
  validator({ body: { email: String } }),
  async (ctx: Koa.ParameterizedContext) => {
    const email = String(ctx.request.body.email).trim().toLowerCase();
    if (!emailRegex.test(email)) {
      ctx.body = new Error("Invalid email address");
      return;
    }
    const user = userSystem.getUserByUserName(email);
    if (!user) {
      ctx.body = new Error("该邮箱尚未注册");
      return;
    }
    const code = mailService.generateCode();
    mailService.storeCode(`reset:${email}`, code);
    const sent = await mailService.sendPasswordResetCode(email, code);
    if (!sent) {
      mailService.deleteCode(`reset:${email}`);
      ctx.body = new Error("邮件发送失败，请联系管理员检查 SMTP 配置");
      return;
    }
    ctx.body = { success: true, message: "Password reset verification code sent" };
  }
);

// [Public Permission]
// Reset password with email verification code
router.post(
  "/password_reset/confirm",
  permission({ token: false, level: null }),
  validator({ body: { email: String, password: String, code: String } }),
  async (ctx: Koa.ParameterizedContext) => {
    const email = String(ctx.request.body.email).trim().toLowerCase();
    const password = String(ctx.request.body.password);
    const code = String(ctx.request.body.code).trim();

    if (!emailRegex.test(email)) throw new Error("Invalid email address");
    if (!userSystem.validatePassword(password)) {
      throw new Error($t("TXT_CODE_router.user.passwordCheck"));
    }
    const user = userSystem.getUserByUserName(email);
    if (!user) throw new Error("该邮箱尚未注册");
    if (!mailService.verifyCode(`reset:${email}`, code)) {
      throw new Error("Invalid or expired verification code");
    }

    await userSystem.edit(user.uuid, { passWord: password });
    logger.info(`[PASSWORD_RESET] Password reset completed: ${email}`);
    try {
      operationLogger.info("user_config_change" as any, {
        operator_ip: ctx.ip,
        operator_name: email,
        target_user_name: email
      });
    } catch (_) {}

    ctx.body = true;
  }
);

// [Public Permission]
// Public registration with email + password + verification code
router.post(
  "/register",
  permission({ token: false, level: null }),
  validator({ body: { email: String, password: String, code: String } }),
  async (ctx: Koa.ParameterizedContext) => {
    if (!systemConfig?.publicRegister) {
      ctx.body = new Error("Public registration is disabled");
      return;
    }
    const email = String(ctx.request.body.email).trim().toLowerCase();
    const password = String(ctx.request.body.password);
    const code = String(ctx.request.body.code);

    // Validate email format
    if (!emailRegex.test(email)) {
      throw new Error("Invalid email address");
    }

    // Validate password
    if (!userSystem.validatePassword(password)) {
      throw new Error($t("TXT_CODE_router.user.passwordCheck"));
    }

    // Verify code
    if (!mailService.verifyCode(email, code)) {
      throw new Error("Invalid or expired verification code");
    }

    // Check duplicate
    if (userSystem.getUserByUserName(email)) {
      throw new Error("Email already registered");
    }

    // Create user (username = email, permission = USER)
    const result = await register(ctx, email, password, ROLE.USER);
    if (!result) {
      throw new Error("Registration failed");
    }

    logger.info(`[REGISTER] New user registered: ${email}`);
    try {
      operationLogger.info("user_register" as any, {
        operator_ip: ctx.ip,
        operator_name: email
      });
    } catch (_) {}

    // Auto-login after registration
    ctx.body = login(ctx, email, password);
  }
);

router.all(
  "/proxy",
  validator({ query: { target: String } }),
  permission({ level: ROLE.ADMIN }),
  async (ctx) => {
    try {
      const response = await axios.request({
        method: (ctx.query.method as string) || ctx.method,
        url: String(ctx.query.target)
      });
      if (response.status !== 200) throw new Error("Response code != 200");
      ctx.body = response.data;
    } catch (err) {
      ctx.body = err;
    }
  }
);

export default router;
