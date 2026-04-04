//
//  FinancialsView.swift
//  InventoryDifferent
//
//  Created by Michael Wottle on 2/7/26.
//

import SwiftUI
import Charts

struct ChartDataPoint: Identifiable {
    let id = UUID()
    let index: Int
    let date: Date
    let label: String
    let cash: Double
    let value: Double
    let net: Double
}

struct FinancialsView: View {
    @EnvironmentObject var lm: LocalizationManager
    @State private var financialData: FinancialData?
    @State private var isLoading = true
    @State private var error: String?
    @State private var transactionsWithCumulative: [TransactionWithCumulative] = []
    @Environment(\.verticalSizeClass) private var verticalSizeClass

    var body: some View {
        let t = lm.t
        Group {
            if isLoading {
                ProgressView(t.financials.loading)
            } else if let error = error {
                VStack(spacing: 16) {
                    Image(systemName: "exclamationmark.triangle")
                        .font(.largeTitle)
                        .foregroundColor(.orange)
                    Text(t.financials.errorLoading)
                        .font(.headline)
                    Text(error)
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .multilineTextAlignment(.center)
                    Button(t.common.retry) {
                        Task {
                            await loadFinancials()
                        }
                    }
                    .buttonStyle(.borderedProminent)
                }
                .padding()
            } else if let data = financialData {
                if verticalSizeClass == .compact {
                    chartSection(overview: data.financialOverview)
                } else {
                    ScrollView {
                        VStack(spacing: 20) {
                            summarySection(overview: data.financialOverview)
                            transactionsSection()
                        }
                        .padding()
                    }
                }
            }
        }
        .navigationTitle(t.financials.title)
        .navigationBarTitleDisplayMode(verticalSizeClass == .compact ? .inline : .large)
        .task {
            await loadFinancials()
        }
    }

    // MARK: - Chart (Landscape)

    private var chartDataPoints: [ChartDataPoint] {
        let labelFormatter = DateFormatter()
        labelFormatter.dateFormat = "MMM ''yy"

        let isoFormatter = ISO8601DateFormatter()
        let isoFractionalFormatter = ISO8601DateFormatter()
        isoFractionalFormatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]

        let calendar = Calendar.current

        // Parse and sort oldest → newest
        let sorted = transactionsWithCumulative
            .compactMap { t -> (date: Date, t: TransactionWithCumulative)? in
                guard let dateString = t.transaction.date,
                      let date = isoFormatter.date(from: dateString) ?? isoFractionalFormatter.date(from: dateString)
                else { return nil }
                return (date, t)
            }
            .sorted { $0.date < $1.date }

        // Keep only the last transaction per calendar day — it holds the
        // correct end-of-day cumulative totals for cash, value, and net.
        var seen = Set<DateComponents>()
        var deduplicated: [(date: Date, t: TransactionWithCumulative)] = []
        for pair in sorted.reversed() {
            let day = calendar.dateComponents([.year, .month, .day], from: pair.date)
            if !seen.contains(day) {
                seen.insert(day)
                deduplicated.append(pair)
            }
        }
        deduplicated.reverse() // restore oldest → newest order

