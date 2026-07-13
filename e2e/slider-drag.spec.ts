import { test, expect } from "@playwright/test";

// Regression guard for the #55 drag architecture (uncontrolled inputs, drag
// lock in a ref, worker-solved preview, solve committed on release): a drag
// must move the value while the pointer is down, land near the pointer's
// target on release, and STAY there — the historical failure modes were
// snap-back (drag lock lost mid-gesture) and post-release reverts (stale
// closures syncing pre-solve ratios back into the input).
test("macro slider drag moves, lands, and holds", async ({ page }) => {
  await page.goto("/new");
  await page.locator("button[type='button']:has(p)").first().click();
  await expect(page).toHaveURL(/\/formula\/.+/, { timeout: 5000 });

  const slider = page.locator("input[type='range']").first();
  await expect(slider).toBeVisible({ timeout: 3000 });
  await slider.scrollIntoViewIfNeeded();
  const before = parseFloat(await slider.inputValue());

  const box = (await slider.boundingBox())!;
  const y = box.y + box.height / 2;
  await page.mouse.move(box.x + box.width * 0.3, y);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.8, y, { steps: 25 });
  await page.waitForTimeout(120);
  const during = parseFloat(await slider.inputValue());
  await page.mouse.up();
  await page.waitForTimeout(400); // release solve committed, sliders synced
  const after = parseFloat(await slider.inputValue());
  await page.waitForTimeout(600); // a late revert would show here
  const settled = parseFloat(await slider.inputValue());

  expect(Math.abs(during - before)).toBeGreaterThan(50); // 0–1000 scale
  expect(Math.abs(after - during)).toBeLessThan(60); // solved ≈ pointer target
  expect(settled).toBeCloseTo(after, 0); // no post-release snap-back
});

// The worker-solved live preview: sibling sliders and the cup must track the
// solve DURING the drag (direct DOM, no React commit), not only after release.
test("siblings and cup update mid-drag", async ({ page }) => {
  await page.goto("/new");
  await page.locator("button[type='button']:has(p)").first().click();
  await expect(page).toHaveURL(/\/formula\/.+/, { timeout: 5000 });

  const slider = page.locator("input[type='range']").first();
  await expect(slider).toBeVisible({ timeout: 3000 });
  await slider.scrollIntoViewIfNeeded();
  const grab = () =>
    page.evaluate(() => ({
      siblings: [...document.querySelectorAll("input[type='range']")]
        .slice(1, 3)
        .map((el) => (el as HTMLInputElement).value),
      cup: document.querySelector("svg polygon")?.getAttribute("points"),
    }));
  const before = await grab();

  const box = (await slider.boundingBox())!;
  const y = box.y + box.height / 2;
  await page.mouse.move(box.x + box.width * 0.3, y);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.85, y, { steps: 30 });
  await page.waitForTimeout(250); // pointer still down — preview has painted
  const during = await grab();
  await page.mouse.up();

  expect(during.siblings).not.toEqual(before.siblings);
  expect(during.cup).not.toEqual(before.cup);
});
