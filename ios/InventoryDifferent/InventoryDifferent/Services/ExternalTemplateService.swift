//
//  ExternalTemplateService.swift
//  InventoryDifferent
//

import Foundation

struct ExternalTemplateImage: Codable {
    let url: String
    let type: String // "LIGHT" | "DARK"
}

struct ExternalTemplate: Codable, Identifiable {
    let id: String
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
    let rarity: String?
    let categoryId: Int?
    let images: [ExternalTemplateImage]?
    let status: String?
}

private struct ExternalTemplatesPage: Decodable {
    let templates: [ExternalTemplate]
    let nextCursor: String?
}

private struct ExternalSyncResponse: Decodable {
    let version: String
}

actor ExternalTemplateService {
    static let shared = ExternalTemplateService()

    private let apiBaseURL = "https://api.templates.inventorydifferent.com"
    private let cacheSchemaVersion = "4"
    private let cacheVersionKey   = "extTemplates_version"
    private let cacheSchemaKey    = "extTemplates_schema"
    private let cacheDateKey      = "extTemplates_cachedAt"
    private let cacheDataKey      = "extTemplates_cache"
    private let cacheTTL: TimeInterval = 3600 // 1 hour

    private var defaults: UserDefaults {
        UserDefaults(suiteName: AppSettings.appGroupSuite) ?? .standard
    }

    func loadTemplates() async -> [ExternalTemplate] {
        let cachedSchema = defaults.string(forKey: cacheSchemaKey)
        let cachedAt = defaults.double(forKey: cacheDateKey)
        let cacheAge = Date().timeIntervalSince1970 - cachedAt
        let existing = cachedTemplates()

        // If we have a non-expired, schema-valid cache, check remote version before using it
        if cachedSchema == cacheSchemaVersion, cacheAge < cacheTTL, let existing, !existing.isEmpty {
            if let remoteVersion = await fetchSyncVersion() {
                let cachedVersion = defaults.string(forKey: cacheVersionKey)
                if remoteVersion == cachedVersion {
                    return existing // Cache is current
                }
                // Version changed — fall through to re-fetch
            } else {
                // Sync check failed — return stale cache rather than blocking the user
                return existing
            }
        }

        // No cache, expired, or version changed — fetch fresh from remote
        return await fetchAndCache(fallback: existing ?? [])
    }

    private func fetchSyncVersion() async -> String? {
        guard let url = URL(string: "\(apiBaseURL)/sync"),
              let (data, _) = try? await URLSession.shared.data(from: url),
              let sync = try? JSONDecoder().decode(ExternalSyncResponse.self, from: data) else {
            return nil
        }
        return sync.version
    }

    private func fetchAndCache(fallback: [ExternalTemplate]) async -> [ExternalTemplate] {
        var all: [ExternalTemplate] = []
        var cursor: String? = nil
        var pageCount = 0

        repeat {
            var urlString = "\(apiBaseURL)/templates?sort=name&limit=200"
            if let c = cursor { urlString += "&cursor=\(c)" }
            guard let url = URL(string: urlString),
                  let (data, _) = try? await URLSession.shared.data(from: url),
                  let page = try? JSONDecoder().decode(ExternalTemplatesPage.self, from: data) else { break }

            let published = page.templates.filter { $0.status == nil || $0.status == "PUBLISHED" }
            all.append(contentsOf: published)
            cursor = page.nextCursor
            pageCount += 1
        } while cursor != nil && pageCount < 50

        guard !all.isEmpty else { return fallback }

        if let encoded = try? JSONEncoder().encode(all) {
            let version = await fetchSyncVersion() ?? UUID().uuidString
            defaults.set(version, forKey: cacheVersionKey)
            defaults.set(cacheSchemaVersion, forKey: cacheSchemaKey)
            defaults.set(Date().timeIntervalSince1970, forKey: cacheDateKey)
            defaults.set(encoded, forKey: cacheDataKey)
        }

        return all
    }

    private func cachedTemplates() -> [ExternalTemplate]? {
        guard let data = defaults.data(forKey: cacheDataKey),
              let templates = try? JSONDecoder().decode([ExternalTemplate].self, from: data) else {
            return nil
        }
        return templates
    }
}
