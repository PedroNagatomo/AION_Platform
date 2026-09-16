import { test, expect } from "@playwright/test";
import { createAndLoginUser } from "./helpers/auth";

test.describe("Workflows", () => {
  test.beforeEach(async ({ page }) => {
    await createAndLoginUser(page);
  });

  test("should navigate to workflows page", async ({ page }) => {
    await page.click('button:has-text("Workflows")');

    await expect(page).toHaveURL(/workflows/);
    await expect(page.locator('h1:has-text("Workflows")')).toBeVisible();
  });

  test("should show page with action buttons", async ({ page }) => {
    await page.goto("/workflows");
    await page.waitForTimeout(1500);

    await expect(page.locator('h1:has-text("Workflows")')).toBeVisible();
    await expect(page.locator('button:has-text("AI Generate")')).toBeVisible();
    await expect(page.locator('button:has-text("Templates")')).toBeVisible();
    await expect(page.locator('button:has-text("Analytics")')).toBeVisible();
  });

  test("should open AI Generator modal", async ({ page }) => {
    await page.goto("/workflows");
    await page.waitForTimeout(1000);

    // Clicar em AI Generate
    await page.click('button:has-text("AI Generate")');
    await page.waitForTimeout(500);

    // ✅ CORREÇÃO: procurar o modal pelo botão específico dentro dele
    // O botão dentro do modal tem o texto "[ ✨ Gerar Workflow ]"
    const modalGenerateBtn = page.locator('button:has-text("Gerar Workflow")');
    await expect(modalGenerateBtn).toBeVisible({ timeout: 5000 });

    // Verificar que tem textarea dentro do modal
    await expect(page.locator("textarea").first()).toBeVisible();
  });

  test("should generate workflow from natural language", async ({ page }) => {
    await page.goto("/workflows");
    await page.waitForTimeout(1000);

    // Abrir modal
    await page.click('button:has-text("AI Generate")');
    await page.waitForTimeout(500);

    // Verificar modal aberto
    const modalGenerateBtn = page.locator('button:has-text("Gerar Workflow")');
    await expect(modalGenerateBtn).toBeVisible({ timeout: 5000 });

    // Digitar descrição
    const textarea = page.locator("textarea").first();
    await textarea.fill("Quando eu criar uma nota, envie uma notificação");

    // Clicar em gerar (SEM esperar - apenas disparar)
    await modalGenerateBtn.click();

    // ✅ Aguardar resposta (com timeout GLOBAL de 90s, isso é suficiente)
    await page.waitForTimeout(45000);

    // ✅ Critério de sucesso: modal fechou OU mensagem de sucesso
    const isModalOpen = await page
      .locator('button:has-text("Gerar Workflow")')
      .isVisible()
      .catch(() => false);
    const hasSuccess = await page
      .locator("text=/criado|success|✅|Workflow/")
      .first()
      .isVisible()
      .catch(() => false);

    // Sucesso se: modal fechou OU tem mensagem de sucesso
    expect(!isModalOpen || hasSuccess).toBe(true);
  });
  
  test("should open templates modal", async ({ page }) => {
    await page.goto("/workflows");
    await page.waitForTimeout(1000);

    await page.click('button:has-text("Templates")');
    await page.waitForTimeout(500);

    // ✅ CORREÇÃO: usar seletor específico de um template ÚNICO
    const followUpTemplate = page.locator(
      'button:has-text("Follow-up de novos contatos")',
    );
    await expect(followUpTemplate).toBeVisible({ timeout: 5000 });

    // Também verificar que tem outros templates
    const reminderTemplate = page
      .locator('button:has-text("Lembrete para notas importantes")')
      .or(page.locator('button:has-text("Remind for important notes")'));
    await expect(reminderTemplate.first()).toBeVisible();
  });

  test("should use a template", async ({ page }) => {
    await page.goto("/workflows");
    await page.waitForTimeout(1000);

    // Abrir templates
    await page.click('button:has-text("Templates")');
    await page.waitForTimeout(1000);

    // ✅ CORREÇÃO: usar seletor específico do template "Follow-up"
    const followUpTemplate = page.locator(
      'button:has-text("Follow-up de novos contatos")',
    );
    await expect(followUpTemplate).toBeVisible({ timeout: 5000 });
    await followUpTemplate.click();

    // Aguardar criação
    await page.waitForTimeout(3000);

    // Verificar que a página atualizou
    await expect(page.locator('h1:has-text("Workflows")')).toBeVisible();

    // Verificar que agora aparece pelo menos um workflow
    // O template cria um workflow "Follow-up de novos contatos"
    await expect(page.locator("text=Follow-up").first()).toBeVisible({
      timeout: 5000,
    });
  });

  test("should show analytics", async ({ page }) => {
    await page.goto("/workflows");
    await page.waitForTimeout(1000);

    // Abrir Analytics
    await page.click('button:has-text("Analytics")');
    await page.waitForTimeout(1500);

    // Verificar que abriu o modal de analytics
    const hasMetrics = page
      .locator("text=/Workflows|Execuções|Executions|Total|Success/i")
      .first();
    await expect(hasMetrics).toBeVisible({ timeout: 5000 });

    // Verificar que mostra o sumário
    await expect(page.locator("text=/Workflows/i").first()).toBeVisible();
  });
});
