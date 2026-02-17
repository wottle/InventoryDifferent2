//
//  LoginView.swift
//  InventoryDifferent
//
//  Login view for server connection and admin authentication.
//

import SwiftUI

struct LoginView: View {
    @EnvironmentObject var authService: AuthService
    @EnvironmentObject var appSettings: AppSettings
    @State private var serverURL: String = ""
    @State private var username: String = ""
    @State private var password: String = ""
    @State private var isSubmitting: Bool = false
    @State private var errorMessage: String?
    @State private var showPassword: Bool = false
    @State private var usernameRequired: Bool = false

    var body: some View {
        VStack(spacing: 32) {
            Spacer()

            // Logo and title
            VStack(spacing: 16) {
                Image("logo")
                    .resizable()
                    .scaledToFit()
                    .frame(width: 80, height: 80)

                Text("InventoryDifferent")
                    .font(.largeTitle)
                    .fontWeight(.bold)

                Text("Connect to Server")
                    .font(.title3)
                    .foregroundColor(.secondary)
            }

            Spacer()

            // Login form
            VStack(spacing: 16) {
                // Server URL field
                VStack(alignment: .leading, spacing: 4) {
                    Text("Server URL")
                        .font(.caption)
                        .foregroundColor(.secondary)

                    TextField("https://inventorydifferent.com", text: $serverURL)
                        .textContentType(.URL)
                        .autocapitalization(.none)
                        .autocorrectionDisabled()
                        .keyboardType(.URL)
                        .padding()
                        .background(Color(.systemGray6))
                        .cornerRadius(12)
                }

                // Username field (shown when required)
                if usernameRequired {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("Username")
                            .font(.caption)
                            .foregroundColor(.secondary)

                        TextField("Username", text: $username)
                            .textContentType(.username)
                            .autocapitalization(.none)
                            .autocorrectionDisabled()
                            .padding()
                            .background(Color(.systemGray6))
                            .cornerRadius(12)
                    }
                }

                // Password field
                VStack(alignment: .leading, spacing: 4) {
                    Text(usernameRequired ? "Password" : "Password (optional for guest access)")
                        .font(.caption)
                        .foregroundColor(.secondary)

                    HStack {
                        if showPassword {
                            TextField("Password", text: $password)
                                .textContentType(.password)
                                .autocapitalization(.none)
                        } else {
                            SecureField("Password", text: $password)
                                .textContentType(.password)
                        }

                        Button(action: { showPassword.toggle() }) {
                            Image(systemName: showPassword ? "eye.slash.fill" : "eye.fill")
                                .foregroundColor(.secondary)
                        }
                    }
                    .padding()
                    .background(Color(.systemGray6))
                    .cornerRadius(12)
                }

                // Error message
                if let error = errorMessage {
                    Text(error)
                        .font(.footnote)
                        .foregroundColor(.red)
                        .multilineTextAlignment(.center)
                }

                // Connect button
                Button(action: connect) {
                    HStack {
                        if isSubmitting {
                            ProgressView()
                                .progressViewStyle(CircularProgressViewStyle(tint: .white))
                                .scaleEffect(0.8)
                        }
                        Text(isSubmitting ? "Connecting..." : "Connect")
                            .fontWeight(.semibold)
                    }
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(serverURL.isEmpty ? Color.blue.opacity(0.5) : Color.blue)
                    .foregroundColor(.white)
                    .cornerRadius(12)
                }
                .disabled(serverURL.isEmpty || isSubmitting)

                // Info text
                if !usernameRequired {
                    Text("Leave password blank to browse as guest (view only)")
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .multilineTextAlignment(.center)
                        .padding(.top, 8)
                }
            }
            .padding(.horizontal, 32)

            Spacer()
            Spacer()
        }
        .padding()
        .onAppear {
            // Default to saved URL or the default
            serverURL = appSettings.serverURL.isEmpty ? "https://inventorydifferent.com" : appSettings.serverURL
        }
    }

    private func connect() {
        guard !serverURL.isEmpty else { return }

        isSubmitting = true
        errorMessage = nil

        // Normalize URL - remove trailing slash
        var url = serverURL.trimmingCharacters(in: .whitespacesAndNewlines)
        if url.hasSuffix("/") {
            url = String(url.dropLast())
        }

        Task {
            // First, update the API service with the new URL
            APIService.shared.updateBaseURL(url)

            // Test connection
            do {
                let connected = try await testConnection()
                if !connected {
                    await MainActor.run {
                        errorMessage = "Could not connect to server"
                        isSubmitting = false
                    }
                    return
                }
            } catch {
                await MainActor.run {
                    errorMessage = "Connection failed: \(error.localizedDescription)"
                    isSubmitting = false
                }
                return
            }

            // Connection successful, save the server URL
            await MainActor.run {
                appSettings.configure(serverURL: url)
            }

            // Check if username is required
            let serverUsernameRequired = await checkUsernameRequired()
            await MainActor.run {
                usernameRequired = serverUsernameRequired
            }

            // If username is required but not provided, stop here and show the form
            if serverUsernameRequired && username.isEmpty {
                await MainActor.run {
                    isSubmitting = false
                }
                return
            }

            // Now try to login if password was provided (or username is required)
            if !password.isEmpty || serverUsernameRequired {
                let result = await authService.login(username: username.isEmpty ? nil : username, password: password)

                await MainActor.run {
                    isSubmitting = false

                    switch result {
                    case .success:
                        // AuthService will update isAuthenticated
                        break
                    case .failure(let error):
                        errorMessage = error.localizedDescription
                    }
                }
            } else {
                // No password - continue as guest
                await MainActor.run {
                    isSubmitting = false
                    authService.isAuthenticated = false
                    authService.authRequired = false
                }
            }
        }
    }

    private func testConnection() async throws -> Bool {
        // Use the public /auth/status endpoint to test connection
        let baseURL = APIService.shared.getBaseURL()
        guard let url = URL(string: "\(baseURL)/auth/status") else {
            return false
        }

        let (_, response) = try await URLSession.shared.data(from: url)

        guard let httpResponse = response as? HTTPURLResponse else {
            return false
        }

        // Any 2xx response means the server is reachable
        return (200...299).contains(httpResponse.statusCode)
    }

    private func checkUsernameRequired() async -> Bool {
        let baseURL = APIService.shared.getBaseURL()
        guard let url = URL(string: "\(baseURL)/auth/status") else {
            return false
        }

        do {
            let (data, _) = try await URLSession.shared.data(from: url)
            if let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] {
                return json["usernameRequired"] as? Bool ?? false
            }
        } catch {
            // Assume no username required if we can't reach the server
        }
        return false
    }
}

#Preview {
    LoginView()
        .environmentObject(AuthService.shared)
        .environmentObject(AppSettings.shared)
}
