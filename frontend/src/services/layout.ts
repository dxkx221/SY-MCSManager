import { setAllLayoutConfig } from "@/config/originLayoutConfig";
import { getRandomId } from "@/tools/randId";
import { getLayoutConfig } from "./apis/layout";
import { t } from "@/lang/i18n";

export async function initLayoutConfig() {
  const { value } = await getLayoutConfig().execute();
  try {
    const cfg = JSON.parse(value!);
    if (cfg instanceof Array) {
      if (!cfg.some((item: any) => item.page === "/announcements")) {
        cfg.push({ page: "/announcements", items: [{ id: getRandomId(), type: "AnnouncementCenter", title: "公告中心", width: 12, height: "unset", meta: {} }] });
      }
      setAllLayoutConfig(cfg);
      const settingsConfig = cfg.find((v: any) => v.page === "__settings__");
      document.title = settingsConfig?.theme?.pageTitle || t("TXT_CODE_47ae8ee6");
    }
  } catch (error: any) {
    console.error("init layout config error:", error);
  }
}
