import Router from "@koa/router";
import Koa from "koa";
import { toNumber, toText } from "mcsmanager-common";
import { ROLE } from "../entity/user";
import { $t } from "../i18n";
import permission from "../middleware/permission";
import validator from "../middleware/validator";
import {
  buyOrRenewInstance,
  parseUserName,
  RequestAction
} from "../service/exchange_service";
import { logger } from "../service/log";
import redeemPlanService, { planToInstanceConfig, generateInstanceNickname } from "../service/redeem_plan_service";
import { planDurationToHours } from "../entity/redeem_plan";
import redeemService from "../service/redeem_service";
import { execWithMutexId } from "../utils/sync";

const router = new Router({ prefix: "/redeem" });

// ─── Admin endpoints ────────────────────────────────────────────────

// List all redeem codes
router.get(
  "/codes",
  permission({ level: ROLE.ADMIN }),
  async (ctx: Koa.ParameterizedContext) => {
    const page = toNumber(ctx.query.page as string) ?? 1;
    const pageSize = toNumber(ctx.query.pageSize as string) ?? 20;
    ctx.body = redeemService.listCodes(page, pageSize);
  }
);

// Create a new redeem code
router.post(
  "/codes",
  permission({ level: ROLE.ADMIN }),
  validator({
    body: {
      hours: Number,
      maxUses: Number,
      config: String
    }
  }),
  async (ctx: Koa.ParameterizedContext) => {
    let hours = toNumber(ctx.request.body.hours) ?? 0;
    const maxUses = toNumber(ctx.request.body.maxUses) ?? 1;
    let config = toText(ctx.request.body.config) ?? "{}";
    let note = toText(ctx.request.body.note) ?? "";
    const createdBy = ctx.session?.userName ?? "admin";

    // If planId is provided, inherit from the plan (body values override)
    const planId = toText(ctx.request.body.planId) ?? "";
    if (planId) {
      const plan = redeemPlanService.getPlan(planId);
      if (!plan) throw new Error("Plan not found");
      // Use plan duration as hours if not explicitly set
      if (!ctx.request.body.hours) hours = planDurationToHours(plan);
      // Generate config from plan and keep routing metadata with the code.
      const planConfig = planToInstanceConfig(plan);
      let userConfig: any = {};
      try {
        userConfig = JSON.parse(config);
      } catch {
        userConfig = {};
      }
      config = JSON.stringify({
        config: { ...planConfig, ...(userConfig.config ?? userConfig) },
        productId: plan.productId,
        daemonId: plan.daemonId,
        planId: plan.id,
        namePrefix: plan.namePrefix,
        nameSuffixType: plan.nameSuffixType
      });
      if (!ctx.request.body.note && plan.note) note = plan.note;
    }

    if (hours <= 0) throw new Error("hours must be positive");
    if (maxUses < 1) throw new Error("maxUses must be at least 1");

    const code = redeemService.createCode(hours, maxUses, config, createdBy, note);
    logger.info(`[REDEEM] Admin ${createdBy} created code: ${code} (${hours}h, ${maxUses} uses)`);

    ctx.body = { code };
  }
);

