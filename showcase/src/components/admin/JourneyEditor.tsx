"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@apollo/client';
import {
  CREATE_JOURNEY,
  UPDATE_JOURNEY,
  UPSERT_CHAPTER,
  DELETE_CHAPTER,
  UPSERT_SHOWCASE_DEVICE,
  REMOVE_SHOWCASE_DEVICE,
  SEARCH_DEVICES_FOR_SHOWCASE,
  GET_ALL_JOURNEYS_FOR_EDIT,
} from '@/lib/queries';

// ─── Types ────────────────────────────────────────────────────────────────────

interface DeviceImage {
  thumbnailPath: string | null;
  isThumbnail: boolean;
  thumbnailMode: string | null;
}

interface DeviceRef {
  id: number;
  name: string;
  additionalName: string | null;
  manufacturer: string | null;
  releaseYear: number | null;
  images: DeviceImage[];
}

interface ShowcaseDevice {
  id: string;
  curatorNote: string | null;
  sortOrder: number;
  isFeatured: boolean;
  device: DeviceRef;
}

interface Chapter {
  id: string;
  title: string;
  description: string;
  sortOrder: number;
  devices: ShowcaseDevice[];
}

export interface JourneyData {
  id: string;
  title: string;
  slug: string;
  description: string;
  published: boolean;
  sortOrder: number;
  coverImagePath: string | null;
  chapters: Chapter[];
}

