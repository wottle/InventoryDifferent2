# Periodic Cash Flow Chart Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "Cash Flow by Period" diverging bar chart (received up, spent down, net cash line) to the web and iOS financials pages, with a Monthly/Yearly toggle.

**Architecture:** Client-side aggregation of the already-fetched `financialTransactions` array into per-period buckets. A new `PeriodicCashFlowChart` web component and `CashFlowByPeriodView` iOS view render the data. No API changes.

**Tech Stack:** Web — Recharts `ComposedChart` (already used), Next.js dynamic import. iOS — Swift Charts (already imported in `FinancialsView.swift`), `ScrollView(.horizontal)`.

---

## File Map

| Action | Path |
|--------|------|
| Modify | `web/src/i18n/translations/en.ts` |
| Modify | `web/src/i18n/translations/de.ts` |
| Modify | `web/src/i18n/translations/fr.ts` |
| Modify | `web/src/i18n/translations/es.ts` |
| Create | `web/src/components/PeriodicCashFlowChart.tsx` |
| Modify | `web/src/app/financials/page.tsx` |
| Modify | `ios/InventoryDifferent/InventoryDifferent/i18n/Translations.swift` |
| Modify | `ios/InventoryDifferent/InventoryDifferent/i18n/Translations+en.swift` |
| Modify | `ios/InventoryDifferent/InventoryDifferent/i18n/Translations+de.swift` |
| Modify | `ios/InventoryDifferent/InventoryDifferent/i18n/Translations+fr.swift` |
| Modify | `ios/InventoryDifferent/InventoryDifferent/i18n/Translations+es.swift` |
| Create | `ios/InventoryDifferent/InventoryDifferent/Views/CashFlowByPeriodView.swift` |
| Modify | `ios/InventoryDifferent/InventoryDifferent/Views/FinancialsView.swift` |
| Modify | `web/src/lib/releaseNotes.ts` |
| Modify | `CHANGELOG.md` |

---

## Task 1: Web i18n — add new keys to all four languages

**Files:**
- Modify: `web/src/i18n/translations/en.ts`
- Modify: `web/src/i18n/translations/de.ts`
- Modify: `web/src/i18n/translations/fr.ts`
- Modify: `web/src/i18n/translations/es.ts`

The `en.ts` file defines the `Translations` type. Both the type and the English values live in the same file. The other three files only export values.

- [ ] **Step 1: Add new keys to the `pages.financials` type in `en.ts`**

In `web/src/i18n/translations/en.ts`, find the `financials:` block inside the type definition (around line 331) and add seven keys after `noChartData: string;`:

```typescript
      noChartData: string;
      cashFlowByPeriod: string;
      cashFlowByPeriodDesc: string;
      monthly: string;
      yearly: string;
      periodReceived: string;
      periodSpent: string;
      noPeriodicChartData: string;
```

- [ ] **Step 2: Add English values in `en.ts`**

In `web/src/i18n/translations/en.ts`, find the `financials:` values block (around line 1061) and add after `noChartData: "No dated transactions to chart.",`:

```typescript
      noChartData: "No dated transactions to chart.",
      cashFlowByPeriod: "Cash Flow by Period",
      cashFlowByPeriodDesc: "Spending and income per month or year. Scroll to see more.",
      monthly: "Monthly",
      yearly: "Yearly",
      periodReceived: "Received",
      periodSpent: "Spent",
      noPeriodicChartData: "No dated transactions to chart.",
```

- [ ] **Step 3: Add German values in `de.ts`**

In `web/src/i18n/translations/de.ts`, find `noChartData:` in the financials block and add after it:

```typescript
      noChartData: "Keine datierten Transaktionen für das Diagramm.",
      cashFlowByPeriod: "Cashflow nach Zeitraum",
      cashFlowByPeriodDesc: "Ausgaben und Einnahmen pro Monat oder Jahr. Scrollen für mehr.",
      monthly: "Monatlich",
      yearly: "Jährlich",
      periodReceived: "Einnahmen",
      periodSpent: "Ausgaben",
      noPeriodicChartData: "Keine datierten Transaktionen für das Diagramm.",
```

