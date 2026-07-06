import { IngredientSelector } from "ice-cream-formulator";

// IngredientSelector is a full-screen fixed overlay. To show its open state
// inside a card, we frame it in a sized box with a transform — that makes the
// component's `position: fixed` resolve against the frame instead of the page,
// so the modal renders in-place. `context` narrows the allowed categories; each
// row is a real catalog ingredient with macro-colored markers.
const Frame = ({ children }: { children: React.ReactNode }) => (
  <div
    style={{
      position: "relative",
      width: "100%",
      maxWidth: 460,
      height: 640,
      transform: "translateZ(0)",
      overflow: "hidden",
      borderRadius: "var(--radius-lg)",
      border: "1px solid var(--color-border)",
    }}
  >
    {children}
  </div>
);

export const AllIngredients = () => (
  <Frame>
    <IngredientSelector context="general" onAdd={() => {}} onDismiss={() => {}} />
  </Frame>
);
export const Sweeteners = () => (
  <Frame>
    <IngredientSelector context="sugar-mix" onAdd={() => {}} onDismiss={() => {}} />
  </Frame>
);
