import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DeviceFilterPanel } from '@/components/DeviceFilterPanel';

const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    filters: {
        categoryIds: [],
        statuses: [],
        functionalStatuses: [],
        conditions: [],
        rarities: [],
        searchTerm: '',
    },
    onFiltersChange: vi.fn(),
    categories: [
        { id: 1, name: 'Computers', type: 'COMPUTER' },
        { id: 2, name: 'Peripherals', type: 'PERIPHERAL' },
    ],
    sortColumn: 'category' as const,
    sortDirection: 'asc' as const,
    onSortChange: vi.fn(),
};

describe('DeviceFilterPanel', () => {
    it('renders when open', () => {
        render(<DeviceFilterPanel {...defaultProps} />);
        expect(screen.getByText('Filter Devices')).toBeInTheDocument();
    });

    it('does not render when closed', () => {
        render(<DeviceFilterPanel {...defaultProps} isOpen={false} />);
        expect(screen.queryByText('Filter Devices')).not.toBeInTheDocument();
    });

    it('displays status checkboxes', () => {
        render(<DeviceFilterPanel {...defaultProps} />);
        expect(screen.getByText('In Collection')).toBeInTheDocument();
        expect(screen.getByText('For Sale')).toBeInTheDocument();
        expect(screen.getByText('Sold')).toBeInTheDocument();
    });

    it('displays category options', () => {
        render(<DeviceFilterPanel {...defaultProps} />);
        expect(screen.getByText('Computers')).toBeInTheDocument();
        expect(screen.getByText('Peripherals')).toBeInTheDocument();
    });

    it('calls onFiltersChange and onClose when Apply is clicked', () => {
        const onFiltersChange = vi.fn();
        const onClose = vi.fn();
        const onSortChange = vi.fn();
        render(
            <DeviceFilterPanel
                {...defaultProps}
                onFiltersChange={onFiltersChange}
                onClose={onClose}
                onSortChange={onSortChange}
            />
        );

        fireEvent.click(screen.getByText('Apply Filters'));
        expect(onFiltersChange).toHaveBeenCalled();
        expect(onSortChange).toHaveBeenCalled();
        expect(onClose).toHaveBeenCalled();
    });

    it('clears filters when Clear All is clicked', () => {
        const onFiltersChange = vi.fn();
        const onClose = vi.fn();
        render(
            <DeviceFilterPanel
                {...defaultProps}
                onFiltersChange={onFiltersChange}
                onClose={onClose}
            />
        );

        fireEvent.click(screen.getByText('Clear All'));
        expect(onFiltersChange).toHaveBeenCalledWith({
            categoryIds: [],
            statuses: [],
            functionalStatuses: [],
            conditions: [],
            rarities: [],
            searchTerm: '',
        });
        expect(onClose).toHaveBeenCalled();
    });
});
