# Device Detail Redesign Phase 2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend `web/src/app/devices_new/[id]/page.tsx` with accessories, related devices, links, and a value history popover; add three dedicated sub-pages for notes, maintenance logs, and photos.

**Architecture:** All mutations and state for the new left-column sections already exist in `page.tsx` — this plan wires them into JSX. The value history popover uses a `useRef` on the financial card + `useState` for open/closed, reusing the existing `DeviceValueChart` component. Sub-pages are new `"use client"` files that each re-run `GET_DEVICE` and copy the relevant GQL mutations from `page.tsx`. "View all" links are added to the three right-column preview sections.

**Tech Stack:** Next.js 14 App Router, Apollo Client, Tailwind CSS (Technical Atelier tokens already in tailwind.config.js), inline SVG icons (Icon component in page.tsx), Recharts via existing `DeviceValueChart`.

---

## Files

| Action | File |
|---|---|
| Modify | `web/src/app/devices_new/[id]/page.tsx` |
| Create | `web/src/app/devices_new/[id]/notes/page.tsx` |
| Create | `web/src/app/devices_new/[id]/logs/page.tsx` |
| Create | `web/src/app/devices_new/[id]/photos/page.tsx` |

---

## Task 1: Add Accessories, Related Devices, and Links to the left column

**File:** `web/src/app/devices_new/[id]/page.tsx`

All GQL, state, and handlers already exist. This task adds the JSX sections in the left column after Historical Notes and before the Tags section, and adds two new SVG icon paths.

- [ ] Add `open_in_new` and `device_hub` icon paths to the `ICON_PATHS` record (around line 325, after the `arrow_back` entry):

```tsx
  open_in_new: "M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z",
  device_hub: "M17 16l-4-4V8.82C14.16 8.4 15 7.3 15 6c0-1.66-1.34-3-3-3S9 4.34 9 6c0 1.3.84 2.4 2 2.82V12l-4 4H3v5h5v-3.05l4-4.2 4 4.2V21h5v-5h-4z",
```

- [ ] In the left column JSX, locate the Tags section. Find the comment `{/* Tags */}`. Insert the following three sections **directly before** it:

```tsx
        {/* Accessories */}
        {((device.accessories ?? []).length > 0 || isAuthenticated) && (
          <section>
            <h2 className="text-on-surface font-bold text-[10px] uppercase tracking-widest mb-3">Accessories</h2>
            <div className="flex flex-wrap gap-2 mb-3">
              {(device.accessories ?? []).map((acc: any) => (
                <span key={acc.id} className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium bg-surface-container text-on-surface rounded-full border border-outline-variant/20">
                  {acc.name}
                  {isAuthenticated && (
                    <button
                      type="button"
                      onClick={() => handleRemoveAccessory(acc.id)}
                      aria-label={`Remove accessory ${acc.name}`}
                      className="ml-1 hover:text-red-500 transition-colors"
                    >×</button>
                  )}
                </span>
              ))}
            </div>
            {isAuthenticated && (
              <form
                onSubmit={e => { e.preventDefault(); handleAddAccessory(newAccessoryName); }}
                className="flex items-center gap-2 mt-2"
              >
                <input
                  type="text"
                  value={newAccessoryName}
                  onChange={e => setNewAccessoryName(e.target.value)}
                  placeholder="Add accessory..."
                  className="flex-1 px-3 py-1.5 text-sm bg-surface-container-low border border-outline-variant/30 rounded-full focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <button
                  type="submit"
                  disabled={addingAccessory || !newAccessoryName.trim()}
                  className="px-4 py-1.5 text-sm font-medium bg-primary text-white rounded-full hover:bg-primary-container disabled:opacity-50 transition-all"
                >Add</button>
              </form>
            )}
          </section>
        )}

        {/* Related Devices */}
        {(() => {
          const relatedFrom = (device.relationsFrom ?? []).map((r: any) => ({
            relationId: r.id,
            type: r.type,
            device: r.toDevice,
          }));
          const relatedTo = (device.relationsTo ?? []).map((r: any) => ({
            relationId: r.id,
            type: r.type,
            device: r.fromDevice,
          }));
          const allRelated = [...relatedFrom, ...relatedTo].filter(
            (r, idx, arr) => arr.findIndex(x => x.device?.id === r.device?.id) === idx
          );
          if (allRelated.length === 0) return null;
          return (
            <section>
              <h2 className="text-on-surface font-bold text-[10px] uppercase tracking-widest mb-3">Related Devices</h2>
              <div className="space-y-2">
                {allRelated.map(({ relationId, type, device: rel }) => {
                  if (!rel) return null;
                  const thumb = rel.images?.find((i: any) => i.isThumbnail) ?? rel.images?.[0];
                  return (
                    <Link
                      key={rel.id}
                      href={`/devices_new/${rel.id}`}
                      className="flex items-center gap-3 p-3 bg-surface-container-low rounded-xl hover:bg-surface-container transition-colors"
                    >
                      <div className="w-10 h-10 rounded-lg bg-surface-container-high overflow-hidden flex-shrink-0 flex items-center justify-center">
                        {thumb ? (
                          <img src={`${API_BASE_URL}${thumb.thumbnailPath || thumb.path}`} alt={rel.name} className="w-full h-full object-cover" />
                        ) : (
                          <Icon name="device_hub" className="w-5 h-5 text-outline" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-on-surface truncate">{rel.name}</p>
                        {rel.manufacturer && <p className="text-xs text-on-surface-variant truncate">{rel.manufacturer}</p>}
                      </div>
                      <span className="text-[9px] font-bold uppercase tracking-wider text-outline bg-surface-container px-2 py-0.5 rounded-full flex-shrink-0">
                        {type.replace(/_/g, ' ')}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </section>
          );
        })()}

        {/* Links */}
        {((device.links ?? []).length > 0 || isAuthenticated) && (
          <section>
            <h2 className="text-on-surface font-bold text-[10px] uppercase tracking-widest mb-3">Links</h2>
            <div className="space-y-2 mb-3">
              {(device.links ?? []).map((link: any) => (
                <div key={link.id} className="flex items-center gap-2">
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center gap-2 p-3 bg-surface-container-low rounded-xl hover:bg-surface-container transition-colors group min-w-0"
                  >
                    <Icon name="open_in_new" className="w-4 h-4 text-primary flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-on-surface group-hover:text-primary transition-colors truncate">{link.label}</p>
                      <p className="text-[10px] text-outline truncate">{link.url}</p>
                    </div>
                  </a>
                  {isAuthenticated && (
                    <button
                      type="button"
                      onClick={() => handleRemoveLink(link.id)}
                      aria-label={`Remove link ${link.label}`}
                      className="p-2 text-on-surface-variant hover:text-red-500 transition-colors flex-shrink-0"
                    >
                      <Icon name="delete" className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {isAuthenticated && !showLinkForm && (
              <button
                type="button"
                onClick={() => setShowLinkForm(true)}
                className="text-primary text-xs font-semibold hover:underline"
              >+ Add link</button>
            )}
            {isAuthenticated && showLinkForm && (
              <form onSubmit={handleAddLink} className="space-y-2 mt-2">
                <input
                  type="text"
                  value={newLinkLabel}
                  onChange={e => setNewLinkLabel(e.target.value)}
                  placeholder="Label (e.g. Manual PDF)"
                  className="w-full px-3 py-1.5 text-sm bg-surface-container-low border border-outline-variant/30 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
                  autoFocus
                />
                <input
                  type="url"
                  value={newLinkUrl}
                  onChange={e => setNewLinkUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-1.5 text-sm bg-surface-container-low border border-outline-variant/30 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <div className="flex gap-2">
                  <button type="submit" disabled={addingLink || !newLinkLabel.trim() || !newLinkUrl.trim()} className="px-4 py-1.5 text-sm font-medium bg-primary text-white rounded-full hover:bg-primary-container disabled:opacity-50 transition-all">Add</button>
                  <button type="button" onClick={() => { setShowLinkForm(false); setNewLinkLabel(''); setNewLinkUrl(''); }} className="px-4 py-1.5 text-sm font-medium text-on-surface-variant bg-surface-container rounded-full hover:bg-surface-container-high transition-all">Cancel</button>
                </div>
              </form>
            )}
          </section>
        )}
```

