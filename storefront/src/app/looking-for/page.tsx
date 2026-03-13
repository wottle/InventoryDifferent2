import Link from "next/link";
import { GRAPHQL_URL } from "../../lib/config";

// Force dynamic rendering so we read env vars and fetch fresh data at runtime
export const dynamic = 'force-dynamic';

interface WishlistCategory {
  id: number;
  name: string;
}

interface WishlistItem {
  id: string;
  name: string;
  manufacturer?: string;
  modelNumber?: string;
  releaseYear?: number;
  group?: string;
  category?: WishlistCategory;
  priority: number;
}

async function fetchWishlistItems(): Promise<WishlistItem[]> {
  try {
    const res = await fetch(GRAPHQL_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `
          query GetPublicWishlist {
            wishlistItems(where: { deleted: false }) {
              id
              name
              manufacturer
              modelNumber
              releaseYear
              group
              priority
              category {
                id
                name
              }
            }
          }
        `,
      }),
      cache: 'no-store',
    });
    const json = await res.json();
    return json?.data?.wishlistItems ?? [];
  } catch {
    return [];
  }
}

export default async function LookingForPage() {
  const contactEmail = process.env.CONTACT_EMAIL || 'store@example.com';
  const items = await fetchWishlistItems();

  // Group items
  const groups: Record<string, WishlistItem[]> = {};
  for (const item of items) {
    const key = item.group?.trim() || '__other__';
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
  }

  const namedKeys = Object.keys(groups).filter(k => k !== '__other__').sort();
  const groupKeys = [...namedKeys, ...(groups['__other__'] ? ['__other__'] : [])];

  // Sort within each group: priority asc then name asc
  for (const key of groupKeys) {
    groups[key].sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority;
      return a.name.localeCompare(b.name);
    });
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <div className="border-b border-[var(--border)] bg-[var(--card)]">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-[var(--apple-blue)] hover:underline text-sm">
            ← Back to Shop
          </Link>
          <h1 className="text-lg font-semibold text-[var(--foreground)]">Looking For</h1>
          <div className="w-24" />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-[var(--foreground)]">Devices We're Looking For</h2>
          <p className="mt-2 text-[var(--muted-foreground)] text-sm">
            If you have any of the items listed below and are interested in selling, please{' '}
            <a href={`mailto:${contactEmail}`} className="text-[var(--apple-blue)] hover:underline">
              get in touch
            </a>
            .
          </p>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-16 text-[var(--muted-foreground)]">
            <p>No items on the wishlist right now.</p>
            <p className="text-sm mt-1">Check back soon!</p>
          </div>
        ) : (
          <div className="space-y-8">
            {groupKeys.map(groupKey => {
              const groupItems = groups[groupKey];
              const groupLabel = groupKey === '__other__' ? 'Other' : groupKey;
              return (
                <div key={groupKey}>
                  <h3 className="text-sm font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-3 border-b border-[var(--border)] pb-1">
                    {groupLabel}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {groupItems.map(item => (
                      <div
                        key={item.id}
                        className="rounded border border-[var(--border)] bg-[var(--card)] p-4"
                      >
                        <div className="font-medium text-[var(--foreground)] text-sm">{item.name}</div>
                        {(item.manufacturer || item.modelNumber) && (
                          <div className="text-xs text-[var(--muted-foreground)] mt-0.5">
                            {[item.manufacturer, item.modelNumber].filter(Boolean).join(' · ')}
                            {item.releaseYear ? ` (${item.releaseYear})` : ''}
                          </div>
                        )}
                        {item.category && (
                          <div className="text-xs text-[var(--muted-foreground)] mt-1">{item.category.name}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-10 p-4 rounded border border-[var(--border)] bg-[var(--card)]">
          <p className="text-sm text-[var(--foreground)]">
            <span className="font-semibold">Have something we're looking for?</span>{' '}
            Contact us at{' '}
            <a href={`mailto:${contactEmail}`} className="text-[var(--apple-blue)] hover:underline font-medium">
              {contactEmail}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