// Batch create redeem codes
router.post(
  "/codes/batch",
  permission({ level: ROLE.ADMIN }),
  validator({
    body: {
      count: Number,
      hours: Number,
      maxUses: Number,
      config: String
    }
  }),
  async (ctx: Koa.ParameterizedContext) => {
    const count = toNumber(ctx.request.body.count) ?? 0;
    let hours = toNumber(ctx.request.body.hours) ?? 0;
    const maxUses = toNumber(ctx.request.body.maxUses) ?? 1;
    let config = toText(ctx.request.body.config) ?? "{}";
    let note = toText(ctx.request.body.note) ?? "";
    const createdBy = ctx.session?.userName ?? "admin";

    if (count < 1 || count > 500) throw new Error("count must be between 1 and 500");
    if (maxUses < 1) throw new Error("maxUses must be at least 1");

    const planId = toText(ctx.request.body.planId) ?? "";
    if (planId) {
      const plan = redeemPlanService.getPlan(planId);
      if (!plan) throw new Error("Plan not found");
      if (!ctx.request.body.hours) hours = planDurationToHours(plan);
      const planConfig = planToInstanceConfig(plan);
      let userConfig: any = {};
      try {
        userConfig = JSON.parse(config);
      } catch {
        userConfig = {};
      }
      config = JSON.stringify({
        config: { ...planConfig, ...(userConfig.config ?? userConfig) },
        productId: plan.productId,
        daemonId: plan.daemonId,
        planId: plan.id,
        namePrefix: plan.namePrefix,
        nameSuffixType: plan.nameSuffixType
      });
      if (!ctx.request.body.note && plan.note) note = plan.note;
    }

    if (hours <= 0) throw new Error("hours must be positive");

    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      codes.push(redeemService.createCode(hours, maxUses, config, createdBy, note));
    }
    logger.info(`[REDEEM] Admin ${createdBy} batch created ${codes.length} codes (${hours}h, ${maxUses} uses)`);
    ctx.body = { codes, count: codes.length };
  }
);

// Delete one or more redeem codes
router.delete(
  "/codes",
  permission({ level: ROLE.ADMIN }),
  async (ctx: Koa.ParameterizedContext) => {
    const ids: string[] = ctx.request.body ?? [];
    if (!Array.isArray(ids)) throw new Error("Expected an array of code ids");

    for (const id of ids) {
      redeemService.deleteCode(id);
    }
    ctx.body = true;
  }
);

// Export unused redeem codes as TXT
router.get(
  "/export",
  permission({ level: ROLE.ADMIN }),
  async (ctx: Koa.ParameterizedContext) => {
    const planId = toText(ctx.query.planId as string) ?? "";
    const allUnused = redeemService.getUnusedCodes();

    let codes: typeof allUnused;
    let header: string;

    if (planId) {
      codes = allUnused.filter((c) => {
        try {
          const parsed = JSON.parse(c.config);
          return parsed.planId === planId;
        } catch {
          return false;
        }
      });
      const plan = redeemPlanService.getPlan(planId);
      header = `MCSManager 兑换码导出 - 套餐「${plan?.name || planId}」未使用兑换码 (${codes.length}个)`;
    } else {
      codes = allUnused;
      header = `MCSManager 兑换码导出 - 全部未使用兑换码 (${codes.length}个)`;
    }

    const body = [header, ...codes.map((c) => c.code)].join("\n");
    ctx.set("Content-Type", "text/plain; charset=utf-8");
    ctx.set("Content-Disposition", `attachment; filename="redeem_codes_${Date.now()}.txt"`);
    ctx.body = body;
  }
);

// ─── Plan management endpoints ────────────────────────────────────────

// List all plans
router.get(
  "/plans",
  permission({ level: ROLE.USER }),
  async (ctx: Koa.ParameterizedContext) => {
    ctx.body = redeemPlanService.listPlans();
  }
);

// Create a new plan
router.post(
  "/plans",
  permission({ level: ROLE.ADMIN }),
  validator({
    body: {
      image: String
    }
  }),
  async (ctx: Koa.ParameterizedContext) => {
    const createdBy = ctx.session?.userName ?? "admin";
    const image = toText(ctx.request.body.image) ?? "";
    const plan = redeemPlanService.createPlan({
      name: toText(ctx.request.body.name) || image || "Docker Plan",
      durationUnit: toText(ctx.request.body.durationUnit) || "hour",
      durationValue: toNumber(ctx.request.body.durationValue) ?? 24,
      productId: toNumber(ctx.request.body.productId) ?? 1,
      daemonId: toText(ctx.request.body.daemonId) ?? "",
      image,
      memory: toNumber(ctx.request.body.memory) ?? 0,
      cpu: toNumber(ctx.request.body.cpu) ?? 0,
      portsEnabled: !!ctx.request.body.portsEnabled,
      ports: toText(ctx.request.body.ports) ?? "",
      envEnabled: !!ctx.request.body.envEnabled,
      env: toText(ctx.request.body.env) ?? "",
      startupCmd: toText(ctx.request.body.startupCmd) ?? "",
      stopCmd: toText(ctx.request.body.stopCmd) ?? "",
      cwd: toText(ctx.request.body.cwd) ?? "",
      maxSpace: toNumber(ctx.request.body.maxSpace) ?? 0,
      namePrefix: toText(ctx.request.body.namePrefix) ?? "",
      nameSuffixType: toText(ctx.request.body.nameSuffixType) || "userhash",
      nameSuffixValue: toText(ctx.request.body.nameSuffixValue) ?? "",
      instanceCount: 0,
      note: toText(ctx.request.body.note) ?? "",
      createdBy
    });
    logger.info(`[REDEEM] Admin ${createdBy} created plan: ${plan.name}`);
    ctx.body = plan;
  }
);

