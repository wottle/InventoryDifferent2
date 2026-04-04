//
//  TimelineView.swift
//  InventoryDifferent
//

import SwiftUI

struct TimelineYear: Identifiable {
    let year: Int
    var devices: [DeviceListItem]
    var events: [TimelineEvent]
    var id: Int { year }
}

struct TimelineView: View {
    @EnvironmentObject var deviceStore: DeviceStore
    @EnvironmentObject var lm: LocalizationManager
    @State private var events: [TimelineEvent] = []
    @State private var isLoading = true
    @State private var error: String?

    private var timelineYears: [TimelineYear] {
        var map: [Int: TimelineYear] = [:]

        for event in events {
            if map[event.year] == nil {
                map[event.year] = TimelineYear(year: event.year, devices: [], events: [])
            }
            map[event.year]!.events.append(event)
        }

        for device in deviceStore.devices {
            guard let year = device.releaseYear else { continue }
            if map[year] == nil {
                map[year] = TimelineYear(year: year, devices: [], events: [])
            }
            map[year]!.devices.append(device)
        }

        return map.values.sorted { $0.year < $1.year }
    }

    var body: some View {
        let t = lm.t
        Group {
            if isLoading {
                ProgressView(t.timeline.loading)
            } else if let error = error {
                VStack(spacing: 16) {
                    Image(systemName: "exclamationmark.triangle")
                        .font(.largeTitle)
                        .foregroundColor(.orange)
                    Text(t.timeline.errorLoading)
                        .font(.headline)
                    Text(error)
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .multilineTextAlignment(.center)
                    Button(t.common.retry) {
                        Task { await loadEvents() }
                    }
                    .buttonStyle(.borderedProminent)
                }
                .padding()
            } else {
                ScrollView {
                    LazyVStack(spacing: 0, pinnedViews: [.sectionHeaders]) {
                        ForEach(timelineYears) { group in
                            Section(header: yearHeader(group.year)) {
                                VStack(spacing: 8) {
                                    ForEach(group.events) { event in
                                        eventRow(event)
                                    }
                                    ForEach(group.devices, id: \.id) { device in
                                        deviceRow(device)
                                    }
                                }
                                .padding(.horizontal)
                                .padding(.bottom, 12)
                            }
                        }
                    }
                }
            }
        }
        .navigationTitle(t.timeline.title)
        .navigationBarTitleDisplayMode(.large)
        .task {
            await loadEvents()
        }
    }

    // MARK: - Year Header

    private func yearHeader(_ year: Int) -> some View {
        HStack {
            Text(String(year))
                .font(.system(.headline, design: .monospaced))
                .fontWeight(.bold)
                .padding(.horizontal, 12)
                .padding(.vertical, 6)
                .background(Color(.systemBackground))
                .overlay(
                    RoundedRectangle(cornerRadius: 6)
                        .stroke(Color(.separator), lineWidth: 1)
                )
            Spacer()
        }
        .padding(.horizontal)
        .padding(.top, 16)
        .padding(.bottom, 4)
        .background(Color(.systemGroupedBackground))
    }

    // MARK: - Event Row

    private func eventRow(_ event: TimelineEvent) -> some View {
        HStack(alignment: .top, spacing: 10) {
            Circle()
                .fill(event.type.color)
                .frame(width: 10, height: 10)
                .padding(.top, 4)

            VStack(alignment: .leading, spacing: 2) {
                Text(event.title)
                    .font(.subheadline)
                    .fontWeight(.medium)
                Text(event.description)
                    .font(.caption)
                    .foregroundColor(.secondary)
                    .fixedSize(horizontal: false, vertical: true)
            }
            Spacer()
        }
        .padding(.horizontal, 4)
        .padding(.vertical, 2)
    }

    // MARK: - Device Row

    private func deviceRow(_ device: DeviceListItem) -> some View {
        HStack(spacing: 10) {
            // Thumbnail
            Group {
                if let thumb = device.thumbnailImage,
                   let url = APIService.shared.imageURL(for: thumb.thumbnailPath ?? thumb.path) {
                    AsyncImage(url: url) { image in
                        image.resizable().aspectRatio(contentMode: .fill)
                    } placeholder: {
                        Color(.systemGray5)
                    }
                } else {
                    Color(.systemGray5)
                }
            }
            .frame(width: 48, height: 48)
            .clipShape(RoundedRectangle(cornerRadius: 6))

            VStack(alignment: .leading, spacing: 2) {
                Text(device.name)
                    .font(.subheadline)
                    .fontWeight(.semibold)
                if let additional = device.additionalName {
                    Text(additional)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                Text(device.category.name)
                    .font(.caption2)
                    .foregroundColor(.secondary)
            }

            Spacer()
        }
        .padding(8)
        .background(Color(.systemBackground))
        .cornerRadius(8)
        .overlay(
            RoundedRectangle(cornerRadius: 8)
                .stroke(Color.accentColor.opacity(0.4), lineWidth: 1)
        )
        .shadow(color: Color.black.opacity(0.06), radius: 3, x: 0, y: 1)
    }

    // MARK: - Load

    private func loadEvents() async {
        isLoading = true
        error = nil
        do {
            let data = try await TimelineService.shared.fetchEvents()
            events = data.timelineEvents
            isLoading = false
        } catch {
            self.error = error.localizedDescription
            isLoading = false
        }
    }
}

#Preview {
    NavigationStack {
        TimelineView()
            .environmentObject(DeviceStore())
            .environmentObject(AuthService.shared)
    }
}
