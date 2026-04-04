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
    @EnvironmentObject var lm: LocalizationManager
    @State private var serverURL: String = ""
    @State private var username: String = ""
    @State private var password: String = ""
    @State private var isSubmitting: Bool = false
    @State private var errorMessage: String?
    @State private var showPassword: Bool = false

    var body: some View {
        let t = lm.t
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

                Text(t.login.connectTitle)
                    .font(.title3)
                    .foregroundColor(.secondary)
            }

            Spacer()

            // Login form
            VStack(spacing: 16) {
                // Server URL field
                VStack(alignment: .leading, spacing: 4) {
                    Text(t.login.serverURL)
                        .font(.caption)
                        .foregroundColor(.secondary)

                    TextField(t.login.serverURLPlaceholder, text: $serverURL)
                        .textContentType(.URL)
                        .autocapitalization(.none)
                        .autocorrectionDisabled()
                        .keyboardType(.URL)
                        .padding()
                        .background(Color(.systemGray6))
                        .cornerRadius(12)
                }

                // Username field (always shown)
                VStack(alignment: .leading, spacing: 4) {
                    Text(t.login.usernameOptional)
                        .font(.caption)
                        .foregroundColor(.secondary)

                    TextField(t.login.username, text: $username)
                        .textContentType(.username)
                        .autocapitalization(.none)
                        .autocorrectionDisabled()
                        .padding()
                        .background(Color(.systemGray6))
                        .cornerRadius(12)
                }

                // Password field
                VStack(alignment: .leading, spacing: 4) {
                    Text(t.login.passwordOptional)
                        .font(.caption)
                        .foregroundColor(.secondary)

                    HStack {
                        if showPassword {
                            TextField(t.login.password, text: $password)
                                .textContentType(.password)
                                .autocapitalization(.none)
                        } else {
                            SecureField(t.login.password, text: $password)
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
                        Text(isSubmitting ? t.login.connecting : t.login.connect)
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
                Text(t.login.guestHint)
                    .font(.caption)
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
                    .padding(.top, 8)
            }
            .padding(.horizontal, 32)

            Spacer()
            Spacer()
        }
        .padding()
        .onAppear {
            // Default to saved URL or the default
            serverURL = appSettings.serverURL
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
                        errorMessage = lm.t.login.couldNotConnect
                        isSubmitting = false
                    }
                    return
                }
            } catch {
                await MainActor.run {
                    errorMessage = "\(lm.t.login.connectionFailed)\(error.localizedDescription)"
                    isSubmitting = false
                }
                return
            }

            // Connection successful, save the server URL
            await MainActor.run {
                appSettings.configure(serverURL: url)
            }

            // Now try to login if credentials were provided
            if !username.isEmpty || !password.isEmpty {
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

}

#Preview {
    LoginView()
        .environmentObject(AuthService.shared)
        .environmentObject(AppSettings.shared)
}
