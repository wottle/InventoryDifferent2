//
//  DeviceDetailView.swift
//  InventoryDifferent
//
//  Created by Michael Wottle on 2/2/26.
//

import SwiftUI
import Charts

struct ImageIndex: Identifiable {
    let id = UUID()
    let value: Int
}

struct DeviceDetailScreen: View {
    let deviceId: Int
    @EnvironmentObject var deviceStore: DeviceStore
    @Environment(\.dismiss) private var dismiss

    @State private var device: Device?
    @State private var isLoading = true
    @State private var error: String?
    @State private var selectedTab = 0

    var body: some View {
        Group {
            if isLoading {
                ProgressView("Loading device...")
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else if let error {
                VStack(spacing: 16) {
                    Image(systemName: "exclamationmark.triangle")
                        .font(.largeTitle)
                        .foregroundColor(.orange)
                    Text("Error loading device")
                        .font(.headline)
                    Text(error)
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .multilineTextAlignment(.center)
                    Button("Retry") {
                        Task { await load(force: true) }
                    }
                    .buttonStyle(.borderedProminent)
                }
                .padding()
            } else if let device {
                DeviceDetailView(
                    device: device,
                    selectedTab: $selectedTab,
                    onDeviceChanged: { updatedDevice in
                        print("[DeviceDetailScreen] onDeviceChanged called - name: \(updatedDevice.name), isPramBatteryRemoved: \(String(describing: updatedDevice.isPramBatteryRemoved))")
                        self.device = updatedDevice
                        Task {
                            print("[DeviceDetailScreen] Calling deviceStore.loadDevices()")
                            await deviceStore.loadDevices()
                            print("[DeviceDetailScreen] deviceStore.loadDevices() completed")
                        }
                    },
                    onDeviceDeleted: {
                        print("[DeviceDetailScreen] onDeviceDeleted called")
                        Task {
                            await deviceStore.loadDevices()
                        }
                        dismiss()
                    }
                )
            } else {
                ContentUnavailableView {
                    Label("Device not found", systemImage: "desktopcomputer")
                }
            }
        }
        .task(id: deviceId) {
            await load(force: false)
        }
    }

    private func load(force: Bool) async {
        if !force, device != nil { return }

        isLoading = true
        error = nil

        do {
            let fetched = try await Task.detached(priority: .userInitiated) {
                try await DeviceService.shared.fetchDevice(id: deviceId)
            }.value
            device = fetched
        } catch {
            self.error = error.localizedDescription
        }

        isLoading = false
    }
}

struct DeviceDetailView: View {
    let deviceId: Int
    @Binding var selectedTab: Int
    let onDeviceChanged: ((Device) -> Void)?
    let onDeviceDeleted: (() -> Void)?
    @EnvironmentObject var authService: AuthService
    @Environment(\.dismiss) private var dismiss
    
    @State private var device: Device
    @State private var images: [DeviceImage]
    
    @State private var showAddTaskSheet = false
    @State private var maintenanceTasks: [MaintenanceTask]
    @State private var isDeletingTask = false
    
    @State private var showAddNoteSheet = false
    @State private var showEditNoteSheet = false
    @State private var editingNote: Note?
    @State private var notes: [Note]
    @State private var isDeletingNote = false

    @State private var tags: [Tag]
    @State private var showAddTagSheet = false
    @State private var tagToRemove: Tag?
    @State private var showRemoveTagAlert = false

    @State private var showEditDeviceSheet = false
    @State private var showShareSheet = false
    @State private var showDeleteAlert = false
    @State private var isDeletingDevice = false
    
    @State private var selectedImageIndex: ImageIndex?
    @State private var showImagePicker = false
    @State private var isImageManagementMode = false
    @State private var imageToDelete: DeviceImage?
    @State private var showDeleteImageAlert = false
    
    @State private var isTogglingFavorite = false
    @State private var isUpdatingPowerDate = false
    @State private var isUpdatingStatus = false
    @State private var showMarkSoldSheet = false
    @State private var showMarkForSaleSheet = false
    @State private var quickActionSourceTab: Int? = nil

    @State private var valueSnapshots: [ValueSnapshot] = []
    
    init(device: Device, selectedTab: Binding<Int>, onDeviceChanged: ((Device) -> Void)? = nil, onDeviceDeleted: (() -> Void)? = nil) {
        self.deviceId = device.id
        self._device = State(initialValue: device)
        self._selectedTab = selectedTab
        self.onDeviceChanged = onDeviceChanged
        self.onDeviceDeleted = onDeviceDeleted
        self._maintenanceTasks = State(initialValue: device.maintenanceTasks)
        self._notes = State(initialValue: device.notes)
        self._images = State(initialValue: device.images)
        self._tags = State(initialValue: device.tags)
    }
    
