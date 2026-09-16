import { test, expect } from '@playwright/test';
import { 
  generateTestUser, 
  registerUser, 
  loginUser, 
  logoutUser,
} from './helpers/auth';

test.describe('Authentication Flow', () => {

  test('should register a new user successfully', async ({ page }) => {
    const user = generateTestUser();
    
    await registerUser(page, user);
    
    // Deve estar em uma rota autenticada (não mais em /login ou /register)
    const url = page.url();
    expect(url).toMatch(/\/(dashboard|chat|notes|files|workflows|settings)/);
    expect(url).not.toMatch(/\/(login|register)/);
    
    // Deve mostrar o email do usuário em algum lugar da sidebar
    await expect(page.locator(`text=${user.email}`).first()).toBeVisible({ timeout: 10000 });
  });

  test('should login with registered user', async ({ page }) => {
    const user = generateTestUser();
    
    // Registrar
    await registerUser(page, user);
    
    // Verificar que está autenticado
    const urlAfterRegister = page.url();
    expect(urlAfterRegister).not.toMatch(/\/(login|register)/);
    
    // Logout
    await logoutUser(page);
    
    // Deve estar no login
    await expect(page).toHaveURL(/login/, { timeout: 10000 });
    
    // Login novamente
    await loginUser(page, user);
    
    // Deve estar autenticado
    const urlAfterLogin = page.url();
    expect(urlAfterLogin).not.toMatch(/\/(login|register)/);
  });

  test('should show error with invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[type="email"]', 'inexistente@test.com');
    await page.fill('input[type="password"]', 'senhaerrada');
    await page.click('button[type="submit"]');
    
    // Deve permanecer na página de login
    await page.waitForTimeout(2000);
    await expect(page).toHaveURL(/login/);
  });

  test('should redirect to login when not authenticated', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Deve redirecionar para login
    await expect(page).toHaveURL(/login/, { timeout: 10000 });
  });

  test('should persist session after page reload', async ({ page }) => {
    const user = generateTestUser();
    await registerUser(page, user);
    
    // Capturar URL antes do reload
    const urlBefore = page.url();
    
    // Recarregar
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    
    // Deve continuar autenticado (não deve ir para /login)
    const urlAfter = page.url();
    expect(urlAfter).not.toMatch(/\/(login|register)/);
    
    // Deve ver o email do usuário
    await expect(page.locator(`text=${user.email}`).first()).toBeVisible({ timeout: 10000 });
  });
});