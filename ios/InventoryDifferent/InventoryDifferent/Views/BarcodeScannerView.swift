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
    @State private var foundLocationId: Int?
    @State private var selectedTab = 0

    @State private var showNotFoundSheet = false
    @State private var showAddDevice = false
    @State private var notFoundSerial = ""
    @State private var decodedModelName: String?
    @State private var decodedFactory: String?
    @State private var decodedYear: Int?
    @State private var matchedTemplateId: Int?
    @State private var cameraActive = true

    private var scanFrameSize: CGFloat {
        let base = min(UIScreen.main.bounds.width, UIScreen.main.bounds.height)
        return max(220, min(340, base * 0.7))
    }
    
    var body: some View {
        let t = lm.t
        return NavigationStack {
            ZStack {
                // Camera preview
                BarcodeScannerPreview(onCodeScanned: handleScannedCode, isActive: $cameraActive)
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
                DeviceDetailRedesignScreen(deviceId: device.id)
            }
            .navigationDestination(item: $foundLocationId) { locationId in
                LocationDetailView(locationId: locationId)
            }
            .sheet(isPresented: $showNotFoundSheet, onDismiss: {
                if !showAddDevice {
                    cameraActive = true
                }
            }) {
                NotFoundSheet(
                    serial: notFoundSerial,
                    modelName: decodedModelName,
                    factory: decodedFactory,
                    year: decodedYear,
                    onAddDevice: {
                        showNotFoundSheet = false
                        DispatchQueue.main.asyncAfter(deadline: .now() + 0.35) {
                            showAddDevice = true
                        }
                    },
                    onAddDeviceUnmatched: {
                        matchedTemplateId = nil
                        decodedModelName = nil
                        decodedFactory = nil
                        decodedYear = nil
                        showNotFoundSheet = false
                        DispatchQueue.main.asyncAfter(deadline: .now() + 0.35) {
                            showAddDevice = true
                        }
                    },
                    onScanAgain: {
                        showNotFoundSheet = false
                        cameraActive = true
                    }
                )
                .environmentObject(lm)
                .presentationDetents([.medium])
                .presentationDragIndicator(.visible)
            }
            .sheet(isPresented: $showAddDevice, onDismiss: {
                cameraActive = true
                isSearching = false
            }) {
                AddDeviceView(
                    prefillTemplateId: matchedTemplateId,
                    prefillSerialNumber: notFoundSerial,
                    prefillName: matchedTemplateId == nil ? decodedModelName : nil,
                    prefillManufacturer: matchedTemplateId == nil && decodedModelName != nil ? "Apple" : nil
                )
                .environmentObject(deviceStore)
                .environmentObject(lm)
            }
            .onAppear {
                // Restart camera when view (re)appears, e.g. after navigating back from device detail
                cameraActive = true
                isSearching = false
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
        cameraActive = false
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
                if let match = path.range(of: #"/locations/(\d+)"#, options: .regularExpression) {
                    let idString = path[match].replacingOccurrences(of: "/locations/", with: "")
                    print("[Scanner] Found location ID string: \(idString)")
                    if let id = Int(idString), id > 0 {
                        print("[Scanner] Navigating to location: \(id)")
                        await MainActor.run {
                            isSearching = false
                            foundLocationId = id
                        }
                        return
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
        let decoded = AppleSerialDecoder.decode(serialNumber)
        var modelName: String? = nil
        var factory: String? = nil
        var year: Int? = nil
        switch decoded {
        case .vintage(let r):
            modelName = r.modelName
            factory = r.factory
            year = r.year
        case .modern(let r):
            modelName = r.modelName
        default:
            break
        }
        let templateId = modelName != nil ? await findMatchingTemplate(modelName: modelName!) : nil
        await MainActor.run {
            isSearching = false
            notFoundSerial = serialNumber
            decodedModelName = modelName
            decodedFactory = factory
            decodedYear = year
            matchedTemplateId = templateId
            showNotFoundSheet = true
        }
    }
    
    private func findMatchingTemplate(modelName: String) async -> Int? {
        let query = """
        query GetTemplates {
            templates {
                id
                name
                additionalName
            }
        }
        """
        struct TemplateStub: Decodable {
            let id: Int
            let name: String
            let additionalName: String?
        }
        struct Response: Decodable {
            let templates: [TemplateStub]
        }
        guard let response = try? await APIService.shared.execute(
            query: query,
            variables: [:]
        ) as Response else { return nil }

        let needle = modelName.lowercased()
        // Strip parenthetical suffixes for a broader match: "Apple IIgs (ROM 01)" -> "apple iigs"
        let needleStripped = needle.replacingOccurrences(of: #"\s*\(.*?\)"#, with: "", options: .regularExpression)

        // Normalized form: remove spaces + treat "mac"/"macintosh" as equivalent.
        // Handles "Power Mac G3 Minitower" (decoder) matching "Power Macintosh G3 MiniTower" (template).
        func normKey(_ s: String) -> String {
            s.lowercased()
             .replacingOccurrences(of: "macintosh", with: "mac")
             .components(separatedBy: .whitespacesAndNewlines).joined()
        }
        let normNeedle = normKey(needleStripped)

        return response.templates.first(where: { t in
            let haystack = t.name.lowercased()
            let haystackAlt = (t.additionalName ?? "").lowercased()
            let normHaystack = normKey(t.name)
            let normHaystackAlt = normKey(t.additionalName ?? "")
            return haystack.contains(needle) || needle.contains(haystack)
                || haystack.contains(needleStripped) || needleStripped.contains(haystack)
                || normHaystack.contains(normNeedle) || normNeedle.contains(normHaystack)
                || (!haystackAlt.isEmpty && (haystackAlt.contains(needle) || needle.contains(haystackAlt)))
                || (!normHaystackAlt.isEmpty && (normHaystackAlt.contains(normNeedle) || normNeedle.contains(normHaystackAlt)))
        })?.id
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
            devices(where: { serialNumber: { equals: $serialNumber }, deleted: { equals: false } }) {
                id
                name
                additionalName
                manufacturer
                modelNumber
                serialNumber
                releaseYear
                location { id name }
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
                cpuType
                cpuSpeed
                ram
                graphicsChip
                screenSize
                displayType
                displayVariant
                nativeResolution
                storageEntries { id value sortOrder }
                osEntries { id value sortOrder }
                isWifiEnabled
                isRetroBrited
                isRecapped
                pramBatteryInstalled
                pramBatteryExpiryDate
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
                    thumbnailMode
                    isListingImage
                    mediaType
                    duration
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
                    cost
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
            let devices: [Device]
        }

        do {
            print("[Scanner] Executing serial number query for: \(serialNumber)")
            let response: Response = try await APIService.shared.execute(
                query: query,
                variables: ["serialNumber": serialNumber]
            )
            print("[Scanner] Serial query response - device: \(response.devices.first?.name ?? "nil")")
            return response.devices.first
        } catch {
            print("[Scanner] Serial query error: \(error)")
            return nil
        }
    }
}

// MARK: - Camera Preview

struct BarcodeScannerPreview: UIViewRepresentable {
    let onCodeScanned: (String) -> Void
    @Binding var isActive: Bool

    init(onCodeScanned: @escaping (String) -> Void, isActive: Binding<Bool> = .constant(true)) {
        self.onCodeScanned = onCodeScanned
        self._isActive = isActive
    }

    func makeUIView(context: Context) -> CameraPreviewView {
        let view = CameraPreviewView()
        view.onCodeScanned = onCodeScanned
        return view
    }

    func updateUIView(_ uiView: CameraPreviewView, context: Context) {
        if isActive {
            uiView.startSession()
        } else {
            uiView.stopSession()
        }
    }
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
    
    func startSession() {
        guard !(captureSession?.isRunning ?? false) else { return }
        DispatchQueue.global(qos: .userInitiated).async {
            self.captureSession?.startRunning()
        }
    }

    func stopSession() {
        guard captureSession?.isRunning ?? false else { return }
        DispatchQueue.global(qos: .background).async {
            self.captureSession?.stopRunning()
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
