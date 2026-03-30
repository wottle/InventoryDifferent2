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

const COLORS = ["#3B82F6", "#22C55E", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#14B8A6", "#F97316"];

const STATUS_COLORS: Record<string, string> = {
  'In Collection':  '#3B82F6',  // blue
  'For Sale':       '#22C55E',  // green
  'Pending Sale':   '#F59E0B',  // amber
  'Sold':           '#6B7280',  // grey
  'Donated':        '#EC4899',  // pink
  'In Repair':      '#F97316',  // orange
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

function DonutChart({ data, title, colorMap }: { data: StatsBucket[]; title: string; colorMap?: Record<string, string> }) {
  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-[var(--muted-foreground)] text-sm">
        No data
      </div>
    );
  }

  const total = data.reduce((s, d) => s + d.count, 0);

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
              label={({ label, count, percent }) => {
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

function VerticalBarChart({ data, title }: { data: StatsBucket[]; title: string }) {
  if (data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-[var(--muted-foreground)] text-sm">
        No data
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
            <Bar dataKey="count" name="Devices" fill={COLORS[0]} radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function HorizontalBarChart({ data, title }: { data: StatsBucket[]; title: string }) {
  if (data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-[var(--muted-foreground)] text-sm">
        No data
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
            <Bar dataKey="count" name="Devices" fill={COLORS[2]} radius={[0, 3, 3, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function RarityBarChart({ data, title }: { data: StatsBucket[]; title: string }) {
  if (data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-[var(--muted-foreground)] text-sm">
        No data
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
            <Bar dataKey="count" name="Devices" radius={[3, 3, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={index} fill={RARITY_COLORS[entry.label] ?? COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default function StatsCharts({ stats }: { stats: CollectionStats }) {
  return (
    <div className="space-y-8">
      {/* Collection Composition */}
      <section className="rounded border border-[var(--border)] bg-[var(--card)] p-4 card-retro">
        <h2 className="mb-4 text-sm font-semibold text-[var(--foreground)]">Collection Composition</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <DonutChart data={stats.byStatus} title="By Status" colorMap={STATUS_COLORS} />
          <DonutChart data={stats.byFunctionalStatus} title="By Condition" />
          <DonutChart data={stats.byCategoryType} title="By Category Type" />
        </div>
      </section>

      {/* Rarity */}
      <section className="rounded border border-[var(--border)] bg-[var(--card)] p-4 card-retro">
        <h2 className="mb-4 text-sm font-semibold text-[var(--foreground)]">By Rarity</h2>
        <RarityBarChart data={stats.byRarity} title="Rarity Distribution" />
      </section>

      {/* Acquisition Trends */}
      <section className="rounded border border-[var(--border)] bg-[var(--card)] p-4 card-retro">
        <h2 className="mb-4 text-sm font-semibold text-[var(--foreground)]">Devices Acquired Per Year</h2>
        <VerticalBarChart data={stats.byAcquisitionYear} title="Acquisition Year" />
      </section>

      {/* Release Era */}
      <section className="rounded border border-[var(--border)] bg-[var(--card)] p-4 card-retro">
        <h2 className="mb-4 text-sm font-semibold text-[var(--foreground)]">By Release Era</h2>
        <VerticalBarChart data={stats.byReleaseDecade} title="Release Decade" />
      </section>

      {/* Top Manufacturers */}
      <section className="rounded border border-[var(--border)] bg-[var(--card)] p-4 card-retro">
        <h2 className="mb-4 text-sm font-semibold text-[var(--foreground)]">Top Manufacturers</h2>
        <HorizontalBarChart data={stats.topManufacturers} title="Manufacturer" />
      </section>
    </div>
  );
}
