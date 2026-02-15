//
//  ChatView.swift
//  InventoryDifferent
//
//  Created by Michael Wottle on 2/7/26.
//

import SwiftUI

struct ChatView: View {
    @State private var messages: [ChatMessage] = []
    @State private var inputText = ""
    @State private var isLoading = false
    @State private var error: String?
    @FocusState private var isInputFocused: Bool
    
    var body: some View {
        VStack(spacing: 0) {
            ScrollViewReader { proxy in
                ScrollView {
                    LazyVStack(spacing: 12) {
                        ForEach(messages) { message in
                            MessageBubble(message: message)
                                .id(message.id)
                        }
                        
                        if isLoading {
                            HStack {
                                ProgressView()
                                    .padding(.horizontal, 8)
                                Text("Thinking...")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                                Spacer()
                            }
                            .padding()
                        }
                        
                        if let error = error {
                            HStack {
                                Image(systemName: "exclamationmark.triangle")
                                    .foregroundColor(.orange)
                                Text(error)
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                                Spacer()
                            }
                            .padding()
                        }
                    }
                    .padding()
                }
                .onChange(of: messages.count) { _ in
                    if let lastMessage = messages.last {
                        withAnimation {
                            proxy.scrollTo(lastMessage.id, anchor: .bottom)
                        }
                    }
                }
            }
            
            Divider()
            
            HStack(spacing: 12) {
                TextField("Ask about your collection...", text: $inputText, axis: .vertical)
                    .textFieldStyle(.plain)
                    .padding(12)
                    .background(Color(.secondarySystemBackground))
                    .cornerRadius(20)
                    .focused($isInputFocused)
                    .lineLimit(1...5)
                
                Button {
                    sendMessage()
                } label: {
                    Image(systemName: "arrow.up.circle.fill")
                        .font(.system(size: 32))
                        .foregroundColor(inputText.isEmpty ? .gray : .blue)
                }
                .disabled(inputText.isEmpty || isLoading)
            }
            .padding()
        }
        .navigationTitle("Chat")
        .navigationBarTitleDisplayMode(.large)
        .onAppear {
            if messages.isEmpty {
                messages.append(ChatMessage(
                    content: "Hello! I can help you with information about your collection. Ask me anything!",
                    isUser: false
                ))
            }
        }
    }
    
    private func sendMessage() {
        guard !inputText.isEmpty else { return }
        
        let userMessage = ChatMessage(content: inputText, isUser: true)
        messages.append(userMessage)
        
        let messageToSend = inputText
        inputText = ""
        isLoading = true
        error = nil
        
        Task {
            do {
                let response = try await ChatService.shared.sendMessage(messageToSend)
                await MainActor.run {
                    messages.append(ChatMessage(content: response, isUser: false))
                    isLoading = false
                }
            } catch {
                await MainActor.run {
                    self.error = error.localizedDescription
                    isLoading = false
                }
            }
        }
    }
}

struct MessageBubble: View {
    let message: ChatMessage
    
    var body: some View {
        HStack {
            if message.isUser {
                Spacer()
            }
            
            Text(message.content)
                .padding(12)
                .background(message.isUser ? Color.blue : Color(.secondarySystemBackground))
                .foregroundColor(message.isUser ? .white : .primary)
                .cornerRadius(16)
                .frame(maxWidth: .infinity * 0.75, alignment: message.isUser ? .trailing : .leading)
            
            if !message.isUser {
                Spacer()
            }
        }
    }
}

struct ChatMessage: Identifiable {
    let id = UUID()
    let content: String
    let isUser: Bool
    let timestamp = Date()
}

#Preview {
    ChatView()
}
