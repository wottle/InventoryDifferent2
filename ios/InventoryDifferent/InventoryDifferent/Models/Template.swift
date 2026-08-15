//
//  Template.swift
//  InventoryDifferent
//
//  Created by Michael Wottle on 2/3/26.
//

import Foundation

struct Template: Identifiable, Decodable {
    let id: Int
    let name: String
    let additionalName: String?
    let manufacturer: String?
    let modelNumber: String?
    let releaseYear: Int?
    let estimatedValue: Double?
    let cpuType: String?
    let cpuSpeed: String?
    let ram: String?
    let graphicsChip: String?
    let screenSize: String?
    let displayType: String?
    let displayVariant: String?
    let nativeResolution: String?
    let storage: String?
    let operatingSystem: String?
    let externalUrl: String?
    let externalLinkLabel: String?
    let isWifiEnabled: Bool?
    let rarity: Rarity?
    let isSeeded: Bool?
    let categoryId: Int
    let category: Category

    enum CodingKeys: String, CodingKey {
        case id, name, additionalName, manufacturer, modelNumber, releaseYear
        case estimatedValue, cpuType, cpuSpeed, ram, graphicsChip, screenSize
        case displayType, displayVariant, nativeResolution, storage, operatingSystem
        case externalUrl, externalLinkLabel, isWifiEnabled, rarity, isSeeded
        case categoryId, category
    }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        id                = try c.decode(Int.self, forKey: .id)
        name              = try c.decode(String.self, forKey: .name)
        categoryId        = (try? c.decode(Int.self, forKey: .categoryId)) ?? -1
        additionalName    = try? c.decodeIfPresent(String.self, forKey: .additionalName)
        manufacturer      = try? c.decodeIfPresent(String.self, forKey: .manufacturer)
        modelNumber       = try? c.decodeIfPresent(String.self, forKey: .modelNumber)
        releaseYear       = try? c.decodeIfPresent(Int.self, forKey: .releaseYear)
        estimatedValue    = try? c.decodeIfPresent(Double.self, forKey: .estimatedValue)
        cpuType           = try? c.decodeIfPresent(String.self, forKey: .cpuType)
        cpuSpeed          = try? c.decodeIfPresent(String.self, forKey: .cpuSpeed)
        ram               = try? c.decodeIfPresent(String.self, forKey: .ram)
        graphicsChip      = try? c.decodeIfPresent(String.self, forKey: .graphicsChip)
        screenSize        = try? c.decodeIfPresent(String.self, forKey: .screenSize)
        displayType       = try? c.decodeIfPresent(String.self, forKey: .displayType)
        displayVariant    = try? c.decodeIfPresent(String.self, forKey: .displayVariant)
        nativeResolution  = try? c.decodeIfPresent(String.self, forKey: .nativeResolution)
        storage           = try? c.decodeIfPresent(String.self, forKey: .storage)
        operatingSystem   = try? c.decodeIfPresent(String.self, forKey: .operatingSystem)
        externalUrl       = try? c.decodeIfPresent(String.self, forKey: .externalUrl)
        externalLinkLabel = try? c.decodeIfPresent(String.self, forKey: .externalLinkLabel)
        isWifiEnabled     = try? c.decodeIfPresent(Bool.self, forKey: .isWifiEnabled)
        isSeeded          = try? c.decodeIfPresent(Bool.self, forKey: .isSeeded)
        rarity            = (try? c.decodeIfPresent(Rarity.self, forKey: .rarity)) ?? nil
        category          = (try? c.decodeIfPresent(Category.self, forKey: .category)) ?? .unknown
    }
}
