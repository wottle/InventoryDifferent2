"use client";

import { useState, useEffect, useMemo } from "react";
import { useQuery, useLazyQuery } from "@apollo/client";
import gql from "graphql-tag";
import { useRouter } from "next/navigation";
import { NavBar } from "./list-new/_components/NavBar";
import { FilterBar } from "./list-new/_components/FilterBar";
import { DeviceCardNew } from "./list-new/_components/DeviceCardNew";
import { DeviceTableNew } from "./list-new/_components/DeviceTableNew";
import { FisheyeGrid } from "./list-new/_components/FisheyeGrid";
import { LoadingPanel } from "../components/LoadingPanel";
import { BarcodeScannerModal } from "../components/BarcodeScannerModal";
import { BarcodeNotFoundModal } from "../components/BarcodeNotFoundModal";
import { useAuth } from "../lib/auth-context";
import { useT } from "../i18n/context";
import { decodeAppleSerial } from "../lib/appleSerialDecoder";

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
      isAssetTagged
      accessories {
        id
        name
      }
      isWifiEnabled
      pramBatteryInstalled
      pramBatteryExpiryDate
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
      location {
        id
        name
      }
      images {
        id
        path
        thumbnailPath
        isThumbnail
        thumbnailMode
      }
      cpuType
      cpuSpeed
      ram
      notes {
        id
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

const GET_DEVICE_BY_SERIAL = gql`
  query GetDeviceBySerialNew($where: DeviceWhereInput!) {
    device(where: $where) {
      id
    }
  }
`;

const GET_TEMPLATES_FOR_MATCHING = gql`
  query GetTemplatesForMatching {
    templates {
      id
      name
      additionalName
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
  const router = useRouter();

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
  const [viewMode, setViewModeState] = useState<'grid' | 'list' | 'fisheye'>(() =>
    loadFromStorage(STORAGE_VIEW, 'grid') as 'grid' | 'list' | 'fisheye'
  );
  const [assetScanOpen, setAssetScanOpen] = useState(false);
  const [assetScanMessage, setAssetScanMessage] = useState('');
  const [barcodeSupported, setBarcodeSupported] = useState(false);
  const [notFoundOpen, setNotFoundOpen] = useState(false);
  const [notFoundSerial, setNotFoundSerial] = useState('');
  const [notFoundModelName, setNotFoundModelName] = useState<string | undefined>();
  const [notFoundYear, setNotFoundYear] = useState<number | undefined>();
  const [notFoundTemplateId, setNotFoundTemplateId] = useState<number | undefined>();
  const assetScanFormats = useMemo(() => ['qr_code', 'code_128', 'code_39', 'ean_13', 'ean_8', 'upc_a', 'upc_e', 'itf'], []);
  const [getDeviceBySerial] = useLazyQuery(GET_DEVICE_BY_SERIAL);
  const [getTemplatesForMatching] = useLazyQuery(GET_TEMPLATES_FOR_MATCHING);
  const [healthFilters, setHealthFilters] = useState({
    noImages: false,
    noNotes: false,
    missingSpecs: false,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    setHealthFilters({
      noImages: params.get('noImages') === 'true',
      noNotes: params.get('noNotes') === 'true',
      missingSpecs: params.get('missingSpecs') === 'true',
    });
  }, []);

  const setViewMode = (v: 'grid' | 'list' | 'fisheye') => {
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
    fetchPolicy: 'cache-first',
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
    if (healthFilters.noImages) result = result.filter((d: any) => !d.images || d.images.length === 0);
    if (healthFilters.noNotes) result = result.filter((d: any) => !d.notes || d.notes.length === 0);
    if (healthFilters.missingSpecs) result = result.filter((d: any) => !d.cpuType && !d.ram);
    return result;
  }, [data?.devices, filters, searchQuery, healthFilters]);

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
        case 'location': {
          const locA = (a.location?.name ?? '').toLowerCase();
          const locB = (b.location?.name ?? '').toLowerCase();
          return locA !== locB ? dir * locA.localeCompare(locB) : secondary();
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
    // Capture scroll at click time (before Next.js navigation scroll-to-zero fires),
    // so scrollY === 0 is saved correctly when the user is at the top.
    const onLinkClick = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest('a')) {
        sessionStorage.setItem(SESSION_SCROLL, String(window.scrollY));
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('click', onLinkClick, true);
    return () => {
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('click', onLinkClick, true);
    };
  }, [loading]);

  useEffect(() => {
    const BarcodeDetectorCtor = typeof window !== 'undefined' ? (window as any).BarcodeDetector : undefined;
    setBarcodeSupported(typeof BarcodeDetectorCtor === 'function' && !!navigator?.mediaDevices?.getUserMedia);
  }, []);

  // Same normalized matching logic as iOS findMatchingTemplate
  const findMatchingTemplate = async (modelName: string): Promise<number | undefined> => {
    const result = await getTemplatesForMatching().catch(() => null);
    const templates: { id: number; name: string; additionalName?: string }[] =
      result?.data?.templates ?? [];
    if (!templates.length) return undefined;

    const needle = modelName.toLowerCase().replace(/\s*\(.*?\)/g, '').trim();
    const normKey = (s: string) =>
      s.toLowerCase().replace(/macintosh/g, 'mac').replace(/\s+/g, '');
    const normNeedle = normKey(needle);

    const match = templates.find(t => {
      const h = t.name.toLowerCase();
      const hAlt = (t.additionalName ?? '').toLowerCase();
      const normH = normKey(t.name);
      const normHAlt = normKey(t.additionalName ?? '');
      return h.includes(needle) || needle.includes(h)
        || normH.includes(normNeedle) || normNeedle.includes(normH)
        || (hAlt && (hAlt.includes(needle) || needle.includes(hAlt)))
        || (normHAlt && (normHAlt.includes(normNeedle) || normNeedle.includes(normHAlt)));
    });
    return match?.id;
  };

  if (loading && !data) {
    return (
      <>
        <NavBar />
        <div className="min-h-screen pt-8">
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
        <div className="min-h-screen pt-8">
          <div className="max-w-[1440px] mx-auto px-8 text-error">Error: {error.message}</div>
        </div>
      </>
    );
  }

  return (
    <div className="min-h-screen font-inter">
      <NavBar />

      <BarcodeScannerModal
        open={assetScanOpen}
        title={t.home.scanAssetTag}
        formats={assetScanFormats}
        message={assetScanMessage}
        onClose={() => { setAssetScanOpen(false); setAssetScanMessage(''); }}
        onDetected={async (value) => {
          const saveScroll = () => sessionStorage.setItem(SESSION_SCROLL, String(window.scrollY));
          try {
            const url = new URL(value);
            // Navigate to in-app device/location URLs
            const hashPath = url.hash.startsWith('#!') ? url.hash.slice(2) : url.hash.startsWith('#') ? url.hash.slice(1) : '';
            for (const p of [url.pathname, hashPath].filter(Boolean)) {
              const dm = p.match(/\/devices\/(\d+)(?:\/|$)/);
              if (dm) { saveScroll(); router.push(`/devices/${dm[1]}`); return true; }
              const lm = p.match(/\/locations\/(\d+)(?:\/|$)/);
              if (lm) { saveScroll(); router.push(`/locations/${lm[1]}`); return true; }
            }
            // Non-app URL QR code — show a hint and keep scanning
            if (url.protocol === 'http:' || url.protocol === 'https:') {
              setAssetScanMessage(t.scanner.urlIgnored);
              return false;
            }
          } catch { /* not a URL — treat as serial */ }
          const serialNumber = value.trim();
          if (!serialNumber) { return false; }
          setAssetScanMessage('Looking up serial number...');
          try {
            const result = await getDeviceBySerial({ variables: { where: { serialNumber: { equals: serialNumber }, deleted: { equals: false } } } });
            if (result.data?.device?.id) { saveScroll(); router.push(`/devices/${result.data.device.id}`); return true; }
            // Not found — decode the serial and show the not-found sheet
            const decoded = decodeAppleSerial(serialNumber);
            const modelName = (decoded.type === 'vintage' || decoded.type === 'modern') ? decoded.modelName : undefined;
            const year = decoded.type === 'vintage' ? decoded.year : undefined;
            const templateId = modelName ? await findMatchingTemplate(modelName) : undefined;
            setNotFoundSerial(serialNumber);
            setNotFoundModelName(modelName);
            setNotFoundYear(year);
            setNotFoundTemplateId(templateId);
            setAssetScanOpen(false);
            setAssetScanMessage('');
            setNotFoundOpen(true);
            return true; // scanner handled it (closes scanner modal)
          } catch {
            setAssetScanMessage(`Error looking up serial number: ${serialNumber}`);
            return false;
          }
        }}
      />

      <BarcodeNotFoundModal
        open={notFoundOpen}
        serial={notFoundSerial}
        modelName={notFoundModelName}
        year={notFoundYear}
        isAuthenticated={isAuthenticated}
        onClose={() => setNotFoundOpen(false)}
        onScanAgain={() => {
          setNotFoundOpen(false);
          setAssetScanMessage('');
          setAssetScanOpen(true);
        }}
        onAddDevice={() => {
          setNotFoundOpen(false);
          const params = new URLSearchParams({ serialNumber: notFoundSerial });
          if (notFoundTemplateId) {
            params.set('templateId', String(notFoundTemplateId));
          } else if (notFoundModelName) {
            params.set('name', notFoundModelName);
          }
          router.push(`/devices/new?${params.toString()}`);
        }}
        onAddDeviceUnmatched={() => {
          setNotFoundOpen(false);
          router.push(`/devices/new?serialNumber=${encodeURIComponent(notFoundSerial)}`);
        }}
      />

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
          barcodeSupported={barcodeSupported}
          onScanClick={() => { setAssetScanMessage(''); setAssetScanOpen(true); }}
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
        ) : viewMode === 'fisheye' ? (
          <FisheyeGrid devices={sortedDevices} />
        ) : (
          <div className="grid grid-cols-1 min-[390px]:grid-cols-2 min-[1024px]:grid-cols-3 min-[1280px]:grid-cols-4 min-[1536px]:grid-cols-5 min-[1680px]:grid-cols-6 min-[1780px]:grid-cols-7 min-[1980px]:grid-cols-8 gap-3">
            {sortedDevices.map((device: any) => (
              <DeviceCardNew key={device.id} device={device} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
