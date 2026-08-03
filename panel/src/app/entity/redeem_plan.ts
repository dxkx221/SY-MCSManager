// Redeem Plan entity — reusable instance config template
export default class RedeemPlan {
  id: string = "";
  name: string = "";

  // ─── Duration ───
  durationUnit: string = "hour";   // "hour" | "day" | "month" | "year" | "permanent"
  durationValue: number = 24;      // numeric value (ignored for permanent)

  // ─── Deployment target ───
  productId: number = 1;           // Instance category/product id
  daemonId: string = "";           // Target daemon/node uuid

  // ─── Docker config ───
  image: string = "";
  memory: number = 1024;
  cpu: number = 1;

  // ─── Port mapping ───
  portsEnabled: boolean = false;
  ports: string = "";

  // ─── Environment variables ───
  envEnabled: boolean = false;
  env: string = "";

  // ─── Commands & paths ───
  startupCmd: string = "";
  stopCmd: string = "";
  cwd: string = "";
  maxSpace: number = 0;

  // ─── Instance naming ───
  namePrefix: string = "";         // e.g. "MC-"  
  nameSuffixType: string = "userhash"; // "userhash" | "username" | "increment" | "custom" | "random"
  nameSuffixValue: string = "";    // custom text when suffixType="custom"
  instanceCount: number = 0;       // auto-increment counter for suffixType="increment"

  // ─── Meta ───
  note: string = "";
  createdBy: string = "";
  createdAt: number = 0;
}

/** Convert duration unit + value to total hours */
export function planDurationToHours(plan: RedeemPlan): number {
  switch (plan.durationUnit) {
    case "day":    return plan.durationValue * 24;
    case "month":  return plan.durationValue * 30 * 24;
    case "year":   return plan.durationValue * 365 * 24;
    case "permanent": return 876000; // 100 years
    case "hour":
    default:       return plan.durationValue;
  }
}

/** Format duration for display */
export function formatPlanDuration(plan: RedeemPlan): string {
  if (plan.durationUnit === "permanent") return "永久";
  const map: Record<string, string> = { hour: "小时", day: "天", month: "月", year: "年" };
  return `${plan.durationValue} ${map[plan.durationUnit] || "小时"}`;
}
