import type { ComponentManifest } from "../manifest";

export const manifest: ComponentManifest = {
  name: "Tag",
  tier: "primitive",
  description: "Compact label — absorbs tag / pill / badge / chip. Interactive (button) when onClick or selected.",
  props: {
    tone: { control: "enum", options: ["normal", "critical", "neutral", "ok"], default: "normal" },
    size: { control: "enum", options: ["sm", "md", "lg"], default: "md" },
    shape: { control: "enum", options: ["rounded", "pill"], default: "rounded" },
    selected: { control: "boolean", default: false, description: "chip interactive state" },
    removable: { control: "boolean", default: false, description: "renders a dismiss affordance" },
  },
  slots: { default: "Tag" },
  axes: ["tone", "size", "shape"],
};