        return deduplicated
            .enumerated()
            .map { i, pair in
                ChartDataPoint(
                    index: i,
                    date: pair.date,
                    label: labelFormatter.string(from: pair.date),
                    cash: pair.t.cumulativeCash,
                    value: pair.t.cumulativeValue,
                    net: pair.t.cumulativeNet
                )
            }
    }

    private func chartSection(overview: FinancialOverview) -> some View {
        let t = lm.t
        return VStack(spacing: 8) {
            // Compact summary row
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 8) {
                    compactSummaryCard(title: t.financials.spent, value: overview.totalSpent, color: .red)
                    compactSummaryCard(title: t.financials.received, value: overview.totalReceived, color: .green)
                    compactSummaryCard(title: t.financials.netCash, value: overview.netCash, color: valueColor(overview.netCash))
                    compactSummaryCard(title: t.financials.estValue, value: overview.estimatedValueOwned, color: .green)
                    compactSummaryCard(title: t.financials.maintenance, value: overview.totalMaintenanceCost, color: overview.totalMaintenanceCost > 0 ? .red : .primary)
                    compactSummaryCard(title: t.financials.netPosition, value: overview.netPosition, color: valueColor(overview.netPosition))
                    compactSummaryCard(title: t.financials.profit, value: overview.totalProfit, color: valueColor(overview.totalProfit))
                }
                .padding(.horizontal)
            }

            Text(t.financials.valueOverTime)
                .font(.subheadline)
                .fontWeight(.semibold)

            let points = chartDataPoints
            if points.count < 2 {
                Text(t.financials.notEnoughData)
                    .foregroundColor(.secondary)
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else {
                Chart {
                    ForEach(points) { point in
                        LineMark(
                            x: .value("Index", point.index),
                            y: .value("Amount", point.cash)
                        )
                        .foregroundStyle(by: .value("Series", lm.t.financials.cumulativeCash))
                        .interpolationMethod(.monotone)
                    }
                    ForEach(points) { point in
                        LineMark(
                            x: .value("Index", point.index),
                            y: .value("Amount", point.value)
                        )
                        .foregroundStyle(by: .value("Series", lm.t.financials.cumulativeValue))
                        .interpolationMethod(.monotone)
                    }
                    ForEach(points) { point in
                        LineMark(
                            x: .value("Index", point.index),
                            y: .value("Amount", point.net)
                        )
                        .foregroundStyle(by: .value("Series", lm.t.financials.netPositionLine))
                        .interpolationMethod(.monotone)
                    }
                    RuleMark(y: .value(lm.t.financials.zero, 0))
                        .lineStyle(StrokeStyle(lineWidth: 1, dash: [5, 5]))
                        .foregroundStyle(.gray.opacity(0.5))
                }
                .chartForegroundStyleScale([
                    lm.t.financials.cumulativeCash: Color.red,
                    lm.t.financials.cumulativeValue: Color.green,
                    lm.t.financials.netPositionLine: Color.blue
                ])
                .chartYAxis {
                    let currencySymbol = lm.t.common.currencySymbol

                    if( currencySymbol == "$") {
                        AxisMarks(format: .currency(code: "USD"))
                    } else if ( currencySymbol == "€") {
                        AxisMarks(format: .currency(code: "EUR"))
                    } else {
                        AxisMarks(format: .currency(code: "USD"))

                    }
                }
                .chartXAxis {
                    // Pick ~5 evenly spaced indices to label so the axis stays readable
                    let labelCount = min(5, points.count)
                    let stride = max(1, (points.count - 1) / max(1, labelCount - 1))
                    let labelIndices = (0..<labelCount).map { i in
                        min(i * stride, points.count - 1)
                    }
                    AxisMarks(values: labelIndices) { axisValue in
                        AxisGridLine()
                        AxisValueLabel {
                            if let idx = axisValue.as(Int.self),
                               idx < points.count {
                                Text(points[idx].label)
                                    .font(.caption2)
                            }
                        }
                    }
                }
                .chartLegend(.visible)
                .padding(.horizontal)
            }
        }
        .padding(.vertical, 8)
    }

    private func compactSummaryCard(title: String, value: Double, color: Color) -> some View {
        VStack(spacing: 2) {
            Text(title)
                .font(.caption2)
                .foregroundColor(.secondary)
            Text(formatCurrency(value))
                .font(.caption)
                .fontWeight(.semibold)
                .foregroundColor(color)
                .lineLimit(1)
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 6)
        .background(Color(.secondarySystemBackground))
        .cornerRadius(12)
    }
    
    private func summarySection(overview: FinancialOverview) -> some View {
        let t = lm.t
        return VStack(spacing: 16) {
            Text(t.financials.summary)
                .font(.headline)
                .frame(maxWidth: .infinity, alignment: .leading)
            
            VStack(spacing: 12) {
                HStack(spacing: 12) {
                    summaryCard(
                        title: t.financials.totalSpent,
                        value: overview.totalSpent,
                        color: .red
                    )
                    summaryCard(
                        title: t.financials.totalReceived,
                        value: overview.totalReceived,
                        color: .green
                    )
                }
                
                summaryCard(
                    title: t.financials.netCash,
                    value: overview.netCash,
                    color: valueColor(overview.netCash)
                )
                
                summaryCard(
                    title: t.financials.estimatedValueOwned,
                    value: overview.estimatedValueOwned,
                    color: .green
                )

                summaryCard(
                    title: t.financials.maintenanceCosts,
                    value: overview.totalMaintenanceCost,
                    color: overview.totalMaintenanceCost > 0 ? .red : .primary
                )

                summaryCard(
                    title: t.financials.netPosition,
                    value: overview.netPosition,
                    color: valueColor(overview.netPosition)
                )
                
                summaryCard(
                    title: t.financials.realizedProfit,
                    value: overview.totalProfit,
                    color: valueColor(overview.totalProfit)
                )
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.1), radius: 5, x: 0, y: 2)
    }
    
    private func summaryCard(title: String, value: Double, color: Color) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(title)
                .font(.caption)
                .foregroundColor(.secondary)
            Text(formatCurrency(value))
                .font(.headline)
                .fontWeight(.semibold)
                .foregroundColor(color)
                .minimumScaleFactor(0.7)
                .lineLimit(1)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding()
        .background(Color(.secondarySystemBackground))
        .cornerRadius(8)
    }
    
    private func transactionsSection() -> some View {
        let t = lm.t
        return VStack(spacing: 16) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(t.financials.transactionHistory)
                        .font(.headline)
                    Text("\(transactionsWithCumulative.count) \(t.financials.transactions)")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                Spacer()
            }
            
            if transactionsWithCumulative.isEmpty {
                Text(t.financials.noTransactions)
                    .foregroundColor(.secondary)
                    .padding()
            } else {
                VStack(spacing: 0) {
                    ForEach(transactionsWithCumulative) { transaction in
                        transactionRow(transaction)
                        if transaction.id != transactionsWithCumulative.last?.id {
                            Divider()
                        }
                    }
                }
                .background(Color(.systemBackground))
                .cornerRadius(12)
                .shadow(color: Color.black.opacity(0.1), radius: 5, x: 0, y: 2)
            }
        }
    }
    
    private func transactionRow(_ transaction: TransactionWithCumulative) -> some View {
        let t = lm.t
        return VStack(alignment: .leading, spacing: 8) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(transaction.transaction.deviceName)
                        .font(.headline)
                    if let additionalName = transaction.transaction.additionalName {
                        Text(additionalName)
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                    }
                    if let label = transaction.transaction.label {
                        Text(label)
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }
                Spacer()
                let typeName: String = {
                    switch transaction.transaction.type {
                    case "SALE": return t.financials.txSold
                    case "DONATION": return t.financials.txDonated
                    case "MAINTENANCE": return t.financials.txMaintenance
                    case "REPAIR_RETURN": return t.financials.txRepairFee
                    default: return t.financials.txAcquired
                    }
                }()
                let typeColor: Color = {
                    switch transaction.transaction.type {
                    case "SALE": return .green
                    case "DONATION": return .purple
                    case "MAINTENANCE": return .orange
                    case "REPAIR_RETURN": return .teal
                    default: return .blue
                    }
                }()
                Text(typeName)
                    .font(.caption)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(typeColor.opacity(0.2))
                    .foregroundColor(typeColor)
                    .cornerRadius(4)
            }
            
            if let date = transaction.transaction.date {
                Text(formatDate(date))
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            HStack(spacing: 16) {
                if let amount = transaction.transaction.amount {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(t.financials.amount)
                            .font(.caption2)
                            .foregroundColor(.secondary)
                        Text(formatCurrency(amount))
                            .font(.caption)
                            .foregroundColor(valueColor(amount))
                    }
                }
                
                if let estimatedValue = transaction.transaction.estimatedValue {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(t.financials.estValue)
                            .font(.caption2)
                            .foregroundColor(.secondary)
                        Text(formatCurrency(estimatedValue))
                            .font(.caption)
                            .foregroundColor(valueColor(estimatedValue))
                    }
                }
                
                Spacer()
                
                VStack(alignment: .trailing, spacing: 2) {
                    Text(t.financials.cumNet)
                        .font(.caption2)
                        .foregroundColor(.secondary)
                    Text(formatCurrency(transaction.cumulativeNet))
                        .font(.caption)
                        .fontWeight(.semibold)
                        .foregroundColor(valueColor(transaction.cumulativeNet))
                }
            }
        }
        .padding()
    }
    
    private func loadFinancials() async {
        isLoading = true
        error = nil
        
        do {
            let data = try await FinancialService.shared.fetchFinancials()
            financialData = data
            transactionsWithCumulative = calculateCumulativeTransactions(data.financialTransactions)
            isLoading = false
        } catch {
            self.error = error.localizedDescription
            isLoading = false
        }
    }
    
    private func calculateCumulativeTransactions(_ transactions: [FinancialTransaction]) -> [TransactionWithCumulative] {
        var sorted = transactions.enumerated().map { (index, transaction) in
            (transaction: transaction, index: index, dateMs: dateMs(transaction.date))
        }
        
        sorted.sort { a, b in
            let aMs = a.dateMs ?? -Double.infinity
            let bMs = b.dateMs ?? -Double.infinity
            if aMs != bMs {
                return aMs < bMs
            }
            return a.index > b.index
        }
        
        var runningCash = 0.0
        var runningValue = 0.0
        var runningNet = 0.0
        
        var withCumulative = sorted.map { item in
            let cash = item.transaction.amount ?? 0
            let est = item.transaction.estimatedValue ?? 0
            runningCash += cash
            runningValue += est
            runningNet += cash + est
            
            return TransactionWithCumulative(
                transaction: item.transaction,
                cumulativeCash: runningCash,
                cumulativeValue: runningValue,
                cumulativeNet: runningNet,
                index: item.index
            )
        }
        
        withCumulative.sort { a, b in
            let aMs = dateMs(a.transaction.date) ?? Double.infinity
            let bMs = dateMs(b.transaction.date) ?? Double.infinity
            
            if aMs != bMs {
                return bMs > aMs  // Descending: newest first (bt - at in web app)
            }
            return b.index > a.index
        }
        
        return withCumulative
    }
    
    private func dateMs(_ dateString: String?) -> Double? {
        guard let dateString = dateString else { return nil }
        let formatter = ISO8601DateFormatter()
        guard let date = formatter.date(from: dateString) else { return nil }
        return date.timeIntervalSince1970 * 1000
    }
    
    private func formatCurrency(_ value: Double) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        // Use the currency symbol from translations
        let currencySymbol = lm.t.common.currencySymbol
        formatter.currencySymbol = currencySymbol
        formatter.locale = Locale.current
        return formatter.string(from: NSNumber(value: value)) ?? "\(currencySymbol)0.00"
    }
    
    private func formatDate(_ dateString: String) -> String {
        let isoFormatter = ISO8601DateFormatter()
        
        if let date = isoFormatter.date(from: dateString) {
            let displayFormatter = DateFormatter()
            displayFormatter.dateStyle = .medium
            displayFormatter.timeStyle = .none
            // Use the current language for date formatting
            displayFormatter.locale = Locale(identifier: lm.currentLanguage == "de" ? "de_DE" : "en_US")
            return displayFormatter.string(from: date)
        }
        
        let isoDateFormatter = ISO8601DateFormatter()
        isoDateFormatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]

        if let date = isoDateFormatter.date(from: dateString) {
            let displayFormatter = DateFormatter()
            displayFormatter.dateStyle = .medium
            displayFormatter.timeStyle = .none
            // Use the current language for date formatting
            displayFormatter.locale = Locale(identifier: lm.currentLanguage == "de" ? "de_DE" : "en_US")
            return displayFormatter.string(from: date)
        }
        
        return dateString
    }
    
    private func valueColor(_ value: Double) -> Color {
        if value > 0 {
            return .green
        } else if value < 0 {
            return .red
        } else {
            return .primary
        }
    }
}

struct TransactionWithCumulative: Identifiable {
    let transaction: FinancialTransaction
    let cumulativeCash: Double
    let cumulativeValue: Double
    let cumulativeNet: Double
    let index: Int
    
    var id: String {
        transaction.id
    }
}

#Preview {
    FinancialsView()
}
