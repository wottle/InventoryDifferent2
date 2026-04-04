//
//  EditNoteView.swift
//  InventoryDifferent
//
//  Created by Michael Wottle on 2/3/26.
//

import SwiftUI

struct EditNoteView: View {
    let note: Note
    let onNoteUpdated: (Note) -> Void
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject var lm: LocalizationManager

    @State private var content: String
    @State private var date: Date
    @State private var isSubmitting = false
    @State private var error: String?
    
    init(note: Note, onNoteUpdated: @escaping (Note) -> Void) {
        self.note = note
        self.onNoteUpdated = onNoteUpdated
        
        self._content = State(initialValue: note.content)
        
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        
        if let parsedDate = formatter.date(from: note.date) {
            self._date = State(initialValue: parsedDate)
        } else {
            formatter.formatOptions = [.withInternetDateTime]
            if let parsedDate = formatter.date(from: note.date) {
                self._date = State(initialValue: parsedDate)
            } else {
                self._date = State(initialValue: Date())
            }
        }
    }
    
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
            .navigationTitle(t.note.editTitle)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button(t.common.cancel) {
                        dismiss()
                    }
                }

                ToolbarItem(placement: .confirmationAction) {
                    Button(t.common.save) {
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
            
            let updatedNote = try await DeviceService.shared.updateNote(
                id: note.id,
                content: content.trimmingCharacters(in: .whitespacesAndNewlines),
                date: dateString
            )
            
            onNoteUpdated(updatedNote)
            dismiss()
        } catch {
            self.error = error.localizedDescription
            isSubmitting = false
        }
    }
}

#Preview {
    EditNoteView(note: Note(id: 1, content: "Test note", date: "2024-01-01T12:00:00.000Z")) { note in
        print("Note updated: \(note)")
    }
}
