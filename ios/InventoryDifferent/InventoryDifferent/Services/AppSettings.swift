//
//  AppSettings.swift
//  InventoryDifferent
//
//  Created by Michael Wottle on 2/2/26.
//

import Foundation
import Combine

final class AppSettings: ObservableObject {
    static let shared = AppSettings()
    
    private let serverURLKey = "serverURL"
    private let isConfiguredKey = "isConfigured"
    
    @Published var serverURL: String
    @Published var isConfigured: Bool
    
    init() {
        self.serverURL = UserDefaults.standard.string(forKey: serverURLKey) ?? "https://inventorydifferent.com"
        self.isConfigured = UserDefaults.standard.bool(forKey: isConfiguredKey)
    }
    
    func configure(serverURL: String) {
        self.serverURL = serverURL
        self.isConfigured = true
        UserDefaults.standard.set(serverURL, forKey: serverURLKey)
        UserDefaults.standard.set(true, forKey: isConfiguredKey)
        APIService.shared.updateBaseURL(serverURL)
    }
    
    func logout() {
        self.isConfigured = false
        UserDefaults.standard.set(false, forKey: isConfiguredKey)
    }
}