    var body: some View {
        Group {
            switch selectedTab {
            case 0:
                ScrollView {
                    VStack(spacing: 0) {
                        // Hero Image
                        heroImage

                        // Device Info Header
                        deviceHeader
                            .padding(.horizontal)
                            .padding(.bottom)
                            .padding(.top, -54)

                        if authService.isAuthenticated {
                            quickActionsRow
                                .padding(.horizontal)
                                .padding(.bottom, 8)
                        }

                        detailsSection
                            .padding()
                            .padding(.bottom, 80)
                    }
                }
                .ignoresSafeArea(edges: .top)
            case 1:
                ScrollView {
                    photosSection
                        .padding()
                        .padding(.bottom, 80)
                }
            case 2:
                ScrollView {
                    tasksSection
                        .padding()
                        .padding(.bottom, 80)
                }
            case 3:
                ScrollView {
                    notesSection
                        .padding()
                        .padding(.bottom, 80)
                }
            default:
                EmptyView()
            }
        }
        .navigationTitle(device.name)
        .navigationBarTitleDisplayMode(.inline)
        .toolbarBackground(.hidden, for: .navigationBar)
        .toolbar {
            if( selectedTab == 0 || authService.isAuthenticated ) {
                
                ToolbarItem(placement: .navigationBarTrailing) {
                    HStack(spacing: 12) {
                        if selectedTab == 0 {
                            Button {
                                showShareSheet = true
                            } label: {
                                Image(systemName: "square.and.arrow.up")
                            }
                            
                            if authService.isAuthenticated {
                                Button {
                                    showEditDeviceSheet = true
                                } label: {
                                    Image(systemName: "pencil")
                                }
                            }
                        } else if selectedTab == 1 && authService.isAuthenticated {
                            Button {
                                isImageManagementMode.toggle()
                            } label: {
                                Text(isImageManagementMode ? "Done" : "Manage")
                            }
                            
                            Button {
                                showImagePicker = true
                            } label: {
                                Image(systemName: "plus")
                            }
                        } else if selectedTab == 2 && authService.isAuthenticated {
                            Button {
                                showAddTaskSheet = true
                            } label: {
                                Image(systemName: "plus")
                            }
                        } else if selectedTab == 3 && authService.isAuthenticated {
                            Button {
                                showAddNoteSheet = true
                            } label: {
                                Image(systemName: "plus")
                            }
                        }
                    }
                }
            }
        }
        .sheet(isPresented: $showEditDeviceSheet) {
            EditDeviceView(device: device) { updatedDevice in
                Task { @MainActor in
                    print("[DeviceDetailView] EditDeviceView callback - updating local state")
                    device = updatedDevice
                    images = updatedDevice.images
                    maintenanceTasks = updatedDevice.maintenanceTasks
                    notes = updatedDevice.notes
                    tags = updatedDevice.tags

                    await refreshDevice()
                }
            }
        }
        .sheet(isPresented: $showShareSheet) {
            ShareView(device: device)
        }
        .sheet(isPresented: $showMarkSoldSheet) {
            MarkSoldSheet { date, price in
                Task { await markDeviceSold(date: date, price: price) }
            }
        }
        .sheet(isPresented: $showMarkForSaleSheet) {
            MarkForSaleSheet { listPrice in
                Task { await markDeviceForSale(listPrice: listPrice) }
            }
        }
        .sheet(isPresented: $showImagePicker, onDismiss: {
            returnToSourceTabIfNeeded()
        }) {
            ImageUploadView(deviceId: device.id) { newImages in
                images.append(contentsOf: newImages)
                quickActionSourceTab = nil  // committed — don't snap back
            }
        }
        .fullScreenCover(item: $selectedImageIndex) { imageIndex in
            ImageViewerView(images: images.sorted(by: { $0.id > $1.id }), initialIndex: imageIndex.value)
        }
        .alert("Delete Device", isPresented: $showDeleteAlert) {
            Button("Cancel", role: .cancel) { }
            Button("Delete", role: .destructive) {
                Task {
                    await deleteDevice()
                }
            }
        } message: {
            Text("This will move the device to trash. You can restore it later.")
        }
        .alert("Delete Image", isPresented: $showDeleteImageAlert) {
            Button("Cancel", role: .cancel) {
                imageToDelete = nil
            }
            Button("Delete", role: .destructive) {
                if let image = imageToDelete {
                    Task {
                        await deleteImage(image)
                        imageToDelete = nil
                    }
                }
            }
        } message: {
            Text("Are you sure you want to delete this image? This action cannot be undone.")
        }
        .sheet(isPresented: $showAddTagSheet) {
            AddTagView(deviceId: device.id, existingTags: tags) { updatedDevice in
                device = updatedDevice
                tags = updatedDevice.tags
                onDeviceChanged?(updatedDevice)
            }
        }
        .alert("Remove Tag", isPresented: $showRemoveTagAlert) {
            Button("Cancel", role: .cancel) {
                tagToRemove = nil
            }
            Button("Remove", role: .destructive) {
                if let tag = tagToRemove {
                    Task {
                        await removeTag(tag)
                        tagToRemove = nil
                    }
                }
            }
        } message: {
            if let tag = tagToRemove {
                Text("Remove the tag \"\(tag.name)\" from this device?")
            }
        }
        .overlay(alignment: .bottom) {
            Picker("Section", selection: $selectedTab) {
                Text("Details").tag(0)
                Text("Photos (\(images.count))").tag(1)
                Text("Tasks (\(maintenanceTasks.count))").tag(2)
                if( authService.isAuthenticated ) {
                    Text("Notes (\(notes.count))").tag(3)
                }
            }
            .pickerStyle(.segmented)
            .padding(.horizontal, 6)
            .padding(.vertical, 6)
            .background(.ultraThinMaterial)
            .clipShape(Capsule())
            .padding(.horizontal, 16)
            .padding(.bottom, 8)
        }
        .task {
            if authService.isAuthenticated {
                if let snapshots = try? await DeviceService.shared.fetchValueHistory(deviceId: device.id) {
                    valueSnapshots = snapshots
                }
            }
        }
    }

    // MARK: - Quick Actions

    private var quickActionsRow: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Quick Actions")
                .font(.headline)
                .foregroundColor(.primary)

