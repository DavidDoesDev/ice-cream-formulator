import { test, expect } from "@playwright/test";

test("slider bounds are archetype-centered, not global", async ({ page }) => {
  await page.goto("/new");
  await page.locator("button[type='button']:has(p)").first().click();
  await expect(page).toHaveURL(/\/formula\/.+/, { timeout: 5000 });

  await page.getByRole("button", { name: /edit formula/i }).click();
  await expect(page.locator("input[type='range']").first()).toBeVisible({ timeout: 3000 });

  // Read min/max/value from every slider
  const sliders = await page.locator("input[type='range']").all();
  for (const slider of sliders) {
    const min = parseFloat(await slider.getAttribute("min") ?? "0");
    const max = parseFloat(await slider.getAttribute("max") ?? "100");
    const val = parseFloat(await slider.getAttribute("value") ?? "0");
    const range = max - min;

    console.log(`val=${val.toFixed(2)} min=${min.toFixed(2)} max=${max.toFixed(2)} range=${range.toFixed(2)}`);

    // Range should be tight (< 15pp) — not spanning the full global bounds
    expect(range).toBeLessThan(15);
    // Current value should sit within the range
    expect(val).toBeGreaterThanOrEqual(min - 0.01);
    expect(val).toBeLessThanOrEqual(max + 0.01);
  }

  await page.screenshot({ path: "e2e/slider-ranges.png" });
});
