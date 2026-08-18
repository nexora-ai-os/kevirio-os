import { test, expect } from "@playwright/test";

test("validate fresh local Owner session created by global setup", async ({ page }) => {
  await page.goto("/home");
  await expect(page.locator("body")).not.toContainText("Ownerログイン");
  await expect(page.locator("nav[aria-label]").first()).toBeVisible({ timeout: 30_000 });
  const current = await page.evaluate(() => {
    const keys = Object.keys(localStorage).filter((key) => key.startsWith("sb-") && key.endsWith("-auth-token"));
    if (keys.length !== 1) return null;
    const session = JSON.parse(localStorage.getItem(keys[0]));
    return { hasAccess: Boolean(session?.access_token), hasRefresh: Boolean(session?.refresh_token), email: session?.user?.email };
  });
  expect(current).toEqual({ hasAccess: true, hasRefresh: true, email: "playwright-owner@local.test" });
});