// Update a plan
router.put(
  "/plans",
  permission({ level: ROLE.ADMIN }),
  validator({
    body: {
      id: String
    }
  }),
  async (ctx: Koa.ParameterizedContext) => {
    const id = toText(ctx.request.body.id) ?? "";
    const result = redeemPlanService.updatePlan(id, {
      name: ctx.request.body.name != null ? toText(ctx.request.body.name) ?? undefined : undefined,
      durationUnit: ctx.request.body.durationUnit != null ? toText(ctx.request.body.durationUnit) ?? undefined : undefined,
      durationValue: ctx.request.body.durationValue != null ? toNumber(ctx.request.body.durationValue) ?? undefined : undefined,
      productId: ctx.request.body.productId != null ? toNumber(ctx.request.body.productId) ?? undefined : undefined,
      daemonId: ctx.request.body.daemonId != null ? toText(ctx.request.body.daemonId) ?? undefined : undefined,
      image: ctx.request.body.image != null ? toText(ctx.request.body.image) ?? undefined : undefined,
      memory: ctx.request.body.memory != null ? toNumber(ctx.request.body.memory) ?? undefined : undefined,
      cpu: ctx.request.body.cpu != null ? toNumber(ctx.request.body.cpu) ?? undefined : undefined,
      portsEnabled: ctx.request.body.portsEnabled != null ? !!ctx.request.body.portsEnabled : undefined,
      ports: ctx.request.body.ports != null ? toText(ctx.request.body.ports) ?? undefined : undefined,
      envEnabled: ctx.request.body.envEnabled != null ? !!ctx.request.body.envEnabled : undefined,
      env: ctx.request.body.env != null ? toText(ctx.request.body.env) ?? undefined : undefined,
      startupCmd: ctx.request.body.startupCmd != null ? toText(ctx.request.body.startupCmd) ?? undefined : undefined,
      stopCmd: ctx.request.body.stopCmd != null ? toText(ctx.request.body.stopCmd) ?? undefined : undefined,
      cwd: ctx.request.body.cwd != null ? toText(ctx.request.body.cwd) ?? undefined : undefined,
      maxSpace: ctx.request.body.maxSpace != null ? toNumber(ctx.request.body.maxSpace) ?? undefined : undefined,
      namePrefix: ctx.request.body.namePrefix != null ? toText(ctx.request.body.namePrefix) ?? undefined : undefined,
      nameSuffixType: ctx.request.body.nameSuffixType != null ? toText(ctx.request.body.nameSuffixType) ?? undefined : undefined,
      nameSuffixValue: ctx.request.body.nameSuffixValue != null ? toText(ctx.request.body.nameSuffixValue) ?? undefined : undefined,
      note: ctx.request.body.note != null ? toText(ctx.request.body.note) ?? undefined : undefined
    });
    if (!result) throw new Error("Plan not found");
    ctx.body = result;
  }
);

// Delete a plan
router.delete(
  "/plans",
  permission({ level: ROLE.ADMIN }),
  async (ctx: Koa.ParameterizedContext) => {
    const ids: string[] = ctx.request.body ?? [];
    if (!Array.isArray(ids)) throw new Error("Expected an array of plan ids");
    for (const id of ids) {
      redeemPlanService.deletePlan(id);
    }
    ctx.body = true;
  }
);

// ─── User endpoint: redeem a code to buy/renew instance ───────────

