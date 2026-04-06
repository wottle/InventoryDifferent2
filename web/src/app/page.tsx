"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useQuery, useLazyQuery } from "@apollo/client";
import gql from "graphql-tag";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DeviceCard } from "../components/DeviceCard";
import { DeviceTable } from "../components/DeviceTable";
import { DeviceFilterPanel, FilterState, SortColumn } from "../components/DeviceFilterPanel";
import { SearchInput } from "../components/SearchInput";
import { BarcodeScannerModal } from "../components/BarcodeScannerModal";
import { LoadingPanel } from "../components/LoadingPanel";
import { useAuth } from "../lib/auth-context";
import { useT } from "../i18n/context";

const GET_DEVICES = gql`
  query GetDevices($where: DeviceWhereInput) {
    devices(where: $where) {
      id
      name
      additionalName
      manufacturer
      modelNumber
      serialNumber
      releaseYear
      location {
        id
        name
      }
      info
      searchText
      isFavorite
      externalUrl
      status
      functionalStatus
      condition
      rarity
      hasOriginalBox
      isAssetTagged
      dateAcquired
      whereAcquired
      priceAcquired
      estimatedValue
      listPrice
      soldPrice
      soldDate
      cpu
      ram
      graphics
      storage
      isWifiEnabled
      isPramBatteryRemoved
      lastPowerOnDate
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
        caption
        dateTaken
        isThumbnail
        thumbnailMode
        isShopImage
      }
      notes {
        id
        content
        date
      }
      maintenanceTasks {
        id
        label
        dateCompleted
        notes
      }
      tags {
        id
        name
      }
      accessories {
        id
        name
      }
    }
  }
`;

const GET_CATEGORIES = gql`
  query GetCategories {
    categories {
      id
      name
      type
    }
  }
`;

const GET_LOCATIONS_HOME = gql`
  query GetLocationsHome {
    locations {
      id
      name
    }
  }
`;

