//
//  AddNoteView.swift
//  InventoryDifferent
//
//  Created by Michael Wottle on 2/3/26.
//

import SwiftUI

struct AddNoteView: View {
    let deviceId: Int
    let onNoteAdded: (Note) -> Void
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject var lm: LocalizationManager

    @State private var content = ""
    @State private var date = Date()
    @State private var isSubmitting = false
    @State private var error: String?

    var body: some View {
        let t = lm.t
        NavigationStack {
            Form {
                Section {
                    DatePicker(t.note.dateTime, selection: $date, displayedComponents: [.date, .hourAndMinute])
                } header: {
                    Text(t.note.dateTime)
                }

                Section {
                    ZStack(alignment: .topLeading) {
                        if content.isEmpty {
                            Text(t.note.placeholder)
                                .foregroundColor(Color(.placeholderText))
                                .padding(.top, 8)
                                .padding(.leading, 4)
                        }
                        TextEditor(text: $content)
                            .frame(minHeight: 150)
                    }
                } header: {
                    Text(t.note.content)
                }

                if let error = error {
                    Section {
                        Text(error)
                            .foregroundColor(.red)
                            .font(.caption)
                    }
                }
            }
            .navigationTitle(t.note.addTitle)
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
                            await submitNote()
                        }
                    }
                    .disabled(content.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || isSubmitting)
                }
            }
            .disabled(isSubmitting)
        }
    }
    
    private func submitNote() async {
        guard !content.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else { return }
        
        isSubmitting = true
        error = nil
        
        do {
            let formatter = ISO8601DateFormatter()
            formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
            let dateString = formatter.string(from: date)
            
            let note = try await DeviceService.shared.createNote(
                deviceId: deviceId,
                content: content.trimmingCharacters(in: .whitespacesAndNewlines),
                date: dateString
            )
            
            onNoteAdded(note)
            dismiss()
        } catch {
            self.error = error.localizedDescription
            isSubmitting = false
        }
    }
}

#Preview {
    AddNoteView(deviceId: 1) { note in
        print("Note added: \(note)")
    }
}
