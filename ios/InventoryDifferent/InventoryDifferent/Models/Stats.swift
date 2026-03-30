//
//  Stats.swift
//  InventoryDifferent
//

import Foundation

struct StatsBucket: Codable, Identifiable {
    let label: String
    let count: Int
    var id: String { label }
}

struct CollectionStats: Codable {
    let byStatus: [StatsBucket]
    let byFunctionalStatus: [StatsBucket]
    let byCategoryType: [StatsBucket]
    let byAcquisitionYear: [StatsBucket]
    let byReleaseDecade: [StatsBucket]
    let topManufacturers: [StatsBucket]
    let byRarity: [StatsBucket]
    let totalDevices: Int
    let workingPercent: Double
    let avgEstimatedValue: Double
    let topCategoryType: String
}

struct CollectionStatsData: Codable {
    let collectionStats: CollectionStats
}
