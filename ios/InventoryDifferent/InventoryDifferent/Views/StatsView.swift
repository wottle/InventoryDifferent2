//
//  StatsView.swift
//  InventoryDifferent
//

import SwiftUI
import Charts

struct StatsView: View {
    @EnvironmentObject var lm: LocalizationManager
    @State private var statsData: CollectionStatsData?
    @State private var isLoading = true
    @State private var error: String?

    var body: some View {
        let t = lm.t
        Group {
            if isLoading {
                ProgressView(t.stats.loading)
            } else if let error = error {
                VStack(spacing: 16) {
                    Image(systemName: "exclamationmark.triangle")
                        .font(.largeTitle)
                        .foregroundColor(.orange)
                    Text(t.stats.errorLoading)
                        .font(.headline)
                    Text(error)
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .multilineTextAlignment(.center)
                    Button(t.common.retry) {
                        Task { await loadStats() }
                    }
                    .buttonStyle(.borderedProminent)
                }
                .padding()
            } else if let stats = statsData?.collectionStats {
                ScrollView {
                    VStack(spacing: 20) {
                        summaryCards(stats)
                        horizontalChartSection(title: t.stats.byStatus, data: stats.byStatus, color: .blue)
                        chartSection(title: t.stats.byCondition, data: stats.byFunctionalStatus)
                        chartSection(title: t.stats.byCategoryType, data: stats.byCategoryType)
                        rarityChartSection(stats.byRarity)
                        horizontalChartSection(title: t.stats.acquiredPerYear, data: stats.byAcquisitionYear, color: .blue)
                        chartSection(title: t.stats.byReleaseEra, data: stats.byReleaseDecade)
                        manufacturersSection(stats.topManufacturers)
                    }
                    .padding()
                }
            }
        }
        .navigationTitle(t.stats.title)
        .navigationBarTitleDisplayMode(.large)
        .task {
            await loadStats()
        }
    }

    // MARK: - Summary Cards

