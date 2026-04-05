//
//  ImageUploadView.swift
//  InventoryDifferent
//
//  Created by Michael Wottle on 2/3/26.
//

import SwiftUI
import PhotosUI
import UIKit

// MARK: - Camera Picker

struct CameraPickerView: UIViewControllerRepresentable {
    let onCapture: (Data) -> Void
    @Environment(\.dismiss) private var dismiss

    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }

    func makeUIViewController(context: Context) -> UIImagePickerController {
        let picker = UIImagePickerController()
        picker.sourceType = .camera
        picker.delegate = context.coordinator
        return picker
    }

    func updateUIViewController(_ uiViewController: UIImagePickerController, context: Context) {}

    class Coordinator: NSObject, UIImagePickerControllerDelegate, UINavigationControllerDelegate {
        let parent: CameraPickerView

        init(_ parent: CameraPickerView) {
            self.parent = parent
        }

        func imagePickerController(_ picker: UIImagePickerController, didFinishPickingMediaWithInfo info: [UIImagePickerController.InfoKey: Any]) {
            if let image = info[.originalImage] as? UIImage,
               let data = image.jpegData(compressionQuality: 0.9) {
                parent.onCapture(data)
            }
            parent.dismiss()
        }

        func imagePickerControllerDidCancel(_ picker: UIImagePickerController) {
            parent.dismiss()
        }
    }
}

// MARK: - Image Upload View

struct ImageUploadView: View {
    let deviceId: Int
    let onUpload: ([DeviceImage]) -> Void

    @EnvironmentObject var lm: LocalizationManager
    @Environment(\.dismiss) private var dismiss
    @State private var selectedItems: [PhotosPickerItem] = []
    @State private var isUploading = false
    @State private var uploadProgress: Double = 0
    @State private var errorMessage: String?
    @State private var showCamera = false

    var body: some View {
        let t = lm.t.imageUpload
        return NavigationStack {
            VStack(spacing: 20) {
                if isUploading {
                    VStack(spacing: 16) {
                        ProgressView(value: uploadProgress, total: 1.0)
                            .progressViewStyle(.linear)
                        Text(String(format: t.uploadingFmt, Int(uploadProgress * 100)))
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                    }
                    .padding()
                } else {
                    VStack(spacing: 16) {
                        // Camera option
                        Button {
                            showCamera = true
                        } label: {
                            VStack(spacing: 12) {
                                Image(systemName: "camera")
                                    .font(.system(size: 44))
                                    .foregroundColor(.accentColor)
                                Text(t.takePhoto)
                                    .font(.headline)
                                Text(t.takePhotoHint)
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                                    .multilineTextAlignment(.center)
                            }
                            .frame(maxWidth: .infinity)
                            .padding(32)
                            .background(Color(.systemGray6))
                            .clipShape(RoundedRectangle(cornerRadius: 12))
                        }

                        // Library option
                        PhotosPicker(
                            selection: $selectedItems,
                            maxSelectionCount: 10,
                            matching: .images
                        ) {
                            VStack(spacing: 12) {
                                Image(systemName: "photo.on.rectangle.angled")
                                    .font(.system(size: 44))
                                    .foregroundColor(.accentColor)
                                Text(t.chooseFromLibrary)
                                    .font(.headline)
                                Text(t.chooseFromLibraryHint)
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                            .frame(maxWidth: .infinity)
                            .padding(32)
                            .background(Color(.systemGray6))
                            .clipShape(RoundedRectangle(cornerRadius: 12))
                        }

                        if !selectedItems.isEmpty {
                            Button {
                                Task { await uploadSelectedItems() }
                            } label: {
                                Text(String(format: t.uploadPhotosFmt, selectedItems.count))
                                    .font(.headline)
                                    .foregroundColor(.white)
                                    .frame(maxWidth: .infinity)
                                    .padding()
                                    .background(Color.accentColor)
                                    .clipShape(RoundedRectangle(cornerRadius: 12))
                            }
                        }
                    }
                    .padding()

                    if let errorMessage {
                        Text(errorMessage)
                            .font(.caption)
                            .foregroundColor(.red)
                            .padding()
                    }
                }

                Spacer()
            }
            .navigationTitle(t.title)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button(t.cancel) { dismiss() }
                        .disabled(isUploading)
                }
            }
            .fullScreenCover(isPresented: $showCamera) {
                CameraPickerView { imageData in
                    Task { await uploadCameraPhoto(imageData) }
                }
                .ignoresSafeArea()
            }
        }
    }

    private func uploadCameraPhoto(_ data: Data) async {
        isUploading = true
        errorMessage = nil
        uploadProgress = 0

        do {
            let uploaded = try await DeviceService.shared.uploadImage(deviceId: deviceId, imageData: data)
            uploadProgress = 1.0
            isUploading = false
            onUpload([uploaded])
            dismiss()
        } catch {
            errorMessage = "Failed to upload photo: \(error.localizedDescription)"
            isUploading = false
        }
    }

    private func uploadSelectedItems() async {
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
