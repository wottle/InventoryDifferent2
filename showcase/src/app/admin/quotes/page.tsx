"use client";

import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import {
  GET_SHOWCASE_QUOTES,
  UPSERT_SHOWCASE_QUOTE,
  DELETE_SHOWCASE_QUOTE,
} from '@/lib/queries';

interface ShowcaseQuote {
  id: string;
  author: string;
  text: string;
  source: string | null;
  isDefault: boolean;
  isEnabled: boolean;
}

export default function AdminQuotesPage() {
  const { data, loading, refetch } = useQuery<{ showcaseQuotes: ShowcaseQuote[] }>(
    GET_SHOWCASE_QUOTES
  );

  const [upsertQuote] = useMutation(UPSERT_SHOWCASE_QUOTE);
  const [deleteQuote] = useMutation(DELETE_SHOWCASE_QUOTE);

  const [newAuthor, setNewAuthor] = useState('');
  const [newText, setNewText] = useState('');
  const [newSource, setNewSource] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const quotes = data?.showcaseQuotes ?? [];
  const defaultQuotes = quotes.filter((q) => q.isDefault);
  const userQuotes = quotes.filter((q) => !q.isDefault);

  const handleToggle = async (quote: ShowcaseQuote) => {
    try {
      await upsertQuote({
        variables: {
          input: {
            id: quote.id,
            author: quote.author,
            text: quote.text,
            source: quote.source,
            isEnabled: !quote.isEnabled,
          },
        },
      });
      refetch();
    } catch {
      setSaveError('Failed to update quote. Please try again.');
    }
  };

  const handleDelete = async (quote: ShowcaseQuote) => {
    if (!window.confirm(`Delete this quote by "${quote.author}"? This cannot be undone.`)) return;
    try {
      await deleteQuote({ variables: { id: quote.id } });
      refetch();
    } catch {
      setSaveError('Failed to delete quote. Please try again.');
    }
  };

  const handleAddQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAuthor.trim() || !newText.trim()) {
      setSaveError('Author and text are required.');
      return;
    }
    setSaving(true);
    setSaveError('');
    try {
      await upsertQuote({
        variables: {
          input: {
            author: newAuthor.trim(),
            text: newText.trim(),
            source: newSource.trim() || null,
            isEnabled: true,
          },
        },
      });
      setNewAuthor('');
      setNewText('');
      setNewSource('');
      refetch();
    } catch {
      setSaveError('Failed to save quote.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-headline font-bold tracking-tight text-on-surface">Quotes</h1>
        <p className="text-sm text-on-surface-variant mt-1">
          Manage the quotes shown throughout the site. Enable or disable individual quotes.
        </p>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-24">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!loading && (
        <div className="flex flex-col gap-8">
          {/* Default Quotes */}
          <section>
            <h2 className="text-xs font-label uppercase tracking-widest text-outline mb-3">
              Default Quotes
            </h2>
            {defaultQuotes.length === 0 ? (
              <div className="bg-surface-container-lowest rounded-xl p-8 text-center text-on-surface-variant text-sm">
                No default quotes.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {defaultQuotes.map((quote) => (
                  <QuoteRow
                    key={quote.id}
                    quote={quote}
                    onToggle={handleToggle}
                    onDelete={null}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Your Quotes */}
          <section>
            <h2 className="text-xs font-label uppercase tracking-widest text-outline mb-3">
              Your Quotes
            </h2>
            {userQuotes.length === 0 ? (
              <div className="bg-surface-container-lowest rounded-xl p-8 text-center text-on-surface-variant text-sm">
                No custom quotes yet. Add one below.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {userQuotes.map((quote) => (
                  <QuoteRow
                    key={quote.id}
                    quote={quote}
                    onToggle={handleToggle}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Add Quote */}
          <section>
            <h2 className="text-xs font-label uppercase tracking-widest text-outline mb-3">
              Add Quote
            </h2>
            <div className="bg-surface-container-lowest rounded-xl p-6">
              <form onSubmit={handleAddQuote} className="flex flex-col gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-on-surface-variant uppercase tracking-wide">
                      Author <span className="text-error">*</span>
                    </label>
                    <input
                      type="text"
                      value={newAuthor}
                      onChange={(e) => setNewAuthor(e.target.value)}
                      placeholder="e.g. Steve Jobs"
                      className="bg-surface border border-outline-variant rounded-lg px-3 py-2 text-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-primary transition"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-on-surface-variant uppercase tracking-wide">
                      Source
                    </label>
                    <input
                      type="text"
                      value={newSource}
                      onChange={(e) => setNewSource(e.target.value)}
                      placeholder="e.g. WWDC 1997"
                      className="bg-surface border border-outline-variant rounded-lg px-3 py-2 text-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-primary transition"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-on-surface-variant uppercase tracking-wide">
                    Text <span className="text-error">*</span>
                  </label>
                  <textarea
                    value={newText}
                    onChange={(e) => setNewText(e.target.value)}
                    placeholder="Enter the quote text…"
                    rows={3}
                    className="bg-surface border border-outline-variant rounded-lg px-3 py-2 text-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-primary transition resize-none"
                  />
                </div>
                {saveError && (
                  <p className="text-sm text-error">{saveError}</p>
                )}
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="bg-primary text-on-primary font-semibold rounded-full px-5 py-2 text-sm hover:opacity-90 transition disabled:opacity-50"
                  >
                    {saving ? 'Saving…' : 'Save Quote'}
                  </button>
                </div>
              </form>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function QuoteRow({
  quote,
  onToggle,
  onDelete,
}: {
  quote: ShowcaseQuote;
  onToggle: (q: ShowcaseQuote) => void;
  onDelete: ((q: ShowcaseQuote) => void) | null;
}) {
  return (
    <div
      className={`bg-surface-container-lowest rounded-xl px-6 py-4 flex items-start gap-4 hover:bg-surface-container-low transition ${
        !quote.isEnabled ? 'opacity-50' : ''
      }`}
    >
      {/* Enable toggle */}
      <label className="flex items-center gap-2 cursor-pointer shrink-0 mt-0.5">
        <input
          type="checkbox"
          checked={quote.isEnabled}
          onChange={() => onToggle(quote)}
          className="w-4 h-4 accent-primary cursor-pointer"
        />
        <span className="text-xs text-on-surface-variant whitespace-nowrap">
          {quote.isEnabled ? 'Enabled' : 'Disabled'}
        </span>
      </label>

      {/* Quote content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-on-surface leading-relaxed">&ldquo;{quote.text}&rdquo;</p>
        <p className="text-xs text-on-surface-variant mt-1">
          — {quote.author}
          {quote.source && (
            <span className="text-outline"> &middot; {quote.source}</span>
          )}
        </p>
      </div>

      {/* Delete */}
      {onDelete && (
        <button
          onClick={() => onDelete(quote)}
          className="px-4 py-1.5 rounded-full text-sm font-medium text-error border border-error/30 hover:bg-error/10 transition shrink-0"
        >
          Delete
        </button>
      )}
    </div>
  );
}
