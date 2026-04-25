import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DeviceTableNew } from '@/app/list-new/_components/DeviceTableNew';

const mockDevice = {
  id: 1,
  name: 'Macintosh SE',
  additionalName: null,
  manufacturer: 'Apple',
  modelNumber: 'M5011',
  releaseYear: 1987,
  status: 'COLLECTION',
  functionalStatus: 'YES',
  rarity: null,
  hasOriginalBox: false,
  isAssetTagged: false,
  isPramBatteryRemoved: false,
  estimatedValue: 300,
  listPrice: null,
  soldPrice: null,
  dateAcquired: '2024-01-15T00:00:00.000Z',
  category: { name: 'Computers', type: 'COMPUTER' },
  location: { id: 5, name: 'Shelf A' },
  images: [],
  isFavorite: false,
};

describe('DeviceTableNew', () => {
  const defaultProps = {
    devices: [mockDevice],
    sortColumn: 'name',
    sortDirection: 'asc' as const,
    onSortChange: vi.fn(),
  };

  it('renders device name', () => {
    render(<DeviceTableNew {...defaultProps} />);
    expect(screen.getByText('Macintosh SE')).toBeInTheDocument();
  });

  it('renders category in its own cell', () => {
    render(<DeviceTableNew {...defaultProps} />);
    expect(screen.getByText('Computers')).toBeInTheDocument();
  });

  it('renders release year', () => {
    render(<DeviceTableNew {...defaultProps} />);
    expect(screen.getByText('1987')).toBeInTheDocument();
  });

  it('renders make and model as combined string', () => {
    render(<DeviceTableNew {...defaultProps} />);
    expect(screen.getByText('Apple M5011')).toBeInTheDocument();
  });

  it('renders date acquired in short format', () => {
    render(<DeviceTableNew {...defaultProps} />);
    expect(screen.getByText('Jan 2024')).toBeInTheDocument();
  });

  it('renders location as a navigable link', () => {
    render(<DeviceTableNew {...defaultProps} />);
    const link = screen.getByRole('link', { name: 'Shelf A' });
    expect(link).toHaveAttribute('href', '/locations/5');
  });

  it('renders em-dash when location is absent', () => {
    const noLoc = { ...mockDevice, location: null };
    render(<DeviceTableNew {...defaultProps} devices={[noLoc]} />);
    expect(screen.queryByRole('link', { name: /shelf/i })).not.toBeInTheDocument();
  });

  it('renders em-dash when date acquired is null', () => {
    const noDate = { ...mockDevice, dateAcquired: null };
    render(<DeviceTableNew {...defaultProps} devices={[noDate]} />);
    expect(screen.getByText('Macintosh SE')).toBeInTheDocument();
  });
});
