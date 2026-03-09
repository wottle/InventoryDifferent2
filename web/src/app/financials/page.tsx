"use client";

import { useQuery } from "@apollo/client";
import gql from "graphql-tag";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useMemo } from "react";
import { LoadingPanel } from "../../components/LoadingPanel";

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
    }
  }
`;

function formatCurrency(value: number | null | undefined) {
  if (value === null || value === undefined) return "";
  return `$${Number(value).toFixed(2)}`;
}

function valueColorClass(value: number | null | undefined) {
  const n = Number(value ?? 0);
  if (!Number.isFinite(n) || n === 0) return "text-gray-900 dark:text-gray-100";
  return n > 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400";
}

function formatDate(dateString: string | null | undefined) {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString("en-US", {
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

export default function FinancialsPage() {
  const { data, loading, error } = useQuery(GET_FINANCIALS, {
    fetchPolicy: "cache-and-network",
  });

  const overview = data?.financialOverview;
  const transactions = data?.financialTransactions ?? [];

  const { transactionsWithCumulative, chartData } = useMemo(() => {
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
        date: new Date(t.date).toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
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

    return { transactionsWithCumulative: withCum, chartData: chartDataPoints };
  }, [transactions]);

  return (
    <div className="min-h-screen font-sans">
      <header className="mb-6 flex items-center justify-between border-b border-[var(--border)] pb-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-light tracking-tight text-[var(--foreground)]">Financials</h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            Overview of spend, sales, and estimated collection position.
          </p>
        </div>
        <Link href="/" className="btn-retro text-sm px-3 py-1.5">
          Back
        </Link>
      </header>

      {loading && (
        <div className="p-4">
          <LoadingPanel title="Loading financials…" subtitle="Running the numbers" />
        </div>
      )}
      {error && <div className="p-4 text-red-500">Error: {error.message}</div>}

      {!loading && !error && overview && (
        <div className="space-y-6">
          <section className="rounded border border-[var(--border)] bg-[var(--card)] p-4 card-retro">
            <h2 className="mb-3 text-sm font-semibold text-[var(--foreground)]">Summary</h2>
            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded border border-[var(--border)] p-4 bg-[var(--background)]">
                  <div className="text-xs text-[var(--muted-foreground)]">Total Spent</div>
                  <div className="mt-1 text-2xl font-light tabular-nums text-red-600 dark:text-red-400">
                    {formatCurrency(overview.totalSpent)}
                  </div>
                </div>
                <div className="rounded border border-[var(--border)] p-4 bg-[var(--background)]">
                  <div className="text-xs text-[var(--muted-foreground)]">Total Received</div>
                  <div className="mt-1 text-2xl font-light tabular-nums text-green-600 dark:text-green-400">
                    {formatCurrency(overview.totalReceived)}
                  </div>
                </div>
                <div className="rounded border border-[var(--border)] p-4 bg-[var(--background)]">
                  <div className="text-xs text-[var(--muted-foreground)]">Net Cash (Received + Spent)</div>
                  <div className={`mt-1 text-2xl font-light tabular-nums ${valueColorClass(overview.netCash)}`}>
                    {formatCurrency(overview.netCash)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded border border-[var(--border)] p-4 bg-[var(--background)]">
                  <div className="text-xs text-[var(--muted-foreground)]">Estimated Value (Still Owned)</div>
                  <div className="mt-1 text-2xl font-light tabular-nums text-green-600 dark:text-green-400">
                    {formatCurrency(overview.estimatedValueOwned)}
                  </div>
                </div>
                <div className="rounded border border-[var(--border)] p-4 bg-[var(--background)]">
                  <div className="text-xs text-[var(--muted-foreground)]">Maintenance Costs</div>
                  <div className="mt-1 text-2xl font-light tabular-nums text-red-600 dark:text-red-400">
                    {formatCurrency(overview.totalMaintenanceCost)}
                  </div>
                </div>
                <div className="rounded border border-[var(--border)] p-4 bg-[var(--background)]">
                  <div className="text-xs text-[var(--muted-foreground)]">Net Position (Owned Value + Net Cash − Maintenance)</div>
                  <div className={`mt-1 text-2xl font-light tabular-nums ${valueColorClass(overview.netPosition)}`}>
                    {formatCurrency(overview.netPosition)}
                  </div>
                </div>
                <div className="rounded border border-[var(--border)] p-4 bg-[var(--background)]">
                  <div className="text-xs text-[var(--muted-foreground)]">Realized Profit (Sold Devices Only)</div>
                  <div className={`mt-1 text-2xl font-light tabular-nums ${valueColorClass(overview.totalProfit)}`}>
                    {formatCurrency(overview.totalProfit)}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded border border-[var(--border)] bg-[var(--card)] p-4 card-retro">
            <h2 className="mb-1 text-sm font-semibold text-[var(--foreground)]">Collection Value Over Time</h2>
            <p className="mb-4 text-xs text-[var(--muted-foreground)]">
              Track cumulative cash flow, estimated value, and net position as your collection grows.
            </p>
            <FinancialChart data={chartData} />
          </section>

          <section className="rounded border border-[var(--border)] bg-[var(--card)] overflow-hidden card-retro">
            <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] p-4">
              <div>
                <h2 className="text-sm font-semibold text-[var(--foreground)]">Transaction History</h2>
                <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                  Acquisitions are negative cash and positive estimated value. Sales and donations are negative estimated value (removed from collection).
                </p>
              </div>
              <div className="text-xs text-[var(--muted-foreground)] tabular-nums">
                {transactionsWithCumulative.length} rows
              </div>
            </div>

            {transactionsWithCumulative.length === 0 ? (
              <div className="p-4 text-sm text-[var(--muted-foreground)]">No transactions yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-[var(--muted)] text-[var(--foreground)]">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium">Date</th>
                      <th className="px-4 py-2 text-left font-medium">Type</th>
                      <th className="px-4 py-2 text-left font-medium">Device</th>
                      <th className="px-4 py-2 text-right font-medium">Amount</th>
                      <th className="px-4 py-2 text-right font-medium">Est. Value</th>
                      <th className="px-4 py-2 text-right font-medium">Cumulative Net</th>
                    </tr>
                  </thead>
                  <tbody className="bg-[var(--card)]">
                    {transactionsWithCumulative.map((t: any) => (
                      <tr key={`${t.type}-${t.deviceId}-${t.date ?? "nodate"}-${t.amount}-${t.estimatedValue}`} className="border-t border-[var(--border)]">
                        <td className="px-4 py-2 text-[var(--foreground)] tabular-nums">
                          {formatDate(t.date)}
                        </td>
                        <td className="px-4 py-2 text-[var(--foreground)]">
                          {t.type === "SALE" ? "Sold" : t.type === "DONATION" ? "Donated" : "Acquired"}
                        </td>
                        <td className="px-4 py-2">
                          <Link
                            href={`/devices/${t.deviceId}`}
                            className="text-[var(--apple-blue)] hover:underline"
                          >
                            {t.deviceName}
                            {t.additionalName && (
                              <span className="text-[var(--muted-foreground)] ml-1">({t.additionalName})</span>
                            )}
                          </Link>
                        </td>
                        <td className={`px-4 py-2 text-right font-medium tabular-nums ${valueColorClass(t.amount)}`}>
                          {formatCurrency(t.amount)}
                        </td>
                        <td className={`px-4 py-2 text-right font-medium tabular-nums ${valueColorClass(t.estimatedValue)}`}>
                          {formatCurrency(t.estimatedValue)}
                        </td>
                        <td className={`px-4 py-2 text-right font-medium tabular-nums ${valueColorClass(t.cumulativeNet)}`}>
                          {formatCurrency(t.cumulativeNet)}
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
