"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useQuery } from "@apollo/client";
import gql from "graphql-tag";
import { ProductCard } from "./ProductCard";
import { StatusFilter } from "./StatusFilter";
import { LoadingPanel } from "./LoadingPanel";

const GET_SHOP_DEVICES = gql`
  query GetShopDevices($where: DeviceWhereInput) {
    devices(where: $where) {
      id
      name
      additionalName
      manufacturer
      modelNumber
      releaseYear
      status
      functionalStatus
      listPrice
      soldPrice
      popularity
      category {
        id
        name
        type
        sortOrder
      }
      images {
        id
        path
        thumbnailPath
        isThumbnail
        isShopImage
        isListingImage
      }
    }
  }
`;

const STORAGE_KEY = 'shop-status-filter';
const DEFAULT_STATUSES = ['FOR_SALE', 'PENDING_SALE'];

type SortOption = 'popular' | 'category' | 'status' | 'price-high' | 'price-low' | 'name' | 'year';

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'popular', label: 'Popular' },
  { value: 'category', label: 'Category' },
  { value: 'status', label: 'Status' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'name', label: 'Name' },
  { value: 'year', label: 'Year' },
];

interface ShopHomeProps {
  contactEmail: string;
}

export default function ShopHome({ contactEmail }: ShopHomeProps) {
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(DEFAULT_STATUSES);
  const [isInitialized, setIsInitialized] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('category');

  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const trackEvent = useCallback((event: string, data: Record<string, string | number>) => {
    if (typeof window !== 'undefined' && (window as any).umami) {
      (window as any).umami.track(event, data);
    }
  }, []);

  // Load saved filter from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setSelectedStatuses(parsed);
        }
      }
    } catch (e) {
      // Ignore localStorage errors
    }
    setIsInitialized(true);
  }, []);

  // Save filter to localStorage when it changes
  useEffect(() => {
    if (isInitialized) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedStatuses));
      } catch (e) {
        // Ignore localStorage errors
      }
    }
  }, [selectedStatuses, isInitialized]);

  // Track search queries (debounced to avoid firing on every keystroke)
  useEffect(() => {
    if (!isInitialized || !searchQuery.trim()) return;
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      trackEvent('shop-search', { query: searchQuery.trim() });
    }, 1000);
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, [searchQuery, isInitialized, trackEvent]);

  // Track status filter changes
  useEffect(() => {
    if (!isInitialized) return;
    trackEvent('shop-filter', { statuses: selectedStatuses.join(',') });
  }, [selectedStatuses, isInitialized, trackEvent]);

  // Track sort changes
  useEffect(() => {
    if (!isInitialized) return;
    trackEvent('shop-sort', { sortBy });
  }, [sortBy, isInitialized, trackEvent]);

  // Build where clause - filter by selected statuses
  const buildWhereClause = () => {
    const shopStatuses = selectedStatuses.length > 0
      ? selectedStatuses
      : DEFAULT_STATUSES;

    return {
      deleted: { equals: false },
      status: { in: shopStatuses },
    };
  };

  const { loading, error, data } = useQuery(GET_SHOP_DEVICES, {
    variables: { where: buildWhereClause() },
    fetchPolicy: "cache-and-network",
  });

  // Filter and sort devices
  const filteredAndSortedDevices = useMemo(() => {
    if (!data?.devices) return [];

    // Filter by search query
    let filtered = data.devices;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = data.devices.filter((device: any) => {
        const searchableText = [
          device.name,
          device.additionalName,
          device.manufacturer,
          device.modelNumber,
          device.category?.name,
        ].filter(Boolean).join(' ').toLowerCase();
        return searchableText.includes(query);
      });
    }

    // Sort with secondary sorting by category, release year, and name
    const functionalStatusOrder: Record<string, number> = {
      'WORKING': 0,
      'POWERS_ON': 1,
      'FOR_PARTS': 2,
      'UNKNOWN': 3,
    };

    // Helper function for secondary/tertiary sorting
    const applySecondarySorting = (a: any, b: any) => {
      // Secondary: release year (ascending)
      const yearA = a.releaseYear || 0;
      const yearB = b.releaseYear || 0;
      if (yearA !== yearB) return yearA - yearB;

      // Tertiary: name (ascending)
      const nameA = (a.name || '').toLowerCase();
      const nameB = (b.name || '').toLowerCase();
      return nameA.localeCompare(nameB);
    };

    return [...filtered].sort((a: any, b: any) => {
      let primaryResult = 0;

      switch (sortBy) {
        case 'popular': {
          const popA = a.popularity ?? 0;
          const popB = b.popularity ?? 0;
          primaryResult = popB - popA;
          break;
        }
        case 'category': {
          const catOrderA = a.category?.sortOrder ?? 999;
          const catOrderB = b.category?.sortOrder ?? 999;
          if (catOrderA !== catOrderB) {
            primaryResult = catOrderA - catOrderB;
          } else {
            const catNameA = (a.category?.name || '').toLowerCase();
            const catNameB = (b.category?.name || '').toLowerCase();
            primaryResult = catNameA.localeCompare(catNameB);
          }
          break;
        }
        case 'status': {
          const statusA = functionalStatusOrder[a.functionalStatus] ?? 99;
          const statusB = functionalStatusOrder[b.functionalStatus] ?? 99;
          primaryResult = statusA - statusB;
          break;
        }
        case 'price-high': {
          const priceA = a.listPrice || a.soldPrice || 0;
          const priceB = b.listPrice || b.soldPrice || 0;
          primaryResult = priceB - priceA;
          break;
        }
        case 'price-low': {
          const priceA = a.listPrice || a.soldPrice || 0;
          const priceB = b.listPrice || b.soldPrice || 0;
          primaryResult = priceA - priceB;
          break;
        }
        case 'name': {
          const nameA = (a.name || '').toLowerCase();
          const nameB = (b.name || '').toLowerCase();
          primaryResult = nameA.localeCompare(nameB);
          break;
        }
        case 'year': {
          const yearA = a.releaseYear || 0;
          const yearB = b.releaseYear || 0;
          primaryResult = yearB - yearA;
          break;
        }
        default:
          primaryResult = 0;
      }

      // If primary sort is equal, apply secondary sorting
      if (primaryResult !== 0) return primaryResult;
      return applySecondarySorting(a, b);
    });
  }, [data?.devices, searchQuery, sortBy]);

  // For backward compatibility
  const sortedDevices = filteredAndSortedDevices;

  // Count by status
  const statusCounts = useMemo(() => {
    if (!data?.devices) return { forSale: 0, pending: 0, sold: 0 };
    return data.devices.reduce((acc: any, device: any) => {
      if (device.status === 'FOR_SALE') acc.forSale++;
      else if (device.status === 'PENDING_SALE') acc.pending++;
      else if (device.status === 'SOLD') acc.sold++;
      return acc;
    }, { forSale: 0, pending: 0, sold: 0 });
  }, [data?.devices]);

  return (
    <div className="min-h-screen font-sans">
      {/* Header */}
      <header className="bg-[var(--card)] border-b border-[var(--border)] sticky top-0 z-50">
        <div className="rainbow-stripe"></div>
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="Shop" width={36} height={36} />
              <div>
                <h1 className="text-xl sm:text-2xl font-light tracking-tight">
                  <span style={{ color: '#5EBD3E' }}>Inv</span>
                  <span style={{ color: '#FFB900' }}>ent</span>
                  <span style={{ color: '#F78200' }}>ory</span>
                  <span style={{ color: '#E23838' }}>Dif</span>
                  <span style={{ color: '#973999' }}>fer</span>
                  <span style={{ color: '#009CDF' }}>ent</span>
                  <span className="text-[var(--muted-foreground)] ml-2 font-normal">Shop</span>
                </h1>
                <p className="text-xs text-[var(--muted-foreground)]">
                  Vintage Apple devices for sale
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <a
                href="/looking-for"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-full border border-[var(--apple-blue)] text-[var(--apple-blue)] hover:bg-[var(--apple-blue)] hover:text-white transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Looking For
              </a>
              <StatusFilter
                selectedStatuses={selectedStatuses}
                onStatusChange={setSelectedStatuses}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Looking For Banner */}
      <div className="bg-[var(--apple-blue)] text-white text-sm">
        <div className="container mx-auto px-4 py-2 flex items-center justify-center gap-2">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Have some vintage devices you're looking to part with?</span>
          <a href="/looking-for" className="font-semibold underline underline-offset-2 hover:no-underline">
            See our wishlist →
          </a>
        </div>
      </div>

      {/* Search and Sort Bar */}
      <div className="bg-[var(--card)] border-b border-[var(--border)]">
        <div className="container mx-auto px-4 py-3">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search by name, manufacturer, model..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm bg-[var(--background)] border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--apple-blue)] focus:border-transparent"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-[var(--muted-foreground)]">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="px-3 py-2 text-sm bg-[var(--background)] border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--apple-blue)] focus:border-transparent"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {loading && !data ? (
          <LoadingPanel title="Loading items..." subtitle="Finding treasures" />
        ) : error ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center rounded-full bg-red-100 mb-4" style={{ width: 48, height: 48 }}>
              <svg width="24" height="24" className="text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="text-[var(--foreground)] font-medium">Unable to load items</p>
            <p className="text-sm text-[var(--muted-foreground)] mt-1">{error.message}</p>
          </div>
        ) : sortedDevices.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center rounded-full bg-[var(--muted)] mb-4" style={{ width: 48, height: 48 }}>
              <svg width="24" height="24" className="text-[var(--muted-foreground)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <p className="text-[var(--foreground)] font-medium">No items available</p>
            <p className="text-sm text-[var(--muted-foreground)] mt-1">Check back soon for new listings!</p>
          </div>
        ) : (
          <>
            {/* Stats Bar */}
            <div className="mb-6 flex flex-wrap items-center gap-4 text-sm">
              <span className="text-[var(--muted-foreground)]">
                Showing <span className="font-semibold text-[var(--foreground)]">{sortedDevices.length}</span> items
              </span>
              <div className="flex gap-3">
                {statusCounts.forSale > 0 && (
                  <span className="text-orange-600 dark:text-orange-400">
                    {statusCounts.forSale} for sale
                  </span>
                )}
                {statusCounts.pending > 0 && (
                  <span className="text-yellow-600 dark:text-yellow-400">
                    {statusCounts.pending} pending
                  </span>
                )}
                {statusCounts.sold > 0 && (
                  <span className="text-gray-500 dark:text-gray-400">
                    {statusCounts.sold} sold
                  </span>
                )}
              </div>
            </div>

            {/* Product Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {sortedDevices.map((device: any) => (
                <ProductCard key={device.id} device={device} />
              ))}
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-[var(--card)] border-t border-[var(--border)] mt-12">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-[var(--muted-foreground)]">
          <p>Vintage Apple Collection</p>
          <p className="mt-1 text-xs">
            Contact us at{" "}
            <a
              href={`mailto:${contactEmail}`}
              className="text-[var(--apple-blue)] hover:underline"
            >
              {contactEmail}
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
