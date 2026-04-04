//
//  BarcodeScannerView.swift
//  InventoryDifferent
//
//  Created by Michael Wottle on 2/2/26.
//

import SwiftUI
import AVFoundation

struct BarcodeScannerView: View {
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject var deviceStore: DeviceStore
    @EnvironmentObject var lm: LocalizationManager
    
    @State private var scannedCode: String?
    @State private var isSearching = false
    @State private var errorMessage: String?
    @State private var foundDevice: Device?
    @State private var selectedTab = 0

    private var scanFrameSize: CGFloat {
        let base = min(UIScreen.main.bounds.width, UIScreen.main.bounds.height)
        return max(220, min(340, base * 0.7))
    }
    
    var body: some View {
        let t = lm.t
        return NavigationStack {
            ZStack {
                // Camera preview
                BarcodeScannerPreview(onCodeScanned: handleScannedCode)
                    .ignoresSafeArea()
                
                // Overlay
                VStack {
                    Spacer()
                    
                    // Scanning frame indicator
                    RoundedRectangle(cornerRadius: 12)
                        .stroke(Color.white, lineWidth: 3)
                        .frame(width: scanFrameSize, height: scanFrameSize)
                        .background(Color.clear)
                    
                    Spacer()
                    
                    // Status area
                    VStack(spacing: 12) {
                        if isSearching {
                            ProgressView()
                                .progressViewStyle(CircularProgressViewStyle(tint: .white))
                            Text(t.barcodeScanner.lookingUp)
                                .foregroundColor(.white)
                        } else if let error = errorMessage {
                            Text(error)
                                .foregroundColor(.red)
                                .multilineTextAlignment(.center)
                                .padding(.horizontal)
                        } else {
                            Text(t.barcodeScanner.pointCamera)
                                .foregroundColor(.white)
                        }
                    }
                    .padding()
                    .background(Color.black.opacity(0.7))
                    .cornerRadius(12)
                    .padding(.bottom, 40)
                }
            }
            .navigationTitle(t.barcodeScanner.title)
            .navigationBarTitleDisplayMode(.inline)
            .toolbarBackground(.visible, for: .navigationBar)
            .toolbarBackground(Color.black.opacity(0.8), for: .navigationBar)
            .toolbarColorScheme(.dark, for: .navigationBar)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button(t.barcodeScanner.cancel) {
                        dismiss()
                    }
                    .foregroundColor(.white)
                }
            }
            .navigationDestination(item: $foundDevice) { device in
                DeviceDetailView(
                    device: device,
                    selectedTab: $selectedTab,
                    onDeviceChanged: { updatedDevice in
                        foundDevice = updatedDevice
                    },
                    onDeviceDeleted: {
                        foundDevice = nil
                        dismiss()
                    }
                )
            }
        }
    }
    
    private func handleScannedCode(_ code: String) {
        print("[Scanner] handleScannedCode called with: \(code)")
        guard !isSearching else {
            print("[Scanner] Already searching, ignoring")
            return
        }
        
        scannedCode = code
        isSearching = true
        errorMessage = nil
        
        Task {
            await lookupDevice(code: code)
        }
    }
    
    private func lookupDevice(code: String) async {
        let code = code.trimmingCharacters(in: .whitespacesAndNewlines)
        print("[Scanner] lookupDevice called with: \(code)")
        
        // First, try to parse as a URL with /devices/<id> pattern
        if let url = URL(string: code) {
            print("[Scanner] Parsed as URL: \(url)")
            print("[Scanner] URL path: \(url.path)")
            print("[Scanner] URL fragment: \(url.fragment ?? "nil")")
            
            var pathsToCheck = [url.path]
            
            // Also check hash fragment for #!/devices/123 style URLs
            if let fragment = url.fragment, fragment.hasPrefix("!") {
                let hashPath = String(fragment.dropFirst())
                if !hashPath.isEmpty {
                    pathsToCheck.append(hashPath)
                    print("[Scanner] Added hash path: \(hashPath)")
                }
            }
            
            for path in pathsToCheck {
                print("[Scanner] Checking path: \(path)")
                if let match = path.range(of: #"/devices/(\d+)"#, options: .regularExpression) {
                    let idString = path[match].replacingOccurrences(of: "/devices/", with: "")
                    print("[Scanner] Found device ID string: \(idString)")
                    if let id = Int(idString), id > 0 {
                        print("[Scanner] Looking up device by ID: \(id)")
                        if let device = await fetchDevice(id: id) {
                            print("[Scanner] Found device: \(device.name)")
                            await MainActor.run {
                                isSearching = false
                                foundDevice = device
                            }
                            return
                        } else {
                            print("[Scanner] Device not found for ID: \(id)")
                        }
                    }
                }
            }
        } else {
            print("[Scanner] Not a valid URL, treating as serial number")
        }
        
        // Try to find device by serial number
        let serialNumber = code.trimmingCharacters(in: .whitespacesAndNewlines)
        print("[Scanner] Trying serial number lookup: \(serialNumber)")
        
        if serialNumber.isEmpty {
            print("[Scanner] Serial number is empty")
            await MainActor.run {
                isSearching = false
                errorMessage = lm.t.barcodeScanner.scannedEmpty
            }
            return
        }
        
        if let device = await fetchDeviceBySerial(serialNumber: serialNumber) {
            print("[Scanner] Found device by serial: \(device.name)")
            await MainActor.run {
                isSearching = false
                foundDevice = device
            }
            return
        }
        
        print("[Scanner] No device found for: \(serialNumber)")
        // Not found
        await MainActor.run {
            isSearching = false
            errorMessage = lm.t.barcodeScanner.notFound + serialNumber
        }
        
        // Reset after delay to allow scanning again
        try? await Task.sleep(nanoseconds: 2_000_000_000)
        await MainActor.run {
            errorMessage = nil
        }
    }
    
    private func fetchDevice(id: Int) async -> Device? {
        print("[Scanner] fetchDevice called for ID: \(id)")
        do {
            let device = try await DeviceService.shared.fetchDevice(id: id)
            print("[Scanner] fetchDevice success: \(device?.name ?? "nil")")
            return device
        } catch {
            print("[Scanner] fetchDevice error: \(error)")
            return nil
        }
    }
    
    private func fetchDeviceBySerial(serialNumber: String) async -> Device? {
        let query = """
        query GetDeviceBySerial($serialNumber: String!) {
            device(where: { serialNumber: { equals: $serialNumber }, deleted: { equals: false } }) {
                id
                name
                additionalName
                manufacturer
                modelNumber
                serialNumber
                releaseYear
                location
                info
                isFavorite
                status
                functionalStatus
                lastPowerOnDate
                isAssetTagged
                dateAcquired
                whereAcquired
                priceAcquired
                estimatedValue
                listPrice
                soldPrice
                soldDate
                cpu
                ram
                graphics
                storage
                operatingSystem
                isWifiEnabled
                isPramBatteryRemoved
                category {
                    id
                    name
                    type
                    sortOrder
                }
                images {
                    id
                    path
                    thumbnailPath
                    dateTaken
                    caption
                    isShopImage
                    isThumbnail
                    isListingImage
                }
                notes {
                    id
                    content
                    date
                }
                maintenanceTasks {
                    id
                    label
                    dateCompleted
                    notes
                }
                tags {
                    id
                    name
                }
                customFieldValues {
                    id
                    customFieldId
                    customFieldName
                    value
                    isPublic
                    sortOrder
                }
                accessories { id name }
                links { id label url }
            }
        }
        """
        
        struct Response: Decodable {
            let device: Device?
        }
        
        do {
            print("[Scanner] Executing serial number query for: \(serialNumber)")
            let response: Response = try await APIService.shared.execute(
                query: query,
                variables: ["serialNumber": serialNumber]
            )
            print("[Scanner] Serial query response - device: \(response.device?.name ?? "nil")")
            return response.device
        } catch {
            print("[Scanner] Serial query error: \(error)")
            return nil
        }
    }
}

