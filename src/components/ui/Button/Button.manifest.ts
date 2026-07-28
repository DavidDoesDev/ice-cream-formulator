import type { ComponentManifest } from "../manifest";

export const manifest: ComponentManifest = {
  name: "Button",
  tier: "primitive",
  description:
    "A clickable action. Renders <a> when href is set, else <button>; absorbs IconButton via icon + iconPosition.",
  props: {
    hierarchy: {
      control: "enum",
      options: ["primary", "secondary", "tertiary", "inverse"],
      default: "primary",
      description: "inverse = filled flip for a colored/photo surface",
    },
    tone: { control: "enum", options: ["normal", "critical", "neutral"], default: "normal" },
    size: { control: "enum", options: ["sm", "md", "lg"], default: "md" },
    iconPosition: {
      control: "enum",
      options: ["none", "only", "before", "after"],
      default: "none",
    },
    disabled: { control: "boolean", default: false },
    loading: { control: "boolean", default: false },
    href: { control: "text", default: "", description: "Present → renders an <a>" },
  },
  slots: { default: "Button" },
  axes: ["hierarchy", "tone", "size"],
};
