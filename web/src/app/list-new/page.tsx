"use client";

import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@apollo/client";
import gql from "graphql-tag";
import { NavBar } from "./_components/NavBar";
import { FilterBar } from "./_components/FilterBar";
import { DeviceCardNew } from "./_components/DeviceCardNew";
import { DeviceTableNew } from "./_components/DeviceTableNew";
import { LoadingPanel } from "../../components/LoadingPanel";
import { useAuth } from "../../lib/auth-context";
import { useT } from "../../i18n/context";

const GET_DEVICES = gql`
  query GetDevicesNew($where: DeviceWhereInput) {
    devices(where: $where) {
      id
      name
      additionalName
      manufacturer
      modelNumber
      releaseYear
      searchText
      isFavorite
      status
      functionalStatus
      rarity
      hasOriginalBox
      isAssetTagged
      isWifiEnabled
      isPramBatteryRemoved
      estimatedValue
      listPrice
      soldPrice
      dateAcquired
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
        thumbnailMode
      }
    }
  }
`;

const GET_CATEGORIES = gql`
  query GetCategoriesNew {
    categories {
      id
      name
      type
    }
  }
`;

interface FilterState {
  categoryIds: number[];
  statuses: string[];
}

const DEFAULT_FILTERS: FilterState = { categoryIds: [], statuses: [] };

const STORAGE_FILTERS  = 'list-new-filters';
const STORAGE_SORT_COL = 'list-new-sort-column';
const STORAGE_SORT_DIR = 'list-new-sort-direction';
const STORAGE_VIEW     = 'list-new-view';
const SESSION_SCROLL   = 'list-new-scroll';

function loadFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    try { return JSON.parse(raw) as T; } catch { return raw as unknown as T; }
  } catch {
    return fallback;
  }
}

