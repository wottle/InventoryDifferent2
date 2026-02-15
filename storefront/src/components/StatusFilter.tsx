"use client";

interface StatusFilterProps {
    selectedStatuses: string[];
    onStatusChange: (statuses: string[]) => void;
}

const STATUS_OPTIONS = [
    { value: 'FOR_SALE', label: 'For Sale', color: 'text-orange-600 dark:text-orange-400' },
    { value: 'PENDING_SALE', label: 'Pending', color: 'text-yellow-600 dark:text-yellow-400' },
    { value: 'SOLD', label: 'Sold', color: 'text-gray-500 dark:text-gray-400' },
];

export function StatusFilter({ selectedStatuses, onStatusChange }: StatusFilterProps) {
    const toggleStatus = (status: string) => {
        if (selectedStatuses.includes(status)) {
            onStatusChange(selectedStatuses.filter(s => s !== status));
        } else {
            onStatusChange([...selectedStatuses, status]);
        }
    };

    const allStatuses = STATUS_OPTIONS.map(o => o.value);
    const allSelected = selectedStatuses.length === allStatuses.length && 
        allStatuses.every(s => selectedStatuses.includes(s));

    return (
        <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-[var(--muted-foreground)]">Show:</span>
            
            <button
                onClick={() => onStatusChange(allStatuses)}
                className={`px-3 py-1.5 text-sm rounded-full transition-all ${
                    allSelected
                        ? 'bg-[var(--apple-blue)] text-white'
                        : 'bg-[var(--muted)] text-[var(--foreground)] hover:bg-[var(--border)]'
                }`}
            >
                All
            </button>

            {STATUS_OPTIONS.map(option => {
                const isSelected = selectedStatuses.includes(option.value);
                return (
                    <button
                        key={option.value}
                        onClick={() => toggleStatus(option.value)}
                        className={`px-3 py-1.5 text-sm rounded-full transition-all ${
                            isSelected
                                ? 'bg-[var(--apple-blue)] text-white'
                                : 'bg-[var(--muted)] text-[var(--foreground)] hover:bg-[var(--border)]'
                        }`}
                    >
                        {option.label}
                    </button>
                );
            })}
        </div>
    );
}
