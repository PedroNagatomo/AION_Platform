import { test, expect } from '@playwright/test';
import { createAndLoginUser } from './helpers/auth';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ✅ CORREÇÃO: simular __dirname em ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.describe('Files', () => {

  test.beforeEach(async ({ page }) => {
    await createAndLoginUser(page);
  });

  test('should navigate to files page', async ({ page }) => {
    await page.click('button:has-text("Files")');
    
    await expect(page).toHaveURL(/files/);
    await expect(page.locator('text=❯ Files')).toBeVisible();
  });

  test('should upload a file', async ({ page }) => {
    await page.goto('/files');
    
    // Criar arquivo temporário
    const testFilePath = path.join(__dirname, 'test-file.txt');
    fs.writeFileSync(testFilePath, 'Conteúdo do arquivo de teste');
    
    try {
      // Fazer upload
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles(testFilePath);
      
      // Aguardar upload
      await page.waitForTimeout(3000);
      
      // Verificar que o arquivo aparece
      await expect(page.locator('text=test-file.txt').first()).toBeVisible({ timeout: 10000 });
    } finally {
      // Limpar
      if (fs.existsSync(testFilePath)) {
        fs.unlinkSync(testFilePath);
      }
    }
  });

  test('should show folders section', async ({ page }) => {
    await page.goto('/files');
    
    await expect(page.locator('text=folders').first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=All Files').first()).toBeVisible();
  });
});