- [ ] **Step 4: Add French values in `fr.ts`**

In `web/src/i18n/translations/fr.ts`, find `noChartData:` in the financials block and add after it:

```typescript
      noChartData: "Pas de transactions datées pour le graphique.",
      cashFlowByPeriod: "Flux de trésorerie par période",
      cashFlowByPeriodDesc: "Dépenses et revenus par mois ou par an. Faites défiler pour voir plus.",
      monthly: "Mensuel",
      yearly: "Annuel",
      periodReceived: "Reçu",
      periodSpent: "Dépensé",
      noPeriodicChartData: "Pas de transactions datées pour le graphique.",
```

- [ ] **Step 5: Add Spanish values in `es.ts`**

In `web/src/i18n/translations/es.ts`, find `noChartData:` in the financials block and add after it:

```typescript
      noChartData: "No hay transacciones con fecha para el gráfico.",
      cashFlowByPeriod: "Flujo de caja por período",
      cashFlowByPeriodDesc: "Gastos e ingresos por mes o año. Desplázate para ver más.",
      monthly: "Mensual",
      yearly: "Anual",
      periodReceived: "Recibido",
      periodSpent: "Gastado",
      noPeriodicChartData: "No hay transacciones con fecha para el gráfico.",
```

- [ ] **Step 6: Verify TypeScript compiles**

```bash
cd web && npm run build 2>&1 | tail -20
```

Expected: Build succeeds (or fails only on unrelated issues — no type errors about missing translation keys).

- [ ] **Step 7: Commit**

```bash
git add web/src/i18n/translations/en.ts web/src/i18n/translations/de.ts web/src/i18n/translations/fr.ts web/src/i18n/translations/es.ts
git commit -m "$(cat <<'EOF'
Add i18n keys for periodic cash flow chart (web)

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: iOS i18n — add new keys to all four languages

**Files:**
- Modify: `ios/InventoryDifferent/InventoryDifferent/i18n/Translations.swift`
- Modify: `ios/InventoryDifferent/InventoryDifferent/i18n/Translations+en.swift`
- Modify: `ios/InventoryDifferent/InventoryDifferent/i18n/Translations+de.swift`
- Modify: `ios/InventoryDifferent/InventoryDifferent/i18n/Translations+fr.swift`
- Modify: `ios/InventoryDifferent/InventoryDifferent/i18n/Translations+es.swift`

Note: iOS `FinancialsT` already has `spent` and `received` keys that can be reused for the legend. Only the three new keys below are needed.

- [ ] **Step 1: Add new properties to `FinancialsT` in `Translations.swift`**

Find the `struct FinancialsT` block (around line 137) and add three properties after `txAcquired`:

```swift
    struct FinancialsT {
        let title, loading, errorLoading: String
        let spent, received, netCash, estValue, maintenance, netPosition, profit: String
        let valueOverTime, notEnoughData: String
        let cumulativeCash, cumulativeValue, netPositionLine, zero: String
        let summary, transactionHistory, transactions, noTransactions: String
        let amount, cumNet: String
        let totalSpent, totalReceived, estimatedValueOwned, maintenanceCosts: String
        let realizedProfit: String
        let txSold, txDonated, txMaintenance, txRepairFee, txAcquired: String
        let cashFlowByPeriod, monthly, yearly: String
    }