            HStack(spacing: 12) {
                QuickActionButton(
                    title: device.isFavorite ? "Unfavorite" : "Favorite",
                    systemImage: device.isFavorite ? "star.fill" : "star",
                    isLoading: isTogglingFavorite,
                    tintColor: device.isFavorite ? .yellow : nil
                ) {
                    Task { await toggleFavorite() }
                }

                QuickActionButton(
                    title: "Add Photo",
                    systemImage: "camera"
                ) {
                    quickActionSourceTab = selectedTab
                    selectedTab = 1
                    showImagePicker = true
                }

                QuickActionButton(
                    title: "Add Task",
                    systemImage: "wrench.and.screwdriver"
                ) {
                    quickActionSourceTab = selectedTab
                    selectedTab = 2
                    showAddTaskSheet = true
                }

                QuickActionButton(
                    title: "Add Note",
                    systemImage: "note.text.badge.plus"
                ) {
                    quickActionSourceTab = selectedTab
                    selectedTab = 3
                    showAddNoteSheet = true
                }

                QuickActionButton(
                    title: "Powered On Today",
                    systemImage: isUpdatingPowerDate ? "clock.arrow.circlepath" : "powerplug",
                    isLoading: isUpdatingPowerDate
                ) {
                    Task { await updateLastPoweredOn() }
                }

                if device.status == .AVAILABLE {
                    QuickActionButton(
                        title: "Mark For Sale",
                        systemImage: "tag",
                        isLoading: isUpdatingStatus
                    ) {
                        if device.listPrice != nil {
                            Task { await updateDeviceStatus(.FOR_SALE) }
                        } else {
                            showMarkForSaleSheet = true
                        }
                    }
                }

                if device.status == .FOR_SALE {
                    QuickActionButton(
                        title: "Mark Pending",
                        systemImage: "clock.badge.checkmark",
                        isLoading: isUpdatingStatus
                    ) {
                        Task { await updateDeviceStatus(.PENDING_SALE) }
                    }

                    QuickActionButton(
                        title: "Mark Sold",
                        systemImage: "dollarsign.circle",
                        isLoading: isUpdatingStatus
                    ) {
                        showMarkSoldSheet = true
                    }
                }

                if device.status == .PENDING_SALE {
                    QuickActionButton(
                        title: "Mark For Sale",
                        systemImage: "tag",
                        isLoading: isUpdatingStatus
                    ) {
                        Task { await updateDeviceStatus(.FOR_SALE) }
                    }

                    QuickActionButton(
                        title: "Mark Sold",
                        systemImage: "dollarsign.circle",
                        isLoading: isUpdatingStatus
                    ) {
                        showMarkSoldSheet = true
                    }
                }

                Spacer()
            }
        }
    }

    private func returnToSourceTabIfNeeded() {
        guard let source = quickActionSourceTab else { return }
        quickActionSourceTab = nil
        // Switch the tab during the sheet's dismiss animation so the
        // Details content is already in place when the sheet finishes sliding away.
        Task { @MainActor in
            try? await Task.sleep(for: .milliseconds(50))
            selectedTab = source
        }
    }

    private func toggleFavorite() async {
        isTogglingFavorite = true
        do {
            let updatedDevice = try await DeviceService.shared.updateDevice(
                id: deviceId,
                input: ["isFavorite": !device.isFavorite]
            )
            device = updatedDevice
            images = updatedDevice.images
            maintenanceTasks = updatedDevice.maintenanceTasks
            notes = updatedDevice.notes
            tags = updatedDevice.tags
            onDeviceChanged?(updatedDevice)
        } catch {
            print("Failed to toggle favorite: \(error)")
        }
        isTogglingFavorite = false
    }

    private func updateLastPoweredOn() async {
        isUpdatingPowerDate = true
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        let dateString = formatter.string(from: Date())
        do {
            let updatedDevice = try await DeviceService.shared.updateDevice(
                id: deviceId,
                input: ["lastPowerOnDate": dateString]
            )
            device = updatedDevice
            images = updatedDevice.images
            maintenanceTasks = updatedDevice.maintenanceTasks
            notes = updatedDevice.notes
            tags = updatedDevice.tags
            onDeviceChanged?(updatedDevice)
        } catch {
            print("Failed to update last powered on date: \(error)")
        }
        isUpdatingPowerDate = false
    }

    private func updateDeviceStatus(_ newStatus: Status) async {
        isUpdatingStatus = true
        do {
            let updatedDevice = try await DeviceService.shared.updateDevice(
                id: deviceId,
                input: ["status": newStatus.rawValue]
            )
            device = updatedDevice
            images = updatedDevice.images
            maintenanceTasks = updatedDevice.maintenanceTasks
            notes = updatedDevice.notes
            tags = updatedDevice.tags
            onDeviceChanged?(updatedDevice)
        } catch {
            print("Failed to update device status: \(error)")
        }
        isUpdatingStatus = false
    }

    private func markDeviceForSale(listPrice: Double) async {
        isUpdatingStatus = true
        do {
            let updatedDevice = try await DeviceService.shared.updateDevice(
                id: deviceId,
                input: ["status": "FOR_SALE", "listPrice": listPrice]
            )
            device = updatedDevice
            images = updatedDevice.images
            maintenanceTasks = updatedDevice.maintenanceTasks
            notes = updatedDevice.notes
            tags = updatedDevice.tags
            onDeviceChanged?(updatedDevice)
        } catch {
            print("Failed to mark device for sale: \(error)")
        }
        isUpdatingStatus = false
    }

    private func markDeviceSold(date: Date, price: Double?) async {
        isUpdatingStatus = true
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        let dateString = formatter.string(from: date)
        var input: [String: Any] = ["status": "SOLD", "soldDate": dateString]
        if let price = price {
            input["soldPrice"] = price
        }
        do {
            let updatedDevice = try await DeviceService.shared.updateDevice(
                id: deviceId,
                input: input
            )
            device = updatedDevice
            images = updatedDevice.images
            maintenanceTasks = updatedDevice.maintenanceTasks
            notes = updatedDevice.notes
            tags = updatedDevice.tags
            onDeviceChanged?(updatedDevice)
        } catch {
            print("Failed to mark device as sold: \(error)")
        }
        isUpdatingStatus = false
    }

    // MARK: - Hero Image
    
    @Environment(\.colorScheme) private var colorScheme
    
    private var backgroundColor: Color {
        colorScheme == .dark ? Color(UIColor.systemBackground) : Color(UIColor.systemBackground)
    }
    
    private var heroImage: some View {
        ZStack(alignment: .bottomLeading) {
            Group {
                if let thumbnail = device.thumbnailImage {
                    let path = thumbnail.thumbnailPath ?? thumbnail.path
                    AsyncImage(url: APIService.shared.imageURL(for: path)) { phase in
                        switch phase {
                        case .empty:
                            Rectangle()
                                .fill(Color.gray.opacity(0.2))
                                .overlay {
                                    ProgressView()
                                }
                        case .success(let image):
                            image
                                .resizable()
                                .aspectRatio(contentMode: .fill)
                        case .failure:
                            Rectangle()
                                .fill(Color.gray.opacity(0.2))
                                .overlay {
                                    Image(systemName: "photo")
                                        .font(.largeTitle)
                                        .foregroundColor(.gray)
                                }
                        @unknown default:
                            EmptyView()
                        }
                    }
                } else {
                    Rectangle()
                        .fill(Color.gray.opacity(0.2))
                        .overlay {
                            Image(systemName: "desktopcomputer")
                                .font(.largeTitle)
                                .foregroundColor(.gray)
                        }
                }
            }
            .frame(height: 450)
            .clipped()
            
            // Gradient fade at top and bottom
            VStack(spacing: 0) {
                // Top fade - extends fully to edge
                LinearGradient(
                    gradient: Gradient(stops: [
                        .init(color: backgroundColor, location: 0.0),
                        .init(color: backgroundColor, location: 0.05),
                        .init(color: backgroundColor.opacity(0.90), location: 0.3),
                        .init(color: Color.clear, location: 1.0)
                    ]),
                    startPoint: .top,
                    endPoint: .bottom
                )
                .frame(height: 120)
                
                Spacer()
                
                // Bottom fade - extends fully to edge
                LinearGradient(
                    gradient: Gradient(stops: [
                        .init(color: Color.clear, location: 0.0),
                        .init(color: backgroundColor.opacity(0.90), location: 0.7),
                        .init(color: backgroundColor, location: 0.95),
                        .init(color: backgroundColor, location: 1.0)
                    ]),
                    startPoint: .top,
                    endPoint: .bottom
                )
                .frame(height: 120)
            }
        }
        .frame(height: 450)
    }
    
    // MARK: - Device Header
    
    private var deviceHeader: some View {

        VStack(alignment: .leading, spacing: 8) {

            HStack(alignment: .firstTextBaseline) {
                Text(device.name)
                    .font(.title2)
                    .fontWeight(.bold)

                Spacer()

                StatusBadge(status: device.status)
            }

            if let additionalName = device.additionalName, !additionalName.isEmpty {
                Text(additionalName)
                    .font(.headline)
                    .foregroundColor(.secondary)
            }

            HStack(spacing: 16) {
                Label(device.category.name, systemImage: "folder")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                
                if let manufacturer = device.manufacturer, !manufacturer.isEmpty {
                    Label(manufacturer, systemImage: "building.2")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
            }
            
            // Status Indicators
            StatusIndicatorsRow(device: device)
                .id("\(device.id)-\(device.isFavorite)-\(device.isAssetTagged)-\(device.hasOriginalBox)-\(device.isPramBatteryRemoved ?? false)-\(device.functionalStatus)")
            
            // Tags
            if authService.isAuthenticated || !tags.isEmpty {
                VStack(alignment: .leading, spacing: 6) {
                    HStack {
                        Text("Tags")
                            .font(.headline)
                            .foregroundColor(.primary)
                        Spacer()
                        if authService.isAuthenticated {
                            Button {
                                showAddTagSheet = true
                            } label: {
                                Label("Add Tag", systemImage: "plus")
                                    .font(.caption)
                                    .padding(.horizontal, 8)
                                    .padding(.vertical, 4)
                                    .background(Color.accentColor.opacity(0.1))
                                    .foregroundColor(.accentColor)
                                    .clipShape(Capsule())
                            }
                        }
                    }
                    .padding(.top, 8)

                    if tags.isEmpty {
                        Text("No tags yet")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    } else {
                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 8) {
                                ForEach(tags) { tag in
                                    if authService.isAuthenticated {
                                        Button {
                                            tagToRemove = tag
                                            showRemoveTagAlert = true
                                        } label: {
                                            HStack(spacing: 4) {
                                                Text(tag.name)
                                                Image(systemName: "xmark")
                                                    .font(.system(size: 8, weight: .bold))
                                            }
                                            .font(.caption)
                                            .padding(.horizontal, 8)
                                            .padding(.vertical, 4)
                                            .background(Color.accentColor.opacity(0.1))
                                            .foregroundColor(.accentColor)
                                            .clipShape(Capsule())
                                        }
                                    } else {
                                        Text(tag.name)
                                            .font(.caption)
                                            .padding(.horizontal, 8)
                                            .padding(.vertical, 4)
                                            .background(Color.accentColor.opacity(0.1))
                                            .foregroundColor(.accentColor)
                                            .clipShape(Capsule())
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    
    // MARK: - Details Section
    
    private var detailsSection: some View {
        VStack(spacing: 16) {
            // Basic Info
            DetailSection(title: "Basic Information") {
                DetailRow(label: "Device ID", value: String(device.id))
                DetailRow(label: "Model Number", value: device.modelNumber)
                DetailRow(label: "Serial Number", value: device.serialNumber)
                DetailRow(label: "Release Year", value: device.releaseYear.map { String($0) })
                DetailRow(label: "Location", value: device.location)
                DetailRow(label: "Functional Status", value: device.functionalStatus.displayName)
                DetailRow(label: "Last Used Date", value: formatDate(device.lastPowerOnDate))
            }
            
            
            // Acquisition Info
            DetailSection(title: "Acquisition and Value") {
                DetailRow(label: "Date Acquired", value: formatDate(device.dateAcquired))
                DetailRow(label: "Where Acquired", value: device.whereAcquired)
                DetailRow(label: "Price Acquired", value: formatCurrency(device.priceAcquired))
                if let value = device.estimatedValue {
                    HStack {
                        Text("Estimated Value")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                        Spacer()
                        Text(formatCurrency(value) ?? "")
                            .font(.subheadline)
                            .fontWeight(.medium)
                        if let query = [device.manufacturer, device.name, device.modelNumber]
                            .compactMap({ $0 })
                            .filter({ !$0.isEmpty })
                            .joined(separator: " ")
                            .addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed),
                           let url = URL(string: "https://www.ebay.com/sch/i.html?_nkw=\(query)&LH_Sold=1&LH_Complete=1") {
                            Link("eBay sold", destination: url)
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                    }
                    .padding(.vertical, 8)
                } else {
                    DetailRow(label: "Estimated Value", value: formatCurrency(device.estimatedValue))
                }
            }

            if authService.isAuthenticated && valueSnapshots.count >= 2 {
                ValueHistorySection(snapshots: valueSnapshots)
            }

            // Sales Info (if applicable)
            if device.status == .FOR_SALE || device.status == .PENDING_SALE || device.status == .SOLD {
                DetailSection(title: "Sales") {
                    DetailRow(label: "List Price", value: formatCurrency(device.listPrice))
                    if device.status == .SOLD {
                        DetailRow(label: "Sold Price", value: formatCurrency(device.soldPrice))
                        DetailRow(label: "Sold Date", value: formatDate(device.soldDate))
                    }
                }
            }
            else if device.status == .DONATED {
                DetailSection(title: "Donated") {
                    if device.status == .DONATED {
                        DetailRow(label: "Donated Date", value: formatDate(device.soldDate))
                    }
                }
            }
            else if device.status == .RETURNED {
                DetailSection(title: "Repair") {
                    DetailRow(label: "Returned Date", value: formatDate(device.soldDate))
                    if let fee = device.soldPrice, fee > 0 {
                        DetailRow(label: "Repair Fee Charged", value: formatCurrency(fee))
                    }
                }
            }

            // Computer Specs (if applicable)
            if hasComputerSpecs {
                DetailSection(title: "Computer Specifications") {
                    DetailRow(label: "CPU", value: device.cpu)
                    DetailRow(label: "RAM", value: device.ram)
                    DetailRow(label: "Graphics", value: device.graphics)
                    DetailRow(label: "Storage", value: device.storage)
                    DetailRow(label: "Operating System", value: device.operatingSystem)
                    if let isWifi = device.isWifiEnabled {
                        DetailRow(label: "WiFi Enabled", value: isWifi ? "Yes" : "No")
                    }
                    if let isPram = device.isPramBatteryRemoved {
                        DetailRow(label: "PRAM Battery Removed", value: isPram ? "Yes" : "No")
                    }
                }
            }
            
            // Custom Fields
            if !device.customFieldValues.isEmpty {
                DetailSection(title: "Custom Fields") {
                    ForEach(device.customFieldValues.sorted(by: { $0.sortOrder == $1.sortOrder ? $0.customFieldName < $1.customFieldName : $0.sortOrder < $1.sortOrder })) { cfv in
                        DetailRow(label: cfv.customFieldName, value: cfv.value)
                    }
                }
            }

            // Info/Notes
            if let info = device.info, !info.isEmpty {
                DetailSection(title: "Additional Info") {
                    Text(info)
                        .font(.body)
                        .foregroundColor(.primary)
                }
            }
            
            // External URL
            if let urlString = device.externalUrl, let url = URL(string: urlString) {
                DetailSection(title: "External Link") {
                    Link(destination: url) {
                        HStack {
                            Text(urlString)
                                .lineLimit(1)
                            Spacer()
                            Image(systemName: "arrow.up.right.square")
                        }
                    }
                }
            }
            
            // Delete Device Button
            Button {
                showDeleteAlert = true
            } label: {
                HStack {
                    Image(systemName: "trash")
                    Text("Delete Device")
                }
                .font(.body)
                .foregroundColor(.red)
                .frame(maxWidth: .infinity)
                .padding()
                .background(Color(.systemGray6))
                .clipShape(RoundedRectangle(cornerRadius: 12))
            }
            .disabled(isDeletingDevice)
            .padding(.top, 24)
        }
    }
    
    private var hasComputerSpecs: Bool {
        device.cpu != nil || device.ram != nil || device.graphics != nil ||
        device.storage != nil || device.operatingSystem != nil
    }
    
    // MARK: - Photos Section
    
    private var photosSection: some View {
        Group {
            if images.isEmpty {
                ContentUnavailableView {
                    Label("No Photos", systemImage: "photo.on.rectangle")
                } description: {
                    Text("This device has no photos")
                }
            } else {
                LazyVGrid(columns: [
                    GridItem(.flexible(), spacing: 4),
                    GridItem(.flexible(), spacing: 4),
                    GridItem(.flexible(), spacing: 4)
                ], spacing: 4) {
                    ForEach(Array(images.sorted(by: { $0.id > $1.id }).enumerated()), id: \.element.id) { index, image in
                        ZStack {
                            // Image layer - always fills the space
                            GeometryReader { geo in
                                AsyncImage(url: APIService.shared.imageURL(for: image.thumbnailPath ?? image.path)) { phase in
                                    switch phase {
                                    case .empty:
                                        Rectangle()
                                            .fill(Color.gray.opacity(0.2))
                                            .overlay { ProgressView() }
                                    case .success(let img):
                                        img
                                            .resizable()
                                            .scaledToFill()
                                            .frame(width: geo.size.width, height: geo.size.height)
                                            .clipped()
                                    case .failure:
                                        Rectangle()
                                            .fill(Color.gray.opacity(0.2))
                                            .overlay {
                                                Image(systemName: "photo")
                                                    .foregroundColor(.gray)
                                            }
                                    @unknown default:
                                        EmptyView()
                                    }
                                }
                            }
                            
                            // Button overlay layer
                            if isImageManagementMode {
                                VStack(spacing: 0) {
                                    HStack(spacing: 0) {
                                        // Top-left quadrant - Thumbnail
                                        Button {
                                            Task {
                                                await setThumbnail(image)
                                            }
                                        } label: {
                                            Color.clear
                                                .overlay(alignment: .topLeading) {
                                                    Image(systemName: "photo.fill")
                                                        .font(.system(size: 16))
                                                        .foregroundColor(.white)
                                                        .padding(6)
                                                        .background(image.isThumbnail ? Color.blue : Color.gray.opacity(0.6))
                                                        .clipShape(Circle())
                                                        .padding(8)
                                                }
                                        }
                                        
                                        // Top-right quadrant - Delete
                                        Button {
                                            imageToDelete = image
                                            showDeleteImageAlert = true
                                        } label: {
                                            Color.clear
                                                .overlay(alignment: .topTrailing) {
                                                    Image(systemName: "trash.fill")
                                                        .font(.system(size: 16))
                                                        .foregroundColor(.white)
                                                        .padding(6)
                                                        .background(Color.red.opacity(0.8))
                                                        .clipShape(Circle())
                                                        .padding(8)
                                                }
                                        }
                                    }
                                    
                                    HStack(spacing: 0) {
                                        // Bottom-left quadrant - Listing
                                        Button {
                                            Task {
                                                await setListingImage(image)
                                            }
                                        } label: {
                                            Color.clear
                                                .overlay(alignment: .bottomLeading) {
                                                    Image(systemName: "storefront.fill")
                                                        .font(.system(size: 16))
                                                        .foregroundColor(.white)
                                                        .padding(6)
                                                        .background(image.isListingImage ? Color.orange : Color.gray.opacity(0.6))
                                                        .clipShape(Circle())
                                                        .padding(8)
                                                }
                                        }
                                        
                                        // Bottom-right quadrant - Shop
                                        Button {
                                            Task {
                                                await toggleShopImage(image)
                                            }
                                        } label: {
                                            Color.clear
                                                .overlay(alignment: .bottomTrailing) {
                                                    Image(systemName: "bag.fill")
                                                        .font(.system(size: 16))
                                                        .foregroundColor(.white)
                                                        .padding(6)
                                                        .background(image.isShopImage ? Color.green : Color.gray.opacity(0.6))
                                                        .clipShape(Circle())
                                                        .padding(8)
                                                }
                                        }
                                    }
                                }
                            } else {
                                VStack {
                                    HStack {
                                        if image.isThumbnail {
                                            Image(systemName: "photo.fill")
                                                .font(.system(size: 14))
                                                .foregroundColor(.white)
                                                .padding(4)
                                                .background(Color.blue)
                                                .clipShape(Circle())
                                        }
                                        Spacer()
                                    }
                                    Spacer()
                                    HStack {
                                        if image.isListingImage {
                                            Image(systemName: "storefront.fill")
                                                .font(.system(size: 14))
                                                .foregroundColor(.white)
                                                .padding(4)
                                                .background(Color.orange)
                                                .clipShape(Circle())
                                        }
                                        Spacer()
                                        if image.isShopImage {
                                            Image(systemName: "bag.fill")
                                                .font(.system(size: 14))
                                                .foregroundColor(.white)
                                                .padding(4)
                                                .background(Color.green)
                                                .clipShape(Circle())
                                        }
                                    }
                                }
                                .padding(4)
                            }
                        }
                        .frame(height: 100)
                        .clipShape(RoundedRectangle(cornerRadius: 8))
                        .onTapGesture {
                            if !isImageManagementMode {
                                selectedImageIndex = ImageIndex(value: index)
                            }
                        }
                    }
                }
            }
        }
    }
    
    // MARK: - Tasks Section
    
    private var tasksSection: some View {
        VStack(spacing: 12) {
            Text("Maintenance Tasks")
                .font(.headline)
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.bottom, 4)
            
            if maintenanceTasks.isEmpty {
                ContentUnavailableView {
                    Label("No Tasks", systemImage: "wrench.and.screwdriver")
                } description: {
                    Text("No maintenance tasks recorded")
                }
                .frame(maxWidth: .infinity, minHeight: 200)
            } else {
                VStack(spacing: 12) {
                    ForEach(maintenanceTasks.sorted(by: { $0.dateCompleted > $1.dateCompleted })) { task in
                        TaskRowView(task: task) {
                            Task {
                                await deleteTask(task)
                            }
                        }
                    }
                }
            }
        }
        .sheet(isPresented: $showAddTaskSheet, onDismiss: {
            returnToSourceTabIfNeeded()
        }) {
            AddMaintenanceTaskView(deviceId: device.id) { newTask in
                maintenanceTasks.append(newTask)
                quickActionSourceTab = nil  // committed — don't snap back
            }
        }
        .disabled(isDeletingTask)
    }
    
    private func deleteTask(_ task: MaintenanceTask) async {
        isDeletingTask = true
        
        do {
            _ = try await DeviceService.shared.deleteMaintenanceTask(id: task.id)
            maintenanceTasks.removeAll { $0.id == task.id }
        } catch {
            print("Failed to delete task: \(error)")
        }
        
        isDeletingTask = false
    }
    
    // MARK: - Notes Section
    
    private var notesSection: some View {
        VStack(spacing: 12) {
            Text("Notes")
                .font(.headline)
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.bottom, 4)
            
            if notes.isEmpty {
                ContentUnavailableView {
                    Label("No Notes", systemImage: "note.text")
                } description: {
                    Text("No notes for this device")
                }
                .frame(maxWidth: .infinity, minHeight: 200)
            } else {
                VStack(spacing: 12) {
                    ForEach(notes.sorted(by: { $0.date > $1.date })) { note in
                        NoteRowView(note: note) {
                            editingNote = note
                            showEditNoteSheet = true
                        } onDelete: {
                            Task {
                                await deleteNote(note)
                            }
                        }
                    }
                }
            }
        }
        .sheet(isPresented: $showAddNoteSheet, onDismiss: {
            returnToSourceTabIfNeeded()
        }) {
            AddNoteView(deviceId: device.id) { newNote in
                notes.append(newNote)
                quickActionSourceTab = nil  // committed — don't snap back
            }
        }
        .sheet(isPresented: $showEditNoteSheet) {
            if let editingNote = editingNote {
                EditNoteView(note: editingNote) { updatedNote in
                    if let index = notes.firstIndex(where: { $0.id == updatedNote.id }) {
                        notes[index] = updatedNote
                    }
                }
            }
        }
        .disabled(isDeletingNote)
    }
    
    private func deleteNote(_ note: Note) async {
        isDeletingNote = true
        
        do {
            _ = try await DeviceService.shared.deleteNote(id: note.id)
            notes.removeAll { $0.id == note.id }
        } catch {
            print("Failed to delete note: \(error)")
        }
        
        isDeletingNote = false
    }
    
    private func deleteDevice() async {
        isDeletingDevice = true
        
        do {
            _ = try await DeviceService.shared.deleteDevice(id: device.id)
            onDeviceDeleted?()
            dismiss()
        } catch {
            print("Failed to delete device: \(error)")
            isDeletingDevice = false
        }
    }
    
    
    private func setThumbnail(_ image: DeviceImage) async {
        do {
            // Capture displaced thumbnail URL for cache eviction
            let displacedThumbnailURL: URL? = images
                .first(where: { $0.isThumbnail && $0.id != image.id })
                .flatMap { APIService.shared.imageURL(for: $0.thumbnailPath ?? $0.path) }

            // First, unset any existing thumbnail
            if let currentThumbnail = images.first(where: { $0.isThumbnail && $0.id != image.id }) {
                _ = try await DeviceService.shared.updateImage(
                    id: currentThumbnail.id,
                    isThumbnail: false,
                    isShopImage: nil,
                    isListingImage: nil
                )
            }

            // Set this image as thumbnail
            let updatedImage = try await DeviceService.shared.updateImage(
                id: image.id,
                isThumbnail: !image.isThumbnail,
                isShopImage: nil,
                isListingImage: nil
            )

            if let index = images.firstIndex(where: { $0.id == image.id }) {
                images[index] = updatedImage
            }

            // Evict the old thumbnail from cache so it doesn't linger on disk
            if let url = displacedThumbnailURL {
                await ImageCacheService.shared.removeImage(for: url)
            }

            await refreshDevice()
        } catch {
            print("Failed to set thumbnail: \(error)")
        }
    }
    
    private func setListingImage(_ image: DeviceImage) async {
        do {
            // First, unset any existing listing image
            if let currentListing = images.first(where: { $0.isListingImage && $0.id != image.id }) {
                _ = try await DeviceService.shared.updateImage(
                    id: currentListing.id,
                    isThumbnail: nil,
                    isShopImage: nil,
                    isListingImage: false
                )
            }
            
            // Set this image as listing image
            let updatedImage = try await DeviceService.shared.updateImage(
                id: image.id,
                isThumbnail: nil,
                isShopImage: nil,
                isListingImage: !image.isListingImage
            )
            
            if let index = images.firstIndex(where: { $0.id == image.id }) {
                images[index] = updatedImage
            }
            
            await refreshDevice()
        } catch {
            print("Failed to set listing image: \(error)")
        }
    }
    
    private func toggleShopImage(_ image: DeviceImage) async {
        do {
            let updatedImage = try await DeviceService.shared.updateImage(
                id: image.id,
                isThumbnail: nil,
                isShopImage: !image.isShopImage,
                isListingImage: nil
            )
            
            if let index = images.firstIndex(where: { $0.id == image.id }) {
                images[index] = updatedImage
            }
            
            await refreshDevice()
        } catch {
            print("Failed to toggle shop image: \(error)")
        }
    }
    
    private func deleteImage(_ image: DeviceImage) async {
        do {
            _ = try await DeviceService.shared.deleteImage(id: image.id)
            images.removeAll { $0.id == image.id }
            await refreshDevice()
        } catch {
            print("Failed to delete image: \(error)")
        }
    }
    
    private func removeTag(_ tag: Tag) async {
        do {
            let updatedDevice = try await DeviceService.shared.removeDeviceTag(deviceId: device.id, tagId: tag.id)
            device = updatedDevice
            tags = updatedDevice.tags
            onDeviceChanged?(updatedDevice)
        } catch {
            print("Failed to remove tag: \(error)")
        }
    }

    @MainActor
    private func refreshDevice() async {
        print("[DeviceDetailView] Refreshing device \(deviceId)")
        do {
            if let refreshedDevice = try await DeviceService.shared.fetchDevice(id: deviceId) {
                print("[DeviceDetailView] Got refreshed device - name: \(refreshedDevice.name), isPramBatteryRemoved: \(String(describing: refreshedDevice.isPramBatteryRemoved))")
                device = refreshedDevice
                images = refreshedDevice.images
                maintenanceTasks = refreshedDevice.maintenanceTasks
                notes = refreshedDevice.notes
                tags = refreshedDevice.tags
                print("[DeviceDetailView] Calling onDeviceChanged callback")
                onDeviceChanged?(refreshedDevice)
            } else {
                print("[DeviceDetailView] Refresh returned nil device")
            }
        } catch {
            print("[DeviceDetailView] Failed to refresh device: \(error)")
        }
    }
    
    // MARK: - Helpers
    
    private func formatDate(_ dateString: String?) -> String? {
        guard let dateString = dateString else { return nil }
        
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        
        if let date = formatter.date(from: dateString) {
            let displayFormatter = DateFormatter()
            displayFormatter.dateStyle = .medium
            return displayFormatter.string(from: date)
        }
        
        // Try without fractional seconds
        formatter.formatOptions = [.withInternetDateTime]
        if let date = formatter.date(from: dateString) {
            let displayFormatter = DateFormatter()
            displayFormatter.dateStyle = .medium
            return displayFormatter.string(from: date)
        }
        
        return dateString
    }
    
    private func formatCurrency(_ value: Double?) -> String? {
        guard let value = value else { return nil }
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        return formatter.string(from: NSNumber(value: value))
    }
}

// MARK: - Supporting Views

struct QuickActionButton: View {
    let title: String
    let systemImage: String
    var isLoading: Bool = false
    var tintColor: Color? = nil
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Group {
                if isLoading {
                    ProgressView()
                        .controlSize(.small)
                        .tint(.accentColor)
                        .frame(width: 20, height: 20)
                } else {
                    Image(systemName: systemImage)
                        .font(.system(size: 18, weight: .medium))
                        .frame(width: 20, height: 20)
                }
            }
            .padding(14)
            .background(Color(.systemGray6))
            .foregroundColor(tintColor ?? .primary)
            .clipShape(Circle())
        }
        .disabled(isLoading)
        .accessibilityLabel(title)
    }
}

struct DetailSection<Content: View>: View {
    let title: String
    @ViewBuilder let content: Content
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title)
                .font(.headline)
                .foregroundColor(.primary)
            
            VStack(alignment: .leading, spacing: 4) {
                content
            }
            .padding()
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(Color(.systemGray6))
            .clipShape(RoundedRectangle(cornerRadius: 12))
        }
    }
}

