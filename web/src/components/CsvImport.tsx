"use client";

import { useState } from "react";
import { useMutation } from "@apollo/client";
import gql from "graphql-tag";
import Papa from "papaparse";
import { useT } from "../i18n/context";

const CREATE_DEVICE = gql`
  mutation CreateDevice($input: DeviceCreateInput!) {
    createDevice(input: $input) {
      id
    }
  }
`;

// ── Enum helpers ──────────────────────────────────────────────────────────────

const STATUS_VALUES = ['COLLECTION','FOR_SALE','PENDING_SALE','SOLD','DONATED','IN_REPAIR','REPAIRED','RETURNED'];
const FUNCTIONAL_VALUES = ['YES','PARTIAL','NO'];
const CONDITION_VALUES = ['NEW','LIKE_NEW','VERY_GOOD','GOOD','ACCEPTABLE','FOR_PARTS'];
const RARITY_VALUES = ['COMMON','UNCOMMON','RARE','VERY_RARE','EXTREMELY_RARE'];

// Extra aliases for status values users commonly write
const STATUS_ALIASES: Record<string, string> = {
  'IN COLLECTION': 'COLLECTION',
  'FOR SALE': 'FOR_SALE',
  'PENDING': 'PENDING_SALE',
  'PENDING SALE': 'PENDING_SALE',
  'IN REPAIR': 'IN_REPAIR',
};

function normalizeEnum(raw: string, valid: string[], aliases?: Record<string, string>): string | undefined {
  const key = raw.trim().toUpperCase().replace(/[\s-]+/g, '_');
  if (valid.includes(key)) return key;
  if (aliases && aliases[raw.trim().toUpperCase()]) return aliases[raw.trim().toUpperCase()];
  // Also try with spaces normalized to underscores on aliases
  const spaceKey = raw.trim().toUpperCase();
  if (aliases && aliases[spaceKey]) return aliases[spaceKey];
  return undefined;
}

function parseBool(raw: string): boolean {
  return /^(true|1|yes|x)$/i.test(raw.trim());
}

function parseDate(raw: string): string | undefined {
  if (!raw.trim()) return undefined;
  const d = new Date(raw.trim());
  return isNaN(d.getTime()) ? undefined : d.toISOString();
}

function parseFloat2(raw: string): number | undefined {
  const v = parseFloat(raw.replace(/[^0-9.\-]/g, ''));
  return isNaN(v) ? undefined : v;
}

function parseInt2(raw: string): number | undefined {
  const v = parseInt(raw.trim(), 10);
  return isNaN(v) ? undefined : v;
}

// ── Field definitions ─────────────────────────────────────────────────────────

type FieldKey =
  | 'name' | 'additionalName' | 'manufacturer' | 'modelNumber' | 'serialNumber'
  | 'releaseYear' | 'info' | 'category'
  | 'status' | 'functionalStatus' | 'condition' | 'rarity'
  | 'isFavorite' | 'isAssetTagged'
  | 'dateAcquired' | 'whereAcquired' | 'priceAcquired' | 'estimatedValue'
  | 'listPrice' | 'soldPrice' | 'soldDate'
  | 'cpu' | 'ram' | 'graphics' | 'storage' | 'operatingSystem'
  | 'isWifiEnabled' | 'isPramBatteryRemoved' | 'lastPowerOnDate';

const FIELD_KEYS: FieldKey[] = [
  'name','additionalName','manufacturer','modelNumber','serialNumber',
  'releaseYear','info','category',
  'status','functionalStatus','condition','rarity',
  'isFavorite','isAssetTagged',
  'dateAcquired','whereAcquired','priceAcquired','estimatedValue',
  'listPrice','soldPrice','soldDate',
  'cpu','ram','graphics','storage','operatingSystem',
  'isWifiEnabled','isPramBatteryRemoved','lastPowerOnDate',
];

// ── Types ─────────────────────────────────────────────────────────────────────

interface Category {
  id: number;
  name: string;
  type: string;
}

interface ParsedCsv {
  columns: string[];   // display names for each column (header or "Column N")
  rows: string[][];    // raw data rows (no header)
}

interface RowResult {
  rowIndex: number;
  name: string;
  status: 'success' | 'error';
  error?: string;
}

type Step = 'select' | 'map' | 'importing' | 'results';

