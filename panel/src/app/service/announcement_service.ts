import { v4 } from "uuid";
import Storage from "../common/storage/sys_storage";
import Announcement from "../entity/announcement";

const STORAGE_CATEGORY = "Announcement";

export interface AnnouncementInput {
  title?: unknown;
  content?: unknown;
  active?: unknown;
}

function parseActive(value: unknown): boolean {
  if (typeof value !== "boolean") throw new Error("active must be a boolean");
  return value;
}

function requiredText(value: unknown, name: string, maxLength: number): string {
  if (typeof value !== "string") throw new Error(`${name} must be plain text`);
  const text = value.trim();
  if (!text) throw new Error(`${name} is required`);
  if (text.length > maxLength) throw new Error(`${name} must not exceed ${maxLength} characters`);
  return text;
}

class AnnouncementService {
  private readonly objects = new Map<string, Announcement>();

  async initialize() {
    this.objects.clear();
    for (const id of await Storage.getStorage().list(STORAGE_CATEGORY)) {
      const item = (await Storage.getStorage().load(
        STORAGE_CATEGORY,
        Announcement,
        id
      )) as Announcement;
      if (item) this.objects.set(id, item);
    }
  }

  list(activeOnly = true): Announcement[] {
    return Array.from(this.objects.values())
      .filter((item) => !activeOnly || item.active)
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  get(id: string): Announcement | undefined {
    return this.objects.get(id);
  }

  async create(input: AnnouncementInput, publisher: string): Promise<Announcement> {
    const item = new Announcement();
    item.id = v4().replace(/-/g, "");
    item.title = requiredText(input.title, "title", 100);
    item.content = requiredText(input.content, "content", 10000);
    item.createdAt = Date.now();
    item.publisher = publisher;
    item.active = input.active == null ? true : parseActive(input.active);
    this.objects.set(item.id, item);
    await Storage.getStorage().store(STORAGE_CATEGORY, item.id, item);
    return item;
  }

  async update(id: string, input: AnnouncementInput): Promise<Announcement> {
    const item = this.objects.get(id);
    if (!item) throw new Error("Announcement not found");
    if (input.title !== undefined) item.title = requiredText(input.title, "title", 100);
    if (input.content !== undefined)
      item.content = requiredText(input.content, "content", 10000);
    if (input.active !== undefined) item.active = parseActive(input.active);
    await Storage.getStorage().store(STORAGE_CATEGORY, item.id, item);
    return item;
  }

  async delete(id: string): Promise<void> {
    if (!this.objects.has(id)) throw new Error("Announcement not found");
    this.objects.delete(id);
    await Storage.getStorage().delete(STORAGE_CATEGORY, id);
  }
}

export default new AnnouncementService();