struct DetailRow: View {
    let label: String
    let value: String?
    
    var body: some View {
        if let value = value, !value.isEmpty {
            HStack {
                Text(label)
                    .foregroundColor(.secondary)
                Spacer()
                Text(value)
                    .foregroundColor(.primary)
                    .multilineTextAlignment(.trailing)
            }
            .font(.subheadline)
        }
    }
}

struct TaskRowView: View {
    let task: MaintenanceTask
    let onDelete: () -> Void
    @EnvironmentObject var authService: AuthService

    @State private var showDeleteConfirmation = false
    
    var body: some View {
        ZStack {
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Image(systemName: "wrench.and.screwdriver")
                        .foregroundColor(.accentColor)
                    Text(task.label)
                        .font(.headline)
                    Spacer()
                    Text(formatDate(task.dateCompleted))
                        .font(.caption)
                        .foregroundColor(.secondary)
                    
                    if( authService.isAuthenticated ) {
                        Button {
                            showDeleteConfirmation = true
                        } label: {
                            Image(systemName: "trash")
                                .font(.caption)
                                .foregroundColor(.red)
                                .padding(8)
                        }
                        .opacity(showDeleteConfirmation ? 0 : 1)
                    }
                }
                
                if let notes = task.notes, !notes.isEmpty {
                    Text(notes)
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
                if let cost = task.cost, cost > 0 {
                    Text(String(format: "Cost: $%.2f", cost))
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
            }
            .padding()
            .background(Color(.systemGray6))
            .clipShape(RoundedRectangle(cornerRadius: 12))
            
            if showDeleteConfirmation {
                Color.black.opacity(0.7)
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                
                VStack(spacing: 12) {
                    Text("Delete this task?")
                        .font(.subheadline)
                        .foregroundColor(.white)
                    
                    HStack(spacing: 12) {
                        Button("Cancel") {
                            showDeleteConfirmation = false
                        }
                        .buttonStyle(.bordered)
                        .tint(.white)
                        
                        Button("Delete") {
                            onDelete()
                        }
                        .buttonStyle(.borderedProminent)
                        .tint(.red)
                    }
                }
                .padding()
            }
        }
    }
    
