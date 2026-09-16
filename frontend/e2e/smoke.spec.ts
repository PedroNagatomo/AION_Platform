import { test, expect } from '@playwright/test';

test.describe('Smoke Test', () => {
  test('should load the login page', async ({ page }) => {
    await page.goto('/login');
    
    // Aguardar a página carregar completamente
    await page.waitForLoadState('networkidle');
    
    // Verificar que os elementos essenciais existem (sem depender do texto exato)
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    
    // Verificar que existe um link para registro
    await expect(page.locator('a[href="/register"]')).toBeVisible();
  });

  test('should navigate to register page', async ({ page }) => {
    await page.goto('/login');
    await page.click('a[href="/register"]');
    
    await expect(page).toHaveURL(/register/);
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });
});