//
//  TimelineEvent.swift
//  InventoryDifferent
//

import SwiftUI

struct TimelineEvent: Codable, Identifiable {
    let id: Int
    let year: Int
    let title: String
    let description: String
    let titleDe: String?
    let descriptionDe: String?
    let titleFr: String?
    let descriptionFr: String?
    let type: TimelineEventType
    let sortOrder: Int

    func localizedTitle(for language: String) -> String {
        switch language {
        case "de": return titleDe ?? title
        case "fr": return titleFr ?? title
        default: return title
        }
    }

    func localizedDescription(for language: String) -> String {
        switch language {
        case "de": return descriptionDe ?? description
        case "fr": return descriptionFr ?? description
        default: return description
        }
    }
}

enum TimelineEventType: String, Codable {
    case apple
    case tech
    case unknown

    init(from decoder: Decoder) throws {
        let value = try decoder.singleValueContainer().decode(String.self)
        self = TimelineEventType(rawValue: value) ?? .unknown
    }

    var color: Color {
        switch self {
        case .apple: return .blue
        case .tech: return .orange
        case .unknown: return .orange
        }
    }
}

struct TimelineEventsData: Codable {
    let timelineEvents: [TimelineEvent]
}
