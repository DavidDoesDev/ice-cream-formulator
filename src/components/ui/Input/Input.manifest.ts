import type { ComponentManifest } from "../manifest";

export const manifest: ComponentManifest = {
  name: "Input",
  tier: "primitive",
  description: "Text field — absorbs <textarea> via `multiline`. Optional leading icon for search.",
  props: {
    tone: { control: "enum", options: ["normal", "critical", "neutral"], default: "normal" },
    size: { control: "enum", options: ["sm", "md", "lg"], default: "md" },
    multiline: { control: "boolean", default: false, description: "true → renders <textarea>" },
    invalid: { control: "boolean", default: false, description: 'sets aria-invalid="true"' },
  },
  axes: ["size"],
};
