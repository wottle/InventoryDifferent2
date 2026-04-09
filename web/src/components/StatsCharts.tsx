"use client";

import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useT } from "../i18n/context";

const COLORS = ["#3B82F6", "#22C55E", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#14B8A6", "#F97316"];

const STATUS_COLORS: Record<string, string> = {
  'In Collection':  '#3B82F6',  // blue
  'For Sale':       '#22C55E',  // green
  'Pending Sale':   '#F59E0B',  // amber
  'Sold':           '#6B7280',  // grey
  'Donated':        '#EC4899',  // pink
  'In Repair':      '#F97316',  // orange
  'Repaired':       '#06B6D4',  // cyan
  'Returned':       '#14B8A6',  // teal
};

interface StatsBucket {
  label: string;
  count: number;
}

interface CollectionStats {
  byStatus: StatsBucket[];
  byFunctionalStatus: StatsBucket[];
  byCategoryType: StatsBucket[];
  byAcquisitionYear: StatsBucket[];
  byReleaseDecade: StatsBucket[];
  topManufacturers: StatsBucket[];
  byRarity: StatsBucket[];
  totalDevices: number;
  workingPercent: number;
  avgEstimatedValue: number;
  topCategoryType: string;
}

const RARITY_COLORS: Record<string, string> = {
  'Common':           '#6B7280',
  'Uncommon':         '#22C55E',
  'Rare':             '#3B82F6',
  'Very Rare':        '#8B5CF6',
  'Extremely Rare':   '#F59E0B',
};

function DonutChart({ data, title, colorMap, noData }: { data: StatsBucket[]; title: string; colorMap?: Record<string, string>; noData: string }) {
  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-[var(--muted-foreground)] text-sm">
        {noData}
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-2">
        {title}
      </h3>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="count"
              nameKey="label"
              cx="50%"
              cy="50%"
              innerRadius="45%"
              outerRadius="70%"
              label={({ label, percent }) => {
                if ((percent ?? 0) < 0.08) return '';
                return `${label} (${Math.round((percent ?? 0) * 100)}%)`;
              }}
              labelLine={false}
            >
              {data.map((entry, index) => (
                <Cell key={index} fill={colorMap?.[entry.label] ?? COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number, name: string) => [value, name]}
              contentStyle={{
                backgroundColor: "#1F2937",
                border: "1px solid #374151",
                borderRadius: "0.5rem",
                color: "#F3F4F6",
                fontSize: 12,
              }}
              labelStyle={{ color: "#9CA3AF" }}
              itemStyle={{ color: "#F3F4F6" }}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function VerticalBarChart({ data, title, noData, devicesLabel }: { data: StatsBucket[]; title: string; noData: string; devicesLabel: string }) {
  if (data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-[var(--muted-foreground)] text-sm">
        {noData}
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-2">
        {title}
      </h3>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: "#9CA3AF" }}
              tickLine={{ stroke: "#6B7280" }}
              axisLine={{ stroke: "#6B7280" }}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#9CA3AF" }}
              tickLine={{ stroke: "#6B7280" }}
              axisLine={{ stroke: "#6B7280" }}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1F2937",
                border: "1px solid #374151",
                borderRadius: "0.5rem",
                color: "#F3F4F6",
                fontSize: 12,
              }}
              labelStyle={{ color: "#9CA3AF" }}
              itemStyle={{ color: "#F3F4F6" }}
            />
            <Bar dataKey="count" name={devicesLabel} fill={COLORS[0]} radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function HorizontalBarChart({ data, title, noData, devicesLabel }: { data: StatsBucket[]; title: string; noData: string; devicesLabel: string }) {
  if (data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-[var(--muted-foreground)] text-sm">
        {noData}
      </div>
    );
  }

  const height = Math.max(200, data.length * 36);

  return (
    <div>
      <h3 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-2">
        {title}
      </h3>
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} horizontal={false} />
            <XAxis
              type="number"
              tick={{ fontSize: 11, fill: "#9CA3AF" }}
              tickLine={{ stroke: "#6B7280" }}
              axisLine={{ stroke: "#6B7280" }}
              allowDecimals={false}
            />
            <YAxis
              type="category"
              dataKey="label"
              width={110}
              tick={{ fontSize: 11, fill: "#9CA3AF" }}
              tickLine={{ stroke: "#6B7280" }}
              axisLine={{ stroke: "#6B7280" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1F2937",
                border: "1px solid #374151",
                borderRadius: "0.5rem",
                color: "#F3F4F6",
                fontSize: 12,
              }}
              labelStyle={{ color: "#9CA3AF" }}
              itemStyle={{ color: "#F3F4F6" }}
            />
            <Bar dataKey="count" name={devicesLabel} fill={COLORS[2]} radius={[0, 3, 3, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function RarityBarChart({ data, title, noData, devicesLabel, colorMap }: { data: StatsBucket[]; title: string; noData: string; devicesLabel: string; colorMap: Record<string, string> }) {
  if (data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-[var(--muted-foreground)] text-sm">
        {noData}
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-2">
        {title}
      </h3>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: "#9CA3AF" }}
              tickLine={{ stroke: "#6B7280" }}
              axisLine={{ stroke: "#6B7280" }}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#9CA3AF" }}
              tickLine={{ stroke: "#6B7280" }}
              axisLine={{ stroke: "#6B7280" }}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1F2937",
                border: "1px solid #374151",
                borderRadius: "0.5rem",
                color: "#F3F4F6",
                fontSize: 12,
              }}
              labelStyle={{ color: "#9CA3AF" }}
              itemStyle={{ color: "#F3F4F6" }}
            />
            <Bar dataKey="count" name={devicesLabel} radius={[3, 3, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={index} fill={colorMap[entry.label] ?? COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default function StatsCharts({ stats }: { stats: CollectionStats }) {
  const t = useT();
  const noData = t.pages.stats.noData;
  const devicesLabel = t.pages.stats.devices;

  const statusLabelMap: Record<string, string> = {
    'In Collection': t.status.COLLECTION,
    'For Sale': t.status.FOR_SALE,
    'Pending Sale': t.status.PENDING_SALE,
    'In Repair': t.status.IN_REPAIR,
    'Sold': t.status.SOLD,
    'Donated': t.status.DONATED,
    'Returned': t.status.RETURNED,
  };
  const functionalLabelMap: Record<string, string> = {
    'Working': t.functionalStatus.YES,
    'Partial': t.functionalStatus.PARTIAL,
    'Not Working': t.functionalStatus.NO,
  };
  const rarityLabelMap: Record<string, string> = {
    'Common': t.rarity.COMMON,
    'Uncommon': t.rarity.UNCOMMON,
    'Rare': t.rarity.RARE,
    'Very Rare': t.rarity.VERY_RARE,
    'Extremely Rare': t.rarity.EXTREMELY_RARE,
  };
  const categoryTypeLabelMap: Record<string, string> = {
    'Computer': t.categoryType.COMPUTER,
    'Peripheral': t.categoryType.PERIPHERAL,
    'Accessory': t.categoryType.ACCESSORY,
    'Other': t.categoryType.OTHER,
  };

  const tr = (map: Record<string, string>) => (data: StatsBucket[]) =>
    data.map(b => ({ ...b, label: map[b.label] ?? b.label }));

  const translatedStatusColors: Record<string, string> = Object.fromEntries(
    Object.entries(STATUS_COLORS).map(([eng, color]) => [statusLabelMap[eng] ?? eng, color])
  );
  const translatedRarityColors: Record<string, string> = Object.fromEntries(
    Object.entries(RARITY_COLORS).map(([eng, color]) => [rarityLabelMap[eng] ?? eng, color])
  );

  return (
    <div className="space-y-8">
      {/* Collection Composition */}
      <section className="rounded border border-[var(--border)] bg-[var(--card)] p-4 card-retro">
        <h2 className="mb-4 text-sm font-semibold text-[var(--foreground)]">{t.pages.stats.collectionComposition}</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <DonutChart data={tr(statusLabelMap)(stats.byStatus)} title={t.pages.stats.byStatus} colorMap={translatedStatusColors} noData={noData} />
          <DonutChart data={tr(functionalLabelMap)(stats.byFunctionalStatus)} title={t.pages.stats.byCondition} noData={noData} />
          <DonutChart data={tr(categoryTypeLabelMap)(stats.byCategoryType)} title={t.pages.stats.byCategoryType} noData={noData} />
        </div>
      </section>

      {/* Rarity */}
      <section className="rounded border border-[var(--border)] bg-[var(--card)] p-4 card-retro">
        <h2 className="mb-4 text-sm font-semibold text-[var(--foreground)]">{t.pages.stats.byRarity}</h2>
        <RarityBarChart data={tr(rarityLabelMap)(stats.byRarity)} title={t.pages.stats.rarityDistribution} noData={noData} devicesLabel={devicesLabel} colorMap={translatedRarityColors} />
      </section>

      {/* Acquisition Trends */}
      <section className="rounded border border-[var(--border)] bg-[var(--card)] p-4 card-retro">
        <h2 className="mb-4 text-sm font-semibold text-[var(--foreground)]">{t.pages.stats.acquiredPerYear}</h2>
        <VerticalBarChart data={stats.byAcquisitionYear} title={t.pages.stats.acquisitionYear} noData={noData} devicesLabel={devicesLabel} />
      </section>

      {/* Release Era */}
      <section className="rounded border border-[var(--border)] bg-[var(--card)] p-4 card-retro">
        <h2 className="mb-4 text-sm font-semibold text-[var(--foreground)]">{t.pages.stats.byReleaseEra}</h2>
        <VerticalBarChart data={stats.byReleaseDecade} title={t.pages.stats.releaseDecade} noData={noData} devicesLabel={devicesLabel} />
      </section>

      {/* Top Manufacturers */}
      <section className="rounded border border-[var(--border)] bg-[var(--card)] p-4 card-retro">
        <h2 className="mb-4 text-sm font-semibold text-[var(--foreground)]">{t.pages.stats.topManufacturers}</h2>
        <HorizontalBarChart data={stats.topManufacturers} title={t.pages.stats.manufacturer} noData={noData} devicesLabel={devicesLabel} />
      </section>
    </div>
  );
}
