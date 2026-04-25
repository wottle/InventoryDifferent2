// web/src/components/PeriodicCashFlowChart.tsx
"use client";

import { useEffect, useRef } from "react";
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
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, [data]);

  const formatCurrencyShort = (value: number) => {
    const abs = Math.abs(value);
    const sign = value < 0 ? "-" : "";
    if (abs >= 1000) return `${sign}${sym}${(abs / 1000).toFixed(1)}k`;
    return `${sign}${sym}${abs.toFixed(0)}`;
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
      <div className="overflow-x-auto" ref={scrollRef}>
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
                    : name === "net" ? t.pages.financials.netPositionLine : name;
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
                  : value === "net" ? t.pages.financials.netPositionLine : value
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
