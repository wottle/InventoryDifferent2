//
//  Device.swift
//  InventoryDifferent
//
//  Created by Michael Wottle on 2/2/26.
//

import Foundation
import SwiftUI

struct RelationshipDevice: Codable, Identifiable, Hashable {
    let id: Int
    let name: String
    let additionalName: String?
    let manufacturer: String?
    let status: Status
    let location: LocationRef?

    var displayName: String {
        if let additional = additionalName, !additional.isEmpty {
            return "\(name) (\(additional))"
        }
        return name
    }
}

struct DeviceRelationship: Codable, Identifiable, Hashable {
    let id: Int
    let type: String
    let fromDeviceId: Int?
    let toDeviceId: Int?
    let fromDevice: RelationshipDevice?
    let toDevice: RelationshipDevice?
}

struct DeviceAccessory: Codable, Identifiable, Hashable {
    let id: Int
    let name: String
}

struct DeviceStorageEntry: Codable, Identifiable, Hashable {
    let id: Int
    let value: String
    let sortOrder: Int
}

struct DeviceOSEntry: Codable, Identifiable, Hashable {
    let id: Int
    let value: String
    let sortOrder: Int
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
    var pramBatteryInstalled: Bool? { get }
    var pramBatteryExpiryDate: String? { get }
    var category: Category { get }
    var estimatedValue: Double? { get }
    var listPrice: Double? { get }
    var soldPrice: Double? { get }
}

extension DeviceRowPresentable {
    /// Parses an API date string (ISO8601 with/without fractional seconds, or date-only).
    var pramBatteryExpiry: Date? {
        guard let s = pramBatteryExpiryDate else { return nil }
        let iso = ISO8601DateFormatter()
        iso.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        if let d = iso.date(from: s) { return d }
        iso.formatOptions = [.withInternetDateTime]
        if let d = iso.date(from: s) { return d }
        let df = DateFormatter()
        df.locale = Locale(identifier: "en_US_POSIX")
        df.dateFormat = "yyyy-MM-dd"
        return df.date(from: s)
    }

    /// Red indicator only when a battery is installed with no expiry date on record,
    /// or an expiry date that is today or in the past. A missing battery is safe (green).
    var pramNeedsAttention: Bool {
        guard pramBatteryInstalled == true else { return false }
        guard let expiry = pramBatteryExpiry else { return true }
        return expiry <= Date()
    }
}

enum Status: String, Codable, CaseIterable {
    case COLLECTION
    case FOR_SALE
    case PENDING_SALE
    case IN_REPAIR
    case REPAIRED
    case LOANED
    case SOLD
    case DONATED
    case RETURNED
    case unknown

    init(from decoder: Decoder) throws {
        let raw = try decoder.singleValueContainer().decode(String.self)
        self = Status(rawValue: raw) ?? .unknown
    }

    var displayName: String {
        let t = LocalizationManager.shared.t
        switch self {
        case .COLLECTION: return t.status.COLLECTION
        case .FOR_SALE: return t.status.FOR_SALE
        case .PENDING_SALE: return t.status.PENDING_SALE
        case .SOLD: return t.status.SOLD
        case .DONATED: return t.status.DONATED
        case .IN_REPAIR: return t.status.IN_REPAIR
        case .REPAIRED: return t.status.REPAIRED
        case .RETURNED: return t.status.RETURNED
        case .LOANED: return t.status.LOANED
        case .unknown: return t.status.unknown
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
        case .REPAIRED: return "mint"
        case .RETURNED: return "gray"
        case .LOANED: return "violet"
        case .unknown: return "gray"
        }
    }
}

enum FunctionalStatus: String, Codable, CaseIterable {
    case YES
    case PARTIAL
    case NO
    case UNKNOWN

