//
//  Device.swift
//  InventoryDifferent
//
//  Created by Michael Wottle on 2/2/26.
//

import Foundation

protocol DeviceRowPresentable {
    var id: Int { get }
    var status: Status { get }
    var functionalStatus: FunctionalStatus { get }
    var isAssetTagged: Bool { get }
    var hasOriginalBox: Bool { get }
    var isFavorite: Bool { get }
    var isPramBatteryRemoved: Bool? { get }
    var category: Category { get }
    var estimatedValue: Double? { get }
    var listPrice: Double? { get }
    var soldPrice: Double? { get }
}

enum Status: String, Codable, CaseIterable {
    case AVAILABLE
    case FOR_SALE
    case PENDING_SALE
    case SOLD
    case DONATED
    
    var displayName: String {
        switch self {
        case .AVAILABLE: return "Available"
        case .FOR_SALE: return "For Sale"
        case .PENDING_SALE: return "Pending"
        case .SOLD: return "Sold"
        case .DONATED: return "Donated"
        }
    }
    
    var color: String {
        switch self {
        case .AVAILABLE: return "green"
        case .FOR_SALE: return "blue"
        case .PENDING_SALE: return "orange"
        case .SOLD: return "gray"
        case .DONATED: return "purple"
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
    let isListingImage: Bool
}

struct DeviceThumbnail: Codable, Identifiable, Hashable {
    let id: Int
    let path: String
    let thumbnailPath: String?
    let isThumbnail: Bool
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
    let lastPowerOnDate: String?
    let hasOriginalBox: Bool
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
    
    let externalUrl: String?
    
    let category: Category
    let images: [DeviceImage]
    let notes: [Note]
    let maintenanceTasks: [MaintenanceTask]
    let tags: [Tag]
    let customFieldValues: [CustomFieldValue]
    
    var displayName: String {
        if let additional = additionalName, !additional.isEmpty {
            return "\(name) (\(additional))"
        }
        return name
    }
    
    var thumbnailImage: DeviceImage? {
        images.first(where: { $0.isThumbnail }) ?? images.first
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
    let lastPowerOnDate: String?
    let hasOriginalBox: Bool
    let isAssetTagged: Bool
    let isPramBatteryRemoved: Bool?

    let dateAcquired: String?
    let estimatedValue: Double?
    let listPrice: Double?
    let soldPrice: Double?
    let soldDate: String?

    let category: Category
    let thumbnails: [DeviceThumbnail]

    var thumbnailImage: DeviceThumbnail? {
        thumbnails.first(where: { $0.isThumbnail }) ?? thumbnails.first
    }
}

extension DeviceListItem: DeviceRowPresentable {}
