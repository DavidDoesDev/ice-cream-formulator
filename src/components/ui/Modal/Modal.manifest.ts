import type { ComponentManifest } from "../manifest";

export const manifest: ComponentManifest = {
  name: "Modal",
  tier: "primitive",
  description:
    "Blocking overlay (scrim + sheet). placement=center is a dialog; sheet slides in as a drawer. Supports a custom header for drill-down flows.",
  props: {
    placement: { control: "enum", options: ["center", "sheet"], default: "center" },
    size: { control: "enum", options: ["sm", "md", "lg"], default: "md" },
    dismissable: { control: "boolean", default: true, description: "scrim/Escape close + close button" },
    title: { control: "text", default: "", description: "default header title (omit when passing `header`)" },
  },
  slots: { default: "Modal body", footer: "Footer actions", header: "Custom header" },
  preview: "overlay",
};
