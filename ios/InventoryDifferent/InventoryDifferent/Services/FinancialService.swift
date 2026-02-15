//
//  FinancialService.swift
//  InventoryDifferent
//
//  Created by Michael Wottle on 2/7/26.
//

import Foundation

class FinancialService {
    static let shared = FinancialService()
    
    private init() {}
    
    func fetchFinancials() async throws -> FinancialData {
        let query = """
        query GetFinancials {
          financialOverview {
            totalSpent
            totalReceived
            netCash
            estimatedValueOwned
            netPosition
            totalProfit
          }
          financialTransactions {
            type
            deviceId
            deviceName
            additionalName
            date
            amount
            estimatedValue
          }
        }
        """
        
        return try await APIService.shared.execute(query: query)
    }
}
