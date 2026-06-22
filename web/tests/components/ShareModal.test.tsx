import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ShareModal } from '@/components/ShareModal';

const baseProps = {
    isOpen: true,
    onClose: () => {},
    deviceUrl: 'https://inventory.example.com/devices/42',
    deviceName: 'Macintosh SE',
    additionalName: null,
    deviceId: 42,
};

describe('ShareModal storefront link', () => {
    it('shows both admin and storefront links when storefrontUrl is provided', () => {
        render(<ShareModal {...baseProps} storefrontUrl="https://shop.example.com/item/42" />);
        expect(screen.getByText('Admin Link')).toBeTruthy();
        expect(screen.getByText('Storefront Link')).toBeTruthy();
        expect(screen.getByDisplayValue('https://shop.example.com/item/42')).toBeTruthy();
    });

    it('shows only the admin link when storefrontUrl is absent', () => {
        render(<ShareModal {...baseProps} />);
        expect(screen.getByText('Admin Link')).toBeTruthy();
        expect(screen.queryByText('Storefront Link')).toBeNull();
    });
});
