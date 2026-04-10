//
//  DeviceStore.swift
//  InventoryDifferent
//
//  Created by Michael Wottle on 2/2/26.
//

import Foundation
import Combine

enum SortOption: String, CaseIterable {
    case name = "Name"
    case category = "Category"
    case dateAcquired = "Date Acquired"
    case manufacturer = "Manufacturer"
    case releaseYear = "Release Year"
    case status = "Status"
    case condition = "Condition"
    case rarity = "Rarity"
}

enum SortDirection: String, CaseIterable {
    case ascending = "Ascending"
    case descending = "Descending"
}

extension ComparisonResult {
    var reversed: ComparisonResult {
        switch self {
        case .orderedAscending: return .orderedDescending
        case .orderedDescending: return .orderedAscending
        case .orderedSame: return .orderedSame
        }
    }
}

@MainActor
class DeviceStore: ObservableObject {
    @Published var devices: [DeviceListItem] = []
    @Published var categories: [Category] = []
    @Published var isLoading = false
    @Published var error: String?
    
    // Filtering - persisted
    @Published var searchText = ""
    @Published var selectedCategoryId: Int? {
        didSet { UserDefaults.standard.set(selectedCategoryId, forKey: "selectedCategoryId") }
    }
    @Published var selectedStatuses: Set<Status> {
        didSet { 
            let rawValues = selectedStatuses.map { $0.rawValue }
            UserDefaults.standard.set(rawValues, forKey: "selectedStatuses")
        }
    }
    @Published var showFavoritesOnly: Bool {
        didSet { UserDefaults.standard.set(showFavoritesOnly, forKey: "showFavoritesOnly") }
    }
    
    // Sorting - persisted
    @Published var sortOption: SortOption {
        didSet { UserDefaults.standard.set(sortOption.rawValue, forKey: "sortOption") }
    }
    @Published var sortDirection: SortDirection {
        didSet { UserDefaults.standard.set(sortDirection.rawValue, forKey: "sortDirection") }
    }
    
    private let deviceService = DeviceService.shared
    
    init() {
        // Load persisted filter settings
        if let categoryId = UserDefaults.standard.object(forKey: "selectedCategoryId") as? Int {
            self.selectedCategoryId = categoryId
        } else {
            self.selectedCategoryId = nil
        }
        
        if let statusRawValues = UserDefaults.standard.array(forKey: "selectedStatuses") as? [String] {
            self.selectedStatuses = Set(statusRawValues.compactMap { Status(rawValue: $0) })
        } else {
            self.selectedStatuses = []
        }
        
        self.showFavoritesOnly = UserDefaults.standard.bool(forKey: "showFavoritesOnly")
        
        // Load persisted sort settings (default to category ascending)
        if let sortRaw = UserDefaults.standard.string(forKey: "sortOption"),
           let sort = SortOption(rawValue: sortRaw) {
            self.sortOption = sort
        } else {
            self.sortOption = .category
        }
        
        if let directionRaw = UserDefaults.standard.string(forKey: "sortDirection"),
           let direction = SortDirection(rawValue: directionRaw) {
            self.sortDirection = direction
        } else {
            self.sortDirection = .ascending
        }
    }
    
