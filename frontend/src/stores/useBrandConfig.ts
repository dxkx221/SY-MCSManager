import { computed, ref } from "vue";
import { settingInfo } from "@/services/apis";

interface BrandConfig {
  brandName: string;
  brandOwner: string;
  brandEmail: string;
  brandGithub: string;
  brandWebsite: string;
}

const brandConfig = ref<BrandConfig>({
  brandName: "",
  brandOwner: "",
  brandEmail: "",
  brandGithub: "",
  brandWebsite: ""
});

const loaded = ref(false);

export function useBrandConfig() {
  const brand = computed(() => brandConfig.value);

  const loadBrandConfig = async () => {
    if (loaded.value) return;
    try {
      const { execute } = settingInfo();
      const res = await execute();
      const s = res.value as any;
      brandConfig.value = {
        brandName: s?.brandName || "",
        brandOwner: s?.brandOwner || "",
        brandEmail: s?.brandEmail || "",
        brandGithub: s?.brandGithub || "",
        brandWebsite: s?.brandWebsite || ""
      };
      loaded.value = true;
    } catch {
      // ignore
    }
  };

  const panelTitle = computed(() => brandConfig.value.brandName || "神之翼工作室");

  return { brand, loadBrandConfig, panelTitle };
}
