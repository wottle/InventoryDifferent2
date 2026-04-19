//
//  AddRelatedDeviceSheet.swift
//  InventoryDifferent
//

import SwiftUI

struct AddRelatedDeviceSheet: View {
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject var lm: LocalizationManager

    let deviceId: Int
    let deviceName: String
    let existingToIds: Set<Int>
    let onAdded: () -> Void

    @State private var allDevices: [RelationshipDevice] = []
    @State private var searchText = ""
    @State private var selectedDevice: RelationshipDevice? = nil
    @State private var relationType = ""
    @State private var isReversed = false
    @State private var isLoading = true
    @State private var isSubmitting = false

    private let typeSuggestions: [(display: String, value: String)] = [
        ("accessory of →", "accessory"),
        ("software for →", "software"),
        ("manual for →", "manual / documentation"),
        ("installed inside →", "installed inside"),
        ("purchased with →", "purchased with"),
        ("came bundled with →", "came bundled with"),
    ]

    private var filteredDevices: [RelationshipDevice] {
        let candidates = allDevices.filter { !existingToIds.contains($0.id) && $0.id != deviceId }
        guard !searchText.isEmpty else { return candidates }
        let lower = searchText.lowercased()
        return candidates.filter {
            $0.name.lowercased().contains(lower) ||
            ($0.additionalName?.lowercased().contains(lower) ?? false) ||
            ($0.manufacturer?.lowercased().contains(lower) ?? false) ||
            ($0.location?.name.lowercased().contains(lower) ?? false)
        }
    }

    private func forwardLabel(for type: String) -> String {
        let map: [String: String] = [
            "accessory": "accessory of",
            "software": "software for",
            "manual / documentation": "manual for",
            "installed inside": "installed inside",
            "purchased with": "purchased with",
            "came bundled with": "came bundled with",
        ]
        return map[type.lowercased()] ?? type
    }

    private func inverseLabel(for type: String) -> String {
        let map: [String: String] = [
            "accessory": "accessory of",
            "software": "software for",
            "manual / documentation": "manual for",
            "installed inside": "contains",
            "purchased with": "purchased with",
            "came bundled with": "came bundled with",
        ]
        return map[type.lowercased()] ?? type
    }

    var body: some View {
        let t = lm.t
        return NavigationStack {
            Form {
                devicePickerSection(t: t)
                typeSection(t: t)
                directionPreviewSection()
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
    private func directionPreviewSection() -> some View {
        let trimmed = relationType.trimmingCharacters(in: .whitespaces)
        if !trimmed.isEmpty, let target = selectedDevice {
            let fromName = !isReversed ? target.displayName : deviceName
            let toName   = !isReversed ? deviceName : target.displayName
            let shownOnName  = !isReversed ? deviceName : target.name
            let shownOfName  = !isReversed ? target.name : deviceName
            Section("Relationship Preview") {
                VStack(alignment: .leading, spacing: 8) {
                    HStack(spacing: 4) {
                        Text(fromName)
                            .fontWeight(.medium)
                        Text("→")
                            .foregroundColor(.secondary)
                        Text(forwardLabel(for: trimmed))
                            .foregroundColor(Color(red: 0, green: 88/255, blue: 188/255))
                            .fontWeight(.medium)
                        Text("→")
                            .foregroundColor(.secondary)
                        Text(toName)
                            .fontWeight(.medium)
                    }
                    .font(.footnote)
                    Text("On \"\(shownOnName)\", shown as: \(inverseLabel(for: trimmed)) \"\(shownOfName)\". On \"\(shownOfName)\", shown as: \(forwardLabel(for: trimmed)) \"\(shownOnName)\". ")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    Button {
                        isReversed.toggle()
                    } label: {
                        Label("Swap direction", systemImage: "arrow.left.arrow.right")
                            .font(.caption)
                            .foregroundColor(Color(red: 0, green: 88/255, blue: 188/255))
                    }
                }
                .padding(.vertical, 4)
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
                    Text(dev.displayName)
                        .foregroundColor(.primary)
                        .font(.system(size: 14, weight: .medium))
                    HStack(spacing: 6) {
                        if let mfr = dev.manufacturer, !mfr.isEmpty {
                            Text(mfr)
                                .foregroundColor(.secondary)
                                .font(.caption)
                        }
                        statusChip(dev.status)
                        if let loc = dev.location {
                            HStack(spacing: 2) {
                                Image(systemName: "mappin")
                                Text(loc.name)
                            }
                            .foregroundColor(.secondary)
                            .font(.caption)
                        }
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
    private func statusChip(_ status: Status) -> some View {
        let color: Color = {
            switch status {
            case .COLLECTION: return .green
            case .FOR_SALE: return .blue
            case .PENDING_SALE: return .orange
            case .SOLD, .RETURNED: return .gray
            case .DONATED: return .purple
            case .IN_REPAIR: return .teal
            case .REPAIRED: return .mint
            }
        }()
        Text(status.displayName)
            .font(.caption2)
            .fontWeight(.medium)
            .padding(.horizontal, 5)
            .padding(.vertical, 2)
            .background(color.opacity(0.15))
            .foregroundColor(color)
            .clipShape(Capsule())
    }

    @ViewBuilder
    private func typeSection(t: Translations) -> some View {
        Section(t.deviceDetail.relationshipType) {
            TextField("e.g. accessory", text: $relationType)
                .autocorrectionDisabled()
                .textInputAutocapitalization(.never)
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 8) {
                    ForEach(typeSuggestions, id: \.value) { suggestion in
                        typeSuggestionChip(suggestion)
                    }
                }
                .padding(.vertical, 4)
            }
            .listRowInsets(EdgeInsets(top: 4, leading: 16, bottom: 4, trailing: 16))
        }
    }

    @ViewBuilder
    private func typeSuggestionChip(_ suggestion: (display: String, value: String)) -> some View {
        let isSelected = relationType == suggestion.value
        Button {
            relationType = suggestion.value
        } label: {
            Text(suggestion.display)
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
            let fromId = isReversed ? target.id : deviceId
            let toId   = isReversed ? deviceId : target.id
            try await DeviceService.shared.addDeviceRelationship(
                fromDeviceId: fromId,
                toDeviceId: toId,
                type: type
            )
            onAdded()
            dismiss()
        } catch {
            print("addRelationship error: \(error)")
        }
        isSubmitting = false
    }
}
