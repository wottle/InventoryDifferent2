'use client';

import Link from "next/link";
import { API_BASE_URL } from "../../../lib/config";
import { useIsDarkMode } from "../../../lib/useIsDarkMode";
import { pickThumbnail } from "../../../lib/pickThumbnail";
import { useT } from "../../../i18n/context";

interface DeviceListRowProps {
  device: {
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
  };
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

type IconSpec = { name: string; className: string; style?: React.CSSProperties };

function buildIconRow(device: DeviceListRowProps['device']): IconSpec[] {
  const icons: IconSpec[] = [];

  if (device.functionalStatus === 'YES') {
    icons.push({ name: 'thumb_up', className: 'text-green-500', style: FILLED });
  } else if (device.functionalStatus === 'PARTIAL') {
    icons.push({ name: 'warning', className: 'text-yellow-400', style: FILLED });
  } else {
    icons.push({ name: 'thumb_down', className: 'text-red-500', style: FILLED });
  }

  if (device.rarity) {
    icons.push({ name: 'crown', className: RARITY_COLORS[device.rarity] ?? INACTIVE, style: FILLED });
  }

  icons.push({ name: 'sell', className: device.isAssetTagged ? 'text-green-500' : INACTIVE, style: FILLED });
  icons.push({ name: 'inventory_2', className: device.hasOriginalBox ? 'text-green-500' : INACTIVE, style: FILLED });

  if (device.category.type === 'COMPUTER') {
    icons.push({
      name: device.isPramBatteryRemoved ? 'battery_full' : 'battery_alert',
      className: device.isPramBatteryRemoved ? 'text-green-500' : 'text-red-500',
      style: FILLED,
    });
  }

  icons.push({ name: 'star', className: device.isFavorite ? 'text-yellow-400' : INACTIVE, style: FILLED });

  return icons;
}

export function DeviceListRow({ device }: DeviceListRowProps) {
  const isDark = useIsDarkMode();
  const t = useT();
  const thumbImage = pickThumbnail(device.images, isDark);
  const thumbnail = thumbImage?.thumbnailPath || thumbImage?.path;

  const formatPrice = (price: number | null | undefined) => {
    if (price == null) return null;
    return `${t.common.currencySymbol}${price.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  const valueLabel = () => {
    switch (device.status) {
      case 'COLLECTION':   return device.estimatedValue ? `Est. ${formatPrice(device.estimatedValue)}` : null;
      case 'FOR_SALE':     return `List ${formatPrice(device.listPrice) ?? 'TBD'}`;
      case 'PENDING_SALE': return `Pending ${formatPrice(device.listPrice) ?? 'TBD'}`;
      case 'SOLD':         return `Sold ${formatPrice(device.soldPrice) ?? ''}`.trim();
      case 'DONATED':      return t.status.DONATED;
      case 'IN_REPAIR':    return t.status.IN_REPAIR;
      case 'RETURNED':     return t.status.RETURNED;
      default:             return null;
    }
  };

  const statusText = (t.status as Record<string, string>)[device.status] ?? device.status;
  const statusStyle = STATUS_STYLES[device.status] ?? { bg: 'bg-gray-600', text: 'text-white' };
  const iconRow = buildIconRow(device);
  const subtitle = device.additionalName || `${device.manufacturer || ''} ${device.modelNumber || ''}`.trim();
  const value = valueLabel();

  return (
    <Link href={`/devices/${device.id}`} className="block group">
      <div className="bg-surface-container-lowest dark:bg-[#1e2129] rounded-xl border border-[#e2e2e7] dark:border-[#2e3138] hover:shadow-md transition-all duration-300 flex items-center gap-4 px-4 py-3">

        {/* Thumbnail */}
        <div className="w-14 h-14 flex-shrink-0 rounded-lg overflow-hidden bg-surface-container-low dark:bg-[#282d36]">
          {thumbnail ? (
            <img
              src={`${API_BASE_URL}${thumbnail}`}
              alt={device.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="material-symbols-outlined text-[24px] text-outline-variant dark:text-[#414755]">devices</span>
            </div>
          )}
        </div>

        {/* Name + subtitle */}
        <div className="flex-1 min-w-0">
          <span className="text-[10px] font-bold text-on-surface-variant dark:text-[#c1c6d7] tracking-widest uppercase">
            {device.category.name}{device.releaseYear ? ` • ${device.releaseYear}` : ''}
          </span>
          <h3 className="text-sm font-bold tracking-tight text-on-surface dark:text-[#e2e2e7] leading-tight truncate">
            {device.name}
          </h3>
          {subtitle && (
            <p className="text-xs text-on-surface-variant dark:text-[#c1c6d7] truncate">{subtitle}</p>
          )}
        </div>

        {/* Icon row */}
        <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
          {iconRow.map((icon, i) => (
            <span
              key={i}
              className={`material-symbols-outlined text-[16px] ${icon.className}`}
              style={icon.style}
            >
              {icon.name}
            </span>
          ))}
        </div>

        {/* Status + value */}
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <div className={`${statusStyle.bg} px-2.5 py-1 rounded-full`}>
            <span className={`text-[10px] font-bold ${statusStyle.text} uppercase tracking-wider leading-none`}>
              {statusText}
            </span>
          </div>
          {value && (
            <span className="text-xs font-bold text-primary dark:text-[#adc6ff]">{value}</span>
          )}
        </div>

        {/* Arrow */}
        <span className="material-symbols-outlined text-[16px] text-outline-variant/40 group-hover:text-primary dark:group-hover:text-[#adc6ff] transition-colors flex-shrink-0">
          arrow_forward_ios
        </span>

      </div>
    </Link>
  );
}
