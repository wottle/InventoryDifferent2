//
//  AddMaintenanceTaskView.swift
//  InventoryDifferent
//
//  Created by Michael Wottle on 2/3/26.
//

import SwiftUI

struct AddMaintenanceTaskView: View {
    let deviceId: Int
    let onTaskAdded: (MaintenanceTask) -> Void
    @Environment(\.dismiss) private var dismiss
    
    @State private var label = ""
    @State private var dateCompleted = Date()
    @State private var notes = ""
    @State private var cost = ""
    @State private var isSubmitting = false
    @State private var error: String?
    
    @State private var taskLabels: [String] = []
    @State private var isLoadingLabels = false
    @State private var showSuggestions = false
    
    var filteredSuggestions: [String] {
        guard !label.isEmpty else { return [] }
        let searchTerm = label.lowercased().trimmingCharacters(in: .whitespaces)
        return taskLabels.filter { label in
            label.lowercased().contains(searchTerm) &&
            label.lowercased() != searchTerm
        }.prefix(8).map { $0 }
    }
    
    var body: some View {
        NavigationStack {
            Form {
                Section {
                    VStack(alignment: .leading, spacing: 4) {
                        TextField("Task Label", text: $label)
                            .textInputAutocapitalization(.words)
                            .autocorrectionDisabled()
                            .onChange(of: label) { _, _ in
                                showSuggestions = true
                            }
                            .onSubmit {
                                showSuggestions = false
                            }
                        
                        if showSuggestions && !filteredSuggestions.isEmpty {
                            VStack(alignment: .leading, spacing: 0) {
                                ForEach(filteredSuggestions, id: \.self) { suggestion in
                                    Button {
                                        label = suggestion
                                        showSuggestions = false
                                    } label: {
                                        HStack {
                                            Text(suggestion)
                                                .foregroundColor(.primary)
                                            Spacer()
                                        }
                                        .padding(.vertical, 8)
                                        .padding(.horizontal, 12)
                                        .contentShape(Rectangle())
                                    }
                                    .buttonStyle(.plain)
                                    
                                    if suggestion != filteredSuggestions.last {
                                        Divider()
                                    }
                                }
                            }
                            .background(Color(.systemGray6))
                            .clipShape(RoundedRectangle(cornerRadius: 8))
                            .padding(.top, 4)
                        }
                    }
                    
                    DatePicker("Date Completed", selection: $dateCompleted, displayedComponents: .date)
                    HStack {
                        Text("$")
                            .foregroundColor(.secondary)
                        TextField("Cost (optional)", text: $cost)
                            .keyboardType(.decimalPad)
                    }
                } header: {
                    Text("Task Information")
                }

                Section {
                    ZStack(alignment: .topLeading) {
                        if notes.isEmpty {
                            Text("Optional notes about this task...")
                                .foregroundColor(Color(.placeholderText))
                                .padding(.top, 8)
                                .padding(.leading, 4)
                        }
                        TextEditor(text: $notes)
                            .frame(minHeight: 100)
                    }
                } header: {
                    Text("Notes")
                }
                
                if let error = error {
                    Section {
                        Text(error)
                            .foregroundColor(.red)
                            .font(.caption)
                    }
                }
            }
            .navigationTitle("Add Maintenance Task")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
                
                ToolbarItem(placement: .confirmationAction) {
                    Button("Add") {
                        Task {
                            await submitTask()
                        }
                    }
                    .disabled(label.trimmingCharacters(in: .whitespaces).isEmpty || isSubmitting)
                }
            }
            .disabled(isSubmitting)
            .task {
                await loadTaskLabels()
            }
        }
    }
    
    private func loadTaskLabels() async {
        isLoadingLabels = true
        do {
            taskLabels = try await DeviceService.shared.fetchMaintenanceTaskLabels()
        } catch {
            print("Failed to load task labels: \(error)")
        }
        isLoadingLabels = false
    }
    
    private func submitTask() async {
        guard !label.trimmingCharacters(in: .whitespaces).isEmpty else { return }
        
        isSubmitting = true
        error = nil
        
        do {
            let formatter = ISO8601DateFormatter()
            formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
            let dateString = formatter.string(from: dateCompleted)
            
            let notesValue = notes.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty ? nil : notes
            let costValue = Double(cost.trimmingCharacters(in: .whitespaces))

            let task = try await DeviceService.shared.createMaintenanceTask(
                deviceId: deviceId,
                label: label.trimmingCharacters(in: .whitespaces),
                dateCompleted: dateString,
                notes: notesValue,
                cost: costValue
            )
            
            onTaskAdded(task)
            dismiss()
        } catch {
            self.error = error.localizedDescription
            isSubmitting = false
        }
    }
}

#Preview {
    AddMaintenanceTaskView(deviceId: 1) { task in
        print("Task added: \(task)")
    }
}
