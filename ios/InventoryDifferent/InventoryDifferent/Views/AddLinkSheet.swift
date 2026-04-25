//
//  AddLinkSheet.swift
//  InventoryDifferent
//

import SwiftUI

struct AddLinkSheet: View {
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject var lm: LocalizationManager
    let deviceId: Int
    let onAdded: (DeviceLink) -> Void

    @State private var label = ""
    @State private var url = ""
    @State private var isSubmitting = false

    var body: some View {
        let t = lm.t
        return NavigationStack {
            Form {
                Section(t.addEditDevice.linkDetails) {
                    TextField(t.addEditDevice.linkLabelPlaceholder, text: $label)
                    TextField(t.addEditDevice.linkURLPlaceholder, text: $url)
                        .keyboardType(.URL)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                }
            }
            .navigationTitle(t.addEditDevice.addLink)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button(t.common.cancel) { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button(t.common.add) {
                        Task { await addLink() }
                    }
                    .disabled(label.trimmingCharacters(in: .whitespaces).isEmpty ||
                              url.trimmingCharacters(in: .whitespaces).isEmpty || isSubmitting)
                }
            }
            .disabled(isSubmitting)
        }
    }

    private func addLink() async {
        let trimmedLabel = label.trimmingCharacters(in: .whitespaces)
        let trimmedUrl = url.trimmingCharacters(in: .whitespaces)
        guard !trimmedLabel.isEmpty, !trimmedUrl.isEmpty else { return }
        isSubmitting = true
        do {
            let newLink = try await DeviceService.shared.addDeviceLink(deviceId: deviceId, label: trimmedLabel, url: trimmedUrl)
            onAdded(newLink)
            dismiss()
        } catch {
            print("Failed to add link: \(error)")
        }
        isSubmitting = false
    }
}
