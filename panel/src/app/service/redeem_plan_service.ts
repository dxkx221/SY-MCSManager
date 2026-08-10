import { customAlphabet } from "nanoid";
import RedeemPlan, { planDurationToHours } from "../entity/redeem_plan";
import StorageSystem from "../common/system_storage";

const STORAGE_CATEGORY = "RedeemPlans";
const STORAGE_KEY = "plans";
const SAFE_DOCKER_CWD = "/workspace";

const randomLower = customAlphabet("abcdefghijklmnopqrstuvwxyz", 6);

function normalizeDockerCwd(cwd?: string): string {
  const value = typeof cwd === "string" ? cwd.trim() : "";
  if (!value || value === "/") return SAFE_DOCKER_CWD;
  return value;
}

/**
 * Generate instance nickname from a plan's naming config + user context.
 */
export interface PlanNamingContext {
  username: string;
  planInstanceCount: number;
}
export function generateInstanceNickname(plan: RedeemPlan, ctx: PlanNamingContext): string {
  const prefix = plan.namePrefix || "";
  let suffix = "";

  switch (plan.nameSuffixType) {
    case "username":
      suffix = ctx.username;
      break;
    case "userhash":
      let hash = 0;
      for (let i = 0; i < ctx.username.length; i++) {
        hash = ((hash << 5) - hash) + ctx.username.charCodeAt(i);
        hash |= 0;
      }
      suffix = Math.abs(hash).toString(16).slice(0, 6);
      break;
    case "increment":
      suffix = String(ctx.planInstanceCount + 1);
      break;
    case "custom":
      suffix = plan.nameSuffixValue || "";
      break;
    case "random":
      suffix = randomLower();
      break;
    default:
      suffix = "";
  }

  return prefix + suffix || ("App-" + ctx.username);
}

/**
 * Generate a full IGlobalInstanceConfig from a RedeemPlan.
 */
export function planToInstanceConfig(plan: RedeemPlan): Partial<IGlobalInstanceConfig> {
  const config: any = {};

  const docker: any = {};
  if (plan.image) docker.image = plan.image;
  if (plan.memory > 0) docker.memory = plan.memory;
  if (plan.cpu > 0) docker.cpuUsage = plan.cpu;
  if (plan.portsEnabled && plan.ports) docker.ports = plan.ports.split("\n").map((s) => s.trim()).filter(Boolean);
  if (plan.envEnabled && plan.env) docker.env = plan.env.split("\n").map((s) => s.trim()).filter(Boolean);
  if (plan.maxSpace > 0) docker.maxSpace = plan.maxSpace;

  if (Object.keys(docker).length > 0) config.docker = docker;
  if (plan.startupCmd) config.startCommand = plan.startupCmd;
  if (plan.stopCmd) config.stopCommand = plan.stopCmd;
  if (plan.cwd) config.cwd = plan.cwd;
  config.type = "docker";
  config.processType = "docker";
  // Required daemon fields. Never default Docker cwd to host root (/), otherwise
  // container creation may expose the server root directory as the instance workspace.
  config.cwd = normalizeDockerCwd(config.cwd);
  if (!docker.workingDir || docker.workingDir.trim() === "/") docker.workingDir = config.cwd;
  config.ie = "utf-8";
  config.oe = "utf-8";
  config.startCommand = config.startCommand || "";
  config.stopCommand = config.stopCommand || "";
  config.eventTask = {
    autoStart: true,
    autoRestart: false,
    autoRestartMaxTimes: 0,
    ignore: false
  };

  return config;
}

class RedeemPlanService {
  private _plans: RedeemPlan[] | null = null;

  private get plans(): RedeemPlan[] {
    if (this._plans === null) {
      try {
        const raw = StorageSystem.readFile(`${STORAGE_CATEGORY}/${STORAGE_KEY}.json`);
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed)) {
          this._plans = parsed;
        } else {
          this._plans = [];
        }
      } catch {
        this._plans = [];
      }
    }
    return this._plans;
  }

  private save() {
    const fs = require("fs");
    const path = require("path");
    const dir = `${STORAGE_CATEGORY}`;
    fs.mkdirSync(path.join(process.cwd(), "data", dir), { recursive: true });
    StorageSystem.writeFile(
      `${dir}/${STORAGE_KEY}.json`,
      JSON.stringify(this._plans, null, 2)
    );
  }

  createPlan(plan: Omit<RedeemPlan, "id" | "createdAt">): RedeemPlan {
    const entity: RedeemPlan = {
      ...plan,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: Date.now()
    } as RedeemPlan;
    this._plans = this.plans;
    this._plans.push(entity);
    this.save();
    return entity;
  }

  updatePlan(id: string, updates: Partial<Omit<RedeemPlan, "id" | "createdAt" | "createdBy">>): RedeemPlan | null {
    const idx = this.plans.findIndex((p) => p.id === id);
    if (idx === -1) return null;
    this.plans[idx] = { ...this.plans[idx], ...updates };
    this.save();
    return this.plans[idx];
  }

  getPlan(id: string): RedeemPlan | null {
    return this.plans.find((p) => p.id === id) ?? null;
  }

  listPlans(): RedeemPlan[] {
    return [...this.plans].sort((a, b) => b.createdAt - a.createdAt);
  }

  deletePlan(id: string): boolean {
    const idx = this.plans.findIndex((p) => p.id === id);
    if (idx === -1) return false;
    this.plans.splice(idx, 1);
    this.save();
    return true;
  }

  incrementCounter(id: string): void {
    const plan = this.plans.find((p) => p.id === id);
    if (plan) {
      plan.instanceCount = (plan.instanceCount || 0) + 1;
      this.save();
    }
  }
}

export default new RedeemPlanService();
