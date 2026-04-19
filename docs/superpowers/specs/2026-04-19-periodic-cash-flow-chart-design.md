# Periodic Cash Flow Chart — Design Spec

**Date:** 2026-04-19
**Status:** Approved

## Overview

Add a "Cash Flow by Period" chart to the financials pages on web and iOS. Unlike the existing cumulative line chart, this chart shows non-cumulative spending vs. receiving per month or year, helping users understand cash flow patterns over time.

## Chart Design

**Type:** Diverging bar chart with overlaid net cash line.

- **Received** bars (green) grow upward from the zero line
- **Spent** bars (red) grow downward from the zero line
- **Net cash** line (blue) connects the per-period net value and freely crosses zero in either direction
- Zero line is visually prominent (heavier stroke, labeled)
- Legend (Received / Spent / Net) displayed above the chart area

## Period Toggle

- Two-segment pill control: **Monthly** | **Yearly**
- Centered above the chart
- Defaults to **Monthly** on every page load (no persistence)

## Scrolling

- Chart renders at a fixed width per bar so it grows naturally with more data
- **Web:** `overflow-x: auto` container with a right-edge fade gradient hinting at scrollability
- **iOS:** horizontal `ScrollView` wrapping the chart; computed width = `numberOfPeriods × barWidth`
- No scrolling required when few periods exist

## Data & Aggregation

Client-side only — no API changes required. Both platforms already fetch `financialTransactions` in full.

### Bucketing

Transactions are grouped by period key:
- **Monthly:** `YYYY-MM`
- **Yearly:** `YYYY`

### Per-bucket sums

| Bucket | Transaction types included |
|--------|---------------------------|
| Received | `SALE`, `REPAIR_RETURN` |
| Spent | `ACQUISITION`, `MAINTENANCE` |
| Excluded | `DONATION` (no money changes hands) |

**Net** = received + spent (can be positive or negative)

### Data rules

- Transactions with no `date` are excluded
- Periods with zero activity in both buckets are omitted (sparse data)
- Result sorted oldest → newest for display

## Placement

### Web (`web/src/app/financials/page.tsx`)

New `<section>` added between the existing "Collection Value Over Time" section and the "Transaction History" section. The new section is a `card-retro` card matching the existing styling.

### iOS (`FinancialsView.swift`)

**Portrait:** New chart card inserted into the portrait `ScrollView` between `summarySection` and `transactionsSection`. Landscape mode is unchanged (existing cumulative chart only).

## New Components

### Web

- `PeriodicCashFlowChart.tsx` — Recharts `ComposedChart` with `Bar` (received), `Bar` (spent), and `Line` (net). Accepts pre-aggregated period data as props. Loaded via `dynamic()` with `ssr: false` to match the existing `FinancialChart` pattern.

### iOS

- `CashFlowByPeriodView.swift` — SwiftUI view containing the segmented control, legend row, and horizontally-scrollable Swift Charts `Chart`. Accepts the transactions array and owns the toggle state internally.

## i18n

All user-visible strings go through the translation system. New keys required in all three languages (en/de/fr) on both web and iOS:

| Key | English value |
|-----|---------------|
| `cashFlowByPeriod` | Cash Flow by Period |
| `cashFlowByPeriodDesc` | Spending and income per month or year. |
| `monthly` | Monthly |
| `yearly` | Yearly |
| `received` | Received |
| `spent` | Spent |
| `netCashLine` | Net Cash |
| `noPeriodicChartData` | No dated transactions to chart. |

> Note: `monthly`, `yearly`, `received`, `spent` may already exist in translations — check before adding duplicates.

## Out of Scope

- API changes
- Persisting the Monthly/Yearly toggle selection
- Showing empty periods (months/years with no transactions)
- Tooltip/interaction design (standard Recharts tooltip on web, standard Swift Charts interaction on iOS)