export default function ListNewPage() {
  const t = useT();
  const { isAuthenticated } = useAuth();

  const [filters, setFiltersState] = useState<FilterState>(() =>
    loadFromStorage(STORAGE_FILTERS, DEFAULT_FILTERS)
  );
  const [sortColumn, setSortColumnState] = useState<string>(() =>
    loadFromStorage(STORAGE_SORT_COL, 'category')
  );
  const [sortDirection, setSortDirectionState] = useState<'asc' | 'desc'>(() =>
    loadFromStorage(STORAGE_SORT_DIR, 'asc')
  );
  const [searchQuery, setSearchQueryState] = useState('');
  const [viewMode, setViewModeState] = useState<'grid' | 'list'>(() =>
    loadFromStorage(STORAGE_VIEW, 'grid') as 'grid' | 'list'
  );

  const setViewMode = (v: 'grid' | 'list') => {
    setViewModeState(v);
    try { localStorage.setItem(STORAGE_VIEW, v); } catch { /* noop */ }
  };

  const setFilters = (f: FilterState) => {
    setFiltersState(f);
    try { localStorage.setItem(STORAGE_FILTERS, JSON.stringify(f)); } catch { /* noop */ }
  };

  const onSortChange = (column: string, direction: 'asc' | 'desc') => {
    setSortColumnState(column);
    setSortDirectionState(direction);
    try {
      localStorage.setItem(STORAGE_SORT_COL, column);
      localStorage.setItem(STORAGE_SORT_DIR, direction);
    } catch { /* noop */ }
  };

  const setSearchQuery = (q: string) => setSearchQueryState(q);

  const { loading, error, data } = useQuery(GET_DEVICES, {
    variables: { where: { deleted: { equals: false } } },
    fetchPolicy: 'cache-and-network',
  });
  const { data: categoriesData } = useQuery(GET_CATEGORIES);


  const categories: { id: number; name: string }[] = useMemo(
    () => categoriesData?.categories ?? [],
    [categoriesData]
  );

  const filteredDevices = useMemo(() => {
    if (!data?.devices) return [];
    let result = data.devices;
    if (filters.statuses.length > 0) result = result.filter((d: any) => filters.statuses.includes(d.status));
    if (filters.categoryIds.length > 0) result = result.filter((d: any) => filters.categoryIds.includes(d.category?.id));
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((d: any) => d.searchText?.includes(q));
    }
    return result;
  }, [data?.devices, filters, searchQuery]);

  const sortedDevices = useMemo(() => {
    return [...filteredDevices].sort((a: any, b: any) => {
      const dir = sortDirection === 'asc' ? 1 : -1;
      const catA = a.category?.sortOrder ?? 999;
      const catB = b.category?.sortOrder ?? 999;
      const yearA = a.releaseYear ?? 0;
      const yearB = b.releaseYear ?? 0;
      const nameA = (a.name || '').toLowerCase();
      const nameB = (b.name || '').toLowerCase();
      const mfgA = `${a.manufacturer || ''} ${a.modelNumber || ''}`.toLowerCase().trim();
      const mfgB = `${b.manufacturer || ''} ${b.modelNumber || ''}`.toLowerCase().trim();

      const secondary = () => {
        if (yearA !== yearB) return yearA - yearB;
        return nameA.localeCompare(nameB);
      };

      switch (sortColumn) {
        case 'name':
          return nameA !== nameB ? dir * nameA.localeCompare(nameB) : yearA - yearB;
        case 'manufacturer':
          return mfgA !== mfgB ? dir * mfgA.localeCompare(mfgB) : secondary();
        case 'releaseYear':
          return yearA !== yearB ? dir * (yearA - yearB) : catA - catB || nameA.localeCompare(nameB);
        case 'dateAcquired': {
          const dA = a.dateAcquired ? new Date(a.dateAcquired).getTime() : 0;
          const dB = b.dateAcquired ? new Date(b.dateAcquired).getTime() : 0;
          return dA !== dB ? dir * (dA - dB) : secondary();
        }
        case 'estimatedValue': {
          const vA = a.estimatedValue ?? 0;
          const vB = b.estimatedValue ?? 0;
          return vA !== vB ? dir * (vA - vB) : secondary();
        }
        case 'status': {
          const sA = a.status ?? '';
          const sB = b.status ?? '';
          return sA !== sB ? dir * sA.localeCompare(sB) : secondary();
        }
        case 'category':
        default:
          return catA !== catB ? dir * (catA - catB) : yearA !== yearB ? yearA - yearB : nameA.localeCompare(nameB);
      }
    });
  }, [filteredDevices, sortColumn, sortDirection]);

  const totalEstValue = useMemo(
    () => filteredDevices.reduce((sum: number, d: any) => sum + (d.estimatedValue ?? 0), 0),
    [filteredDevices]
  );

  // Restore scroll. Two cases need handling:
  // 1. Component remounts (full navigation or cache expired): fires when loading → false.
  // 2. Router-cache restore (back within ~30s, component NOT remounted, effects don't re-run):
  //    popstate fires when the browser goes back, giving us a second chance.
  useEffect(() => {
    const doRestore = () => {
      const saved = sessionStorage.getItem(SESSION_SCROLL);
      if (!saved) return;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          window.scrollTo({ top: Number(saved), behavior: 'instant' });
        });
      });
    };

    if (!loading) doRestore();                      // case 1: data ready
    window.addEventListener('popstate', doRestore); // case 2: back button
    return () => window.removeEventListener('popstate', doRestore);
  }, [loading]);

  // Save scroll only when fully loaded — listener is suspended while loading so the
  // short loading panel's scroll position can't overwrite the real saved position.
  useEffect(() => {
    if (loading) return;
    const onScroll = () => {
      if (window.scrollY > 0) sessionStorage.setItem(SESSION_SCROLL, String(window.scrollY));
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [loading]);

  if (loading) {
    return (
      <>
        <NavBar />
        <div className="min-h-screen bg-surface dark:bg-[#111318] pt-8">
          <div className="max-w-[1440px] mx-auto px-8">
            <LoadingPanel title={t.home.loadingTitle} subtitle={t.home.loadingSubtitle} />
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <NavBar />
        <div className="min-h-screen bg-surface dark:bg-[#111318] pt-8">
          <div className="max-w-[1440px] mx-auto px-8 text-error">Error: {error.message}</div>
        </div>
      </>
    );
  }

  return (
    <div className="min-h-screen bg-surface dark:bg-[#111318] font-inter">
      <NavBar />

      <main className="max-w-[1440px] mx-auto px-8 pt-3 pb-32 md:pb-12">
        <FilterBar
          totalCount={data?.devices?.length ?? 0}
          filteredCount={filteredDevices.length}
          totalEstValue={totalEstValue}
          categories={categories}
          filters={filters}
          setFilters={setFilters}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          onSortChange={onSortChange}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          viewMode={viewMode}
          setViewMode={setViewMode}
        />

        {sortedDevices.length === 0 ? (
          <div className="text-center py-24 text-on-surface-variant dark:text-[#c1c6d7]">
            <span className="material-symbols-outlined text-[48px] mb-4 block">search_off</span>
            <p className="text-sm font-medium">{t.home.noDevices}</p>
          </div>
        ) : viewMode === 'list' ? (
          <DeviceTableNew
            devices={sortedDevices}
            sortColumn={sortColumn}
            sortDirection={sortDirection}
            onSortChange={onSortChange}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 [@media(min-width:1920px)]:grid-cols-6 gap-8">
            {sortedDevices.map((device: any) => (
              <DeviceCardNew key={device.id} device={device} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