    private func formatDate(_ dateString: String) -> String {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        
        if let date = formatter.date(from: dateString) {
            let displayFormatter = DateFormatter()
            displayFormatter.dateStyle = .medium
            return displayFormatter.string(from: date)
        }
        
        formatter.formatOptions = [.withInternetDateTime]
        if let date = formatter.date(from: dateString) {
            let displayFormatter = DateFormatter()
            displayFormatter.dateStyle = .medium
            return displayFormatter.string(from: date)
        }
        
        return dateString
    }
}

struct NoteRowView: View {
    let note: Note
    let onEdit: () -> Void
    let onDelete: () -> Void
    @EnvironmentObject var authService: AuthService

    @State private var showDeleteConfirmation = false
    
    var body: some View {
        ZStack {
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Image(systemName: "note.text")
                        .foregroundColor(.accentColor)
                    Text(formatDateTime(note.date))
                        .font(.caption)
                        .foregroundColor(.secondary)
                    Spacer()
                    
                    
                    if( authService.isAuthenticated ) {
                        Button {
                            onEdit()
                        } label: {
                            Image(systemName: "pencil")
                                .font(.caption)
                                .foregroundColor(.accentColor)
                                .padding(8)
                        }
                        .opacity(showDeleteConfirmation ? 0 : 1)
                        
                        Button {
                            showDeleteConfirmation = true
                        } label: {
                            Image(systemName: "trash")
                                .font(.caption)
                                .foregroundColor(.red)
                                .padding(8)
                        }
                        .opacity(showDeleteConfirmation ? 0 : 1)
                    }
                }
                
                Text(note.content)
                    .font(.body)
            }
            .padding()
            .background(Color(.systemGray6))
            .clipShape(RoundedRectangle(cornerRadius: 12))
            
