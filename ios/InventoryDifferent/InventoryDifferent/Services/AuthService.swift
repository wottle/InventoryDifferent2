//
//  AuthService.swift
//  InventoryDifferent
//
//  Authentication service for managing JWT tokens and login state.
//

import Foundation
import Security
import Combine

@MainActor
class AuthService: ObservableObject {
    static let shared = AuthService()

    // Keychain keys
    private let accessTokenKey = "inv_access_token"
    private let refreshTokenKey = "inv_refresh_token"
    private let tokenExpiryKey = "inv_token_expiry"

    // Published state
    @Published var isAuthenticated: Bool = false
    @Published var authRequired: Bool = true
    @Published var usernameRequired: Bool = false
    @Published var isLoading: Bool = true

    // Token refresh buffer (5 minutes before expiry)
    private let refreshBufferSeconds: TimeInterval = 5 * 60

    private var refreshTask: Task<Void, Never>?

    private init() {
        // Check if we have a valid token on init
        Task {
            await checkAuthStatus()
        }
    }

    // MARK: - Public Methods

    func checkAuthStatus() async {
        isLoading = true
        defer { isLoading = false }

        let baseURL = APIService.shared.getBaseURL()

        // First check if auth is required
        do {
            let (data, _) = try await URLSession.shared.data(from: URL(string: "\(baseURL)/auth/status")!)
            if let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] {
                authRequired = json["authRequired"] as? Bool ?? true
                usernameRequired = json["usernameRequired"] as? Bool ?? false

                if !authRequired {
                    // Auth not required, everyone is authenticated
                    isAuthenticated = true
                    return
                }
            }
        } catch {
            // Assume auth required if we can't reach the server
            authRequired = true
            usernameRequired = false
        }

