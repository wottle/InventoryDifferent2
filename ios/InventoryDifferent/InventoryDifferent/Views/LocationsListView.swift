//
//  LocationsListView.swift
//  InventoryDifferent
//

import SwiftUI

struct LocationsListView: View {
    @EnvironmentObject var lm: LocalizationManager

    @State private var locations: [LocationListItem] = []
    @State private var isLoading = true
    @State private var error: String?

    struct LocationListItem: Decodable, Identifiable {
        let id: Int
        let name: String
        let description: String?
        let deviceCount: Int
    }

    var body: some View {
        let t = lm.t
        Group {
            if isLoading {
                ProgressView(t.locationsList.loading)
            } else if let error {
                VStack(spacing: 16) {
                    Image(systemName: "exclamationmark.triangle")
                        .font(.largeTitle)
                        .foregroundColor(.orange)
                    Text(t.locationsList.errorLoading)
                        .font(.headline)
                    Text(error)
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .multilineTextAlignment(.center)
                    Button(t.common.retry) {
                        Task { await loadData() }
                    }
                    .buttonStyle(.borderedProminent)
                }
                .padding()
            } else if locations.isEmpty {
                ContentUnavailableView(
                    t.locationsList.noLocations,
                    systemImage: "mappin.slash"
                )
            } else {
                List(locations) { location in
                    NavigationLink(value: LocationNavItem(id: location.id)) {
                        HStack {
                            VStack(alignment: .leading, spacing: 2) {
                                Text(location.name)
                                    .font(.body)
                                if let description = location.description, !description.isEmpty {
                                    Text(description)
                                        .font(.caption)
                                        .foregroundColor(.secondary)
                                }
                            }
                            Spacer()
                            Text(String(format: t.locationsList.deviceCountFmt, location.deviceCount))
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                    }
                }
                .listStyle(.plain)
            }
        }
        .navigationTitle(t.locationsList.title)
        .navigationBarTitleDisplayMode(.inline)
        .task { await loadData() }
    }

    private func loadData() async {
        isLoading = true
        error = nil

        let query = """
        query {
            locations {
                id
                name
                description
                deviceCount
            }
        }
        """

        struct Response: Decodable {
            let locations: [LocationListItem]
        }

        do {
            let response: Response = try await APIService.shared.execute(query: query, variables: [:])
            await MainActor.run {
                locations = response.locations
                isLoading = false
            }
        } catch {
            await MainActor.run {
                self.error = error.localizedDescription
                isLoading = false
            }
        }
    }
}
