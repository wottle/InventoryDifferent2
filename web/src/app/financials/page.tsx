"use client";

import { useQuery } from "@apollo/client";
import gql from "graphql-tag";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { LoadingPanel } from "../../components/LoadingPanel";
import { useT } from "../../i18n/context";

const PeriodicCashFlowChart = dynamic(() => import("../../components/PeriodicCashFlowChart"), {
  ssr: false,
  loading: () => (
    <div className="p-4">
      <LoadingPanel title="Loading chart…" subtitle="Grouping by period" />
    </div>
  ),
});

const FinancialChart = dynamic(() => import("../../components/FinancialChart"), {
  ssr: false,
  loading: () => (
    <div className="p-4">
      <LoadingPanel title="Loading chart…" subtitle="Plotting the lines" />
    </div>
  ),
});

const GET_FINANCIALS = gql`
  query GetFinancials {
    financialOverview {
      totalSpent
      totalReceived
      netCash
      estimatedValueOwned
      netPosition
      totalProfit
      totalMaintenanceCost
    }
    financialTransactions {
      type
      deviceId
      deviceName
      additionalName
      date
      amount
      estimatedValue
      label
    }
  }
`;

function valueColorClass(value: number | null | undefined) {
  const n = Number(value ?? 0);
  if (!Number.isFinite(n) || n === 0) return "text-gray-900 dark:text-gray-100";
  return n > 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400";
}

