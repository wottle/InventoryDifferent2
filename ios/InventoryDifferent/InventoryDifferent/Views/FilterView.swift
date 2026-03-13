//
//  FilterView.swift
//  InventoryDifferent
//
//  Created by Michael Wottle on 2/2/26.
//

import SwiftUI

struct FilterView: View {
    @EnvironmentObject var deviceStore: DeviceStore
    @Environment(\.dismiss) private var dismiss
    
    var body: some View {
        NavigationStack {
            Form {
                Section("Category") {
                    Picker("Category", selection: $deviceStore.selectedCategoryId) {
                        Text("All Categories")
                            .tag(nil as Int?)
                        
                        ForEach(deviceStore.categories) { category in
                            Text(category.name)
                                .tag(category.id as Int?)
                        }
                    }
                    .pickerStyle(.menu)
                }
                
                Section("Status") {
                    ForEach(Status.allCases, id: \.self) { status in
                        Button {
                            if deviceStore.selectedStatuses.contains(status) {
                                deviceStore.selectedStatuses.remove(status)
                            } else {
                                deviceStore.selectedStatuses.insert(status)
                            }
                        } label: {
                            HStack {
                                Text(status.displayName)
                                    .foregroundColor(.primary)
                                Spacer()
                                if deviceStore.selectedStatuses.contains(status) {
                                    Image(systemName: "checkmark")
                                        .foregroundColor(.accentColor)
                                }
                            }
                        }
                    }
                }
                
                Section("Other") {
                    Toggle("Favorites Only", isOn: $deviceStore.showFavoritesOnly)
                }

                Section {
                    Button("Clear All Filters") {
                        deviceStore.clearFilters()
                    }
                    .foregroundColor(.red)
                }
            }
            .navigationTitle("Filters")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
        }
        .presentationDetents([.medium])
    }
}

#Preview {
    FilterView()
        .environmentObject(DeviceStore())
}
