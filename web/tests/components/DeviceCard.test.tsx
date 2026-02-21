import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DeviceCard } from '@/components/DeviceCard';

const mockDevice = {
    id: 1,
    name: 'Macintosh SE',
    additionalName: 'FDHD',
    manufacturer: 'Apple',
    modelNumber: 'M5011',
    releaseYear: 1987,
    status: 'AVAILABLE',
    functionalStatus: 'YES',
    isAssetTagged: false,
    estimatedValue: 300,
    listPrice: null,
    soldPrice: null,
    category: { name: 'Computers', type: 'COMPUTER' },
    images: [],
    isFavorite: true,
    hasOriginalBox: false,
    isPramBatteryRemoved: true,
};

describe('DeviceCard', () => {
    it('renders device name', () => {
        render(<DeviceCard device={mockDevice} />);
        const names = screen.getAllByText('Macintosh SE');
        expect(names.length).toBeGreaterThan(0);
    });

    it('renders category and release year', () => {
        render(<DeviceCard device={mockDevice} />);
        const categoryTexts = screen.getAllByText(/Computers.*1987/);
        expect(categoryTexts.length).toBeGreaterThan(0);
    });

    it('renders status badge', () => {
        render(<DeviceCard device={mockDevice} />);
        const statusBadges = screen.getAllByText('AVAILABLE');
        expect(statusBadges.length).toBeGreaterThan(0);
    });

    it('renders estimated value for available devices', () => {
        render(<DeviceCard device={mockDevice} />);
        const values = screen.getAllByText(/Est\. Value.*\$300/);
        expect(values.length).toBeGreaterThan(0);
    });

    it('links to device detail page', () => {
        render(<DeviceCard device={mockDevice} />);
        const link = screen.getByRole('link');
        expect(link).toHaveAttribute('href', '/devices/1');
    });

    it('shows "No Image" when no images', () => {
        render(<DeviceCard device={mockDevice} />);
        const noImageTexts = screen.getAllByText('No Image');
        expect(noImageTexts.length).toBeGreaterThan(0);
    });

    it('renders sold price for sold devices', () => {
        const soldDevice = { ...mockDevice, status: 'SOLD', soldPrice: 250 };
        render(<DeviceCard device={soldDevice} />);
        const soldTexts = screen.getAllByText(/Sold.*\$250/);
        expect(soldTexts.length).toBeGreaterThan(0);
    });

    it('renders for sale price', () => {
        const forSaleDevice = { ...mockDevice, status: 'FOR_SALE', listPrice: 400 };
        render(<DeviceCard device={forSaleDevice} />);
        const saleTexts = screen.getAllByText(/For Sale.*\$400/);
        expect(saleTexts.length).toBeGreaterThan(0);
    });
});
