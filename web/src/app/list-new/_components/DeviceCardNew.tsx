'use client';

import Link from "next/link";
import { useRef, useLayoutEffect } from "react";
import { API_BASE_URL } from "../../../lib/config";
import { useIsDarkMode } from "../../../lib/useIsDarkMode";
import { pickThumbnail } from "../../../lib/pickThumbnail";
import { useT } from "../../../i18n/context";

function ScalingText({ text, className, maxPx = 16, minPx = 11 }: { text: string; className: string; maxPx?: number; minPx?: number }) {
  const ref = useRef<HTMLHeadingElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    let size = maxPx;
    el.style.fontSize = `${size}px`;
    while (el.scrollWidth > el.clientWidth && size > minPx) {
      size -= 0.5;
      el.style.fontSize = `${size}px`;
    }
  }, [text, maxPx, minPx]);
  return (
    <h3 ref={ref} className={className} style={{ fontSize: `${maxPx}px`, whiteSpace: 'nowrap', overflow: 'hidden' }}>
      {text}
    </h3>
  );
}

interface DeviceCardNewProps {
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

const STATUS_STYLES: Record<string, { bg: string; text: string; valueText: string }> = {
  COLLECTION:   { bg: 'bg-[#218c21]', text: 'text-white', valueText: 'text-[#218c21]' },
  FOR_SALE:     { bg: 'bg-orange-500', text: 'text-white', valueText: 'text-orange-500' },
  PENDING_SALE: { bg: 'bg-yellow-400', text: 'text-black', valueText: 'text-yellow-600' },
  SOLD:         { bg: 'bg-red-600',    text: 'text-white', valueText: 'text-red-600' },
  DONATED:      { bg: 'bg-purple-600', text: 'text-white', valueText: 'text-purple-600' },
  IN_REPAIR:    { bg: 'bg-teal-600',   text: 'text-white', valueText: 'text-teal-600' },
  RETURNED:     { bg: 'bg-red-600',    text: 'text-white', valueText: 'text-red-600' },
};
const FILLED: React.CSSProperties = { fontVariationSettings: "'FILL' 1, 'wght' 300, 'GRAD' 0, 'opsz' 24" };

const RARITY_COLORS: Record<string, string> = {
  COMMON:        INACTIVE,
  UNCOMMON:      'text-yellow-400',
  RARE:          'text-green-500',
  VERY_RARE:     'text-blue-500',
  EXTREMELY_RARE:'text-purple-500',
};

type IconSpec = { name: string; className: string; style?: React.CSSProperties };

function buildIconRow(device: DeviceCardNewProps['device']): IconSpec[] {
  const icons: IconSpec[] = [];

  // 1. Functional status — always shown
  if (device.functionalStatus === 'YES') {
    icons.push({ name: 'thumb_up', className: 'text-green-500', style: FILLED });
  } else if (device.functionalStatus === 'PARTIAL') {
    icons.push({ name: 'warning', className: 'text-yellow-400', style: FILLED });
  } else {
    icons.push({ name: 'thumb_down', className: 'text-red-500', style: FILLED });
  }

  // 2. Rarity — only if set
  if (device.rarity) {
    icons.push({
      name: 'crown',
      className: RARITY_COLORS[device.rarity] ?? INACTIVE,
      style: FILLED,
    });
  }

  // 3. Asset tagged — always shown
  icons.push({
    name: 'sell',
    className: device.isAssetTagged ? 'text-green-500' : INACTIVE,
    style: FILLED,
  });

  // 4. Original box — always shown
  icons.push({
    name: 'inventory_2',
    className: device.hasOriginalBox ? 'text-green-500' : INACTIVE,
    style: FILLED,
  });

  // 5. PRAM battery — computers only
  if (device.category.type === 'COMPUTER') {
    icons.push({
      name: device.isPramBatteryRemoved ? 'battery_full' : 'battery_alert',
      className: device.isPramBatteryRemoved ? 'text-green-500' : 'text-red-500',
      style: FILLED,
    });
  }

  // 6. Favorite — always shown
  icons.push({
    name: 'star',
    className: device.isFavorite ? 'text-yellow-400' : INACTIVE,
    style: FILLED,
  });

  return icons;
}

export function DeviceCardNew({ device }: DeviceCardNewProps) {
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
      case 'COLLECTION':
        return device.estimatedValue ? `Est. ${formatPrice(device.estimatedValue)}` : null;
      case 'FOR_SALE':
        return `For Sale ${formatPrice(device.listPrice) ?? 'TBD'}`;
      case 'PENDING_SALE':
        return `Pending ${formatPrice(device.listPrice) ?? 'TBD'}`;
      case 'SOLD':
        return `Sold ${formatPrice(device.soldPrice) ?? ''}`.trim();
      case 'DONATED':
        return t.status.DONATED;
      case 'IN_REPAIR':
        return t.status.IN_REPAIR;
      case 'RETURNED':
        return t.status.RETURNED;
      default:
        return null;
    }
  };

  const statusText = (t.status as Record<string, string>)[device.status] ?? device.status;
  const statusStyle = STATUS_STYLES[device.status] ?? { bg: 'bg-gray-600', text: 'text-white' };
  const iconRow = buildIconRow(device);

  const subtitle = device.additionalName || `${device.manufacturer || ''} ${device.modelNumber || ''}`.trim();
  const value = valueLabel();

  return (
    <Link href={`/devices/${device.id}`} className="block group">
      <div className="bg-surface-container-lowest rounded-xl overflow-hidden shadow-[0_4px_24px_-4px_rgba(0,0,0,0.04)] border border-[#e2e2e7] dark:border-[#2e3138] hover:shadow-xl transition-all duration-500 flex flex-col h-full">

        {/* Image area */}
        <div className="aspect-square w-full bg-surface-container-low dark:bg-[#282d36] relative overflow-hidden">
          {thumbnail ? (
            <img
              src={`${API_BASE_URL}${thumbnail}`}
              alt={device.name}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="material-symbols-outlined text-[48px] text-outline-variant dark:text-[#414755]">devices</span>
            </div>
          )}

          {/* Status chip — top left */}
          <div className={`absolute top-2 left-2 ${statusStyle.bg} px-2 py-1 rounded-full flex items-center`}>
            <span className={`text-[10px] font-bold ${statusStyle.text} uppercase tracking-wider leading-none font-inter`}>
              {statusText}
            </span>
          </div>

          {/* Icon row — bottom center */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-white/50 dark:bg-black/50 backdrop-blur-xl px-3 py-1.5 rounded-full flex gap-2 shadow-sm">
            {iconRow.map((icon, i) => (
              <span
                key={i}
                className={`material-symbols-outlined !text-[14px] ${icon.className}`}
                style={icon.style}
              >
                {icon.name}
              </span>
            ))}
          </div>
        </div>

        {/* Card body */}
        <div className="px-3 pt-2 pb-3 flex flex-col">
          <div className="mb-0.5">
            <span className="text-[9px] font-semibold text-on-surface-variant dark:text-[#c1c6d7] tracking-widest uppercase">
              {device.category.name}{device.releaseYear ? ` • ${device.releaseYear}` : ''}
            </span>
          </div>
          <ScalingText
            text={device.name}
            className="font-semibold tracking-tight text-on-surface dark:text-[#e2e2e7] mb-0 leading-tight"
            maxPx={16}
            minPx={11}
          />
          {subtitle && (
            <p className="text-xs font-normal text-on-surface-variant dark:text-[#c1c6d7] mb-0 line-clamp-1">
              {subtitle}
            </p>
          )}
          <div className="flex items-center justify-between mt-1.5">
            {value && (
              <p className={`text-xs font-semibold ${statusStyle.valueText}`}>{value}</p>
            )}
            <span className="material-symbols-outlined text-outline-variant/40 group-hover:text-primary dark:group-hover:text-[#adc6ff] transition-colors text-[16px] ml-auto">
              arrow_forward_ios
            </span>
          </div>
        </div>

      </div>
    </Link>
  );
}
