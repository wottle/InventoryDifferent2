//
//  SerialLookupService.swift
//  InventoryDifferent
//

import Foundation

struct SerialLookupParsed: Codable {
    let format: String
    let factory: String?
    let yearDigit: Int?
    let week: Int?
    let modelCode: String?
    let configCode: String?
    let manufactureYear: Int?
}

struct SerialLookupMatch: Codable {
    let templateId: Int
    let confidence: String
    let name: String
    let manufacturer: String?
    let releaseYear: Int?
    let introductionDate: String?
    let discontinuedDate: String?
    let manufactureYear: Int?
    let manufactureWeek: Int?
}

struct SerialLookupResult: Codable {
    let serial: String
    let parsed: SerialLookupParsed
    let matches: [SerialLookupMatch]
}

actor SerialLookupService {
    static let shared = SerialLookupService()

    private let apiBase = "https://api.templates.inventorydifferent.com"

    func lookup(serial: String) async -> SerialLookupResult? {
        // Use alphanumerics only — serial numbers are alphanumeric, and this prevents
        // path traversal if unexpected input reaches this function.
        let allowed = CharacterSet.alphanumerics
        let encoded = serial.addingPercentEncoding(withAllowedCharacters: allowed) ?? serial
        guard let url = URL(string: "\(apiBase)/serial-lookup/\(encoded)") else { return nil }
        guard let (data, response) = try? await URLSession.shared.data(from: url),
              (response as? HTTPURLResponse)?.statusCode == 200 else { return nil }
        return try? JSONDecoder().decode(SerialLookupResult.self, from: data)
    }
}
