//
//  AddRelatedDeviceSheet.swift
//  InventoryDifferent
//

import SwiftUI

struct AddRelatedDeviceSheet: View {
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject var lm: LocalizationManager

    let deviceId: Int
    let existingToIds: Set<Int>
    let onAdded: ([DeviceRelationship]) -> Void

    @State private var allDevices: [RelationshipDevice] = []
    @State private var searchText = ""
    @State private var selectedDevice: RelationshipDevice? = nil
    @State private var relationType = ""
    @State private var isLoading = true
    @State private var isSubmitting = false

    private let typeSuggestions = [
        "accessory", "software", "manual / documentation",
        "installed inside", "purchased with", "came bundled with"
    ]

    private var filteredDevices: [RelationshipDevice] {
        let candidates = allDevices.filter { !existingToIds.contains($0.id) && $0.id != deviceId }
        guard !searchText.isEmpty else { return candidates }
        let lower = searchText.lowercased()
        return candidates.filter {
            $0.name.lowercased().contains(lower) ||
            ($0.manufacturer?.lowercased().contains(lower) ?? false)
        }
    }

    var body: some View {
        let t = lm.t
        return NavigationStack {
            Form {
                devicePickerSection(t: t)
                typeSection(t: t)
            }
            .navigationTitle(t.deviceDetail.addRelationship)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button(t.common.cancel) { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button(t.common.add) {
                        Task { await addRelationship() }
                    }
                    .disabled(selectedDevice == nil
                              || relationType.trimmingCharacters(in: .whitespaces).isEmpty
                              || isSubmitting)
                }
            }
            .disabled(isSubmitting)
            .task {
                isLoading = true
                if let devices = try? await DeviceService.shared.fetchAllDevicesSimple() {
                    allDevices = devices.sorted { $0.name < $1.name }
                }
                isLoading = false
            }
        }
    }

    @ViewBuilder
    private func devicePickerSection(t: Translations) -> some View {
        Section(t.deviceDetail.relationshipDevice) {
            if isLoading {
                HStack {
                    Spacer()
                    ProgressView()
                    Spacer()
                }
            } else {
                TextField("Search devices…", text: $searchText)
                    .autocorrectionDisabled()
                ForEach(Array(filteredDevices.prefix(30))) { dev in
                    deviceRow(dev)
                }
                if filteredDevices.count > 30 {
                    Text("Refine your search to see more results")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
        }
    }

    @ViewBuilder
    private func deviceRow(_ dev: RelationshipDevice) -> some View {
        let isSelected = selectedDevice?.id == dev.id
        Button {
            selectedDevice = isSelected ? nil : dev
        } label: {
            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    Text(dev.name)
                        .foregroundColor(.primary)
                        .font(.system(size: 14, weight: .medium))
                    if let mfr = dev.manufacturer, !mfr.isEmpty {
                        Text(mfr)
                            .foregroundColor(.secondary)
                            .font(.caption)
                    }
                }
                Spacer()
                if isSelected {
                    Image(systemName: "checkmark")
                        .foregroundColor(Color(red: 0, green: 88/255, blue: 188/255))
                        .font(.system(size: 14, weight: .semibold))
                }
            }
        }
    }

    @ViewBuilder
    private func typeSection(t: Translations) -> some View {
        Section(t.deviceDetail.relationshipType) {
            TextField("e.g. accessory", text: $relationType)
                .autocorrectionDisabled()
                .textInputAutocapitalization(.never)
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 8) {
                    ForEach(typeSuggestions, id: \.self) { suggestion in
                        typeSuggestionChip(suggestion)
                    }
                }
                .padding(.vertical, 4)
            }
            .listRowInsets(EdgeInsets(top: 4, leading: 16, bottom: 4, trailing: 16))
        }
    }

    @ViewBuilder
    private func typeSuggestionChip(_ suggestion: String) -> some View {
        let isSelected = relationType == suggestion
        Button {
            relationType = suggestion
        } label: {
            Text(suggestion)
                .font(.caption)
                .padding(.horizontal, 8)
                .padding(.vertical, 4)
                .background(isSelected ? Color(red: 0, green: 88/255, blue: 188/255).opacity(0.15) : Color.secondary.opacity(0.1))
                .foregroundColor(isSelected ? Color(red: 0, green: 88/255, blue: 188/255) : .primary)
                .clipShape(Capsule())
        }
        .buttonStyle(.plain)
    }

    private func addRelationship() async {
        guard let target = selectedDevice else { return }
        let type = relationType.trimmingCharacters(in: .whitespaces)
        guard !type.isEmpty else { return }
        isSubmitting = true
        do {
            let updated = try await DeviceService.shared.addDeviceRelationship(
                fromDeviceId: deviceId,
                toDeviceId: target.id,
                type: type
            )
            onAdded(updated)
            dismiss()
        } catch {
            print("addRelationship error: \(error)")
        }
        isSubmitting = false
    }
}
