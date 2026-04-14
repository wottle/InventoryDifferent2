"use client";

import { useRef, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { API_BASE_URL } from '@/lib/config';
import { useT } from '@/i18n/context';

interface ImportSummary {
  journeysImported: number;
  chaptersImported: number;
  devicesLinked: number;
  devicesSkipped: number;
  quotesImported: number;
}

export default function AdminDataPage() {
  const t = useT();
  const { getAccessToken } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState('');

  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState('');
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleExport = async () => {
    setExporting(true);
    setExportError('');
    try {
      const token = getAccessToken();
      const response = await fetch(`${API_BASE_URL}/showcase/export`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || `Server error ${response.status}`);
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'showcase-export.json';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setExportError(err.message || 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setSelectedFile(file);
    setImportError('');
    setImportSummary(null);
  };

  const handleImport = async () => {
    if (!selectedFile) return;
    setImporting(true);
    setImportError('');
    setImportSummary(null);
    try {
      const text = await selectedFile.text();
      let parsed: unknown;
      try {
        parsed = JSON.parse(text);
      } catch {
        throw new Error(t.adminData.errorInvalidJson);
      }
      const token = getAccessToken();
      const response = await fetch(`${API_BASE_URL}/showcase/import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(parsed),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || `Server error ${response.status}`);
      }
      setImportSummary(result);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      setImportError(err.message || 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-10">
      <div>
        <h1 className="text-2xl font-headline font-bold text-on-surface mb-1">{t.adminData.title}</h1>
        <p className="text-sm text-on-surface-variant">
          {t.adminData.subtitle}
        </p>
      </div>

      {/* Export */}
      <section className="bg-surface-container rounded-2xl p-6 space-y-4">
        <div>
          <h2 className="text-base font-semibold text-on-surface">{t.adminData.exportSection}</h2>
          <p className="text-sm text-on-surface-variant mt-1">
            {t.adminData.exportDesc}
          </p>
        </div>
        {exportError && (
          <p className="text-sm text-error">{exportError}</p>
        )}
        <button
          onClick={handleExport}
          disabled={exporting}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-on-primary text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition"
        >
          {exporting ? (
            <>
              <span className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
              {t.adminData.exporting}
            </>
          ) : (
            t.adminData.exportBtn
          )}
        </button>
      </section>

      {/* Import */}
      <section className="bg-surface-container rounded-2xl p-6 space-y-4">
        <div>
          <h2 className="text-base font-semibold text-on-surface">{t.adminData.importSection}</h2>
          <p className="text-sm text-on-surface-variant mt-1">
            {t.adminData.importDesc}
          </p>
        </div>

        <div className="space-y-3">
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleFileChange}
            className="block text-sm text-on-surface-variant file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-surface-container-high file:text-on-surface file:text-sm file:cursor-pointer hover:file:bg-surface-container-highest"
          />
          <button
            onClick={handleImport}
            disabled={importing || !selectedFile}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-on-primary text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition"
          >
            {importing ? (
              <>
                <span className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
                {t.adminData.importing}
              </>
            ) : (
              t.adminData.importBtn
            )}
          </button>
        </div>

        {importError && (
          <p className="text-sm text-error">{importError}</p>
        )}

        {importSummary && (
          <div className="rounded-lg bg-surface-container-high p-4 space-y-1.5">
            <p className="text-sm font-semibold text-on-surface">{t.adminData.importComplete}</p>
            <ul className="text-sm text-on-surface-variant space-y-0.5">
              <li>{importSummary.journeysImported} {importSummary.journeysImported !== 1 ? t.adminData.journeyPlural : t.adminData.journeySingular} imported</li>
              <li>{importSummary.chaptersImported} {importSummary.chaptersImported !== 1 ? t.adminData.chapterPlural : t.adminData.chapterSingular} imported</li>
              <li>{importSummary.devicesLinked} {importSummary.devicesLinked !== 1 ? t.adminData.deviceLinkedPlural : t.adminData.deviceLinkedSingular}</li>
              {importSummary.devicesSkipped > 0 && (
                <li className="text-on-surface-variant/70">
                  {importSummary.devicesSkipped} {importSummary.devicesSkipped !== 1 ? t.adminData.deviceSkippedPlural : t.adminData.deviceSkippedSingular}
                </li>
              )}
              <li>{importSummary.quotesImported} {importSummary.quotesImported !== 1 ? t.adminData.quotePlural : t.adminData.quoteSingular} imported</li>
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}
