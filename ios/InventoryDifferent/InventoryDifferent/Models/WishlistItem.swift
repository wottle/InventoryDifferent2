//
//  WishlistItem.swift
//  InventoryDifferent
//

import Foundation

struct WishlistItem: Codable, Identifiable {
    let id: Int
    let name: String
    let additionalName: String?
    let manufacturer: String?
    let modelNumber: String?
    let releaseYear: Int?
    let targetPrice: Double?
    let sourceUrl: String?
    let sourceNotes: String?
    let notes: String?
    let priority: Int
    let group: String?
    let deleted: Bool
    let createdAt: String
    let categoryId: Int?
    let category: WishlistCategory?
    // Spec fields
    let cpu: String?
    let ram: String?
    let graphics: String?
    let storage: String?
    let operatingSystem: String?
    let externalUrl: String?
    let isWifiEnabled: Bool?
    let isPramBatteryRemoved: Bool?

    var priorityLabel: String {
        switch priority {
        case 1: return "High"
        case 3: return "Low"
        default: return "Medium"
        }
    }
}

// Minimal category info needed for wishlist (avoids circular decode with full Category)
struct WishlistCategory: Codable {
    let id: Int
    let name: String
    let type: String
}