// MARK: - Camera Preview

struct BarcodeScannerPreview: UIViewRepresentable {
    let onCodeScanned: (String) -> Void
    
    func makeUIView(context: Context) -> CameraPreviewView {
        let view = CameraPreviewView()
        view.onCodeScanned = onCodeScanned
        return view
    }
    
    func updateUIView(_ uiView: CameraPreviewView, context: Context) {}
}

class CameraPreviewView: UIView {
    var onCodeScanned: ((String) -> Void)?
    
    private var captureSession: AVCaptureSession?
    private var previewLayer: AVCaptureVideoPreviewLayer?
    private var lastScannedCode: String?
    private var lastScanTime: Date?
    
    override init(frame: CGRect) {
        super.init(frame: frame)
        setupCamera()
    }
    
    required init?(coder: NSCoder) {
        super.init(coder: coder)
        setupCamera()
    }
    
    override func layoutSubviews() {
        super.layoutSubviews()
        previewLayer?.frame = bounds
    }
    
    private func setupCamera() {
        let session = AVCaptureSession()
        captureSession = session
        
        // Try to get the triple  camera first, then fall back to dual camera, finally wide angle.
        let discoverySession = AVCaptureDevice.DiscoverySession(
            deviceTypes: [.builtInTripleCamera, .builtInDualCamera, .builtInWideAngleCamera],
            mediaType: .video,
            position: .back
        )

        guard let videoCaptureDevice = discoverySession.devices.first else { return }

        
        // Configure camera for close-up focus (macro mode for barcodes/QR codes)
        do {
            try videoCaptureDevice.lockForConfiguration()
            
            // Set autofocus range restriction to near for close-up scanning
            // This must be set BEFORE setting focus mode
            if videoCaptureDevice.isAutoFocusRangeRestrictionSupported {
                videoCaptureDevice.autoFocusRangeRestriction = .near
                print("[Scanner] Set autofocus range to near")
            }
            
            // Enable continuous autofocus
            if videoCaptureDevice.isFocusModeSupported(.continuousAutoFocus) {
                videoCaptureDevice.focusMode = .continuousAutoFocus
                print("[Scanner] Set continuous autofocus")
            }
            
            // Smooth autofocus for better tracking
            if videoCaptureDevice.isSmoothAutoFocusSupported {
                videoCaptureDevice.isSmoothAutoFocusEnabled = true
            }
            
            videoCaptureDevice.unlockForConfiguration()
        } catch {
            print("[Scanner] Could not configure camera focus: \(error)")
        }
        
        guard let videoInput = try? AVCaptureDeviceInput(device: videoCaptureDevice) else {
            return
        }
        
        if session.canAddInput(videoInput) {
            session.addInput(videoInput)
        }
        
        let metadataOutput = AVCaptureMetadataOutput()
        
        if session.canAddOutput(metadataOutput) {
            session.addOutput(metadataOutput)
            
            metadataOutput.setMetadataObjectsDelegate(self, queue: DispatchQueue.main)
            metadataOutput.metadataObjectTypes = [
                .qr,
                .ean8,
                .ean13,
                .code128,
                .code39,
                .code93,
                .upce,
                .pdf417,
                .aztec,
                .dataMatrix
            ]
        }
        
        let previewLayer = AVCaptureVideoPreviewLayer(session: session)
        previewLayer.frame = bounds
        previewLayer.videoGravity = .resizeAspectFill
        layer.addSublayer(previewLayer)
        self.previewLayer = previewLayer
        
        DispatchQueue.global(qos: .userInitiated).async {
            session.startRunning()
        }
    }
    
    deinit {
        captureSession?.stopRunning()
    }
}

extension CameraPreviewView: AVCaptureMetadataOutputObjectsDelegate {
    func metadataOutput(_ output: AVCaptureMetadataOutput, didOutput metadataObjects: [AVMetadataObject], from connection: AVCaptureConnection) {
        guard let metadataObject = metadataObjects.first as? AVMetadataMachineReadableCodeObject,
              let code = metadataObject.stringValue else {
            return
        }
        
        // Debounce: don't scan same code within 2 seconds
        let now = Date()
        if let lastCode = lastScannedCode,
           let lastTime = lastScanTime,
           lastCode == code,
           now.timeIntervalSince(lastTime) < 2.0 {
            return
        }
        
        lastScannedCode = code
        lastScanTime = now
        
        // Haptic feedback
        let generator = UINotificationFeedbackGenerator()
        generator.notificationOccurred(.success)
        
        print("[Scanner] Camera detected code: \(code)")
        onCodeScanned?(code)
    }
}

#Preview {
    BarcodeScannerView()
        .environmentObject(DeviceStore())
}