        // Check if we have a valid token
        if let accessToken = getAccessToken(), await validateToken(accessToken) {
            isAuthenticated = true
            startTokenRefreshTimer()
        } else {
            // Try to refresh if we have a refresh token
            if let refreshToken = getRefreshToken() {
                isAuthenticated = await refreshAccessToken(refreshToken)
                if isAuthenticated {
                    startTokenRefreshTimer()
                }
            }
        }
    }

    func login(username: String? = nil, password: String) async -> Result<Void, AuthError> {
        let baseURL = APIService.shared.getBaseURL()

        guard let url = URL(string: "\(baseURL)/auth/login") else {
            return .failure(.invalidURL)
        }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        var body: [String: String] = ["password": password]
        if let username = username, !username.isEmpty {
            body["username"] = username
        }
        request.httpBody = try? JSONSerialization.data(withJSONObject: body)

        do {
            let (data, response) = try await URLSession.shared.data(for: request)

            guard let httpResponse = response as? HTTPURLResponse else {
                return .failure(.invalidResponse)
            }

            if httpResponse.statusCode == 401 {
                return .failure(.invalidCredentials)
            }

            guard httpResponse.statusCode == 200 else {
                return .failure(.serverError(httpResponse.statusCode))
            }

            guard let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
                  let accessToken = json["accessToken"] as? String,
                  let refreshToken = json["refreshToken"] as? String,
                  let expiresIn = json["expiresIn"] as? Int else {
                return .failure(.invalidResponse)
            }

            // Store tokens
            let expiryDate = Date().addingTimeInterval(TimeInterval(expiresIn))
            storeTokens(accessToken: accessToken, refreshToken: refreshToken, expiry: expiryDate)

            isAuthenticated = true
            startTokenRefreshTimer()

            return .success(())
        } catch {
            return .failure(.networkError(error))
        }
    }

    func logout() {
        clearTokens()
        isAuthenticated = false
        refreshTask?.cancel()
        refreshTask = nil
    }

    func disconnect() {
        // Clear all auth state and tokens
        clearTokens()
        isAuthenticated = false
        authRequired = true
        isLoading = false
        refreshTask?.cancel()
        refreshTask = nil
    }

    func getAccessToken() -> String? {
        return getKeychainString(key: accessTokenKey)
    }

    // MARK: - Private Methods

    private func getRefreshToken() -> String? {
        return getKeychainString(key: refreshTokenKey)
    }

    private func getTokenExpiry() -> Date? {
        guard let expiryString = getKeychainString(key: tokenExpiryKey),
              let expiryInterval = TimeInterval(expiryString) else {
            return nil
        }
        return Date(timeIntervalSince1970: expiryInterval)
    }

    private func storeTokens(accessToken: String, refreshToken: String, expiry: Date) {
        setKeychainString(key: accessTokenKey, value: accessToken)
        setKeychainString(key: refreshTokenKey, value: refreshToken)
        setKeychainString(key: tokenExpiryKey, value: String(expiry.timeIntervalSince1970))
    }

    private func clearTokens() {
        deleteKeychainItem(key: accessTokenKey)
        deleteKeychainItem(key: refreshTokenKey)
        deleteKeychainItem(key: tokenExpiryKey)
    }

    private func validateToken(_ token: String) async -> Bool {
        // Check expiry time
        guard let expiry = getTokenExpiry() else { return false }

        // Token is valid if it hasn't expired
        return Date() < expiry
    }

    private func refreshAccessToken(_ refreshToken: String) async -> Bool {
        let baseURL = APIService.shared.getBaseURL()

        guard let url = URL(string: "\(baseURL)/auth/refresh") else {
            return false
        }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        let body = ["refreshToken": refreshToken]
        request.httpBody = try? JSONSerialization.data(withJSONObject: body)

        do {
            let (data, response) = try await URLSession.shared.data(for: request)

            guard let httpResponse = response as? HTTPURLResponse,
                  httpResponse.statusCode == 200,
                  let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
                  let accessToken = json["accessToken"] as? String,
                  let expiresIn = json["expiresIn"] as? Int else {
                return false
            }

            // Update access token and expiry
            let expiryDate = Date().addingTimeInterval(TimeInterval(expiresIn))
            setKeychainString(key: accessTokenKey, value: accessToken)
            setKeychainString(key: tokenExpiryKey, value: String(expiryDate.timeIntervalSince1970))

            // Store rolling refresh token if present
            if let newRefreshToken = json["refreshToken"] as? String {
                setKeychainString(key: refreshTokenKey, value: newRefreshToken)
            }

            return true
        } catch {
            return false
        }
    }

    private func startTokenRefreshTimer() {
        refreshTask?.cancel()

        guard let expiry = getTokenExpiry() else { return }

        let refreshTime = expiry.addingTimeInterval(-refreshBufferSeconds)
        let delay = max(0, refreshTime.timeIntervalSinceNow)

        refreshTask = Task {
            try? await Task.sleep(nanoseconds: UInt64(delay * 1_000_000_000))

            guard !Task.isCancelled else { return }

            if let refreshToken = getRefreshToken() {
                let success = await refreshAccessToken(refreshToken)
                if success {
                    startTokenRefreshTimer()
                } else {
                    isAuthenticated = false
                }
            }
        }
    }

    // MARK: - Keychain Helpers

    private func setKeychainString(key: String, value: String) {
        let data = value.data(using: .utf8)!

        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key,
            kSecAttrAccessible as String: kSecAttrAccessibleAfterFirstUnlock
        ]

        // Delete existing item first
        SecItemDelete(query as CFDictionary)

        // Add new item
        var newItem = query
        newItem[kSecValueData as String] = data

        SecItemAdd(newItem as CFDictionary, nil)
    }

    private func getKeychainString(key: String) -> String? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne
        ]

        var dataTypeRef: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &dataTypeRef)

        guard status == errSecSuccess,
              let data = dataTypeRef as? Data,
              let string = String(data: data, encoding: .utf8) else {
            return nil
        }

        return string
    }

    private func deleteKeychainItem(key: String) {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key
        ]

        SecItemDelete(query as CFDictionary)
    }
}

// MARK: - Auth Error

enum AuthError: LocalizedError {
    case invalidURL
    case invalidResponse
    case invalidCredentials
    case serverError(Int)
    case networkError(Error)

    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "Invalid server URL"
        case .invalidResponse:
            return "Invalid response from server"
        case .invalidCredentials:
            return "Invalid username or password"
        case .serverError(let code):
            return "Server error (\(code))"
        case .networkError(let error):
            return error.localizedDescription
        }
    }
}
