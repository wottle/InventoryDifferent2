//
//  APIService.swift
//  InventoryDifferent
//
//  Created by Michael Wottle on 2/2/26.
//

import Foundation

class APIService {
    static let shared = APIService()
    
    private var baseURL: String
    
    private init() {
        // Load from UserDefaults or use default
        self.baseURL = UserDefaults.standard.string(forKey: "serverURL") ?? ""
    }
    
    func updateBaseURL(_ url: String) {
        self.baseURL = url
    }
    
    func getBaseURL() -> String {
        return baseURL
    }
    
    func imageURL(for path: String) -> URL? {
        guard !path.isEmpty else { return nil }
        let urlString = baseURL + path
        return URL(string: urlString)
    }
    
    func execute<T: Decodable>(query: String, variables: [String: Any]? = nil) async throws -> T {
        guard let url = URL(string: "\(baseURL)/graphql") else {
            throw APIError.invalidURL
        }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        // Add Authorization header if we have a token
        if let token = await AuthService.shared.getAccessToken() {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        let graphQLRequest = GraphQLRequest(query: query, variables: variables)
        request.httpBody = try JSONEncoder().encode(graphQLRequest)

        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }
        
        guard httpResponse.statusCode == 200 else {
            throw APIError.httpError(statusCode: httpResponse.statusCode)
        }
        
        let decoder = JSONDecoder()
        let graphQLResponse = try decoder.decode(GraphQLResponse<T>.self, from: data)
        
        if let errors = graphQLResponse.errors, !errors.isEmpty {
            throw APIError.graphQLError(errors.map { $0.message }.joined(separator: ", "))
        }
        
        guard let responseData = graphQLResponse.data else {
            throw APIError.noData
        }
        
        return responseData
    }
}

enum APIError: LocalizedError {
    case invalidURL
    case invalidResponse
    case httpError(statusCode: Int)
    case graphQLError(String)
    case noData
    
    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "Invalid URL"
        case .invalidResponse:
            return "Invalid response from server"
        case .httpError(let statusCode):
            return "HTTP error: \(statusCode)"
        case .graphQLError(let message):
            return "GraphQL error: \(message)"
        case .noData:
            return "No data received"
        }
    }
}
