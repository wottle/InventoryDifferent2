//
//  ContentView.swift
//  InventoryDifferent
//
//  Created by Michael Wottle on 2/2/26.
//

import SwiftUI

struct ContentView: View {
    @EnvironmentObject var deviceStore: DeviceStore
    @EnvironmentObject var auth: AuthService
    @Binding var deepLinkDeviceId: Int?
    @Binding var deepLinkLocationId: Int?
    @Binding var deepLinkToStats: Bool
    @State private var navigationPath = NavigationPath()
    @State private var serverWarningDismissed = false

    var body: some View {
        NavigationStack(path: $navigationPath) {
            DeviceListView(navigationPath: $navigationPath)
                .navigationDestination(for: Int.self) { deviceId in
                    DeviceDetailRedesignScreen(deviceId: deviceId)
                }
                .navigationDestination(for: LocationNavItem.self) { item in
                    LocationDetailView(locationId: item.id)
                        .environmentObject(LocalizationManager.shared)
                }
                .navigationDestination(for: MenuDestination.self) { destination in
                    switch destination {
                    case .financials:
                        FinancialsView()
                    case .chat:
                        ChatView()
                    case .stats:
                        StatsView()
                    case .timeline:
                        TimelineView()
                    case .wishlist:
                        WishlistView()
                    case .locations:
                        LocationsListView()
                            .environmentObject(LocalizationManager.shared)
                    }
                }
        }
        .task {
            await deviceStore.loadDevices()
            await deviceStore.loadCategories()
        }
        .onChange(of: deepLinkDeviceId) { oldValue, newValue in
            print("📱 ContentView: deepLinkDeviceId changed from \(String(describing: oldValue)) to \(String(describing: newValue))")
            if let deviceId = newValue {
                Task {
                    print("📱 ContentView: Checking if devices are loaded...")
                    if deviceStore.devices.isEmpty {
                        print("📱 ContentView: Devices empty, waiting 1 second...")
                        try? await Task.sleep(nanoseconds: 1_000_000_000)
                    }
                    print("📱 ContentView: Appending device ID \(deviceId) to navigation path")
                    navigationPath.append(deviceId)
                    print("📱 ContentView: Navigation path count: \(navigationPath.count)")
                    deepLinkDeviceId = nil
                }
            }
        }
        .onChange(of: deepLinkLocationId) { _, newValue in
            if let locationId = newValue {
                navigationPath.append(LocationNavItem(id: locationId))
                deepLinkLocationId = nil
            }
        }
        .onChange(of: deepLinkToStats) { _, newValue in
            if newValue {
                navigationPath.append(MenuDestination.stats)
                deepLinkToStats = false
            }
        }
        .safeAreaInset(edge: .top, spacing: 0) {
            if auth.serverOutdated && !serverWarningDismissed {
                HStack(spacing: 8) {
                    Image(systemName: "exclamationmark.triangle.fill")
                        .foregroundColor(.black)
                    Text("Your server may be outdated. Update it for the best experience.")
                        .font(.system(size: 12, weight: .medium))
                        .foregroundColor(.black)
                        .fixedSize(horizontal: false, vertical: true)
                    Spacer()
                    Button {
                        serverWarningDismissed = true
                    } label: {
                        Image(systemName: "xmark")
                            .foregroundColor(.black)
                            .font(.system(size: 12, weight: .bold))
                    }
                }
                .padding(.horizontal, 12)
                .padding(.vertical, 8)
                .background(Color.yellow.opacity(0.85))
            }
        }
    }
}

#Preview {
    ContentView(deepLinkDeviceId: .constant(nil), deepLinkLocationId: .constant(nil), deepLinkToStats: .constant(false))
        .environmentObject(DeviceStore())
        .environmentObject(AppSettings.shared)
        .environmentObject(AuthService.shared)
}
