'use client';

import { useRouter } from "next/navigation";
import { API_BASE_URL } from "../../../lib/config";
import { useIsDarkMode } from "../../../lib/useIsDarkMode";
import { pickThumbnail } from "../../../lib/pickThumbnail";
import { useT } from "../../../i18n/context";

interface Device {
  id: number;
  name: string;
  additionalName: string | null;
  manufacturer: string;
  modelNumber: string;
  releaseYear?: number | null;
  status: string;
  functionalStatus: string;
  rarity?: string | null;
  hasOriginalBox?: boolean;
  isAssetTagged?: boolean;
  isPramBatteryRemoved?: boolean;
  estimatedValue?: number | null;
  listPrice?: number | null;
  soldPrice?: number | null;
  category: { name: string; type: string };
  images: {
    path: string;
    thumbnailPath?: string | null;
    isThumbnail: boolean;
    thumbnailMode?: string | null;
  }[];
  isFavorite?: boolean;
}

interface DeviceTableNewProps {
  devices: Device[];
  sortColumn: string;
  sortDirection: 'asc' | 'desc';
  onSortChange: (column: string, direction: 'asc' | 'desc') => void;
}

const INACTIVE = 'text-gray-500 dark:text-gray-400';

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  COLLECTION:   { bg: 'bg-[#218c21]', text: 'text-white' },
  FOR_SALE:     { bg: 'bg-orange-500', text: 'text-white' },
  PENDING_SALE: { bg: 'bg-yellow-400', text: 'text-black' },
  SOLD:         { bg: 'bg-red-600',    text: 'text-white' },
  DONATED:      { bg: 'bg-purple-600', text: 'text-white' },
  IN_REPAIR:    { bg: 'bg-teal-600',   text: 'text-white' },
  RETURNED:     { bg: 'bg-red-600',    text: 'text-white' },
};

const FILLED: React.CSSProperties = { fontVariationSettings: "'FILL' 1, 'wght' 300, 'GRAD' 0, 'opsz' 24" };

const RARITY_COLORS: Record<string, string> = {
  COMMON:         INACTIVE,
  UNCOMMON:       'text-yellow-400',
  RARE:           'text-green-500',
  VERY_RARE:      'text-blue-500',
  EXTREMELY_RARE: 'text-purple-500',
};

const DEFAULT_DIRECTION: Record<string, 'asc' | 'desc'> = {
  name:           'asc',
  category:       'asc',
  releaseYear:    'desc',
  estimatedValue: 'desc',
  status:         'asc',
};

function buildIconRow(device: Device) {
  const icons: { name: string; className: string; style?: React.CSSProperties }[] = [];

  if (device.functionalStatus === 'YES') {
    icons.push({ name: 'thumb_up',   className: 'text-green-500',  style: FILLED });
  } else if (device.functionalStatus === 'PARTIAL') {
    icons.push({ name: 'warning',    className: 'text-yellow-400', style: FILLED });
  } else {
    icons.push({ name: 'thumb_down', className: 'text-red-500',    style: FILLED });
  }

  if (device.rarity) {
    icons.push({ name: 'crown', className: RARITY_COLORS[device.rarity] ?? INACTIVE, style: FILLED });
  }

  icons.push({ name: 'sell',        className: device.isAssetTagged  ? 'text-green-500' : INACTIVE, style: FILLED });
  icons.push({ name: 'inventory_2', className: device.hasOriginalBox ? 'text-green-500' : INACTIVE, style: FILLED });

  if (device.category.type === 'COMPUTER') {
    icons.push({
      name:      device.isPramBatteryRemoved ? 'battery_full' : 'battery_alert',
      className: device.isPramBatteryRemoved ? 'text-green-500' : 'text-red-500',
      style: FILLED,
    });
  } else {
    icons.push({ name: '', className: '' });
  }

  icons.push({ name: 'star', className: device.isFavorite ? 'text-yellow-400' : INACTIVE, style: FILLED });
  return icons;
}

// Shared cell classes — split into base, first, last so each <td> composes them
const CELL     = 'bg-surface dark:bg-[#1e2129] py-3 px-4 transition-colors group-hover:bg-surface-container-low dark:group-hover:bg-[#282d36]';
const CELL_L   = `${CELL} rounded-l-xl`;
const CELL_R   = `${CELL} rounded-r-xl`;

