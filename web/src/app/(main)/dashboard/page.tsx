'use client';

import { useQuery } from '@apollo/client';
import gql from 'graphql-tag';
import Link from 'next/link';
import { useAuth } from '../../../lib/auth-context';
import { useT } from '../../../i18n/context';
import { useRequireAuth } from '../../../lib/useRequireAuth';
import { LoadingPanel } from '../../../components/LoadingPanel';
import { useIsDarkMode } from '../../../lib/useIsDarkMode';
import { pickThumbnail } from '../../../lib/pickThumbnail';

const DASHBOARD_QUERY = gql`
  query GetDashboard {
    dashboard {
      recentActivity {
        id
        type
        metadata
        createdAt
        device {
          id
          name
          images {
            path
            thumbnailPath
            isThumbnail
            thumbnailMode
          }
        }
      }
      financialSnapshot {
        spentThisMonth
        revenueThisMonth
        netThisMonth
        collectionValue
      }
      needsAttention {
        inRepair {
          id
          name
          images { path thumbnailPath isThumbnail thumbnailMode }
        }
        pramBatteryPending {
          id
          name
          images { path thumbnailPath isThumbnail thumbnailMode }
        }
        unknownFunctionalStatus {
          id
          name
          images { path thumbnailPath isThumbnail thumbnailMode }
        }
      }
      collectionHealth {
        noImages
        noNotes
        missingSpecs
      }
    }
  }
`;

type DeviceImage = { path: string; thumbnailPath?: string; isThumbnail: boolean; thumbnailMode?: string | null };
type AttentionDevice = { id: number; name: string; images: DeviceImage[] };
type ActivityEntry = {
  id: number;
  type: string;
  metadata: string | null;
  createdAt: string;
  device: { id: number; name: string; images: DeviceImage[] };
};

function relativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = now.getTime() - date.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}

function fmtCurrency(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n);
}

function DeviceThumbnail({ images, size = 'size-16' }: { images: DeviceImage[]; size?: string }) {
  const isDark = useIsDarkMode();
  const thumb = pickThumbnail(images ?? [], isDark);
  const src = thumb ? (thumb.thumbnailPath || thumb.path) : null;
  if (src) {
    return (
      <div className={`${size} rounded-lg flex-shrink-0 overflow-hidden`}>
        <img src={src} alt="" className="w-full h-full object-cover" />
      </div>
    );
  }
  return (
    <div className={`${size} rounded-lg bg-surface-container-high flex-shrink-0 flex items-center justify-center`}>
      <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: '1.25rem' }}>
        devices
      </span>
    </div>
  );
}

function activityContent(entry: ActivityEntry): { title: string; subtitle: string | null } {
  const d = entry.device;
  const meta: Record<string, any> = entry.metadata ? JSON.parse(entry.metadata) : {};

  switch (entry.type) {
    case 'STATUS_CHANGED': {
      const to = String(meta.to ?? '');
      const from = String(meta.from ?? '');
      if (to === 'FOR_SALE') {
        const title = meta.listPrice ? `Listed ${d.name} for ${fmtCurrency(meta.listPrice)}` : `Listed ${d.name}`;
        return { title, subtitle: 'Moved to For Sale' };
      }
      if (to === 'PENDING_SALE') {
        const title = meta.listPrice ? `${d.name} sale pending at ${fmtCurrency(meta.listPrice)}` : `${d.name} sale pending`;
        return { title, subtitle: 'Status changed to Pending Sale' };
      }
      if (to === 'SOLD') {
        const title = meta.soldPrice ? `Sold ${d.name} for ${fmtCurrency(meta.soldPrice)}` : `Sold ${d.name}`;
        return { title, subtitle: 'Sale completed' };
      }
      if (to === 'DONATED') return { title: `Donated ${d.name}`, subtitle: 'Status changed to Donated' };
      if (to === 'RETURNED') {
        const title = meta.soldPrice ? `${d.name} returned from repair — Fee: ${fmtCurrency(meta.soldPrice)}` : `${d.name} returned from repair`;
        return { title, subtitle: 'Repair return logged' };
      }
      if (to === 'LOANED') return { title: `Loaned out ${d.name}`, subtitle: 'Status changed to Loaned' };
      if (from === 'LOANED') return { title: `${d.name} returned from loan`, subtitle: 'Back in collection' };
      return { title: `${d.name} status changed to ${to}`, subtitle: null };
    }
    case 'FUNCTIONAL_STATUS_CHANGED':
      return { title: `${d.name} condition updated`, subtitle: `${meta.from} → ${meta.to}` };
    case 'NOTE_ADDED':
      return { title: `Added a note to ${d.name}`, subtitle: meta.preview || null };
    case 'MAINTENANCE_LOGGED': {
      const subtitle = meta.cost ? `${meta.label} — ${fmtCurrency(meta.cost)}` : String(meta.label ?? '');
      return { title: `Logged maintenance on ${d.name}`, subtitle };
    }
    case 'POWERED_ON':
      return { title: `Powered on ${d.name}`, subtitle: 'Last power-on date updated' };
    case 'DEVICE_ACQUIRED': {
      let title = `Acquired ${d.name}`;
      if (meta.whereAcquired) title += ` from ${meta.whereAcquired}`;
      if (meta.priceAcquired) title += ` for ${fmtCurrency(meta.priceAcquired)}`;
      return { title, subtitle: 'New addition to collection' };
    }
    default:
      return { title: `${d.name} updated`, subtitle: null };
  }
}