```

- [ ] **Step 2: Add English values in `Translations+en.swift`**

Find the `financials: .init(` block and add three properties after `txAcquired: "Acquired"`:

```swift
            txAcquired: "Acquired",
            cashFlowByPeriod: "Cash Flow by Period",
            monthly: "Monthly",
            yearly: "Yearly"
```

- [ ] **Step 3: Add German values in `Translations+de.swift`**

Find `financials: .init(` and add after `txAcquired: "Erworben"`:

```swift
            txAcquired: "Erworben",
            cashFlowByPeriod: "Cashflow nach Zeitraum",
            monthly: "Monatlich",
            yearly: "Jährlich"
```

- [ ] **Step 4: Add French values in `Translations+fr.swift`**

Find `financials: .init(` and add after `txAcquired: "Acquis"`:

```swift
            txAcquired: "Acquis",
            cashFlowByPeriod: "Flux de trésorerie par période",
            monthly: "Mensuel",
            yearly: "Annuel"
```

- [ ] **Step 5: Add Spanish values in `Translations+es.swift`**

Find `financials: .init(` and add after `txAcquired: "Adquirido"`:

```swift
            txAcquired: "Adquirido",
            cashFlowByPeriod: "Flujo de caja por período",
            monthly: "Mensual",
            yearly: "Anual"
```

- [ ] **Step 6: Verify iOS builds**

```bash
xcodebuild -scheme InventoryDifferent -destination 'platform=iOS Simulator,id=9116C8FB-2461-4260-B7DD-FE254FD202DE' build 2>&1 | grep -E "(BUILD SUCCEEDED|BUILD FAILED|error:)"
```

Expected: `BUILD SUCCEEDED`

- [ ] **Step 7: Commit**

```bash
git add ios/InventoryDifferent/InventoryDifferent/i18n/
git commit -m "$(cat <<'EOF'
Add i18n keys for periodic cash flow chart (iOS)

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Create `PeriodicCashFlowChart.tsx`

**Files:**
- Create: `web/src/components/PeriodicCashFlowChart.tsx`

This component receives pre-aggregated `PeriodBucket[]` data and renders a Recharts `ComposedChart` with two bars (received/spent) and a net cash line. The chart is wrapped in a horizontally-scrollable container.

- [ ] **Step 1: Create the file**

```typescript
// web/src/components/PeriodicCashFlowChart.tsx
"use client";

import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import { useT } from "../i18n/context";

export interface PeriodBucket {
  key: string;
  label: string;
  received: number;
  spent: number;
  net: number;
}

interface PeriodicCashFlowChartProps {
  data: PeriodBucket[];
}

const BAR_WIDTH = 48; // px per period — controls horizontal scroll density
const MIN_CHART_HEIGHT = 320; // px

export default function PeriodicCashFlowChart({ data }: PeriodicCashFlowChartProps) {
  const t = useT();
  const sym = t.common.currencySymbol;

  const formatCurrencyShort = (value: number) => {
    const abs = Math.abs(value);
    if (abs >= 1000) return `${value < 0 ? "-" : ""}${sym}${(abs / 1000).toFixed(1)}k`;
    return `${sym}${value.toFixed(0)}`;
  };

  const formatCurrencyFull = (value: number) => `${sym}${value.toFixed(2)}`;

  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-[var(--muted-foreground)]">
        {t.pages.financials.noPeriodicChartData}
      </div>
    );
  }

  // Compute chart width: enough room for all bars, minimum fills the container
  const chartWidth = Math.max(data.length * BAR_WIDTH + 60, 300);

  return (
    <div className="relative overflow-hidden">
      <div className="overflow-x-auto" style={{ WebkitOverflowScrolling: "touch" }}>
        <div style={{ width: chartWidth, height: MIN_CHART_HEIGHT }}>
          <ComposedChart
            width={chartWidth}
            height={MIN_CHART_HEIGHT}
            data={data}
            margin={{ top: 10, right: 16, left: 16, bottom: 5 }}
            barCategoryGap="30%"
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: "#9CA3AF" }}
              tickLine={{ stroke: "#6B7280" }}
              axisLine={{ stroke: "#6B7280" }}
            />
            <YAxis
              tickFormatter={formatCurrencyShort}
              tick={{ fontSize: 11, fill: "#9CA3AF" }}
              tickLine={{ stroke: "#6B7280" }}
              axisLine={{ stroke: "#6B7280" }}
            />
            <Tooltip
              formatter={(value: number, name: string) => {
                const label =
                  name === "received"
                    ? t.pages.financials.periodReceived
                    : name === "spent"
                    ? t.pages.financials.periodSpent
                    : t.pages.financials.netPositionLine;
                return [formatCurrencyFull(value), label];
              }}
              contentStyle={{
                backgroundColor: "#1F2937",
                border: "1px solid #374151",
                borderRadius: "0.5rem",
                color: "#F3F4F6",
              }}
              labelStyle={{ color: "#9CA3AF" }}
            />
            <Legend
              formatter={(value: string) =>
                value === "received"
                  ? t.pages.financials.periodReceived
                  : value === "spent"
                  ? t.pages.financials.periodSpent
                  : t.pages.financials.netPositionLine
              }
              wrapperStyle={{ fontSize: 12 }}
            />
            <ReferenceLine y={0} stroke="#6B7280" strokeWidth={1.5} />
            <Bar dataKey="received" fill="#22C55E" opacity={0.85} radius={[2, 2, 0, 0]} />
            <Bar dataKey="spent" fill="#EF4444" opacity={0.85} radius={[0, 0, 2, 2]} />
            <Line
              type="monotone"
              dataKey="net"
              stroke="#3B82F6"
              strokeWidth={2}
              dot={{ fill: "#3B82F6", strokeWidth: 0, r: 3 }}
              activeDot={{ r: 5 }}
            />
          </ComposedChart>
        </div>
      </div>
      {/* Fade hint on right edge when content overflows */}
      <div
        className="pointer-events-none absolute inset-y-0 right-0 w-8"
        style={{ background: "linear-gradient(to right, transparent, var(--card))" }}
      />
    </div>
  );
}
```

- [ ] **Step 2: Verify web builds**

```bash
cd web && npm run build 2>&1 | tail -20
```

Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add web/src/components/PeriodicCashFlowChart.tsx
git commit -m "$(cat <<'EOF'
Add PeriodicCashFlowChart component

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Wire periodic chart into web financials page

**Files:**
- Modify: `web/src/app/financials/page.tsx`

Add a `dynamic` import for the new chart, an aggregation function, a `mode` state variable, and a new `<section>` between the existing cumulative chart section and the transaction history section.

- [ ] **Step 1: Add the dynamic import at the top of the file**

After the existing `FinancialChart` dynamic import (around line 11), add:

```typescript
const PeriodicCashFlowChart = dynamic(() => import("../../components/PeriodicCashFlowChart"), {
  ssr: false,
  loading: () => (
    <div className="p-4">
      <LoadingPanel title="Loading chart…" subtitle="Grouping by period" />
    </div>
  ),
});
```

- [ ] **Step 2: Add the `PeriodBucket` type and `aggregateByPeriod` function**

Add this block after the `dateMs` helper function (around line 64), before `export default function FinancialsPage()`:

```typescript
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
      bucket.spent += amount; // amounts are already negative
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
```

- [ ] **Step 3: Add `periodMode` state to `FinancialsPage`**

Inside `FinancialsPage`, after the existing `const { data, loading, error } = useQuery(...)` line, add:

```typescript
  const [periodMode, setPeriodMode] = React.useState<"monthly" | "yearly">("monthly");
```

Also add `React` to the imports at the top of the file:
```typescript
import { useQuery } from "@apollo/client";
import gql from "graphql-tag";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { LoadingPanel } from "../../components/LoadingPanel";
import { useT } from "../../i18n/context";
```

Replace `React.useState` with `useState`:
```typescript
  const [periodMode, setPeriodMode] = useState<"monthly" | "yearly">("monthly");
```

- [ ] **Step 4: Compute `periodicChartData` inside the existing `useMemo`**

The existing `useMemo` (around line 80) already computes `transactionsWithCumulative` and `chartData`. Add `periodicChartData` to the same memo to avoid a second pass:

Replace the closing lines of the `useMemo`:

```typescript
    return { transactionsWithCumulative: withCum, chartData: chartDataPoints };
  }, [transactions]);
```

with:

```typescript
    const periodicChartData = aggregateByPeriod(transactions, periodMode);

    return { transactionsWithCumulative: withCum, chartData: chartDataPoints, periodicChartData };
  }, [transactions, periodMode]);
```

And destructure the new value:

```typescript
  const { transactionsWithCumulative, chartData, periodicChartData } = useMemo(() => {
```

- [ ] **Step 5: Add the new section to the JSX**

Inside the `{!loading && !error && overview && ( ... )}` block, after the closing `</section>` of the cumulative chart section and before the opening `<section>` of the transaction history, insert:

```tsx
          <section className="rounded border border-[var(--border)] bg-[var(--card)] p-4 card-retro">
            <h2 className="mb-1 text-sm font-semibold text-[var(--foreground)]">
              {t.pages.financials.cashFlowByPeriod}
            </h2>
            <p className="mb-4 text-xs text-[var(--muted-foreground)]">
              {t.pages.financials.cashFlowByPeriodDesc}
            </p>
            {/* Period toggle */}
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
```

- [ ] **Step 6: Verify web builds and lints**

```bash
cd web && npm run build 2>&1 | tail -20
```

Expected: Build succeeds with no TypeScript errors.

- [ ] **Step 7: Commit**

```bash
git add web/src/app/financials/page.tsx
git commit -m "$(cat <<'EOF'
Add periodic cash flow chart section to web financials page

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Create `CashFlowByPeriodView.swift`

**Files:**
- Create: `ios/InventoryDifferent/InventoryDifferent/Views/CashFlowByPeriodView.swift`

This SwiftUI view owns the Monthly/Yearly toggle state, aggregates the transaction array into period buckets, and renders a horizontally-scrollable Swift Charts `Chart`.

- [ ] **Step 1: Create the file**

```swift
// CashFlowByPeriodView.swift
// InventoryDifferent

import SwiftUI
import Charts

struct CashFlowPeriodBucket: Identifiable {
    let id: String      // "2025-01" or "2025"
    let label: String   // "Jan '25" or "2025"
    let received: Double
    let spent: Double   // negative value
    let net: Double
}

struct CashFlowByPeriodView: View {
    @EnvironmentObject var lm: LocalizationManager

    let transactions: [FinancialTransaction]

    @State private var mode: PeriodMode = .monthly

    enum PeriodMode { case monthly, yearly }

    // MARK: - Aggregation

    private var buckets: [CashFlowPeriodBucket] {
        var map: [String: (received: Double, spent: Double)] = [:]

        let isoFormatter = ISO8601DateFormatter()
        let isoFractionalFormatter = ISO8601DateFormatter()
        isoFractionalFormatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]

        for tx in transactions {
            guard let dateString = tx.date,
                  tx.type != "DONATION",
                  let date = isoFormatter.date(from: dateString) ?? isoFractionalFormatter.date(from: dateString)
            else { continue }

            var cal = Calendar(identifier: .gregorian)
            cal.timeZone = TimeZone(identifier: "UTC")!
            let year = cal.component(.year, from: date)
            let month = cal.component(.month, from: date)

            let key = mode == .monthly
                ? String(format: "%04d-%02d", year, month)
                : String(format: "%04d", year)

            if map[key] == nil { map[key] = (0, 0) }
            let amount = tx.amount ?? 0

            if tx.type == "SALE" || tx.type == "REPAIR_RETURN" {
                map[key]!.received += amount
            } else if tx.type == "ACQUISITION" || tx.type == "MAINTENANCE" {
                map[key]!.spent += amount // already negative
            }
        }

        let labelFormatter = DateFormatter()
        labelFormatter.timeZone = TimeZone(identifier: "UTC")
        labelFormatter.locale = Locale(identifier: "en_US_POSIX")

        return map.keys.sorted().compactMap { key -> CashFlowPeriodBucket? in
            guard let counts = map[key] else { return nil }
            let dateSuffix = mode == .monthly ? "-01" : "-01-01"
            let isoKey = key + dateSuffix + "T00:00:00Z"
            guard let date = isoFormatter.date(from: isoKey) else { return nil }

            let label: String
            if mode == .monthly {
                labelFormatter.dateFormat = "MMM ''yy"
                label = labelFormatter.string(from: date)
            } else {
                labelFormatter.dateFormat = "yyyy"
                label = labelFormatter.string(from: date)
            }

            return CashFlowPeriodBucket(
                id: key,
                label: label,
                received: counts.received,
                spent: counts.spent,
                net: counts.received + counts.spent
            )
        }
    }

    // MARK: - Body

    var body: some View {
        let t = lm.t
        VStack(alignment: .leading, spacing: 12) {
            Text(t.financials.cashFlowByPeriod)
                .font(.headline)

            // Period toggle
            Picker("", selection: $mode) {
                Text(t.financials.monthly).tag(PeriodMode.monthly)
                Text(t.financials.yearly).tag(PeriodMode.yearly)
            }
            .pickerStyle(.segmented)

            // Legend
            HStack(spacing: 12) {
                legendItem(color: .green, label: t.financials.received)
                legendItem(color: .red, label: t.financials.spent)
                legendItem(isLine: true, color: .blue, label: t.financials.netPositionLine)
                Spacer()
            }
            .font(.caption)
            .foregroundColor(.secondary)

            let data = buckets
            if data.isEmpty {
                Text(t.financials.notEnoughData)
                    .font(.caption)
                    .foregroundColor(.secondary)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 32)
            } else {
                let barWidth: CGFloat = 44
                let chartWidth = max(UIScreen.main.bounds.width - 64, CGFloat(data.count) * barWidth + 60)

                ScrollView(.horizontal, showsIndicators: false) {
                    Chart {
                        // Zero rule
                        RuleMark(y: .value(t.financials.zero, 0))
                            .lineStyle(StrokeStyle(lineWidth: 1.5, dash: []))
                            .foregroundStyle(Color.gray.opacity(0.4))

                        ForEach(data) { bucket in
                            // Received bar (positive — grows up)
                            BarMark(
                                x: .value("Period", bucket.label),
                                y: .value(t.financials.received, bucket.received)
                            )
                            .foregroundStyle(Color.green.opacity(0.85))
                            .cornerRadius(2)

                            // Spent bar (negative — grows down)
                            BarMark(
                                x: .value("Period", bucket.label),
                                y: .value(t.financials.spent, bucket.spent)
                            )
                            .foregroundStyle(Color.red.opacity(0.85))
                            .cornerRadius(2)

                            // Net cash line
                            LineMark(
                                x: .value("Period", bucket.label),
                                y: .value(t.financials.netPositionLine, bucket.net)
                            )
                            .foregroundStyle(Color.blue)
                            .lineStyle(StrokeStyle(lineWidth: 2))
                            .symbol(Circle().strokeBorder(lineWidth: 1))
                            .symbolSize(24)
                            .interpolationMethod(.catmullRom)
                        }
                    }
                    .chartYAxis {
                        let sym = lm.t.common.currencySymbol
                        if sym == "$" {
                            AxisMarks(format: .currency(code: "USD"))
                        } else if sym == "€" {
                            AxisMarks(format: .currency(code: "EUR"))
                        } else {
                            AxisMarks(format: .currency(code: "USD"))
                        }
                    }
                    .frame(width: chartWidth, height: 220)
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.1), radius: 5, x: 0, y: 2)
    }

    // MARK: - Helpers

    @ViewBuilder
    private func legendItem(isLine: Bool = false, color: Color, label: String) -> some View {
        HStack(spacing: 4) {
            if isLine {
                Rectangle()
                    .fill(color)
                    .frame(width: 16, height: 2)
            } else {
                RoundedRectangle(cornerRadius: 2)
                    .fill(color.opacity(0.85))
                    .frame(width: 10, height: 10)
            }
            Text(label)
        }
    }
}

#Preview {
    CashFlowByPeriodView(transactions: [])
        .environmentObject(LocalizationManager.shared)
}
```

- [ ] **Step 2: Verify iOS builds**

```bash
xcodebuild -scheme InventoryDifferent -destination 'platform=iOS Simulator,id=9116C8FB-2461-4260-B7DD-FE254FD202DE' build 2>&1 | grep -E "(BUILD SUCCEEDED|BUILD FAILED|error:)"
```

Expected: `BUILD SUCCEEDED`

- [ ] **Step 3: Commit**

```bash
git add ios/InventoryDifferent/InventoryDifferent/Views/CashFlowByPeriodView.swift
git commit -m "$(cat <<'EOF'
Add CashFlowByPeriodView for iOS periodic cash flow chart

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: Wire `CashFlowByPeriodView` into `FinancialsView`

**Files:**
- Modify: `ios/InventoryDifferent/InventoryDifferent/Views/FinancialsView.swift`

In portrait mode, the `FinancialsView` renders a `ScrollView` with `summarySection` followed by `transactionsSection`. Insert `CashFlowByPeriodView` between them.

- [ ] **Step 1: Insert the chart view in the portrait `ScrollView`**

Find the portrait `ScrollView` block (around line 57):

```swift
                ScrollView {
                    VStack(spacing: 20) {
                        summarySection(overview: data.financialOverview)
                        transactionsSection()
                    }
                    .padding()
                }
```

Replace with:

```swift
                ScrollView {
                    VStack(spacing: 20) {
                        summarySection(overview: data.financialOverview)
                        CashFlowByPeriodView(transactions: financialData?.financialTransactions ?? [])
                            .environmentObject(lm)
                        transactionsSection()
                    }
                    .padding()
                }
```

- [ ] **Step 2: Verify iOS builds**

```bash
xcodebuild -scheme InventoryDifferent -destination 'platform=iOS Simulator,id=9116C8FB-2461-4260-B7DD-FE254FD202DE' build 2>&1 | grep -E "(BUILD SUCCEEDED|BUILD FAILED|error:)"
```

Expected: `BUILD SUCCEEDED`

- [ ] **Step 3: Commit**

```bash
git add ios/InventoryDifferent/InventoryDifferent/Views/FinancialsView.swift
git commit -m "$(cat <<'EOF'
Wire periodic cash flow chart into iOS FinancialsView portrait layout

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: Update release notes and run final build verification

**Files:**
- Modify: `web/src/lib/releaseNotes.ts`
- Modify: `CHANGELOG.md`

- [ ] **Step 1: Add entry to `releaseNotes.ts`**

In `web/src/lib/releaseNotes.ts`, find the `Unreleased` entry and add to its `added` array:

```typescript
'Add periodic cash flow chart to financials pages (web and iOS) — diverging bars show spending vs. receiving per month or year with a net cash line; toggle between monthly and yearly view; horizontally scrollable',
```

- [ ] **Step 2: Add entry to `CHANGELOG.md`**

In `CHANGELOG.md`, find `## [Unreleased]` and add under `### Added`:

```markdown
- Add periodic cash flow chart to financials pages (web and iOS) — diverging bars show spending vs. receiving per month or year with a net cash line; toggle between monthly and yearly view; horizontally scrollable
```

- [ ] **Step 3: Run full build verification**

```bash
cd /path/to/repo && cd web && npm run build 2>&1 | tail -5
```

Expected: `✓ Compiled successfully` (or equivalent success output).

```bash
xcodebuild -scheme InventoryDifferent -destination 'platform=iOS Simulator,id=9116C8FB-2461-4260-B7DD-FE254FD202DE' build 2>&1 | grep -E "(BUILD SUCCEEDED|BUILD FAILED|error:)"
```

Expected: `BUILD SUCCEEDED`

- [ ] **Step 4: Commit**

```bash
git add web/src/lib/releaseNotes.ts CHANGELOG.md
git commit -m "$(cat <<'EOF'
Add periodic cash flow chart to financials (web + iOS)

Diverging bars show received vs. spent per month or year with a net cash
line that freely crosses zero. Monthly/yearly toggle. Horizontally
scrollable when many periods exist.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```
