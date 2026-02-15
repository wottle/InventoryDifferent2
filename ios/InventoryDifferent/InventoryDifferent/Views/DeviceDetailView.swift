//
//  DeviceDetailView.swift
//  InventoryDifferent
//
//  Created by Michael Wottle on 2/2/26.
//

import SwiftUI

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
    
    @State private var showEditDeviceSheet = false
    @State private var showShareSheet = false
    @State private var showDeleteAlert = false
    @State private var isDeletingDevice = false
    
    @State private var selectedImageIndex: ImageIndex?
    @State private var showImagePicker = false
    @State private var isImageManagementMode = false
    @State private var imageToDelete: DeviceImage?
    @State private var showDeleteImageAlert = false
    
    init(device: Device, selectedTab: Binding<Int>, onDeviceChanged: ((Device) -> Void)? = nil, onDeviceDeleted: (() -> Void)? = nil) {
        self.deviceId = device.id
        self._device = State(initialValue: device)
        self._selectedTab = selectedTab
        self.onDeviceChanged = onDeviceChanged
        self.onDeviceDeleted = onDeviceDeleted
        self._maintenanceTasks = State(initialValue: device.maintenanceTasks)
        self._notes = State(initialValue: device.notes)
        self._images = State(initialValue: device.images)
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
            ToolbarItem(placement: .navigationBarTrailing) {
                HStack(spacing: 12) {
                    if selectedTab == 0 {
                        Button {
                            showShareSheet = true
                        } label: {
                            Image(systemName: "square.and.arrow.up")
                        }
                        
                        Button {
                            showEditDeviceSheet = true
                        } label: {
                            Image(systemName: "pencil")
                        }
                    } else if selectedTab == 1 {
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
                    } else if selectedTab == 2 {
                        Button {
                            showAddTaskSheet = true
                        } label: {
                            Image(systemName: "plus")
                        }
                    } else if selectedTab == 3 {
                        Button {
                            showAddNoteSheet = true
                        } label: {
                            Image(systemName: "plus")
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
                    
                    await refreshDevice()
                }
            }
        }
        .sheet(isPresented: $showShareSheet) {
            ShareView(device: device)
        }
        .sheet(isPresented: $showImagePicker) {
            ImageUploadView(deviceId: device.id) { newImages in
                images.append(contentsOf: newImages)
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
        .overlay(alignment: .bottom) {
            Picker("Section", selection: $selectedTab) {
                Text("Details").tag(0)
                Text("Photos (\(images.count))").tag(1)
                Text("Tasks (\(maintenanceTasks.count))").tag(2)
                Text("Notes (\(notes.count))").tag(3)
            }
            .pickerStyle(.segmented)
            .padding(.horizontal, 6)
            .padding(.vertical, 6)
            .background(.ultraThinMaterial)
            .clipShape(Capsule())
            .padding(.horizontal, 16)
            .padding(.bottom, 8)
        }
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
            if !device.tags.isEmpty {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        ForEach(device.tags) { tag in
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
                DetailRow(label: "Estimated Value", value: formatCurrency(device.estimatedValue))
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
        .sheet(isPresented: $showAddTaskSheet) {
            AddMaintenanceTaskView(deviceId: device.id) { newTask in
                maintenanceTasks.append(newTask)
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
        .sheet(isPresented: $showAddNoteSheet) {
            AddNoteView(deviceId: device.id) { newNote in
                notes.append(newNote)
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
                
                if let notes = task.notes, !notes.isEmpty {
                    Text(notes)
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
                    tags: [Tag(id: 1, name: "vintage"), Tag(id: 2, name: "working")]
                ), selectedTab: $selectedTab)
            }
        }
    }

    return PreviewWrapper()
}
