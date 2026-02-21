import { test, expect } from '@playwright/test';

test.describe('Login Flow', () => {
    test('navigates to login page, enters password, and redirects to home', async ({ page }) => {
        await page.goto('/login');
        await expect(page).toHaveURL(/login/);

        // Fill in credentials
        const passwordInput = page.getByPlaceholder(/password/i);
        await passwordInput.fill(process.env.AUTH_PASSWORD || 'pass');

        // Submit
        const loginButton = page.getByRole('button', { name: /sign in|log in|submit/i });
        await loginButton.click();

        // Should redirect away from login page to home (device listing is at /)
        await expect(page).not.toHaveURL(/login/, { timeout: 15000 });
    });

    test('session persists on reload after login', async ({ page }) => {
        // Login first
        await page.goto('/login');
        const passwordInput = page.getByPlaceholder(/password/i);
        await passwordInput.fill(process.env.AUTH_PASSWORD || 'pass');
        const loginButton = page.getByRole('button', { name: /sign in|log in|submit/i });
        await loginButton.click();
        await expect(page).not.toHaveURL(/login/, { timeout: 15000 });

        // Reload and verify still not on login page
        await page.reload();
        await expect(page).not.toHaveURL(/login/, { timeout: 5000 });
    });
});
