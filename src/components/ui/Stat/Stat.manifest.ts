import type { ComponentManifest } from "../manifest";

export const manifest: ComponentManifest = {
  name: "Stat",
  tier: "primitive",
  description: "Labelled metric — caption + big value + optional delta/trend.",
  props: {
    tone: { control: "enum", options: ["normal", "critical", "neutral", "ok"], default: "normal" },
    size: { control: "enum", options: ["sm", "md", "lg"], default: "md" },
    direction: { control: "enum", options: ["up", "down", "flat"], default: "flat" },
  },
  axes: ["tone", "size"],
};
