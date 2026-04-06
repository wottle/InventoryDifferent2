//
//  LocationDetailView.swift
//  InventoryDifferent
//

import SwiftUI

// Used for programmatic navigation to a location from the navigation path
struct LocationNavItem: Hashable {
    let id: Int
}

struct LocationDetailView: View {
    let locationId: Int

    @EnvironmentObject var lm: LocalizationManager

    @State private var locationName: String?
    @State private var locationDescription: String?
    @State private var devices: [DeviceListItem] = []
    @State private var isLoading = true
    @State private var error: String?

    var body: some View {
        let t = lm.t
        Group {
            if isLoading {
                ProgressView(t.locationDetail.loading)
            } else if let error {
                VStack(spacing: 16) {
                    Image(systemName: "exclamationmark.triangle")
                        .font(.largeTitle)
                        .foregroundColor(.orange)
                    Text(t.locationDetail.errorLoading)
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
            } else {
                deviceListContent
            }
        }
        .navigationTitle(locationName ?? t.locationDetail.title)
        .navigationBarTitleDisplayMode(.inline)
        .task { await loadData() }
    }

    @ViewBuilder
    private var deviceListContent: some View {
        let t = lm.t
        if devices.isEmpty {
            ContentUnavailableView(
                t.locationDetail.noDevices,
                systemImage: "tray"
            )
        } else {
            List(devices) { device in
                NavigationLink(value: device.id) {
                    DeviceRowView(device: device)
                        .environmentObject(lm)
                }
                .alignmentGuide(.listRowSeparatorLeading) { _ in 0 }
                .listRowInsets(EdgeInsets(top: 0, leading: 0, bottom: 0, trailing: 16))
            }
            .listStyle(.plain)
        }
    }

    private func loadData() async {
        isLoading = true
        error = nil

        let locationQuery = """
        query GetLocation($id: Int!) {
            location(id: $id) {
                id
                name
                description
            }
        }
        """

        let devicesQuery = """
        query GetDevicesAtLocation($locationId: Int!) {
            devices(where: {
                location: { id: { equals: $locationId } },
                deleted: { equals: false }
            }) {
                id
                name
                additionalName
                manufacturer
                releaseYear
                status
                functionalStatus
                condition
                rarity
                isAssetTagged
                isFavorite
                isPramBatteryRemoved
                accessories { id name }
                dateAcquired
                estimatedValue
                listPrice
                soldPrice
                soldDate
                category { id name type sortOrder }
                thumbnails: images {
                    id
                    path
                    thumbnailPath
                    isThumbnail
                    thumbnailMode
                }
            }
        }
        """

        struct LocationResponse: Decodable {
            struct LocationData: Decodable {
                let id: Int
                let name: String
                let description: String?
            }
            let location: LocationData?
        }

        struct DevicesResponse: Decodable {
            let devices: [DeviceListItem]
        }

        do {
            async let locFetch: LocationResponse = APIService.shared.execute(
                query: locationQuery,
                variables: ["id": locationId]
            )
            async let devFetch: DevicesResponse = APIService.shared.execute(
                query: devicesQuery,
                variables: ["locationId": locationId]
            )

            let (locResult, devResult) = try await (locFetch, devFetch)

            await MainActor.run {
                locationName = locResult.location?.name
                locationDescription = locResult.location?.description
                devices = devResult.devices
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
