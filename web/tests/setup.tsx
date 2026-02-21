import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// Mock next/link
vi.mock('next/link', () => ({
    default: ({ children, href, ...props }: any) => {
        return <a href={href} {...props}>{children}</a>;
    },
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: vi.fn(),
        replace: vi.fn(),
        back: vi.fn(),
    }),
    usePathname: () => '/',
    useSearchParams: () => new URLSearchParams(),
}));

// Mock the config module
vi.mock('@/lib/config', () => ({
    API_BASE_URL: 'http://localhost:4000',
}));