            if showDeleteConfirmation {
                Color.black.opacity(0.7)
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                
                VStack(spacing: 12) {
                    Text("Delete this note?")
                        .font(.subheadline)
                        .foregroundColor(.white)
                    
                    HStack(spacing: 12) {
                        Button("Cancel") {
                            showDeleteConfirmation = false
                        }
                        .buttonStyle(.bordered)
                        .tint(.white)
                        
                        Button("Delete") {
                            onDelete()
                        }
                        .buttonStyle(.borderedProminent)
                        .tint(.red)
                    }
                }
                .padding()
            }
        }
    }
    
    private func formatDateTime(_ dateString: String) -> String {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        
        if let date = formatter.date(from: dateString) {
            let displayFormatter = DateFormatter()
            displayFormatter.dateStyle = .medium
            displayFormatter.timeStyle = .short
            return displayFormatter.string(from: date)
        }
        
        formatter.formatOptions = [.withInternetDateTime]
        if let date = formatter.date(from: dateString) {
            let displayFormatter = DateFormatter()
            displayFormatter.dateStyle = .medium
            displayFormatter.timeStyle = .short
            return displayFormatter.string(from: date)
        }
        
        return dateString
    }
}

private struct MarkSoldSheet: View {
    @Environment(\.dismiss) private var dismiss
    @State private var saleDate = Date()
    @State private var salePriceText = ""
    let onSubmit: (Date, Double?) -> Void

