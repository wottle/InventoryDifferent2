//
//  AddTagView.swift
//  InventoryDifferent
//
//  Created by Michael Wottle on 2/17/26.
//

import SwiftUI

struct AddTagView: View {
    let deviceId: Int
    let existingTags: [Tag]
    let onDeviceUpdated: (Device) -> Void
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject var lm: LocalizationManager

    @State private var tagName = ""
    @State private var allTags: [Tag] = []
    @State private var isLoadingTags = false
    @State private var isSubmitting = false
    @State private var error: String?
    @State private var showSuggestions = false

    var availableTags: [Tag] {
        let existingIds = Set(existingTags.map { $0.id })
        return allTags.filter { !existingIds.contains($0.id) }
    }

    var filteredSuggestions: [Tag] {
        guard !tagName.isEmpty else { return [] }
        let searchTerm = tagName.lowercased().trimmingCharacters(in: .whitespaces)
        return availableTags.filter { tag in
            tag.name.lowercased().contains(searchTerm) &&
            tag.name.lowercased() != searchTerm
        }.prefix(8).map { $0 }
    }

    var body: some View {
        let t = lm.t
        NavigationStack {
            Form {
                Section {
                    VStack(alignment: .leading, spacing: 4) {
                        TextField(t.tag.tagNamePlaceholder, text: $tagName)
                            .textInputAutocapitalization(.never)
                            .autocorrectionDisabled()
                            .onChange(of: tagName) { _, _ in
                                showSuggestions = true
                            }
                            .onSubmit {
                                showSuggestions = false
                            }

                        if showSuggestions && !filteredSuggestions.isEmpty {
                            VStack(alignment: .leading, spacing: 0) {
                                ForEach(filteredSuggestions) { tag in
                                    Button {
                                        Task {
                                            await addTag(name: tag.name)
                                        }
                                    } label: {
                                        HStack {
                                            Text(tag.name)
                                                .foregroundColor(.primary)
                                            Spacer()
                                        }
                                        .padding(.vertical, 8)
                                        .padding(.horizontal, 12)
                                        .contentShape(Rectangle())
                                    }
                                    .buttonStyle(.plain)

                                    if tag.id != filteredSuggestions.last?.id {
                                        Divider()
                                    }
                                }
                            }
                            .background(Color(.systemGray6))
                            .clipShape(RoundedRectangle(cornerRadius: 8))
                            .padding(.top, 4)
                        }
                    }
                } header: {
                    Text(t.tag.newTagHeader)
                }

                if !existingTags.isEmpty {
                    Section {
                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 8) {
                                ForEach(existingTags) { tag in
                                    Text(tag.name)
                                        .font(.caption)
                                        .padding(.horizontal, 8)
                                        .padding(.vertical, 4)
                                        .background(Color.accentColor.opacity(0.1))
                                        .foregroundColor(.accentColor)
                                        .clipShape(Capsule())
                                }
                            }
                        }
                    } header: {
                        Text(t.tag.currentTagsHeader)
                    }
                }

                if !availableTags.isEmpty && tagName.isEmpty {
                    Section {
                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 8) {
                                ForEach(availableTags) { tag in
                                    Button {
                                        Task {
                                            await addTag(name: tag.name)
                                        }
                                    } label: {
                                        Text(tag.name)
                                            .font(.caption)
                                            .padding(.horizontal, 8)
                                            .padding(.vertical, 4)
                                            .background(Color(.systemGray5))
                                            .foregroundColor(.primary)
                                            .clipShape(Capsule())
                                    }
                                }
                            }
                        }
                    } header: {
                        Text(t.tag.availableTagsHeader)
                    }
                }

                if let error = error {
                    Section {
                        Text(error)
                            .foregroundColor(.red)
                            .font(.caption)
                    }
                }
            }
            .navigationTitle(t.tag.addTitle)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button(t.common.cancel) {
                        dismiss()
                    }
                }

                ToolbarItem(placement: .confirmationAction) {
                    Button(t.common.add) {
                        Task {
                            await addTag(name: tagName)
                        }
                    }
                    .disabled(tagName.trimmingCharacters(in: .whitespaces).isEmpty || isSubmitting)
                }
            }
            .disabled(isSubmitting)
            .task {
                await loadAllTags()
            }
        }
    }

    private func loadAllTags() async {
        isLoadingTags = true
        do {
            allTags = try await DeviceService.shared.fetchAllTags()
        } catch {
            print("Failed to load tags: \(error)")
        }
        isLoadingTags = false
    }

    private func addTag(name: String) async {
        let trimmed = name.trimmingCharacters(in: .whitespaces)
        guard !trimmed.isEmpty else { return }

        isSubmitting = true
        error = nil

        do {
            let updatedDevice = try await DeviceService.shared.addDeviceTag(deviceId: deviceId, tagName: trimmed)
            onDeviceUpdated(updatedDevice)
            dismiss()
        } catch {
            self.error = error.localizedDescription
            isSubmitting = false
        }
    }
}

#Preview {
    AddTagView(
        deviceId: 1,
        existingTags: [Tag(id: 1, name: "vintage"), Tag(id: 2, name: "working")]
    ) { device in
        print("Device updated: \(device)")
    }
}
