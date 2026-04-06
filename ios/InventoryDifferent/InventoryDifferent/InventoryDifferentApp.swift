//
//  InventoryDifferentApp.swift
//  InventoryDifferent
//
//  Created by Michael Wottle on 2/2/26.
//

import SwiftUI

@main
struct InventoryDifferentApp: App {
    @StateObject private var deviceStore = DeviceStore()
    @StateObject private var appSettings = AppSettings.shared
    @StateObject private var authService = AuthService.shared
    @StateObject private var lm = LocalizationManager.shared
    @State private var showSplash = true
    @State private var deepLinkDeviceId: Int?
    @State private var deepLinkLocationId: Int?

    var body: some Scene {
        WindowGroup {
            ZStack {
                if !appSettings.isConfigured {
                    // Server not configured - show login/setup view
                    LoginView()
                        .environmentObject(authService)
                        .environmentObject(appSettings)
                        .environmentObject(lm)
                } else if authService.isLoading {
                    // Still checking auth status
                    Color(.systemBackground)
                } else if authService.authRequired && !authService.isAuthenticated {
                    // Auth required but not logged in - show login view
                    LoginView()
                        .environmentObject(authService)
                        .environmentObject(appSettings)
                        .environmentObject(lm)
                } else {
                    // Ready to show main content
                    ContentView(deepLinkDeviceId: $deepLinkDeviceId, deepLinkLocationId: $deepLinkLocationId)
                        .environmentObject(deviceStore)
                        .environmentObject(appSettings)
                        .environmentObject(authService)
                        .environmentObject(lm)
                }

                // Splash screen overlay
                if showSplash {
                    SplashScreenView()
                        .transition(.opacity)
                        .zIndex(1)
                }
            }
            .onAppear {
                // Dismiss splash after a short delay
                DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
                    withAnimation(.easeOut(duration: 0.5)) {
                        showSplash = false
                    }
                }
            }
            .onOpenURL { url in
                handleDeepLink(url)
            }
        }
    }
    
    private func handleDeepLink(_ url: URL) {
        // Handle both custom URL scheme (inventorydifferent://devices/123)
        // and Universal Links (https://your-domain.example.com/devices/123)

        print("🔗 Deep link received: \(url.absoluteString)")
        print("   Scheme: \(url.scheme ?? "none")")
        print("   Host: \(url.host ?? "none")")
        print("   Path: \(url.path)")
        print("   Path components: \(url.pathComponents)")

        var deviceId: Int?
        var locationId: Int?

        // For custom URL scheme: inventorydifferent://devices/123 or inventorydifferent://locations/123
        // Host = "devices"/"locations", Path = "/123"
        if url.scheme == "inventorydifferent" {
            let pathComponents = url.pathComponents.filter { $0 != "/" }
            if url.host == "devices" || url.host == "item" {
                if let idString = pathComponents.first, let id = Int(idString) {
                    deviceId = id
                }
            } else if url.host == "locations" {
                if let idString = pathComponents.first, let id = Int(idString) {
                    locationId = id
                }
            }
        }
        // For Universal Links: https://your-domain.example.com/devices/123 or /locations/123
        // Host = "your-domain.example.com", Path = "/devices/123"
        else if url.scheme == "https" || url.scheme == "http" {
            let pathComponents = url.pathComponents.filter { $0 != "/" }
            if pathComponents.count >= 2 {
                if pathComponents[0] == "devices" || pathComponents[0] == "item" {
                    if let id = Int(pathComponents[1]) {
                        deviceId = id
                    }
                } else if pathComponents[0] == "locations" {
                    if let id = Int(pathComponents[1]) {
                        locationId = id
                    }
                }
            }
        }

        let delay: TimeInterval = showSplash ? 2.0 : 0.5

        if let deviceId {
            print("✅ Parsed device ID: \(deviceId)")
            DispatchQueue.main.asyncAfter(deadline: .now() + delay) {
                print("🚀 Setting deepLinkDeviceId to \(deviceId)")
                deepLinkDeviceId = deviceId
            }
        } else if let locationId {
            print("✅ Parsed location ID: \(locationId)")
            DispatchQueue.main.asyncAfter(deadline: .now() + delay) {
                print("🚀 Setting deepLinkLocationId to \(locationId)")
                deepLinkLocationId = locationId
            }
        } else {
            print("❌ Could not parse ID from URL")
        }
    }
}