// Local chapter state (may not yet have a server id)
interface LocalChapter {
  id: string | null; // null if not yet saved
  tempId: string;    // local key
  title: string;
  description: string;
  sortOrder: number;
  devices: ShowcaseDevice[];
  isSaving: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

let tempIdCounter = 0;
function makeTempId() {
  return `__tmp_${++tempIdCounter}`;
}

function generateSlug(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// Pick the best thumbnail using LIGHT → DARK → BOTH → first priority,
// mirroring the pickThumbnail logic used on public showcase pages.
function pickAdminThumbnail(images: DeviceImage[]): string | null {
  if (!images || images.length === 0) return null;
  const thumbs = images.filter((i) => i.isThumbnail);
  const candidates = thumbs.length > 0 ? thumbs : images;
  const pick =
    candidates.find((i) => i.thumbnailMode === 'LIGHT') ??
    candidates.find((i) => i.thumbnailMode === 'DARK') ??
    candidates.find((i) => i.thumbnailMode === 'BOTH') ??
    candidates[0];
  return pick?.thumbnailPath ?? null;
}

// ─── Device Search Modal ──────────────────────────────────────────────────────

interface DeviceSearchModalProps {
  chapterId: string;
  existingDeviceIds: number[];
  onAdd: (sd: ShowcaseDevice) => void;
  onClose: () => void;
}

function DeviceSearchModal({ chapterId, existingDeviceIds, onAdd, onClose }: DeviceSearchModalProps) {
  const [search, setSearch] = useState('');
  const [upsertShowcaseDevice] = useMutation(UPSERT_SHOWCASE_DEVICE);
  const [adding, setAdding] = useState<number | null>(null);

  const { data, loading } = useQuery<{ devices: DeviceRef[] }>(SEARCH_DEVICES_FOR_SHOWCASE);

  const allDevices = data?.devices ?? [];
  const filtered = allDevices.filter((d) => {
    if (existingDeviceIds.includes(d.id)) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      d.name.toLowerCase().includes(q) ||
      (d.additionalName ?? '').toLowerCase().includes(q) ||
      (d.manufacturer ?? '').toLowerCase().includes(q) ||
      String(d.releaseYear ?? '').includes(q)
    );
  });

  async function handleAdd(device: DeviceRef) {
    setAdding(device.id);
    try {
      const { data: res } = await upsertShowcaseDevice({
        variables: {
          input: {
            chapterId,
            deviceId: device.id,
            sortOrder: 0,
            isFeatured: false,
            curatorNote: '',
          },
        },
      });
      if (res?.upsertShowcaseDevice) {
        onAdd(res.upsertShowcaseDevice);
      }
    } finally {
      setAdding(null);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant/30">
          <h3 className="font-semibold text-on-surface">Add Device</h3>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container-low transition text-lg"
          >
            ×
          </button>
        </div>

        {/* Search */}
        <div className="px-5 py-3 border-b border-outline-variant/20">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, manufacturer, year..."
            className="w-full px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface-container-low text-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-primary"
            autoFocus
          />
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto px-3 py-2">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          {!loading && filtered.length === 0 && (
            <p className="text-center text-sm text-outline py-8">No devices found.</p>
          )}
          {filtered.map((device) => (
            <button
              key={device.id}
              onClick={() => handleAdd(device)}
              disabled={adding === device.id}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-surface-container-low transition text-left group"
            >
              {/* Thumbnail */}
              <div className="w-9 h-9 rounded-md bg-surface-container flex-shrink-0 overflow-hidden flex items-center justify-center">
                {pickAdminThumbnail(device.images) ? (
                  <img
                    src={pickAdminThumbnail(device.images) ?? ''}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-lg">🖥</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-on-surface truncate">
                  {device.name}{device.additionalName ? ` — ${device.additionalName}` : ''}
                </p>
                <p className="text-xs text-outline truncate">
                  {[device.manufacturer, device.releaseYear].filter(Boolean).join(' · ')}
                </p>
              </div>
              {adding === device.id ? (
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin flex-shrink-0" />
              ) : (
                <span className="text-xs text-primary opacity-0 group-hover:opacity-100 transition flex-shrink-0">
                  Add
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Chapter Card ─────────────────────────────────────────────────────────────

interface ChapterCardProps {
  chapter: LocalChapter;
  index: number;
  journeyId: string;
  onUpdate: (tempId: string, updates: Partial<LocalChapter>) => void;
  onDelete: (tempId: string) => void;
  onDeviceAdd: (tempId: string, sd: ShowcaseDevice) => void;
  onDeviceUpdate: (chapterTempId: string, sdId: string, updates: Partial<ShowcaseDevice>) => void;
  onDeviceRemove: (chapterTempId: string, sdId: string) => void;
  onDeviceReorder: (chapterTempId: string, sdId: string, direction: 'up' | 'down') => void;
}

function ChapterCard({
  chapter,
  index,
  journeyId,
  onUpdate,
  onDelete,
  onDeviceAdd,
  onDeviceUpdate,
  onDeviceRemove,
  onDeviceReorder,
}: ChapterCardProps) {
  const [showDeviceModal, setShowDeviceModal] = useState(false);
  const [upsertChapter] = useMutation(UPSERT_CHAPTER);
  const [deleteChapter] = useMutation(DELETE_CHAPTER);
  const [upsertShowcaseDevice] = useMutation(UPSERT_SHOWCASE_DEVICE);
  const [removeShowcaseDevice] = useMutation(REMOVE_SHOWCASE_DEVICE);
  const [isDeleting, setIsDeleting] = useState(false);

  const saveChapter = useCallback(async () => {
    if (!chapter.title.trim()) return;
    onUpdate(chapter.tempId, { isSaving: true });
    try {
      const { data } = await upsertChapter({
        variables: {
          input: {
            ...(chapter.id ? { id: chapter.id } : {}),
            journeyId,
            title: chapter.title,
            description: chapter.description,
            sortOrder: chapter.sortOrder,
          },
        },
      });
      if (data?.upsertChapter) {
        onUpdate(chapter.tempId, { id: data.upsertChapter.id, isSaving: false });
      }
    } catch {
      onUpdate(chapter.tempId, { isSaving: false });
    }
  }, [chapter, journeyId, upsertChapter, onUpdate]);

  const handleDelete = async () => {
    if (!window.confirm(`Delete chapter "${chapter.title}"? This will also remove all devices in it.`)) return;
    setIsDeleting(true);
    try {
      if (chapter.id) {
        await deleteChapter({ variables: { id: chapter.id } });
      }
      onDelete(chapter.tempId);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeviceNoteBlur = async (sd: ShowcaseDevice, newNote: string) => {
    if (!sd.id || !chapter.id) return;
    try {
      await upsertShowcaseDevice({
        variables: {
          input: {
            id: sd.id,
            chapterId: chapter.id,
            deviceId: sd.device.id,
            curatorNote: newNote,
            sortOrder: sd.sortOrder,
            isFeatured: sd.isFeatured,
          },
        },
      });
      onDeviceUpdate(chapter.tempId, sd.id, { curatorNote: newNote });
    } catch (err) {
      console.error('Failed to save curator note:', err);
    }
  };

  const handleToggleFeatured = async (sd: ShowcaseDevice) => {
    if (!sd.id || !chapter.id) return;
    const newFeatured = !sd.isFeatured;
    try {
      await upsertShowcaseDevice({
        variables: {
          input: {
            id: sd.id,
            chapterId: chapter.id,
            deviceId: sd.device.id,
            curatorNote: sd.curatorNote ?? '',
            sortOrder: sd.sortOrder,
            isFeatured: newFeatured,
          },
        },
      });
      onDeviceUpdate(chapter.tempId, sd.id, { isFeatured: newFeatured });
    } catch (err) {
      console.error('Failed to toggle featured state:', err);
    }
  };

  const handleRemoveDevice = async (sd: ShowcaseDevice) => {
    if (!sd.id) return;
    if (!window.confirm(`Remove "${sd.device.name}" from this chapter?`)) return;
    await removeShowcaseDevice({ variables: { id: sd.id } });
    onDeviceRemove(chapter.tempId, sd.id);
  };

  const sortedDevices = [...chapter.devices].sort((a, b) => a.sortOrder - b.sortOrder);
  const existingDeviceIds = chapter.devices.map((sd) => sd.device.id);

  return (
    <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden border border-outline-variant/20">
      {/* Chapter header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-outline-variant/20">
        {/* Number badge */}
        <div className="w-6 h-6 rounded-full bg-primary text-on-primary text-xs font-bold flex items-center justify-center flex-shrink-0">
          {index + 1}
        </div>

        {/* Title input */}
        <input
          type="text"
          value={chapter.title}
          onChange={(e) => onUpdate(chapter.tempId, { title: e.target.value })}
          onBlur={saveChapter}
          placeholder="Chapter title"
          className="flex-1 font-semibold text-sm text-on-surface bg-transparent border-none outline-none placeholder:text-outline focus:ring-0 min-w-0"
        />

        {/* Device count */}
        <span className="text-xs text-outline flex-shrink-0">
          {chapter.devices.length} {chapter.devices.length === 1 ? 'device' : 'devices'}
        </span>

        {/* Saving indicator */}
        {chapter.isSaving && (
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin flex-shrink-0" />
        )}

        {/* Delete button */}
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="w-7 h-7 flex items-center justify-center rounded-lg bg-surface-container text-on-surface-variant hover:bg-error/10 hover:text-error transition text-sm flex-shrink-0"
          title="Delete chapter"
        >
          🗑
        </button>
      </div>

      {/* Description */}
      <div className="px-5 pt-3 pb-2">
        <textarea
          value={chapter.description}
          onChange={(e) => onUpdate(chapter.tempId, { description: e.target.value })}
          onBlur={saveChapter}
          placeholder="Chapter description (optional)"
          rows={2}
          className="w-full text-sm text-on-surface-variant bg-transparent border-none outline-none resize-none placeholder:text-outline focus:ring-0"
        />
      </div>

      {/* Devices */}
      <div className="px-5 pb-5 flex flex-col gap-2">
        {sortedDevices.map((sd, idx) => (
          <DeviceRow
            key={sd.id}
            sd={sd}
            isFirst={idx === 0}
            isLast={idx === sortedDevices.length - 1}
            onNoteBlur={(note) => handleDeviceNoteBlur(sd, note)}
            onToggleFeatured={() => handleToggleFeatured(sd)}
            onRemove={() => handleRemoveDevice(sd)}
            onMoveUp={() => onDeviceReorder(chapter.tempId, sd.id, 'up')}
            onMoveDown={() => onDeviceReorder(chapter.tempId, sd.id, 'down')}
          />
        ))}

        {/* Add device row */}
        {chapter.id ? (
          <button
            onClick={() => setShowDeviceModal(true)}
            className="flex items-center gap-2 px-3 py-2.5 rounded-lg border-2 border-dashed border-outline-variant/40 text-outline text-sm hover:border-primary hover:text-primary transition w-full"
          >
            <span className="text-base leading-none">+</span>
            Add device to this chapter
          </button>
        ) : (
          <p className="text-xs text-outline italic text-center py-1">Save chapter title to add devices</p>
        )}
      </div>

      {/* Device search modal */}
      {showDeviceModal && chapter.id && (
        <DeviceSearchModal
          chapterId={chapter.id}
          existingDeviceIds={existingDeviceIds}
          onAdd={(sd) => {
            onDeviceAdd(chapter.tempId, sd);
            setShowDeviceModal(false);
          }}
          onClose={() => setShowDeviceModal(false)}
        />
      )}
    </div>
  );
}

// ─── Device Row ───────────────────────────────────────────────────────────────

interface DeviceRowProps {
  sd: ShowcaseDevice;
  isFirst: boolean;
  isLast: boolean;
  onNoteBlur: (note: string) => void;
  onToggleFeatured: () => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

function DeviceRow({ sd, isFirst, isLast, onNoteBlur, onToggleFeatured, onRemove, onMoveUp, onMoveDown }: DeviceRowProps) {
  const [note, setNote] = useState(sd.curatorNote ?? '');

  useEffect(() => {
    setNote(sd.curatorNote ?? '');
  }, [sd.curatorNote]);

  const thumbUrl = pickAdminThumbnail(sd.device.images);

  return (
    <div className="flex items-start gap-3 px-3 py-2.5 rounded-lg bg-surface-container">
      {/* Thumbnail */}
      <div className="w-10 h-10 rounded-md flex-shrink-0 bg-surface-container-low overflow-hidden flex items-center justify-center">
        {thumbUrl ? (
          <img src={thumbUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="text-xl">🖥</span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-semibold text-on-surface truncate">
            {sd.device.name}{sd.device.additionalName ? ` — ${sd.device.additionalName}` : ''}
          </p>
          {sd.isFeatured && <span className="text-amber-500 text-xs leading-none">★</span>}
        </div>
        <p className="text-xs text-outline truncate">
          {[sd.device.manufacturer, sd.device.releaseYear].filter(Boolean).join(' · ')}
        </p>
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onBlur={() => onNoteBlur(note)}
          placeholder="Curator note (optional)"
          className="mt-1 w-full text-xs text-primary bg-transparent border-none outline-none placeholder:text-outline/60 focus:ring-0 italic"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 flex-shrink-0 mt-0.5">
        {/* Reorder */}
        <div className="flex flex-col gap-0.5">
          <button
            onClick={onMoveUp}
            disabled={isFirst}
            title="Move up"
            className="w-6 h-5 flex items-center justify-center rounded text-outline bg-surface-container-low hover:bg-surface-container hover:text-on-surface transition disabled:opacity-20 disabled:pointer-events-none text-[10px] leading-none"
          >
            ▲
          </button>
          <button
            onClick={onMoveDown}
            disabled={isLast}
            title="Move down"
            className="w-6 h-5 flex items-center justify-center rounded text-outline bg-surface-container-low hover:bg-surface-container hover:text-on-surface transition disabled:opacity-20 disabled:pointer-events-none text-[10px] leading-none"
          >
            ▼
          </button>
        </div>
        <button
          onClick={onToggleFeatured}
          title={sd.isFeatured ? 'Unfeature' : 'Feature'}
          className={`w-7 h-7 flex items-center justify-center rounded-lg transition text-sm ${
            sd.isFeatured
              ? 'text-amber-500 bg-amber-50 hover:bg-amber-100'
              : 'text-outline bg-surface-container-low hover:bg-surface-container'
          }`}
        >
          ★
        </button>
        <button
          onClick={onRemove}
          title="Remove device"
          className="w-7 h-7 flex items-center justify-center rounded-lg text-on-surface-variant bg-surface-container-low hover:bg-error/10 hover:text-error transition text-sm"
        >
          ×
        </button>
      </div>
    </div>
  );
}

// ─── Main Editor ──────────────────────────────────────────────────────────────

interface JourneyEditorProps {
  journey: JourneyData | null;
}

export default function JourneyEditor({ journey }: JourneyEditorProps) {
  const router = useRouter();
  const isNew = journey === null;

  // Journey-level state
  const [title, setTitle] = useState(journey?.title ?? '');
  const [slug, setSlug] = useState(journey?.slug ?? '');
  const [description, setDescription] = useState(journey?.description ?? '');
  const [coverImagePath, setCoverImagePath] = useState<string | null>(journey?.coverImagePath ?? null);
  const [published, setPublished] = useState(journey?.published ?? false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(!isNew);

  // Chapters local state
  const [chapters, setChapters] = useState<LocalChapter[]>(() => {
    if (!journey) return [];
    return (journey.chapters ?? []).map((c) => ({
      id: c.id,
      tempId: makeTempId(),
      title: c.title,
      description: c.description,
      sortOrder: c.sortOrder,
      devices: c.devices,
      isSaving: false,
    }));
  });

  const [createJourney] = useMutation(CREATE_JOURNEY);
  const [updateJourney] = useMutation(UPDATE_JOURNEY, {
    refetchQueries: [{ query: GET_ALL_JOURNEYS_FOR_EDIT }],
  });

  // Auto-generate slug when title changes on new journeys
  useEffect(() => {
    if (isNew && !slugManuallyEdited) {
      setSlug(generateSlug(title));
    }
  }, [title, isNew, slugManuallyEdited]);

  // Stats
  const totalDevices = chapters.reduce((acc, c) => acc + c.devices.length, 0);
  const totalFeatured = chapters.reduce(
    (acc, c) => acc + c.devices.filter((d) => d.isFeatured).length,
    0
  );

  // Cover image upload
  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const token = typeof window !== 'undefined' ? localStorage.getItem('showcase_access_token') : null;
      const deviceId = journey?.id ? `showcase-journey-${journey.id}` : 'showcase-journey-new';
      const res = await fetch(`/upload?deviceId=${deviceId}`, {
        method: 'POST',
        body: formData,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
      const json = await res.json() as { path: string };
      const relativePath = json.path.replace(/^\/uploads\//, '');
      setCoverImagePath(relativePath);
    } catch {
      // Upload failed silently — user can retry
    } finally {
      setUploadingCover(false);
    }
  };

  // Save journey metadata
  const handleSave = async () => {
    if (!title.trim() || !slug.trim()) {
      alert('Title and slug are required.');
      return;
    }
    setIsSaving(true);
    try {
      if (isNew) {
        const { data } = await createJourney({
          variables: {
            input: {
              title: title.trim(),
              slug: slug.trim(),
              description: description.trim(),
              coverImagePath: coverImagePath || null,
              published,
              sortOrder: 0,
            },
          },
        });
        if (data?.createJourney?.id) {
          router.push(`/admin/journeys/${data.createJourney.id}`);
        }
      } else {
        await updateJourney({
          variables: {
            id: journey!.id,
            input: {
              title: title.trim(),
              slug: slug.trim(),
              description: description.trim(),
              coverImagePath: coverImagePath || null,
              published,
              sortOrder: journey!.sortOrder,
            },
          },
        });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleTogglePublish = async () => {
    if (!journey || isSaving) return;
    const newPublished = !published;
    try {
      await updateJourney({
        variables: {
          id: journey.id,
          input: {
            title: title.trim(),
            slug: slug.trim(),
            description: description.trim(),
            coverImagePath: coverImagePath || null,
            published: newPublished,
            sortOrder: journey.sortOrder,
          },
        },
      });
      setPublished(newPublished);
    } catch (err) {
      console.error('Failed to update published state:', err);
    }
  };

  // Chapter management
  const handleAddChapter = () => {
    setChapters((prev) => [
      ...prev,
      {
        id: null,
        tempId: makeTempId(),
        title: '',
        description: '',
        sortOrder: prev.length,
        devices: [],
        isSaving: false,
      },
    ]);
  };

  const handleUpdateChapter = (tempId: string, updates: Partial<LocalChapter>) => {
    setChapters((prev) =>
      prev.map((c) => (c.tempId === tempId ? { ...c, ...updates } : c))
    );
  };

  const handleDeleteChapter = (tempId: string) => {
    setChapters((prev) => prev.filter((c) => c.tempId !== tempId));
  };

  const handleDeviceAdd = (chapterTempId: string, sd: ShowcaseDevice) => {
    setChapters((prev) =>
      prev.map((c) =>
        c.tempId === chapterTempId ? { ...c, devices: [...c.devices, sd] } : c
      )
    );
  };

  const handleDeviceUpdate = (
    chapterTempId: string,
    sdId: string,
    updates: Partial<ShowcaseDevice>
  ) => {
    setChapters((prev) =>
      prev.map((c) =>
        c.tempId === chapterTempId
          ? {
              ...c,
              devices: c.devices.map((d) => (d.id === sdId ? { ...d, ...updates } : d)),
            }
          : c
      )
    );
  };

  const handleDeviceRemove = (chapterTempId: string, sdId: string) => {
    setChapters((prev) =>
      prev.map((c) =>
        c.tempId === chapterTempId
          ? { ...c, devices: c.devices.filter((d) => d.id !== sdId) }
          : c
      )
    );
  };

  const [upsertShowcaseDevice] = useMutation(UPSERT_SHOWCASE_DEVICE);

  const handleDeviceReorder = useCallback(async (
    chapterTempId: string,
    sdId: string,
    direction: 'up' | 'down'
  ) => {
    const ch = chapters.find((c) => c.tempId === chapterTempId);
    if (!ch) return;

    // Normalise sort orders to 0-based indices so ties don't cause no-ops
    const sorted = [...ch.devices].sort((a, b) => a.sortOrder - b.sortOrder);
    const withIndex = sorted.map((d, i) => ({ ...d, sortOrder: i }));

    const idx = withIndex.findIndex((d) => d.id === sdId);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= withIndex.length) return;

    // Swap
    [withIndex[idx].sortOrder, withIndex[swapIdx].sortOrder] = [swapIdx, idx];

    const a = withIndex[idx];
    const b = withIndex[swapIdx];

    // Optimistic update for both swapped items
    handleDeviceUpdate(chapterTempId, a.id, { sortOrder: a.sortOrder });
    handleDeviceUpdate(chapterTempId, b.id, { sortOrder: b.sortOrder });

    // Persist both
    try {
      await Promise.all([
        upsertShowcaseDevice({
          variables: {
            input: {
              id: a.id,
              chapterId: ch.id,
              deviceId: a.device.id,
              curatorNote: a.curatorNote ?? '',
              sortOrder: a.sortOrder,
              isFeatured: a.isFeatured,
            },
          },
        }),
        upsertShowcaseDevice({
          variables: {
            input: {
              id: b.id,
              chapterId: ch.id,
              deviceId: b.device.id,
              curatorNote: b.curatorNote ?? '',
              sortOrder: b.sortOrder,
              isFeatured: b.isFeatured,
            },
          },
        }),
      ]);
    } catch (err) {
      console.error('Failed to reorder devices:', err);
      // Revert optimistic update
      handleDeviceUpdate(chapterTempId, a.id, { sortOrder: b.sortOrder });
      handleDeviceUpdate(chapterTempId, b.id, { sortOrder: a.sortOrder });
    }
  }, [chapters, upsertShowcaseDevice, handleDeviceUpdate]);

  return (
    <div className="flex flex-col gap-0 -m-8">
      {/* Top bar */}
      <div className="sticky top-0 z-30 bg-surface-container-lowest border-b border-outline-variant/30 px-6 py-3.5 flex items-center gap-3">
        <button
          onClick={() => router.push('/admin/journeys')}
          className="text-sm text-primary hover:underline flex-shrink-0"
        >
          ← All Journeys
        </button>

        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Journey Title"
          className="flex-1 font-semibold text-base text-on-surface bg-transparent border-none outline-none placeholder:text-outline min-w-0"
        />

        {/* Published badge */}
        <span
          className={`flex-shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${
            published
              ? 'bg-emerald-100 text-emerald-800'
              : 'bg-amber-100 text-amber-800'
          }`}
        >
          {published ? 'Published' : 'Draft'}
        </span>

        {/* Publish toggle */}
        {!isNew && (
          <button
            onClick={handleTogglePublish}
            className="flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium border border-outline-variant text-on-surface hover:bg-surface-container-low transition"
          >
            {published ? 'Unpublish' : 'Publish'}
          </button>
        )}

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex-shrink-0 bg-primary text-on-primary font-semibold rounded-full px-5 py-1.5 text-sm hover:opacity-90 transition disabled:opacity-60"
        >
          {isSaving ? 'Saving…' : isNew ? 'Create Journey' : 'Save'}
        </button>
      </div>

      {/* Content area */}
      <div className="flex gap-6 p-6 items-start">
        {/* Left: Meta panel */}
        <div className="w-64 flex-shrink-0 flex flex-col gap-4 sticky top-20">
          {/* Journey details */}
          <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-outline-variant/20">
            <p className="text-[0.6875rem] font-label uppercase tracking-widest text-outline mb-4">
              Journey Details
            </p>

            <div className="flex flex-col gap-3.5">
              <div>
                <label className="block text-xs font-medium text-outline mb-1">URL Slug</label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => {
                    setSlug(e.target.value);
                    setSlugManuallyEdited(true);
                  }}
                  placeholder="my-journey-slug"
                  className="w-full px-2.5 py-1.5 rounded-lg border border-outline-variant/40 bg-surface-container-low text-xs font-mono text-on-surface focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-outline mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="A short description of this journey..."
                  rows={4}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-outline-variant/40 bg-surface-container-low text-xs text-on-surface resize-none focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-outline mb-1">Cover Image</label>
                {coverImagePath && (
                  <div className="rounded-lg overflow-hidden border border-outline-variant/40 mb-2">
                    <img
                      src={`/uploads/${coverImagePath}`}
                      alt="Cover"
                      className="w-full h-24 object-cover"
                    />
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCoverUpload}
                  disabled={uploadingCover}
                  className="text-xs text-on-surface-variant file:mr-2 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-medium file:bg-primary/10 file:text-primary hover:file:bg-primary/20 file:cursor-pointer disabled:opacity-50 w-full"
                />
                {uploadingCover && (
                  <p className="text-xs text-outline mt-1">Uploading…</p>
                )}
              </div>

              {isNew && (
                <div className="flex items-center gap-2">
                  <input
                    id="published-new"
                    type="checkbox"
                    checked={published}
                    onChange={(e) => setPublished(e.target.checked)}
                    className="w-4 h-4 accent-primary cursor-pointer"
                  />
                  <label htmlFor="published-new" className="text-xs text-on-surface cursor-pointer">
                    Publish immediately
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* Stats (only when editing an existing journey) */}
          {!isNew && (
            <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-outline-variant/20">
              <p className="text-[0.6875rem] font-label uppercase tracking-widest text-outline mb-4">
                Stats
              </p>
              <div className="flex flex-col gap-2">
                {[
                  { label: 'Chapters', value: String(chapters.length) },
                  { label: 'Devices', value: String(totalDevices) },
                  { label: 'Featured', value: `${totalFeatured} ★` },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-xs text-outline">{label}</span>
                    <span className="text-xs font-semibold text-on-surface">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Journey ID */}
          {!isNew && (
            <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-outline-variant/20">
              <p className="text-[0.6875rem] font-label uppercase tracking-widest text-outline mb-2">
                Journey ID
              </p>
              <p className="text-xs text-outline font-mono break-all">{journey!.id}</p>
            </div>
          )}
        </div>

        {/* Right: Chapters area */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">
          {/* Chapters header */}
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-on-surface">Chapters</h2>
            {!isNew && (
              <button
                onClick={handleAddChapter}
                className="px-4 py-1.5 rounded-full text-sm font-medium border border-outline-variant text-on-surface hover:bg-surface-container-low transition"
              >
                + Add Chapter
              </button>
            )}
          </div>

          {/* New journey prompt */}
          {isNew && (
            <div className="bg-surface-container-lowest rounded-xl p-8 text-center border border-outline-variant/20">
              <p className="text-sm text-outline">
                Create the journey first, then you can add chapters and devices.
              </p>
            </div>
          )}

          {/* Chapter cards */}
          {!isNew && chapters.length === 0 && (
            <div className="bg-surface-container-lowest rounded-xl p-8 text-center border border-outline-variant/20">
              <p className="text-sm text-outline">No chapters yet.</p>
              <p className="text-xs text-outline mt-1">Add a chapter to start building this journey.</p>
            </div>
          )}

          {chapters.map((chapter, index) => (
            <ChapterCard
              key={chapter.tempId}
              chapter={chapter}
              index={index}
              journeyId={journey?.id ?? ''}
              onUpdate={handleUpdateChapter}
              onDelete={handleDeleteChapter}
              onDeviceAdd={handleDeviceAdd}
              onDeviceUpdate={handleDeviceUpdate}
              onDeviceRemove={handleDeviceRemove}
              onDeviceReorder={handleDeviceReorder}
            />
          ))}

          {/* Add chapter button at bottom */}
          {!isNew && chapters.length > 0 && (
            <button
              onClick={handleAddChapter}
              className="self-start px-4 py-1.5 rounded-full text-sm font-medium border border-outline-variant text-on-surface hover:bg-surface-container-low transition"
            >
              + Add Chapter
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
