"use client";

import { useState, useEffect, useRef } from "react";
import { API_BASE_URL } from "../lib/config";
import { useAuth } from "../lib/auth-context";

const DEFAULT_PROMPT =
  "Create a professional product photograph of this vintage computer device on a dark background (#282828) with a 1:1 ratio for square image use. Use studio lighting with soft, even illumination to eliminate harsh shadows. Position the product at a slight 30-degree angle to show dimension. High detail, sharp focus throughout, showing clear material texture. Photorealistic rendering for high-end e-commerce use.";

interface Image {
  id: number;
  path: string;
  thumbnailPath?: string;
  caption?: string;
  isThumbnail: boolean;
}

interface Props {
  deviceId: number;
  images: Image[];
  onClose: () => void;
  onGenerated: () => void;
}

export function GenerateImageModal({ deviceId, images, onClose, onGenerated }: Props) {
  const { getAccessToken } = useAuth();
  const [selectedImageId, setSelectedImageId] = useState<number | null>(
    images.find((i) => i.isThumbnail)?.id ?? images[0]?.id ?? null
  );
  const [useTextOnly, setUseTextOnly] = useState(images.length === 0);
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);

  useEffect(() => {
    fetch(`${API_BASE_URL}/generate-image/config`)
      .then(r => r.json())
      .then(cfg => { if (cfg.defaultPrompt) setPrompt(cfg.defaultPrompt); })
      .catch(() => {});
  }, []);
  const [assignAsThumbnail, setAssignAsThumbnail] = useState(true);
  const [thumbnailMode, setThumbnailMode] = useState<"BOTH" | "LIGHT" | "DARK">("BOTH");
  const [assignAsShopImage, setAssignAsShopImage] = useState(false);
  const [assignAsListingImage, setAssignAsListingImage] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const actionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (done || error) {
      actionsRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [done, error]);

  async function handleGenerate() {
    setIsGenerating(true);
    setError(null);
    setDone(false);

    const token = getAccessToken();
    const body: Record<string, unknown> = {
      deviceId,
      prompt,
      assignAsThumbnail,
      ...(assignAsThumbnail ? { thumbnailMode } : {}),
      assignAsShopImage,
      assignAsListingImage,
    };
    if (!useTextOnly && selectedImageId != null) {
      body.sourceImageId = selectedImageId;
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
        if (res.status === 500 || res.status === 524 || res.status === 502 || res.status === 503) {
          const base = data.error || "The server did not respond in time.";
          throw new Error(`${base} The image may still be generating — wait a moment and refresh the gallery to check.`);
        }
        throw new Error(data.error || `Server error ${res.status}`);
      }

      setDone(true);
      onGenerated();
    } catch (err: any) {
      setError(err?.message || "Generation failed");
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg rounded border border-[var(--border)] bg-[var(--card)] shadow-xl card-retro overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
          <h2 className="text-base font-semibold text-[var(--foreground)]">Generate AI Product Image</h2>
          <button onClick={onClose} className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Reference image picker */}
          {images.length > 0 && (
            <div>
              <p className="text-sm font-medium text-[var(--foreground)] mb-2">Reference photo</p>
              <div className="flex flex-wrap gap-2 mb-2">
                {images.map((img) => (
                  <button
                    key={img.id}
                    type="button"
                    onClick={() => { setSelectedImageId(img.id); setUseTextOnly(false); }}
                    className={`w-16 h-16 rounded border-2 overflow-hidden transition-all ${
                      !useTextOnly && selectedImageId === img.id
                        ? "border-[var(--apple-blue)]"
                        : "border-[var(--border)] opacity-60 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={`${API_BASE_URL}${img.thumbnailPath || img.path}`}
                      alt={img.caption || ""}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setUseTextOnly(true)}
                className={`text-sm px-3 py-1.5 rounded border transition-all ${
                  useTextOnly
                    ? "border-[var(--apple-blue)] text-[var(--apple-blue)]"
                    : "border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                }`}
              >
                Skip — text description only
              </button>
            </div>
          )}

          {/* Prompt */}
          <div>
            <label className="text-sm font-medium text-[var(--foreground)] block mb-1">Prompt</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={5}
              className="w-full rounded border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[var(--apple-blue)] resize-none"
            />
          </div>

          {/* Role assignment */}
          <div>
            <p className="text-sm font-medium text-[var(--foreground)] mb-2">Assign roles</p>
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-sm text-[var(--foreground)] cursor-pointer">
                <input
                  type="checkbox"
                  checked={assignAsThumbnail}
                  onChange={(e) => setAssignAsThumbnail(e.target.checked)}
                  className="rounded"
                />
                Set as thumbnail
              </label>
              {assignAsThumbnail && (
                <div className="ml-6 flex rounded border border-[var(--border)] overflow-hidden text-xs font-medium w-fit">
                  {(["BOTH", "LIGHT", "DARK"] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setThumbnailMode(mode)}
                      className={`px-3 py-1.5 transition-colors ${
                        thumbnailMode === mode
                          ? "bg-[var(--apple-blue)] text-white"
                          : "bg-[var(--background)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                      }${mode !== "DARK" ? " border-r border-[var(--border)]" : ""}`}
                    >
                      {mode === "BOTH" ? "Both" : mode === "LIGHT" ? "Light" : "Dark"}
                    </button>
                  ))}
                </div>
              )}
              {[
                { label: "Set as shop image", value: assignAsShopImage, set: setAssignAsShopImage },
                { label: "Set as listing image", value: assignAsListingImage, set: setAssignAsListingImage },
              ].map(({ label, value, set }) => (
                <label key={label} className="flex items-center gap-2 text-sm text-[var(--foreground)] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={(e) => set(e.target.checked)}
                    className="rounded"
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>

          {/* Actions + result status — kept together so scrollIntoView always shows both */}
          <div ref={actionsRef} className="space-y-3">
            {error && (
              <p className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded px-3 py-2">{error}</p>
            )}
            {done && (
              <p className="text-sm text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 rounded px-3 py-2">
                Image generated and added to the gallery.
              </p>
            )}
            <div className="flex justify-end gap-3">
              <button
                onClick={onClose}
                disabled={isGenerating}
                className="px-4 py-2 text-sm font-medium rounded border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] hover:bg-[var(--muted)] disabled:opacity-50"
              >
                {done ? "Close" : "Cancel"}
              </button>
              <button
                onClick={done ? onClose : handleGenerate}
                disabled={isGenerating || (!done && !prompt.trim())}
                className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded border disabled:opacity-50 disabled:cursor-not-allowed ${
                  done
                    ? "bg-green-600 hover:bg-green-700 border-green-700"
                    : error
                    ? "bg-orange-500 hover:bg-orange-600 border-orange-600"
                    : "bg-[var(--apple-blue)] hover:brightness-110 border-[#007acc]"
                }`}
              >
                {isGenerating ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 100 16v-4l-3 3 3 3v-4a8 8 0 01-8-8z" />
                    </svg>
                    Generating… ~20s
                  </>
                ) : done ? (
                  "✓ Done"
                ) : error ? (
                  "Try Again"
                ) : (
                  "Generate"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
