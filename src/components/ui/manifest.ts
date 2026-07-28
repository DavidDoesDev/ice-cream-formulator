// Component manifest — the single schema each UI primitive declares alongside
// itself. The gallery route reads these to render a live variant matrix, so the
// catalog can never drift from the actual component contract. Mirrors the
// convention in personal-productivity-scripting/site/src/components/ui.

export interface PropControl {
  control: "enum" | "boolean" | "text" | "number";
  options?: string[]; // allowed values for an enum control
  default?: unknown;
  description?: string;
}

export interface ComponentManifest {
  name: string;
  tier: "primitive" | "molecule" | "domain";
  description: string;
  props: Record<string, PropControl>;
  slots?: Record<string, string>; // named slot → example content
  axes?: string[]; // props the gallery renders a full matrix over
  preview?: "inline" | "collection" | "overlay";
}
