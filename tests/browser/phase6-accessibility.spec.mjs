import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { assertOwnerPage } from "./support.mjs";

const routes = [["Home", "/home"], ["AI", "/assistant"], ["Content", "/content"], ["Opportunity", "/opportunities"], ["Work", "/projects"], ["Revenue", "/revenue"], ["Retrospective", "/projects/retrospective"], ["Team", "/team"], ["Legal", "/legal"], ["Feedback", "/feedback"]];
for (const [name, path] of routes) test(`Phase 6 axe ${name}`, async ({ page }) => {
  await assertOwnerPage(page, path);
  const result = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
  expect(result.violations.filter((issue) => ["critical", "serious"].includes(issue.impact)).map((issue) => ({ id: issue.id, impact: issue.impact, targets: issue.nodes.map((node) => node.target) }))).toEqual([]);
});

async function keyboardActivate(page, name, max = 100) {
  for (let index = 0; index < max; index += 1) {
    await page.keyboard.press("Tab");
    const match = await page.evaluate((expected) => {
      const active = document.activeElement;
      if (!active?.matches("button,a,input,select,textarea,summary")) return false;
      return (active.getAttribute("aria-label") || active.textContent || "").trim() === expected;
    }, name);
    if (match) { await page.keyboard.press("Enter"); return; }
  }
  throw new Error(`keyboard_target_not_found:${name}`);
}

test("Phase 6 keyboard flagship Home AI Opportunity Work Revenue", async ({ page }) => {
  test.setTimeout(120_000);
  await assertOwnerPage(page, "/home");
  await keyboardActivate(page, "AI秘書");
  await expect(page).toHaveURL(/\/assistant$/);
  await page.getByLabel("日本語で相談").focus();
  await page.keyboard.type("CrowdWorks");
  await expect(page.getByRole("button", { name: "整理する" })).toBeEnabled({ timeout: 30_000 });
  await keyboardActivate(page, "整理する", 10);
  await expect(page.getByRole("status")).toBeVisible();
  const action = page.getByRole("status").getByRole("button");
  await action.focus(); await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/opportunities$/);
  const title = `Keyboard案件 ${Date.now()}`;
  await page.getByLabel("案件名").focus(); await page.keyboard.type(title);
  await page.getByLabel("仕事内容").focus(); await page.keyboard.type("keyboard flow");
  const save = page.getByRole("button", { name: "非公開で保存" });
  await expect(save).toBeEnabled({ timeout: 30_000 });
  await save.focus(); await page.keyboard.press("Enter");
  const item = page.getByRole("listitem").filter({ hasText: title });
  await expect(item).toBeVisible();
  for (const state of ["検討中", "応募準備中", "応募済み", "受注"]) {
    const button = item.getByRole("button", { name: state });
    await button.focus(); await page.keyboard.press("Enter"); await expect(item).toContainText(state);
  }
  await keyboardActivate(page, "案件・仕事"); await expect(page).toHaveURL(/\/projects$/);
  await keyboardActivate(page, "収益管理"); await expect(page).toHaveURL(/\/revenue$/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("Phase 6 Team controls and focus remain keyboard reachable", async ({ page }) => {
  await assertOwnerPage(page, "/team");
  await page.getByLabel("メールアドレス").focus();
  await expect(page.getByLabel("メールアドレス")).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "招待メールを送る" })).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(page.getByLabel("メールアドレス")).toBeFocused();
});
