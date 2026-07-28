import type { ComponentManifest } from "../manifest";

export const manifest: ComponentManifest = {
  name: "SectionHeader",
  tier: "molecule",
  description: "Section divider — marker (dot/icon) + uppercase label + rule.",
  props: {
    size: { control: "enum", options: ["sm", "md"], default: "md" },
    label: { control: "text", default: "Section" },
  },
  axes: ["size"],
};