    private func summaryCards(_ stats: CollectionStats) -> some View {
        let t = lm.t
        return VStack(spacing: 16) {
            Text(t.stats.atAGlance)
                .font(.headline)
                .frame(maxWidth: .infinity, alignment: .leading)

            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                statCard(title: t.stats.totalDevices, value: "\(stats.totalDevices)", color: .primary)
                statCard(title: t.stats.working, value: String(format: "%.1f%%", stats.workingPercent), color: .green)
                statCard(title: t.stats.avgEstValue, value: formatCurrency(stats.avgEstimatedValue), color: .primary)
                statCard(title: t.stats.topCategory, value: stats.topCategoryType.isEmpty ? "—" : stats.topCategoryType, color: .purple)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.1), radius: 5, x: 0, y: 2)
    }

    private func statCard(title: String, value: String, color: Color) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(title)
                .font(.caption)
                .foregroundColor(.secondary)
            Text(value)
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

    // MARK: - Bar Chart Section

    private func chartSection(title: String, data: [StatsBucket]) -> some View {
        let t = lm.t
        let translatedData = data.map { bucket in
            StatsBucket(label: translateLabel(bucket.label), count: bucket.count)
        }
        return VStack(alignment: .leading, spacing: 12) {
            Text(title)
                .font(.headline)
                .frame(maxWidth: .infinity, alignment: .leading)

            if data.isEmpty {
                Text(lm.t.stats.noData)
                    .foregroundColor(.secondary)
                    .frame(maxWidth: .infinity, alignment: .center)
                    .padding()
            } else {
                Chart(translatedData) { bucket in
                    BarMark(
                        x: .value(t.stats.chartLabel, bucket.label),
                        y: .value(t.stats.chartCount, bucket.count)
                    )
                    .foregroundStyle(Color.blue)
                    .cornerRadius(4)
                }
                .chartXAxis {
                    AxisMarks { _ in
                        AxisValueLabel()
                            .font(.caption2)
                    }
                }
                .chartYAxis {
                    AxisMarks(values: .automatic) { _ in
                        AxisGridLine()
                        AxisValueLabel()
                            .font(.caption2)
                    }
                }
                .frame(height: 200)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.1), radius: 5, x: 0, y: 2)
    }

    // MARK: - Horizontal Bar (Manufacturers)

    private func manufacturersSection(_ data: [StatsBucket]) -> some View {
        let t = lm.t
        return VStack(alignment: .leading, spacing: 12) {
            Text(t.stats.topManufacturers)
                .font(.headline)
                .frame(maxWidth: .infinity, alignment: .leading)

            if data.isEmpty {
                Text(lm.t.stats.noData)
                    .foregroundColor(.secondary)
                    .frame(maxWidth: .infinity, alignment: .center)
                    .padding()
            } else {
                Chart(data) { bucket in
                    BarMark(
                        x: .value(t.stats.chartCount, bucket.count),
                        y: .value(t.stats.chartManufacturer, bucket.label)
                    )
                    .foregroundStyle(Color.orange)
                    .cornerRadius(4)
                }
                .chartXAxis {
                    AxisMarks(values: .automatic) { _ in
                        AxisGridLine()
                        AxisValueLabel()
                            .font(.caption2)
                    }
                }
                .chartYAxis {
                    AxisMarks { _ in
                        AxisValueLabel()
                            .font(.caption2)
                    }
                }
                .frame(height: CGFloat(max(200, data.count * 36)))
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.1), radius: 5, x: 0, y: 2)
    }

    // MARK: - Rarity Chart

    private func rarityColor(_ label: String) -> Color {
        switch label {
        case "Common":         return Color(.systemGray)
        case "Uncommon":       return Color.green
        case "Rare":           return Color.blue
        case "Very Rare":      return Color.purple
        case "Extremely Rare": return Color.orange
        default:               return Color.blue
        }
    }

    private func rarityChartSection(_ data: [StatsBucket]) -> some View {
        let t = lm.t
        let translatedData = data.map { bucket in
            StatsBucket(label: translateLabel(bucket.label), count: bucket.count)
        }
        return VStack(alignment: .leading, spacing: 12) {
            Text(t.stats.byRarity)
                .font(.headline)
                .frame(maxWidth: .infinity, alignment: .leading)

            if data.isEmpty {
                Text(lm.t.stats.noData)
                    .foregroundColor(.secondary)
                    .frame(maxWidth: .infinity, alignment: .center)
                    .padding()
            } else {
                Chart(translatedData) { bucket in
                    BarMark(
                        x: .value(t.stats.chartRarity, bucket.label),
                        y: .value(t.stats.chartCount, bucket.count)
                    )
                    .foregroundStyle(rarityColor(bucket.label))
                    .cornerRadius(4)
                }
                .chartXAxis {
                    AxisMarks { _ in
                        AxisValueLabel()
                            .font(.caption2)
                    }
                }
                .chartYAxis {
                    AxisMarks(values: .automatic) { _ in
                        AxisGridLine()
                        AxisValueLabel()
                            .font(.caption2)
                    }
                }
                .frame(height: 200)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.1), radius: 5, x: 0, y: 2)
    }

    // MARK: - Horizontal Bar (generic)

    private func horizontalChartSection(title: String, data: [StatsBucket], color: Color) -> some View {
        let t = lm.t
        let translatedData = data.map { bucket in
            StatsBucket(label: translateLabel(bucket.label), count: bucket.count)
        }
        return VStack(alignment: .leading, spacing: 12) {
            Text(title)
                .font(.headline)
                .frame(maxWidth: .infinity, alignment: .leading)

            if data.isEmpty {
                Text(lm.t.stats.noData)
                    .foregroundColor(.secondary)
                    .frame(maxWidth: .infinity, alignment: .center)
                    .padding()
            } else {
                Chart(translatedData) { bucket in
                    BarMark(
                        x: .value(t.stats.chartCount, bucket.count),
                        y: .value(t.stats.chartLabel, bucket.label)
                    )
                    .foregroundStyle(color)
                    .cornerRadius(4)
                }
                .chartXAxis {
                    AxisMarks(values: .automatic) { _ in
                        AxisGridLine()
                        AxisValueLabel()
                            .font(.caption2)
                    }
                }
                .chartYAxis {
                    AxisMarks { _ in
                        AxisValueLabel()
                            .font(.caption2)
                    }
                }
                .frame(height: CGFloat(max(200, data.count * 36)))
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.1), radius: 5, x: 0, y: 2)
    }

    // MARK: - Load

    private func loadStats() async {
        isLoading = true
        error = nil
        do {
            let data = try await StatsService.shared.fetchStats()
            statsData = data
            isLoading = false
        } catch {
            self.error = error.localizedDescription
            isLoading = false
        }
    }

    // MARK: - Helpers

    private func formatCurrency(_ value: Double) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencyCode = "USD"
        return formatter.string(from: NSNumber(value: value)) ?? "$0.00"
    }

    // MARK: - Translation Helpers

    private func translateLabel(_ label: String) -> String {
        let t = lm.t
        
        // Status translations
        switch label {
        case "COLLECTION", "In Collection": return t.status.COLLECTION
        case "FOR_SALE", "For Sale": return t.status.FOR_SALE
        case "PENDING_SALE", "Pending": return t.status.PENDING_SALE
        case "IN_REPAIR", "In Repair": return t.status.IN_REPAIR
        case "SOLD", "Sold": return t.status.SOLD
        case "DONATED", "Donated": return t.status.DONATED
        case "RETURNED", "Returned": return t.status.RETURNED
        
        // Functional Status translations
        case "YES", "Working": return t.functionalStatus.YES
        case "PARTIAL", "Partial": return t.functionalStatus.PARTIAL
        case "NO", "Not Working": return t.functionalStatus.NO
        
        // Condition translations
        case "NEW", "New": return t.condition.NEW
        case "LIKE_NEW", "Like New": return t.condition.LIKE_NEW
        case "VERY_GOOD", "Very Good": return t.condition.VERY_GOOD
        case "GOOD", "Good": return t.condition.GOOD
        case "ACCEPTABLE", "Acceptable": return t.condition.ACCEPTABLE
        case "FOR_PARTS", "For Parts": return t.condition.FOR_PARTS
        
        // Rarity translations
        case "COMMON", "Common": return t.rarity.COMMON
        case "UNCOMMON", "Uncommon": return t.rarity.UNCOMMON
        case "RARE", "Rare": return t.rarity.RARE
        case "VERY_RARE", "Very Rare": return t.rarity.VERY_RARE
        case "EXTREMELY_RARE", "Extremely Rare": return t.rarity.EXTREMELY_RARE
        
        // Default: return as-is (for manufacturers, years, categories, etc.)
        default: return label
        }
    }
}

#Preview {
    StatsView()
}
