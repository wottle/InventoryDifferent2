//
//  SortOptionsView.swift
//  InventoryDifferent
//
//  Created by Michael Wottle on 2/2/26.
//

import SwiftUI

struct SortOptionsView: View {
    @EnvironmentObject var deviceStore: DeviceStore
    @Environment(\.dismiss) private var dismiss
    
    var body: some View {
        NavigationStack {
            Form {
                Section("Sort By") {
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
                
                Section("Direction") {
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
            .navigationTitle("Sort Options")
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
    SortOptionsView()
        .environmentObject(DeviceStore())
}
