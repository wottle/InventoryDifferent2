import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './e2e',
    fullyParallel: false,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: 1,
    reporter: 'html',
    use: {
        baseURL: 'http://localhost:3000',
        trace: 'on-first-retry',
    },
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],
    webServer: process.env.CI ? undefined : [
        {
            command: 'cd api && npm start',
            url: 'http://localhost:4000/graphql',
            reuseExistingServer: true,
            timeout: 30000,
        },
        {
            command: 'cd web && npm start',
            url: 'http://localhost:3000',
            reuseExistingServer: true,
            timeout: 30000,
        },
        {
            command: 'cd storefront && npm start',
            url: 'http://localhost:3001',
            reuseExistingServer: true,
            timeout: 30000,
        },
    ],
});
