//
//  LocationService.swift
//  InventoryDifferent
//

import Foundation

class LocationService {
    static let shared = LocationService()

    func fetchLocations() async throws -> [LocationRef] {
        let query = """
        query {
            locations {
                id
                name
            }
        }
        """
        struct Response: Decodable {
            let locations: [LocationRef]
        }
        let response: Response = try await APIService.shared.execute(query: query, variables: [:])
        return response.locations
    }
}
