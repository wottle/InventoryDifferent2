"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@apollo/client";
import gql from "graphql-tag";
import Link from "next/link";
import { DeviceFilterPanel, FilterState, SortColumn } from "../../components/DeviceFilterPanel";
import { LoadingPanel } from "../../components/LoadingPanel";
import { API_BASE_URL } from "../../lib/config";
import { useT } from "../../i18n/context";

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
      location
      info
      isFavorite
      externalUrl
      status
      functionalStatus
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
      operatingSystem
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

const defaultFilters: FilterState = {
  categoryIds: [],
  statuses: [],
  functionalStatuses: [],
  conditions: [],
  rarities: [],
  searchTerm: "",
};

export default function PrintListPage() {
  const t = useT();
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [sortColumn, setSortColumn] = useState<SortColumn>('category');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [showPrintView, setShowPrintView] = useState(false);

  const { data, loading } = useQuery(GET_DEVICES, {
    variables: { where: { deleted: { equals: false } } },
  });
  const { data: categoriesData } = useQuery(GET_CATEGORIES);

  const devices = data?.devices || [];
  const categories = categoriesData?.categories || [];

  // Apply filters
  const filteredDevices = useMemo(() => {
    let result = [...devices];

    if (filters.categoryIds.length > 0) {
      result = result.filter((d: any) => filters.categoryIds.includes(d.category.id));
    }
    if (filters.statuses.length > 0) {
      result = result.filter((d: any) => filters.statuses.includes(d.status));
      
    }
    if (filters.functionalStatuses.length > 0) {
      result = result.filter((d: any) => filters.functionalStatuses.includes(d.functionalStatus));
    }
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      result = result.filter((d: any) => 
        d.name?.toLowerCase().includes(term) ||
        d.additionalName?.toLowerCase().includes(term) ||
        d.manufacturer?.toLowerCase().includes(term) ||
        d.modelNumber?.toLowerCase().includes(term)
      );
    }

    // Sort by device ID
    result.sort((a: any, b: any) => a.id - b.id);

    return result;
  }, [devices, filters]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-US", {
      timeZone: "UTC",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined) return "";
    return `${t.common.currencySymbol}${Number(value).toFixed(2)}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COLLECTION": return "text-green-700";
      case "FOR_SALE": return "text-orange-700";
      case "PENDING_SALE": return "text-yellow-700";
      case "SOLD": return "text-red-700";
      case "DONATED": return "text-purple-700";
      case "IN_REPAIR": return "text-amber-700";
      case "RETURNED": return "text-teal-700";
      default: return "text-gray-700";
    }
  };

  const getFunctionalStatusText = (status: string) => {
    switch (status) {
      case "YES": return t.pages.print.functionalYes;
      case "PARTIAL": return t.pages.print.functionalPartial;
      case "NO": return t.pages.print.functionalNo;
      default: return status;
    }
  };

  if (showPrintView) {
    return (
      <div className="print-view bg-white text-black min-h-screen">
        {/* Print-specific styles */}
        <style jsx global>{`
          @media print {
            body {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .no-print {
              display: none !important;
            }
            .page-break {
              page-break-before: always;
            }
            .avoid-break {
              page-break-inside: avoid;
            }
            @page {
              margin: 0.5in;
            }
          }
          @media screen {
            .print-view {
              max-width: 8.5in;
              margin: 0 auto;
              padding: 0.5in;
            }
          }
        `}</style>

        {/* Back button - hidden when printing */}
        <div className="no-print mb-4 flex gap-2">
          <button
            onClick={() => setShowPrintView(false)}
            className="px-4 py-2 text-sm font-medium bg-gray-200 hover:bg-gray-300 text-gray-800 rounded border border-gray-300"
          >
            {t.pages.print.backToSelection}
          </button>
          <button
            onClick={() => window.print()}
            className="px-4 py-2 text-sm font-medium text-white bg-[var(--apple-blue)] hover:brightness-110 rounded border border-[#007acc]"
          >
            {t.pages.print.printBtn}
          </button>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold mb-4 text-center">{t.pages.print.collectionTitle}</h1>
        <p className="text-sm text-gray-600 text-center mb-6">
          {t.pages.print.generatedOn} {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
          {" • "}{filteredDevices.length} {t.home.devices}
        </p>

        {/* Table of Contents - Summary Table */}
        <div className="mb-8">
          <h2 className="text-lg font-bold mb-2 border-b border-gray-300 pb-1">{t.pages.print.tableOfContents}</h2>
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-2 py-1 text-left">{t.pages.print.idHeader}</th>
                <th className="border border-gray-300 px-2 py-1 text-left">{t.pages.print.categoryHeader}</th>
                <th className="border border-gray-300 px-2 py-1 text-left">{t.pages.print.nameHeader}</th>
                <th className="border border-gray-300 px-2 py-1 text-left">{t.pages.print.yearHeader}</th>
                <th className="border border-gray-300 px-2 py-1 text-left">{t.pages.print.statusHeader}</th>
                <th className="border border-gray-300 px-2 py-1 text-left">{t.pages.print.functionalHeader}</th>
                <th className="border border-gray-300 px-2 py-1 text-right">{t.card.estValue}</th>
              </tr>
            </thead>
            <tbody>
              {filteredDevices.map((device: any) => (
                <tr key={device.id} className="hover:bg-gray-50">
                  <td className="border border-gray-300 px-2 py-1 font-mono">{device.id}</td>
                  <td className="border border-gray-300 px-2 py-1">{device.category.name}</td>
                  <td className="border border-gray-300 px-2 py-1">
                    {device.name}
                    {device.additionalName && <span className="text-gray-500"> ({device.additionalName})</span>}
                  </td>
                  <td className="border border-gray-300 px-2 py-1">{device.releaseYear || ""}</td>
                  <td className={`border border-gray-300 px-2 py-1 ${getStatusColor(device.status)}`}>
                    {(t.status as Record<string, string>)[device.status] ?? device.status.replace("_", " ")}
                  </td>
                  <td className="border border-gray-300 px-2 py-1">{getFunctionalStatusText(device.functionalStatus)}</td>
                  <td className="border border-gray-300 px-2 py-1 text-right">{formatCurrency(device.estimatedValue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Individual Device Pages */}
        {filteredDevices.map((device: any) => (
          <div key={device.id} className="page-break">
            {/* Device ID Header */}
            <div className="flex items-center justify-between border-b-2 border-gray-400 pb-2 mb-4">
              <div className="text-4xl font-bold font-mono text-gray-800">#{device.id}</div>
              <div className={`text-lg font-semibold ${getStatusColor(device.status)}`}>
                {(t.status as Record<string, string>)[device.status] ?? device.status.replace("_", " ")}
              </div>
            </div>

            {/* Device Name and Basic Info */}
            <div className="mb-4">
              <h2 className="text-2xl font-bold">{device.name}</h2>
              {device.additionalName && (
                <p className="text-lg text-gray-600">{device.additionalName}</p>
              )}
              <p className="text-sm text-gray-500">
                {device.category.name}
                {device.releaseYear && ` • ${device.releaseYear}`}
              </p>
            </div>

            {/* Two-column layout for details */}
            <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
              <div className="avoid-break">
                <h3 className="font-bold text-gray-700 border-b border-gray-200 mb-1">{t.pages.print.identificationSection}</h3>
                <table className="w-full">
                  <tbody>
                    <tr><td className="text-gray-500 pr-2">{t.pages.print.manufacturerLabel}</td><td>{device.manufacturer || "—"}</td></tr>
                    <tr><td className="text-gray-500 pr-2">{t.pages.print.modelLabel}</td><td>{device.modelNumber || "—"}</td></tr>
                    <tr><td className="text-gray-500 pr-2">{t.pages.print.serialLabel}</td><td>{device.serialNumber || "—"}</td></tr>
                    <tr><td className="text-gray-500 pr-2">{t.pages.print.locationLabel}</td><td>{device.location || "—"}</td></tr>
                    <tr><td className="text-gray-500 pr-2">{t.pages.print.assetTaggedLabel}</td><td>{device.isAssetTagged ? t.common.yes : t.common.no}</td></tr>
                  </tbody>
                </table>
              </div>

              <div className="avoid-break">
                <h3 className="font-bold text-gray-700 border-b border-gray-200 mb-1">{t.pages.print.statusValueSection}</h3>
                <table className="w-full">
                  <tbody>
                    <tr><td className="text-gray-500 pr-2">{t.pages.print.functionalLabel}</td><td>{getFunctionalStatusText(device.functionalStatus)}</td></tr>
                    <tr><td className="text-gray-500 pr-2">{t.pages.print.originalBoxLabel}</td><td>{device.hasOriginalBox ? t.common.yes : t.common.no}</td></tr>
                    {device.category.type === "COMPUTER" && (
                      <tr><td className="text-gray-500 pr-2">{t.pages.print.pramRemovedLabel}</td><td>{device.isPramBatteryRemoved ? t.common.yes : t.common.no}</td></tr>
                    )}
                    <tr><td className="text-gray-500 pr-2">{t.pages.print.estValueLabel}</td><td>{formatCurrency(device.estimatedValue) || "—"}</td></tr>
                    {device.status === "SOLD" && (
                      <tr><td className="text-gray-500 pr-2">{t.pages.print.soldPriceLabel}</td><td>{formatCurrency(device.soldPrice) || "—"}</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="avoid-break">
                <h3 className="font-bold text-gray-700 border-b border-gray-200 mb-1">{t.pages.print.acquisitionSection}</h3>
                <table className="w-full">
                  <tbody>
                    <tr><td className="text-gray-500 pr-2">{t.pages.print.dateAcquiredLabel}</td><td>{formatDate(device.dateAcquired) || "—"}</td></tr>
                    <tr><td className="text-gray-500 pr-2">{t.pages.print.whereLabel}</td><td>{device.whereAcquired || "—"}</td></tr>
                    <tr><td className="text-gray-500 pr-2">{t.pages.print.pricePaidLabel}</td><td>{formatCurrency(device.priceAcquired) || "—"}</td></tr>
                  </tbody>
                </table>
              </div>

              {device.category.type === "COMPUTER" && (
                <div className="avoid-break">
                  <h3 className="font-bold text-gray-700 border-b border-gray-200 mb-1">{t.pages.print.specificationsSection}</h3>
                  <table className="w-full">
                    <tbody>
                      {device.cpu && <tr><td className="text-gray-500 pr-2">{t.detail.cpu}:</td><td>{device.cpu}</td></tr>}
                      {device.ram && <tr><td className="text-gray-500 pr-2">{t.detail.ram}:</td><td>{device.ram}</td></tr>}
                      {device.graphics && <tr><td className="text-gray-500 pr-2">{t.detail.graphics}:</td><td>{device.graphics}</td></tr>}
                      {device.storage && <tr><td className="text-gray-500 pr-2">{t.detail.storage}:</td><td>{device.storage}</td></tr>}
                      {device.operatingSystem && <tr><td className="text-gray-500 pr-2">{t.pages.print.osLabel}</td><td>{device.operatingSystem}</td></tr>}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Info/Description */}
            {device.info && (
              <div className="mb-4 avoid-break">
                <h3 className="font-bold text-gray-700 border-b border-gray-200 mb-1 text-sm">{t.pages.print.descriptionSection}</h3>
                <p className="text-sm whitespace-pre-wrap">{device.info}</p>
              </div>
            )}

            {/* Tags */}
            {device.tags && device.tags.length > 0 && (
              <div className="mb-4 avoid-break">
                <h3 className="font-bold text-gray-700 border-b border-gray-200 mb-1 text-sm">{t.pages.print.tagsSection}</h3>
                <div className="flex flex-wrap gap-1">
                  {device.tags.map((tag: any) => (
                    <span key={tag.id} className="text-xs bg-gray-200 px-2 py-0.5 rounded">
                      {tag.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Maintenance Tasks */}
            {device.maintenanceTasks && device.maintenanceTasks.length > 0 && (
              <div className="mb-4 avoid-break">
                <h3 className="font-bold text-gray-700 border-b border-gray-200 mb-1 text-sm">{t.pages.print.maintenanceSection}</h3>
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 px-2 py-1 text-left">{t.pages.print.taskHeader}</th>
                      <th className="border border-gray-300 px-2 py-1 text-left">{t.pages.print.dateCompletedHeader}</th>
                      <th className="border border-gray-300 px-2 py-1 text-left">{t.common.notes}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {device.maintenanceTasks.map((task: any) => (
                      <tr key={task.id}>
                        <td className="border border-gray-300 px-2 py-1">{task.label}</td>
                        <td className="border border-gray-300 px-2 py-1">{formatDate(task.dateCompleted)}</td>
                        <td className="border border-gray-300 px-2 py-1">{task.notes || ""}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Notes */}
            {device.notes && device.notes.length > 0 && (
              <div className="mb-4 avoid-break">
                <h3 className="font-bold text-gray-700 border-b border-gray-200 mb-1 text-sm">Notes</h3>
                {device.notes.map((note: any) => (
                  <div key={note.id} className="mb-2 text-sm">
                    <span className="text-gray-500 text-xs">{formatDate(note.date)}</span>
                    <p className="whitespace-pre-wrap">{note.content}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Images */}
            {device.images && device.images.length > 0 && (
              <div className="avoid-break">
                <h3 className="font-bold text-gray-700 border-b border-gray-200 mb-2 text-sm">
                  Images ({device.images.length})
                </h3>
                <div className="grid grid-cols-4 gap-2">
                  {device.images.map((image: any) => (
                    <div key={image.id} className="aspect-square bg-gray-100 overflow-hidden">
                      <img
                        src={`${API_BASE_URL}${image.thumbnailPath || image.path}`}
                        alt={image.caption || device.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  // Selection view
  return (
    <div className="min-h-screen font-sans">
      <header className="sticky top-0 z-30 bg-[var(--card)] border-b border-[var(--border)] px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl font-light tracking-tight text-[var(--foreground)]">{t.pages.print.title}</h1>
            <p className="text-sm text-[var(--muted-foreground)]">{t.pages.print.subtitle}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsFilterPanelOpen(true)}
              className="btn-retro inline-flex items-center gap-2 px-3 py-2 text-sm font-medium"
            >
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              {t.pages.print.filterBtn}
            </button>
            <button
              onClick={() => setShowPrintView(true)}
              disabled={filteredDevices.length === 0}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[var(--apple-blue)] hover:brightness-110 disabled:bg-[var(--muted)] disabled:cursor-not-allowed rounded border border-[#007acc]"
            >
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              {t.pages.print.generateBtn} ({filteredDevices.length})
            </button>
            <Link href="/" className="btn-retro px-3 py-2 text-sm font-medium">
              {t.common.back}
            </Link>
          </div>
        </div>
      </header>

      <main className="p-4">
        {loading ? (
          <div className="p-8">
            <LoadingPanel title={t.pages.print.loading} subtitle={t.pages.print.loadingSubtitle} />
          </div>
        ) : (
          <>
            <div className="mb-4 text-sm text-[var(--muted-foreground)]">
              {filteredDevices.length} {t.pages.print.selectionInfoOf} {devices.length} {t.pages.print.selectionInfoDesc}
            </div>

            {/* Preview table */}
            <div className="bg-[var(--card)] rounded border border-[var(--border)] overflow-hidden card-retro">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[var(--muted)]">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase">{t.pages.print.idHeader}</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase">{t.pages.print.categoryHeader}</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase">{t.pages.print.nameHeader}</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase">{t.pages.print.yearHeader}</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase">{t.pages.print.statusHeader}</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase">{t.pages.print.imagesHeader}</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase">{t.common.notes}</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase">{t.pages.print.tasksHeader}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {filteredDevices.map((device: any) => (
                      <tr key={device.id} className="hover:bg-[var(--muted)]">
                        <td className="px-4 py-3 text-sm font-mono text-[var(--foreground)]">{device.id}</td>
                        <td className="px-4 py-3 text-sm text-[var(--foreground)]">{device.category.name}</td>
                        <td className="px-4 py-3 text-sm text-[var(--foreground)]">
                          {device.name}
                          {device.additionalName && (
                            <span className="text-[var(--muted-foreground)] block text-xs">{device.additionalName}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-[var(--foreground)]">{device.releaseYear || ""}</td>
                        <td className="px-4 py-3 text-sm text-[var(--foreground)]">{(t.status as Record<string, string>)[device.status] ?? device.status.replace("_", " ")}</td>
                        <td className="px-4 py-3 text-sm text-[var(--foreground)]">{device.images?.length || 0}</td>
                        <td className="px-4 py-3 text-sm text-[var(--foreground)]">{device.notes?.length || 0}</td>
                        <td className="px-4 py-3 text-sm text-[var(--foreground)]">{device.maintenanceTasks?.length || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>

      <DeviceFilterPanel
        isOpen={isFilterPanelOpen}
        onClose={() => setIsFilterPanelOpen(false)}
        filters={filters}
        onFiltersChange={setFilters}
        categories={categories}
        sortColumn={sortColumn}
        sortDirection={sortDirection}
        onSortChange={(col, dir) => { setSortColumn(col); setSortDirection(dir); }}
      />
    </div>
  );
}
