//
//  ImageUploadView.swift
//  InventoryDifferent
//
//  Created by Michael Wottle on 2/3/26.
//

import SwiftUI
import PhotosUI

struct ImageUploadView: View {
    let deviceId: Int
    let onUpload: ([DeviceImage]) -> Void
    
    @Environment(\.dismiss) private var dismiss
    @State private var selectedItems: [PhotosPickerItem] = []
    @State private var isUploading = false
    @State private var uploadProgress: Double = 0
    @State private var errorMessage: String?
    
    var body: some View {
        NavigationStack {
            VStack(spacing: 20) {
                if isUploading {
                    VStack(spacing: 16) {
                        ProgressView(value: uploadProgress, total: 1.0)
                            .progressViewStyle(.linear)
                        Text("Uploading \(Int(uploadProgress * 100))%")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                    }
                    .padding()
                } else {
                    PhotosPicker(
                        selection: $selectedItems,
                        maxSelectionCount: 10,
                        matching: .images
                    ) {
                        VStack(spacing: 12) {
                            Image(systemName: "photo.on.rectangle.angled")
                                .font(.system(size: 60))
                                .foregroundColor(.accentColor)
                            Text("Select Photos")
                                .font(.headline)
                            Text("Choose up to 10 photos to upload")
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                        .frame(maxWidth: .infinity)
                        .padding(40)
                        .background(Color(.systemGray6))
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                    }
                    .padding()
                    
                    if !selectedItems.isEmpty {
                        VStack(alignment: .leading, spacing: 8) {
                            Text("\(selectedItems.count) photo\(selectedItems.count == 1 ? "" : "s") selected")
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                            
                            Button {
                                Task {
                                    await uploadImages()
                                }
                            } label: {
                                Text("Upload Photos")
                                    .font(.headline)
                                    .foregroundColor(.white)
                                    .frame(maxWidth: .infinity)
                                    .padding()
                                    .background(Color.accentColor)
                                    .clipShape(RoundedRectangle(cornerRadius: 12))
                            }
                        }
                        .padding()
                    }
                    
                    if let errorMessage {
                        Text(errorMessage)
                            .font(.caption)
                            .foregroundColor(.red)
                            .padding()
                    }
                }
                
                Spacer()
            }
            .navigationTitle("Upload Photos")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") {
                        dismiss()
                    }
                    .disabled(isUploading)
                }
            }
        }
    }
    
    private func uploadImages() async {
        isUploading = true
        errorMessage = nil
        uploadProgress = 0
        
        var uploadedImages: [DeviceImage] = []
        let totalItems = selectedItems.count
        
        for (index, item) in selectedItems.enumerated() {
            do {
                if let data = try await item.loadTransferable(type: Data.self) {
                    let uploadedImage = try await DeviceService.shared.uploadImage(deviceId: deviceId, imageData: data)
                    uploadedImages.append(uploadedImage)
                    uploadProgress = Double(index + 1) / Double(totalItems)
                }
            } catch {
                errorMessage = "Failed to upload some images: \(error.localizedDescription)"
                print("Failed to upload image: \(error)")
            }
        }
        
        isUploading = false
        
        if !uploadedImages.isEmpty {
            onUpload(uploadedImages)
            dismiss()
        }
    }
}
