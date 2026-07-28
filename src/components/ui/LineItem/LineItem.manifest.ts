import type { ComponentManifest } from "../manifest";

export const manifest: ComponentManifest = {
  name: "LineItem",
  tier: "molecule",
  description:
    "Standardized row: leading label (+ optional sub-label/note) and a trailing slot each context fills.",
  props: {
    size: { control: "enum", options: ["sm", "md"], default: "md" },
    indent: { control: "boolean", default: false, description: "sub-ingredient rows" },
    label: { control: "text", default: "Whole milk (3.6% fat)" },
  },
  slots: { trailing: "gram field / % / remove" },
  axes: ["size"],
};
