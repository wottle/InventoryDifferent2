//
//  ChatService.swift
//  InventoryDifferent
//
//  Created by Michael Wottle on 2/7/26.
//

import Foundation

class ChatService {
    static let shared = ChatService()
    
    private init() {}
    
    func sendMessage(_ message: String) async throws -> String {
        guard let url = URL(string: "\(APIService.shared.getBaseURL())/api/chat/simple") else {
            throw APIError.invalidURL
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        if let token = await AuthService.shared.getAccessToken() {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        let body = ["message": message]
        request.httpBody = try JSONEncoder().encode(body)
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }
        
        guard httpResponse.statusCode == 200 else {
            throw APIError.httpError(statusCode: httpResponse.statusCode)
        }
        
        let decoder = JSONDecoder()
        let chatResponse = try decoder.decode(ChatResponse.self, from: data)
        
        return chatResponse.response
    }
}

struct ChatResponse: Codable {
    let response: String
}