- [ ] Build check:
```bash
cd /Users/wottle/Documents/Development/InvDifferent2/web && npx tsc --noEmit 2>&1 | head -20
```
Expected: zero new errors (existing `any` warnings are acceptable).

- [ ] Commit:
```bash
git add web/src/app/devices_new/\[id\]/page.tsx
git commit -m "$(cat <<'EOF'
feat(devices_new): add accessories, related devices, and links sections to left column

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Add Value History anchored popover to Estimated Value card

**File:** `web/src/app/devices_new/[id]/page.tsx`

The `valueHistoryData` query already runs. This task adds the popover trigger to the Estimated Value card and the popover itself.

- [ ] Add `showValueHistory` state and `valueHistoryRef` ref. Find the state block (around line 467, after `infoExpanded`). Add:

```tsx
  const [showValueHistory, setShowValueHistory] = useState(false);
  const valueHistoryRef = useRef<HTMLDivElement | null>(null);
```

- [ ] Add a `useEffect` to close the popover on outside click. Add after the existing `useEffect` blocks (before the `if (loading)` guard, around line 588):

```tsx
  useEffect(() => {
    if (!showValueHistory) return;
    const handleOutside = (e: MouseEvent) => {
      if (valueHistoryRef.current && !valueHistoryRef.current.contains(e.target as Node)) {
        setShowValueHistory(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [showValueHistory]);
```

- [ ] Add dynamic import for `DeviceValueChart`. Add this import at the top of the file, after the existing imports:

```tsx
import dynamic from "next/dynamic";
const DeviceValueChart = dynamic(() => import("../../../components/DeviceValueChart"), { ssr: false });
```

- [ ] Add chart data derivation after the `sortedNotes` derivation (around line 643):

```tsx
  const chartData = (valueHistoryData?.valueHistory ?? []).map((v: any) => ({
    date: new Date(v.snapshotDate).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
    dateMs: new Date(v.snapshotDate).getTime(),
    value: v.estimatedValue,
  }));
```

- [ ] Find the Estimated Value card in the Financials section JSX. It looks like:

```tsx
            {device.estimatedValue != null && (
              <div className="bg-white p-8 rounded-xl shadow-sm flex justify-between items-end border-l-4 border-tertiary">
```

Replace it with the version that has the popover trigger and overlay:

```tsx
            {device.estimatedValue != null && (
              <div ref={valueHistoryRef} className="relative bg-white p-8 rounded-xl shadow-sm flex justify-between items-end border-l-4 border-tertiary">
                <div>
                  <span className="text-outline text-[10px] uppercase tracking-widest block mb-1">Estimated Value</span>
                  <span className="text-3xl font-bold text-on-surface">{formatCurrency(device.estimatedValue)}</span>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Icon name="trending_up" className="w-6 h-6 text-tertiary" />
                  <button
                    type="button"
                    onClick={() => setShowValueHistory(v => !v)}
                    className="text-[10px] font-bold text-primary hover:underline uppercase tracking-wider"
                  >
                    History ↗
                  </button>
                </div>
                {/* Value History Popover */}
                {showValueHistory && (
                  <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-30 bg-white rounded-xl shadow-lg border border-outline-variant/20 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-outline">Value History</span>
                      <button
                        type="button"
                        onClick={() => setShowValueHistory(false)}
                        aria-label="Close value history"
                        className="w-6 h-6 flex items-center justify-center rounded-full bg-surface-container text-on-surface-variant hover:bg-surface-container-high transition-colors text-sm"
                      >×</button>
                    </div>
                    {chartData.length >= 2 ? (
                      <DeviceValueChart data={chartData} />
                    ) : (
                      <p className="text-xs text-on-surface-variant py-4 text-center">No history yet — value snapshots build as you update this device.</p>
                    )}
                    {chartData.length > 0 && (
                      <p className="text-[10px] text-outline mt-2 text-center">
                        {chartData.length} snapshot{chartData.length !== 1 ? 's' : ''} · first recorded {new Date(Math.min(...chartData.map((c: any) => c.dateMs))).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
```

- [ ] Build check:
```bash
cd /Users/wottle/Documents/Development/InvDifferent2/web && npx tsc --noEmit 2>&1 | head -20
```

- [ ] Commit:
```bash
git add web/src/app/devices_new/\[id\]/page.tsx
git commit -m "$(cat <<'EOF'
feat(devices_new): add value history anchored popover to estimated value card

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Add "View all" links to right-column preview sections

**File:** `web/src/app/devices_new/[id]/page.tsx`

Three section headers in the right column need a "View all →" link.

- [ ] Find the Photos section header in the right column. It looks like:

```tsx
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-on-surface font-bold text-sm uppercase tracking-widest">Photos</h2>
              <span className="text-on-surface-variant text-xs">{images.length} total</span>
            </div>
```

Replace with:

```tsx
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-on-surface font-bold text-sm uppercase tracking-widest">Photos</h2>
              <Link href={`/devices_new/${id}/photos`} className="text-xs text-primary font-semibold hover:underline">
                View all →
              </Link>
            </div>
```

- [ ] Find the Maintenance Logs section header. It looks like:

```tsx
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-on-surface font-bold text-sm uppercase tracking-widest">Maintenance Logs</h2>
              {isAuthenticated && (
                <button onClick={() => setShowMaintenanceForm(true)} className="text-primary text-xs font-semibold hover:underline">+ Add</button>
              )}
            </div>
```

Replace with:

```tsx
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-on-surface font-bold text-sm uppercase tracking-widest">Maintenance Logs</h2>
              <div className="flex items-center gap-3">
                <Link href={`/devices_new/${id}/logs`} className="text-xs text-primary font-semibold hover:underline">View all →</Link>
                {isAuthenticated && (
                  <button onClick={() => setShowMaintenanceForm(true)} className="text-primary text-xs font-semibold hover:underline">+ Add</button>
                )}
              </div>
            </div>
```

- [ ] Find the Recent Notes section header. It looks like:

```tsx
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-on-surface font-bold text-sm uppercase tracking-widest">Recent Notes</h2>
              {isAuthenticated && (
                <button onClick={() => setShowNoteForm(true)} className="text-primary text-xs font-semibold hover:underline">+ Add</button>
              )}
            </div>
```

Replace with:

```tsx
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-on-surface font-bold text-sm uppercase tracking-widest">Recent Notes</h2>
              <div className="flex items-center gap-3">
                <Link href={`/devices_new/${id}/notes`} className="text-xs text-primary font-semibold hover:underline">View all →</Link>
                {isAuthenticated && (
                  <button onClick={() => setShowNoteForm(true)} className="text-primary text-xs font-semibold hover:underline">+ Add</button>
                )}
              </div>
            </div>
```

- [ ] Build check and commit:
```bash
cd /Users/wottle/Documents/Development/InvDifferent2/web && npx tsc --noEmit 2>&1 | head -20
git add web/src/app/devices_new/\[id\]/page.tsx
git commit -m "$(cat <<'EOF'
feat(devices_new): add View all links to photos, logs, and notes preview sections

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Create Notes sub-page

**File:** `web/src/app/devices_new/[id]/notes/page.tsx` (new file)

- [ ] Create the directory and file. The full file content:

```tsx
"use client";

import { useQuery, useMutation } from "@apollo/client";
import gql from "graphql-tag";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useAuth } from "../../../../lib/auth-context";
import { useT } from "../../../../i18n/context";
import { LoadingPanel } from "../../../../components/LoadingPanel";

const GET_DEVICE_NOTES = gql`
  query GetDeviceNotes($where: DeviceWhereInput!) {
    device(where: $where) {
      id
      name
      notes {
        id
        content
        date
      }
    }
  }
`;

const CREATE_NOTE = gql`
  mutation CreateNote($input: NoteCreateInput!) {
    createNote(input: $input) {
      id
      content
      date
    }
  }
`;

const UPDATE_NOTE = gql`
  mutation UpdateNote($input: NoteUpdateInput!) {
    updateNote(input: $input) {
      id
      content
      date
    }
  }
`;

const DELETE_NOTE = gql`
  mutation DeleteNote($id: Int!) {
    deleteNote(id: $id)
  }
`;

function formatDateForDisplay(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function NotesPage() {
  const params = useParams();
  const id = params.id;
  const { isAuthenticated } = useAuth();
  const t = useT();

  const [sortAsc, setSortAsc] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addFormData, setAddFormData] = useState({
    content: '',
    date: new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16),
  });
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [editFormData, setEditFormData] = useState({ content: '', date: '' });
  const [deleteNoteId, setDeleteNoteId] = useState<number | null>(null);

  const { loading, error, data, refetch } = useQuery(GET_DEVICE_NOTES, {
    variables: { where: { id: parseInt(id as string), deleted: { equals: false } } },
    skip: !id,
    fetchPolicy: 'cache-and-network',
  });

  const [createNote, { loading: creatingNote }] = useMutation(CREATE_NOTE);
  const [updateNote, { loading: updatingNote }] = useMutation(UPDATE_NOTE);
  const [deleteNote, { loading: deletingNote }] = useMutation(DELETE_NOTE);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingPanel title={t.detail.loading} subtitle={t.detail.loadingSubtitle} />
      </div>
    );
  }
  if (error || !data?.device) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-on-surface-variant">Device not found.</p>
      </div>
    );
  }

  const device = data.device;
  const sortedNotes = [...(device.notes ?? [])].sort((a: any, b: any) => {
    const diff = new Date(b.date).getTime() - new Date(a.date).getTime();
    return sortAsc ? -diff : diff;
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const parts = addFormData.date.split('T');
    const d = parts[0].split('-');
    const tm = parts[1].split(':');
    const localDate = new Date(+d[0], +d[1] - 1, +d[2], +tm[0], +tm[1]);
    await createNote({
      variables: { input: { deviceId: device.id, content: addFormData.content, date: localDate.toISOString() } },
    });
    setAddFormData({
      content: '',
      date: new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16),
    });
    setShowAddForm(false);
    refetch();
  };

  const handleEdit = (note: any) => {
    setEditingNoteId(note.id);
    const utcDate = new Date(note.date);
    const local = new Date(utcDate.getTime() - utcDate.getTimezoneOffset() * 60000);
    setEditFormData({ content: note.content, date: local.toISOString().slice(0, 16) });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNoteId) return;
    const parts = editFormData.date.split('T');
    const d = parts[0].split('-');
    const tm = parts[1].split(':');
    const localDate = new Date(+d[0], +d[1] - 1, +d[2], +tm[0], +tm[1]);
    await updateNote({
      variables: { input: { id: editingNoteId, content: editFormData.content, date: localDate.toISOString() } },
    });
    setEditingNoteId(null);
    setEditFormData({ content: '', date: '' });
    refetch();
  };

  const handleDelete = async () => {
    if (!deleteNoteId) return;
    await deleteNote({ variables: { id: deleteNoteId } });
    setDeleteNoteId(null);
    refetch();
  };

  return (
    <div className="font-inter text-on-surface max-w-2xl mx-auto">
      {/* Back nav */}
      <div className="flex items-center justify-between mb-6">
        <Link
          href={`/devices_new/${id}`}
          className="inline-flex items-center gap-2 text-sm text-on-surface-variant hover:text-on-surface transition-colors group"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 transition-transform group-hover:-translate-x-0.5">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
          </svg>
          {device.name}
        </Link>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setSortAsc(v => !v)}
            className="text-xs text-on-surface-variant hover:text-on-surface font-medium transition-colors"
          >
            {sortAsc ? 'Oldest first' : 'Newest first'}
          </button>
          {isAuthenticated && (
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              className="px-4 py-1.5 text-sm font-medium bg-primary text-white rounded-full hover:bg-primary-container transition-all"
            >+ Add note</button>
          )}
        </div>
      </div>

      {/* Title */}
      <h1 className="text-3xl font-extrabold tracking-tighter text-on-surface mb-1">All Notes</h1>
      <p className="text-sm text-on-surface-variant mb-8">{sortedNotes.length} note{sortedNotes.length !== 1 ? 's' : ''}</p>

      {/* Add note form */}
      {isAuthenticated && showAddForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-xl p-6 shadow-sm mb-8 space-y-4">
          <h3 className="font-bold text-on-surface text-sm">New Note</h3>
          <textarea
            value={addFormData.content}
            onChange={e => setAddFormData(p => ({ ...p, content: e.target.value }))}
            rows={4}
            placeholder="Write a note..."
            className="w-full px-3 py-2 text-sm bg-surface-container-low rounded-lg focus:outline-none focus:ring-1 focus:ring-primary resize-none"
            required
            autoFocus
          />
          <input
            type="datetime-local"
            value={addFormData.date}
            onChange={e => setAddFormData(p => ({ ...p, date: e.target.value }))}
            className="w-full px-3 py-2 text-sm bg-surface-container-low rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setShowAddForm(false)} className="px-4 py-2 text-sm font-medium text-on-surface-variant bg-surface-container rounded-lg hover:bg-surface-container-high transition-all">Cancel</button>
            <button type="submit" disabled={creatingNote || !addFormData.content.trim()} className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-container disabled:opacity-50 transition-all">
              {creatingNote ? 'Saving...' : 'Save Note'}
            </button>
          </div>
        </form>
      )}

      {/* Notes timeline */}
      {sortedNotes.length === 0 && (
        <p className="text-on-surface-variant text-sm">No notes yet.</p>
      )}
      <div className="relative">
        {sortedNotes.length > 0 && (
          <div className="absolute left-[5px] top-2 bottom-2 w-0.5 bg-primary-fixed-dim" />
        )}
        <div className="space-y-8">
          {sortedNotes.map((note: any) => (
            <div key={note.id} className="relative pl-8">
              <div className="absolute left-0 top-1.5 w-2.5 h-2.5 rounded-full bg-primary ring-2 ring-white" />
              {editingNoteId === note.id ? (
                <form onSubmit={handleUpdate} className="bg-white rounded-xl p-4 shadow-sm space-y-3">
                  <textarea
                    value={editFormData.content}
                    onChange={e => setEditFormData(p => ({ ...p, content: e.target.value }))}
                    rows={4}
                    className="w-full px-3 py-2 text-sm bg-surface-container-low rounded-lg focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                    required
                    autoFocus
                  />
                  <input
                    type="datetime-local"
                    value={editFormData.date}
                    onChange={e => setEditFormData(p => ({ ...p, date: e.target.value }))}
                    className="w-full px-3 py-2 text-sm bg-surface-container-low rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <div className="flex justify-end gap-3">
                    <button type="button" onClick={() => setEditingNoteId(null)} className="px-3 py-1.5 text-xs font-medium text-on-surface-variant bg-surface-container rounded-lg hover:bg-surface-container-high transition-all">Cancel</button>
                    <button type="submit" disabled={updatingNote} className="px-3 py-1.5 text-xs font-medium text-white bg-primary rounded-lg hover:bg-primary-container disabled:opacity-50 transition-all">
                      {updatingNote ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <span className="text-[10px] text-outline font-bold uppercase tracking-tighter block mb-1">
                    {formatDateForDisplay(note.date)}
                  </span>
                  <p className="text-sm italic text-on-surface-variant leading-relaxed">{note.content}</p>
                  {isAuthenticated && (
                    <div className="flex items-center gap-3 mt-2">
                      <button type="button" onClick={() => handleEdit(note)} className="text-[10px] text-primary font-semibold hover:underline">Edit</button>
                      <button type="button" onClick={() => setDeleteNoteId(note.id)} className="text-[10px] text-red-500 font-semibold hover:underline">Delete</button>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Delete confirm */}
      {deleteNoteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm mx-4 shadow-2xl">
            <h4 className="text-lg font-bold text-on-surface mb-2">Delete Note?</h4>
            <p className="text-sm text-on-surface-variant mb-6">This cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteNoteId(null)} className="px-4 py-2 text-sm font-medium text-on-surface-variant bg-surface-container rounded-lg hover:bg-surface-container-high transition-all">Cancel</button>
              <button onClick={handleDelete} disabled={deletingNote} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-all">
                {deletingNote ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] Build check:
```bash
cd /Users/wottle/Documents/Development/InvDifferent2/web && npx tsc --noEmit 2>&1 | head -20
```

- [ ] Update release notes in `web/src/lib/releaseNotes.ts` — add to Unreleased:
```
{ type: "added", text: "Full notes timeline at /devices_new/[id]/notes with create, edit, delete" }
```

- [ ] Commit:
```bash
git add web/src/app/devices_new/\[id\]/notes/page.tsx web/src/lib/releaseNotes.ts
git commit -m "$(cat <<'EOF'
feat(devices_new): add full notes sub-page at /devices_new/[id]/notes

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Create Maintenance Logs sub-page

**File:** `web/src/app/devices_new/[id]/logs/page.tsx` (new file)

- [ ] Create the file with the following content:

```tsx
"use client";

import { useQuery, useMutation } from "@apollo/client";
import gql from "graphql-tag";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useAuth } from "../../../../lib/auth-context";
import { useT } from "../../../../i18n/context";
import { LoadingPanel } from "../../../../components/LoadingPanel";

const GET_DEVICE_LOGS = gql`
  query GetDeviceLogs($where: DeviceWhereInput!) {
    device(where: $where) {
      id
      name
      maintenanceTasks {
        id
        label
        dateCompleted
        notes
        cost
      }
    }
  }
`;

const CREATE_MAINTENANCE_TASK = gql`
  mutation CreateMaintenanceTask($input: MaintenanceTaskCreateInput!) {
    createMaintenanceTask(input: $input) {
      id
      label
      dateCompleted
      notes
      cost
    }
  }
`;

const DELETE_MAINTENANCE_TASK = gql`
  mutation DeleteMaintenanceTask($id: Int!) {
    deleteMaintenanceTask(id: $id)
  }
`;

const GET_MAINTENANCE_TASK_LABELS = gql`
  query GetMaintenanceTaskLabels {
    maintenanceTaskLabels
  }
`;

function formatCurrency(value: number): string {
  return `$${Number(value).toFixed(2)}`;
}

function formatDateForDisplay(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function LogsPage() {
  const params = useParams();
  const id = params.id;
  const { isAuthenticated } = useAuth();
  const t = useT();

  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    label: '',
    dateCompleted: new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10),
    notes: '',
    cost: '',
  });
  const [deleteTaskId, setDeleteTaskId] = useState<number | null>(null);

  const { loading, error, data, refetch } = useQuery(GET_DEVICE_LOGS, {
    variables: { where: { id: parseInt(id as string), deleted: { equals: false } } },
    skip: !id,
    fetchPolicy: 'cache-and-network',
  });
  const { data: labelsData } = useQuery(GET_MAINTENANCE_TASK_LABELS);

  const [createMaintenanceTask, { loading: creatingTask }] = useMutation(CREATE_MAINTENANCE_TASK);
  const [deleteMaintenanceTask, { loading: deletingTask }] = useMutation(DELETE_MAINTENANCE_TASK);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingPanel title={t.detail.loading} subtitle={t.detail.loadingSubtitle} />
      </div>
    );
  }
  if (error || !data?.device) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-on-surface-variant">Device not found.</p>
      </div>
    );
  }

  const device = data.device;
  const sortedTasks = [...(device.maintenanceTasks ?? [])].sort(
    (a: any, b: any) => new Date(b.dateCompleted).getTime() - new Date(a.dateCompleted).getTime()
  );
  const totalCost = sortedTasks.reduce((sum: number, t: any) => sum + (t.cost ?? 0), 0);
  const labels: string[] = labelsData?.maintenanceTaskLabels ?? [];

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createMaintenanceTask({
      variables: {
        input: {
          deviceId: device.id,
          label: formData.label,
          dateCompleted: formData.dateCompleted,
          notes: formData.notes || null,
          cost: formData.cost ? parseFloat(formData.cost) : null,
        },
      },
    });
    setFormData({
      label: '',
      dateCompleted: new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10),
      notes: '',
      cost: '',
    });
    setShowAddForm(false);
    refetch();
  };

  const handleDelete = async () => {
    if (!deleteTaskId) return;
    await deleteMaintenanceTask({ variables: { id: deleteTaskId } });
    setDeleteTaskId(null);
    refetch();
  };

  return (
    <div className="font-inter text-on-surface max-w-2xl mx-auto">
      {/* Back nav */}
      <div className="flex items-center justify-between mb-6">
        <Link
          href={`/devices_new/${id}`}
          className="inline-flex items-center gap-2 text-sm text-on-surface-variant hover:text-on-surface transition-colors group"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 transition-transform group-hover:-translate-x-0.5">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
          </svg>
          {device.name}
        </Link>
        {isAuthenticated && (
          <button
            type="button"
            onClick={() => setShowAddForm(v => !v)}
            className="px-4 py-1.5 text-sm font-medium bg-primary text-white rounded-full hover:bg-primary-container transition-all"
          >+ Add log</button>
        )}
      </div>

      {/* Title */}
      <h1 className="text-3xl font-extrabold tracking-tighter text-on-surface mb-1">Maintenance Logs</h1>
      <p className="text-sm text-on-surface-variant mb-4">{sortedTasks.length} log{sortedTasks.length !== 1 ? 's' : ''}</p>

      {/* Cost summary (auth-gated) */}
      {isAuthenticated && sortedTasks.length > 0 && (
        <div className="bg-surface-container-low rounded-xl px-5 py-3 mb-8 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-widest text-outline">Total Maintenance Cost</span>
          <span className="text-lg font-bold text-on-surface">{formatCurrency(totalCost)}</span>
        </div>
      )}

      {/* Add form (inline card) */}
      {isAuthenticated && showAddForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-xl p-6 shadow-sm mb-8 space-y-4">
          <h3 className="font-bold text-on-surface text-sm">New Maintenance Log</h3>
          <div>
            <label className="block text-xs font-medium text-on-surface-variant uppercase tracking-wider mb-1">Label *</label>
            <input
              type="text"
              value={formData.label}
              onChange={e => setFormData(p => ({ ...p, label: e.target.value }))}
              list="label-suggestions"
              placeholder="e.g. Recap, HDD Replacement..."
              className="w-full px-3 py-2 text-sm bg-surface-container-low rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
              required
              autoFocus
            />
            <datalist id="label-suggestions">
              {labels.map((l: string) => <option key={l} value={l} />)}
            </datalist>
          </div>
          <div>
            <label className="block text-xs font-medium text-on-surface-variant uppercase tracking-wider mb-1">Date Completed *</label>
            <input
              type="date"
              value={formData.dateCompleted}
              onChange={e => setFormData(p => ({ ...p, dateCompleted: e.target.value }))}
              className="w-full px-3 py-2 text-sm bg-surface-container-low rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-on-surface-variant uppercase tracking-wider mb-1">Notes</label>
            <textarea
              value={formData.notes}
              onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 text-sm bg-surface-container-low rounded-lg focus:outline-none focus:ring-1 focus:ring-primary resize-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-on-surface-variant uppercase tracking-wider mb-1">Cost</label>
            <input
              type="number"
              step="0.01"
              value={formData.cost}
              onChange={e => setFormData(p => ({ ...p, cost: e.target.value }))}
              placeholder="0.00"
              className="w-full px-3 py-2 text-sm bg-surface-container-low rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setShowAddForm(false)} className="px-4 py-2 text-sm font-medium text-on-surface-variant bg-surface-container rounded-lg hover:bg-surface-container-high transition-all">Cancel</button>
            <button type="submit" disabled={creatingTask || !formData.label.trim()} className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-container disabled:opacity-50 transition-all">
              {creatingTask ? 'Saving...' : 'Save Log'}
            </button>
          </div>
        </form>
      )}

      {/* Task list */}
      {sortedTasks.length === 0 && <p className="text-on-surface-variant text-sm">No maintenance logs yet.</p>}
      <div className="space-y-4">
        {sortedTasks.map((task: any) => (
          <div key={task.id} className="bg-white p-5 rounded-xl shadow-sm">
            <div className="flex justify-between items-start gap-4">
              <div className="flex-1 min-w-0">
                <p className="font-bold text-on-surface">{task.label}</p>
                <p className="text-[10px] text-outline uppercase tracking-tighter mt-0.5">{formatDateForDisplay(task.dateCompleted)}</p>
                {task.notes && <p className="text-sm text-on-surface-variant mt-2 leading-relaxed">{task.notes}</p>}
                {task.cost != null && isAuthenticated && (
                  <p className="text-xs text-on-surface-variant mt-1 font-medium">Cost: {formatCurrency(task.cost)}</p>
                )}
              </div>
              {isAuthenticated && (
                <button
                  type="button"
                  onClick={() => setDeleteTaskId(task.id)}
                  aria-label="Delete log"
                  className="p-2 text-on-surface-variant hover:text-red-500 transition-colors flex-shrink-0"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Delete confirm */}
      {deleteTaskId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm mx-4 shadow-2xl">
            <h4 className="text-lg font-bold text-on-surface mb-2">Delete Log?</h4>
            <p className="text-sm text-on-surface-variant mb-6">This cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteTaskId(null)} className="px-4 py-2 text-sm font-medium text-on-surface-variant bg-surface-container rounded-lg hover:bg-surface-container-high transition-all">Cancel</button>
              <button onClick={handleDelete} disabled={deletingTask} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-all">
                {deletingTask ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] Build check:
```bash
cd /Users/wottle/Documents/Development/InvDifferent2/web && npx tsc --noEmit 2>&1 | head -20
```

- [ ] Update release notes in `web/src/lib/releaseNotes.ts` — add to Unreleased:
```
{ type: "added", text: "Full maintenance logs page at /devices_new/[id]/logs with add, delete, and cost summary" }
```

- [ ] Commit:
```bash
git add web/src/app/devices_new/\[id\]/logs/page.tsx web/src/lib/releaseNotes.ts
git commit -m "$(cat <<'EOF'
feat(devices_new): add full maintenance logs sub-page at /devices_new/[id]/logs

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: Create Photos sub-page

**File:** `web/src/app/devices_new/[id]/photos/page.tsx` (new file)

Uses `DELETE_IMAGE` and `UPDATE_IMAGE` GQL from `ImageGallery.tsx` pattern. Lightbox reuses the same scroll-lock + keyboard navigation pattern from `page.tsx`.

- [ ] Create the file with the following content:

```tsx
"use client";

import { useQuery, useMutation } from "@apollo/client";
import gql from "graphql-tag";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "../../../../lib/auth-context";
import { useT } from "../../../../i18n/context";
import { LoadingPanel } from "../../../../components/LoadingPanel";
import { ImageUploader } from "../../../../components/ImageUploader";
import { API_BASE_URL } from "../../../../lib/config";

const GET_DEVICE_IMAGES = gql`
  query GetDeviceImages($where: DeviceWhereInput!) {
    device(where: $where) {
      id
      name
      images {
        id
        path
        thumbnailPath
        caption
        dateTaken
        isThumbnail
        thumbnailMode
        isShopImage
        isListingImage
      }
    }
  }
`;

const DELETE_IMAGE = gql`
  mutation DeleteImage($id: Int!) {
    deleteImage(id: $id)
  }
`;

const UPDATE_IMAGE = gql`
  mutation UpdateImage($input: ImageUpdateInput!) {
    updateImage(input: $input) {
      id
      isThumbnail
      thumbnailMode
      isShopImage
      isListingImage
    }
  }
`;

export default function PhotosPage() {
  const params = useParams();
  const id = params.id;
  const { isAuthenticated } = useAuth();
  const t = useT();

  const [showUploader, setShowUploader] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [deleteImageId, setDeleteImageId] = useState<number | null>(null);

  const { loading, error, data, refetch } = useQuery(GET_DEVICE_IMAGES, {
    variables: { where: { id: parseInt(id as string), deleted: { equals: false } } },
    skip: !id,
    fetchPolicy: 'cache-and-network',
  });

  const [deleteImage, { loading: deletingImage }] = useMutation(DELETE_IMAGE);
  const [updateImage, { loading: updatingImage }] = useMutation(UPDATE_IMAGE);

  const images: any[] = data?.device?.images ?? [];

  // Lightbox scroll lock
  useEffect(() => {
    if (lightboxIndex === null) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [lightboxIndex]);

  // Lightbox keyboard nav
  const handleLightboxKey = useCallback((e: KeyboardEvent) => {
    if (lightboxIndex === null) return;
    if (e.key === 'Escape') { setLightboxIndex(null); return; }
    if (e.key === 'ArrowRight') setLightboxIndex(i => i !== null ? (i + 1) % images.length : null);
    if (e.key === 'ArrowLeft') setLightboxIndex(i => i !== null ? (i - 1 + images.length) % images.length : null);
  }, [lightboxIndex, images.length]);

  useEffect(() => {
    window.addEventListener('keydown', handleLightboxKey);
    return () => window.removeEventListener('keydown', handleLightboxKey);
  }, [handleLightboxKey]);

  const handleDelete = async () => {
    if (!deleteImageId) return;
    // Close lightbox if the deleted image was open
    if (lightboxIndex !== null && images[lightboxIndex]?.id === deleteImageId) {
      setLightboxIndex(null);
    }
    await deleteImage({ variables: { id: deleteImageId } });
    setDeleteImageId(null);
    refetch();
  };

  const handleSetThumbnail = async (imageId: number) => {
    await updateImage({ variables: { input: { id: imageId, isThumbnail: true, thumbnailMode: 'BOTH' } } });
    refetch();
  };

  const handleToggleShop = async (imageId: number, next: boolean) => {
    await updateImage({ variables: { input: { id: imageId, isShopImage: next } } });
    refetch();
  };

  const handleSetListing = async (imageId: number) => {
    await updateImage({ variables: { input: { id: imageId, isListingImage: true } } });
    refetch();
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingPanel title={t.detail.loading} subtitle={t.detail.loadingSubtitle} />
      </div>
    );
  }
  if (error || !data?.device) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-on-surface-variant">Device not found.</p>
      </div>
    );
  }

  const device = data.device;

  return (
    <div className="font-inter text-on-surface">
      {/* Back nav */}
      <div className="flex items-center justify-between mb-6">
        <Link
          href={`/devices_new/${id}`}
          className="inline-flex items-center gap-2 text-sm text-on-surface-variant hover:text-on-surface transition-colors group"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 transition-transform group-hover:-translate-x-0.5">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
          </svg>
          {device.name}
        </Link>
        {isAuthenticated && (
          <button
            type="button"
            onClick={() => setShowUploader(true)}
            className="px-4 py-1.5 text-sm font-medium bg-primary text-white rounded-full hover:bg-primary-container transition-all"
          >+ Upload photos</button>
        )}
      </div>

      {/* Title */}
      <h1 className="text-3xl font-extrabold tracking-tighter text-on-surface mb-1">Photos</h1>
      <p className="text-sm text-on-surface-variant mb-8">{images.length} image{images.length !== 1 ? 's' : ''} total</p>

      {/* Masonry grid (CSS columns) */}
      {images.length === 0 && (
        <p className="text-on-surface-variant text-sm">No photos yet.</p>
      )}
      <div className="columns-1 md:columns-2 lg:columns-3 gap-4 space-y-4">
        {images.map((img: any, idx: number) => (
          <div key={img.id} className="break-inside-avoid bg-white rounded-xl overflow-hidden shadow-sm group">
            <div
              className="cursor-pointer"
              onClick={() => setLightboxIndex(idx)}
            >
              <img
                src={`${API_BASE_URL}${img.path}`}
                alt={img.caption || ''}
                className="w-full object-contain max-h-96"
                loading="lazy"
              />
            </div>
            <div className="p-3">
              {/* Role badges */}
              <div className="flex flex-wrap gap-1 mb-2">
                {img.isThumbnail && (
                  <span className="text-[9px] font-bold uppercase tracking-wider bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                    {img.thumbnailMode === 'LIGHT' ? 'Light Thumb' : img.thumbnailMode === 'DARK' ? 'Dark Thumb' : 'Thumbnail'}
                  </span>
                )}
                {img.isShopImage && (
                  <span className="text-[9px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full">Shop</span>
                )}
                {img.isListingImage && (
                  <span className="text-[9px] font-bold uppercase tracking-wider bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full">Listing</span>
                )}
              </div>
              {img.caption && <p className="text-xs text-on-surface-variant italic">{img.caption}</p>}
              {/* Auth controls */}
              {isAuthenticated && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {!img.isThumbnail && (
                    <button
                      type="button"
                      onClick={() => handleSetThumbnail(img.id)}
                      disabled={updatingImage}
                      className="text-[10px] font-semibold text-primary hover:underline disabled:opacity-50"
                    >Set Thumbnail</button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleToggleShop(img.id, !img.isShopImage)}
                    disabled={updatingImage}
                    className="text-[10px] font-semibold text-primary hover:underline disabled:opacity-50"
                  >{img.isShopImage ? 'Remove Shop' : 'Set Shop'}</button>
                  {!img.isListingImage && (
                    <button
                      type="button"
                      onClick={() => handleSetListing(img.id)}
                      disabled={updatingImage}
                      className="text-[10px] font-semibold text-primary hover:underline disabled:opacity-50"
                    >Set Listing</button>
                  )}
                  <button
                    type="button"
                    onClick={() => setDeleteImageId(img.id)}
                    className="text-[10px] font-semibold text-red-500 hover:underline"
                  >Delete</button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && images[lightboxIndex] && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setLightboxIndex(null)}
        >
          <button
            type="button"
            className="absolute top-4 right-4 text-white/70 hover:text-white text-3xl font-light z-10"
            onClick={() => setLightboxIndex(null)}
            aria-label="Close lightbox"
          >×</button>
          {images.length > 1 && (
            <>
              <button
                type="button"
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white text-4xl font-light z-10 p-2"
                onClick={e => { e.stopPropagation(); setLightboxIndex(i => i !== null ? (i - 1 + images.length) % images.length : null); }}
                aria-label="Previous image"
              >‹</button>
              <button
                type="button"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white text-4xl font-light z-10 p-2"
                onClick={e => { e.stopPropagation(); setLightboxIndex(i => i !== null ? (i + 1) % images.length : null); }}
                aria-label="Next image"
              >›</button>
            </>
          )}
          <img
            src={`${API_BASE_URL}${images[lightboxIndex].path}`}
            alt={images[lightboxIndex].caption || ''}
            className="max-h-[90vh] max-w-[90vw] object-contain"
            onClick={e => e.stopPropagation()}
          />
          {images[lightboxIndex].caption && (
            <p className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/70 text-sm italic text-center px-4">
              {images[lightboxIndex].caption}
            </p>
          )}
        </div>
      )}

      {/* Image Uploader Modal */}
      {showUploader && (
        <ImageUploader
          deviceId={parseInt(id as string)}
          onClose={() => setShowUploader(false)}
          onUploadComplete={() => { setShowUploader(false); refetch(); }}
        />
      )}

      {/* Delete confirm */}
      {deleteImageId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm mx-4 shadow-2xl">
            <h4 className="text-lg font-bold text-on-surface mb-2">Delete Photo?</h4>
            <p className="text-sm text-on-surface-variant mb-6">This cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteImageId(null)} className="px-4 py-2 text-sm font-medium text-on-surface-variant bg-surface-container rounded-lg hover:bg-surface-container-high transition-all">Cancel</button>
              <button onClick={handleDelete} disabled={deletingImage} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-all">
                {deletingImage ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] Build check:
```bash
cd /Users/wottle/Documents/Development/InvDifferent2/web && npx tsc --noEmit 2>&1 | head -20
```

- [ ] Full Next.js build:
```bash
cd /Users/wottle/Documents/Development/InvDifferent2/web && npm run build 2>&1 | tail -20
```
Expected: `✓ Compiled successfully`

- [ ] Update release notes in `web/src/lib/releaseNotes.ts` — add to Unreleased:
```
{ type: "added", text: "Full photo gallery at /devices_new/[id]/photos with masonry grid, lightbox, and role management" }
```

- [ ] Commit:
```bash
git add web/src/app/devices_new/\[id\]/photos/page.tsx web/src/lib/releaseNotes.ts
git commit -m "$(cat <<'EOF'
feat(devices_new): add photos sub-page with masonry grid, lightbox, and image role controls

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Verification

1. Start dev server: `cd web && npm run dev`
2. Navigate to `http://localhost:3000/devices_new/<any-device-id>`
3. Verify:
   - [ ] Accessories section appears in left column (after Historical Notes) when accessories exist or authenticated
   - [ ] Related Devices section shows linked device thumbnails, names, and relationship type badges; cards link to `/devices_new/{id}`
   - [ ] Links section shows external links with label + truncated URL; authenticated users see delete buttons and an add form
   - [ ] Estimated Value card shows "History ↗" button
   - [ ] Clicking "History ↗" opens anchored popover with chart (or "No history yet" message)
   - [ ] Clicking outside the popover closes it; Escape also closes it
   - [ ] Photos section header shows "View all →" link to `/devices_new/{id}/photos`
   - [ ] Maintenance Logs section header shows "View all →" link alongside "+ Add"
   - [ ] Recent Notes section header shows "View all →" link alongside "+ Add"
4. Navigate to `/devices_new/<id>/notes` — verify timeline renders, add/edit/delete work, sort toggle works
5. Navigate to `/devices_new/<id>/logs` — verify full log list, add form with label datalist, delete, cost summary (auth-gated)
6. Navigate to `/devices_new/<id>/photos` — verify masonry grid, lightbox (click + keyboard), upload, delete, role controls
7. Verify original `/devices/<id>` route unchanged