    var filteredDevices: [DeviceListItem] {
        var result = devices
        
        // Filter by search text
        if !searchText.isEmpty {
            let searchLower = searchText.lowercased()
            result = result.filter { device in
                device.name.lowercased().contains(searchLower) ||
                (device.additionalName?.lowercased().contains(searchLower) ?? false) ||
                (device.manufacturer?.lowercased().contains(searchLower) ?? false) ||
                (device.modelNumber?.lowercased().contains(searchLower) ?? false) ||
                (device.serialNumber?.lowercased().contains(searchLower) ?? false) ||
                (device.searchText?.lowercased().contains(searchLower) ?? false) ||
                device.category.name.lowercased().contains(searchLower)
            }
        }
        
        // Filter by category
        if let categoryId = selectedCategoryId {
            result = result.filter { $0.category.id == categoryId }
        }
        
        // Filter by status (multi-select)
        if !selectedStatuses.isEmpty {
            result = result.filter { selectedStatuses.contains($0.status) }
        }
        
        // Filter by favorites
        if showFavoritesOnly {
            result = result.filter { $0.isFavorite }
        }
        
        // Sort: primary sort column, then category, release year, name, additional name
        result.sort { a, b in
            // Primary sort based on selected option
            let primaryComparison: ComparisonResult
            switch sortOption {
            case .name:
                primaryComparison = a.name.localizedCaseInsensitiveCompare(b.name)
            case .category:
                let aSortOrder = a.category.sortOrder
                let bSortOrder = b.category.sortOrder
                if aSortOrder != bSortOrder {
                    primaryComparison = aSortOrder < bSortOrder ? .orderedAscending : .orderedDescending
                } else {
                    primaryComparison = .orderedSame
                }
            case .dateAcquired:
                let aDate = a.dateAcquired ?? ""
                let bDate = b.dateAcquired ?? ""
                primaryComparison = aDate.compare(bDate)
            case .manufacturer:
                let aMfr = a.manufacturer ?? ""
                let bMfr = b.manufacturer ?? ""
                primaryComparison = aMfr.localizedCaseInsensitiveCompare(bMfr)
            case .releaseYear:
                let aYear = a.releaseYear ?? 0
                let bYear = b.releaseYear ?? 0
                if aYear != bYear {
                    primaryComparison = aYear < bYear ? .orderedAscending : .orderedDescending
                } else {
                    primaryComparison = .orderedSame
                }
            case .status:
                func statusRank(_ s: Status) -> Int {
                    switch s {
                    case .COLLECTION: return 0
                    case .FOR_SALE: return 1
                    case .PENDING_SALE: return 2
                    case .IN_REPAIR: return 3
                    case .REPAIRED: return 4
                    case .RETURNED: return 5
                    case .SOLD: return 6
                    case .DONATED: return 7
                    }
                }
                let aRank = statusRank(a.status)
                let bRank = statusRank(b.status)
                if aRank != bRank {
                    primaryComparison = aRank < bRank ? .orderedAscending : .orderedDescending
                } else {
                    primaryComparison = .orderedSame
                }
            case .condition:
                func conditionRank(_ c: Condition?) -> Int {
                    switch c {
                    case .NEW: return 0
                    case .LIKE_NEW: return 1
                    case .VERY_GOOD: return 2
                    case .GOOD: return 3
                    case .ACCEPTABLE: return 4
                    case .FOR_PARTS: return 5
                    case nil: return 99
                    }
                }
                let aRank = conditionRank(a.condition)
                let bRank = conditionRank(b.condition)
                if aRank != bRank {
                    primaryComparison = aRank < bRank ? .orderedAscending : .orderedDescending
                } else {
                    primaryComparison = .orderedSame
                }
            case .rarity:
                func rarityRank(_ r: Rarity?) -> Int {
                    switch r {
                    case .EXTREMELY_RARE: return 0
                    case .VERY_RARE: return 1
                    case .RARE: return 2
                    case .UNCOMMON: return 3
                    case .COMMON: return 4
                    case nil: return 99
                    }
                }
                let aRank = rarityRank(a.rarity)
                let bRank = rarityRank(b.rarity)
                if aRank != bRank {
                    primaryComparison = aRank < bRank ? .orderedAscending : .orderedDescending
                } else {
                    primaryComparison = .orderedSame
                }
            }
            
            // Apply sort direction to primary comparison
            let adjustedPrimary = sortDirection == .ascending ? primaryComparison : primaryComparison.reversed
            if adjustedPrimary != .orderedSame {
                return adjustedPrimary == .orderedAscending
            }
            
            // Secondary: category sort order (if not already sorting by category)
            if sortOption != .category {
                let catCompare = a.category.sortOrder - b.category.sortOrder
                if catCompare != 0 {
                    return catCompare < 0
                }
            }
            
            // Tertiary: release year (ascending - older first)
            let aYear = a.releaseYear ?? 0
            let bYear = b.releaseYear ?? 0
            if aYear != bYear {
                return aYear < bYear
            }
            
            // Quaternary: device name
            let nameCompare = a.name.localizedCaseInsensitiveCompare(b.name)
            if nameCompare != .orderedSame {
                return nameCompare == .orderedAscending
            }
            
            // Finally: additional name
            let aAdditional = a.additionalName ?? ""
            let bAdditional = b.additionalName ?? ""
            return aAdditional.localizedCaseInsensitiveCompare(bAdditional) == .orderedAscending
        }
        
        return result
    }
    
    func loadDevices() async {
        print("[DeviceStore] loadDevices() called")
        isLoading = true
        error = nil
        
        do {
            let fetchedDevices = try await Task.detached(priority: .userInitiated) {
                try await self.deviceService.fetchDeviceListItems()
            }.value
            print("[DeviceStore] Fetched \(fetchedDevices.count) devices")
            devices = fetchedDevices
            print("[DeviceStore] Updated devices array, first device: \(fetchedDevices.first?.name ?? "none")")

            // Sweep cache in background — delete any cached thumbnails no longer in the device list
            let activeURLs = Set(fetchedDevices.compactMap { device -> URL? in
                guard let thumbnail = device.thumbnailImage else { return nil }
                let path = thumbnail.thumbnailPath ?? thumbnail.path
                return APIService.shared.imageURL(for: path)
            })
            Task.detached(priority: .background) {
                await ImageCacheService.shared.sweepUnused(keeping: activeURLs)
            }
        } catch {
            print("[DeviceStore] Error loading devices: \(error)")
            self.error = error.localizedDescription
        }
        
        isLoading = false
        print("[DeviceStore] loadDevices() completed")
    }
    
    func loadCategories() async {
        do {
            let fetchedCategories = try await Task.detached(priority: .userInitiated) {
                try await self.deviceService.fetchCategories()
            }.value
            categories = fetchedCategories
        } catch {
            self.error = error.localizedDescription
        }
    }
    
    func refreshDevice(id: Int) async {
        // Intentionally left blank. Full device details are fetched on-demand in the detail screen.
    }
    
    func clearFilters() {
        searchText = ""
        selectedCategoryId = nil
        selectedStatuses = []
        showFavoritesOnly = false
    }
}
