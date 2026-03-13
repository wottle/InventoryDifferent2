//
//  StatsView.swift
//  InventoryDifferent
//

import SwiftUI
import Charts

struct StatsView: View {
    @State private var statsData: CollectionStatsData?
    @State private var isLoading = true
    @State private var error: String?

    var body: some View {
        Group {
            if isLoading {
                ProgressView("Loading stats...")
            } else if let error = error {
                VStack(spacing: 16) {
                    Image(systemName: "exclamationmark.triangle")
                        .font(.largeTitle)
                        .foregroundColor(.orange)
                    Text("Error loading stats")
                        .font(.headline)
                    Text(error)
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .multilineTextAlignment(.center)
                    Button("Retry") {
                        Task { await loadStats() }
                    }
                    .buttonStyle(.borderedProminent)
                }
                .padding()
            } else if let stats = statsData?.collectionStats {
                ScrollView {
                    VStack(spacing: 20) {
                        summaryCards(stats)
                        horizontalChartSection(title: "By Status", data: stats.byStatus, color: .blue)
                        chartSection(title: "By Condition", data: stats.byFunctionalStatus)
                        chartSection(title: "By Category Type", data: stats.byCategoryType)
                        horizontalChartSection(title: "Acquired Per Year", data: stats.byAcquisitionYear, color: .blue)
                        chartSection(title: "By Release Era", data: stats.byReleaseDecade)
                        manufacturersSection(stats.topManufacturers)
                    }
                    .padding()
                }
            }
        }
        .navigationTitle("Collection Stats")
        .navigationBarTitleDisplayMode(.large)
        .task {
            await loadStats()
        }
    }

    // MARK: - Summary Cards

    private func summaryCards(_ stats: CollectionStats) -> some View {
        VStack(spacing: 16) {
            Text("At a Glance")
                .font(.headline)
                .frame(maxWidth: .infinity, alignment: .leading)

            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                statCard(title: "Total Devices", value: "\(stats.totalDevices)", color: .primary)
                statCard(title: "Working", value: String(format: "%.1f%%", stats.workingPercent), color: .green)
                statCard(title: "Avg. Est. Value", value: formatCurrency(stats.avgEstimatedValue), color: .primary)
                statCard(title: "Top Category", value: stats.topCategoryType.isEmpty ? "—" : stats.topCategoryType, color: .purple)
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
        VStack(alignment: .leading, spacing: 12) {
            Text(title)
                .font(.headline)
                .frame(maxWidth: .infinity, alignment: .leading)

            if data.isEmpty {
                Text("No data")
                    .foregroundColor(.secondary)
                    .frame(maxWidth: .infinity, alignment: .center)
                    .padding()
            } else {
                Chart(data) { bucket in
                    BarMark(
                        x: .value("Label", bucket.label),
                        y: .value("Count", bucket.count)
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
        VStack(alignment: .leading, spacing: 12) {
            Text("Top Manufacturers")
                .font(.headline)
                .frame(maxWidth: .infinity, alignment: .leading)

            if data.isEmpty {
                Text("No data")
                    .foregroundColor(.secondary)
                    .frame(maxWidth: .infinity, alignment: .center)
                    .padding()
            } else {
                Chart(data) { bucket in
                    BarMark(
                        x: .value("Count", bucket.count),
                        y: .value("Manufacturer", bucket.label)
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

    // MARK: - Horizontal Bar (generic)

    private func horizontalChartSection(title: String, data: [StatsBucket], color: Color) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(title)
                .font(.headline)
                .frame(maxWidth: .infinity, alignment: .leading)

            if data.isEmpty {
                Text("No data")
                    .foregroundColor(.secondary)
                    .frame(maxWidth: .infinity, alignment: .center)
                    .padding()
            } else {
                Chart(data) { bucket in
                    BarMark(
                        x: .value("Count", bucket.count),
                        y: .value("Label", bucket.label)
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
}

#Preview {
    StatsView()
}