    var body: some View {
        NavigationStack {
            Form {
                DatePicker("Sale Date", selection: $saleDate, displayedComponents: .date)
                    .datePickerStyle(.compact)

                TextField("Sale Price", text: $salePriceText)
                    .keyboardType(.decimalPad)
            }
            .navigationTitle("Mark as Sold")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Mark Sold") {
                        let price = Double(salePriceText)
                        onSubmit(saleDate, price)
                        dismiss()
                    }
                }
            }
        }
    }
}

private struct MarkForSaleSheet: View {
    @Environment(\.dismiss) private var dismiss
    @State private var listPriceText = ""
    let onSubmit: (Double) -> Void

    var body: some View {
        NavigationStack {
            Form {
                TextField("List Price", text: $listPriceText)
                    .keyboardType(.decimalPad)
            }
            .navigationTitle("Mark For Sale")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Mark For Sale") {
                        if let price = Double(listPriceText) {
                            onSubmit(price)
                        }
                        dismiss()
                    }
                    .disabled(Double(listPriceText) == nil)
                }
            }
        }
    }
}

struct ValueHistorySection: View {
    let snapshots: [ValueSnapshot]

    private var isoFormatter: ISO8601DateFormatter {
        let f = ISO8601DateFormatter()
        f.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return f
    }

