import Router from "@koa/router";
import Koa from "koa";
import { ROLE } from "../entity/user";
import permission from "../middleware/permission";
import announcementService from "../service/announcement_service";
import { getUserUuid } from "../service/passport_service";
import userSystem from "../service/user_service";

const router = new Router({ prefix: "/announcement" });

function currentUser(ctx: Koa.ParameterizedContext) {
  const user = userSystem.getUserByUuid(getUserUuid(ctx));
  if (!user) throw new Error("User not found");
  return user;
}

router.get("/", permission({ level: ROLE.USER }), async (ctx: Koa.ParameterizedContext) => {
  const user = currentUser(ctx);
  const readIds = new Set(user.readAnnouncementIds || []);
  const items = announcementService.list(user.permission < ROLE.ADMIN);
  ctx.body = items.map((item) => ({ ...item, read: readIds.has(item.id) }));
});

router.get("/unread", permission({ level: ROLE.USER }), async (ctx: Koa.ParameterizedContext) => {
  const user = currentUser(ctx);
  const readIds = new Set(user.readAnnouncementIds || []);
  ctx.body = announcementService
    .list(true)
    .filter((item) => !readIds.has(item.id))
    .map((item) => ({ ...item, read: false }));
});

router.post("/read", permission({ level: ROLE.USER }), async (ctx: Koa.ParameterizedContext) => {
  const body = ctx.request.body || {};
  const rawIds = Array.isArray(body.ids) ? body.ids : [body.id];
  const ids: string[] = Array.from(
    new Set<string>(
      rawIds.filter((id: unknown): id is string => typeof id === "string" && id.length > 0)
    )
  );
  if (!ids.length) throw new Error("id or ids is required");
  for (const id of ids) {
    if (!announcementService.get(id)) throw new Error("Announcement not found");
  }
  const user = currentUser(ctx);
  const existingIds = new Set(announcementService.list(false).map((item) => item.id));
  const readIds = new Set((user.readAnnouncementIds || []).filter((id) => existingIds.has(id)));
  ids.forEach((id: string) => readIds.add(id));
  await userSystem.edit(user.uuid, { readAnnouncementIds: Array.from(readIds) });
  ctx.body = true;
});

router.post("/", permission({ level: ROLE.ADMIN }), async (ctx: Koa.ParameterizedContext) => {
  const user = currentUser(ctx);
  ctx.body = await announcementService.create(ctx.request.body || {}, user.userName);
});

router.put("/:id", permission({ level: ROLE.ADMIN }), async (ctx: Koa.ParameterizedContext) => {
  ctx.body = await announcementService.update(ctx.params.id, ctx.request.body || {});
});

router.delete("/:id", permission({ level: ROLE.ADMIN }), async (ctx: Koa.ParameterizedContext) => {
  await announcementService.delete(ctx.params.id);
  ctx.body = true;
});

export default router;
