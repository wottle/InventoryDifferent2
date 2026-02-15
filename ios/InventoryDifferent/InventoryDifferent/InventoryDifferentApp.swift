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
    @State private var showSplash = true
    @State private var deepLinkDeviceId: Int?
    
    var body: some Scene {
        WindowGroup {
            ZStack {
                if appSettings.isConfigured {
                    ContentView(deepLinkDeviceId: $deepLinkDeviceId)
                        .environmentObject(deviceStore)
                        .environmentObject(appSettings)
                } else {
                    ServerSetupView()
                        .environmentObject(appSettings)
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
        // and Universal Links (https://inventorydifferent.com/devices/123)
        
        print("🔗 Deep link received: \(url.absoluteString)")
        print("   Scheme: \(url.scheme ?? "none")")
        print("   Host: \(url.host ?? "none")")
        print("   Path: \(url.path)")
        print("   Path components: \(url.pathComponents)")
        
        var deviceId: Int?
        
        // For custom URL scheme: inventorydifferent://devices/123
        // Host = "devices", Path = "/123"
        if url.scheme == "inventorydifferent" {
            if url.host == "devices" {
                let pathComponents = url.pathComponents.filter { $0 != "/" }
                if let idString = pathComponents.first, let id = Int(idString) {
                    deviceId = id
                }
            } else if url.host == "item" {
                let pathComponents = url.pathComponents.filter { $0 != "/" }
                if let idString = pathComponents.first, let id = Int(idString) {
                    deviceId = id
                }
            }
        }
        // For Universal Links: https://inventorydifferent.com/devices/123
        // Host = "inventorydifferent.com", Path = "/devices/123"
        else if url.scheme == "https" || url.scheme == "http" {
            let pathComponents = url.pathComponents.filter { $0 != "/" }
            if pathComponents.count >= 2 && (pathComponents[0] == "devices" || pathComponents[0] == "item") {
                if let id = Int(pathComponents[1]) {
                    deviceId = id
                }
            }
        }
        
        if let deviceId = deviceId {
            print("✅ Parsed device ID: \(deviceId)")
            
            // Delay to ensure app is fully loaded and splash is dismissed
            let delay: TimeInterval = showSplash ? 2.0 : 0.5
            DispatchQueue.main.asyncAfter(deadline: .now() + delay) {
                print("🚀 Setting deepLinkDeviceId to \(deviceId)")
                deepLinkDeviceId = deviceId
            }
        } else {
            print("❌ Could not parse device ID from URL")
        }
    }
}
