import { customAlphabet } from "nanoid";
import RedeemCode from "../entity/redeem_code";
import StorageSystem from "../common/system_storage";

const generateRedeemCode = customAlphabet(
  "ABCDEFGHJKLMNPQRSTUVWXYZ23456789",
  12
);

const STORAGE_CATEGORY = "RedeemCodes";
const STORAGE_KEY = "codes";

class RedeemService {
  private _codes: RedeemCode[] | null = null;

  private normalizeCode(code: string): string {
    return String(code || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  }

  private findCodeEntity(code: string): RedeemCode | undefined {
    const normalized = this.normalizeCode(code);
    return this.codes.find((c) => {
      const stored = this.normalizeCode(c.code);
      return stored === normalized || (normalized.length > stored.length && normalized.includes(stored));
    });
  }

  private get codes(): RedeemCode[] {
    if (this._codes === null) {
      try {
        const raw = StorageSystem.readFile(`${STORAGE_CATEGORY}/${STORAGE_KEY}.json`);
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed)) {
          this._codes = parsed;
        } else {
          this._codes = [];
        }
      } catch {
        this._codes = [];
      }
    }
    return this._codes;
  }

  private save() {
    const fs = require("fs");
    const path = require("path");
    const dir = `${STORAGE_CATEGORY}`;
    fs.mkdirSync(path.join(process.cwd(), "data", dir), { recursive: true });
    StorageSystem.writeFile(
      `${dir}/${STORAGE_KEY}.json`,
      JSON.stringify(this._codes, null, 2)
    );
  }

  /** Create a new redeem code. Returns the generated code string. */
  createCode(
    hours: number,
    maxUses: number,
    config: string,
    createdBy: string,
    note: string = ""
  ): string {
    const code = generateRedeemCode();
    const entity: RedeemCode = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      code,
      hours,
      maxUses,
      usedCount: 0,
      config,
      createdBy,
      createdAt: Date.now(),
      note
    };
    this._codes = this.codes;
    this._codes.push(entity);
    this.save();
    return code;
  }

  getCodeDiagnostics(code: string): { normalized: string; total: number; matched: boolean; exhausted: boolean; samples: string[] } {
    const normalized = this.normalizeCode(code);
    const matchedEntity = this.findCodeEntity(code);
    return {
      normalized,
      total: this.codes.length,
      matched: !!matchedEntity,
      exhausted: !!matchedEntity && matchedEntity.usedCount >= matchedEntity.maxUses,
      samples: this.codes.slice(-10).map((c) => c.code)
    };
  }

  /** Validate a redeem code without consuming it. */
  checkCode(code: string): { hours: number; config: string; redeemed: boolean } | null {
    const entity = this.findCodeEntity(code);
    if (!entity) return null;
    if (entity.usedCount >= entity.maxUses) return null;
    return {
      hours: entity.hours,
      config: entity.config,
      redeemed: entity.usedCount + 1 >= entity.maxUses
    };
  }

  /** Consume a redeem code after the instance operation succeeds. */
  consumeCode(code: string): boolean {
    const entity = this.findCodeEntity(code);
    if (!entity) return false;
    if (entity.usedCount >= entity.maxUses) return false;
    entity.usedCount++;
    this.save();
    return true;
  }

  /** Validate and consume a redeem code. Returns the redeem info or null. */
  redeem(code: string): { hours: number; config: string; redeemed: boolean } | null {
    const info = this.checkCode(code);
    if (!info) return null;
    if (!this.consumeCode(code)) return null;
    return info;
  }

  /** List all redeem codes. */
  listCodes(page: number = 1, pageSize: number = 20) {
    const sorted = [...this.codes].sort((a, b) => b.createdAt - a.createdAt);
    const total = sorted.length;
    const maxPage = Math.max(1, Math.ceil(total / pageSize));
    const start = (page - 1) * pageSize;
    const data = sorted.slice(start, start + pageSize);
    return { total, page, pageSize, maxPage, data };
  }

  /** Get all unused codes (usedCount < maxUses). */
  getUnusedCodes(): RedeemCode[] {
    return this.codes.filter((c) => c.usedCount < c.maxUses);
  }

  /** Delete a redeem code by id. */
  deleteCode(id: string): boolean {
    const idx = this.codes.findIndex((c) => c.id === id);
    if (idx === -1) return false;
    this.codes.splice(idx, 1);
    this.save();
    return true;
  }
}

export default new RedeemService();
