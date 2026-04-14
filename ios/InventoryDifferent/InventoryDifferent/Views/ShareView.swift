//
//  ShareView.swift
//  InventoryDifferent
//
//  Created by Michael Wottle on 2/3/26.
//

import SwiftUI
import CoreImage.CIFilterBuiltins

struct ShareView: View {
    let device: Device
    @Environment(\.dismiss) private var dismiss
    
    @State private var selectedTab: ShareTab = .link
    @State private var copied = false
    @State private var assetTagSaved = false
    
    enum ShareTab {
        case link
        case assetTag
    }
    
    private var deviceUrl: String {
        let baseURL = APIService.shared.getBaseURL()
        return "\(baseURL)/devices/\(device.id)"
    }
    
    private var displayName: String {
        if let additional = device.additionalName, !additional.isEmpty {
            return "\(device.name) \(additional)"
        }
        return device.name
    }
    
    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                Picker("Tab", selection: $selectedTab) {
                    Text("Share Link").tag(ShareTab.link)
                    Text("Asset Tag").tag(ShareTab.assetTag)
                }
                .pickerStyle(.segmented)
                .padding()
                
                if selectedTab == .link {
                    shareLinkView
                } else {
                    assetTagView
                }
            }
            .navigationTitle("Share")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
        }
    }
    
    private var shareLinkView: some View {
        ScrollView {
            VStack(spacing: 24) {
                VStack(alignment: .leading, spacing: 8) {
                    Text("Device Link")
                        .font(.headline)
                    
                    HStack {
                        Text(deviceUrl)
                            .font(.caption)
                            .foregroundColor(.secondary)
                            .lineLimit(2)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .padding()
                            .background(Color(.systemGray6))
                            .clipShape(RoundedRectangle(cornerRadius: 8))
                        
                        Button {
                            UIPasteboard.general.string = deviceUrl
                            copied = true
                            DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
                                copied = false
                            }
                        } label: {
                            Text(copied ? "Copied!" : "Copy")
                                .font(.subheadline)
                                .fontWeight(.medium)
                                .foregroundColor(.white)
                                .padding(.horizontal, 16)
                                .padding(.vertical, 12)
                                .background(copied ? Color.green : Color.accentColor)
                                .clipShape(RoundedRectangle(cornerRadius: 8))
                        }
                    }
                }
                .padding(.horizontal)
                
                VStack(alignment: .leading, spacing: 12) {
                    Text("Share Via")
                        .font(.headline)
                        .padding(.horizontal)
                    
                    Button {
                        shareViaActivitySheet()
                    } label: {
                        HStack {
                            Image(systemName: "square.and.arrow.up")
                                .font(.title3)
                            Text("Share via iOS Share Sheet")
                                .font(.body)
                            Spacer()
                            Image(systemName: "chevron.right")
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                        .foregroundColor(.primary)
                        .padding()
                        .background(Color(.systemGray6))
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                    }
                    .padding(.horizontal)
                }
                
                Spacer()
            }
            .padding(.vertical)
        }
    }
    
    private var assetTagView: some View {
        ScrollView {
            VStack(spacing: 24) {
                VStack(spacing: 16) {
                    Text("Asset Tag Preview")
                        .font(.headline)
                    
                    assetTagPreview
                        .padding()
                        .background(Color.white)
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                        .shadow(color: .black.opacity(0.1), radius: 4, x: 0, y: 2)
                        .padding(.horizontal)
                    
                    Text("Optimized for 24mm label tape")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                
                VStack(spacing: 12) {
                    Button {
                        saveAssetTagToPhotos()
                    } label: {
                        HStack {
                            Image(systemName: assetTagSaved ? "checkmark" : "square.and.arrow.down")
                            Text(assetTagSaved ? "Saved to Photos!" : "Save to Photos")
                        }
                        .font(.body)
                        .fontWeight(.medium)
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(assetTagSaved ? Color.green : Color.accentColor)
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                    }
                    .padding(.horizontal)
                    
                    Button {
                        shareAssetTag()
                    } label: {
                        HStack {
                            Image(systemName: "square.and.arrow.up")
                            Text("Share Asset Tag")
                        }
                        .font(.body)
                        .fontWeight(.medium)
                        .foregroundColor(.primary)
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color(.systemGray6))
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                    }
                    .padding(.horizontal)
                }
                
                Spacer()
            }
            .padding(.vertical)
        }
    }
    
    private var assetTagPreview: some View {
        HStack(spacing: 8) {
            if let qrImage = generateQRCode(from: deviceUrl) {
                Image(uiImage: qrImage)
                    .interpolation(.none)
                    .resizable()
                    .frame(width: 80, height: 80)
            }
            
            VStack(alignment: .leading, spacing: 4) {
                Text(device.name)
                    .font(.custom("EBGaramond-Bold", size: 32))
                    .foregroundColor(.black).minimumScaleFactor(0.3)
                    .lineLimit(1)
                
                if let additional = device.additionalName, !additional.isEmpty {
                    Text(additional)
                        .font(.custom("EBGaramond-Bold", size: 16))
                        .foregroundColor(.gray)
                        .lineLimit(1)
                }
                
                Text("ID: \(device.id)")
                    .font(.custom("EBGaramond-Regular", size: 14))
                    .foregroundColor(.gray)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .padding()
    }
    
    private func generateQRCode(from string: String) -> UIImage? {
        let context = CIContext()
        let filter = CIFilter.qrCodeGenerator()
        
        filter.message = Data(string.utf8)
        filter.correctionLevel = "M"
        
        if let outputImage = filter.outputImage {
            let transform = CGAffineTransform(scaleX: 10, y: 10)
            let scaledImage = outputImage.transformed(by: transform)
            
            if let cgImage = context.createCGImage(scaledImage, from: scaledImage.extent) {
                return UIImage(cgImage: cgImage)
            }
        }
        
        return nil
    }
    
    private func generateAssetTagImage() -> UIImage? {
        let width: CGFloat = 900
        let height: CGFloat = 282
        
        let renderer = UIGraphicsImageRenderer(size: CGSize(width: width, height: height))
        
        return renderer.image { context in
            UIColor.white.setFill()
            context.fill(CGRect(x: 0, y: 0, width: width, height: height))
            
            if let qrImage = generateQRCode(from: deviceUrl) {
                let qrSize: CGFloat = height - 40
                let qrX: CGFloat = 20
                let qrY: CGFloat = (height - qrSize) / 2
                qrImage.draw(in: CGRect(x: qrX, y: qrY, width: qrSize, height: qrSize))
                
                let textX = qrX + qrSize + 30
                let maxTextWidth = width - textX - 20
                
                let nameFont = UIFont(name: "EBGaramond-Bold", size: 72) ?? UIFont.systemFont(ofSize: 72, weight: .bold)
                let nameAttributes: [NSAttributedString.Key: Any] = [
                    .font: nameFont,
                    .foregroundColor: UIColor.black
                ]
                let nameRect = CGRect(x: textX, y: height * 0.25, width: maxTextWidth, height: 100)
                device.name.draw(in: nameRect, withAttributes: nameAttributes)
                
                if let additional = device.additionalName, !additional.isEmpty {
                    let additionalFont = UIFont(name: "EBGaramond-Bold", size: 48) ?? UIFont.systemFont(ofSize: 48, weight: .medium)
                    let additionalAttributes: [NSAttributedString.Key: Any] = [
                        .font: additionalFont,
                        .foregroundColor: UIColor.darkGray
                    ]
                    let additionalRect = CGRect(x: textX, y: height * 0.25 + 80, width: maxTextWidth, height: 60)
                    additional.draw(in: additionalRect, withAttributes: additionalAttributes)
                }
                
                let idFont = UIFont(name: "EBGaramond-Regular", size: 36) ?? UIFont.systemFont(ofSize: 36)
                let idAttributes: [NSAttributedString.Key: Any] = [
                    .font: idFont,
                    .foregroundColor: UIColor.gray
                ]
                let idText = "ID: \(device.id)"
                let idRect = CGRect(x: textX, y: height - 60, width: maxTextWidth, height: 50)
                idText.draw(in: idRect, withAttributes: idAttributes)
            }
        }
    }
    
    private func shareViaActivitySheet() {
        let text = "Check out this \(displayName)"
        let items: [Any] = [text, URL(string: deviceUrl)!]
        
        let activityVC = UIActivityViewController(activityItems: items, applicationActivities: nil)
        
        if let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
           let rootVC = windowScene.windows.first?.rootViewController {
            var topVC = rootVC
            while let presented = topVC.presentedViewController {
                topVC = presented
            }
            
            if let popover = activityVC.popoverPresentationController {
                popover.sourceView = topVC.view
                popover.sourceRect = CGRect(x: topVC.view.bounds.midX, y: topVC.view.bounds.midY, width: 0, height: 0)
                popover.permittedArrowDirections = []
            }
            
            topVC.present(activityVC, animated: true)
        }
    }
    
    private func saveAssetTagToPhotos() {
        guard let image = generateAssetTagImage() else { return }
        UIImageWriteToSavedPhotosAlbum(image, nil, nil, nil)
        assetTagSaved = true
        DispatchQueue.main.asyncAfter(deadline: .now() + 3) {
            assetTagSaved = false
        }
    }
    
    private func shareAssetTag() {
        guard let image = generateAssetTagImage() else { return }
        
        let activityVC = UIActivityViewController(activityItems: [image], applicationActivities: nil)
        
        if let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
           let rootVC = windowScene.windows.first?.rootViewController {
            var topVC = rootVC
            while let presented = topVC.presentedViewController {
                topVC = presented
            }
            
            if let popover = activityVC.popoverPresentationController {
                popover.sourceView = topVC.view
                popover.sourceRect = CGRect(x: topVC.view.bounds.midX, y: topVC.view.bounds.midY, width: 0, height: 0)
                popover.permittedArrowDirections = []
            }
            
            topVC.present(activityVC, animated: true)
        }
    }
}

#Preview {
    ShareView(device: Device(
        id: 123,
        name: "Macintosh SE",
        additionalName: "FDHD",
        manufacturer: "Apple",
        modelNumber: "M5011",
        serialNumber: "ABC123",
        releaseYear: 1987,
        location: LocationRef(id: 1, name: "Shelf A"),
        info: nil,
        historicalNotes: nil,
        searchText: nil,
        isFavorite: true,
        status: .COLLECTION,
        functionalStatus: .YES,
        condition: nil,
        rarity: nil,
        lastPowerOnDate: nil,
        isAssetTagged: true,
        dateAcquired: nil,
        whereAcquired: nil,
        priceAcquired: nil,
        estimatedValue: nil,
        listPrice: nil,
        soldPrice: nil,
        soldDate: nil,
        cpu: nil,
        ram: nil,
        graphics: nil,
        storage: nil,
        operatingSystem: nil,
        isWifiEnabled: nil,
        isPramBatteryRemoved: nil,
        category: Category(id: 1, name: "Compact Macs", type: "COMPUTER", sortOrder: 1),
        images: [],
        notes: [],
        maintenanceTasks: [],
        tags: [],
        customFieldValues: [],
        accessories: [],
        links: []
    ))
}
