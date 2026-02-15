//
//  FinancialsView.swift
//  InventoryDifferent
//
//  Created by Michael Wottle on 2/7/26.
//

import SwiftUI

struct FinancialsView: View {
    @State private var financialData: FinancialData?
    @State private var isLoading = true
    @State private var error: String?
    @State private var transactionsWithCumulative: [TransactionWithCumulative] = []

    var body: some View {
        Group {
            if isLoading {
                ProgressView("Loading financials...")
            } else if let error = error {
                VStack(spacing: 16) {
                    Image(systemName: "exclamationmark.triangle")
                        .font(.largeTitle)
                        .foregroundColor(.orange)
                    Text("Error loading financials")
                        .font(.headline)
                    Text(error)
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .multilineTextAlignment(.center)
                    Button("Retry") {
                        Task {
                            await loadFinancials()
                        }
                    }
                    .buttonStyle(.borderedProminent)
                }
                .padding()
            } else if let data = financialData {
                ScrollView {
                    VStack(spacing: 20) {
                        summarySection(overview: data.financialOverview)
                        transactionsSection()
                    }
                    .padding()
                }
            }
        }
        .navigationTitle("Financials")
        .navigationBarTitleDisplayMode(.large)
        .task {
            await loadFinancials()
        }
    }
    
    private func summarySection(overview: FinancialOverview) -> some View {
        VStack(spacing: 16) {
            Text("Summary")
                .font(.headline)
                .frame(maxWidth: .infinity, alignment: .leading)
            
            VStack(spacing: 12) {
                HStack(spacing: 12) {
                    summaryCard(
                        title: "Total Spent",
                        value: overview.totalSpent,
                        color: .red
                    )
                    summaryCard(
                        title: "Total Received",
                        value: overview.totalReceived,
                        color: .green
                    )
                }
                
                summaryCard(
                    title: "Net Cash",
                    value: overview.netCash,
                    color: valueColor(overview.netCash)
                )
                
                summaryCard(
                    title: "Estimated Value (Owned)",
                    value: overview.estimatedValueOwned,
                    color: .green
                )
                
                summaryCard(
                    title: "Net Position",
                    value: overview.netPosition,
                    color: valueColor(overview.netPosition)
                )
                
                summaryCard(
                    title: "Realized Profit",
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
        VStack(spacing: 16) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Transaction History")
                        .font(.headline)
                    Text("\(transactionsWithCumulative.count) transactions")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                Spacer()
            }
            
            if transactionsWithCumulative.isEmpty {
                Text("No transactions yet.")
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
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(transaction.transaction.deviceName)
                        .font(.headline)
                    if let additionalName = transaction.transaction.additionalName {
                        Text(additionalName)
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                    }
                }
                Spacer()
                Text(transaction.transaction.type == "SALE" ? "Sold" : transaction.transaction.type == "DONATION" ? "Donated" : "Acquired")
                    .font(.caption)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(transaction.transaction.type == "SALE" ? Color.green.opacity(0.2) : transaction.transaction.type == "DONATION" ? Color.purple.opacity(0.2) : Color.blue.opacity(0.2))
                    .foregroundColor(transaction.transaction.type == "SALE" ? .green : transaction.transaction.type == "DONATION" ? .purple : .blue)
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
                        Text("Amount")
                            .font(.caption2)
                            .foregroundColor(.secondary)
                        Text(formatCurrency(amount))
                            .font(.caption)
                            .foregroundColor(valueColor(amount))
                    }
                }
                
                if let estimatedValue = transaction.transaction.estimatedValue {
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Est. Value")
                            .font(.caption2)
                            .foregroundColor(.secondary)
                        Text(formatCurrency(estimatedValue))
                            .font(.caption)
                            .foregroundColor(valueColor(estimatedValue))
                    }
                }
                
                Spacer()
                
                VStack(alignment: .trailing, spacing: 2) {
                    Text("Cumulative Net")
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
        formatter.currencyCode = "USD"
        return formatter.string(from: NSNumber(value: value)) ?? "$0.00"
    }
    
    private func formatDate(_ dateString: String) -> String {
        let isoFormatter = ISO8601DateFormatter()
        
        if let date = isoFormatter.date(from: dateString) {
            let displayFormatter = DateFormatter()
            displayFormatter.dateStyle = .medium
            displayFormatter.timeStyle = .none
            return displayFormatter.string(from: date)
        }
        
        let isoDateFormatter = ISO8601DateFormatter()
        isoDateFormatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]

        if let date = isoDateFormatter.date(from: dateString) {
            let displayFormatter = DateFormatter()
            displayFormatter.dateStyle = .medium
            displayFormatter.timeStyle = .none
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
