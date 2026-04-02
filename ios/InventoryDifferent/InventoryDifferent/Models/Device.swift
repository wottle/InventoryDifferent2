//
//  Device.swift
//  InventoryDifferent
//
//  Created by Michael Wottle on 2/2/26.
//

import Foundation
import SwiftUI

struct DeviceAccessory: Codable, Identifiable, Hashable {
    let id: Int
    let name: String
}

struct DeviceLink: Codable, Identifiable, Hashable {
    let id: Int
    let label: String
    let url: String
}

protocol DeviceRowPresentable {
    var id: Int { get }
    var status: Status { get }
    var functionalStatus: FunctionalStatus { get }
    var condition: Condition? { get }
    var rarity: Rarity? { get }
    var isAssetTagged: Bool { get }
    var accessories: [DeviceAccessory] { get }
    var isFavorite: Bool { get }
    var isPramBatteryRemoved: Bool? { get }
    var category: Category { get }
    var estimatedValue: Double? { get }
    var listPrice: Double? { get }
    var soldPrice: Double? { get }
}

enum Status: String, Codable, CaseIterable {
    case COLLECTION
    case FOR_SALE
    case PENDING_SALE
    case IN_REPAIR
    case SOLD
    case DONATED
    case RETURNED

    var displayName: String {
        switch self {
        case .COLLECTION: return "In Collection"
        case .FOR_SALE: return "For Sale"
        case .PENDING_SALE: return "Pending"
        case .SOLD: return "Sold"
        case .DONATED: return "Donated"
        case .IN_REPAIR: return "In Repair"
        case .RETURNED: return "Returned"
        }
    }

    var color: String {
        switch self {
        case .COLLECTION: return "green"
        case .FOR_SALE: return "blue"
        case .PENDING_SALE: return "orange"
        case .SOLD: return "gray"
        case .DONATED: return "purple"
        case .IN_REPAIR: return "teal"
        case .RETURNED: return "gray"
        }
    }
}

enum FunctionalStatus: String, Codable, CaseIterable {
    case YES
    case PARTIAL
    case NO

    var displayName: String {
        switch self {
        case .YES: return "Working"
        case .PARTIAL: return "Partial"
        case .NO: return "Not Working"
        }
    }
}

enum Condition: String, Codable, CaseIterable {
    case NEW = "NEW"
    case LIKE_NEW = "LIKE_NEW"
    case VERY_GOOD = "VERY_GOOD"
    case GOOD = "GOOD"
    case ACCEPTABLE = "ACCEPTABLE"
    case FOR_PARTS = "FOR_PARTS"

    var displayName: String {
        switch self {
        case .NEW: return "New"
        case .LIKE_NEW: return "Like New"
        case .VERY_GOOD: return "Very Good"
        case .GOOD: return "Good"
        case .ACCEPTABLE: return "Acceptable"
        case .FOR_PARTS: return "For Parts"
        }
    }
}

enum Rarity: String, Codable, CaseIterable {
    case COMMON = "COMMON"
    case UNCOMMON = "UNCOMMON"
    case RARE = "RARE"
    case VERY_RARE = "VERY_RARE"
    case EXTREMELY_RARE = "EXTREMELY_RARE"

    var displayName: String {
        switch self {
        case .COMMON: return "Common"
        case .UNCOMMON: return "Uncommon"
        case .RARE: return "Rare"
        case .VERY_RARE: return "Very Rare"
        case .EXTREMELY_RARE: return "Extremely Rare"
        }
    }

    var isRare: Bool {
        return self == .VERY_RARE || self == .EXTREMELY_RARE
    }
}

struct Category: Codable, Identifiable, Hashable {
    let id: Int
    let name: String
    let type: String
    let sortOrder: Int
}

struct DeviceImage: Codable, Identifiable {
    let id: Int
    let path: String
    let thumbnailPath: String?
    let dateTaken: String?
    let caption: String?
    let isShopImage: Bool
    let isThumbnail: Bool
    let thumbnailMode: String?
    let isListingImage: Bool
}

struct DeviceThumbnail: Codable, Identifiable, Hashable {
    let id: Int
    let path: String
    let thumbnailPath: String?
    let isThumbnail: Bool
    let thumbnailMode: String?
}

struct Note: Codable, Identifiable {
    let id: Int
    let content: String
    let date: String
}

struct MaintenanceTask: Codable, Identifiable {
    let id: Int
    let label: String
    let dateCompleted: String
    let notes: String?
    let cost: Double?
}