    private var isoBasicFormatter: ISO8601DateFormatter {
        ISO8601DateFormatter()
    }

    private func parseDate(_ string: String) -> Date? {
        isoFormatter.date(from: string) ?? isoBasicFormatter.date(from: string)
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Value History")
                .font(.headline)
                .padding(.bottom, 2)

            Chart {
                ForEach(snapshots) { snapshot in
                    if let date = parseDate(snapshot.snapshotDate), let value = snapshot.estimatedValue {
                        LineMark(
                            x: .value("Date", date),
                            y: .value("Value", value)
                        )
                        .interpolationMethod(.monotone)
                        .foregroundStyle(Color.green)

                        PointMark(
                            x: .value("Date", date),
                            y: .value("Value", value)
                        )
                        .foregroundStyle(Color.green)
                    }
                }
            }
            .chartXAxis {
                AxisMarks(values: .automatic) { _ in
                    AxisValueLabel(format: .dateTime.month(.abbreviated).year(.twoDigits))
                        .foregroundStyle(Color.secondary)
                    AxisGridLine()
                }
            }
            .chartYAxis {
                AxisMarks { value in
                    if let v = value.as(Double.self) {
                        AxisValueLabel {
                            Text(v >= 1000 ? "$\(String(format: "%.1f", v / 1000))k" : "$\(String(format: "%.0f", v))")
                                .font(.caption)
                        }
                        AxisGridLine()
                    }
                }
            }
            .frame(height: 180)
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .cornerRadius(12)
    }
}

#Preview {
    struct PreviewWrapper: View {
        @State var selectedTab = 0

        var body: some View {
            NavigationStack {
                DeviceDetailView(device: Device(
                    id: 1,
                    name: "Macintosh SE",
                    additionalName: "FDHD",
                    manufacturer: "Apple",
                    modelNumber: "M5011",
                    serialNumber: "ABC123",
                    releaseYear: 1987,
                    location: "Shelf A",
                    info: "Great condition vintage Mac",
                    searchText: nil,
                    isFavorite: true,
                    status: .AVAILABLE,
                    functionalStatus: .YES,
                    lastPowerOnDate: nil,
                    hasOriginalBox: false,
                    isAssetTagged: true,
                    dateAcquired: "2024-01-15T00:00:00.000Z",
                    whereAcquired: "eBay",
                    priceAcquired: 150.0,
                    estimatedValue: 300.0,
                    listPrice: nil,
                    soldPrice: nil,
                    soldDate: nil,
                    cpu: "Motorola 68000",
                    ram: "4MB",
                    graphics: nil,
                    storage: "1.44MB Floppy",
                    operatingSystem: "System 6",
                    isWifiEnabled: false,
                    isPramBatteryRemoved: true,
                    externalUrl: "https://everymac.com",
                    category: Category(id: 1, name: "Compact Macs", type: "COMPUTER", sortOrder: 1),
                    images: [],
                    notes: [],
                    maintenanceTasks: [],
                    tags: [Tag(id: 1, name: "vintage"), Tag(id: 2, name: "working")],
                    customFieldValues: []
                ), selectedTab: $selectedTab)
            }
        }
    }

    return PreviewWrapper()
}