router.post(
  "/use",
  permission({ level: ROLE.USER }),
  validator({
    body: {
      code: String
    }
  }),
  async (ctx: Koa.ParameterizedContext) => {
    let productId = toNumber(ctx.request.body.productId) ?? 0;
    let daemonId = toText(ctx.request.body.daemonId) ?? "";
    const code = toText(ctx.request.body.code) ?? "";
    const instanceId = toText(ctx.request.body.instanceId) ?? "";
    const username = ctx.session?.userName ?? "";

    if (!username) throw new Error("Must be logged in to redeem a code");

    const response = await execWithMutexId(`redeem-${code}`, async () => {
      // Validate the redeem code first; consume it only after instance operation succeeds.
      const redeemInfo = redeemService.checkCode(code);
      if (!redeemInfo) {
        const diag = redeemService.getCodeDiagnostics(code);
        logger.warn(
          `[REDEEM] Invalid code input by ${username}: normalized=${diag.normalized || "<empty>"}, total=${diag.total}, matched=${diag.matched}, exhausted=${diag.exhausted}, samples=${diag.samples.join(",")}`
        );
        throw new Error(diag.exhausted ? "Redeem code has already been used" : "Invalid or expired redeem code");
      }

      const hours = redeemInfo.hours;
      let payload: Partial<IGlobalInstanceConfig> = {};
      let planId = "";
      let namePrefix = "";
      let nameSuffixType = "";
      try {
        const parsed = JSON.parse(redeemInfo.config);
        payload = parsed.config ?? parsed;
        if (!productId && parsed.productId) productId = Number(parsed.productId);
        if (!daemonId && parsed.daemonId) daemonId = String(parsed.daemonId);
        planId = parsed.planId || "";
        namePrefix = parsed.namePrefix || "";
        nameSuffixType = parsed.nameSuffixType || "";
      } catch {
        // use empty config
      }

      // Generate instance nickname from plan naming config
      if (planId) {
        const plan = redeemPlanService.getPlan(planId);
        if (plan && (plan.namePrefix || plan.nameSuffixType !== "userhash")) {
          payload.nickname = generateInstanceNickname(plan, {
            username,
            planInstanceCount: plan.instanceCount || 0
          });
          redeemPlanService.incrementCounter(planId);
        }
      }

      // Ensure Docker containers are properly configured.
      // Do not default cwd to host root (/): empty/root cwd can make newly created
      // Docker instances expose the server root as the instance workspace.
      if (payload.type === "docker" || (payload as any)?.docker) {
        payload.processType = "docker";
        if (!payload.eventTask) payload.eventTask = { autoStart: true, autoRestart: false, autoRestartMaxTimes: 0, ignore: false };
        const safeDockerCwd = !payload.cwd || String(payload.cwd).trim() === "/" ? "/workspace" : String(payload.cwd).trim();
        payload.cwd = safeDockerCwd;
        if (!(payload as any).docker) (payload as any).docker = {};
        if (!(payload as any).docker.workingDir || String((payload as any).docker.workingDir).trim() === "/") (payload as any).docker.workingDir = safeDockerCwd;
        payload.ie = payload.ie || "utf-8";
        payload.oe = payload.oe || "utf-8";
        payload.startCommand = payload.startCommand || "";
        payload.stopCommand = payload.stopCommand || "";
      }

      if (!productId) throw new Error("Redeem code missing productId/category id");
      if (!daemonId) throw new Error("Redeem code missing daemonId/node id");

      logger.info(
        `[REDEEM] User ${username} redeemed code ${code}: ${hours}h, productId=${productId}, daemonId=${daemonId}`
      );

      const params = {
        category_id: productId,
        payload,
        username,
        node_id: daemonId,
        hours,
        instance_id: instanceId,
        code
      };

      const result = await buyOrRenewInstance(
        instanceId ? RequestAction.RENEW : RequestAction.BUY,
        params
      );
      redeemService.consumeCode(code);
      return { ...result, daemon_id: daemonId, product_id: productId };
    });

    ctx.body = response;
  }
);

export default router;