struct Tag: Codable, Identifiable, Hashable {
    let id: Int
    let name: String
}

struct CustomFieldValue: Codable, Identifiable, Hashable {
    let id: Int
    let customFieldId: Int
    let customFieldName: String
    let value: String
    let isPublic: Bool
    let sortOrder: Int
}

struct CustomField: Codable, Identifiable, Hashable {
    let id: Int
    let name: String
    let isPublic: Bool
    let sortOrder: Int
}

struct Device: Codable, Identifiable, Hashable {
    static func == (lhs: Device, rhs: Device) -> Bool {
        lhs.id == rhs.id
    }
    
    func hash(into hasher: inout Hasher) {
        hasher.combine(id)
    }
    
    let id: Int
    let name: String
    let additionalName: String?
    let manufacturer: String?
    let modelNumber: String?
    let serialNumber: String?
    let releaseYear: Int?
    let location: String?
    let info: String?
    let searchText: String?
    let isFavorite: Bool

    let status: Status
    let functionalStatus: FunctionalStatus
    let condition: Condition?
    let rarity: Rarity?
    let lastPowerOnDate: String?
    let isAssetTagged: Bool

    let dateAcquired: String?
    let whereAcquired: String?
    let priceAcquired: Double?
    let estimatedValue: Double?

    let listPrice: Double?
    let soldPrice: Double?
    let soldDate: String?

    let cpu: String?
    let ram: String?
    let graphics: String?
    let storage: String?
    let operatingSystem: String?
    let isWifiEnabled: Bool?
    let isPramBatteryRemoved: Bool?

    let category: Category
    let images: [DeviceImage]
    let notes: [Note]
    let maintenanceTasks: [MaintenanceTask]
    let tags: [Tag]
    let customFieldValues: [CustomFieldValue]
    let accessories: [DeviceAccessory]
    let links: [DeviceLink]
    
    var displayName: String {
        if let additional = additionalName, !additional.isEmpty {
            return "\(name) (\(additional))"
        }
        return name
    }
    
    var thumbnailImage: DeviceImage? {
        images.first(where: { $0.isThumbnail && ($0.thumbnailMode == "BOTH" || $0.thumbnailMode == nil) })
            ?? images.first(where: { $0.isThumbnail })
            ?? images.first
    }

    func thumbnailImage(for colorScheme: ColorScheme) -> DeviceImage? {
        let mode = colorScheme == .dark ? "DARK" : "LIGHT"
        return images.first(where: { $0.isThumbnail && $0.thumbnailMode == mode })
            ?? images.first(where: { $0.isThumbnail && ($0.thumbnailMode == "BOTH" || $0.thumbnailMode == nil) })
            ?? images.first(where: { $0.isThumbnail })
            ?? images.first
    }
}

extension Device: DeviceRowPresentable {}

struct DeviceListItem: Codable, Identifiable, Hashable {
    let id: Int
    let name: String
    let additionalName: String?
    let manufacturer: String?
    let modelNumber: String?
    let serialNumber: String?
    let releaseYear: Int?
    let location: String?
    let searchText: String?
    let isFavorite: Bool

    let status: Status
    let functionalStatus: FunctionalStatus
    let condition: Condition?
    let rarity: Rarity?
    let lastPowerOnDate: String?
    let isAssetTagged: Bool
    let isPramBatteryRemoved: Bool?
    let accessories: [DeviceAccessory]

    let dateAcquired: String?
    let estimatedValue: Double?
    let listPrice: Double?
    let soldPrice: Double?
    let soldDate: String?

    let category: Category
    let thumbnails: [DeviceThumbnail]

    var thumbnailImage: DeviceThumbnail? {
        thumbnails.first(where: { $0.isThumbnail && ($0.thumbnailMode == "BOTH" || $0.thumbnailMode == nil) })
            ?? thumbnails.first(where: { $0.isThumbnail })
            ?? thumbnails.first
    }

    func thumbnailImage(for colorScheme: ColorScheme) -> DeviceThumbnail? {
        let mode = colorScheme == .dark ? "DARK" : "LIGHT"
        return thumbnails.first(where: { $0.isThumbnail && $0.thumbnailMode == mode })
            ?? thumbnails.first(where: { $0.isThumbnail && ($0.thumbnailMode == "BOTH" || $0.thumbnailMode == nil) })
            ?? thumbnails.first(where: { $0.isThumbnail })
            ?? thumbnails.first
    }
}

extension DeviceListItem: DeviceRowPresentable {}
