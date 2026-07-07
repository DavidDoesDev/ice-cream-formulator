import { describe, it, expect } from "vitest";
import { pressLight, pressDark } from "./palette";

// Independent WCAG 2.x contrast oracle — the spec, not the app's own math.
// https://www.w3.org/TR/WCAG21/#dfn-contrast-ratio
function channel(c: number): number {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}
function relativeLuminance(hex: string): number {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}
function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

// WCAG AA for normal-size body text.
const AA = 4.5;

describe("press palette legibility", () => {
  it("light: ink text is readable on the paper ground", () => {
    expect(contrastRatio(pressLight.text, pressLight.paper)).toBeGreaterThanOrEqual(AA);
  });

  it("light: ink text is readable on raised paper surfaces", () => {
    expect(contrastRatio(pressLight.text, pressLight.paper2)).toBeGreaterThanOrEqual(AA);
  });

  it("dark: paper-tone text is readable on the ink ground", () => {
    expect(contrastRatio(pressDark.text, pressDark.paper)).toBeGreaterThanOrEqual(AA);
  });
});
