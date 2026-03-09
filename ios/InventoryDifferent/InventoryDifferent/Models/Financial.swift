//
//  Financial.swift
//  InventoryDifferent
//
//  Created by Michael Wottle on 2/7/26.
//

import Foundation

struct FinancialOverview: Codable {
    let totalSpent: Double
    let totalReceived: Double
    let netCash: Double
    let estimatedValueOwned: Double
    let netPosition: Double
    let totalProfit: Double
    let totalMaintenanceCost: Double
}

struct FinancialTransaction: Codable, Identifiable {
    let type: String
    let deviceId: Int
    let deviceName: String
    let additionalName: String?
    let date: String?
    let amount: Double?
    let estimatedValue: Double?
    
    var id: String {
        "\(type)-\(deviceId)-\(date ?? "nodate")-\(amount ?? 0)-\(estimatedValue ?? 0)"
    }
}

struct FinancialData: Codable {
    let financialOverview: FinancialOverview
    let financialTransactions: [FinancialTransaction]
}
