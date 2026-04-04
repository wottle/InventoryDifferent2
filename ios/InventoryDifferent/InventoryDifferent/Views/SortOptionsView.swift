//
//  SortOptionsView.swift
//  InventoryDifferent
//
//  Created by Michael Wottle on 2/2/26.
//

import SwiftUI

struct SortOptionsView: View {
    @EnvironmentObject var deviceStore: DeviceStore
    @EnvironmentObject var lm: LocalizationManager
    @Environment(\.dismiss) private var dismiss
    
    var body: some View {
        let t = lm.t
        NavigationStack {
            Form {
                Section(t.sort.sortBy) {
                    ForEach(SortOption.allCases, id: \.self) { option in
                        Button {
                            deviceStore.sortOption = option
                        } label: {
                            HStack {
                                Text(option.rawValue)
                                    .foregroundColor(.primary)
                                Spacer()
                                if deviceStore.sortOption == option {
                                    Image(systemName: "checkmark")
                                        .foregroundColor(.accentColor)
                                }
                            }
                        }
                    }
                }
                
                Section(t.sort.direction) {
                    ForEach(SortDirection.allCases, id: \.self) { direction in
                        Button {
                            deviceStore.sortDirection = direction
                        } label: {
                            HStack {
                                Text(direction.rawValue)
                                    .foregroundColor(.primary)
                                Spacer()
                                if deviceStore.sortDirection == direction {
                                    Image(systemName: "checkmark")
                                        .foregroundColor(.accentColor)
                                }
                            }
                        }
                    }
                }
            }
            .navigationTitle(t.sort.title)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button(t.common.done) {
                        dismiss()
                    }
                }
            }
        }
        .presentationDetents([.medium])
    }
}

#Preview {
    SortOptionsView()
        .environmentObject(DeviceStore())
}
