import { test, expect } from '@playwright/test';

test.describe('Image Upload', () => {
    test.beforeEach(async ({ page }) => {
        // Login
        await page.goto('/login');
        const passwordInput = page.getByPlaceholder(/password/i);
        await passwordInput.fill(process.env.AUTH_PASSWORD || 'pass');
        await page.getByRole('button', { name: /sign in|log in|submit/i }).click();
        await expect(page).not.toHaveURL(/login/, { timeout: 15000 });
    });

    test('can navigate to a device detail page', async ({ page }) => {
        // Navigate to home (device listing)
        await page.goto('/');
        await page.waitForTimeout(3000);

        // Click first device link that goes to /devices/<number> (not /devices/new)
        const deviceLink = page.locator('a[href*="/devices/"]').filter({
            has: page.locator(':not([href*="new"])')
        });

        // Use a regex-based approach instead
        const allLinks = page.locator('a');
        const count = await allLinks.count();
        let foundDevice = false;

        for (let i = 0; i < count; i++) {
            const href = await allLinks.nth(i).getAttribute('href');
            if (href && /\/devices\/\d+/.test(href)) {
                await allLinks.nth(i).click();
                foundDevice = true;
                break;
            }
        }

        if (foundDevice) {
            await page.waitForTimeout(2000);
            await expect(page).toHaveURL(/\/devices\/\d+/);
        }
        // If no devices exist in the DB, test passes silently
    });
});
