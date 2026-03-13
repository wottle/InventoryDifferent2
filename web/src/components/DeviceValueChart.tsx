"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

interface ValueChartDataPoint {
  date: string;
  dateMs: number;
  value: number;
}

interface DeviceValueChartProps {
  data: ValueChartDataPoint[];
}

function formatCurrencyShort(value: number) {
  if (Math.abs(value) >= 1000) {
    return `$${(value / 1000).toFixed(1)}k`;
  }
  return `$${value.toFixed(0)}`;
}

function formatCurrencyFull(value: number) {
  return `$${value.toFixed(2)}`;
}

export default function DeviceValueChart({ data }: DeviceValueChartProps) {
  if (data.length < 2) {
    return (
      <p className="text-sm text-[var(--muted-foreground)]">
        Not enough data yet — value history builds as you update this device.
      </p>
    );
  }

  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
          <XAxis
            dataKey="date"
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
            formatter={(value: number) => [formatCurrencyFull(value), "Estimated Value"]}
            contentStyle={{
              backgroundColor: "#1F2937",
              border: "1px solid #374151",
              borderRadius: "0.5rem",
              color: "#F3F4F6",
            }}
            labelStyle={{ color: "#9CA3AF" }}
            itemStyle={{ color: "#F3F4F6" }}
          />
          <ReferenceLine y={0} stroke="#6B7280" strokeDasharray="3 3" />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#22C55E"
            strokeWidth={2}
            dot={{ fill: "#22C55E", strokeWidth: 0, r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
