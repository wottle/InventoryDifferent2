"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery } from "@apollo/client";
import gql from "graphql-tag";
import Link from "next/link";
import { API_BASE_URL } from "../../lib/config";
import { useAuth } from "../../lib/auth-context";
import { LoadingPanel } from "../../components/LoadingPanel";

const DEFAULT_PROMPT =
  "Create a professional product photograph of this vintage computer device on a dark background (#282828) with a 1:1 ratio for square image use. Use studio lighting with soft, even illumination to eliminate harsh shadows. Position the product at a slight 30-degree angle to show dimension. High detail, sharp focus throughout, showing clear material texture. Photorealistic rendering for high-end e-commerce use.";

const GET_DEVICES = gql`
  query GetDevicesForGenerate {
    devices(where: { deleted: { equals: false } }) {
      id
      name
      manufacturer
      releaseYear
      status
      images {
        id
        path
        thumbnailPath
        isThumbnail
        isShopImage
      }
    }
  }
`;

type DeviceStatus = "idle" | "generating" | "done" | "skipped" | "error";

interface DeviceRow {
  id: number;
  name: string;
  manufacturer?: string;
  releaseYear?: number;
  status: string;
  images: { id: number; path: string; thumbnailPath?: string; isThumbnail: boolean; isShopImage: boolean }[];
}

