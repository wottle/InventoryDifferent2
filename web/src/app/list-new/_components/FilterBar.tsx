'use client';

import { useState, useRef, useEffect } from "react";
import { useAuth } from "../../../lib/auth-context";
import { useT } from "../../../i18n/context";

type SortOption = {
  column: string;
  direction: 'asc' | 'desc';
  label: string;
};

interface FilterState {
  categoryIds: number[];
  statuses: string[];
}

interface FilterBarProps {
  totalCount: number;
  filteredCount: number;
  totalEstValue: number;
  categories: { id: number; name: string }[];
  filters: FilterState;
  setFilters: (f: FilterState) => void;
  sortColumn: string;
  sortDirection: 'asc' | 'desc';
  onSortChange: (column: string, direction: 'asc' | 'desc') => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  viewMode: 'grid' | 'list' | 'fisheye';
  setViewMode: (v: 'grid' | 'list' | 'fisheye') => void;
  barcodeSupported?: boolean;
  onScanClick?: () => void;
}

const ALL_STATUSES = ['COLLECTION', 'IN_REPAIR', 'REPAIRED', 'FOR_SALE', 'PENDING_SALE', 'RETURNED', 'SOLD', 'DONATED'];

export function FilterBar({
  totalCount,
  filteredCount,
  totalEstValue,
  categories,
  filters,
  setFilters,
  sortColumn,
  sortDirection,
  onSortChange,
  searchQuery,
  setSearchQuery,
  viewMode,
  setViewMode,
  barcodeSupported,
  onScanClick,
}: FilterBarProps) {
  const t = useT();
  const { isAuthenticated } = useAuth();
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  const sortRef = useRef<HTMLDivElement>(null);

  const sortOptions: SortOption[] = [
    { column: 'category',       direction: 'asc',  label: t.sort.category },
    { column: 'name',           direction: 'asc',  label: `${t.sort.name} A–Z` },
    { column: 'releaseYear',    direction: 'desc', label: `${t.sort.releaseYear} (${t.filter.descending})` },
    { column: 'releaseYear',    direction: 'asc',  label: `${t.sort.releaseYear} (${t.filter.ascending})` },
    { column: 'estimatedValue', direction: 'desc', label: `${t.sort.estimatedValue} (${t.filter.descending})` },
    { column: 'status',         direction: 'asc',  label: t.filter.status },
  ];

  const currentSortLabel = sortOptions.find(
    o => o.column === sortColumn && o.direction === sortDirection
  )?.label ?? t.sort.category;

  const SORT_ABBREV: Record<string, string> = {
    category:       'Category',
    name:           'Name',
    releaseYear:    'Year',
    estimatedValue: 'Value',
    status:         'Status',
  };

  const hasActiveFilters = filters.categoryIds.length > 0 || filters.statuses.length > 0;

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) setFilterOpen(false);
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) setSortOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggleStatus = (status: string) => {
    const next = filters.statuses.includes(status)
      ? filters.statuses.filter(s => s !== status)
      : [...filters.statuses, status];
    setFilters({ ...filters, statuses: next });
  };

  const toggleCategory = (id: number) => {
    const next = filters.categoryIds.includes(id)
      ? filters.categoryIds.filter(c => c !== id)
      : [...filters.categoryIds, id];
    setFilters({ ...filters, categoryIds: next });
  };

  const clearFilters = () => setFilters({ categoryIds: [], statuses: [] });

  return (
    <section className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
      {/* Left: count + value */}
      <div>
        <p className="text-sm font-medium text-on-surface-variant dark:text-[#c1c6d7]">
          {t.home.showing} {filteredCount} {t.home.devices}
          {isAuthenticated && totalEstValue > 0 && (
            <span> ({t.home.estValue} {t.common.currencySymbol}{totalEstValue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })})</span>
          )}
        </p>
      </div>

      {/* Right: controls */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="flex items-center bg-surface-container-low dark:bg-[#1e2129] rounded-full px-4 py-2 gap-2">
          <span className="material-symbols-outlined text-on-surface-variant dark:text-[#c1c6d7]" style={{ fontSize: '18px' }}>search</span>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={t.home.search}
            className="bg-transparent text-sm text-on-surface dark:text-[#e2e2e7] placeholder:text-on-surface-variant dark:placeholder:text-[#c1c6d7]/60 outline-none w-40 md:w-52"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-on-surface-variant hover:text-on-surface">
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>close</span>
            </button>
          )}
        </div>

        {/* Barcode / QR scanner */}
        {onScanClick && (
          <button
            onClick={onScanClick}
            disabled={!barcodeSupported}
            title="Scan QR / barcode"
            className={`flex items-center justify-center w-9 h-9 rounded-full bg-surface-container-low dark:bg-[#1e2129] transition-colors ${barcodeSupported ? 'hover:bg-surface-container dark:hover:bg-[#282d36] text-on-surface-variant dark:text-[#c1c6d7] hover:text-on-surface dark:hover:text-[#e2e2e7]' : 'opacity-40 cursor-not-allowed text-on-surface-variant dark:text-[#c1c6d7]'}`}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>qr_code_scanner</span>
          </button>
        )}

        {/* View toggle */}
        <div className="flex items-center bg-surface-container-high dark:bg-[#1e2129] rounded-xl p-1 gap-0.5">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-surface-container-lowest dark:bg-[#282d36] text-on-surface dark:text-[#e2e2e7] shadow-sm' : 'text-on-surface-variant dark:text-[#c1c6d7] hover:text-on-surface dark:hover:text-[#e2e2e7]'}`}
            title="Grid view"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>grid_view</span>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-surface-container-lowest dark:bg-[#282d36] text-on-surface dark:text-[#e2e2e7] shadow-sm' : 'text-on-surface-variant dark:text-[#c1c6d7] hover:text-on-surface dark:hover:text-[#e2e2e7]'}`}
            title="List view"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>view_list</span>
          </button>
          <button
            onClick={() => setViewMode('fisheye')}
            className={`p-1.5 rounded-lg transition-all ${viewMode === 'fisheye' ? 'bg-surface-container-lowest dark:bg-[#282d36] text-on-surface dark:text-[#e2e2e7] shadow-sm' : 'text-on-surface-variant dark:text-[#c1c6d7] hover:text-on-surface dark:hover:text-[#e2e2e7]'}`}
            title="Fisheye view"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>bubble_chart</span>
          </button>
        </div>

        <div className="h-8 w-px bg-outline-variant/30" />

        {/* Filter button */}
        <div ref={filterRef} className="relative">
          <button
            onClick={() => { setFilterOpen(o => !o); setSortOpen(false); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              hasActiveFilters
                ? 'bg-primary text-on-primary dark:bg-[#adc6ff] dark:text-[#111318]'
                : 'bg-surface-container-high dark:bg-[#1e2129] text-on-surface dark:text-[#e2e2e7] hover:bg-surface-container-highest dark:hover:bg-[#282d36]'
            }`}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>filter_list</span>
            {t.filter.title}
            {hasActiveFilters && (
              <span className="ml-1 bg-white/30 dark:bg-black/30 rounded-full w-4 h-4 flex items-center justify-center text-[10px]">
                {filters.categoryIds.length + filters.statuses.length}
              </span>
            )}
          </button>

          {filterOpen && (
            <div className="absolute right-0 top-full mt-2 z-50 bg-surface-container-lowest dark:bg-[#1e2129] rounded-xl shadow-[0_8px_32px_-4px_rgba(0,0,0,0.12)] p-4 w-72 border border-outline-variant/10">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-on-surface dark:text-[#e2e2e7] uppercase tracking-widest">{t.filter.status}</span>
                {hasActiveFilters && (
                  <button onClick={clearFilters} className="text-xs text-primary dark:text-[#adc6ff] font-medium hover:underline">
                    {t.filter.clearAll}
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-1.5 mb-4">
                {ALL_STATUSES.map(status => (
                  <label key={status} className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={filters.statuses.includes(status)}
                      onChange={() => toggleStatus(status)}
                      className="w-3.5 h-3.5 accent-primary rounded"
                    />
                    <span className="text-xs text-on-surface-variant dark:text-[#c1c6d7] group-hover:text-on-surface dark:group-hover:text-[#e2e2e7] transition-colors">
                      {(t.status as Record<string, string>)[status] ?? status}
                    </span>
                  </label>
                ))}
              </div>

              {categories.length > 0 && (
                <>
                  <div className="text-xs font-bold text-on-surface dark:text-[#e2e2e7] uppercase tracking-widest mb-3">{t.filter.category}</div>
                  <div className="grid grid-cols-2 gap-1.5 max-h-40 overflow-y-auto">
                    {categories.map(cat => (
                      <label key={cat.id} className="flex items-center gap-2 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={filters.categoryIds.includes(cat.id)}
                          onChange={() => toggleCategory(cat.id)}
                          className="w-3.5 h-3.5 accent-primary rounded"
                        />
                        <span className="text-xs text-on-surface-variant dark:text-[#c1c6d7] group-hover:text-on-surface dark:group-hover:text-[#e2e2e7] transition-colors truncate">
                          {cat.name}
                        </span>
                      </label>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Sort button */}
        <div ref={sortRef} className="relative">
          <button
            onClick={() => { setSortOpen(o => !o); setFilterOpen(false); }}
            className="w-36 flex items-center justify-between gap-2 bg-surface-container-high dark:bg-[#1e2129] px-3 py-2 rounded-xl text-xs font-bold text-on-surface dark:text-[#e2e2e7] hover:bg-surface-container-highest dark:hover:bg-[#282d36] transition-all"
          >
            <span className="material-symbols-outlined text-on-surface-variant dark:text-[#c1c6d7]" style={{ fontSize: '16px' }}>sort</span>
            <span className="flex-1 text-left">{SORT_ABBREV[sortColumn] ?? 'Sort'}</span>
            <span className="material-symbols-outlined text-on-surface-variant dark:text-[#c1c6d7]" style={{ fontSize: '14px' }}>
              {sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward'}
            </span>
          </button>

          {sortOpen && (
            <div className="absolute right-0 top-full mt-2 z-50 bg-surface-container-lowest dark:bg-[#1e2129] rounded-xl shadow-[0_8px_32px_-4px_rgba(0,0,0,0.12)] p-2 w-56 border border-outline-variant/10">
              {sortOptions.map((opt, i) => {
                const isSelected = opt.column === sortColumn && opt.direction === sortDirection;
                return (
                  <button
                    key={i}
                    onClick={() => { onSortChange(opt.column, opt.direction); setSortOpen(false); }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors ${
                      isSelected
                        ? 'bg-primary/10 dark:bg-[#adc6ff]/10 text-primary dark:text-[#adc6ff] font-bold'
                        : 'text-on-surface-variant dark:text-[#c1c6d7] hover:bg-surface-container hover:text-on-surface dark:hover:bg-[#282d36] dark:hover:text-[#e2e2e7]'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
