import { test, expect } from "@playwright/test";

test("clicking an archetype tile navigates to the workspace", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  page.on("pageerror", (err) => errors.push(err.message));

  await page.goto("/new");

  // Tiles are buttons that contain <p> children (vs the submit arrow button which has only text)
  const tile = page.locator("button[type='button']:has(p)").first();
  await expect(tile).toBeVisible({ timeout: 5000 });

  await tile.click();

  // Give navigation a moment
  await page.waitForTimeout(2000);

  console.log("URL after click:", page.url());
  console.log("Console errors:", errors);

  await expect(page).toHaveURL(/\/formula\/.+/, { timeout: 5000 });
  await expect(page.locator("h1")).toBeVisible({ timeout: 5000 });
});

test("submitting a flavor description navigates to the explain page", async ({ page }) => {
  await page.goto("/new");

  const input = page.locator("input[type='text']");
  await expect(input).toBeVisible();

  await input.click();
  await input.fill("a rich dark chocolate custard");
  await input.press("Enter");

  await expect(page).toHaveURL("/new/explain", { timeout: 5000 });
});
