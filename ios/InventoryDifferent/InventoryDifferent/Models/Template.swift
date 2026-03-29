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
    let cpu: String?
    let ram: String?
    let graphics: String?
    let storage: String?
    let operatingSystem: String?
    let externalUrl: String?
    let isWifiEnabled: Bool?
    let isPramBatteryRemoved: Bool?
    let rarity: Rarity?
    let categoryId: Int
    let category: Category
}
