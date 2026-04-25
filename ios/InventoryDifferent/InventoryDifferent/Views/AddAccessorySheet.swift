//
//  AddAccessorySheet.swift
//  InventoryDifferent
//

import SwiftUI

struct AccessoryFlowLayout: Layout {
    var spacing: CGFloat = 8

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        layout(in: proposal.replacingUnspecifiedDimensions().width, subviews: subviews).size
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        let result = layout(in: bounds.width, subviews: subviews)
        for (index, frame) in result.frames.enumerated() {
            subviews[index].place(
                at: CGPoint(x: frame.minX + bounds.minX, y: frame.minY + bounds.minY),
                proposal: .unspecified
            )
        }
    }

    private struct LayoutResult { var frames: [CGRect] = []; var size: CGSize = .zero }

    private func layout(in maxWidth: CGFloat, subviews: Subviews) -> LayoutResult {
        var result = LayoutResult()
        var x: CGFloat = 0, y: CGFloat = 0, rowHeight: CGFloat = 0
        for subview in subviews {
            let sz = subview.sizeThatFits(.unspecified)
            if x + sz.width > maxWidth, x > 0 { x = 0; y += rowHeight + spacing; rowHeight = 0 }
            result.frames.append(CGRect(origin: CGPoint(x: x, y: y), size: sz))
            x += sz.width + spacing
            rowHeight = max(rowHeight, sz.height)
        }
        result.size = CGSize(width: maxWidth, height: y + rowHeight)
        return result
    }
}

struct AddAccessorySheet: View {
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject var lm: LocalizationManager
    let deviceId: Int
    let onAdded: (DeviceAccessory) -> Void

    @State private var customName = ""
    @State private var isSubmitting = false

    private let suggestions = [
        "Original Box", "Power Adapter", "Power Cable", "Keyboard", "Mouse",
        "Monitor", "Speakers", "Manuals", "Floppy Disks", "CDs", "Remote Control"
    ]

    var body: some View {
        let t = lm.t
        return NavigationStack {
            Form {
                Section(t.addEditDevice.accessorySuggestions) {
                    AccessoryFlowLayout(spacing: 8) {
                        ForEach(suggestions, id: \.self) { suggestion in
                            Button {
                                Task { await addAccessory(name: suggestion) }
                            } label: {
                                Text(suggestion)
                                    .font(.caption)
                                    .padding(.horizontal, 8)
                                    .padding(.vertical, 4)
                                    .background(Color.green.opacity(0.15))
                                    .foregroundColor(.green)
                                    .clipShape(Capsule())
                            }
                        }
                    }
                    .padding(.vertical, 4)
                }

                Section(t.addEditDevice.accessoryCustom) {
                    HStack {
                        TextField(t.addEditDevice.accessoryNamePlaceholder, text: $customName)
                        Button(t.common.add) {
                            Task { await addAccessory(name: customName) }
                        }
                        .disabled(customName.trimmingCharacters(in: .whitespaces).isEmpty || isSubmitting)
                    }
                }
            }
            .navigationTitle(t.addEditDevice.addAccessory)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button(t.common.cancel) { dismiss() }
                }
            }
            .disabled(isSubmitting)
        }
    }

    private func addAccessory(name: String) async {
        let trimmed = name.trimmingCharacters(in: .whitespaces)
        guard !trimmed.isEmpty else { return }
        isSubmitting = true
        do {
            let newAccessory = try await DeviceService.shared.addDeviceAccessory(deviceId: deviceId, name: trimmed)
            onAdded(newAccessory)
            dismiss()
        } catch {
            print("Failed to add accessory: \(error)")
        }
        isSubmitting = false
    }
}
