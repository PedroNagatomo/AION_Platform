import { test, expect } from "@playwright/test";
import { createAndLoginUser } from "./helpers/auth";

test.describe("Navigation", () => {
  test.beforeEach(async ({ page }) => {
    await createAndLoginUser(page);
  });

  test("should navigate to all modules", async ({ page }) => {
    const modules = [
      { name: "AI Chat", path: /chat/ },
      { name: "Notes", path: /notes/ },
      { name: "Files", path: /files/ },
      { name: "Spreadsheets", path: /spreadsheets/ },
      { name: "Charts", path: /charts/ },
      { name: "Calendar", path: /calendar/ },
      { name: "Reminders", path: /reminders/ },
      { name: "Contacts", path: /contacts/ },
      { name: "Workflows", path: /workflows/ },
      { name: "Settings", path: /settings/ },
    ];

    for (const module of modules) {
      await page.click(`button:has-text("${module.name}")`);
      await expect(page).toHaveURL(module.path, { timeout: 10000 });

      // Voltar para dashboard
      await page.goto("/dashboard");
      await page.waitForLoadState("networkidle");
    }
  });

  test("should open global search with Ctrl+K", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    // Garantir que a página está focada
    await page.locator("body").click();
    await page.waitForTimeout(300);

    // Pressionar Ctrl+K
    await page.keyboard.down("Control");
    await page.keyboard.press("KeyK");
    await page.keyboard.up("Control");

    // ✅ Ser ESPECÍFICO: usar o placeholder exato do modal
    const searchInput = page.locator(
      'input[placeholder="Search conversations, notes, files, contacts..."]',
    );

    // Aguardar o modal aparecer
    await expect(searchInput).toBeVisible({ timeout: 10000 });

    // Verificar que está focado (autoFocus)
    await expect(searchInput).toBeFocused();

    // Testar digitação
    await searchInput.fill("test");
    await page.waitForTimeout(1000);

    // Fechar com Escape
    await page.keyboard.press("Escape");
    await page.waitForTimeout(500);

    // Verificar que fechou
    await expect(searchInput).not.toBeVisible({ timeout: 5000 });
  });

  test("should collapse sidebar", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    // Clicar em colapsar
    const collapseBtn = page.locator('button[title="Collapse"]');
    if ((await collapseBtn.count()) > 0) {
      await collapseBtn.click();
      await page.waitForTimeout(500);

      // Expandir novamente
      const expandBtn = page.locator('button[title="Expand"]');
      await expect(expandBtn).toBeVisible({ timeout: 5000 });
      await expandBtn.click();
    }
  });
});
