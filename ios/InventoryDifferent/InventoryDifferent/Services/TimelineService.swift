//
//  TimelineService.swift
//  InventoryDifferent
//

import Foundation

class TimelineService {
    static let shared = TimelineService()

    private init() {}

    func fetchEvents() async throws -> TimelineEventsData {
        let query = """
        query GetTimelineEvents {
          timelineEvents {
            id
            year
            title
            description
            titleDe
            descriptionDe
            titleFr
            descriptionFr
            type
            sortOrder
          }
        }
        """

        return try await APIService.shared.execute(query: query)
    }
}
