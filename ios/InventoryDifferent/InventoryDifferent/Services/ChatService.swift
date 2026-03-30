//
//  ChatService.swift
//  InventoryDifferent
//
//  Created by Michael Wottle on 2/7/26.
//

import Foundation

struct ChatMessagePayload: Codable {
    let role: String
    let content: String
}

class ChatService {
    static let shared = ChatService()

    private init() {}

    func sendMessage(history: [ChatMessage]) async throws -> String {
        guard let url = URL(string: "\(APIService.shared.getBaseURL())/api/chat/simple") else {
            throw APIError.invalidURL
        }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        if let token = await AuthService.shared.getAccessToken() {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        let payload = history.map { msg in
            ChatMessagePayload(role: msg.isUser ? "user" : "assistant", content: msg.content)
        }
        request.httpBody = try JSONEncoder().encode(["messages": payload])

        let (data, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }

        guard httpResponse.statusCode == 200 else {
            throw APIError.httpError(statusCode: httpResponse.statusCode)
        }

        let chatResponse = try JSONDecoder().decode(ChatResponse.self, from: data)
        return chatResponse.response
    }
}

struct ChatResponse: Codable {
    let response: String
}
