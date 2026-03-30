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
    @StateObject private var voice = VoiceManager()
    @State private var micPulse = false
    @State private var isConversationMode = false

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

            // Conversation mode banner
            if isConversationMode {
                HStack(spacing: 6) {
                    Image(systemName: voice.isRecording ? "waveform" : voice.isSpeaking ? "speaker.wave.2" : "ellipsis")
                        .font(.caption)
                        .foregroundColor(.blue)
                    Text(voice.isRecording ? "Listening..." : voice.isSpeaking ? "Speaking..." : isLoading ? "Thinking..." : "Tap mic to stop conversation")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    Spacer()
                    Button {
                        exitConversationMode()
                    } label: {
                        Image(systemName: "xmark.circle.fill")
                            .foregroundColor(.secondary)
                    }
                }
                .padding(.horizontal)
                .padding(.vertical, 6)
                .background(Color(.secondarySystemBackground))
            }

            HStack(spacing: 8) {
                // Mic / conversation mode button
                Button {
                    handleMicTap()
                } label: {
                    Image(systemName: isConversationMode ? "mic.badge.xmark" : voice.isRecording ? "waveform" : "mic.fill")
                        .font(.system(size: 22))
                        .foregroundColor(voice.isRecording ? .red : isConversationMode ? .orange : .blue)
                        .scaleEffect(micPulse ? 1.25 : 1.0)
                        .animation(
                            micPulse
                                ? .easeInOut(duration: 0.5).repeatForever(autoreverses: true)
                                : .default,
                            value: micPulse
                        )
                }

                TextField("Ask about your collection...", text: $inputText, axis: .vertical)
                    .textFieldStyle(.plain)
                    .padding(12)
                    .background(Color(.secondarySystemBackground))
                    .cornerRadius(20)
                    .focused($isInputFocused)
                    .lineLimit(1...5)
                    .onChange(of: inputText) { _ in
                        voice.stopSpeaking()
                    }

                Button {
                    sendMessage(fromVoice: false)
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
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                Button {
                    voice.isSpeakingEnabled.toggle()
                    if !voice.isSpeakingEnabled {
                        voice.stopSpeaking()
                    }
                } label: {
                    Image(systemName: voice.isSpeakingEnabled ? "speaker.wave.2.fill" : "speaker.slash.fill")
                        .foregroundColor(voice.isSpeakingEnabled ? .primary : .secondary)
                }
            }
        }
        // Animate mic button while recording
        .onChange(of: voice.isRecording) { recording in
            micPulse = recording
        }
        // Live transcript → input field
        .onChange(of: voice.transcript) { newTranscript in
            if !newTranscript.isEmpty {
                inputText = newTranscript
            }
        }
        // Auto-send when STT finishes naturally (silence / isFinal)
        .onChange(of: voice.finalTranscript) { finalTranscript in
            guard let text = finalTranscript, !text.isEmpty else { return }
            voice.finalTranscript = nil
            inputText = text
            sendMessage(fromVoice: true)
        }
        // Auto-restart mic in conversation mode after TTS ends
        .onChange(of: voice.isSpeaking) { speaking in
            if !speaking && isConversationMode && !isLoading {
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.4) {
                    if isConversationMode && !voice.isRecording {
                        try? voice.startRecording()
                    }
                }
            }
        }
        .onAppear {
            if messages.isEmpty {
                messages.append(ChatMessage(
                    content: "Hello! I can help you with information about your collection. Ask me anything!",
                    isUser: false
                ))
            }
        }
    }

    private func handleMicTap() {
        if isConversationMode {
            exitConversationMode()
            return
        }

        if voice.isRecording {
            voice.suppressFinalTranscript = true
            voice.stopRecording()
        } else {
            isInputFocused = false
            voice.stopSpeaking()
            isConversationMode = true
            try? voice.startRecording()
        }
    }

    private func exitConversationMode() {
        isConversationMode = false
        voice.suppressFinalTranscript = true
        voice.stopRecording()
        voice.stopSpeaking()
        inputText = ""
    }

    private func sendMessage(fromVoice: Bool) {
        guard !inputText.isEmpty else { return }

        if voice.isRecording {
            voice.suppressFinalTranscript = true
            voice.stopRecording()
        }
        voice.stopSpeaking()

        let userMessage = ChatMessage(content: inputText, isUser: true)
        messages.append(userMessage)

        let history = messages  // snapshot including the new user message
        inputText = ""
        isLoading = true
        error = nil

        Task {
            do {
                let response = try await ChatService.shared.sendMessage(history: history)
                await MainActor.run {
                    messages.append(ChatMessage(content: response, isUser: false))
                    isLoading = false

                    if voice.isSpeakingEnabled {
                        voice.speak(response)
                        // isSpeaking delegate will trigger auto-listen in conversation mode
                    } else if isConversationMode {
                        // TTS off but in conversation mode — restart listening after a beat
                        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                            if isConversationMode { try? voice.startRecording() }
                        }
                    }
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
