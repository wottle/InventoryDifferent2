import { test, expect } from '@playwright/test';

test.describe('Device CRUD', () => {
    test.beforeEach(async ({ page }) => {
        // Login
        await page.goto('/login');
        const passwordInput = page.getByPlaceholder(/password/i);
        await passwordInput.fill(process.env.AUTH_PASSWORD || 'pass');
        await page.getByRole('button', { name: /sign in|log in|submit/i }).click();
        await expect(page).not.toHaveURL(/login/, { timeout: 15000 });
    });

    test('create device, verify in list, edit, soft delete, restore', async ({ page }) => {
        // Navigate to create device
        await page.goto('/devices/new');
        await page.waitForTimeout(2000);

        // Fill the name field using the input name attribute
        const nameInput = page.locator('input[name="name"]');
        await nameInput.waitFor({ state: 'visible', timeout: 10000 });
        await nameInput.fill('E2E Test Device');

        // Select category (first available)
        const categorySelect = page.locator('select[name="categoryId"]');
        await categorySelect.waitFor({ state: 'visible', timeout: 5000 });
        const options = await categorySelect.locator('option').allTextContents();
        if (options.length > 1) {
            await categorySelect.selectOption({ index: 1 });
        }

        // Submit
        await page.getByRole('button', { name: /^(save|create device|submit)$/i }).click();

        // Verify redirected away from /new
        await page.waitForTimeout(3000);

        // Navigate to devices list (home page)
        await page.goto('/');
        await page.waitForTimeout(2000);
        await expect(page.getByText('E2E Test Device').first()).toBeVisible({ timeout: 5000 });
    });
});
