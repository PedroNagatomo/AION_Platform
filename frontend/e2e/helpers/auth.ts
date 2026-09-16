import { Page, expect } from '@playwright/test';

export interface TestUser {
  email: string;
  password: string;
}

export function generateTestUser(): TestUser {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return {
    email: `e2e-${timestamp}-${random}@test.com`,
    password: 'Test123456!',
  };
}

/**
 * Aguarda o app entrar em qualquer rota autenticada
 */
async function waitForAuthenticatedRoute(page: Page): Promise<void> {
  await page.waitForURL(
    /\/(dashboard|chat|notes|files|workflows|settings)/, 
    { timeout: 60000, waitUntil: 'domcontentloaded' }
  );
  // Aguardar estabilizar
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(1000);
}

export async function registerUser(page: Page, user: TestUser): Promise<void> {
  await page.goto('/register');
  await page.waitForLoadState('networkidle');
  
  await page.fill('input[type="email"]', user.email);
  
  const passwordInputs = page.locator('input[type="password"]');
  const count = await passwordInputs.count();
  
  await passwordInputs.nth(0).fill(user.password);
  if (count >= 2) {
    await passwordInputs.nth(1).fill(user.password);
  }
  
  await page.click('button[type="submit"]');
  
  // Aguardar QUALQUER rota autenticada (não só dashboard)
  await waitForAuthenticatedRoute(page);
}

export async function loginUser(page: Page, user: TestUser): Promise<void> {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  
  await page.fill('input[type="email"]', user.email);
  await page.fill('input[type="password"]', user.password);
  await page.click('button[type="submit"]');
  
  await waitForAuthenticatedRoute(page);
}

export async function logoutUser(page: Page): Promise<void> {
  // Procurar botão de logout (pode estar em qualquer lugar)
  const logoutBtn = page.locator('button:has-text("Logout")').first();
  await logoutBtn.click({ timeout: 10000 });
  await page.waitForURL(/login/, { timeout: 15000 });
}

export async function createAndLoginUser(page: Page): Promise<TestUser> {
  const user = generateTestUser();
  await registerUser(page, user);
  return user;
}

/**
 * Navega para uma rota específica garantindo que está logado
 */
export async function navigateTo(page: Page, path: string): Promise<void> {
  await page.goto(path);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);
}