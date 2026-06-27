import { APP_VERSION } from './lib/releaseNotes';

export async function register() {
    const buildVersion = process.env.BUILD_VERSION || 'dev';
    console.log(`[version] APP_VERSION=${APP_VERSION} BUILD_VERSION=${buildVersion}`);
}
