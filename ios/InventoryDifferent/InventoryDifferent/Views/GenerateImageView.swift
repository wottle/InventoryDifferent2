//
//  GenerateImageView.swift
//  InventoryDifferent
//

import SwiftUI

private let defaultPrompt = "Create a professional product photograph of this vintage computer device on a dark background (#282828) with a 1:1 ratio for square image use. Use studio lighting with soft, even illumination to eliminate harsh shadows. Position the product at a slight 30-degree angle to show dimension. High detail, sharp focus throughout, showing clear material texture. Photorealistic rendering for high-end e-commerce use."

struct GenerateImageView: View {
    let deviceId: Int
    let images: [DeviceImage]
    let onGenerated: (DeviceImage) -> Void

    @Environment(\.dismiss) private var dismiss

    @State private var selectedImageId: Int?
    @State private var useTextOnly: Bool
    @State private var prompt = defaultPrompt
    @State private var assignAsThumbnail = true
    @State private var thumbnailMode = "BOTH"
    @State private var assignAsShopImage = false
    @State private var assignAsListingImage = false
    @State private var isGenerating = false
    @State private var errorMessage: String?
    @State private var done = false
    @State private var savedPrompt = false

    init(deviceId: Int, images: [DeviceImage], onGenerated: @escaping (DeviceImage) -> Void) {
        self.deviceId = deviceId
        self.images = images
        self.onGenerated = onGenerated
        let thumb = images.first(where: { $0.isThumbnail }) ?? images.first
        _selectedImageId = State(initialValue: thumb?.id)
        _useTextOnly = State(initialValue: images.isEmpty)
    }

    var body: some View {
        NavigationStack {
            Form {
                // Reference image picker
                if !images.isEmpty {
                    Section("Reference Photo") {
                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 10) {
                                ForEach(images) { image in
                                    let isSelected = !useTextOnly && selectedImageId == image.id
                                    AsyncImage(url: APIService.shared.imageURL(for: image.thumbnailPath ?? image.path)) { phase in
                                        switch phase {
                                        case .success(let img):
                                            img.resizable().scaledToFill()
                                        default:
                                            Color(.systemGray5)
                                        }
                                    }
                                    .frame(width: 72, height: 72)
                                    .clipShape(RoundedRectangle(cornerRadius: 8))
                                    .overlay(
                                        RoundedRectangle(cornerRadius: 8)
                                            .stroke(isSelected ? Color.accentColor : Color.clear, lineWidth: 3)
                                    )
                                    .onTapGesture {
                                        selectedImageId = image.id
                                        useTextOnly = false
                                    }
                                }
                            }
                            .padding(.vertical, 4)
                        }

                        Button {
                            useTextOnly = true
                            selectedImageId = nil
                        } label: {
                            HStack {
                                Text("Skip — text description only")
                                    .foregroundColor(useTextOnly ? .accentColor : .primary)
                                Spacer()
                                if useTextOnly {
                                    Image(systemName: "checkmark")
                                        .foregroundColor(.accentColor)
                                }
                            }
                        }
                        .buttonStyle(.plain)
                    }
                }

                // Prompt
                Section("Prompt") {
                    TextEditor(text: $prompt)
                        .frame(minHeight: 120)
                        .font(.footnote)
                    Button {
                        Task {
                            try? await DeviceService.shared.saveDefaultImagePrompt(prompt)
                            savedPrompt = true
                            try? await Task.sleep(nanoseconds: 2_000_000_000)
                            savedPrompt = false
                        }
                    } label: {
                        HStack(spacing: 4) {
                            Text("Save as default prompt")
                            if savedPrompt {
                                Text("· Saved!")
                                    .foregroundColor(.green)
                            }
                        }
                    }
                    .font(.footnote)
                    .foregroundColor(.secondary)
                }

                // Role assignment
                Section("Assign Roles") {
                    Toggle("Set as thumbnail", isOn: $assignAsThumbnail)
                        .listRowSeparator(assignAsThumbnail ? .hidden : .automatic)
                    if assignAsThumbnail {
                        Picker("Thumbnail mode", selection: $thumbnailMode) {
                            Text("Both").tag("BOTH")
                            Text("Light").tag("LIGHT")
                            Text("Dark").tag("DARK")
                        }
                        .pickerStyle(.segmented)
                    }
                    Toggle("Set as shop image", isOn: $assignAsShopImage)
                    Toggle("Set as listing image", isOn: $assignAsListingImage)
                }

                // Error
                if let errorMessage {
                    Section {
                        Text(errorMessage)
                            .foregroundColor(.red)
                            .font(.footnote)
                    }
                }

                // Success
                if done {
                    Section {
                        Label("Image generated and added to gallery.", systemImage: "checkmark.circle.fill")
                            .foregroundColor(.green)
                    }
                }
            }
            .navigationTitle("AI Product Image")
            .navigationBarTitleDisplayMode(.inline)
            .task {
                if let config = try? await DeviceService.shared.fetchGenerateImageConfig(),
                   let saved = config.defaultPrompt {
                    prompt = saved
                }
            }
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                        .disabled(isGenerating)
                }
                ToolbarItem(placement: .confirmationAction) {
                    if done {
                        Button("Done") { dismiss() }
                    } else {
                        Button {
                            Task { await generate() }
                        } label: {
                            if isGenerating {
                                ProgressView()
                            } else {
                                Text("Generate")
                            }
                        }
                        .disabled(isGenerating || prompt.trimmingCharacters(in: .whitespaces).isEmpty)
                    }
                }
            }
        }
    }

    private func generate() async {
        isGenerating = true
        errorMessage = nil
        do {
            let newImage = try await DeviceService.shared.generateImage(
                deviceId: deviceId,
                sourceImageId: useTextOnly ? nil : selectedImageId,
                prompt: prompt,
                assignAsThumbnail: assignAsThumbnail,
                thumbnailMode: assignAsThumbnail ? thumbnailMode : nil,
                assignAsShopImage: assignAsShopImage,
                assignAsListingImage: assignAsListingImage
            )
            onGenerated(newImage)
            done = true
        } catch {
            errorMessage = error.localizedDescription
        }
        isGenerating = false
    }
}
