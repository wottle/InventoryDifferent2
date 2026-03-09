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
    let type: TimelineEventType
    let sortOrder: Int
}

enum TimelineEventType: String, Codable {
    case apple
    case tech
    case cultural

    var color: Color {
        switch self {
        case .apple: return .blue
        case .tech: return .orange
        case .cultural: return .purple
        }
    }
}

struct TimelineEventsData: Codable {
    let timelineEvents: [TimelineEvent]
}
