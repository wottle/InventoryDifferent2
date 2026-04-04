"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { useT } from "../i18n/context";

interface ChartDataPoint {
  date: string;
  dateMs: number;
  cash: number;
  value: number;
  net: number;
}

interface FinancialChartProps {
  data: ChartDataPoint[];
}

export default function FinancialChart({ data }: FinancialChartProps) {
  const t = useT();
  const sym = t.common.currencySymbol;

  const formatCurrencyShort = (value: number) => {
    if (Math.abs(value) >= 1000) return `${sym}${(value / 1000).toFixed(1)}k`;
    return `${sym}${value.toFixed(0)}`;
  };

  const formatCurrencyFull = (value: number) => `${sym}${value.toFixed(2)}`;

  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
        {t.pages.financials.noChartData}
      </div>
    );
  }

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12, fill: "#9CA3AF" }}
            tickLine={{ stroke: "#6B7280" }}
            axisLine={{ stroke: "#6B7280" }}
          />
          <YAxis
            tickFormatter={formatCurrencyShort}
            tick={{ fontSize: 12, fill: "#9CA3AF" }}
            tickLine={{ stroke: "#6B7280" }}
            axisLine={{ stroke: "#6B7280" }}
          />
          <Tooltip
            formatter={(value: number, name: string) => [
              formatCurrencyFull(value),
              name === "cash" ? t.pages.financials.cumulativeCash : name === "value" ? t.pages.financials.cumulativeValue : t.pages.financials.netPositionLine,
            ]}
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
              value === "cash" ? t.pages.financials.cumulativeCash : value === "value" ? t.pages.financials.cumulativeValue : t.pages.financials.netPositionLine
            }
            wrapperStyle={{ fontSize: 12 }}
          />
          <ReferenceLine y={0} stroke="#6B7280" strokeDasharray="3 3" />
          <Line
            type="monotone"
            dataKey="cash"
            stroke="#EF4444"
            strokeWidth={2}
            dot={{ fill: "#EF4444", strokeWidth: 0, r: 3 }}
            activeDot={{ r: 5 }}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#22C55E"
            strokeWidth={2}
            dot={{ fill: "#22C55E", strokeWidth: 0, r: 3 }}
            activeDot={{ r: 5 }}
          />
          <Line
            type="monotone"
            dataKey="net"
            stroke="#3B82F6"
            strokeWidth={2}
            dot={{ fill: "#3B82F6", strokeWidth: 0, r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
