import type { ComponentManifest } from "../manifest";

export const manifest: ComponentManifest = {
  name: "Callout",
  tier: "primitive",
  description: "Inline admonition / banner (note / tip / warning / error) with optional icon + title.",
  props: {
    tone: { control: "enum", options: ["normal", "critical", "neutral", "ok"], default: "normal" },
    size: { control: "enum", options: ["sm", "md", "lg"], default: "md" },
    title: { control: "text", default: "", description: "optional bold lead line" },
  },
  slots: { default: "Callout body" },
  axes: ["tone"],
};
