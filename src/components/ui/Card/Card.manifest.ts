import type { ComponentManifest } from "../manifest";

export const manifest: ComponentManifest = {
  name: "Card",
  tier: "primitive",
  description: "A generic surface. Renders <a> when href is set; `selected` draws the accent border.",
  props: {
    elevation: { control: "enum", options: ["flat", "raised", "outlined"], default: "outlined" },
    padding: { control: "enum", options: ["none", "sm", "md", "lg"], default: "md" },
    tone: { control: "enum", options: ["normal", "critical", "neutral", "ok"], default: "normal" },
    selected: { control: "boolean", default: false },
    href: { control: "text", default: "", description: "Present → renders an interactive <a>" },
  },
  slots: { default: "Card content" },
  axes: ["elevation", "padding"],
};
