// CashFlowByPeriodView.swift
// InventoryDifferent

import SwiftUI
import Charts

struct CashFlowPeriodBucket: Identifiable {
    let id: String      // "2025-01" or "2025"
    let label: String   // "Jan '25" or "2025"
    let received: Double
    let spent: Double   // negative value (money out)
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
                map[key]!.spent += amount // amounts are already negative (money out)
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
