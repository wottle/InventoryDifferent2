//
//  ContentView.swift
//  InventoryDifferent
//
//  Created by Michael Wottle on 2/2/26.
//

import SwiftUI

struct ContentView: View {
    @EnvironmentObject var deviceStore: DeviceStore
    @Binding var deepLinkDeviceId: Int?
    @Binding var deepLinkLocationId: Int?
    @State private var navigationPath = NavigationPath()
    
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
    }
}

#Preview {
    ContentView(deepLinkDeviceId: .constant(nil), deepLinkLocationId: .constant(nil))
        .environmentObject(DeviceStore())
        .environmentObject(AppSettings.shared)
        .environmentObject(AuthService.shared)
}
