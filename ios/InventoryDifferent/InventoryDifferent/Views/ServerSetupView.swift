//
//  ServerSetupView.swift
//  InventoryDifferent
//
//  Created by Michael Wottle on 2/2/26.
//

import SwiftUI

struct ServerSetupView: View {
    @EnvironmentObject var appSettings: AppSettings
    @State private var serverURL: String = "https://inventorydifferent.com"
    @State private var isConnecting = false
    @State private var errorMessage: String?
    
    var body: some View {
        NavigationStack {
            VStack(spacing: 24) {
                Spacer()
                
                Image(systemName: "server.rack")
                    .font(.system(size: 60))
                    .foregroundColor(.accentColor)
                
                Text("Welcome to Inventory Different")
                    .font(.title2)
                    .fontWeight(.bold)
                
                Text("Enter your server URL to get started")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                
                VStack(alignment: .leading, spacing: 8) {
                    Text("Server URL")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    
                    TextField("https://example.com", text: $serverURL)
                        .textFieldStyle(.roundedBorder)
                        .autocapitalization(.none)
                        .autocorrectionDisabled()
                        .keyboardType(.URL)
                }
                .padding(.horizontal)
                
                if let error = errorMessage {
                    Text(error)
                        .font(.caption)
                        .foregroundColor(.red)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal)
                }
                
                Button {
                    connect()
                } label: {
                    if isConnecting {
                        ProgressView()
                            .progressViewStyle(CircularProgressViewStyle(tint: .white))
                            .frame(maxWidth: .infinity)
                    } else {
                        Text("Connect")
                            .frame(maxWidth: .infinity)
                    }
                }
                .buttonStyle(.borderedProminent)
                .controlSize(.large)
                .padding(.horizontal)
                .disabled(serverURL.isEmpty || isConnecting)
                
                Spacer()
                Spacer()
            }
            .padding()
            .navigationTitle("Setup")
            .navigationBarTitleDisplayMode(.inline)
        }
    }
    
    private func connect() {
        // Normalize URL - remove trailing slash
        var url = serverURL.trimmingCharacters(in: .whitespacesAndNewlines)
        if url.hasSuffix("/") {
            url = String(url.dropLast())
        }
        
        isConnecting = true
        errorMessage = nil
        
        Task {
            do {
                // Test connection by fetching categories
                APIService.shared.updateBaseURL(url)
                let _: [Category] = try await testConnection()
                
                await MainActor.run {
                    appSettings.configure(serverURL: url)
                }
            } catch {
                await MainActor.run {
                    errorMessage = "Could not connect to server: \(error.localizedDescription)"
                    isConnecting = false
                }
            }
        }
    }
    
    private func testConnection() async throws -> [Category] {
        let query = """
        query GetCategories {
            categories {
                id
                name
                type
                sortOrder
            }
        }
        """
        
        struct Response: Decodable {
            let categories: [Category]
        }
        
        let response: Response = try await APIService.shared.execute(query: query)
        return response.categories
    }
}

#Preview {
    ServerSetupView()
        .environmentObject(AppSettings.shared)
}
