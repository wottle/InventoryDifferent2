//
//  LocationService.swift
//  InventoryDifferent
//

import Foundation

class LocationService {
    static let shared = LocationService()

    func createLocation(name: String) async throws -> LocationRef {
        let mutation = """
        mutation CreateLocation($name: String!) {
            createLocation(name: $name) {
                id
                name
            }
        }
        """
        struct Response: Decodable {
            let createLocation: LocationRef
        }
        let response: Response = try await APIService.shared.execute(query: mutation, variables: ["name": name])
        return response.createLocation
    }

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
