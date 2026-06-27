'use client';

import { useState, useEffect } from 'react';
import { EXTERNAL_TEMPLATES_API_URL } from './config';

export interface TemplateData {
  id: number | string;
  source: 'local' | 'remote';
  name: string;
  additionalName?: string | null;
  manufacturer?: string | null;
  modelNumber?: string | null;
  releaseYear?: number | null;
  estimatedValue?: number | null;
  cpuType?: string | null;
  cpuSpeed?: string | null;
  ram?: string | null;
  graphicsChip?: string | null;
  screenSize?: string | null;
  displayType?: string | null;
  displayVariant?: string | null;
  nativeResolution?: string | null;
  storage?: string | null;
  operatingSystem?: string | null;
  categoryId?: number | null;
  isWifiEnabled?: boolean | null;
  rarity?: string | null;
  historicalNotes?: string | null;
  externalUrl?: string | null;
  externalLinkLabel?: string | null;
}

interface RemoteTemplate {
  id: string | number;
  status?: string;
  name: string;
  additionalName?: string | null;
  manufacturer?: string | null;
  modelNumber?: string | null;
  releaseYear?: number | null;
  estimatedValue?: number | null;
  cpuType?: string | null;
  cpuSpeed?: string | null;
  ram?: string | null;
  graphicsChip?: string | null;
  screenSize?: string | null;
  displayType?: string | null;
  displayVariant?: string | null;
  nativeResolution?: string | null;
  storage?: string | null;
  operatingSystem?: string | null;
  categoryId?: number | null;
  isWifiEnabled?: boolean | null;
  rarity?: string | null;
  historicalNotes?: string | null;
  externalUrl?: string | null;
  externalLinkLabel?: string | null;
}

interface SyncResponse {
  version: string;
}

interface TemplatesPageResponse {
  templates: RemoteTemplate[];
  nextCursor: string | null;
  total: number;
}

// Bump when cache schema or deduplication logic changes to force a client-side refetch.
const CACHE_SCHEMA_VERSION = '2';

function mapRemoteTemplate(remote: RemoteTemplate): TemplateData {
  return {
    id: 'ext_' + remote.id,
    source: 'remote',
    name: remote.name,
    additionalName: remote.additionalName ?? null,
    manufacturer: remote.manufacturer ?? null,
    modelNumber: remote.modelNumber ?? null,
    releaseYear: remote.releaseYear ?? null,
    estimatedValue: remote.estimatedValue ?? null,
    cpuType: remote.cpuType ?? null,
    cpuSpeed: remote.cpuSpeed ?? null,
    ram: remote.ram ?? null,
    graphicsChip: remote.graphicsChip ?? null,
    screenSize: remote.screenSize ?? null,
    displayType: remote.displayType ?? null,
    displayVariant: remote.displayVariant ?? null,
    nativeResolution: remote.nativeResolution ?? null,
    storage: remote.storage ?? null,
    operatingSystem: remote.operatingSystem ?? null,
    categoryId: remote.categoryId ?? null,
    isWifiEnabled: remote.isWifiEnabled ?? null,
    rarity: remote.rarity ?? null,
    historicalNotes: remote.historicalNotes ?? null,
    externalUrl: remote.externalUrl ?? null,
    externalLinkLabel: remote.externalLinkLabel ?? null,
  };
}

export function useExternalTemplates(enabled: boolean): {
  templates: TemplateData[];
  loading: boolean;
  error: string | null;
} {
  const [templates, setTemplates] = useState<TemplateData[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        // Step 1: check version
        const syncRes = await fetch(`${EXTERNAL_TEMPLATES_API_URL}/sync`);
        if (!syncRes.ok) throw new Error(`Sync check failed: ${syncRes.status}`);
        const { version } = (await syncRes.json()) as SyncResponse;

        const cachedVersion = localStorage.getItem('extTemplates_version');
        const cachedSchema = localStorage.getItem('extTemplates_schema');
        const cachedAt = parseInt(localStorage.getItem('extTemplates_cachedAt') ?? '0', 10);
        const cacheAge = Date.now() - cachedAt;
        const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

        if (cachedVersion === version && cachedSchema === CACHE_SCHEMA_VERSION && cacheAge < CACHE_TTL_MS) {
          // Cache hit — return stored data
          const raw = localStorage.getItem('extTemplates_cache');
          let cached: TemplateData[] | null = null;
          try {
            if (raw) cached = JSON.parse(raw) as TemplateData[];
          } catch {}
          if (cached) {
            if (!cancelled) {
              setTemplates(cached);
              setLoading(false);
            }
            return;
          }
          // fall through to full fetch
        }

        // Cache miss — paginate through the catalog
        const allRemote: RemoteTemplate[] = [];
        let cursor: string | null = null;
        let pageCount = 0;
        const MAX_PAGES = 50;

        do {
          const url = new URL(`${EXTERNAL_TEMPLATES_API_URL}/templates`);
          url.searchParams.set('sort', 'name');
          url.searchParams.set('limit', '200');
          if (cursor !== null) url.searchParams.set('cursor', cursor);

          const pageRes = await fetch(url.toString());
          if (!pageRes.ok) throw new Error(`Templates fetch failed: ${pageRes.status}`);
          const page = (await pageRes.json()) as TemplatesPageResponse;

          allRemote.push(...page.templates);
          cursor = page.nextCursor;
          pageCount++;
        } while (cursor !== null && pageCount < MAX_PAGES);

        // Filter to published (or no status)
        const published = allRemote.filter(
          (t) => t.status === undefined || t.status === null || t.status === 'PUBLISHED'
        );

        // Deduplicate within remote dataset by name + additionalName
        const seen = new Set<string>();
        const deduped = published.filter((t) => {
          const key = `${t.name.toLowerCase()}||${(t.additionalName ?? '').toLowerCase()}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });

        // Map to TemplateData
        const mapped = deduped.map(mapRemoteTemplate);

        // Persist to localStorage
        try {
          localStorage.setItem('extTemplates_version', version);
          localStorage.setItem('extTemplates_schema', CACHE_SCHEMA_VERSION);
          localStorage.setItem('extTemplates_cache', JSON.stringify(mapped));
          localStorage.setItem('extTemplates_cachedAt', String(Date.now()));
        } catch {}

        if (!cancelled) {
          setTemplates(mapped);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load external templates');
          setTemplates([]);
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return { templates, loading, error };
}