    var displayName: String {
        let t = LocalizationManager.shared.t
        switch self {
        case .YES: return t.functionalStatus.YES
        case .PARTIAL: return t.functionalStatus.PARTIAL
        case .NO: return t.functionalStatus.NO
        case .UNKNOWN: return t.functionalStatus.UNKNOWN
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
        let t = LocalizationManager.shared.t
        switch self {
        case .NEW: return t.condition.NEW
        case .LIKE_NEW: return t.condition.LIKE_NEW
        case .VERY_GOOD: return t.condition.VERY_GOOD
        case .GOOD: return t.condition.GOOD
        case .ACCEPTABLE: return t.condition.ACCEPTABLE
        case .FOR_PARTS: return t.condition.FOR_PARTS
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
        let t = LocalizationManager.shared.t
        switch self {
        case .COMMON: return t.rarity.COMMON
        case .UNCOMMON: return t.rarity.UNCOMMON
        case .RARE: return t.rarity.RARE
        case .VERY_RARE: return t.rarity.VERY_RARE
        case .EXTREMELY_RARE: return t.rarity.EXTREMELY_RARE
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

    static let unknown = Category(id: -1, name: "Unknown", type: "OTHER", sortOrder: Int.max)
}

struct LocationRef: Codable, Identifiable, Hashable {
    let id: Int
    let name: String
}

struct DeviceImage: Codable, Identifiable {
    let id: Int
    let path: String
    let thumbnailPath: String?
    let originalPath: String?
    let rotation: Int?
    let cropLeft: Double?
    let cropTop: Double?
    let cropWidth: Double?
    let cropHeight: Double?
    let dateTaken: String?
    let caption: String?
    let isShopImage: Bool
    let isThumbnail: Bool
    let thumbnailMode: String?
    let isListingImage: Bool
    let mediaType: String     // "IMAGE" or "VIDEO"
    let duration: Int?
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
    let location: LocationRef?
    let info: String?
    let historicalNotes: String?
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

    let cpuType: String?
    let cpuSpeed: String?
    let ram: String?
    let graphicsChip: String?
    let screenSize: String?
    let displayType: String?
    let displayVariant: String?
    let nativeResolution: String?
    let isWifiEnabled: Bool?
    let isRetroBrited: Bool?
    let isRecapped: Bool?
    let pramBatteryInstalled: Bool?
    let pramBatteryExpiryDate: String?
    let storageEntries: [DeviceStorageEntry]
    let osEntries: [DeviceOSEntry]

    let category: Category
    let images: [DeviceImage]
    let notes: [Note]
    let maintenanceTasks: [MaintenanceTask]
    let tags: [Tag]
    let customFieldValues: [CustomFieldValue]
    let accessories: [DeviceAccessory]
    let links: [DeviceLink]
    let relationsFrom: [DeviceRelationship]?
    let relationsTo: [DeviceRelationship]?

    enum CodingKeys: String, CodingKey {
        case id, name, additionalName, manufacturer, modelNumber, serialNumber
        case releaseYear, location, info, historicalNotes, searchText, isFavorite
        case status, functionalStatus, condition, rarity
        case lastPowerOnDate, isAssetTagged
        case dateAcquired, whereAcquired, priceAcquired, estimatedValue
        case listPrice, soldPrice, soldDate
        case cpuType, cpuSpeed, ram, graphicsChip, screenSize, displayType
        case displayVariant, nativeResolution, isWifiEnabled, isRetroBrited, isRecapped
        case pramBatteryInstalled, pramBatteryExpiryDate
        case storageEntries, osEntries
        case category, images, notes, maintenanceTasks, tags, customFieldValues
        case accessories, links, relationsFrom, relationsTo
    }

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

extension Device {
    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        id = try c.decode(Int.self, forKey: .id)
        name = try c.decode(String.self, forKey: .name)
        isFavorite = (try? c.decode(Bool.self, forKey: .isFavorite)) ?? false
        isAssetTagged = (try? c.decode(Bool.self, forKey: .isAssetTagged)) ?? false
        status = (try? c.decode(Status.self, forKey: .status)) ?? .unknown
        functionalStatus = (try? c.decode(FunctionalStatus.self, forKey: .functionalStatus)) ?? .UNKNOWN
        condition = (try? c.decodeIfPresent(Condition.self, forKey: .condition)) ?? nil
        rarity = (try? c.decodeIfPresent(Rarity.self, forKey: .rarity)) ?? nil
        additionalName = try? c.decodeIfPresent(String.self, forKey: .additionalName)
        manufacturer = try? c.decodeIfPresent(String.self, forKey: .manufacturer)
        modelNumber = try? c.decodeIfPresent(String.self, forKey: .modelNumber)
        serialNumber = try? c.decodeIfPresent(String.self, forKey: .serialNumber)
        releaseYear = try? c.decodeIfPresent(Int.self, forKey: .releaseYear)
        location = try? c.decodeIfPresent(LocationRef.self, forKey: .location)
        info = try? c.decodeIfPresent(String.self, forKey: .info)
        historicalNotes = try? c.decodeIfPresent(String.self, forKey: .historicalNotes)
        searchText = try? c.decodeIfPresent(String.self, forKey: .searchText)
        lastPowerOnDate = try? c.decodeIfPresent(String.self, forKey: .lastPowerOnDate)
        dateAcquired = try? c.decodeIfPresent(String.self, forKey: .dateAcquired)
        whereAcquired = try? c.decodeIfPresent(String.self, forKey: .whereAcquired)
        priceAcquired = try? c.decodeIfPresent(Double.self, forKey: .priceAcquired)
        estimatedValue = try? c.decodeIfPresent(Double.self, forKey: .estimatedValue)
        listPrice = try? c.decodeIfPresent(Double.self, forKey: .listPrice)
        soldPrice = try? c.decodeIfPresent(Double.self, forKey: .soldPrice)
        soldDate = try? c.decodeIfPresent(String.self, forKey: .soldDate)
        cpuType = try? c.decodeIfPresent(String.self, forKey: .cpuType)
        cpuSpeed = try? c.decodeIfPresent(String.self, forKey: .cpuSpeed)
        ram = try? c.decodeIfPresent(String.self, forKey: .ram)
        graphicsChip = try? c.decodeIfPresent(String.self, forKey: .graphicsChip)
        screenSize = try? c.decodeIfPresent(String.self, forKey: .screenSize)
        displayType = try? c.decodeIfPresent(String.self, forKey: .displayType)
        displayVariant = try? c.decodeIfPresent(String.self, forKey: .displayVariant)
        nativeResolution = try? c.decodeIfPresent(String.self, forKey: .nativeResolution)
        isWifiEnabled = try? c.decodeIfPresent(Bool.self, forKey: .isWifiEnabled)
        isRetroBrited = try? c.decodeIfPresent(Bool.self, forKey: .isRetroBrited)
        isRecapped = try? c.decodeIfPresent(Bool.self, forKey: .isRecapped)
        pramBatteryInstalled = try? c.decodeIfPresent(Bool.self, forKey: .pramBatteryInstalled)
        pramBatteryExpiryDate = try? c.decodeIfPresent(String.self, forKey: .pramBatteryExpiryDate)
        category = (try? c.decodeIfPresent(Category.self, forKey: .category)) ?? .unknown
        storageEntries = (try? c.decodeIfPresent([DeviceStorageEntry].self, forKey: .storageEntries)) ?? []
        osEntries = (try? c.decodeIfPresent([DeviceOSEntry].self, forKey: .osEntries)) ?? []
        images = (try? c.decodeIfPresent([DeviceImage].self, forKey: .images)) ?? []
        notes = (try? c.decodeIfPresent([Note].self, forKey: .notes)) ?? []
        maintenanceTasks = (try? c.decodeIfPresent([MaintenanceTask].self, forKey: .maintenanceTasks)) ?? []
        tags = (try? c.decodeIfPresent([Tag].self, forKey: .tags)) ?? []
        customFieldValues = (try? c.decodeIfPresent([CustomFieldValue].self, forKey: .customFieldValues)) ?? []
        accessories = (try? c.decodeIfPresent([DeviceAccessory].self, forKey: .accessories)) ?? []
        links = (try? c.decodeIfPresent([DeviceLink].self, forKey: .links)) ?? []
        relationsFrom = try? c.decodeIfPresent([DeviceRelationship].self, forKey: .relationsFrom)
        relationsTo = try? c.decodeIfPresent([DeviceRelationship].self, forKey: .relationsTo)
    }
}

struct DeviceListItem: Codable, Identifiable, Hashable {
    let id: Int
    let name: String
    let additionalName: String?
    let manufacturer: String?
    let modelNumber: String?
    let serialNumber: String?
    let releaseYear: Int?
    let location: LocationRef?
    let searchText: String?
    let isFavorite: Bool

    let status: Status
    let functionalStatus: FunctionalStatus
    let condition: Condition?
    let rarity: Rarity?
    let lastPowerOnDate: String?
    let isAssetTagged: Bool
    let pramBatteryInstalled: Bool?
    let pramBatteryExpiryDate: String?
    let accessories: [DeviceAccessory]

    let dateAcquired: String?
    let estimatedValue: Double?
    let listPrice: Double?
    let soldPrice: Double?
    let soldDate: String?

    let category: Category
    let thumbnails: [DeviceThumbnail]

    enum CodingKeys: String, CodingKey {
        case id, name, additionalName, manufacturer, modelNumber, serialNumber
        case releaseYear, location, searchText, isFavorite
        case status, functionalStatus, condition, rarity
        case lastPowerOnDate, isAssetTagged, pramBatteryInstalled, pramBatteryExpiryDate
        case accessories
        case dateAcquired, estimatedValue, listPrice, soldPrice, soldDate
        case category, thumbnails
    }

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

extension DeviceListItem {
    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        id = try c.decode(Int.self, forKey: .id)
        name = try c.decode(String.self, forKey: .name)
        isFavorite = (try? c.decode(Bool.self, forKey: .isFavorite)) ?? false
        isAssetTagged = (try? c.decode(Bool.self, forKey: .isAssetTagged)) ?? false
        status = (try? c.decode(Status.self, forKey: .status)) ?? .unknown
        functionalStatus = (try? c.decode(FunctionalStatus.self, forKey: .functionalStatus)) ?? .UNKNOWN
        condition = (try? c.decodeIfPresent(Condition.self, forKey: .condition)) ?? nil
        rarity = (try? c.decodeIfPresent(Rarity.self, forKey: .rarity)) ?? nil
        additionalName = try? c.decodeIfPresent(String.self, forKey: .additionalName)
        manufacturer = try? c.decodeIfPresent(String.self, forKey: .manufacturer)
        modelNumber = try? c.decodeIfPresent(String.self, forKey: .modelNumber)
        serialNumber = try? c.decodeIfPresent(String.self, forKey: .serialNumber)
        releaseYear = try? c.decodeIfPresent(Int.self, forKey: .releaseYear)
        location = try? c.decodeIfPresent(LocationRef.self, forKey: .location)
        searchText = try? c.decodeIfPresent(String.self, forKey: .searchText)
        lastPowerOnDate = try? c.decodeIfPresent(String.self, forKey: .lastPowerOnDate)
        pramBatteryInstalled = try? c.decodeIfPresent(Bool.self, forKey: .pramBatteryInstalled)
        pramBatteryExpiryDate = try? c.decodeIfPresent(String.self, forKey: .pramBatteryExpiryDate)
        dateAcquired = try? c.decodeIfPresent(String.self, forKey: .dateAcquired)
        estimatedValue = try? c.decodeIfPresent(Double.self, forKey: .estimatedValue)
        listPrice = try? c.decodeIfPresent(Double.self, forKey: .listPrice)
        soldPrice = try? c.decodeIfPresent(Double.self, forKey: .soldPrice)
        soldDate = try? c.decodeIfPresent(String.self, forKey: .soldDate)
        category = (try? c.decodeIfPresent(Category.self, forKey: .category)) ?? .unknown
        accessories = (try? c.decodeIfPresent([DeviceAccessory].self, forKey: .accessories)) ?? []
        thumbnails = (try? c.decodeIfPresent([DeviceThumbnail].self, forKey: .thumbnails)) ?? []
    }
}
