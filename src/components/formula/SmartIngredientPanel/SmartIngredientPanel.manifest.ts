import type { ComponentManifest } from "@/components/ui/manifest";

export const manifest: ComponentManifest = {
  name: "SmartIngredientPanel",
  tier: "domain",
  description:
    "A smart-ingredient card: icon + name, an optional preset dropdown, ingredient rows (SmartRow), and a + add button. Ratio blends pass `preset` (dropdown + %-rows); ingredient sets omit it (add/remove list).",
  props: {
    name: { control: "text", default: "Sugar blend" },
    addLabel: { control: "text", default: "SUGAR", description: "uppercase noun for the add button" },
  },
  slots: { default: "SmartRow list", preset: "preset dropdown (ratio blends only)" },
  preview: "collection",
};
