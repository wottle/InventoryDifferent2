"use client";

import { useEffect, useState } from "react";
import { useT } from "../i18n/context";

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
  const t = useT();
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
    { value: 'category', label: t.sort.category },
    { value: 'name', label: t.sort.name },
    { value: 'manufacturer', label: t.sort.manufacturer },
    { value: 'releaseYear', label: t.sort.releaseYear },
    { value: 'dateAcquired', label: t.sort.dateAcquired },
    { value: 'estimatedValue', label: t.sort.estimatedValue },
    { value: 'location', label: t.sort.location },
    { value: 'available', label: t.sort.available },
    { value: 'status', label: t.sort.status },
    { value: 'condition', label: t.sort.condition },
    { value: 'rarity', label: t.sort.rarity },
  ];

  const statusOptions = [
    { value: "COLLECTION", label: t.status.COLLECTION },
    { value: "FOR_SALE", label: t.status.FOR_SALE },
    { value: "PENDING_SALE", label: t.status.PENDING_SALE },
    { value: "IN_REPAIR", label: t.status.IN_REPAIR },
    { value: "SOLD", label: t.status.SOLD },
    { value: "DONATED", label: t.status.DONATED },
    { value: "RETURNED", label: t.status.RETURNED },
  ];

  const functionalStatusOptions = [
    { value: "YES", label: t.functionalStatus.YES },
    { value: "PARTIAL", label: t.functionalStatus.PARTIAL },
    { value: "NO", label: t.functionalStatus.NO },
  ];

  const conditionOptions = [
    { value: "NEW", label: t.condition.NEW },
    { value: "LIKE_NEW", label: t.condition.LIKE_NEW },
    { value: "VERY_GOOD", label: t.condition.VERY_GOOD },
    { value: "GOOD", label: t.condition.GOOD },
    { value: "ACCEPTABLE", label: t.condition.ACCEPTABLE },
    { value: "FOR_PARTS", label: t.condition.FOR_PARTS },
  ];

  const rarityOptions = [
    { value: "COMMON", label: t.rarity.COMMON },
    { value: "UNCOMMON", label: t.rarity.UNCOMMON },
    { value: "RARE", label: t.rarity.RARE },
    { value: "VERY_RARE", label: t.rarity.VERY_RARE },
    { value: "EXTREMELY_RARE", label: t.rarity.EXTREMELY_RARE },
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
            <h2 className="text-lg font-semibold text-[var(--foreground)]">{t.filter.title}</h2>
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
            <h3 className="text-sm font-medium text-[var(--foreground)] mb-3">{t.filter.status}</h3>
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
            <h3 className="text-sm font-medium text-[var(--foreground)] mb-3">{t.filter.category}</h3>
            <select
              value={localFilters.categoryIds[0] || ''}
              onChange={(e) => handleCategoryChange(parseInt(e.target.value) || 0)}
              className="select-flat w-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--ring)] text-[var(--foreground)]"
            >
              <option value="">{t.filter.allCategories}</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Functional Status */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-[var(--foreground)] mb-3">{t.filter.functionalStatus}</h3>
            <select
              value={localFilters.functionalStatuses[0] || ''}
              onChange={(e) => handleFunctionalStatusChange(e.target.value)}
              className="select-flat w-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--ring)] text-[var(--foreground)]"
            >
              <option value="">{t.filter.allFunctionalStatuses}</option>
              {functionalStatusOptions.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>

          {/* Condition */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-[var(--foreground)] mb-3">{t.filter.condition}</h3>
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
            <h3 className="text-sm font-medium text-[var(--foreground)] mb-3">{t.filter.rarity}</h3>
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
            <h3 className="text-sm font-medium text-[var(--foreground)] mb-3">{t.filter.sortBy}</h3>
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
              {t.filter.ascending}
            </button>
            <button
              onClick={() => setLocalSortDirection('desc')}
              className={`flex-1 py-1.5 text-sm rounded border transition-colors ${localSortDirection === 'desc' ? 'bg-[var(--apple-blue)] text-white border-[#007acc]' : 'btn-retro text-[var(--foreground)]'}`}
            >
              {t.filter.descending}
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border)]">
            <button
              onClick={handleClear}
              className="btn-retro px-4 py-2 text-sm font-medium text-[var(--foreground)]"
            >
              {t.filter.clearAll}
            </button>
            <button
              onClick={handleApply}
              className="px-4 py-2 text-sm font-medium text-white bg-[var(--apple-blue)] hover:brightness-110 rounded border border-[#007acc]"
            >
              {t.filter.applyFilters}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