export default function GenerateImagesPage() {
  const { isAuthenticated, isLoading: authLoading, getAccessToken } = useAuth();
  const { data, loading: devicesLoading } = useQuery(GET_DEVICES);

  const [openaiEnabled, setOpenaiEnabled] = useState<boolean | null>(null);
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
  const [assignAsThumbnail, setAssignAsThumbnail] = useState(true);
  const [assignAsShopImage, setAssignAsShopImage] = useState(true);
  const [assignAsListingImage, setAssignAsListingImage] = useState(false);
  const [filter, setFilter] = useState<"all" | "missing_any" | "missing_shop">("all");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [statuses, setStatuses] = useState<Map<number, DeviceStatus>>(new Map());
  const [statusMessages, setStatusMessages] = useState<Map<number, string>>(new Map());
  const [isRunning, setIsRunning] = useState(false);
  const cancelRef = useRef(false);

  useEffect(() => {
    fetch(`${API_BASE_URL}/generate-image/config`)
      .then((r) => r.json())
      .then((d) => setOpenaiEnabled(!!d.enabled))
      .catch(() => setOpenaiEnabled(false));
  }, []);

  const devices: DeviceRow[] = data?.devices ?? [];

  const filteredDevices = devices.filter((d) => {
    if (filter === "missing_any") return d.images.length === 0;
    if (filter === "missing_shop") return !d.images.some((i) => i.isShopImage);
    return true;
  });

  function toggleSelect(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function selectAll() {
    setSelected(new Set(filteredDevices.map((d) => d.id)));
  }

  function deselectAll() {
    setSelected(new Set());
  }

  function pickSourceImage(device: DeviceRow): number | undefined {
    const thumb = device.images.find((i) => i.isThumbnail);
    if (thumb) return thumb.id;
    if (device.images.length > 0) return device.images[0].id;
    return undefined;
  }

  async function handleGenerate() {
    if (selected.size === 0) return;
    cancelRef.current = false;
    setIsRunning(true);

    const token = getAccessToken();
    const toProcess = [...selected];

    for (const deviceId of toProcess) {
      if (cancelRef.current) break;

      const device = devices.find((d) => d.id === deviceId);
      if (!device) continue;

      setStatuses((prev) => new Map(prev).set(deviceId, "generating"));
      setStatusMessages((prev) => new Map(prev).set(deviceId, ""));

      const sourceImageId = pickSourceImage(device);

      const body: Record<string, unknown> = {
        deviceId,
        prompt,
        assignAsThumbnail,
        assignAsShopImage,
        assignAsListingImage,
      };
      if (sourceImageId != null) {
        body.sourceImageId = sourceImageId;
      }

      try {
        const res = await fetch(`${API_BASE_URL}/generate-image`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || `Server error ${res.status}`);
        }

        setStatuses((prev) => new Map(prev).set(deviceId, "done"));
      } catch (err: any) {
        setStatuses((prev) => new Map(prev).set(deviceId, "error"));
        setStatusMessages((prev) => new Map(prev).set(deviceId, err?.message || "Failed"));
      }
    }

    setIsRunning(false);
  }

  function handleCancel() {
    cancelRef.current = true;
  }

  if (authLoading || openaiEnabled === null) {
    return <LoadingPanel title="Loading…" />;
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[var(--muted-foreground)] mb-4">Authentication required.</p>
          <Link href="/login" className="text-[var(--apple-blue)] hover:underline">Log In</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link href="/" className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-2xl font-light tracking-tight text-[var(--foreground)]">AI Product Images</h1>
        </div>

        {!openaiEnabled && (
          <div className="rounded border border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 px-4 py-3 text-sm text-yellow-800 dark:text-yellow-200">
            <strong>OPENAI_API_KEY not configured.</strong> Set the <code>OPENAI_API_KEY</code> environment variable on the API container to enable image generation.
          </div>
        )}

        {/* Settings */}
        <div className="rounded border border-[var(--border)] bg-[var(--card)] p-5 space-y-4 card-retro">
          <h2 className="text-sm font-semibold text-[var(--foreground)]">Settings</h2>
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Prompt (applied to all)</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              disabled={isRunning}
              className="w-full rounded border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[var(--apple-blue)] resize-none disabled:opacity-60"
            />
          </div>
          <div className="flex flex-wrap gap-4">
            {[
              { label: "Set as thumbnail", value: assignAsThumbnail, set: setAssignAsThumbnail },
              { label: "Set as shop image", value: assignAsShopImage, set: setAssignAsShopImage },
              { label: "Set as listing image", value: assignAsListingImage, set: setAssignAsListingImage },
            ].map(({ label, value, set }) => (
              <label key={label} className="flex items-center gap-2 text-sm text-[var(--foreground)] cursor-pointer">
                <input
                  type="checkbox"
                  checked={value}
                  onChange={(e) => set(e.target.checked)}
                  disabled={isRunning}
                  className="rounded"
                />
                {label}
              </label>
            ))}
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 border-b border-[var(--border)]">
          {(["all", "missing_any", "missing_shop"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 text-sm transition-colors ${
                filter === f
                  ? "border-b-2 border-[var(--apple-blue)] text-[var(--apple-blue)] font-medium"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              }`}
            >
              {f === "all" && "All Devices"}
              {f === "missing_any" && "Missing Any Image"}
              {f === "missing_shop" && "Missing Shop Image"}
            </button>
          ))}
        </div>

        {/* Select controls + Generate button */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex gap-3">
            <button onClick={selectAll} className="text-sm text-[var(--apple-blue)] hover:underline">Select all</button>
            <button onClick={deselectAll} className="text-sm text-[var(--muted-foreground)] hover:underline">Deselect all</button>
            <span className="text-sm text-[var(--muted-foreground)]">{selected.size} selected</span>
          </div>
          <div className="flex gap-2">
            {isRunning && (
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-sm font-medium rounded border border-red-400 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                Cancel
              </button>
            )}
            <button
              onClick={handleGenerate}
              disabled={!openaiEnabled || isRunning || selected.size === 0}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[var(--apple-blue)] hover:brightness-110 rounded border border-[#007acc] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRunning ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 100 16v-4l-3 3 3 3v-4a8 8 0 01-8-8z" />
                  </svg>
                  Generating…
                </>
              ) : (
                "Generate Selected"
              )}
            </button>
          </div>
        </div>

        {/* Device table */}
        {devicesLoading ? (
          <LoadingPanel title="Loading devices…" />
        ) : (
          <div className="rounded border border-[var(--border)] overflow-hidden card-retro">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[var(--muted)] text-left">
                  <th className="w-10 px-4 py-2">
                    <input
                      type="checkbox"
                      checked={selected.size === filteredDevices.length && filteredDevices.length > 0}
                      onChange={(e) => e.target.checked ? selectAll() : deselectAll()}
                      className="rounded"
                    />
                  </th>
                  <th className="w-14 px-2 py-2" />
                  <th className="px-4 py-2 text-[var(--muted-foreground)] font-medium">Device</th>
                  <th className="px-4 py-2 text-[var(--muted-foreground)] font-medium text-center">Images</th>
                  <th className="px-4 py-2 text-[var(--muted-foreground)] font-medium text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredDevices.map((device) => {
                  const rowStatus = statuses.get(device.id);
                  const errMsg = statusMessages.get(device.id);
                  const thumbImg = device.images.find((i) => i.isThumbnail) || device.images[0];

                  return (
                    <tr
                      key={device.id}
                      className="border-t border-[var(--border)] hover:bg-[var(--muted)] transition-colors"
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selected.has(device.id)}
                          onChange={() => toggleSelect(device.id)}
                          disabled={isRunning}
                          className="rounded"
                        />
                      </td>
                      <td className="px-2 py-3">
                        {thumbImg ? (
                          <img
                            src={`${API_BASE_URL}${thumbImg.thumbnailPath || thumbImg.path}`}
                            alt=""
                            className="w-10 h-10 object-cover rounded border border-[var(--border)]"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded border border-[var(--border)] bg-[var(--muted)] flex items-center justify-center text-[var(--muted-foreground)]">
                            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/devices/${device.id}`}
                          className="font-medium text-[var(--foreground)] hover:text-[var(--apple-blue)]"
                        >
                          {device.name}
                        </Link>
                        {(device.manufacturer || device.releaseYear) && (
                          <p className="text-xs text-[var(--muted-foreground)]">
                            {[device.manufacturer, device.releaseYear].filter(Boolean).join(" · ")}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center text-[var(--muted-foreground)]">
                        {device.images.length}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {!rowStatus && <span className="text-[var(--muted-foreground)]">—</span>}
                        {rowStatus === "generating" && (
                          <span className="inline-flex items-center gap-1 text-[var(--apple-blue)]">
                            <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 100 16v-4l-3 3 3 3v-4a8 8 0 01-8-8z" />
                            </svg>
                            Generating
                          </span>
                        )}
                        {rowStatus === "done" && <span className="text-green-600">✓ Done</span>}
                        {rowStatus === "skipped" && <span className="text-[var(--muted-foreground)]">⚠ Skipped</span>}
                        {rowStatus === "error" && (
                          <span className="text-red-600" title={errMsg || ""}>✗ Error</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {filteredDevices.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-[var(--muted-foreground)]">
                      No devices match the current filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