interface CsvImportProps {
  categories: Category[];
  onImportComplete?: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function CsvImport({ categories, onImportComplete }: CsvImportProps) {
  const t = useT();
  const tb = t.pages.backup;
  const [show, setShow] = useState(false);
  const [step, setStep] = useState<Step>('select');
  const [hasHeader, setHasHeader] = useState(true);
  const [parsed, setParsed] = useState<ParsedCsv | null>(null);
  // mapping[colIndex] = fieldKey | '' (ignore)
  const [mapping, setMapping] = useState<(FieldKey | '')[]>([]);
  const [defaultCategoryId, setDefaultCategoryId] = useState<number | ''>('');
  const [results, setResults] = useState<RowResult[]>([]);
  const [importedCount, setImportedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const [createDevice] = useMutation(CREATE_DEVICE);

  // Category lookup map
  const categoryMap = new Map<string, number>(
    categories.map(c => [c.name.toLowerCase(), c.id])
  );

  // ── Step 1: file selection ────────────────────────────────────────────────

  const handleFile = (file: File) => {
    Papa.parse(file, {
      header: false,
      skipEmptyLines: true,
      complete: (result) => {
        const raw = result.data as string[][];
        if (!raw.length) return;

        let columns: string[];
        let rows: string[][];

        if (hasHeader && raw.length > 0) {
          columns = raw[0].map((h, i) => (h.trim() || `Column ${i + 1}`));
          rows = raw.slice(1);
        } else {
          const colCount = Math.max(...raw.map(r => r.length));
          columns = Array.from({ length: colCount }, (_, i) => `Column ${i + 1}`);
          rows = raw;
        }

        // Auto-detect mapping by matching header text against field labels (case-insensitive)
        const fieldLabels: Record<string, FieldKey> = {};
        (FIELD_KEYS as string[]).forEach(k => {
          const label = (tb.csvFields as Record<string, string>)[k]?.toLowerCase();
          if (label) fieldLabels[label] = k as FieldKey;
        });

        const autoMapping: (FieldKey | '')[] = columns.map(col => {
          const lower = col.toLowerCase().trim();
          return fieldLabels[lower] ?? '';
        });

        setParsed({ columns, rows });
        setMapping(autoMapping);
        setStep('map');
      },
    });
  };

  // ── Step 3: import rows ───────────────────────────────────────────────────

  const runImport = async () => {
    if (!parsed) return;
    setStep('importing');
    setResults([]);
    setImportedCount(0);
    setTotalCount(parsed.rows.length);

    const rowResults: RowResult[] = [];

    for (let i = 0; i < parsed.rows.length; i++) {
      const row = parsed.rows[i];
      const rowNum = i + 1;

      try {
        const input: Record<string, any> = {};

        for (let ci = 0; ci < mapping.length; ci++) {
          const field = mapping[ci];
          if (!field) continue;
          const raw = (row[ci] ?? '').trim();
          if (!raw) continue;

          switch (field) {
            case 'name': input.name = raw; break;
            case 'additionalName': input.additionalName = raw; break;
            case 'manufacturer': input.manufacturer = raw; break;
            case 'modelNumber': input.modelNumber = raw; break;
            case 'serialNumber': input.serialNumber = raw; break;
            case 'info': input.info = raw; break;
            case 'whereAcquired': input.whereAcquired = raw; break;
            case 'cpu': input.cpu = raw; break;
            case 'ram': input.ram = raw; break;
            case 'graphics': input.graphics = raw; break;
            case 'storage': input.storage = raw; break;
            case 'operatingSystem': input.operatingSystem = raw; break;

            case 'releaseYear': {
              const v = parseInt2(raw);
              if (v !== undefined) input.releaseYear = v;
              break;
            }
            case 'priceAcquired': {
              const v = parseFloat2(raw);
              if (v !== undefined) input.priceAcquired = v;
              break;
            }
            case 'estimatedValue': {
              const v = parseFloat2(raw);
              if (v !== undefined) input.estimatedValue = v;
              break;
            }
            case 'listPrice': {
              const v = parseFloat2(raw);
              if (v !== undefined) input.listPrice = v;
              break;
            }
            case 'soldPrice': {
              const v = parseFloat2(raw);
              if (v !== undefined) input.soldPrice = v;
              break;
            }

            case 'dateAcquired': {
              const v = parseDate(raw);
              if (v) input.dateAcquired = v;
              break;
            }
            case 'soldDate': {
              const v = parseDate(raw);
              if (v) input.soldDate = v;
              break;
            }
            case 'lastPowerOnDate': {
              const v = parseDate(raw);
              if (v) input.lastPowerOnDate = v;
              break;
            }

            case 'status': {
              const v = normalizeEnum(raw, STATUS_VALUES, STATUS_ALIASES);
              if (v) input.status = v;
              break;
            }
            case 'functionalStatus': {
              const v = normalizeEnum(raw, FUNCTIONAL_VALUES);
              if (v) input.functionalStatus = v;
              break;
            }
            case 'condition': {
              const v = normalizeEnum(raw, CONDITION_VALUES);
              if (v) input.condition = v;
              break;
            }
            case 'rarity': {
              const v = normalizeEnum(raw, RARITY_VALUES);
              if (v) input.rarity = v;
              break;
            }

            case 'isFavorite': input.isFavorite = parseBool(raw); break;
            case 'isAssetTagged': input.isAssetTagged = parseBool(raw); break;
            case 'isWifiEnabled': input.isWifiEnabled = parseBool(raw); break;
            case 'isPramBatteryRemoved': input.isPramBatteryRemoved = parseBool(raw); break;

            case 'category': {
              const catId = categoryMap.get(raw.toLowerCase());
              if (catId !== undefined) {
                input.categoryId = catId;
              }
              // else: fall through to default category below
              break;
            }
          }
        }

        // Resolve categoryId
        if (!input.categoryId) {
          if (defaultCategoryId !== '') {
            input.categoryId = defaultCategoryId;
          } else {
            throw new Error('Unknown category');
          }
        }

        if (!input.name) {
          throw new Error('Missing name');
        }

        await createDevice({ variables: { input } });

        rowResults.push({ rowIndex: rowNum, name: input.name ?? `Row ${rowNum}`, status: 'success' });
        setImportedCount(c => c + 1);
      } catch (err: any) {
        rowResults.push({
          rowIndex: rowNum,
          name: (row[mapping.indexOf('name')] ?? '').trim() || `Row ${rowNum}`,
          status: 'error',
          error: err?.message ?? 'Unknown error',
        });
      }

      setResults([...rowResults]);
    }

    setStep('results');
    onImportComplete?.();
  };

  // ── Validation ────────────────────────────────────────────────────────────

  const nameMapped = mapping.includes('name');
  const canImport = nameMapped && defaultCategoryId !== '';

  // ── Reset ─────────────────────────────────────────────────────────────────

  const reset = () => {
    setStep('select');
    setParsed(null);
    setMapping([]);
    setResults([]);
    setImportedCount(0);
    setTotalCount(0);
  };

  // ── Render ────────────────────────────────────────────────────────────────

  const previewRows = parsed?.rows.slice(0, 5) ?? [];
  const successCount = results.filter(r => r.status === 'success').length;
  const errorCount   = results.filter(r => r.status === 'error').length;

  return (
    <div className="mb-4 p-4 bg-[var(--card)] rounded border border-[var(--border)] card-retro">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-medium">{tb.csvImportTitle}</h2>
        <button
          onClick={() => setShow(s => !s)}
          className="text-sm text-[var(--apple-blue)] hover:underline"
        >
          {show ? tb.csvImportToggleHide : tb.csvImportToggleShow}
        </button>
      </div>

      {show && (
        <div className="space-y-4">
          {/* ── Step 1: select file ── */}
          {step === 'select' && (
            <div className="space-y-3">
              <p className="text-sm text-[var(--muted-foreground)]">{tb.csvImportDesc}</p>
              <label className="flex items-center gap-2 cursor-pointer w-fit">
                <input
                  type="checkbox"
                  checked={hasHeader}
                  onChange={e => setHasHeader(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-[var(--foreground)]">{tb.csvHasHeader}</span>
              </label>
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) { handleFile(file); e.target.value = ''; }
                }}
                className="block w-full text-sm text-gray-500 dark:text-gray-400
                  file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0
                  file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100 dark:file:bg-blue-900/50 dark:file:text-blue-300"
              />
            </div>
          )}

          {/* ── Step 2: map columns ── */}
          {step === 'map' && parsed && (
            <div className="space-y-4">
              <h3 className="font-medium text-[var(--foreground)]">{tb.csvStep2Title}</h3>

              {/* Preview table */}
              <div>
                <p className="text-xs text-[var(--muted-foreground)] mb-2">{tb.csvPreviewTitle}</p>
                <div className="overflow-x-auto rounded border border-[var(--border)]">
                  <table className="text-xs w-full">
                    <thead className="bg-[var(--muted)]">
                      <tr>
                        {parsed.columns.map((col, ci) => (
                          <th key={ci} className="px-2 py-1.5 text-left font-medium text-[var(--muted-foreground)] whitespace-nowrap">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                      {previewRows.map((row, ri) => (
                        <tr key={ri}>
                          {parsed.columns.map((_, ci) => (
                            <td key={ci} className="px-2 py-1.5 text-[var(--foreground)] whitespace-nowrap max-w-[12rem] truncate">
                              {row[ci] ?? ''}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Column mapping dropdowns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {parsed.columns.map((col, ci) => (
                  <div key={ci} className="flex items-center gap-2">
                    <span className="text-xs text-[var(--muted-foreground)] w-28 shrink-0 truncate" title={col}>{col}</span>
                    <span className="text-xs text-[var(--muted-foreground)]">→</span>
                    <select
                      value={mapping[ci] ?? ''}
                      onChange={e => {
                        const next = [...mapping];
                        next[ci] = e.target.value as FieldKey | '';
                        setMapping(next);
                      }}
                      className="input-retro flex-1 text-xs px-2 py-1"
                    >
                      <option value="">{tb.csvIgnoreColumn}</option>
                      {FIELD_KEYS.map(fk => (
                        <option key={fk} value={fk}>
                          {(tb.csvFields as Record<string, string>)[fk]}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>

              {/* Default category */}
              <div className="space-y-1">
                <label className="block text-sm font-medium text-[var(--foreground)]">
                  {tb.csvDefaultCategory}
                </label>
                <p className="text-xs text-[var(--muted-foreground)]">{tb.csvDefaultCategoryNote}</p>
                <select
                  value={defaultCategoryId}
                  onChange={e => setDefaultCategoryId(e.target.value === '' ? '' : Number(e.target.value))}
                  className="input-retro text-sm px-3 py-2 w-full sm:w-64"
                >
                  <option value="">{tb.csvSelectCategory}</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Validation hints */}
              {!nameMapped && (
                <p className="text-xs text-amber-600 dark:text-amber-400">{tb.csvNameRequired}</p>
              )}
              {defaultCategoryId === '' && (
                <p className="text-xs text-amber-600 dark:text-amber-400">{tb.csvCategoryRequired}</p>
              )}

              <div className="flex gap-2">
                <button onClick={reset} className="btn-retro text-sm px-3 py-1.5">
                  {tb.csvBackBtn}
                </button>
                <button
                  onClick={runImport}
                  disabled={!canImport}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[var(--apple-blue)] hover:brightness-110 disabled:bg-[var(--muted)] disabled:cursor-not-allowed rounded border border-[#007acc]"
                >
                  {tb.csvImportBtn} ({parsed.rows.length})
                </button>
              </div>
            </div>
          )}

          {/* ── Step 3a: importing (live progress) ── */}
          {step === 'importing' && (
            <div className="flex items-center gap-3 text-sm text-[var(--muted-foreground)]">
              <svg className="animate-spin h-4 w-4 shrink-0" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              {tb.csvImportingProgress} {importedCount}/{totalCount}
            </div>
          )}

          {/* ── Step 3b: results ── */}
          {step === 'results' && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-[var(--foreground)]">
                {successCount} {tb.csvImportSuccessCount}
                {errorCount > 0 && `, ${errorCount} ${tb.csvImportErrorCount}`}
              </p>

              {results.length > 0 && (
                <div className="max-h-60 overflow-y-auto rounded border border-[var(--border)]">
                  <table className="w-full text-xs">
                    <thead className="bg-[var(--muted)] sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left text-[var(--muted-foreground)]">{tb.csvResultRow}</th>
                        <th className="px-3 py-2 text-left text-[var(--muted-foreground)]">{t.common.name}</th>
                        <th className="px-3 py-2 text-left text-[var(--muted-foreground)]">{tb.csvResultStatus}</th>
                        <th className="px-3 py-2 text-left text-[var(--muted-foreground)]">{tb.csvResultError}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                      {results.map((r, i) => (
                        <tr key={i} className={r.status === 'error' ? 'bg-red-50 dark:bg-red-900/10' : ''}>
                          <td className="px-3 py-1.5 font-mono text-[var(--muted-foreground)]">{r.rowIndex}</td>
                          <td className="px-3 py-1.5 text-[var(--foreground)]">{r.name}</td>
                          <td className="px-3 py-1.5">
                            {r.status === 'success'
                              ? <span className="text-green-600 dark:text-green-400">✓</span>
                              : <span className="text-red-600 dark:text-red-400">✗</span>}
                          </td>
                          <td className="px-3 py-1.5 text-red-600 dark:text-red-400">{r.error ?? ''}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <button onClick={reset} className="btn-retro text-sm px-3 py-1.5">
                {tb.csvImportAgainBtn}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
