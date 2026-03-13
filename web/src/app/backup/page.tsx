"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@apollo/client";
import gql from "graphql-tag";
import Link from "next/link";
import JSZip from "jszip";
import { API_BASE_URL } from "../../lib/config";
import { DeviceFilterPanel, FilterState, SortColumn } from "../../components/DeviceFilterPanel";
import { LoadingPanel } from "../../components/LoadingPanel";

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
  searchTerm: "",
};

export default function ExportPage() {
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [sortColumn, setSortColumn] = useState<SortColumn>('category');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedDeviceIds, setSelectedDeviceIds] = useState<Set<number>>(new Set());
  const [includeImages, setIncludeImages] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState("");
  
  // Import state
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState("");
  const [importResults, setImportResults] = useState<any>(null);
  const [showImportSection, setShowImportSection] = useState(false);

  const { data, loading, refetch } = useQuery(GET_DEVICES, {
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

  // Get devices to export (selected ones, or all filtered if none selected)
  const devicesToExport = useMemo(() => {
    if (selectedDeviceIds.size === 0) {
      return filteredDevices;
    }
    return filteredDevices.filter((d: any) => selectedDeviceIds.has(d.id));
  }, [filteredDevices, selectedDeviceIds]);

  const toggleDeviceSelection = (deviceId: number) => {
    setSelectedDeviceIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(deviceId)) {
        newSet.delete(deviceId);
      } else {
        newSet.add(deviceId);
      }
      return newSet;
    });
  };

  const selectAll = () => {
    setSelectedDeviceIds(new Set(filteredDevices.map((d: any) => d.id)));
  };

  const selectNone = () => {
    setSelectedDeviceIds(new Set());
  };

  const handleImport = async (file: File) => {
    setIsImporting(true);
    setImportProgress("Uploading file...");
    setImportResults(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      // Start the import - returns immediately with jobId
      const response = await fetch(`${API_BASE_URL}/import`, {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Import failed");
      }

      const { jobId } = result;
      if (!jobId) {
        throw new Error("No job ID returned from server");
      }

      // Poll for progress
      setImportProgress("Extracting ZIP file...");
      
      const pollProgress = async (): Promise<any> => {
        const progressResponse = await fetch(`${API_BASE_URL}/import/progress/${jobId}`);
        
        if (!progressResponse.ok) {
          throw new Error('Failed to get import progress');
        }
        
        const progressData = await progressResponse.json();

        if (progressData.status === 'extracting') {
          setImportProgress("Extracting ZIP file...");
        } else if (progressData.status === 'processing') {
          const percent = progressData.progress || 0;
          const current = progressData.currentDevice || '';
          setImportProgress(`Importing devices: ${percent}% (${progressData.processedDevices}/${progressData.totalDevices})${current ? ` - ${current}` : ''}`);
        } else if (progressData.status === 'complete') {
          const results = progressData.results || [];
          return {
            success: true,
            imported: results.filter((r: any) => r.status === 'success').length,
            failed: results.filter((r: any) => r.status === 'error').length,
            results: results,
          };
        } else if (progressData.status === 'error') {
          throw new Error(progressData.error || 'Import failed');
        }

        // Continue polling with a small delay
        await new Promise(resolve => setTimeout(resolve, 500));
        return pollProgress();
      };

      const finalResult = await pollProgress();
      
      if (!finalResult) {
        throw new Error('Import completed but no results returned');
      }
      
      setImportResults(finalResult);
      setImportProgress("");
      
      // Refresh the device list
      refetch();
    } catch (error: any) {
      console.error("Import failed:", error);
      setImportProgress("");
      setImportResults({ 
        success: false, 
        error: error.message || "Import failed" 
      });
    } finally {
      setIsImporting(false);
    }
  };

  const [compressImages, setCompressImages] = useState(false);
  const [exportParts, setExportParts] = useState<number>(0);
  const [exportJobId, setExportJobId] = useState<string | null>(null);

  const handleExport = async () => {
    if (devicesToExport.length === 0) return;

    setIsExporting(true);
    setExportProgress("Starting export...");
    setExportParts(0);
    setExportJobId(null);

    try {
      // Start server-side export
      const deviceIds = devicesToExport.map((d: any) => d.id);
      
      const startResponse = await fetch(`${API_BASE_URL}/export/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceIds, includeImages, compressImages }),
      });

      if (!startResponse.ok) {
        const error = await startResponse.json();
        throw new Error(error.error || "Failed to start export");
      }

      const { jobId } = await startResponse.json();
      setExportJobId(jobId);

      // Poll for progress
      const pollProgress = async (): Promise<void> => {
        const progressResponse = await fetch(`${API_BASE_URL}/export/progress/${jobId}`);
        
        if (!progressResponse.ok) {
          throw new Error("Failed to get export progress");
        }
        
        const progressData = await progressResponse.json();

        if (progressData.status === 'preparing') {
          setExportProgress("Preparing export...");
        } else if (progressData.status === 'processing') {
          const current = progressData.currentDevice || '';
          if (includeImages && progressData.totalImages > 0) {
            setExportProgress(`Exporting: ${progressData.overallProgress}% - ${current} (${progressData.processedImages}/${progressData.totalImages} images)`);
          } else {
            setExportProgress(`Exporting devices: ${progressData.deviceProgress}% (${progressData.processedDevices}/${progressData.totalDevices})${current ? ` - ${current}` : ''}`);
          }
        } else if (progressData.status === 'zipping') {
          const partInfo = progressData.totalParts > 1 
            ? ` (Part ${progressData.currentPart}/${progressData.totalParts})`
            : '';
          setExportProgress(`Creating ZIP file${partInfo}...`);
        } else if (progressData.status === 'complete') {
          const numParts = progressData.parts || 1;
          setExportParts(numParts);
          
          if (numParts === 1) {
            // Single file - download automatically
            setExportProgress("Downloading...");
            
            const downloadUrl = `${API_BASE_URL}/export/download/${jobId}/1`;
            const link = document.createElement("a");
            link.href = downloadUrl;
            link.download = "";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            setExportProgress("Export complete!");
            setTimeout(() => {
              setIsExporting(false);
              setExportProgress("");
              setExportJobId(null);
            }, 2000);
          } else {
            // Multiple parts - show download buttons
            setExportProgress(`Export complete! ${numParts} parts ready for download.`);
            setIsExporting(false);
          }
          return;
        } else if (progressData.status === 'error') {
          throw new Error(progressData.error || 'Export failed');
        }

        // Continue polling
        await new Promise(resolve => setTimeout(resolve, 500));
        return pollProgress();
      };

      await pollProgress();
    } catch (error: any) {
      console.error("Export failed:", error);
      setExportProgress("Export failed. Please try again.");
      setTimeout(() => {
        setIsExporting(false);
        setExportProgress("");
        setExportJobId(null);
      }, 3000);
    }
  };

  const downloadPart = (partNumber: number) => {
    if (!exportJobId) return;
    const downloadUrl = `${API_BASE_URL}/export/download/${exportJobId}/${partNumber}`;
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = "";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen font-sans">
      <header className="sticky top-0 z-30 bg-[var(--card)] border-b border-[var(--border)] px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl font-light tracking-tight text-[var(--foreground)]">Export Devices</h1>
            <p className="text-sm text-[var(--muted-foreground)]">
              Select devices to export. Data will be bundled into a ZIP file.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsFilterPanelOpen(true)}
              className="btn-retro inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-[var(--foreground)]"
            >
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filter
            </button>
            <Link href="/" className="btn-retro text-sm px-3 py-1.5">
              Back
            </Link>
          </div>
        </div>
      </header>

      <main className="p-4">
        {loading ? (
          <div className="p-8">
            <LoadingPanel title="Loading devices…" subtitle="Getting export tools ready" />
          </div>
        ) : (
          <>
            {/* Import Section */}
            <div className="mb-4 p-4 bg-[var(--card)] rounded border border-[var(--border)] card-retro">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-medium">Import Devices</h2>
                <button
                  onClick={() => setShowImportSection(!showImportSection)}
                  className="text-sm text-[var(--apple-blue)] hover:underline"
                >
                  {showImportSection ? "Hide" : "Show"}
                </button>
              </div>
              
              {showImportSection && (
                <div className="space-y-4">
                  <p className="text-sm text-[var(--muted-foreground)]">
                    Import devices from a previously exported ZIP file. The import will attempt to preserve device IDs for asset tag compatibility.
                  </p>
                  
                  <div className="flex items-center gap-4">
                    <label className="flex-1">
                      <input
                        type="file"
                        accept=".zip"
                        disabled={isImporting}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleImport(file);
                            e.target.value = ""; // Reset input
                          }
                        }}
                        className="block w-full text-sm text-gray-500 dark:text-gray-400
                          file:mr-4 file:py-2 file:px-4
                          file:rounded-lg file:border-0
                          file:text-sm file:font-medium
                          file:bg-blue-50 file:text-blue-700
                          hover:file:bg-blue-100
                          dark:file:bg-blue-900/50 dark:file:text-blue-300
                          disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </label>
                  </div>

                  {isImporting && (
                    <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      {importProgress || "Importing..."}
                    </div>
                  )}

                  {importResults && (
                    <div className={`p-3 rounded-lg ${importResults.success ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'}`}>
                      {importResults.success ? (
                        <div>
                          <p className="font-medium text-green-800 dark:text-green-200">
                            Import Complete: {importResults.imported} device(s) imported successfully
                            {importResults.failed > 0 && `, ${importResults.failed} failed`}
                          </p>
                          {importResults.results && (
                            <div className="mt-2 max-h-40 overflow-y-auto">
                              <table className="w-full text-xs">
                                <thead>
                                  <tr className="text-left text-green-700 dark:text-green-300">
                                    <th className="pr-2">Original ID</th>
                                    <th className="pr-2">New ID</th>
                                    <th className="pr-2">Name</th>
                                    <th>ID Preserved</th>
                                  </tr>
                                </thead>
                                <tbody className="text-green-600 dark:text-green-400">
                                  {importResults.results.filter((r: any) => r.status === 'success').map((r: any, i: number) => (
                                    <tr key={i}>
                                      <td className="pr-2 font-mono">{r.originalId}</td>
                                      <td className="pr-2 font-mono">{r.newId}</td>
                                      <td className="pr-2">{r.name}</td>
                                      <td>{r.idPreserved ? '✓' : '✗'}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-red-800 dark:text-red-200">
                          Import Failed: {importResults.error}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Export Options */}
            <div className="mb-4 p-4 bg-[var(--card)] rounded border border-[var(--border)] card-retro">
              <h2 className="text-lg font-medium mb-3">Export Devices</h2>
              
              <div className="flex flex-wrap items-center gap-4 mb-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeImages}
                    onChange={(e) => setIncludeImages(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Include images</span>
                </label>
                
                {includeImages && (
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={compressImages}
                      onChange={(e) => setCompressImages(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Compress images (reduces size ~50-70%)
                    </span>
                  </label>
                )}
              </div>
              
              <p className="text-xs text-[var(--muted-foreground)] mb-4">
                Large exports (&gt;500MB) will be split into multiple parts for easier downloading and importing.
              </p>

              <div className="flex flex-wrap items-center gap-4">
                <div className="text-sm text-[var(--muted-foreground)]">
                  {selectedDeviceIds.size > 0 ? (
                    <span><strong>{selectedDeviceIds.size}</strong> devices selected for export</span>
                  ) : (
                    <span>All <strong>{filteredDevices.length}</strong> filtered devices will be exported</span>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={selectAll}
                    className="text-sm text-[var(--apple-blue)] hover:underline"
                  >
                    Select All
                  </button>
                  <span className="text-[var(--muted-foreground)]">|</span>
                  <button
                    onClick={selectNone}
                    className="text-sm text-[var(--apple-blue)] hover:underline"
                  >
                    Select None
                  </button>
                </div>

                <button
                  onClick={handleExport}
                  disabled={isExporting || devicesToExport.length === 0}
                  className="ml-auto inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[var(--apple-blue)] hover:brightness-110 disabled:bg-[var(--muted)] disabled:cursor-not-allowed rounded border border-[#007acc]"
                >
                  {isExporting ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Exporting...
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Export ({devicesToExport.length})
                    </>
                  )}
                </button>
              </div>

              {exportProgress && (
                <div className="mt-3 text-sm text-[var(--muted-foreground)]">
                  {exportProgress}
                </div>
              )}
              
              {/* Multi-part download buttons */}
              {exportParts > 1 && exportJobId && (
                <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <p className="text-sm font-medium text-green-800 dark:text-green-200 mb-2">
                    Export split into {exportParts} parts (~500MB each)
                  </p>
                  <p className="text-xs text-green-700 dark:text-green-300 mb-3">
                    Download all parts and import them one at a time.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {Array.from({ length: exportParts }, (_, i) => (
                      <button
                        key={i + 1}
                        onClick={() => downloadPart(i + 1)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded"
                      >
                        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Part {i + 1}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => { setExportParts(0); setExportJobId(null); setExportProgress(""); }}
                    className="mt-3 text-xs text-green-600 dark:text-green-400 hover:underline"
                  >
                    Dismiss
                  </button>
                </div>
              )}
            </div>

            {/* Device selection table */}
            <div className="bg-[var(--card)] rounded border border-[var(--border)] overflow-hidden card-retro">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[var(--muted)]">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase w-12">
                        <input
                          type="checkbox"
                          checked={selectedDeviceIds.size === filteredDevices.length && filteredDevices.length > 0}
                          onChange={(e) => e.target.checked ? selectAll() : selectNone()}
                          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase">ID</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase">Category</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase">Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase">Year</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase">Images</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {filteredDevices.map((device: any) => (
                      <tr 
                        key={device.id} 
                        className={`hover:bg-[var(--muted)] cursor-pointer ${
                          selectedDeviceIds.has(device.id) ? 'bg-[var(--apple-blue)]/10' : ''
                        }`}
                        onClick={() => toggleDeviceSelection(device.id)}
                      >
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedDeviceIds.has(device.id)}
                            onChange={() => toggleDeviceSelection(device.id)}
                            onClick={(e) => e.stopPropagation()}
                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-4 py-3 text-sm font-mono text-[var(--foreground)]">{device.id}</td>
                        <td className="px-4 py-3 text-sm text-[var(--foreground)]">{device.category.name}</td>
                        <td className="px-4 py-3 text-sm text-[var(--foreground)]">
                          {device.name}
                          {device.additionalName && (
                            <span className="text-[var(--muted-foreground)] block text-xs">{device.additionalName}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-[var(--foreground)]">{device.releaseYear || ""}</td>
                        <td className="px-4 py-3 text-sm text-[var(--foreground)]">{device.status.replace("_", " ")}</td>
                        <td className="px-4 py-3 text-sm text-[var(--foreground)]">{device.images?.length || 0}</td>
                        <td className="px-4 py-3 text-sm text-[var(--foreground)]">{device.notes?.length || 0}</td>
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
