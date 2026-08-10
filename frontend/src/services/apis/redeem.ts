import { useDefineApi } from "@/stores/useDefineApi";
import axios from "axios";

export interface ShopInfo {
  uid?: number;
  nickname: string;
  username: string;
  lastTime: number;
  introduction: string;
  afterSalesGroup: string;
}

export interface PortInfoProtocol {
  host: number;
  container: number;
  protocol: string;
}
export interface InstanceInfoProtocol {
  instance_id: string;
  name: string;
  expire: number;
  status: number;
  lines: Array<{ title: string; value: any }>;
  ports: PortInfoProtocol[];
}

export interface BuyInstanceResponse {
  instance_id: string;
  username: string;
  password: string;
  uuid: string;
  expire: number;
  instance_config?: IGlobalInstanceConfig;
  instance_info?: InstanceInfoProtocol;
  daemon_id?: string;
  product_id?: number;
}

export const requestBuyInstance = useDefineApi<
  {
    data: {
      productId: number;
      daemonId: string;
      code: string;
      instanceId?: string;
      payload?: string;
      username?: string;
    };
  },
  BuyInstanceResponse
>({
  url: "/api/exchange/request_buy_instance",
  method: "POST",
  timeout: 1000 * 30
});

export const requestBuyInstanceLocal = useDefineApi<
  {
    data: {
      productId?: number;
      daemonId?: string;
      code: string;
      instanceId?: string;
      payload?: string;
      username?: string;
    };
  },
  BuyInstanceResponse
>({
  url: "/api/redeem/use",
  method: "POST",
  timeout: 1000 * 30
});

// ─── Admin: Redeem code management ───

export interface RedeemCodeItem {
  id: string;
  code: string;
  hours: number;
  maxUses: number;
  usedCount: number;
  config: string;
  createdBy: string;
  createdAt: number;
  note: string;
}

export const listRedeemCodes = useDefineApi<
  {
    params: { page?: number; pageSize?: number };
  },
  { total: number; page: number; pageSize: number; maxPage: number; data: RedeemCodeItem[] }
>({
  url: "/api/redeem/codes",
  method: "GET"
});

export const createRedeemCode = useDefineApi<
  {
    data: { hours: number; maxUses: number; config: string; note?: string; planId?: string };
  },
  { code: string }
>({
  url: "/api/redeem/codes",
  method: "POST"
});

export const batchCreateRedeemCodes = useDefineApi<
  {
    data: { count: number; hours: number; maxUses: number; config: string; note?: string; planId?: string };
  },
  { codes: string[]; count: number }
>({
  url: "/api/redeem/codes/batch",
  method: "POST",
  timeout: 1000 * 30
});

export const deleteRedeemCodes = useDefineApi<
  {
    data: string[];
  },
  boolean
>({
  url: "/api/redeem/codes",
  method: "DELETE"
});

// ─── Plan management ───

export interface RedeemPlanItem {
  id: string;
  name: string;
  durationUnit: string;
  durationValue: number;
  productId: number;
  daemonId: string;
  image: string;
  memory: number;
  cpu: number;
  portsEnabled: boolean;
  ports: string;
  envEnabled: boolean;
  env: string;
  startupCmd: string;
  stopCmd: string;
  cwd: string;
  maxSpace: number;
  namePrefix: string;
  nameSuffixType: string;
  nameSuffixValue: string;
  note: string;
  createdBy: string;
  createdAt: number;
}

export const listRedeemPlans = useDefineApi<
  void,
  RedeemPlanItem[]
>({
  url: "/api/redeem/plans",
  method: "GET"
});

export const createRedeemPlan = useDefineApi<
  {
    data: {
      name?: string;
      durationUnit?: string;
      durationValue?: number;
      productId?: number;
      daemonId?: string;
      image?: string;
      memory?: number;
      cpu?: number;
      portsEnabled?: boolean;
      ports?: string;
      envEnabled?: boolean;
      env?: string;
      startupCmd?: string;
      stopCmd?: string;
      cwd?: string;
      maxSpace?: number;
      namePrefix?: string;
      nameSuffixType?: string;
      nameSuffixValue?: string;
      note?: string;
    };
  },
  RedeemPlanItem
>({
  url: "/api/redeem/plans",
  method: "POST"
});

export const updateRedeemPlan = useDefineApi<
  {
    data: {
      id: string;
      name?: string;
      durationUnit?: string;
      durationValue?: number;
      productId?: number;
      daemonId?: string;
      image?: string;
      memory?: number;
      cpu?: number;
      portsEnabled?: boolean;
      ports?: string;
      envEnabled?: boolean;
      env?: string;
      startupCmd?: string;
      stopCmd?: string;
      cwd?: string;
      maxSpace?: number;
      namePrefix?: string;
      nameSuffixType?: string;
      nameSuffixValue?: string;
      note?: string;
    };
  },
  RedeemPlanItem
>({
  url: "/api/redeem/plans",
  method: "PUT"
});

export const deleteRedeemPlans = useDefineApi<
  {
    data: string[];
  },
  boolean
>({
  url: "/api/redeem/plans",
  method: "DELETE"
});

// ─── Export ───

export async function exportRedeemCodes(planId?: string) {
  const resp = await axios.get("/api/redeem/export", {
    params: planId ? { planId } : {},
    responseType: "blob"
  });
  const url = window.URL.createObjectURL(new Blob([resp.data]));
  const a = document.createElement("a");
  a.href = url;
  a.download = `redeem_codes_${Date.now()}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}
