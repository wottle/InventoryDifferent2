"use client";

import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { GET_SHOWCASE_CONFIG, UPSERT_SHOWCASE_CONFIG } from '@/lib/queries';

interface ShowcaseConfig {
  id: string;
  siteTitle: string | null;
  tagline: string | null;
  bioText: string | null;
  heroImagePath: string | null;
  accentColor: string | null;
  timelineCuratorNote: string | null;
  narrativeStatement: string | null;
  collectionOverview: string | null;
}

export default function AdminAppearancePage() {
  const { data, loading } = useQuery<{ showcaseConfig: ShowcaseConfig }>(GET_SHOWCASE_CONFIG);
  const [upsertConfig] = useMutation(UPSERT_SHOWCASE_CONFIG);

  const [siteTitle, setSiteTitle] = useState('');
  const [tagline, setTagline] = useState('');
  const [bioText, setBioText] = useState('');
  const [narrativeStatement, setNarrativeStatement] = useState('');
  const [collectionOverview, setCollectionOverview] = useState('');
  const [timelineCuratorNote, setTimelineCuratorNote] = useState('');
  const [accentColor, setAccentColor] = useState('#6750A4');
  const [heroImagePath, setHeroImagePath] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState(false);
  const [saveError, setSaveError] = useState('');

  // Populate form once config loads
  useEffect(() => {
    if (data?.showcaseConfig) {
      const c = data.showcaseConfig;
      setSiteTitle(c.siteTitle ?? '');
      setTagline(c.tagline ?? '');
      setBioText(c.bioText ?? '');
      setNarrativeStatement(c.narrativeStatement ?? '');
      setCollectionOverview(c.collectionOverview ?? '');
      setTimelineCuratorNote(c.timelineCuratorNote ?? '');
      setAccentColor(c.accentColor ?? '#6750A4');
      setHeroImagePath(c.heroImagePath ?? null);
    }
  }, [data]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const token = typeof window !== 'undefined' ? localStorage.getItem('showcase_access_token') : null;
      const res = await fetch('/upload?deviceId=showcase-config', {
        method: 'POST',
        body: formData,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
      const json = await res.json() as { path: string };
      const relativePath = json.path.replace(/^\/uploads\//, '');
      setHeroImagePath(relativePath);
    } catch {
      setSaveError('Image upload failed. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveError('');
    setSavedMessage(false);
    if (accentColor && !/^#[0-9A-Fa-f]{6}$/.test(accentColor)) {
      setSaveError('Accent color must be a valid 6-digit hex color (e.g. #6750A4).');
      setSaving(false);
      return;
    }
    try {
      await upsertConfig({
        variables: {
          input: {
            siteTitle: siteTitle.trim(),
            tagline: tagline.trim(),
            bioText: bioText.trim(),
            narrativeStatement: narrativeStatement.trim(),
            collectionOverview: collectionOverview.trim(),
            heroImagePath: heroImagePath || null,
            accentColor: accentColor.trim() || '#0058bc',
            timelineCuratorNote: timelineCuratorNote.trim(),
          },
        },
      });
      setSavedMessage(true);
      setTimeout(() => setSavedMessage(false), 2000);
    } catch {
      setSaveError('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-headline font-bold tracking-tight text-on-surface">Appearance</h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Customize your site&apos;s title, copy, and visual identity.
          </p>
        </div>
        {savedMessage && (
          <span className="text-sm font-medium text-primary bg-primary/10 px-4 py-2 rounded-full">
            Saved!
          </span>
        )}
      </div>

      <form onSubmit={handleSave} className="flex flex-col gap-6">
        {/* Site Identity */}
        <section className="bg-surface-container-lowest rounded-xl p-6 flex flex-col gap-5">
          <h2 className="text-xs font-label uppercase tracking-widest text-outline">
            Site Identity
          </h2>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-on-surface-variant uppercase tracking-wide">
              Site Title
            </label>
            <input
              type="text"
              value={siteTitle}
              onChange={(e) => setSiteTitle(e.target.value)}
              placeholder="e.g. The Wottle Collection"
              className="bg-surface border border-outline-variant rounded-lg px-3 py-2 text-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-primary transition"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-on-surface-variant uppercase tracking-wide">
              Tagline
            </label>
            <input
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="e.g. A curated archive of vintage computing"
              className="bg-surface border border-outline-variant rounded-lg px-3 py-2 text-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-primary transition"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-on-surface-variant uppercase tracking-wide">
              Bio Text
            </label>
            <textarea
              value={bioText}
              onChange={(e) => setBioText(e.target.value)}
              placeholder="A brief description of you and your collection…"
              rows={4}
              className="bg-surface border border-outline-variant rounded-lg px-3 py-2 text-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-primary transition resize-none"
            />
          </div>
        </section>

        {/* Homepage Copy */}
        <section className="bg-surface-container-lowest rounded-xl p-6 flex flex-col gap-5">
          <h2 className="text-xs font-label uppercase tracking-widest text-outline">
            Homepage
          </h2>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-on-surface-variant uppercase tracking-wide">
              Narrative Statement
            </label>
            <p className="text-xs text-outline -mt-0.5">The large bold heading in the &ldquo;The Narrative&rdquo; section.</p>
            <textarea
              value={narrativeStatement}
              onChange={(e) => setNarrativeStatement(e.target.value)}
              placeholder="e.g. Precision isn't just a measurement; it's a philosophy…"
              rows={3}
              className="bg-surface border border-outline-variant rounded-lg px-3 py-2 text-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-primary transition resize-none"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-on-surface-variant uppercase tracking-wide">
              Collection Overview
            </label>
            <p className="text-xs text-outline -mt-0.5">The body text in the right column of the narrative section.</p>
            <textarea
              value={collectionOverview}
              onChange={(e) => setCollectionOverview(e.target.value)}
              placeholder="A description of your collection and its philosophy…"
              rows={4}
              className="bg-surface border border-outline-variant rounded-lg px-3 py-2 text-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-primary transition resize-none"
            />
          </div>
        </section>

        {/* Timeline */}
        <section className="bg-surface-container-lowest rounded-xl p-6 flex flex-col gap-5">
          <h2 className="text-xs font-label uppercase tracking-widest text-outline">
            Timeline
          </h2>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-on-surface-variant uppercase tracking-wide">
              Curator&apos;s Note
            </label>
            <textarea
              value={timelineCuratorNote}
              onChange={(e) => setTimelineCuratorNote(e.target.value)}
              placeholder="A note that appears at the top of the timeline page…"
              rows={4}
              className="bg-surface border border-outline-variant rounded-lg px-3 py-2 text-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-primary transition resize-none"
            />
          </div>
        </section>

        {/* Hero Image */}
        <section className="bg-surface-container-lowest rounded-xl p-6 flex flex-col gap-5">
          <h2 className="text-xs font-label uppercase tracking-widest text-outline">
            Hero Image
          </h2>

          {heroImagePath && (
            <div className="rounded-lg overflow-hidden border border-outline-variant w-full max-w-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/uploads/${heroImagePath}`}
                alt="Hero"
                className="w-full h-40 object-cover"
              />
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-on-surface-variant uppercase tracking-wide">
              {heroImagePath ? 'Replace Image' : 'Upload Image'}
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={uploadingImage}
              className="text-sm text-on-surface-variant file:mr-3 file:py-1.5 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-medium file:bg-primary/10 file:text-primary hover:file:bg-primary/20 file:cursor-pointer disabled:opacity-50"
            />
            {uploadingImage && (
              <p className="text-xs text-on-surface-variant">Uploading…</p>
            )}
          </div>
        </section>

        {/* Accent Color */}
        <section className="bg-surface-container-lowest rounded-xl p-6 flex flex-col gap-5">
          <h2 className="text-xs font-label uppercase tracking-widest text-outline">
            Accent Color
          </h2>

          <div className="flex items-center gap-4">
            <input
              type="color"
              value={accentColor}
              onChange={(e) => setAccentColor(e.target.value)}
              className="w-12 h-10 rounded-lg border border-outline-variant cursor-pointer bg-surface p-0.5"
            />
            <input
              type="text"
              value={accentColor}
              onChange={(e) => {
                const val = e.target.value;
                if (/^#[0-9A-Fa-f]{0,6}$/.test(val)) {
                  setAccentColor(val);
                }
              }}
              placeholder="#6750A4"
              maxLength={7}
              className="bg-surface border border-outline-variant rounded-lg px-3 py-2 text-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-primary transition w-32 font-mono"
            />
            <span className="text-xs text-on-surface-variant">
              Used for highlights and interactive elements
            </span>
          </div>
        </section>

        {/* Save */}
        {saveError && (
          <p className="text-sm text-error">{saveError}</p>
        )}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving || uploadingImage}
            className="bg-primary text-on-primary font-semibold rounded-full px-6 py-2.5 text-sm hover:opacity-90 transition disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