export default function DashboardPage() {
  const t = useT();
  const redirecting = useRequireAuth();
  const { isAuthenticated } = useAuth();
  const { data, loading } = useQuery(DASHBOARD_QUERY, { fetchPolicy: 'cache-and-network' });

  const dashboard = data?.dashboard;
  const financial = isAuthenticated ? dashboard?.financialSnapshot : null;
  const activity: ActivityEntry[] = dashboard?.recentActivity ?? [];
  const needs = dashboard?.needsAttention;
  const health = dashboard?.collectionHealth;

  const allAttentionEmpty =
    needs &&
    needs.inRepair.length === 0 &&
    needs.pramBatteryPending.length === 0 &&
    needs.unknownFunctionalStatus.length === 0;

  if (loading && !data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-on-surface-variant">{t.dashboard.loading}</p>
      </div>
    );
  }

  if (redirecting) return <LoadingPanel title={t.nav.dashboard} />;

  return (
    <div className="min-h-screen font-sans p-8 lg:p-12">
      <div className="max-w-screen-xl mx-auto space-y-10">

        {/* ── Financial Snapshot (auth-gated) ── */}
        {financial && (
          <section>
            <div className="flex items-baseline justify-between mb-6">
              <h2 className="text-3xl font-bold tracking-tight text-on-surface">
                {t.dashboard.financialSnapshot}
              </h2>
              <Link
                href="/financials"
                className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
              >
                {t.dashboard.allFinancials}
                <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>chevron_right</span>
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-surface-container-lowest p-8 rounded-xl flex flex-col gap-3 transition-all hover:bg-white hover:shadow-[0px_32px_32px_rgba(0,0,0,0.02)]">
                <span className="text-sm font-medium text-on-surface-variant">{t.dashboard.spentThisMonth}</span>
                <span className="text-3xl font-bold leading-none text-on-surface">{fmtCurrency(financial.spentThisMonth)}</span>
              </div>
              <div className="bg-surface-container-lowest p-8 rounded-xl flex flex-col gap-3 transition-all hover:bg-white hover:shadow-[0px_32px_32px_rgba(0,0,0,0.02)]">
                <span className="text-sm font-medium text-on-surface-variant">{t.dashboard.revenueThisMonth}</span>
                <span className="text-3xl font-bold leading-none text-on-surface">{fmtCurrency(financial.revenueThisMonth)}</span>
              </div>
              <div className="bg-surface-container-lowest p-8 rounded-xl flex flex-col gap-3 transition-all hover:bg-white hover:shadow-[0px_32px_32px_rgba(0,0,0,0.02)]">
                <span className="text-sm font-medium text-on-surface-variant">{t.dashboard.netThisMonth}</span>
                <span className={`text-3xl font-bold leading-none ${financial.netThisMonth >= 0 ? 'text-on-surface' : 'text-error'}`}>
                  {fmtCurrency(financial.netThisMonth)}
                </span>
              </div>
              {/* Collection Value — gold accent card */}
              <div className="bg-surface-container-lowest p-8 rounded-xl flex flex-col gap-3 transition-all hover:bg-white hover:shadow-[0px_32px_32px_rgba(0,0,0,0.02)] border-l-4 border-tertiary">
                <span className="text-sm font-medium text-on-surface-variant">{t.dashboard.collectionValue}</span>
                <span className="text-3xl font-bold leading-none text-on-surface">{fmtCurrency(financial.collectionValue)}</span>
                <span className="inline-flex self-start px-2 py-0.5 rounded-sm bg-tertiary-fixed text-on-tertiary-fixed text-[10px] font-bold uppercase tracking-wider">
                  {t.dashboard.premium}
                </span>
              </div>
            </div>
          </section>
        )}

        {/* ── Main grid: Activity Feed + Sidebar ── */}
        <div className="grid lg:grid-cols-12 gap-10">

          {/* Activity Feed — 8 columns */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            <h2 className="text-3xl font-bold tracking-tight text-on-surface">{t.dashboard.recentActivity}</h2>

            {activity.length === 0 ? (
              <p className="text-on-surface-variant text-center py-12">{t.dashboard.noActivity}</p>
            ) : (
              <div className="flex flex-col gap-2">
                {activity.map((entry) => {
                  const { title, subtitle } = activityContent(entry);
                  return (
                    <Link
                      key={entry.id}
                      href={`/devices/${entry.device.id}`}
                      className="group bg-surface-container-low hover:bg-surface-container-lowest border border-transparent hover:border-outline-variant/10 rounded-xl p-4 flex items-center gap-6 transition-all"
                    >
                      <DeviceThumbnail images={entry.device.images} size="size-16" />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-on-surface group-hover:text-primary transition-colors truncate">
                          {title}
                        </p>
                        {subtitle && (
                          <p className="text-sm text-on-surface-variant truncate">{subtitle}</p>
                        )}
                      </div>
                      <span className="text-xs font-medium text-on-surface-variant whitespace-nowrap flex-shrink-0">
                        {relativeTime(entry.createdAt)}
                      </span>
                    </Link>
                  );
                })}
                <button className="w-full py-4 rounded-xl bg-surface-container-high font-bold text-on-surface hover:bg-surface-container-highest transition-colors flex items-center justify-center gap-2 mt-2">
                  <span className="material-symbols-outlined" style={{ fontSize: '1.125rem' }}>history</span>
                  {t.dashboard.viewCompleteLog}
                </button>
              </div>
            )}
          </div>

          {/* Sidebar — 4 columns */}
          <div className="lg:col-span-4 flex flex-col gap-6">

            {/* Needs Attention */}
            {allAttentionEmpty ? (
              <div className="bg-surface-container-low rounded-xl p-6">
                <p className="text-sm text-on-surface-variant">{t.dashboard.allGood}</p>
              </div>
            ) : (
              <div className="bg-surface-container-low rounded-xl p-6 flex flex-col gap-6">
                <h3 className="text-xl font-bold tracking-tight text-on-surface">{t.dashboard.needsAttention}</h3>

                {needs && needs.inRepair.length > 0 && (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[0.6875rem] font-bold uppercase tracking-wider text-on-surface-variant">
                        {t.dashboard.inRepair}
                      </span>
                      <span className="px-2 py-0.5 bg-error/10 text-error text-[10px] font-bold rounded-sm uppercase tracking-wider">
                        {t.dashboard.highPriority}
                      </span>
                    </div>
                    {needs.inRepair.map((device: AttentionDevice) => (
                      <Link
                        key={device.id}
                        href={`/devices/${device.id}`}
                        className="bg-surface-container-lowest p-4 rounded-lg flex items-center gap-4 hover:shadow-sm transition-all"
                      >
                        <DeviceThumbnail images={device.images} size="size-12" />
                        <span className="text-sm font-bold text-on-surface truncate">{device.name}</span>
                      </Link>
                    ))}
                  </div>
                )}

                {needs && needs.pramBatteryPending.length > 0 && (
                  <div className="flex flex-col gap-3">
                    <span className="text-[0.6875rem] font-bold uppercase tracking-wider text-on-surface-variant">
                      {t.dashboard.pramBatteryPending}
                    </span>
                    {needs.pramBatteryPending.map((device: AttentionDevice) => (
                      <Link
                        key={device.id}
                        href={`/devices/${device.id}`}
                        className="bg-surface-container-lowest p-4 rounded-lg flex items-center justify-between hover:shadow-sm transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div className="size-10 rounded bg-surface-container-high flex items-center justify-center">
                            <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: '1.125rem' }}>
                              battery_alert
                            </span>
                          </div>
                          <span className="text-sm font-medium text-on-surface truncate">{device.name}</span>
                        </div>
                        <span className="material-symbols-outlined text-outline" style={{ fontSize: '1.125rem' }}>
                          chevron_right
                        </span>
                      </Link>
                    ))}
                  </div>
                )}

                {needs && needs.unknownFunctionalStatus.length > 0 && (
                  <div className="flex flex-col gap-3">
                    <span className="text-[0.6875rem] font-bold uppercase tracking-wider text-on-surface-variant">
                      {t.dashboard.unknownCondition}
                    </span>
                    {needs.unknownFunctionalStatus.map((device: AttentionDevice) => (
                      <Link
                        key={device.id}
                        href={`/devices/${device.id}`}
                        className="bg-surface-container-lowest p-4 rounded-lg flex items-center justify-between hover:shadow-sm transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div className="size-10 rounded bg-surface-container-high flex items-center justify-center">
                            <span className="material-symbols-outlined text-outline" style={{ fontSize: '1.125rem' }}>
                              help
                            </span>
                          </div>
                          <span className="text-sm font-medium text-on-surface truncate">{device.name}</span>
                        </div>
                        <span className="material-symbols-outlined text-outline" style={{ fontSize: '1.125rem' }}>
                          chevron_right
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Add New Collection Entry CTA */}
            <Link
              href="/devices/new"
              className="flex items-center justify-center gap-2 w-full py-5 rounded-full font-bold text-white shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
              style={{ background: 'linear-gradient(135deg, #0058bc 0%, #0070eb 100%)' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>add_circle</span>
              {t.dashboard.addNewEntry}
            </Link>

            {/* Collection Health */}
            {health && (
              <div className="bg-surface-container-low rounded-xl p-6">
                <h3 className="text-xl font-bold tracking-tight text-on-surface mb-6">
                  {t.dashboard.collectionHealth}
                </h3>
                <div className="flex flex-col gap-2">
                  {[
                    { count: health.noImages, labelKey: 'noImages' as const, href: '/?noImages=true' },
                    { count: health.noNotes, labelKey: 'noNotes' as const, href: '/?noNotes=true' },
                    { count: health.missingSpecs, labelKey: 'missingSpecs' as const, href: '/?missingSpecs=true' },
                  ].map(({ count, labelKey, href }) => {
                    const parts = t.dashboard[labelKey].split('{n}');
                    return (
                      <Link
                        key={labelKey}
                        href={href}
                        className="group bg-surface-container-lowest p-4 rounded-lg flex items-center justify-between hover:shadow-sm transition-all"
                      >
                        <span className="text-sm text-on-surface-variant">
                          {parts[0]}
                          <span className={`font-bold ${count > 0 ? 'text-tertiary' : 'text-[#078838]'}`}>
                            {count}
                          </span>
                          {parts[1]}
                        </span>
                        <span
                          className="material-symbols-outlined text-outline group-hover:text-primary group-hover:translate-x-0.5 transition-all"
                          style={{ fontSize: '1rem' }}
                        >
                          chevron_right
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
