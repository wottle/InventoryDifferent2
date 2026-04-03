"use client";

import { useEffect, useState } from "react";

export interface FilterState {
  categoryIds: number[];
  statuses: string[];
  functionalStatuses: string[];
  conditions: string[];
  rarities: string[];
  searchTerm: string;
}

export type SortColumn = 'category' | 'name' | 'manufacturer' | 'releaseYear' | 'dateAcquired' | 'estimatedValue' | 'location' | 'available' | 'status' | 'condition' | 'rarity';

interface DeviceFilterPanelProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  categories: Array<{ id: number; name: string; type: string }>;
  sortColumn: SortColumn;
  sortDirection: 'asc' | 'desc';
  onSortChange: (column: SortColumn, direction: 'asc' | 'desc') => void;
}

export function DeviceFilterPanel({
  isOpen,
  onClose,
  filters,
  onFiltersChange,
  categories,
  sortColumn,
  sortDirection,
  onSortChange,
}: DeviceFilterPanelProps) {
  const [localFilters, setLocalFilters] = useState<FilterState>(filters);
  const [localSortColumn, setLocalSortColumn] = useState<SortColumn>(sortColumn);
  const [localSortDirection, setLocalSortDirection] = useState<'asc' | 'desc'>(sortDirection);

  useEffect(() => {
    if (!isOpen) return;
    setLocalFilters(filters);
    setLocalSortColumn(sortColumn);
    setLocalSortDirection(sortDirection);
  }, [filters, sortColumn, sortDirection, isOpen]);

  const sortOptions = [
    { value: 'category', label: 'Category' },
    { value: 'name', label: 'Name' },
    { value: 'manufacturer', label: 'Manufacturer & Model' },
    { value: 'releaseYear', label: 'Release Year' },
    { value: 'dateAcquired', label: 'Date Acquired' },
    { value: 'estimatedValue', label: 'Estimated Value' },
    { value: 'location', label: 'Location' },
    { value: 'available', label: 'Availability' },
    { value: 'status', label: 'Functional Status' },
    { value: 'condition', label: 'Condition' },
    { value: 'rarity', label: 'Rarity' },
  ];

  const statusOptions = [
    { value: "COLLECTION", label: "In Collection" },
    { value: "FOR_SALE", label: "For Sale" },
    { value: "PENDING_SALE", label: "Pending Sale" },
    { value: "IN_REPAIR", label: "In Repair" },
    { value: "SOLD", label: "Sold" },
    { value: "DONATED", label: "Donated" },
    { value: "RETURNED", label: "Returned" },
  ];

  const functionalStatusOptions = [
    { value: "YES", label: "Fully Functional" },
    { value: "PARTIAL", label: "Partially Functional" },
    { value: "NO", label: "Not Functional" },
  ];

  const conditionOptions = [
    { value: "NEW", label: "New" },
    { value: "LIKE_NEW", label: "Like New" },
    { value: "VERY_GOOD", label: "Very Good" },
    { value: "GOOD", label: "Good" },
    { value: "ACCEPTABLE", label: "Acceptable" },
    { value: "FOR_PARTS", label: "For Parts" },
  ];

  const rarityOptions = [
    { value: "COMMON", label: "Common" },
    { value: "UNCOMMON", label: "Uncommon" },
    { value: "RARE", label: "Rare" },
    { value: "VERY_RARE", label: "Very Rare" },
    { value: "EXTREMELY_RARE", label: "Extremely Rare" },
  ];

  const handleCategoryChange = (categoryId: number) => {
    const newCategoryIds = categoryId ? [categoryId] : [];
    setLocalFilters({ ...localFilters, categoryIds: newCategoryIds });
  };

  const handleStatusChange = (status: string, checked: boolean) => {
    const newStatuses = checked
      ? [...localFilters.statuses, status]
      : localFilters.statuses.filter((s) => s !== status);
    setLocalFilters({ ...localFilters, statuses: newStatuses });
  };

  const handleFunctionalStatusChange = (functionalStatus: string) => {
    const newFunctionalStatuses = functionalStatus ? [functionalStatus] : [];
    setLocalFilters({ ...localFilters, functionalStatuses: newFunctionalStatuses });
  };

  const handleConditionChange = (condition: string, checked: boolean) => {
    const newConditions = checked
      ? [...localFilters.conditions, condition]
      : localFilters.conditions.filter((c) => c !== condition);
    setLocalFilters({ ...localFilters, conditions: newConditions });
  };

  const handleRarityChange = (rarity: string, checked: boolean) => {
    const newRarities = checked
      ? [...localFilters.rarities, rarity]
      : localFilters.rarities.filter((r) => r !== rarity);
    setLocalFilters({ ...localFilters, rarities: newRarities });
  };

  const handleApply = () => {
    onFiltersChange(localFilters);
    onSortChange(localSortColumn, localSortDirection);
    onClose();
  };

  const handleClear = () => {
    const clearedFilters = {
      categoryIds: [],
      statuses: [],
      functionalStatuses: [],
      conditions: [],
      rarities: [],
      searchTerm: '',
    };
    setLocalFilters(clearedFilters);
    onFiltersChange(clearedFilters);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center pt-16 z-50">
      <div className="bg-[var(--card)] rounded shadow-xl max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto card-retro">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-[var(--foreground)]">Filter Devices</h2>
            <button
              onClick={onClose}
              className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            >
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Status */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-[var(--foreground)] mb-3">Status</h3>
            <div className="space-y-2">
              {statusOptions.map((status) => (
                <label key={status.value} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={localFilters.statuses.includes(status.value)}
                    onChange={(e) => handleStatusChange(status.value, e.target.checked)}
                    className="rounded border-[var(--border)] text-[var(--apple-blue)] focus:ring-[var(--ring)] bg-[var(--input)]"
                  />
                  <span className="ml-2 text-sm text-[var(--foreground)]">
                    {status.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Categories */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-[var(--foreground)] mb-3">Category</h3>
            <select
              value={localFilters.categoryIds[0] || ''}
              onChange={(e) => handleCategoryChange(parseInt(e.target.value) || 0)}
              className="select-flat w-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--ring)] text-[var(--foreground)]"
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Functional Status */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-[var(--foreground)] mb-3">Functional Status</h3>
            <select
              value={localFilters.functionalStatuses[0] || ''}
              onChange={(e) => handleFunctionalStatusChange(e.target.value)}
              className="select-flat w-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--ring)] text-[var(--foreground)]"
            >
              <option value="">All Functional Statuses</option>
              {functionalStatusOptions.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>

          {/* Condition */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-[var(--foreground)] mb-3">Condition</h3>
            <div className="space-y-2">
              {conditionOptions.map((condition) => (
                <label key={condition.value} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={localFilters.conditions.includes(condition.value)}
                    onChange={(e) => handleConditionChange(condition.value, e.target.checked)}
                    className="rounded border-[var(--border)] text-[var(--apple-blue)] focus:ring-[var(--ring)] bg-[var(--input)]"
                  />
                  <span className="ml-2 text-sm text-[var(--foreground)]">
                    {condition.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Rarity */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-[var(--foreground)] mb-3">Rarity</h3>
            <div className="space-y-2">
              {rarityOptions.map((rarity) => (
                <label key={rarity.value} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={localFilters.rarities.includes(rarity.value)}
                    onChange={(e) => handleRarityChange(rarity.value, e.target.checked)}
                    className="rounded border-[var(--border)] text-[var(--apple-blue)] focus:ring-[var(--ring)] bg-[var(--input)]"
                  />
                  <span className="ml-2 text-sm text-[var(--foreground)]">
                    {rarity.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Sort By */}
          <div className="mb-4">
            <h3 className="text-sm font-medium text-[var(--foreground)] mb-3">Sort By</h3>
            <select
              value={localSortColumn}
              onChange={(e) => setLocalSortColumn(e.target.value as SortColumn)}
              className="select-flat w-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--ring)] text-[var(--foreground)]"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Order */}
          <div className="mb-6 flex gap-2">
            <button
              onClick={() => setLocalSortDirection('asc')}
              className={`flex-1 py-1.5 text-sm rounded border transition-colors ${localSortDirection === 'asc' ? 'bg-[var(--apple-blue)] text-white border-[#007acc]' : 'btn-retro text-[var(--foreground)]'}`}
            >
              ↑ Ascending
            </button>
            <button
              onClick={() => setLocalSortDirection('desc')}
              className={`flex-1 py-1.5 text-sm rounded border transition-colors ${localSortDirection === 'desc' ? 'bg-[var(--apple-blue)] text-white border-[#007acc]' : 'btn-retro text-[var(--foreground)]'}`}
            >
              ↓ Descending
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border)]">
            <button
              onClick={handleClear}
              className="btn-retro px-4 py-2 text-sm font-medium text-[var(--foreground)]"
            >
              Clear All
            </button>
            <button
              onClick={handleApply}
              className="px-4 py-2 text-sm font-medium text-white bg-[var(--apple-blue)] hover:brightness-110 rounded border border-[#007acc]"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
