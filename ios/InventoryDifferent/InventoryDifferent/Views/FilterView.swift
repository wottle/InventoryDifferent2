//
//  FilterView.swift
//  InventoryDifferent
//
//  Created by Michael Wottle on 2/2/26.
//

import SwiftUI

struct FilterView: View {
    @EnvironmentObject var deviceStore: DeviceStore
    @EnvironmentObject var lm: LocalizationManager
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        let t = lm.t
        NavigationStack {
            Form {
                Section(t.filter.category) {
                    Picker(t.filter.category, selection: $deviceStore.selectedCategoryId) {
                        Text(t.filter.allCategories)
                            .tag(nil as Int?)

                        ForEach(deviceStore.categories) { category in
                            Text(category.name)
                                .tag(category.id as Int?)
                        }
                    }
                    .pickerStyle(.menu)
                }

                Section(t.filter.status) {
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

                Section(t.filter.other) {
                    Toggle(t.filter.favoritesOnly, isOn: $deviceStore.showFavoritesOnly)
                }

                Section {
                    Button(t.filter.clearAll) {
                        deviceStore.clearFilters()
                    }
                    .foregroundColor(.red)
                }
            }
            .navigationTitle(t.filter.title)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button(t.filter.done) {
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
