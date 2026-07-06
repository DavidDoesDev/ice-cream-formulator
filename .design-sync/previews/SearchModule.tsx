import { SearchModule } from "ice-cream-formulator";

// The natural-language entry point: describe a flavor and it seeds a formula.
// Expanded (autoFocus) reveals the rotating suggestion chips; collapsed is the
// resting search bar.
export const Expanded = () => <SearchModule onSubmit={() => {}} autoFocus />;
export const Collapsed = () => <SearchModule onSubmit={() => {}} />;
