import type { ComponentManifest } from "../manifest";

export const manifest: ComponentManifest = {
  name: "Tabs",
  tier: "primitive",
  description: "Underline tabs; content stacks below the active tab. Controlled or uncontrolled.",
  props: {
    size: { control: "enum", options: ["sm", "md", "lg"], default: "md" },
    defaultTab: { control: "text", default: "", description: "uncontrolled initial tab id" },
  },
  axes: ["size"],
};