function SortIcon({ col, sortColumn, sortDirection }: { col: string; sortColumn: string; sortDirection: 'asc' | 'desc' }) {
  if (col !== sortColumn) return <span className="material-symbols-outlined text-[13px] opacity-30">unfold_more</span>;
  return <span className="material-symbols-outlined text-[13px] text-primary dark:text-[#adc6ff]">{sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward'}</span>;
}

function DeviceRow({ device }: { device: Device }) {
  const router = useRouter();
  const isDark = useIsDarkMode();
  const t = useT();
  const thumbImage = pickThumbnail(device.images, isDark);
  const thumbnail = thumbImage?.thumbnailPath || thumbImage?.path;

  const formatPrice = (p: number | null | undefined) =>
    p == null ? null : `${t.common.currencySymbol}${p.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  const valueLabel = () => {
    switch (device.status) {
      case 'COLLECTION':   return device.estimatedValue ? formatPrice(device.estimatedValue) : '—';
      case 'FOR_SALE':     return formatPrice(device.listPrice) ?? 'TBD';
      case 'PENDING_SALE': return formatPrice(device.listPrice) ?? 'TBD';
      case 'SOLD':         return formatPrice(device.soldPrice) ?? '—';
      default:             return '—';
    }
  };

  const statusText  = (t.status as Record<string, string>)[device.status] ?? device.status;
  const statusStyle = STATUS_STYLES[device.status] ?? { bg: 'bg-gray-600', text: 'text-white' };
  const iconRow     = buildIconRow(device);
  const subtitle    = device.additionalName || `${device.manufacturer || ''} ${device.modelNumber || ''}`.trim();

  return (
    <tr
      className="group cursor-pointer"
      onClick={() => router.push(`/devices/${device.id}`)}
    >
      {/* Name */}
      <td className={CELL_L}>
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 flex-shrink-0 rounded-lg overflow-hidden bg-surface-container-low dark:bg-[#282d36]">
            {thumbnail ? (
              <img src={`${API_BASE_URL}${thumbnail}`} alt={device.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px] text-outline-variant dark:text-[#414755]">devices</span>
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-on-surface dark:text-[#e2e2e7] truncate leading-tight">{device.name}</p>
            {subtitle && <p className="text-xs text-on-surface-variant dark:text-[#c1c6d7] truncate">{subtitle}</p>}
          </div>
        </div>
      </td>

      {/* Category */}
      <td className={CELL}>
        <p className="text-xs text-on-surface-variant dark:text-[#c1c6d7] truncate">{device.category.name}</p>
      </td>

      {/* Year */}
      <td className={CELL}>
        <p className="text-xs text-on-surface dark:text-[#e2e2e7] font-medium tabular-nums">{device.releaseYear ?? '—'}</p>
      </td>

      {/* Est. Value */}
      <td className={CELL}>
        <p className="text-xs font-bold text-primary dark:text-[#adc6ff] tabular-nums">{valueLabel()}</p>
      </td>

      {/* Status */}
      <td className={CELL}>
        <div className={`inline-flex ${statusStyle.bg} px-2.5 py-1 rounded-full`}>
          <span className={`text-[10px] font-bold ${statusStyle.text} uppercase tracking-wider leading-none`}>{statusText}</span>
        </div>
      </td>

      {/* Indicators */}
      <td className={CELL_R}>
        <div className="flex items-center gap-1.5">
          {iconRow.map((icon, i) => (
            icon.name
              ? <span key={i} className={`material-symbols-outlined text-[15px] ${icon.className}`} style={icon.style}>{icon.name}</span>
              : <span key={i} className="inline-block w-[15px]" />
          ))}
        </div>
      </td>
    </tr>
  );
}

export function DeviceTableNew({ devices, sortColumn, sortDirection, onSortChange }: DeviceTableNewProps) {
  const handleSort = (col: string) => {
    if (col === sortColumn) {
      onSortChange(col, sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      onSortChange(col, DEFAULT_DIRECTION[col] ?? 'asc');
    }
  };

  const TH_BASE = 'pb-2 pt-1 px-4 text-left font-bold text-[10px] uppercase tracking-widest text-on-surface-variant dark:text-[#c1c6d7]';

  const columns: { key: string; label: string }[] = [
    { key: 'name',           label: 'Name'      },
    { key: 'category',       label: 'Category'  },
    { key: 'releaseYear',    label: 'Year'       },
    { key: 'estimatedValue', label: 'Est. Value' },
    { key: 'status',         label: 'Status'     },
    { key: 'indicators',     label: ''           },
  ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-separate border-spacing-y-1.5">
        <colgroup>
          <col />{/* Name: fills remaining space */}
          <col style={{ width: '140px' }} />
          <col style={{ width: '70px' }} />
          <col style={{ width: '110px' }} />
          <col style={{ width: '160px' }} />
          <col style={{ width: '150px' }} />
        </colgroup>

        <thead>
          <tr>
            {columns.map(col => (
              <th key={col.key} className={TH_BASE}>
                {col.key !== 'indicators' ? (
                  <button
                    onClick={() => handleSort(col.key)}
                    className={`flex items-center gap-1 hover:text-on-surface dark:hover:text-[#e2e2e7] transition-colors ${col.key === 'name' ? 'pl-[52px]' : ''}`}
                  >
                    {col.label}
                    <SortIcon col={col.key} sortColumn={sortColumn} sortDirection={sortDirection} />
                  </button>
                ) : null}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {devices.map(device => (
            <DeviceRow key={device.id} device={device} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
