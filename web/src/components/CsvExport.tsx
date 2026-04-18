"use client";

import { useMemo, useState } from "react";
import { useT } from "../i18n/context";

// ── Types ─────────────────────────────────────────────────────────────────────

type FieldGroup = 'basics' | 'classification' | 'financial' | 'location' | 'specs' | 'text' | 'relations';

interface FieldDef {
  key: string;
  group: FieldGroup;
  format: (d: any) => string;
}

interface CsvExportProps {
  devices: any[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

// Strip newlines (which break CSV visual alignment) and escape our chosen
// pipe separator so it can't collide with the one we use between joined items.
const sanitize = (s: any): string => {
  if (s == null) return '';
  return String(s).replace(/[\r\n]+/g, ' ').replace(/\|/g, '｜');
};

const isoDate = (d: any): string => {
  if (!d) return '';
  const s = String(d);
  return s.length >= 10 ? s.slice(0, 10) : s;
};

const bool = (b: any): string => (b ? 'true' : 'false');

// Decimal fields come back as strings from the GraphQL server; keep as-is.
const num = (n: any): string => (n == null ? '' : String(n));

// ── Field catalog ─────────────────────────────────────────────────────────────

const FIELDS: FieldDef[] = [
  // Basics
  { key: 'id',             group: 'basics',         format: (d) => num(d.id) },
  { key: 'name',           group: 'basics',         format: (d) => sanitize(d.name) },
  { key: 'additionalName', group: 'basics',         format: (d) => sanitize(d.additionalName) },
  { key: 'manufacturer',   group: 'basics',         format: (d) => sanitize(d.manufacturer) },
  { key: 'modelNumber',    group: 'basics',         format: (d) => sanitize(d.modelNumber) },
  { key: 'serialNumber',   group: 'basics',         format: (d) => sanitize(d.serialNumber) },
  { key: 'releaseYear',    group: 'basics',         format: (d) => num(d.releaseYear) },

  // Classification
  { key: 'category',         group: 'classification', format: (d) => sanitize(d.category?.name) },
  { key: 'status',           group: 'classification', format: (d) => d.status ?? '' },
  { key: 'functionalStatus', group: 'classification', format: (d) => d.functionalStatus ?? '' },
  { key: 'condition',        group: 'classification', format: (d) => d.condition ?? '' },
  { key: 'rarity',           group: 'classification', format: (d) => d.rarity ?? '' },

  // Financial / acquisition
  { key: 'dateAcquired',    group: 'financial', format: (d) => isoDate(d.dateAcquired) },
  { key: 'whereAcquired',   group: 'financial', format: (d) => sanitize(d.whereAcquired) },
  { key: 'priceAcquired',   group: 'financial', format: (d) => num(d.priceAcquired) },
  { key: 'estimatedValue',  group: 'financial', format: (d) => num(d.estimatedValue) },
  { key: 'listPrice',       group: 'financial', format: (d) => num(d.listPrice) },
  { key: 'soldPrice',       group: 'financial', format: (d) => num(d.soldPrice) },
  { key: 'soldDate',        group: 'financial', format: (d) => isoDate(d.soldDate) },

  // Location / flags
  { key: 'location',       group: 'location', format: (d) => sanitize(d.location?.name) },
  { key: 'isAssetTagged',  group: 'location', format: (d) => bool(d.isAssetTagged) },
  { key: 'isFavorite',     group: 'location', format: (d) => bool(d.isFavorite) },
  { key: 'hasOriginalBox', group: 'location', format: (d) => bool(d.hasOriginalBox) },

  // Specs
  { key: 'cpu',                  group: 'specs', format: (d) => sanitize(d.cpu) },
  { key: 'ram',                  group: 'specs', format: (d) => sanitize(d.ram) },
  { key: 'storage',              group: 'specs', format: (d) => sanitize(d.storage) },
  { key: 'graphics',             group: 'specs', format: (d) => sanitize(d.graphics) },
  { key: 'operatingSystem',      group: 'specs', format: (d) => sanitize(d.operatingSystem) },
  { key: 'isWifiEnabled',        group: 'specs', format: (d) => (d.isWifiEnabled == null ? '' : bool(d.isWifiEnabled)) },
  { key: 'isPramBatteryRemoved', group: 'specs', format: (d) => (d.isPramBatteryRemoved == null ? '' : bool(d.isPramBatteryRemoved)) },

  // Text
  { key: 'info',            group: 'text', format: (d) => sanitize(d.info) },
  { key: 'historicalNotes', group: 'text', format: (d) => sanitize(d.historicalNotes) },
  { key: 'externalUrl',     group: 'text', format: (d) => d.externalUrl ?? '' },
  { key: 'lastPowerOnDate', group: 'text', format: (d) => isoDate(d.lastPowerOnDate) },

  // Relations (joined with " | ")
  {
    key: 'notes',
    group: 'relations',
    format: (d) => (d.notes ?? [])
      .map((n: any) => `${isoDate(n.date)}: ${sanitize(n.content)}`)
      .join(' | '),
  },
  {
    key: 'maintenanceTasks',
    group: 'relations',
    format: (d) => (d.maintenanceTasks ?? [])
      .map((t: any) => {
        const date = isoDate(t.dateCompleted);
        const cost = t.cost != null ? ` ($${t.cost})` : '';
        const notes = t.notes ? `: ${sanitize(t.notes)}` : '';
        return `${date} ${sanitize(t.label)}${cost}${notes}`.trim();
      })
      .join(' | '),
  },
  {
    key: 'accessories',
    group: 'relations',
    format: (d) => (d.accessories ?? []).map((a: any) => sanitize(a.name)).join(' | '),
  },
  {
    key: 'links',
    group: 'relations',
    format: (d) => (d.links ?? [])
      .map((l: any) => l.label ? `${sanitize(l.label)}: ${l.url}` : l.url)
      .join(' | '),
  },
  {
    key: 'tags',
    group: 'relations',
    format: (d) => (d.tags ?? []).map((t: any) => sanitize(t.name)).join(' | '),
  },
  {
    key: 'customFields',
    group: 'relations',
    format: (d) => (d.customFieldValues ?? [])
      .map((cfv: any) => `${sanitize(cfv.customFieldName)}: ${sanitize(cfv.value)}`)
      .join(' | '),
  },
  {
    key: 'imageCount',
    group: 'relations',
    format: (d) => num(d.images?.length ?? 0),
  },
];

const FIELD_BY_KEY: Record<string, FieldDef> = Object.fromEntries(FIELDS.map(f => [f.key, f]));

const DEFAULT_SELECTED = new Set<string>([
  'id', 'name', 'additionalName', 'manufacturer', 'releaseYear',
  'category', 'status', 'condition',
  'dateAcquired', 'priceAcquired', 'estimatedValue',
  'serialNumber', 'location',
]);

const DEFAULT_ORDER: string[] = FIELDS.map(f => f.key);

// ── CSV builder ───────────────────────────────────────────────────────────────

function escapeCell(v: string): string {
  if (/[",\r\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}

function buildCsv(devices: any[], orderedKeys: string[], labelFor: (k: string) => string): string {
  const BOM = '\uFEFF';
  const fields = orderedKeys.map(k => FIELD_BY_KEY[k]).filter(Boolean);
  const header = fields.map(f => escapeCell(labelFor(f.key))).join(',');
  const rows = devices.map(d => fields.map(f => escapeCell(f.format(d))).join(','));
  return BOM + [header, ...rows].join('\r\n');
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function CsvExport({ devices }: CsvExportProps) {
  const t = useT();
  const tb = t.pages.backup;
  const tx = (tb as any).csvExport as Record<string, any>;
  const csvFieldLabels = tb.csvFields as Record<string, string>;

  const [show, setShow] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(() => new Set(DEFAULT_SELECTED));
  const [order, setOrder] = useState<string[]>(() => [...DEFAULT_ORDER]);
  const [showPreview, setShowPreview] = useState(false);
  const [dragKey, setDragKey] = useState<string | null>(null);

  const labelFor = (key: string): string => {
    // Prefer csvExport-specific labels (includes relation keys), fall back to
    // the shared csvFields catalog, then the key itself.
    const exportLabels = (tx?.fieldLabels ?? {}) as Record<string, string>;
    return exportLabels[key] ?? csvFieldLabels[key] ?? key;
  };

  const orderedSelectedKeys = useMemo(
    () => order.filter(k => selected.has(k)),
    [order, selected]
  );

  const toggleField = (key: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const selectAll = () => setSelected(new Set(FIELDS.map(f => f.key)));
  const selectNone = () => setSelected(new Set());
  const resetDefaults = () => {
    setSelected(new Set(DEFAULT_SELECTED));
    setOrder([...DEFAULT_ORDER]);
  };

  // Native HTML5 drag reorder. Moves the dragged key to the position of the
  // key it was dropped onto.
  const handleDragStart = (key: string) => (e: React.DragEvent) => {
    setDragKey(key);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (targetKey: string) => (e: React.DragEvent) => {
    e.preventDefault();
    if (!dragKey || dragKey === targetKey) return;
    setOrder(prev => {
      const next = prev.filter(k => k !== dragKey);
      const idx = next.indexOf(targetKey);
      if (idx === -1) return prev;
      next.splice(idx, 0, dragKey);
      return next;
    });
    setDragKey(null);
  };

  const handleDragEnd = () => setDragKey(null);

  const handleDownload = () => {
    if (orderedSelectedKeys.length === 0 || devices.length === 0) return;
    const csv = buildCsv(devices, orderedSelectedKeys, labelFor);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `inventory-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Group fields for visual grouping in the list (using the current ordering)
  const GROUP_KEYS: FieldGroup[] = ['basics', 'classification', 'financial', 'location', 'specs', 'text', 'relations'];

  // Preview: first 5 rows, all fields shown as cells
  const previewDevices = devices.slice(0, 5);

  return (
    <div className="mb-4 p-4 bg-[var(--card)] rounded border border-[var(--border)] card-retro">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-medium">{tx?.title ?? 'Export to CSV'}</h2>
        <button
          onClick={() => setShow(s => !s)}
          className="text-sm text-[var(--apple-blue)] hover:underline"
        >
          {show ? (tx?.toggleHide ?? 'Hide') : (tx?.toggleShow ?? 'Show')}
        </button>
      </div>

      {show && (
        <div className="space-y-4">
          <p className="text-sm text-[var(--muted-foreground)]">
            {tx?.desc ?? 'Export device metadata as CSV. Pick the fields to include, drag to reorder, and download. Images are not included.'}
          </p>

          <p className="text-xs text-[var(--muted-foreground)]">
            {tx?.scopeLabel ?? 'Exporting'} <strong>{devices.length}</strong> {tx?.scopeSuffix ?? 'devices (current filter + selection).'}
          </p>

          {/* Field actions */}
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <button onClick={selectAll}    className="text-[var(--apple-blue)] hover:underline">{tx?.selectAll ?? 'Select all'}</button>
            <span className="text-[var(--muted-foreground)]">|</span>
            <button onClick={selectNone}   className="text-[var(--apple-blue)] hover:underline">{tx?.selectNone ?? 'Select none'}</button>
            <span className="text-[var(--muted-foreground)]">|</span>
            <button onClick={resetDefaults} className="text-[var(--apple-blue)] hover:underline">{tx?.resetDefaults ?? 'Reset to defaults'}</button>
            <span className="ml-auto text-xs text-[var(--muted-foreground)]">
              <strong>{orderedSelectedKeys.length}</strong> / {FIELDS.length} {tx?.fieldsSelectedSuffix ?? 'fields selected'}
            </span>
          </div>

          {/* Reorderable field list, grouped */}
          <div className="rounded border border-[var(--border)] divide-y divide-[var(--border)]">
            {GROUP_KEYS.map(group => {
              const keysInGroup = order.filter(k => FIELD_BY_KEY[k]?.group === group);
              if (keysInGroup.length === 0) return null;
              const groupLabel = (tx?.groups?.[group] as string) ?? group;
              return (
                <div key={group}>
                  <div className="px-3 py-1.5 bg-[var(--muted)] text-xs uppercase tracking-wider text-[var(--muted-foreground)]">
                    {groupLabel}
                  </div>
                  <ul>
                    {keysInGroup.map(key => {
                      const isSelected = selected.has(key);
                      const isDragging = dragKey === key;
                      return (
                        <li
                          key={key}
                          draggable
                          onDragStart={handleDragStart(key)}
                          onDragOver={handleDragOver}
                          onDrop={handleDrop(key)}
                          onDragEnd={handleDragEnd}
                          className={`flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-[var(--muted)] ${isDragging ? 'opacity-40' : ''} ${isSelected ? '' : 'text-[var(--muted-foreground)]'}`}
                          style={{ cursor: 'grab' }}
                        >
                          <span aria-hidden className="select-none text-[var(--muted-foreground)] text-base leading-none">⋮⋮</span>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleField(key)}
                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            onClick={(e) => e.stopPropagation()}
                          />
                          <span className={isSelected ? 'text-[var(--foreground)]' : ''}>
                            {labelFor(key)}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>

          {/* Preview */}
          <div>
            <button
              onClick={() => setShowPreview(p => !p)}
              className="text-sm text-[var(--apple-blue)] hover:underline"
              disabled={orderedSelectedKeys.length === 0 || previewDevices.length === 0}
            >
              {showPreview ? (tx?.hidePreview ?? 'Hide preview') : (tx?.showPreview ?? 'Show preview (first 5 rows)')}
            </button>

            {showPreview && orderedSelectedKeys.length > 0 && previewDevices.length > 0 && (
              <div className="mt-2 overflow-x-auto rounded border border-[var(--border)]">
                <table className="text-xs w-full">
                  <thead className="bg-[var(--muted)]">
                    <tr>
                      {orderedSelectedKeys.map(k => (
                        <th key={k} className="px-2 py-1.5 text-left font-medium text-[var(--muted-foreground)] whitespace-nowrap">
                          {labelFor(k)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {previewDevices.map((d, ri) => (
                      <tr key={ri}>
                        {orderedSelectedKeys.map(k => (
                          <td key={k} className="px-2 py-1.5 text-[var(--foreground)] whitespace-nowrap max-w-[18rem] truncate">
                            {FIELD_BY_KEY[k].format(d)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Download */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleDownload}
              disabled={orderedSelectedKeys.length === 0 || devices.length === 0}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[var(--apple-blue)] hover:brightness-110 disabled:bg-[var(--muted)] disabled:cursor-not-allowed rounded border border-[#007acc]"
            >
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              {tx?.downloadBtn ?? 'Download CSV'} ({devices.length})
            </button>
            {orderedSelectedKeys.length === 0 && (
              <span className="text-xs text-amber-600 dark:text-amber-400">{tx?.pickFieldsHint ?? 'Pick at least one field.'}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
