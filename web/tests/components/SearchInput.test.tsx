import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SearchInput } from '@/components/SearchInput';

describe('SearchInput', () => {
    it('renders with placeholder', () => {
        render(<SearchInput value="" onChange={vi.fn()} placeholder="Search devices..." />);
        expect(screen.getByPlaceholderText('Search devices...')).toBeInTheDocument();
    });

    it('renders with default placeholder', () => {
        render(<SearchInput value="" onChange={vi.fn()} />);
        expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
    });

    it('calls onChange when typing', () => {
        const onChange = vi.fn();
        render(<SearchInput value="" onChange={onChange} />);
        const input = screen.getByPlaceholderText('Search...');
        fireEvent.change(input, { target: { value: 'mac' } });
        expect(onChange).toHaveBeenCalledWith('mac');
    });

    it('clears input when clear button is clicked', () => {
        const onChange = vi.fn();
        render(<SearchInput value="test" onChange={onChange} />);
        const clearButton = screen.getByRole('button');
        fireEvent.click(clearButton);
        expect(onChange).toHaveBeenCalledWith('');
    });

    it('displays the current value', () => {
        render(<SearchInput value="hello" onChange={vi.fn()} />);
        const input = screen.getByPlaceholderText('Search...') as HTMLInputElement;
        expect(input.value).toBe('hello');
    });
});