const GET_DEVICE_BY_SERIAL = gql`
  query GetDeviceBySerial($where: DeviceWhereInput!) {
    device(where: $where) {
      id
    }
  }
`;

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, authRequired, logout } = useAuth();
  const t = useT();
  const [viewMode, setViewModeState] = useState<'card' | 'table'>('card');
  const [sortColumn, setSortColumnState] = useState<SortColumn>('category');
  const [sortDirection, setSortDirectionState] = useState<'asc' | 'desc'>('asc');
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [assetScanOpen, setAssetScanOpen] = useState(false);
  const [assetScanMessage, setAssetScanMessage] = useState<string>("");
  const [barcodeSupported, setBarcodeSupported] = useState(false);
  const assetScanFormats = useMemo(() => ["qr_code", "code_128", "code_39", "ean_13", "ean_8", "upc_a", "upc_e", "itf"], []);
  const [getDeviceBySerial] = useLazyQuery(GET_DEVICE_BY_SERIAL);
  const defaultFilters: FilterState = {
    categoryIds: [],
    locationIds: [],
    statuses: [],
    functionalStatuses: [],
    conditions: [],
    rarities: [],
    searchTerm: '',
  };

  const [filters, setFilters] = useState<FilterState>(() => {
    if (typeof window === 'undefined') return defaultFilters;
    try {
      const raw = localStorage.getItem('inventory-filters');
      if (!raw) return defaultFilters;
      const parsed: any = JSON.parse(raw);
      return {
        categoryIds: Array.isArray(parsed?.categoryIds)
          ? parsed.categoryIds.map((n: any) => Number(n)).filter((n: number) => Number.isFinite(n))
          : [],
        locationIds: Array.isArray(parsed?.locationIds)
          ? parsed.locationIds.map((n: any) => Number(n)).filter((n: number) => Number.isFinite(n))
          : [],
        statuses: Array.isArray(parsed?.statuses)
          ? parsed.statuses.map((s: any) => String(s))
          : [],
        functionalStatuses: Array.isArray(parsed?.functionalStatuses)
          ? parsed.functionalStatuses.map((s: any) => String(s))
          : [],
        conditions: Array.isArray(parsed?.conditions)
          ? parsed.conditions.map((s: any) => String(s))
          : [],
        rarities: Array.isArray(parsed?.rarities)
          ? parsed.rarities.map((s: any) => String(s))
          : [],
        searchTerm: typeof parsed?.searchTerm === 'string' ? parsed.searchTerm : '',
      };
    } catch {
      return defaultFilters;
    }
  });

  const handleSearchChange = useCallback((value: string) => {
    setFilters(prev => ({ ...prev, searchTerm: value }));
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('inventory-filters', JSON.stringify(filters));
    } catch {
      // ignore
    }
  }, [filters]);

  const buildWhereClause = (filters: FilterState) => {
    const where: any = {
      deleted: { equals: false },
    };

    if (filters.categoryIds.length > 0) {
      where.category = {
        id: { in: filters.categoryIds },
      };
    }

    if (filters.statuses.length > 0) {
      where.status = { in: filters.statuses };
    }

    if (filters.functionalStatuses.length > 0) {
      where.functionalStatus = { in: filters.functionalStatuses };
    }

    if (filters.conditions.length > 0) {
      where.condition = { in: filters.conditions };
    }

    if (filters.rarities.length > 0) {
      where.rarity = { in: filters.rarities };
    }

    if (filters.locationIds.length > 0) {
      where.location = { id: { in: filters.locationIds } };
    }

    return where;
  };

  const { loading, error, data } = useQuery(GET_DEVICES, {
    variables: { where: buildWhereClause(filters) },
    fetchPolicy: "cache-and-network",
  });

  const { data: categoriesData } = useQuery(GET_CATEGORIES);
  const { data: locationsHomeData } = useQuery(GET_LOCATIONS_HOME);

  // Client-side search filtering
  const filteredDevices = useMemo(() => {
    if (!data?.devices) return [];
    
    if (!filters.searchTerm.trim()) return data.devices;
    const searchTerm = filters.searchTerm.toLowerCase().trim();
    return data.devices.filter((device: any) => device.searchText?.includes(searchTerm));
  }, [data?.devices, filters.searchTerm]);

  // Sorted devices for card view only (table view has its own sorting)
  const sortedDevicesForCards = useMemo(() => {
    return [...filteredDevices].sort((a: any, b: any) => {
      const catA = a.category?.sortOrder ?? 999;
      const catB = b.category?.sortOrder ?? 999;
      const yearA = a.releaseYear ?? 0;
      const yearB = b.releaseYear ?? 0;
      const nameA = (a.name || '').toLowerCase();
      const nameB = (b.name || '').toLowerCase();
      const dateA = a.dateAcquired ? new Date(a.dateAcquired).getTime() : 0;
      const dateB = b.dateAcquired ? new Date(b.dateAcquired).getTime() : 0;
      const valA = a.estimatedValue ?? 0;
      const valB = b.estimatedValue ?? 0;
      const locA = (a.location?.name || '').toLowerCase();
      const locB = (b.location?.name || '').toLowerCase();
      const availA = a.status || '';
      const availB = b.status || '';
      const statusA = a.functionalStatus || '';
      const statusB = b.functionalStatus || '';
      const mfgA = `${a.manufacturer || ''} ${a.modelNumber || ''}`.toLowerCase().trim();
      const mfgB = `${b.manufacturer || ''} ${b.modelNumber || ''}`.toLowerCase().trim();

      // Secondary/tertiary sort helper
      const secondarySort = () => {
        if (yearA !== yearB) return yearA - yearB;
        return nameA.localeCompare(nameB);
      };

      // Apply direction multiplier
      const dir = sortDirection === 'asc' ? 1 : -1;
      
      switch (sortColumn) {
        case 'name':
          if (nameA !== nameB) return dir * nameA.localeCompare(nameB);
          if (yearA !== yearB) return yearA - yearB;
          return catA - catB;
        case 'manufacturer':
          if (mfgA !== mfgB) return dir * mfgA.localeCompare(mfgB);
          return secondarySort();
        case 'releaseYear':
          if (yearA !== yearB) return dir * (yearA - yearB);
          if (catA !== catB) return catA - catB;
          return nameA.localeCompare(nameB);
        case 'dateAcquired':
          if (dateA !== dateB) return dir * (dateA - dateB);
          return secondarySort();
        case 'estimatedValue':
          if (valA !== valB) return dir * (valA - valB);
          return secondarySort();
        case 'location':
          if (locA !== locB) return dir * locA.localeCompare(locB);
          return secondarySort();
        case 'available':
          if (availA !== availB) return dir * availA.localeCompare(availB);
          return secondarySort();
        case 'status':
          if (statusA !== statusB) return dir * statusA.localeCompare(statusB);
          return secondarySort();
        case 'condition': {
          const conditionOrder = ['NEW', 'LIKE_NEW', 'VERY_GOOD', 'GOOD', 'ACCEPTABLE', 'FOR_PARTS'];
          const aIdx = conditionOrder.indexOf(a.condition || '');
          const bIdx = conditionOrder.indexOf(b.condition || '');
          const diff = (aIdx === -1 ? 999 : aIdx) - (bIdx === -1 ? 999 : bIdx);
          if (diff !== 0) return dir * diff;
          return secondarySort();
        }
        case 'rarity': {
          const rarityOrder = ['EXTREMELY_RARE', 'VERY_RARE', 'RARE', 'UNCOMMON', 'COMMON'];
          const aIdx = rarityOrder.indexOf(a.rarity || '');
          const bIdx = rarityOrder.indexOf(b.rarity || '');
          const diff = (aIdx === -1 ? 999 : aIdx) - (bIdx === -1 ? 999 : bIdx);
          if (diff !== 0) return dir * diff;
          return secondarySort();
        }
        case 'category':
        default:
          if (catA !== catB) return dir * (catA - catB);
          if (yearA !== yearB) return yearA - yearB;
          return nameA.localeCompare(nameB);
      }
    });
  }, [filteredDevices, sortColumn, sortDirection]);

  // Restore view and sort preferences from localStorage on mount
  useEffect(() => {
    const savedViewMode = localStorage.getItem('inventory-view-mode');
    if (savedViewMode === 'card' || savedViewMode === 'table') {
      setViewModeState(savedViewMode);
    }
    const savedSort = localStorage.getItem('inventory-sort-column');
    if (savedSort && ['category', 'name', 'manufacturer', 'releaseYear', 'dateAcquired', 'estimatedValue', 'location', 'available', 'status'].includes(savedSort)) {
      setSortColumnState(savedSort as SortColumn);
    }
    const savedDir = localStorage.getItem('inventory-sort-direction');
    if (savedDir === 'asc' || savedDir === 'desc') {
      setSortDirectionState(savedDir);
    }
  }, []);

  useEffect(() => {
    const BarcodeDetectorCtor = typeof window !== "undefined" ? (window as any).BarcodeDetector : undefined;
    setBarcodeSupported(typeof BarcodeDetectorCtor === "function" && !!navigator?.mediaDevices?.getUserMedia);
  }, []);

  // Wrapper function to update view mode and persist to localStorage
  const setViewMode = (mode: 'card' | 'table') => {
    setViewModeState(mode);
    localStorage.setItem('inventory-view-mode', mode);
  };

  // Wrapper function to update sort and persist to localStorage
  const handleSortChange = (column: SortColumn, direction?: 'asc' | 'desc') => {
    if (direction !== undefined) {
      // Direction explicitly provided (from filter panel or table header click)
      setSortColumnState(column);
      setSortDirectionState(direction);
      localStorage.setItem('inventory-sort-direction', direction);
    } else {
      // No direction: toggle if same column, default to asc for new column
      if (column === sortColumn) {
        const next = sortDirection === 'asc' ? 'desc' : 'asc';
        setSortDirectionState(next);
        localStorage.setItem('inventory-sort-direction', next);
      } else {
        setSortColumnState(column);
        setSortDirectionState('asc');
        localStorage.setItem('inventory-sort-direction', 'asc');
      }
    }
    localStorage.setItem('inventory-sort-column', column);
  };

  if (loading) {
    return (
      <div className="p-4">
        <LoadingPanel title={t.home.loadingTitle} subtitle={t.home.loadingSubtitle} />
      </div>
    );
  }
  if (error) return <div className="p-4 text-red-500">Error: {error.message}</div>;

  return (
    <div className="min-h-screen font-sans">
      <BarcodeScannerModal
        open={assetScanOpen}
        title={t.home.scanAssetTag}
        formats={assetScanFormats}
        message={assetScanMessage}
        onClose={() => {
          setAssetScanOpen(false);
          setAssetScanMessage("");
        }}
        onDetected={async (value) => {
          // First, try to parse as a URL with /devices/<id> pattern
          try {
            const url = new URL(value);

            const hashPath = url.hash.startsWith("#!")
              ? url.hash.slice(2)
              : url.hash.startsWith("#")
                ? url.hash.slice(1)
                : "";

            const candidates = [url.pathname, hashPath].filter(Boolean);

            let deviceId: number | null = null;
            let locationId: number | null = null;
            for (const p of candidates) {
              const dm = p.match(/\/devices\/(\d+)(?:\/|$)/);
              if (dm) {
                const n = parseInt(dm[1], 10);
                if (!Number.isNaN(n) && n > 0) { deviceId = n; break; }
              }
              const lm = p.match(/\/locations\/(\d+)(?:\/|$)/);
              if (lm) {
                const n = parseInt(lm[1], 10);
                if (!Number.isNaN(n) && n > 0) { locationId = n; break; }
              }
            }

            if (deviceId) {
              router.push(`/devices/${deviceId}`);
              return true;
            }
            if (locationId) {
              router.push(`/locations/${locationId}`);
              return true;
            }
            
            // URL parsed but no device ID found - fall through to serial number check
          } catch {
            // Not a valid URL - fall through to serial number check
          }

          // Try to find a device by serial number
          const serialNumber = value.trim();
          if (!serialNumber) {
            setAssetScanMessage("Scanned value is empty.");
            return false;
          }

          setAssetScanMessage("Looking up serial number...");
          
          try {
            const result = await getDeviceBySerial({
              variables: {
                where: {
                  serialNumber: { equals: serialNumber },
                  deleted: { equals: false }
                }
              }
            });

            if (result.data?.device?.id) {
              router.push(`/devices/${result.data.device.id}`);
              return true;
            } else {
              setAssetScanMessage(`No device found with serial number: ${serialNumber}`);
              return false;
            }
          } catch (err) {
            setAssetScanMessage(`Error looking up serial number: ${serialNumber}`);
            return false;
          }
        }}
      />

      <header className="mb-0 flex flex-col gap-4 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="rainbow-stripe absolute top-0 left-0 right-0"></div>
        <div className="flex items-center gap-3 min-w-0">
          <img src="/logo.png" alt="InventoryDifferent" width={36} height={36} />
          <h1 className="text-2xl sm:text-3xl font-light tracking-tight min-w-0 break-words">
            <span style={{ color: '#5EBD3E' }}>Inv</span>
            <span style={{ color: '#FFB900' }}>ent</span>
            <span style={{ color: '#F78200' }}>ory</span>
            <span style={{ color: '#E23838' }}>Dif</span>
            <span style={{ color: '#973999' }}>fer</span>
            <span style={{ color: '#009CDF' }}>ent</span>
          </h1>
        </div>
        <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row md:items-center md:gap-4">
          <div className="w-full md:flex-1 md:max-w-md min-w-0 order-2 md:order-1">
            <SearchInput value={filters.searchTerm} onChange={handleSearchChange} placeholder={t.home.search} />
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end md:justify-start order-1 md:order-2">
            <button
              onClick={() => setIsFilterPanelOpen(true)}
              title={t.home.filterDevices}
              aria-label={t.home.filterDevices}
              className="btn-retro relative inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-[var(--foreground)]"
            >
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              {(filters.categoryIds.length > 0 || filters.locationIds.length > 0 || filters.statuses.length > 0 || filters.functionalStatuses.length > 0) && (
                <span className="absolute -top-2 -right-2 inline-flex items-center justify-center w-5 h-5 text-xs font-semibold text-white bg-blue-600 rounded-full">
                  {filters.categoryIds.length + filters.statuses.length + filters.functionalStatuses.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setViewMode(viewMode === 'card' ? 'table' : 'card')}
              title={viewMode === 'card' ? t.home.switchToTable : t.home.switchToCards}
              aria-label={viewMode === 'card' ? t.home.switchToTable : t.home.switchToCards}
              className="btn-retro inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-[var(--foreground)]"
            >
              {viewMode === 'card' ? (
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              ) : (
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              )}
            </button>
            {isAuthenticated && (
              <Link
                href="/devices/new"
                title={t.home.addNewDevice}
                aria-label={t.home.addNewDevice}
                className="inline-flex items-center justify-center rounded bg-[var(--apple-blue)] px-3 py-2 text-white hover:brightness-110 border border-[#007acc]"
              >
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v14M5 12h14" />
                </svg>
              </Link>
            )}
            <button
              type="button"
              title={t.home.scanAssetTag}
              aria-label={t.home.scanAssetTag}
              disabled={!barcodeSupported}
              onClick={() => {
                setAssetScanMessage("");
                setAssetScanOpen(true);
              }}
              className={`btn-retro inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-[var(--foreground)] ${
                barcodeSupported ? "" : "opacity-50 cursor-not-allowed"
              }`}
            >
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h4M3 4v4M21 4h-4M21 4v4M3 20h4M3 20v-4M21 20h-4M21 20v-4M7 8v8M12 8v8M17 8v8M9 8v8M15 8v8" />
              </svg>
            </button>
            {menuOpen && (
              <div
                className="fixed inset-0 z-40"
                onClick={() => setMenuOpen(false)}
              />
            )}
            <div className="relative z-50">
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                className="btn-retro inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-[var(--foreground)]"
                aria-label="Menu"
              >
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-48 overflow-hidden rounded border border-[var(--border)] bg-[var(--card)] shadow-lg card-retro">
                {isAuthenticated && (
                  <>
                    <Link
                      href="/wishlist"
                      onClick={() => setMenuOpen(false)}
                      className="block w-full px-4 py-2 text-left text-sm text-[var(--foreground)] hover:bg-[var(--muted)]"
                    >
                      {t.nav.wishlist}
                    </Link>
                    <Link
                      href="/financials"
                      onClick={() => setMenuOpen(false)}
                      className="block w-full px-4 py-2 text-left text-sm text-[var(--foreground)] hover:bg-[var(--muted)]"
                    >
                      {t.nav.financials}
                    </Link>
                    <Link
                      href="/stats"
                      onClick={() => setMenuOpen(false)}
                      className="block w-full px-4 py-2 text-left text-sm text-[var(--foreground)] hover:bg-[var(--muted)]"
                    >
                      {t.nav.stats}
                    </Link>
                    <Link
                      href="/timeline"
                      onClick={() => setMenuOpen(false)}
                      className="block w-full px-4 py-2 text-left text-sm text-[var(--foreground)] hover:bg-[var(--muted)]"
                    >
                      {t.nav.timeline}
                    </Link>
                    <Link
                      href="/usage"
                      onClick={() => setMenuOpen(false)}
                      className="block w-full px-4 py-2 text-left text-sm text-[var(--foreground)] hover:bg-[var(--muted)]"
                    >
                      {t.nav.usage}
                    </Link>
                    <div className="border-t border-[var(--border)] my-1" />
                    <Link
                      href="/print"
                      onClick={() => setMenuOpen(false)}
                      className="block w-full px-4 py-2 text-left text-sm text-[var(--foreground)] hover:bg-[var(--muted)]"
                    >
                      {t.nav.printList}
                    </Link>
                    <Link
                      href="/backup"
                      onClick={() => setMenuOpen(false)}
                      className="block w-full px-4 py-2 text-left text-sm text-[var(--foreground)] hover:bg-[var(--muted)]"
                    >
                      {t.nav.exportImport}
                    </Link>
                    <Link
                      href="/generate-images"
                      onClick={() => setMenuOpen(false)}
                      className="block w-full px-4 py-2 text-left text-sm text-[var(--foreground)] hover:bg-[var(--muted)]"
                    >
                      {t.nav.aiProductImages}
                    </Link>
                    <div className="border-t border-[var(--border)] my-1" />
                    <Link
                      href="/categories"
                      onClick={() => setMenuOpen(false)}
                      className="block w-full px-4 py-2 text-left text-sm text-[var(--foreground)] hover:bg-[var(--muted)]"
                    >
                      {t.nav.manageCategories}
                    </Link>
                    <Link
                      href="/locations"
                      onClick={() => setMenuOpen(false)}
                      className="block w-full px-4 py-2 text-left text-sm text-[var(--foreground)] hover:bg-[var(--muted)]"
                    >
                      {t.nav.manageLocations}
                    </Link>
                    <Link
                      href="/templates"
                      onClick={() => setMenuOpen(false)}
                      className="block w-full px-4 py-2 text-left text-sm text-[var(--foreground)] hover:bg-[var(--muted)]"
                    >
                      {t.nav.manageTemplates}
                    </Link>
                    <Link
                      href="/customFields"
                      onClick={() => setMenuOpen(false)}
                      className="block w-full px-4 py-2 text-left text-sm text-[var(--foreground)] hover:bg-[var(--muted)]"
                    >
                      {t.nav.manageCustomFields}
                    </Link>
                    <div className="border-t border-[var(--border)] my-1" />
                    <Link
                      href="/trash"
                      onClick={() => setMenuOpen(false)}
                      className="block w-full px-4 py-2 text-left text-sm text-[var(--foreground)] hover:bg-[var(--muted)]"
                    >
                      {t.nav.trash}
                    </Link>
                    <div className="border-t border-[var(--border)] my-1" />
                  </>
                )}
                { isAuthenticated ? (
                    <button
                      onClick={() => {
                        logout();
                        setMenuOpen(false);
                        router.refresh();
                      }}
                      className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-[var(--muted)]"
                    >
                      {t.nav.logOut}
                    </button>
                  ) : (
                    <Link
                      href="/login"
                      onClick={() => setMenuOpen(false)}
                      className="block w-full px-4 py-2 text-left text-sm text-[var(--apple-blue)] hover:bg-[var(--muted)]"
                    >
                      {t.nav.logIn}
                    </Link>
                  )
                }
              </div>
            )}
            </div>
          </div>
        </div>
      </header>

      <main>
        {filteredDevices.length === 0 ? (
          loading ? (
            <div className="p-8">
              <LoadingPanel title={t.home.loadingTitle} subtitle={t.home.warmingUp} />
            </div>
          ) : (
            <div className="text-center text-[var(--muted-foreground)] p-8 border-2 border-dashed border-[var(--border)] rounded">
              {t.home.noDevices}
            </div>
          )
        ) : viewMode === 'card' ? (
          <div className="grid grid-cols-2 gap-0.5 sm:gap-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 xxl:grid-cols-7">
            {sortedDevicesForCards.map((device: any) => (
              <DeviceCard key={device.id} device={device} />
            ))}
          </div>
        ) : (
          <DeviceTable key={`${sortColumn}-${sortDirection}`} devices={filteredDevices} sortColumn={sortColumn} sortDirection={sortDirection} onSortChange={handleSortChange} />
        )}

        {/* Summary Footer */}
        {filteredDevices.length > 0 && (
          <div className="mt-4 p-4 bg-[var(--card)] rounded border border-[var(--border)] card-retro">
            <div className="flex flex-wrap items-center justify-between gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-[var(--muted-foreground)]">{t.home.showing}</span>
                <span className="font-semibold text-[var(--foreground)]">{filteredDevices.length} {t.home.devices}</span>
              </div>
              {isAuthenticated && (
                <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                  <div className="flex items-center gap-2">
                    <span className="text-[var(--muted-foreground)]">{t.home.estValue}</span>
                    <span className="font-semibold text-[var(--foreground)]">
                      ${filteredDevices.reduce((sum: number, d: any) => sum + (d.estimatedValue || 0), 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[var(--muted-foreground)]">{t.home.totalSpent}</span>
                    <span className="font-semibold text-[var(--foreground)]">
                      ${filteredDevices.reduce((sum: number, d: any) => sum + (d.priceAcquired || 0), 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[var(--muted-foreground)]">{t.home.totalSold}</span>
                    <span className="font-semibold text-[var(--foreground)]">
                      ${filteredDevices.reduce((sum: number, d: any) => sum + (d.soldPrice || 0), 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <DeviceFilterPanel
        isOpen={isFilterPanelOpen}
        onClose={() => setIsFilterPanelOpen(false)}
        filters={filters}
        onFiltersChange={setFilters}
        categories={categoriesData?.categories || []}
        locations={locationsHomeData?.locations || []}
        sortColumn={sortColumn}
        sortDirection={sortDirection}
        onSortChange={handleSortChange}
      />
    </div>
  );
}
