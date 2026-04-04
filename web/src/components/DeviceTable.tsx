'use client';

import Link from "next/link";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "../lib/config";
import { SortColumn } from "./DeviceFilterPanel";
import { useIsDarkMode } from "../lib/useIsDarkMode";
import { pickThumbnail } from "../lib/pickThumbnail";
import { useT } from "../i18n/context";

interface DeviceTableProps {
  devices: any[];
  sortColumn: SortColumn;
  sortDirection: 'asc' | 'desc';
  onSortChange: (column: SortColumn, direction?: 'asc' | 'desc') => void;
}

export function DeviceTable({ devices, sortColumn, sortDirection, onSortChange }: DeviceTableProps) {
  const router = useRouter();
  const isDark = useIsDarkMode();
  const t = useT();
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      timeZone: 'UTC',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined) return '';
    return `${t.common.currencySymbol}${Number(value).toFixed(2)}`;
  };

  const handleSort = (column: SortColumn) => {
    if (column === sortColumn) {
      // Toggle direction if same column
      onSortChange(column, sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New column, default to ascending
      onSortChange(column, 'asc');
    }
  };

  // Secondary/tertiary sort helpers
  const getCategorySortOrder = (device: any) => device?.category?.sortOrder ?? 999;
  const getReleaseYear = (device: any) => device?.releaseYear ?? 0;
  const getName = (device: any) => (device?.name || '').toLowerCase();

  // Apply secondary (release year asc) and tertiary (name asc) sorting
  const applySecondaryTertiarySort = (a: any, b: any) => {
    const yearA = getReleaseYear(a);
    const yearB = getReleaseYear(b);
    if (yearA !== yearB) return yearA - yearB;
    
    const nameA = getName(a);
    const nameB = getName(b);
    return nameA.localeCompare(nameB);
  };

  const sortedDevices = [...devices].sort((a, b) => {
    let primaryResult = 0;

    switch (sortColumn) {
      case 'category':
        {
          const aOrder = getCategorySortOrder(a);
          const bOrder = getCategorySortOrder(b);
          if (aOrder !== bOrder) {
            primaryResult = aOrder - bOrder;
          } else {
            const aName = a?.category?.name ?? '';
            const bName = b?.category?.name ?? '';
            primaryResult = aName.localeCompare(bName);
          }
        }
        break;
      case 'name':
        {
          const aName = a.name || '';
          const bName = b.name || '';
          primaryResult = aName.localeCompare(bName);
        }
        break;
      case 'manufacturer':
        {
          const aMfg = `${a.manufacturer || ''} ${a.modelNumber || ''}`.toLowerCase().trim();
          const bMfg = `${b.manufacturer || ''} ${b.modelNumber || ''}`.toLowerCase().trim();
          primaryResult = aMfg.localeCompare(bMfg);
        }
        break;
      case 'releaseYear':
        {
          const aYear = a.releaseYear || 0;
          const bYear = b.releaseYear || 0;
          primaryResult = aYear - bYear;
        }
        break;
      case 'dateAcquired':
        {
          const aDate = a.dateAcquired ? new Date(a.dateAcquired).getTime() : 0;
          const bDate = b.dateAcquired ? new Date(b.dateAcquired).getTime() : 0;
          primaryResult = aDate - bDate;
        }
        break;
      case 'estimatedValue':
        {
          const aVal = a.estimatedValue || 0;
          const bVal = b.estimatedValue || 0;
          primaryResult = aVal - bVal;
        }
        break;
      case 'location':
        {
          const aLoc = a.location || '';
          const bLoc = b.location || '';
          primaryResult = aLoc.localeCompare(bLoc);
        }
        break;
      case 'available':
        {
          const aAvail = a.status || '';
          const bAvail = b.status || '';
          primaryResult = aAvail.localeCompare(bAvail);
        }
        break;
      case 'status':
        {
          const aStatus = a.functionalStatus || '';
          const bStatus = b.functionalStatus || '';
          primaryResult = aStatus.localeCompare(bStatus);
        }
        break;
      case 'condition':
        {
          const conditionOrder = ['NEW', 'LIKE_NEW', 'VERY_GOOD', 'GOOD', 'ACCEPTABLE', 'FOR_PARTS'];
          const aIdx = conditionOrder.indexOf(a.condition || '');
          const bIdx = conditionOrder.indexOf(b.condition || '');
          primaryResult = (aIdx === -1 ? 999 : aIdx) - (bIdx === -1 ? 999 : bIdx);
        }
        break;
      case 'rarity':
        {
          const rarityOrder = ['EXTREMELY_RARE', 'VERY_RARE', 'RARE', 'UNCOMMON', 'COMMON'];
          const aIdx = rarityOrder.indexOf(a.rarity || '');
          const bIdx = rarityOrder.indexOf(b.rarity || '');
          primaryResult = (aIdx === -1 ? 999 : aIdx) - (bIdx === -1 ? 999 : bIdx);
        }
        break;
      default:
        primaryResult = 0;
    }

    // Apply sort direction to primary result
    if (primaryResult !== 0) {
      return sortDirection === 'asc' ? primaryResult : -primaryResult;
    }
    // If primary sort is equal, apply secondary (release year asc) and tertiary (name asc)
    return applySecondaryTertiarySort(a, b);
  });

  // Functional status icon - matches DeviceCard
  const getFunctionalStatusIcon = (status: string) => {
    switch (status) {
      case 'YES':
        return (
          <span title={t.icons.functionalYes}>
            <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M2 20h2c.55 0 1-.45 1-1v-9c0-.55-.45-1-1-1H2v11zm19.83-7.12c.11-.25.17-.52.17-.8V11c0-1.1-.9-2-2-2h-5.5l.92-4.65c.05-.22.02-.46-.08-.66-.23-.45-.52-.86-.88-1.22L14 2 7.59 8.41C7.21 8.79 7 9.3 7 9.83v7.84C7 18.95 8.05 20 9.34 20h8.11c.7 0 1.36-.37 1.72-.97l2.66-6.15z"/>
            </svg>
          </span>
        );
      case 'PARTIAL':
        return (
          <span title={t.icons.functionalPartial}>
            <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
            </svg>
          </span>
        );
      case 'NO':
        return (
          <span title={t.icons.functionalNo}>
            <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M15 3H6c-.83 0-1.54.5-1.84 1.22l-3.02 7.05c-.09.23-.14.47-.14.73v2c0 1.1.9 2 2 2h6.31l-.95 4.57-.03.32c0 .41.17.79.44 1.06L9.83 23l6.59-6.59c.36-.36.58-.86.58-1.41V5c0-1.1-.9-2-2-2zm4 0v12h4V3h-4z"/>
            </svg>
          </span>
        );
      default:
        return null;
    }
  };

  // Status icons row - matches DeviceCard
  const getStatusIcons = (device: any) => {
    return (
      <div className="flex items-center gap-2">
        {/* Functional Status - thumbs up/caution/thumbs down */}
        {getFunctionalStatusIcon(device.functionalStatus)}

        {/* Rarity - diamond icon, only shown when rarity is set */}
        {device.rarity && (() => {
          const rarityColors: Record<string, string> = {
            COMMON: 'text-gray-400 dark:text-gray-500',
            UNCOMMON: 'text-yellow-400',
            RARE: 'text-green-500',
            VERY_RARE: 'text-blue-500',
            EXTREMELY_RARE: 'text-purple-500',
          };
          const color = rarityColors[device.rarity] ?? 'text-gray-400';
          const label = t.rarity[device.rarity as keyof typeof t.rarity] ?? device.rarity;
          return (
            <span title={`${t.icons.rarityPrefix}${label}`}>
              <svg className={`w-5 h-5 ${color}`} fill="currentColor" viewBox="0 0 24 24">
                <path d="M5 20v-2h14v2H5zm0-4V9l3 3 4-6 4 6 3-3v7H5z"/>
              </svg>
            </span>
          );
        })()}

        {/* Asset Tagged - tag icon */}
        <span title={device.isAssetTagged ? t.icons.assetTagged : t.icons.notAssetTagged}>
          <svg
            className={`w-5 h-5 ${device.isAssetTagged ? 'text-green-500' : 'text-gray-400 dark:text-gray-500'}`}
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.1 0-2 .9-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58.55 0 1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41 0-.55-.23-1.06-.59-1.42zM5.5 7C4.67 7 4 6.33 4 5.5S4.67 4 5.5 4 7 4.67 7 5.5 6.33 7 5.5 7z"/>
          </svg>
        </span>

        {/* Original Box - box icon */}
        <span title={device.accessories?.some((a: any) => a.name === 'Original Box') ? t.icons.hasOriginalBox : t.icons.noOriginalBox}>
          <svg
            className={`w-5 h-5 ${device.accessories?.some((a: any) => a.name === 'Original Box') ? 'text-green-500' : 'text-gray-400 dark:text-gray-500'}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        </span>

        {/* PRAM Battery - battery icon, only for computers; placeholder for non-computers */}
        {device.category.type === 'COMPUTER' ? (
          <span title={device.isPramBatteryRemoved ? t.icons.pramRemoved : t.icons.pramNotRemoved}>
            <svg 
              className={`w-5 h-5 ${device.isPramBatteryRemoved ? 'text-green-500' : 'text-red-500'}`} 
              fill="currentColor" 
              viewBox="0 0 24 24"
            >
              <path d="M15.67 4H14V2h-4v2H8.33C7.6 4 7 4.6 7 5.33v15.33C7 21.4 7.6 22 8.33 22h7.33c.74 0 1.34-.6 1.34-1.33V5.33C17 4.6 16.4 4 15.67 4z"/>
            </svg>
          </span>
        ) : (
          <span className="w-5 h-5" />
        )}

        {/* Favorite - star icon */}
        <span title={device.isFavorite ? t.icons.favorite : t.icons.notFavorite}>
          <svg
            className={`w-5 h-5 ${device.isFavorite ? 'text-yellow-500' : 'text-gray-400 dark:text-gray-500'}`}
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
          </svg>
        </span>
      </div>
    );
  };

  // Get status display with color - matches DeviceCard
  const getStatusDisplay = (device: any) => {
    switch (device.status) {
      case 'COLLECTION':
        return (
          <span className="text-green-600 dark:text-green-400 font-medium text-xs">
            {t.card.available}
          </span>
        );
      case 'FOR_SALE':
        return (
          <span className="text-orange-600 dark:text-orange-400 font-medium text-xs">
            {t.status.FOR_SALE}
          </span>
        );
      case 'PENDING_SALE':
        return (
          <span className="text-yellow-600 dark:text-yellow-400 font-medium text-xs">
            {t.card.pending}
          </span>
        );
      case 'SOLD':
        return (
          <span className="text-red-600 dark:text-red-400 font-medium text-xs">
            {t.status.SOLD}
          </span>
        );
      case 'DONATED':
        return (
          <span className="text-purple-600 dark:text-purple-400 font-medium text-xs">
            {t.status.DONATED}
          </span>
        );
      case 'IN_REPAIR':
        return (
          <span className="text-teal-600 dark:text-teal-400 font-medium text-xs">
            {t.status.IN_REPAIR}
          </span>
        );
      case 'RETURNED':
        return (
          <span className="text-red-600 dark:text-red-400 font-medium text-xs">
            {t.status.RETURNED}
          </span>
        );
      default:
        return (
          <span className="text-gray-600 dark:text-gray-400 font-medium text-xs">
            {device.status}
          </span>
        );
    }
  };

  return (
    <div className="bg-[var(--card)] rounded border border-[var(--border)] overflow-hidden card-retro">
      <div className="overflow-x-auto device-table-scroll bg-[var(--card)]">
        <table className="w-full">
          <thead className="bg-[var(--muted)]">
            <tr>
              <th
                className={`px-3 py-2 sm:px-4 sm:py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-[var(--button-highlight)] transition-colors ${
                  sortColumn === 'category'
                    ? 'font-bold text-[var(--foreground)] bg-[var(--button-highlight)]'
                    : 'text-[var(--muted-foreground)]'
                }`}
                onClick={() => handleSort('category')}
              >
                <div className="flex items-center gap-1">
                  {t.sort.category}
                  {sortColumn === 'category' && (
                    <span className="text-xs">
                      {sortDirection === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider hidden sm:table-cell">{t.table.thumbnail}</th>
              <th
                className={`px-3 py-2 sm:px-4 sm:py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-[var(--button-highlight)] transition-colors ${
                  sortColumn === 'name'
                    ? 'font-bold text-[var(--foreground)] bg-[var(--button-highlight)]'
                    : 'text-[var(--muted-foreground)]'
                }`}
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center gap-1">
                  {t.sort.name}
                  {sortColumn === 'name' && (
                    <span className="text-xs">
                      {sortDirection === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </th>
              <th
                className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-[var(--button-highlight)] transition-colors hidden sm:table-cell ${
                  sortColumn === 'releaseYear'
                    ? 'font-bold text-[var(--foreground)] bg-[var(--button-highlight)]'
                    : 'text-[var(--muted-foreground)]'
                }`}
                onClick={() => handleSort('releaseYear')}
              >
                <div className="flex items-center gap-1">
                  {t.table.year}
                  {sortColumn === 'releaseYear' && (
                    <span className="text-xs">
                      {sortDirection === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </th>
              <th
                className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-[var(--button-highlight)] transition-colors hidden sm:table-cell ${
                  sortColumn === 'manufacturer'
                    ? 'font-bold text-[var(--foreground)] bg-[var(--button-highlight)]'
                    : 'text-[var(--muted-foreground)]'
                }`}
                onClick={() => handleSort('manufacturer')}
              >
                <div className="flex items-center gap-1">
                  {t.table.manufacturerModel}
                  {sortColumn === 'manufacturer' && (
                    <span className="text-xs">
                      {sortDirection === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </th>
              <th
                className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-[var(--button-highlight)] transition-colors hidden sm:table-cell ${
                  sortColumn === 'dateAcquired'
                    ? 'font-bold text-[var(--foreground)] bg-[var(--button-highlight)]'
                    : 'text-[var(--muted-foreground)]'
                }`}
                onClick={() => handleSort('dateAcquired')}
              >
                <div className="flex items-center gap-1">
                  {t.table.dateAcquired}
                  {sortColumn === 'dateAcquired' && (
                    <span className="text-xs">
                      {sortDirection === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </th>
              <th
                className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-[var(--button-highlight)] transition-colors hidden sm:table-cell ${
                  sortColumn === 'estimatedValue'
                    ? 'font-bold text-[var(--foreground)] bg-[var(--button-highlight)]'
                    : 'text-[var(--muted-foreground)]'
                }`}
                onClick={() => handleSort('estimatedValue')}
              >
                <div className="flex items-center gap-1">
                  {t.table.estValue}
                  {sortColumn === 'estimatedValue' && (
                    <span className="text-xs">
                      {sortDirection === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </th>
              <th
                className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-[var(--button-highlight)] transition-colors hidden sm:table-cell ${
                  sortColumn === 'location'
                    ? 'font-bold text-[var(--foreground)] bg-[var(--button-highlight)]'
                    : 'text-[var(--muted-foreground)]'
                }`}
                onClick={() => handleSort('location')}
              >
                <div className="flex items-center gap-1">
                  {t.table.location}
                  {sortColumn === 'location' && (
                    <span className="text-xs">
                      {sortDirection === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </th>
              <th
                className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-[var(--button-highlight)] transition-colors ${
                  sortColumn === 'available'
                    ? 'font-bold text-[var(--foreground)] bg-[var(--button-highlight)]'
                    : 'text-[var(--muted-foreground)]'
                }`}
                onClick={() => handleSort('available')}
              >
                <div className="flex items-center gap-1">
                  {t.table.availability}
                  {sortColumn === 'available' && (
                    <span className="text-xs">
                      {sortDirection === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider hidden sm:table-cell">{t.table.indicators}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {sortedDevices.map((device) => {
              const thumbImage = pickThumbnail(device.images, isDark) as any;
              const thumbnail = thumbImage?.thumbnailPath || thumbImage?.path;
              return (
                <tr 
                  key={device.id} 
                  className="hover:bg-[var(--muted)] cursor-pointer"
                  onClick={() => router.push(`/devices/${device.id}`)}
                >
                  <td className="px-3 py-2 sm:px-4 sm:py-3">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--muted)] text-[var(--foreground)]">
                      {device.category.name}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <div className="w-12 h-12 bg-[var(--muted)] rounded overflow-hidden">
                      {thumbnail ? (
                        <img
                          src={`${API_BASE_URL}${thumbnail}`}
                          alt={device.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <svg width="16" height="16" className="text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2 sm:px-4 sm:py-3">
                    <Link
                      href={`/devices/${device.id}`}
                      className="text-sm font-medium text-[var(--foreground)] hover:text-[var(--apple-blue)]"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {device.name}
                      {device.additionalName && (
                        <span className="text-[var(--muted-foreground)] block text-xs">
                          {device.additionalName}
                        </span>
                      )}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-[var(--foreground)] hidden sm:table-cell">
                    {device.releaseYear || ''}
                  </td>
                  <td className="px-4 py-3 text-sm text-[var(--foreground)] hidden sm:table-cell">
                    {device.manufacturer} {device.modelNumber}
                  </td>
                  <td className="px-4 py-3 text-sm text-[var(--foreground)] hidden sm:table-cell">
                    {formatDate(device.dateAcquired)}
                  </td>
                  <td className="px-4 py-3 text-sm text-[var(--foreground)] hidden sm:table-cell">
                    {formatCurrency(device.estimatedValue)}
                  </td>
                  <td className="px-4 py-3 text-sm text-[var(--foreground)] hidden sm:table-cell">
                    {device.location || ''}
                  </td>
                  <td className="px-3 py-2 sm:px-4 sm:py-3">
                    {getStatusDisplay(device)}
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    {getStatusIcons(device)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
