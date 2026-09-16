import { test, expect } from "@playwright/test";
import { createAndLoginUser } from "./helpers/auth";

test.describe("Notes", () => {
  test.beforeEach(async ({ page }) => {
    await createAndLoginUser(page);
  });

  test("should navigate to notes page", async ({ page }) => {
    await page.click('button:has-text("Notes")');

    await expect(page).toHaveURL(/notes/);
    await expect(page.locator('button:has-text("[+ Note]")')).toBeVisible();
    await expect(page.locator('button:has-text("[+ Folder]")')).toBeVisible();
  });

  test("should create a new note", async ({ page }) => {
    await page.goto("/notes");

    // Clicar em + Note
    await page.click('button:has-text("[+ Note]")');

    // ✅ CORREÇÃO: usar [contenteditable="true"] que é o elemento real do Tiptap
    const editable = page.locator('[contenteditable="true"]').first();
    await expect(editable).toBeVisible({ timeout: 10000 });

    // Aguardar um pouco para o editor estar pronto
    await page.waitForTimeout(1000);

    // Clicar e digitar
    await editable.click();
    await page.keyboard.type("Minha nota de teste E2E", { delay: 30 });

    // Aguardar auto-save
    await page.waitForTimeout(2500);

    // ✅ CORREÇÃO: verificar DENTRO do editor
    await expect(editable).toContainText("Minha nota de teste E2E", {
      timeout: 5000,
    });
  });

  test("should create note from template", async ({ page }) => {
    await page.goto("/notes");

    // Criar nota vazia
    await page.click('button:has-text("[+ Note]")');

    // Aguardar editor
    const editable = page.locator('[contenteditable="true"]').first();
    await expect(editable).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(1000);

    // Abrir templates - usar title que é mais específico
    const templatesButton = page.locator('button[title="Templates"]');
    await expect(templatesButton).toBeVisible({ timeout: 5000 });
    await templatesButton.click();

    // Aguardar modal
    await page.waitForTimeout(500);

    // Escolher template Meeting Notes
    await page.click('button:has-text("Meeting Notes")');

    // Aguardar template ser aplicado
    await page.waitForTimeout(1500);

    // ✅ CORREÇÃO: usar seletor específico para o título (que tem title="Click to rename")
    const titleHeader = page.locator('h1[title="Click to rename"]');
    await expect(titleHeader).toContainText("Meeting Notes", { timeout: 5000 });

    // ✅ CORREÇÃO: verificar conteúdo dentro do editor
    await expect(editable).toContainText("Attendees", { timeout: 5000 });
  });
});
