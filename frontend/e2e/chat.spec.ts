import { test, expect } from '@playwright/test';
import { createAndLoginUser } from './helpers/auth';

test.describe('AI Chat', () => {

  test.beforeEach(async ({ page }) => {
    await createAndLoginUser(page);
  });

  test('should navigate to chat page', async ({ page }) => {
    await page.click('button:has-text("AI Chat")');
    
    await expect(page).toHaveURL(/chat/);
    await expect(page.locator('text=AI Chat').first()).toBeVisible();
  });

  test('should create a new conversation', async ({ page }) => {
    await page.goto('/chat');
    
    // Criar nova conversa
    await page.click('button:has-text("[ + New Chat ]")');
    
    // Aguardar input de mensagem
    await expect(page.locator('textarea').first()).toBeVisible({ timeout: 10000 });
    
    // Verificar que a conversa aparece na sidebar
    await expect(page.locator('text=<conversations>')).toBeVisible();
  });

  test('should send a message and receive AI response', async ({ page }) => {
    await page.goto('/chat');
    await page.click('button:has-text("[ + New Chat ]")');
    
    // Aguardar input
    const textarea = page.locator('textarea').first();
    await expect(textarea).toBeVisible({ timeout: 10000 });
    
    // Digitar mensagem
    await textarea.fill('Say "hi" in exactly one word');
    
    // Enviar
    await page.click('button:has-text("[ Send ]")');
    
    // Aguardar resposta da IA (pode demorar)
    await expect(page.locator('text=❯ ai@assistant')).toBeVisible({ timeout: 45000 });
  });

  test('should show edit button on user message', async ({ page }) => {
    await page.goto('/chat');
    await page.click('button:has-text("[ + New Chat ]")');
    
    const textarea = page.locator('textarea').first();
    await expect(textarea).toBeVisible({ timeout: 10000 });
    
    await textarea.fill('Test message');
    await page.click('button:has-text("[ Send ]")');
    
    // Aguardar mensagem aparecer
    await expect(page.locator('text=Test message')).toBeVisible({ timeout: 10000 });
    
    // Verificar botão de editar
    await expect(page.locator('button:has-text("[editar]")').or(page.locator('button:has-text("[edit]")')).first()).toBeVisible();
  });
});