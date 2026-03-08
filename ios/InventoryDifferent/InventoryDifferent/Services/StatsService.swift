//
//  StatsService.swift
//  InventoryDifferent
//

import Foundation

class StatsService {
    static let shared = StatsService()

    private init() {}

    func fetchStats() async throws -> CollectionStatsData {
        let query = """
        query GetCollectionStats {
          collectionStats {
            byStatus { label count }
            byFunctionalStatus { label count }
            byCategoryType { label count }
            byAcquisitionYear { label count }
            byReleaseDecade { label count }
            topManufacturers { label count }
            totalDevices
            workingPercent
            avgEstimatedValue
            topCategoryType
          }
        }
        """

        return try await APIService.shared.execute(query: query)
    }
}