function formatDate(dateString: string | null | undefined) {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString("en-US", {
    timeZone: "UTC",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function dateMs(dateString: string | null | undefined) {
  if (!dateString) return null;
  const ms = new Date(dateString).getTime();
  return Number.isNaN(ms) ? null : ms;
}

interface PeriodBucket {
  key: string;
  label: string;
  received: number;
  spent: number;
  net: number;
}

function aggregateByPeriod(
  transactions: any[],
  mode: "monthly" | "yearly"
): PeriodBucket[] {
  const buckets = new Map<string, { received: number; spent: number }>();

  for (const tx of transactions) {
    if (!tx.date || tx.type === "DONATION") continue;
    const ms = dateMs(tx.date);
    if (ms === null) continue;

    const d = new Date(tx.date);
    const key =
      mode === "monthly"
        ? `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`
        : `${d.getUTCFullYear()}`;

    if (!buckets.has(key)) buckets.set(key, { received: 0, spent: 0 });
    const bucket = buckets.get(key)!;
    const amount = Number(tx.amount ?? 0) || 0;

    if (tx.type === "SALE" || tx.type === "REPAIR_RETURN") {
      bucket.received += amount;
    } else if (tx.type === "ACQUISITION" || tx.type === "MAINTENANCE") {
      bucket.spent += amount;
    }
  }

  return Array.from(buckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, { received, spent }]) => {
      const d = new Date(key + (mode === "monthly" ? "-01T00:00:00Z" : "-01-01T00:00:00Z"));
      const label =
        mode === "monthly"
          ? d.toLocaleDateString("en-US", { timeZone: "UTC", month: "short", year: "2-digit" })
          : `${d.getUTCFullYear()}`;
      return { key, label, received, spent, net: received + spent };
    });
}

export default function FinancialsPage() {
  const t = useT();
  const { data, loading, error } = useQuery(GET_FINANCIALS, {
    fetchPolicy: "cache-and-network",
  });

  const [periodMode, setPeriodMode] = useState<"monthly" | "yearly">("monthly");

  const overview = data?.financialOverview;
  const transactions = data?.financialTransactions ?? [];

  const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined) return "";
    return `${t.common.currencySymbol}${Number(value).toFixed(2)}`;
  };

  const { transactionsWithCumulative, chartData, periodicChartData } = useMemo(() => {
    const rows = transactions.map((t: any, idx: number) => {
      const ms = dateMs(t.date);
      return {
        ...t,
        _ms: ms,
        _idx: idx,
      };
    });

    rows.sort((a: any, b: any) => {
      // For cumulative math, build oldest -> newest. Undated goes first.
      const at = a._ms ?? -Infinity;
      const bt = b._ms ?? -Infinity;
      if (at !== bt) return at - bt;
      return a._idx - b._idx;
    });

    let runningCash = 0;
    let runningValue = 0;
    let runningNet = 0;
    const withCum = rows.map((t: any) => {
      const cash = Number(t.amount ?? 0) || 0;
      const est = Number(t.estimatedValue ?? 0) || 0;
      runningCash += cash;
      runningValue += est;
      runningNet += cash + est;
      return {
        ...t,
        cumulativeCash: runningCash,
        cumulativeValue: runningValue,
        cumulativeNet: runningNet,
      };
    });

    // Build chart data from chronological order (only dated transactions)
    const chartDataPoints = withCum
      .filter((t: any) => t._ms !== null)
      .map((t: any) => ({
        date: new Date(t.date).toLocaleDateString("en-US", { timeZone: "UTC", month: "short", year: "2-digit" }),
        dateMs: t._ms,
        cash: t.cumulativeCash,
        value: t.cumulativeValue,
        net: t.cumulativeNet,
      }));

    // Sort for display (newest -> oldest)
    withCum.sort((a: any, b: any) => {
      const at = a._ms ?? Infinity;
      const bt = b._ms ?? Infinity;
      if (at !== bt) return bt - at;
      return b._idx - a._idx;
    });

    const periodicChartData = aggregateByPeriod(transactions, periodMode);
    return { transactionsWithCumulative: withCum, chartData: chartDataPoints, periodicChartData };
  }, [transactions, periodMode]);

  return (
    <div className="min-h-screen font-sans">
      <header className="mb-6 flex items-center justify-between border-b border-[var(--border)] pb-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-light tracking-tight text-[var(--foreground)]">{t.pages.financials.title}</h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            {t.pages.financials.subtitle}
          </p>
        </div>
        <Link href="/" className="btn-retro text-sm px-3 py-1.5">
          {t.common.back}
        </Link>
      </header>

      {loading && (
        <div className="p-4">
          <LoadingPanel title={t.pages.financials.loading} subtitle={t.pages.financials.loadingSubtitle} />
        </div>
      )}
      {error && <div className="p-4 text-red-500">Error: {error.message}</div>}

      {!loading && !error && overview && (
        <div className="space-y-6">
          <section className="rounded border border-[var(--border)] bg-[var(--card)] p-4 card-retro">
            <h2 className="mb-3 text-sm font-semibold text-[var(--foreground)]">{t.pages.financials.summary}</h2>
            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded border border-[var(--border)] p-4 bg-[var(--background)]">
                  <div className="text-xs text-[var(--muted-foreground)]">{t.pages.financials.totalSpent}</div>
                  <div className="mt-1 text-2xl font-light tabular-nums text-red-600 dark:text-red-400">
                    {formatCurrency(overview.totalSpent)}
                  </div>
                </div>
                <div className="rounded border border-[var(--border)] p-4 bg-[var(--background)]">
                  <div className="text-xs text-[var(--muted-foreground)]">{t.pages.financials.totalReceived}</div>
                  <div className="mt-1 text-2xl font-light tabular-nums text-green-600 dark:text-green-400">
                    {formatCurrency(overview.totalReceived)}
                  </div>
                </div>
                <div className="rounded border border-[var(--border)] p-4 bg-[var(--background)]">
                  <div className="text-xs text-[var(--muted-foreground)]">{t.pages.financials.netCash}</div>
                  <div className={`mt-1 text-2xl font-light tabular-nums ${valueColorClass(overview.netCash)}`}>
                    {formatCurrency(overview.netCash)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded border border-[var(--border)] p-4 bg-[var(--background)]">
                  <div className="text-xs text-[var(--muted-foreground)]">{t.pages.financials.estimatedValueOwned}</div>
                  <div className="mt-1 text-2xl font-light tabular-nums text-green-600 dark:text-green-400">
                    {formatCurrency(overview.estimatedValueOwned)}
                  </div>
                </div>
                <div className="rounded border border-[var(--border)] p-4 bg-[var(--background)]">
                  <div className="text-xs text-[var(--muted-foreground)]">{t.pages.financials.maintenanceCosts}</div>
                  <div className="mt-1 text-2xl font-light tabular-nums text-red-600 dark:text-red-400">
                    {formatCurrency(overview.totalMaintenanceCost)}
                  </div>
                </div>
                <div className="rounded border border-[var(--border)] p-4 bg-[var(--background)]">
                  <div className="text-xs text-[var(--muted-foreground)]">{t.pages.financials.netPosition}</div>
                  <div className={`mt-1 text-2xl font-light tabular-nums ${valueColorClass(overview.netPosition)}`}>
                    {formatCurrency(overview.netPosition)}
                  </div>
                </div>
                <div className="rounded border border-[var(--border)] p-4 bg-[var(--background)]">
                  <div className="text-xs text-[var(--muted-foreground)]">{t.pages.financials.realizedProfit}</div>
                  <div className={`mt-1 text-2xl font-light tabular-nums ${valueColorClass(overview.totalProfit)}`}>
                    {formatCurrency(overview.totalProfit)}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded border border-[var(--border)] bg-[var(--card)] p-4 card-retro">
            <h2 className="mb-1 text-sm font-semibold text-[var(--foreground)]">{t.pages.financials.valueOverTime}</h2>
            <p className="mb-4 text-xs text-[var(--muted-foreground)]">
              {t.pages.financials.valueOverTimeDesc}
            </p>
            <FinancialChart data={chartData} />
          </section>

          <section className="rounded border border-[var(--border)] bg-[var(--card)] p-4 card-retro">
            <h2 className="mb-1 text-sm font-semibold text-[var(--foreground)]">
              {t.pages.financials.cashFlowByPeriod}
            </h2>
            <p className="mb-4 text-xs text-[var(--muted-foreground)]">
              {t.pages.financials.cashFlowByPeriodDesc}
            </p>
            <div className="mb-4 flex justify-center">
              <div className="inline-flex rounded-md border border-[var(--border)] overflow-hidden text-xs">
                <button
                  onClick={() => setPeriodMode("monthly")}
                  className={`px-4 py-1.5 transition-colors ${
                    periodMode === "monthly"
                      ? "bg-[var(--apple-blue)] text-white"
                      : "bg-[var(--card)] text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
                  }`}
                >
                  {t.pages.financials.monthly}
                </button>
                <button
                  onClick={() => setPeriodMode("yearly")}
                  className={`px-4 py-1.5 border-l border-[var(--border)] transition-colors ${
                    periodMode === "yearly"
                      ? "bg-[var(--apple-blue)] text-white"
                      : "bg-[var(--card)] text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
                  }`}
                >
                  {t.pages.financials.yearly}
                </button>
              </div>
            </div>
            <PeriodicCashFlowChart data={periodicChartData} />
          </section>

          <section className="rounded border border-[var(--border)] bg-[var(--card)] overflow-hidden card-retro">
            <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] p-4">
              <div>
                <h2 className="text-sm font-semibold text-[var(--foreground)]">{t.pages.financials.transactionHistory}</h2>
                <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                  {t.pages.financials.transactionHistoryDesc}
                </p>
              </div>
              <div className="text-xs text-[var(--muted-foreground)] tabular-nums">
                {transactionsWithCumulative.length} {t.pages.financials.rows}
              </div>
            </div>

            {transactionsWithCumulative.length === 0 ? (
              <div className="p-4 text-sm text-[var(--muted-foreground)]">{t.pages.financials.noTransactions}</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-[var(--muted)] text-[var(--foreground)]">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium">{t.common.date}</th>
                      <th className="px-4 py-2 text-left font-medium">{t.pages.financials.typeCol}</th>
                      <th className="px-4 py-2 text-left font-medium">{t.pages.financials.device}</th>
                      <th className="px-4 py-2 text-right font-medium">{t.pages.financials.amount}</th>
                      <th className="px-4 py-2 text-right font-medium">{t.card.estValue}</th>
                      <th className="px-4 py-2 text-right font-medium">{t.pages.financials.cumulativeNet}</th>
                    </tr>
                  </thead>
                  <tbody className="bg-[var(--card)]">
                    {transactionsWithCumulative.map((tx: any) => (
                      <tr key={`${tx.type}-${tx.deviceId}-${tx.date ?? "nodate"}-${tx.amount}-${tx.estimatedValue}`} className="border-t border-[var(--border)]">
                        <td className="px-4 py-2 text-[var(--foreground)] tabular-nums">
                          {formatDate(tx.date)}
                        </td>
                        <td className="px-4 py-2 text-[var(--foreground)]">
                          {tx.type === "SALE" ? t.pages.financials.txSold : tx.type === "DONATION" ? t.pages.financials.txDonated : tx.type === "MAINTENANCE" ? t.pages.financials.txMaintenance : tx.type === "REPAIR_RETURN" ? t.pages.financials.txRepairFee : t.pages.financials.txAcquired}
                        </td>
                        <td className="px-4 py-2">
                          <Link
                            href={`/devices/${tx.deviceId}`}
                            className="text-[var(--apple-blue)] hover:underline"
                          >
                            {tx.deviceName}
                            {tx.additionalName && (
                              <span className="text-[var(--muted-foreground)] ml-1">({tx.additionalName})</span>
                            )}
                          </Link>
                          {tx.label && (
                            <div className="text-xs text-[var(--muted-foreground)] mt-0.5">{tx.label}</div>
                          )}
                        </td>
                        <td className={`px-4 py-2 text-right font-medium tabular-nums ${valueColorClass(tx.amount)}`}>
                          {formatCurrency(tx.amount)}
                        </td>
                        <td className={`px-4 py-2 text-right font-medium tabular-nums ${valueColorClass(tx.estimatedValue)}`}>
                          {formatCurrency(tx.estimatedValue)}
                        </td>
                        <td className={`px-4 py-2 text-right font-medium tabular-nums ${valueColorClass(tx.cumulativeNet)}`}>
                          {formatCurrency(tx.cumulativeNet)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
