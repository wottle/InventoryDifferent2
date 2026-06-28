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
}
