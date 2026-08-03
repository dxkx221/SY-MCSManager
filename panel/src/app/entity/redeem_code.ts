// Redeem code entity for local redeem system
export default class RedeemCode {
  id: string = "";
  code: string = "";
  hours: number = 0;
  maxUses: number = 1;
  usedCount: number = 0;
  config: string = ""; // JSON: Partial<IGlobalInstanceConfig>
  createdBy: string = "";
  createdAt: number = 0;
  note: string = "";
}
