//
//  DeviceDetailViewRedesign.swift
//  InventoryDifferent
//
//  Redesigned device detail view using the "Precision Editorial / Technical Atelier"
//  design system. The original DeviceDetailView.swift is preserved and unchanged.
//

import SwiftUI
import Charts

// MARK: - Design Tokens

private struct InfoFullHeightKey: PreferenceKey {
    static let defaultValue: CGFloat = 0
    static func reduce(value: inout CGFloat, nextValue: () -> CGFloat) { value = nextValue() }
}
private struct InfoLimitedHeightKey: PreferenceKey {
    static let defaultValue: CGFloat = 0
    static func reduce(value: inout CGFloat, nextValue: () -> CGFloat) { value = nextValue() }
}

private extension Color {
    /// International Blue — primary brand color
    static let edPrimary = Color(red: 0, green: 88 / 255, blue: 188 / 255)
    /// Liquid Gold — tertiary accent
    static let edTertiary = Color(red: 111 / 255, green: 93 / 255, blue: 0)
    /// Gold container (left border accent)
    static let edTertiaryContainer = Color(red: 197 / 255, green: 170 / 255, blue: 34 / 255)
    /// Surface — cool-toned page background
    static let edSurface = Color(.systemGroupedBackground)
    /// Surface Container Lowest — pure white cards
    static let edSurfaceLowest = Color(.systemBackground)
    /// Surface Container Low — subtle inner containers
    static let edSurfaceLow = Color(.secondarySystemBackground)
    /// Surface Container High — chips / row alternates
    static let edSurfaceHigh = Color(.tertiarySystemBackground)
}

// MARK: - Screen wrapper

struct DeviceDetailRedesignScreen: View {
    let deviceId: Int
    @EnvironmentObject var deviceStore: DeviceStore
    @EnvironmentObject var lm: LocalizationManager
    @Environment(\.dismiss) private var dismiss

    @State private var device: Device?
    @State private var isLoading = true
    @State private var error: String?
    @State private var selectedTab = 0

    var body: some View {
        let t = lm.t
        Group {
            if isLoading {
                ProgressView(t.deviceDetail.loading)
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else if let error {
                VStack(spacing: 16) {
                    Image(systemName: "exclamationmark.triangle")
                        .font(.largeTitle)
                        .foregroundColor(.orange)
                    Text(t.deviceDetail.errorLoading).font(.headline)
                    Text(error)
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .multilineTextAlignment(.center)
                    Button(t.common.retry) { Task { await load(force: true) } }
                        .buttonStyle(.borderedProminent)
                }
                .padding()
            } else if let device {
                DeviceDetailRedesignView(
                    device: device,
                    selectedTab: $selectedTab,
                    onDeviceChanged: { updated in
                        self.device = updated
                        Task { await deviceStore.loadDevices() }
                    },
                    onDeviceDeleted: {
                        Task { await deviceStore.loadDevices() }
                        dismiss()
                    }
                )
            } else {
                ContentUnavailableView {
                    Label(t.deviceDetail.notFound, systemImage: "desktopcomputer")
                }
            }
        }
        .task(id: deviceId) { await load(force: false) }
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

// MARK: - Main View

struct DeviceDetailRedesignView: View {
    let deviceId: Int
    @Binding var selectedTab: Int
    let onDeviceChanged: ((Device) -> Void)?
    let onDeviceDeleted: (() -> Void)?

    @EnvironmentObject var authService: AuthService
    @EnvironmentObject var lm: LocalizationManager
    @Environment(\.dismiss) private var dismiss
    @Environment(\.colorScheme) private var colorScheme

    @State private var device: Device
    @State private var images: [DeviceImage]
    @State private var maintenanceTasks: [MaintenanceTask]
    @State private var notes: [Note]
    @State private var tags: [Tag]
    @State private var accessories: [DeviceAccessory]
    @State private var links: [DeviceLink]

    @State private var showAddTaskSheet = false
    @State private var isDeletingTask = false
    @State private var showAddNoteSheet = false
    @State private var showEditNoteSheet = false
    @State private var editingNote: Note?
    @State private var isDeletingNote = false
    @State private var showAddTagSheet = false
    @State private var tagToRemove: Tag?
    @State private var showRemoveTagAlert = false
    @State private var showAddAccessorySheet = false
    @State private var showAddLinkSheet = false
    @State private var showEditDeviceSheet = false
    @State private var showShareSheet = false
    @State private var showDeleteAlert = false
    @State private var isDeletingDevice = false
    @State private var selectedImageIndex: ImageIndex?
    @State private var showImagePicker = false
    @State private var isImageManagementMode = false
    @State private var imageToDelete: DeviceImage?
    @State private var showDeleteImageAlert = false
    @State private var imageForThumbnailChoice: DeviceImage?
    @State private var showThumbnailChoiceSheet = false
    @State private var showGenerateImageSheet = false
    @State private var openaiEnabled = false
    @State private var isTogglingFavorite = false
    @State private var isUpdatingStatus = false
    @State private var showMarkSoldSheetR = false
    @State private var showMarkForSaleSheetR = false
    @State private var showMarkReturnedSheet = false
    @State private var valueSnapshots: [ValueSnapshot] = []
    @State private var isNoteExpanded = false
    @State private var infoFullHeight: CGFloat = 0
    @State private var infoLimitedHeight: CGFloat = 0
    private var infoIsTruncated: Bool { infoFullHeight > infoLimitedHeight + 2 }
    @State private var heroThumb: UIImage?
    @State private var heroFull: UIImage?
    @State private var heroFullOpacity: Double = 0

    init(
        device: Device,
        selectedTab: Binding<Int>,
        onDeviceChanged: ((Device) -> Void)? = nil,
        onDeviceDeleted: (() -> Void)? = nil
    ) {
        self.deviceId = device.id
        self._device = State(initialValue: device)
        self._selectedTab = selectedTab
        self.onDeviceChanged = onDeviceChanged
        self.onDeviceDeleted = onDeviceDeleted
        self._maintenanceTasks = State(initialValue: device.maintenanceTasks)
        self._notes = State(initialValue: device.notes)
        self._images = State(initialValue: device.images)
        self._tags = State(initialValue: device.tags)
        self._accessories = State(initialValue: device.accessories)
        self._links = State(initialValue: device.links)
    }

    // MARK: - Body

    var body: some View {
        ZStack(alignment: .bottom) {
            Color.edSurface.ignoresSafeArea()

            Group {
                switch selectedTab {
                case 0:
                    ScrollView {
                        VStack(spacing: 16) {
                            heroSection
                            quickOverviewCard
                            indicatorGrid
                            if authService.isAuthenticated {
                                lifecycleActionsCard
                                valuationCards
                            }
                            mediaAssetsSection
                            if authService.isAuthenticated || !accessories.isEmpty {
                                accessoriesSection
                            }
                            if authService.isAuthenticated || !links.isEmpty {
                                linksSection
                            }
                            maintenanceLogsSection
                            if !notes.isEmpty {
                                archiveNotesSection
                            }
                            techSpecsSection
                            if authService.isAuthenticated {
                                deleteButton
                            }
                        }
                        .padding(.horizontal, 16)
                        .padding(.bottom, 100)
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

            // Floating tab picker
            let t = lm.t
            Picker("Section", selection: $selectedTab) {
                Text(t.deviceDetail.tabDetails).tag(0)
                Text("\(t.deviceDetail.tabPhotos) (\(images.count))").tag(1)
                Text("\(t.deviceDetail.tabTasks) (\(maintenanceTasks.count))").tag(2)
                if authService.isAuthenticated {
                    Text("\(t.deviceDetail.tabNotes) (\(notes.count))").tag(3)
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
        .navigationBarTitleDisplayMode(.inline)
        .toolbarBackground(.hidden, for: .navigationBar)
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                HStack(spacing: 12) {
                    if selectedTab == 0 {
                        Button { showShareSheet = true } label: {
                            Image(systemName: "square.and.arrow.up")
                        }
                        if authService.isAuthenticated {
                            Button { showEditDeviceSheet = true } label: {
                                Text(lm.t.common.edit)
                            }
                        }
                    } else if selectedTab == 1 && authService.isAuthenticated {
                        if openaiEnabled {
                            Button { showGenerateImageSheet = true } label: {
                                Image(systemName: "sparkles")
                            }
                        }
                        Button {
                            isImageManagementMode.toggle()
                        } label: {
                            Text(isImageManagementMode ? lm.t.deviceDetail.done : lm.t.deviceDetail.manage)
                        }
                        Button { showImagePicker = true } label: {
                            Image(systemName: "plus")
                        }
                    } else if selectedTab == 2 && authService.isAuthenticated {
                        Button { showAddTaskSheet = true } label: {
                            Image(systemName: "plus")
                        }
                    } else if selectedTab == 3 && authService.isAuthenticated {
                        Button { showAddNoteSheet = true } label: {
                            Image(systemName: "plus")
                        }
                    }
                }
            }
        }
        // MARK: Sheets
        .sheet(isPresented: $showEditDeviceSheet) {
            EditDeviceView(device: device) { updated in
                Task { @MainActor in
                    device = updated
                    images = updated.images
                    maintenanceTasks = updated.maintenanceTasks
                    notes = updated.notes
                    tags = updated.tags
                    accessories = updated.accessories
                    links = updated.links
                    await refreshDevice()
                }
            }
        }
        .sheet(isPresented: $showShareSheet) { ShareView(device: device) }
        .sheet(isPresented: $showMarkSoldSheetR) {
            MarkSoldSheetR { date, price in
                Task { await markDeviceSold(date: date, price: price) }
            }
        }
        .sheet(isPresented: $showMarkForSaleSheetR) {
            MarkForSaleSheetR { listPrice in
                Task { await markDeviceForSale(listPrice: listPrice) }
            }
        }
        .sheet(isPresented: $showMarkReturnedSheet) {
            MarkReturnedSheetR { date, fee in
                Task { await markDeviceReturned(date: date, fee: fee) }
            }
        }
        .sheet(isPresented: $showImagePicker) {
            ImageUploadView(deviceId: device.id) { newImages in
                images.append(contentsOf: newImages)
            }
        }
        .sheet(isPresented: $showGenerateImageSheet) {
            GenerateImageView(deviceId: device.id, images: images) { newImage in
                images.append(newImage)
                if newImage.isThumbnail {
                    images = images.map { img in
                        img.id == newImage.id ? img : DeviceImage(
                            id: img.id, path: img.path, thumbnailPath: img.thumbnailPath,
                            dateTaken: img.dateTaken, caption: img.caption,
                            isShopImage: img.isShopImage, isThumbnail: false,
                            thumbnailMode: img.thumbnailMode, isListingImage: img.isListingImage
                        )
                    }
                }
            }
        }
        .fullScreenCover(item: $selectedImageIndex) { idx in
            ImageViewerView(images: images.sorted(by: { $0.id > $1.id }), initialIndex: idx.value)
        }
        .sheet(isPresented: $showAddTagSheet) {
            AddTagView(deviceId: device.id, existingTags: tags) { updated in
                device = updated; tags = updated.tags
                onDeviceChanged?(updated)
            }
        }
        .sheet(isPresented: $showAddAccessorySheet) {
            AddAccessorySheet(deviceId: device.id) { accessories.append($0) }
        }
        .sheet(isPresented: $showAddLinkSheet) {
            AddLinkSheet(deviceId: device.id) { links.append($0) }
        }
        .sheet(isPresented: $showAddTaskSheet) {
            AddMaintenanceTaskView(deviceId: device.id) { maintenanceTasks.append($0) }
        }
        .sheet(isPresented: $showAddNoteSheet) {
            AddNoteView(deviceId: device.id) { notes.append($0) }
        }
        .sheet(isPresented: $showEditNoteSheet) {
            if let n = editingNote {
                EditNoteView(note: n) { updated in
                    if let i = notes.firstIndex(where: { $0.id == updated.id }) { notes[i] = updated }
                }
            }
        }
        // MARK: Alerts
        .alert(lm.t.deviceDetail.deleteDevice, isPresented: $showDeleteAlert) {
            Button(lm.t.common.cancel, role: .cancel) {}
            Button(lm.t.common.delete, role: .destructive) { Task { await deleteDevice() } }
        } message: { Text(lm.t.deviceDetail.deleteDeviceMessage) }
        .alert(lm.t.deviceDetail.deleteImage, isPresented: $showDeleteImageAlert) {
            Button(lm.t.common.cancel, role: .cancel) { imageToDelete = nil }
            Button(lm.t.common.delete, role: .destructive) {
                if let img = imageToDelete { Task { await deleteImage(img); imageToDelete = nil } }
            }
        } message: { Text(lm.t.deviceDetail.deleteImageMessage) }
        .confirmationDialog(lm.t.deviceDetail.setThumbnail, isPresented: $showThumbnailChoiceSheet, titleVisibility: .visible) {
            Button(lm.t.deviceDetail.replaceBothModes) {
                if let img = imageForThumbnailChoice { Task { await setThumbnail(img, mode: "BOTH") } }
            }
            Button(lm.t.deviceDetail.setLightMode) {
                if let img = imageForThumbnailChoice { Task { await setThumbnail(img, mode: "LIGHT") } }
            }
            Button(lm.t.deviceDetail.setDarkMode) {
                if let img = imageForThumbnailChoice { Task { await setThumbnail(img, mode: "DARK") } }
            }
            Button(lm.t.common.cancel, role: .cancel) { imageForThumbnailChoice = nil }
        } message: { Text(lm.t.deviceDetail.chooseThumbnailMessage) }
        .alert("Remove Tag", isPresented: $showRemoveTagAlert) {
            Button("Cancel", role: .cancel) { tagToRemove = nil }
            Button("Remove", role: .destructive) {
                if let tag = tagToRemove { Task { await removeTag(tag); tagToRemove = nil } }
            }
        } message: {
            if let tag = tagToRemove { Text(String(format: lm.t.deviceDetail.removeTagFmt, tag.name)) }
        }
        .task {
            if authService.isAuthenticated {
                if let snaps = try? await DeviceService.shared.fetchValueHistory(deviceId: device.id) {
                    valueSnapshots = snaps
                }
                openaiEnabled = await DeviceService.shared.checkOpenAIEnabled()
            }
        }
    }

    // MARK: - Hero Section

    private var heroSection: some View {
        let categoryYear: String = {
            var parts: [String] = [device.category.name]
            if let y = device.releaseYear { parts.append(String(y)) }
            return parts.joined(separator: " • ")
        }()

        return ZStack(alignment: .bottom) {
            // Background image — cached thumb first, full-res fades in on top
            ZStack {
                if let thumb = heroThumb {
                    Image(uiImage: thumb)
                        .resizable().scaledToFill()
                } else {
                    Rectangle().fill(Color.gray.opacity(0.15))
                        .overlay {
                            Image(systemName: "desktopcomputer")
                                .font(.system(size: 48))
                                .foregroundColor(.gray.opacity(0.4))
                        }
                }
                if let full = heroFull {
                    Image(uiImage: full)
                        .resizable().scaledToFill()
                        .opacity(heroFullOpacity)
                }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .clipped()
            .task(id: device.id) { await loadHeroImages() }

            // Gradient overlay — transparent top → black/65% bottom
            LinearGradient(
                stops: [
                    .init(color: .clear, location: 0.3),
                    .init(color: .black.opacity(0.65), location: 1.0)
                ],
                startPoint: .top,
                endPoint: .bottom
            )

            // Text overlay at bottom-left
            VStack(alignment: .leading, spacing: 3) {
                Text(categoryYear)
                    .font(.system(size: 11, weight: .bold))
                    .textCase(.uppercase)
                    .tracking(2.5)
                    .foregroundColor(.white.opacity(0.8))
                Text(device.name)
                    .font(.system(size: 28, weight: .black))
                    .tracking(-0.5)
                    .foregroundColor(.white)
                    .lineLimit(2)
                if let addlName = device.additionalName, !addlName.isEmpty {
                    Text(addlName)
                        .font(.system(size: 15, weight: .semibold))
                        .tracking(-0.2)
                        .foregroundColor(.white.opacity(0.85))
                        .lineLimit(1)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(.horizontal, 20)
            .padding(.bottom, 20)
        }
        .frame(maxWidth: .infinity)
        .aspectRatio(4 / 3, contentMode: .fit)
        .clipShape(RoundedRectangle(cornerRadius: 20))
    }

    private var statusChip: some View {
        let (label, color): (String, Color) = {
            let t = lm.t
            switch device.status {
            case .COLLECTION:   return (t.status.COLLECTION, .edPrimary)
            case .FOR_SALE:     return (t.status.FOR_SALE, .orange)
            case .PENDING_SALE: return (t.status.PENDING_SALE, .yellow)
            case .SOLD:         return (t.status.SOLD, .red)
            case .DONATED:      return (t.status.DONATED, .purple)
            case .IN_REPAIR:    return (t.status.IN_REPAIR, .teal)
            case .RETURNED:     return (t.status.RETURNED, .gray)
            }
        }()
        return Text(label)
            .font(.system(size: 11, weight: .bold))
            .textCase(.uppercase)
            .tracking(0.5)
            .foregroundColor(.white)
            .padding(.horizontal, 10)
            .padding(.vertical, 5)
            .background(color.opacity(0.85))
            .background(.ultraThinMaterial)
            .clipShape(RoundedRectangle(cornerRadius: 4))
    }

    // MARK: - Quick Overview Card

    private var quickOverviewCard: some View {
        let t = lm.t
        let mfrModel: String? = {
            let parts = [device.manufacturer, device.modelNumber]
                .compactMap { $0 }.filter { !$0.isEmpty }
            return parts.isEmpty ? nil : parts.joined(separator: " ")
        }()
        let loc: String? = device.location?.name
        let lastUsed = formatDate(device.lastPowerOnDate)

        return VStack(alignment: .leading, spacing: 10) {
            // Overline + status chip on same row
            HStack(alignment: .firstTextBaseline) {
                Text(t.deviceDetail.quickOverview)
                    .font(.system(size: 11, weight: .bold))
                    .textCase(.uppercase)
                    .tracking(2)
                    .foregroundColor(.edPrimary)
                Spacer()
                statusChip
            }

            // Manufacturer + model (unlabeled) + serial chip
            HStack(alignment: .center, spacing: 8) {
                if let mm = mfrModel {
                    Text(mm)
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundColor(.primary)
                }
                Spacer()
                if let serial = device.serialNumber, !serial.isEmpty {
                    Text(serial)
                        .font(.system(size: 11, weight: .bold).monospaced())
                        .foregroundColor(.secondary)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 5)
                        .background(Color.edSurfaceHigh)
                        .clipShape(RoundedRectangle(cornerRadius: 6))
                }
            }

            // Location + Last Used side by side (each half-width)
            if loc != nil || lastUsed != nil {
                HStack(alignment: .top, spacing: 16) {
                    if let loc {
                        VStack(alignment: .leading, spacing: 2) {
                            Text(t.deviceDetail.location)
                                .font(.system(size: 11, weight: .semibold))
                                .foregroundColor(.secondary)
                            Text(loc)
                                .font(.system(size: 13))
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                    }
                    if let lastUsed {
                        VStack(alignment: .leading, spacing: 2) {
                            Text(t.deviceDetail.lastUsedDate)
                                .font(.system(size: 11, weight: .semibold))
                                .foregroundColor(.secondary)
                            Text(lastUsed)
                                .font(.system(size: 13))
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                    }
                }
            }

            // Info text
            if let info = device.info, !info.isEmpty {
                Text(info)
                    .font(.system(size: 14))
                    .foregroundColor(.secondary)
                    .lineSpacing(3)
                    .lineLimit(isNoteExpanded ? nil : 4)
                    // Measure limited height
                    .background(GeometryReader { geo in
                        Color.clear.preference(key: InfoLimitedHeightKey.self, value: geo.size.height)
                    })
                    // Measure full natural height via hidden unlimited copy
                    .background(
                        Text(info)
                            .font(.system(size: 14))
                            .lineSpacing(3)
                            .lineLimit(nil)
                            .fixedSize(horizontal: false, vertical: true)
                            .hidden()
                            .background(GeometryReader { geo in
                                Color.clear.preference(key: InfoFullHeightKey.self, value: geo.size.height)
                            })
                    )
                    .onPreferenceChange(InfoLimitedHeightKey.self) { infoLimitedHeight = $0 }
                    .onPreferenceChange(InfoFullHeightKey.self) { infoFullHeight = $0 }

                if !isNoteExpanded && infoIsTruncated {
                    Button(lm.t.common.more) { withAnimation(.easeInOut(duration: 0.2)) { isNoteExpanded = true } }
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundColor(.edPrimary)
                } else if isNoteExpanded {
                    Button(lm.t.common.less) { withAnimation(.easeInOut(duration: 0.2)) { isNoteExpanded = false } }
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundColor(.secondary)
                }
            }

            // Tags
            if !tags.isEmpty {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 6) {
                        ForEach(tags) { tag in
                            if authService.isAuthenticated {
                                Button {
                                    tagToRemove = tag
                                    showRemoveTagAlert = true
                                } label: {
                                    HStack(spacing: 3) {
                                        Text(tag.name)
                                        Image(systemName: "xmark")
                                            .font(.system(size: 8, weight: .bold))
                                    }
                                    .font(.caption)
                                    .padding(.horizontal, 8)
                                    .padding(.vertical, 4)
                                    .background(Color.edPrimary.opacity(0.1))
                                    .foregroundColor(.edPrimary)
                                    .clipShape(Capsule())
                                }
                            } else {
                                Text(tag.name)
                                    .font(.caption)
                                    .padding(.horizontal, 8)
                                    .padding(.vertical, 4)
                                    .background(Color.edPrimary.opacity(0.1))
                                    .foregroundColor(.edPrimary)
                                    .clipShape(Capsule())
                            }
                        }
                        if authService.isAuthenticated {
                            Button { showAddTagSheet = true } label: {
                                Image(systemName: "plus")
                                    .font(.system(size: 9, weight: .bold))
                                    .padding(6)
                                    .background(Color.edSurfaceHigh)
                                    .clipShape(Circle())
                                    .foregroundColor(.secondary)
                            }
                        }
                    }
                }
            } else if authService.isAuthenticated {
                Button { showAddTagSheet = true } label: {
                    Label(lm.t.tag.addTitle, systemImage: "plus")
                        .font(.caption)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(Color.edSurfaceHigh)
                        .foregroundColor(.secondary)
                        .clipShape(Capsule())
                }
            }
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.edSurfaceLowest)
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    // MARK: - Indicator Grid

    private var indicatorGrid: some View {
        let t = lm.t
        let hasOriginalBox = accessories.contains(where: { $0.name == "Original Box" })
        let isPram = device.isPramBatteryRemoved ?? false
        let isComputer = device.category.type == "COMPUTER"

        return LazyVGrid(
            columns: Array(repeating: GridItem(.flexible(), spacing: 10), count: 3),
            spacing: 10
        ) {
            // Functional status
            indicatorTile(
                icon: device.functionalStatus == .YES ? "hand.thumbsup.fill"
                    : device.functionalStatus == .PARTIAL ? "exclamationmark.triangle.fill"
                    : "hand.thumbsdown.fill",
                label: device.functionalStatus == .YES ? t.functionalStatus.YES
                    : device.functionalStatus == .PARTIAL ? t.functionalStatus.PARTIAL
                    : t.functionalStatus.NO,
                color: device.functionalStatus == .YES ? .green
                    : device.functionalStatus == .PARTIAL ? .orange
                    : .red,
                active: true
            )

            // Rarity
            indicatorTile(
                icon: device.rarity != nil && device.rarity != .COMMON ? "crown.fill" : "crown",
                label: device.rarity?.displayName ?? t.deviceDetail.rarity,
                color: {
                    switch device.rarity {
                    case .COMMON, .none: return Color.secondary
                    case .UNCOMMON: return Color.yellow
                    case .RARE: return Color.green
                    case .VERY_RARE: return Color.blue
                    case .EXTREMELY_RARE: return Color.purple
                    }
                }(),
                active: device.rarity != nil && device.rarity != .COMMON
            )

            // Asset tagged
            indicatorTile(
                icon: "tag.fill",
                label: t.deviceDetail.indicatorTagged,
                color: device.isAssetTagged ? .green : .secondary,
                active: device.isAssetTagged
            )

            // Original box
            indicatorTile(
                icon: "shippingbox.fill",
                label: t.deviceDetail.indicatorBoxed,
                color: hasOriginalBox ? .green : .secondary,
                active: hasOriginalBox
            )

            // PRAM battery (always shown for computers, hidden for others)
            if isComputer {
                indicatorTile(
                    icon: isPram ? "battery.0" : "battery.100",
                    label: isPram ? t.deviceDetail.indicatorNoPram : t.deviceDetail.indicatorPramInstalled,
                    color: isPram ? .green : .red,
                    active: true
                )
            } else {
                indicatorTile(
                    icon: "tag.fill",
                    label: t.deviceDetail.indicatorBoxed,
                    color: .secondary,
                    active: false
                )
                .hidden()
            }

            // Favorite — tappable if authenticated
            if authService.isAuthenticated {
                Button {
                    Task { await toggleFavorite() }
                } label: {
                    indicatorTileContent(
                        icon: device.isFavorite ? "star.fill" : "star",
                        label: t.deviceDetail.indicatorFavorite,
                        color: device.isFavorite ? .yellow : .secondary,
                        active: device.isFavorite
                    )
                }
                .buttonStyle(.plain)
                .disabled(isTogglingFavorite)
            } else {
                indicatorTile(
                    icon: device.isFavorite ? "star.fill" : "star",
                    label: t.deviceDetail.indicatorFavorite,
                    color: device.isFavorite ? .yellow : .secondary,
                    active: device.isFavorite
                )
            }
        }
    }

    private func indicatorTile(icon: String, label: String, color: Color, active: Bool) -> some View {
        indicatorTileContent(icon: icon, label: label, color: color, active: active)
    }

    private func indicatorTileContent(icon: String, label: String, color: Color, active: Bool) -> some View {
        VStack(spacing: 6) {
            Image(systemName: icon)
                .font(.system(size: 20, weight: .medium))
                .foregroundColor(active ? color : .secondary.opacity(0.4))
            Text(label)
                .font(.system(size: 9, weight: .bold))
                .textCase(.uppercase)
                .tracking(0.5)
                .foregroundColor(.secondary)
                .lineLimit(1)
                .minimumScaleFactor(0.7)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 12)
        .background(Color.edSurfaceLow)
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }

    // MARK: - Valuation Cards

    private var valuationCards: some View {
        let t = lm.t
        let symbol = t.common.currencySymbol
        let appreciation: Double? = {
            guard let paid = device.priceAcquired, paid > 0,
                  let value = device.estimatedValue else { return nil }
            return ((value - paid) / paid) * 100
        }()

        return HStack(spacing: 10) {
            // Acquisition card
            VStack(alignment: .leading, spacing: 6) {
                Text(t.deviceDetail.priceAcquired)
                    .font(.system(size: 10, weight: .bold))
                    .textCase(.uppercase)
                    .tracking(1)
                    .foregroundColor(.secondary)
                if let paid = device.priceAcquired {
                    Text("\(symbol)\(String(format: "%.0f", paid))")
                        .font(.system(size: 24, weight: .black))
                        .tracking(-0.5)
                } else {
                    Text("—")
                        .font(.system(size: 24, weight: .black))
                        .foregroundColor(.secondary)
                }
                if let date = formatDate(device.dateAcquired) {
                    Text(date)
                        .font(.system(size: 11))
                        .foregroundColor(.secondary)
                }
                if let src = device.whereAcquired, !src.isEmpty {
                    Text(src)
                        .font(.system(size: 11))
                        .foregroundColor(.secondary)
                        .lineLimit(1)
                }
            }
            .padding(16)
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
            .background(Color.edSurfaceLowest)
            .clipShape(RoundedRectangle(cornerRadius: 16))

            // Right card — varies by status
            switch device.status {
            case .SOLD:
                VStack(alignment: .leading, spacing: 6) {
                    Text(t.deviceDetail.soldPrice)
                        .font(.system(size: 10, weight: .bold))
                        .textCase(.uppercase)
                        .tracking(1)
                        .foregroundColor(.secondary)
                    if let sold = device.soldPrice {
                        Text("\(symbol)\(String(format: "%.0f", sold))")
                            .font(.system(size: 24, weight: .black))
                            .tracking(-0.5)
                            .foregroundColor(.red)
                    } else {
                        Text("—")
                            .font(.system(size: 24, weight: .black))
                            .foregroundColor(.secondary)
                    }
                    if let date = formatDate(device.soldDate) {
                        Text(date).font(.system(size: 11)).foregroundColor(.secondary)
                    }
                }
                .padding(16)
                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
                .background(Color.edSurfaceLowest)
                .clipShape(RoundedRectangle(cornerRadius: 16))

            case .RETURNED:
                VStack(alignment: .leading, spacing: 6) {
                    Text(t.deviceDetail.returnedDate)
                        .font(.system(size: 10, weight: .bold))
                        .textCase(.uppercase)
                        .tracking(1)
                        .foregroundColor(.secondary)
                    if let date = formatDate(device.soldDate) {
                        Text(date)
                            .font(.system(size: 16, weight: .black))
                            .tracking(-0.3)
                            .foregroundColor(.primary)
                    } else {
                        Text("—")
                            .font(.system(size: 24, weight: .black))
                            .foregroundColor(.secondary)
                    }
                    if let fee = device.soldPrice, fee > 0 {
                        Text("\(t.deviceDetail.repairFeeCharged): \(symbol)\(String(format: "%.0f", fee))")
                            .font(.system(size: 11, weight: .semibold))
                            .foregroundColor(.secondary)
                    }
                }
                .padding(16)
                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
                .background(Color.edSurfaceLowest)
                .clipShape(RoundedRectangle(cornerRadius: 16))

            case .DONATED:
                VStack(alignment: .leading, spacing: 6) {
                    Text(t.deviceDetail.donatedDate)
                        .font(.system(size: 10, weight: .bold))
                        .textCase(.uppercase)
                        .tracking(1)
                        .foregroundColor(.secondary)
                    if let date = formatDate(device.soldDate) {
                        Text(date)
                            .font(.system(size: 16, weight: .black))
                            .tracking(-0.3)
                            .foregroundColor(.purple)
                    } else {
                        Text("—")
                            .font(.system(size: 24, weight: .black))
                            .foregroundColor(.secondary)
                    }
                }
                .padding(16)
                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
                .background(Color.edSurfaceLowest)
                .clipShape(RoundedRectangle(cornerRadius: 16))

            default:
                // Collection / For Sale / Pending / In Repair: estimated value
                VStack(alignment: .leading, spacing: 6) {
                    Text(t.deviceDetail.estimatedValue)
                        .font(.system(size: 10, weight: .bold))
                        .textCase(.uppercase)
                        .tracking(1)
                        .foregroundColor(.secondary)
                    if let value = device.estimatedValue {
                        Text("\(symbol)\(String(format: "%.0f", value))")
                            .font(.system(size: 24, weight: .black))
                            .tracking(-0.5)
                            .foregroundColor(.edTertiary)
                    } else {
                        Text("—")
                            .font(.system(size: 24, weight: .black))
                            .foregroundColor(.secondary)
                    }
                    if device.status == .FOR_SALE || device.status == .PENDING_SALE,
                       let list = device.listPrice {
                        Text("\(t.deviceDetail.listPrice): \(symbol)\(String(format: "%.0f", list))")
                            .font(.system(size: 11, weight: .semibold))
                            .foregroundColor(.orange)
                    } else if let pct = appreciation {
                        let isPositive = pct >= 0
                        Text("\(isPositive ? "+" : "")\(String(format: "%.0f", pct))% \(isPositive ? t.deviceDetail.appreciation : t.deviceDetail.depreciation)")
                            .font(.system(size: 11, weight: .semibold))
                            .foregroundColor(isPositive ? .green : .red)
                    }
                }
                .padding(16)
                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
                .background(Color.edSurfaceLowest)
                .clipShape(RoundedRectangle(cornerRadius: 16))
            }
        }
    }

    // MARK: - Media & Assets

    private var mediaAssetsSection: some View {
        let t = lm.t
        let sortedImages = images.sorted(by: { $0.id > $1.id })
        let maxImages = 7
        let showAdd = authService.isAuthenticated

        return VStack(alignment: .leading, spacing: 10) {
            sectionOverline(t.deviceDetail.tabPhotos)

            LazyVGrid(
                columns: Array(repeating: GridItem(.flexible(), spacing: 6), count: 4),
                spacing: 6
            ) {
                ForEach(Array(sortedImages.prefix(maxImages).enumerated()), id: \.element.id) { index, image in
                    let isOverflowCell = index == maxImages - 1 && sortedImages.count > maxImages
                    let remaining = sortedImages.count - maxImages

                    MediaThumbCell(url: APIService.shared.imageURL(for: image.thumbnailPath ?? image.path))
                        .overlay {
                            if isOverflowCell {
                                RoundedRectangle(cornerRadius: 10)
                                    .fill(Color.black.opacity(0.55))
                                VStack(spacing: 2) {
                                    Text("···")
                                        .font(.system(size: 18, weight: .bold))
                                        .foregroundColor(.white)
                                    Text("+\(remaining)")
                                        .font(.system(size: 13, weight: .semibold))
                                        .foregroundColor(.white.opacity(0.9))
                                }
                            }
                        }
                        .onTapGesture { selectedImageIndex = ImageIndex(value: index) }
                }

                if showAdd {
                    Button { showImagePicker = true } label: {
                        ZStack {
                            RoundedRectangle(cornerRadius: 10)
                                .strokeBorder(style: StrokeStyle(lineWidth: 1.5, dash: [4]))
                                .foregroundColor(Color.secondary.opacity(0.4))
                                .background(Color.edSurfaceHigh.clipShape(RoundedRectangle(cornerRadius: 10)))
                            Image(systemName: "plus")
                                .font(.system(size: 18, weight: .light))
                                .foregroundColor(.secondary)
                        }
                        .frame(maxWidth: .infinity)
                        .aspectRatio(1, contentMode: .fit)
                    }
                    .buttonStyle(.plain)
                }
            }

            if images.isEmpty && !showAdd {
                Text(t.deviceDetail.noPhotosMessage)
                    .font(.caption)
                    .foregroundColor(.secondary)
                    .frame(maxWidth: .infinity, alignment: .center)
                    .padding(.vertical, 8)
            }
        }
    }

    // MARK: - Accessories

    private var accessoriesSection: some View {
        let t = lm.t
        return VStack(alignment: .leading, spacing: 10) {
            HStack {
                sectionOverline(t.deviceDetail.accessories)
                Spacer()
                if authService.isAuthenticated {
                    Button { showAddAccessorySheet = true } label: {
                        Image(systemName: "plus")
                            .font(.system(size: 13, weight: .bold))
                            .foregroundColor(.edPrimary)
                    }
                }
            }

            if accessories.isEmpty {
                Text(t.deviceDetail.noAccessories)
                    .font(.caption)
                    .foregroundColor(.secondary)
            } else {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        ForEach(accessories) { accessory in
                            HStack(spacing: 5) {
                                Text(accessory.name)
                                    .font(.system(size: 12, weight: .semibold))
                                if authService.isAuthenticated {
                                    Button { Task { await removeAccessory(accessory) } } label: {
                                        Image(systemName: "xmark")
                                            .font(.system(size: 9, weight: .bold))
                                    }
                                }
                            }
                            .foregroundColor(.primary)
                            .padding(.horizontal, 10)
                            .padding(.vertical, 7)
                            .background(Color.edSurfaceLowest)
                            .clipShape(RoundedRectangle(cornerRadius: 8))
                        }
                    }
                    .padding(.vertical, 4)
                }
                .padding(.horizontal, -4)
            }
        }
    }

    // MARK: - Reference Links

    private var linksSection: some View {
        let t = lm.t
        return VStack(alignment: .leading, spacing: 10) {
            HStack {
                sectionOverline(t.deviceDetail.referenceLinks)
                Spacer()
                if authService.isAuthenticated {
                    Button { showAddLinkSheet = true } label: {
                        Image(systemName: "plus")
                            .font(.system(size: 13, weight: .bold))
                            .foregroundColor(.edPrimary)
                    }
                }
            }

            if links.isEmpty {
                Text(t.deviceDetail.noLinks)
                    .font(.caption)
                    .foregroundColor(.secondary)
                    .padding(.vertical, 4)
            } else {
                VStack(spacing: 6) {
                    ForEach(links) { link in
                        HStack(spacing: 10) {
                            if let url = URL(string: link.url) {
                                Link(destination: url) {
                                    HStack(spacing: 8) {
                                        Image(systemName: "arrow.up.right.square")
                                            .font(.system(size: 14))
                                            .foregroundColor(.edPrimary)
                                        VStack(alignment: .leading, spacing: 2) {
                                            Text(link.label)
                                                .font(.system(size: 13, weight: .semibold))
                                                .foregroundColor(.primary)
                                            Text(link.url)
                                                .font(.system(size: 11))
                                                .foregroundColor(.secondary)
                                                .lineLimit(1)
                                        }
                                        Spacer()
                                    }
                                }
                            } else {
                                HStack(spacing: 8) {
                                    Image(systemName: "link")
                                        .font(.system(size: 14))
                                        .foregroundColor(.secondary)
                                    VStack(alignment: .leading, spacing: 2) {
                                        Text(link.label)
                                            .font(.system(size: 13, weight: .semibold))
                                        Text(link.url)
                                            .font(.system(size: 11))
                                            .foregroundColor(.secondary)
                                            .lineLimit(1)
                                    }
                                    Spacer()
                                }
                            }
                            if authService.isAuthenticated {
                                Button { Task { await removeLink(link) } } label: {
                                    Image(systemName: "trash")
                                        .font(.system(size: 12))
                                        .foregroundColor(.red.opacity(0.7))
                                }
                                .buttonStyle(.plain)
                            }
                        }
                        .padding(12)
                        .background(Color.edSurfaceLow)
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                    }
                }
            }
        }
    }

    // MARK: - Maintenance Logs

    private var maintenanceLogsSection: some View {
        let t = lm.t
        let recent = maintenanceTasks.sorted(by: { $0.dateCompleted > $1.dateCompleted }).prefix(3)

        return VStack(alignment: .leading, spacing: 10) {
            HStack {
                sectionOverline(t.deviceDetail.maintenanceLogs)
                Spacer()
                if authService.isAuthenticated {
                    Button { showAddTaskSheet = true } label: {
                        Image(systemName: "plus")
                            .font(.system(size: 13, weight: .bold))
                            .foregroundColor(.edPrimary)
                    }
                }
            }

            if maintenanceTasks.isEmpty {
                Text(t.deviceDetail.noTasksMessage)
                    .font(.caption)
                    .foregroundColor(.secondary)
                    .padding(.vertical, 4)
            } else {
                VStack(spacing: 8) {
                    ForEach(recent) { task in
                        HStack(spacing: 12) {
                            ZStack {
                                Circle()
                                    .fill(Color.edSurfaceHigh)
                                    .frame(width: 40, height: 40)
                                Image(systemName: "wrench.and.screwdriver")
                                    .font(.system(size: 16))
                                    .foregroundColor(.secondary)
                            }
                            VStack(alignment: .leading, spacing: 2) {
                                Text(task.label)
                                    .font(.system(size: 14, weight: .bold))
                                    .lineLimit(1)
                                HStack(spacing: 4) {
                                    Text(formatDate(task.dateCompleted) ?? task.dateCompleted)
                                        .font(.system(size: 12))
                                        .foregroundColor(.secondary)
                                    if let notes = task.notes, !notes.isEmpty {
                                        Text("•")
                                            .font(.system(size: 12))
                                            .foregroundColor(.secondary)
                                        Text(notes)
                                            .font(.system(size: 12))
                                            .foregroundColor(.secondary)
                                            .lineLimit(1)
                                    }
                                }
                            }
                            Spacer()
                        }
                        .padding(12)
                        .background(Color.edSurfaceLow)
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                    }

                    if maintenanceTasks.count > 3 {
                        Button { selectedTab = 2 } label: {
                            HStack {
                                Text(String(format: lm.t.deviceDetail.moreItemsFmt, maintenanceTasks.count - 3))
                                    .font(.system(size: 13, weight: .semibold))
                                    .foregroundColor(.edPrimary)
                                Spacer()
                                Image(systemName: "chevron.right")
                                    .font(.system(size: 12, weight: .semibold))
                                    .foregroundColor(.edPrimary)
                            }
                            .padding(.horizontal, 14)
                            .padding(.vertical, 10)
                        }
                        .buttonStyle(.plain)
                    }
                }
            }
        }
    }

    // MARK: - Technical Specifications

    private var techSpecsSection: some View {
        let t = lm.t
        let specs: [(String, String)] = [
            device.cpu.map { (t.deviceDetail.cpu, $0) },
            device.ram.map { (t.deviceDetail.ram, $0) },
            device.storage.map { (t.deviceDetail.storage, $0) },
            device.operatingSystem.map { (t.deviceDetail.operatingSystem, $0) },
            device.graphics.map { (t.deviceDetail.graphics, $0) },
        ].compactMap { $0 }

        guard !specs.isEmpty || device.isWifiEnabled != nil else { return AnyView(EmptyView()) }

        return AnyView(
            VStack(alignment: .leading, spacing: 10) {
                sectionOverline(t.deviceDetail.techSpecs)

                VStack(spacing: 0) {
                    ForEach(Array(specs.enumerated()), id: \.offset) { index, spec in
                        HStack {
                            Text(spec.0)
                                .font(.system(size: 13))
                                .foregroundColor(.secondary)
                            Spacer()
                            Text(spec.1)
                                .font(.system(size: 13, weight: .bold))
                                .multilineTextAlignment(.trailing)
                        }
                        .padding(.horizontal, 14)
                        .padding(.vertical, 10)
                        .background(index % 2 == 0 ? Color.edSurfaceLow : Color.edSurfaceHigh.opacity(0.5))
                    }

                    // WiFi row
                    if let wifi = device.isWifiEnabled {
                        HStack {
                            Text(t.deviceDetail.wifiEnabled)
                                .font(.system(size: 13))
                                .foregroundColor(.secondary)
                            Spacer()
                            Text(wifi ? t.common.yes : t.common.no)
                                .font(.system(size: 13, weight: .bold))
                        }
                        .padding(.horizontal, 14)
                        .padding(.vertical, 10)
                        .background(specs.count % 2 == 0 ? Color.edSurfaceLow : Color.edSurfaceHigh.opacity(0.5))
                    }
                }
                .clipShape(RoundedRectangle(cornerRadius: 14))
            }
        )
    }

    // MARK: - Recent Notes

    private var archiveNotesSection: some View {
        let t = lm.t
        let recentNotes = notes.sorted(by: { $0.date > $1.date }).prefix(5)
        guard !recentNotes.isEmpty || authService.isAuthenticated else { return AnyView(EmptyView()) }

        return AnyView(
            VStack(alignment: .leading, spacing: 10) {
                HStack {
                    sectionOverline(t.deviceDetail.recentNotes)
                    Spacer()
                    if authService.isAuthenticated {
                        Button { showAddNoteSheet = true } label: {
                            Image(systemName: "plus")
                                .font(.system(size: 13, weight: .bold))
                                .foregroundColor(.edPrimary)
                        }
                    }
                }

                if recentNotes.isEmpty {
                    Text(t.deviceDetail.noNotesMessage)
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .padding(.vertical, 4)
                }

                VStack(spacing: 8) {
                    ForEach(Array(recentNotes.enumerated()), id: \.element.id) { index, note in
                        VStack(alignment: .leading, spacing: 8) {
                            HStack(spacing: 6) {
                                Circle()
                                    .fill(Color.edTertiary)
                                    .frame(width: 7, height: 7)
                                Text(formatDate(note.date) ?? note.date)
                                    .font(.system(size: 11, weight: .bold))
                                    .foregroundColor(.secondary)
                            }
                            Text(note.content)
                                .font(.system(size: 13))
                                .italic()
                                .foregroundColor(.secondary)
                                .lineSpacing(4)
                                .lineLimit(5)
                        }
                        .padding(16)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .background(Color.edSurfaceLowest)
                        .clipShape(RoundedRectangle(cornerRadius: 16))
                    }

                    if notes.count > 5 {
                        Button { selectedTab = 3 } label: {
                            HStack {
                                Text(String(format: lm.t.deviceDetail.moreItemsFmt, notes.count - 5))
                                    .font(.system(size: 13, weight: .semibold))
                                    .foregroundColor(.edPrimary)
                                Spacer()
                                Image(systemName: "chevron.right")
                                    .font(.system(size: 12, weight: .semibold))
                                    .foregroundColor(.edPrimary)
                            }
                            .padding(.horizontal, 14)
                            .padding(.vertical, 10)
                        }
                        .buttonStyle(.plain)
                    }
                }
            }
        )
    }

    // MARK: - Delete Button

    private var deleteButton: some View {
        Button {
            showDeleteAlert = true
        } label: {
            HStack {
                Image(systemName: "trash")
                Text(lm.t.deviceDetail.deleteDevice)
            }
            .font(.system(size: 15, weight: .medium))
            .foregroundColor(.red)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 14)
            .background(Color.red.opacity(0.08))
            .clipShape(RoundedRectangle(cornerRadius: 12))
        }
        .disabled(isDeletingDevice)
        .padding(.top, 8)
    }

    // MARK: - Media Thumbnail Cell

    private struct MediaThumbCell: View {
        let url: URL?
        @State private var uiImage: UIImage?

        var body: some View {
            Color.clear
                .aspectRatio(1, contentMode: .fit)
                .overlay {
                    Group {
                        if let img = uiImage {
                            Image(uiImage: img)
                                .resizable()
                                .scaledToFill()
                        } else {
                            Color.gray.opacity(0.2)
                                .overlay { ProgressView().scaleEffect(0.7) }
                        }
                    }
                    .clipped()
                }
                .clipShape(RoundedRectangle(cornerRadius: 10))
                .task(id: url) {
                    guard let url else { return }
                    guard let (data, _) = try? await URLSession.shared.data(from: url),
                          let image = UIImage(data: data) else { return }
                    uiImage = image
                }
        }
    }

    // MARK: - Section Overline Helper

    private func sectionOverline(_ title: String) -> some View {
        Text(title)
            .font(.system(size: 11, weight: .bold))
            .textCase(.uppercase)
            .tracking(1.5)
            .foregroundColor(.secondary)
    }

    // MARK: - Photos Tab

    private var photosSection: some View {
        Group {
            if images.isEmpty {
                ContentUnavailableView {
                    Label(lm.t.deviceDetail.noPhotos, systemImage: "photo.on.rectangle")
                } description: {
                    Text(lm.t.deviceDetail.noPhotosMessage)
                }
            } else {
                LazyVGrid(columns: [
                    GridItem(.flexible(), spacing: 4),
                    GridItem(.flexible(), spacing: 4),
                    GridItem(.flexible(), spacing: 4)
                ], spacing: 4) {
                    ForEach(Array(images.sorted(by: { $0.id > $1.id }).enumerated()), id: \.element.id) { index, image in
                        ZStack {
                            GeometryReader { geo in
                                AsyncImage(url: APIService.shared.imageURL(for: image.thumbnailPath ?? image.path)) { phase in
                                    switch phase {
                                    case .success(let img):
                                        img.resizable().scaledToFill()
                                            .frame(width: geo.size.width, height: geo.size.height)
                                            .clipped()
                                    case .empty:
                                        Rectangle().fill(Color.gray.opacity(0.2))
                                            .overlay { ProgressView() }
                                    default:
                                        Rectangle().fill(Color.gray.opacity(0.2))
                                            .overlay { Image(systemName: "photo").foregroundColor(.gray) }
                                    }
                                }
                            }

                            if isImageManagementMode {
                                VStack(spacing: 0) {
                                    HStack(spacing: 0) {
                                        Button {
                                            if !image.isThumbnail {
                                                if images.contains(where: { $0.isThumbnail }) {
                                                    imageForThumbnailChoice = image
                                                    showThumbnailChoiceSheet = true
                                                } else {
                                                    Task { await setThumbnail(image, mode: "BOTH") }
                                                }
                                            }
                                        } label: {
                                            Color.clear.overlay(alignment: .topLeading) {
                                                Image(systemName: "photo.fill")
                                                    .font(.system(size: 16)).foregroundColor(.white)
                                                    .padding(6)
                                                    .background(image.isThumbnail ? Color.blue : Color.gray.opacity(0.6))
                                                    .clipShape(Circle()).padding(8)
                                            }
                                        }
                                        Button {
                                            imageToDelete = image
                                            showDeleteImageAlert = true
                                        } label: {
                                            Color.clear.overlay(alignment: .topTrailing) {
                                                Image(systemName: "trash.fill")
                                                    .font(.system(size: 16)).foregroundColor(.white)
                                                    .padding(6)
                                                    .background(Color.red.opacity(0.8))
                                                    .clipShape(Circle()).padding(8)
                                            }
                                        }
                                    }
                                    HStack(spacing: 0) {
                                        Button { Task { await setListingImage(image) } } label: {
                                            Color.clear.overlay(alignment: .bottomLeading) {
                                                Image(systemName: "storefront.fill")
                                                    .font(.system(size: 16)).foregroundColor(.white)
                                                    .padding(6)
                                                    .background(image.isListingImage ? Color.orange : Color.gray.opacity(0.6))
                                                    .clipShape(Circle()).padding(8)
                                            }
                                        }
                                        Button { Task { await toggleShopImage(image) } } label: {
                                            Color.clear.overlay(alignment: .bottomTrailing) {
                                                Image(systemName: "bag.fill")
                                                    .font(.system(size: 16)).foregroundColor(.white)
                                                    .padding(6)
                                                    .background(image.isShopImage ? Color.green : Color.gray.opacity(0.6))
                                                    .clipShape(Circle()).padding(8)
                                            }
                                        }
                                    }
                                }
                            } else {
                                VStack {
                                    HStack {
                                        if image.isThumbnail {
                                            Image(systemName: "photo.fill").font(.system(size: 14)).foregroundColor(.white)
                                                .padding(4).background(Color.blue).clipShape(Circle())
                                        }
                                        Spacer()
                                    }
                                    Spacer()
                                    HStack {
                                        if image.isListingImage {
                                            Image(systemName: "storefront.fill").font(.system(size: 14)).foregroundColor(.white)
                                                .padding(4).background(Color.orange).clipShape(Circle())
                                        }
                                        Spacer()
                                        if image.isShopImage {
                                            Image(systemName: "bag.fill").font(.system(size: 14)).foregroundColor(.white)
                                                .padding(4).background(Color.green).clipShape(Circle())
                                        }
                                    }
                                }
                                .padding(4)
                            }
                        }
                        .frame(height: 100)
                        .clipShape(RoundedRectangle(cornerRadius: 8))
                        .onTapGesture {
                            if !isImageManagementMode { selectedImageIndex = ImageIndex(value: index) }
                        }
                    }
                }
            }
        }
    }

    // MARK: - Tasks Tab

    private var tasksSection: some View {
        let t = lm.t
        return VStack(spacing: 12) {
            Text(t.deviceDetail.maintenanceTasks)
                .font(.headline)
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.bottom, 4)

            if maintenanceTasks.isEmpty {
                ContentUnavailableView {
                    Label(t.deviceDetail.noTasks, systemImage: "wrench.and.screwdriver")
                } description: {
                    Text(t.deviceDetail.noTasksMessage)
                }
                .frame(maxWidth: .infinity, minHeight: 200)
            } else {
                VStack(spacing: 12) {
                    ForEach(maintenanceTasks.sorted(by: { $0.dateCompleted > $1.dateCompleted })) { task in
                        TaskRowView(task: task) { Task { await deleteTask(task) } }
                    }
                }
            }
        }
    }

    // MARK: - Notes Tab

    private var notesSection: some View {
        let t = lm.t
        return VStack(spacing: 12) {
            Text(t.deviceDetail.notes)
                .font(.headline)
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.bottom, 4)

            if notes.isEmpty {
                ContentUnavailableView {
                    Label(t.deviceDetail.noNotes, systemImage: "note.text")
                } description: {
                    Text(t.deviceDetail.noNotesMessage)
                }
                .frame(maxWidth: .infinity, minHeight: 200)
            } else {
                VStack(spacing: 12) {
                    ForEach(notes.sorted(by: { $0.date > $1.date })) { note in
                        NoteRowView(note: note) {
                            editingNote = note
                            showEditNoteSheet = true
                        } onDelete: {
                            Task { await deleteNote(note) }
                        }
                    }
                }
            }
        }
    }

    // MARK: - Actions

    private func loadHeroImages() async {
        // Reset so a device change doesn't flash old art
        heroThumb = nil
        heroFull = nil
        heroFullOpacity = 0

        guard let img = device.thumbnailImage(for: colorScheme) else { return }

        // Stage 1 — cached 320px thumbnail (memory/disk, typically instant)
        if let thumbURL = APIService.shared.imageURL(for: img.thumbnailPath ?? img.path) {
            heroThumb = await ImageCacheService.shared.loadImage(for: thumbURL)
        }

        // Stage 2 — full-resolution source image; fade in when ready
        if let fullURL = APIService.shared.imageURL(for: img.path),
           let (data, _) = try? await URLSession.shared.data(from: fullURL),
           let fullImage = UIImage(data: data) {
            heroFull = fullImage
            withAnimation(.easeIn(duration: 0.35)) {
                heroFullOpacity = 1.0
            }
        }
    }

    private func toggleFavorite() async {
        isTogglingFavorite = true
        do {
            let updated = try await DeviceService.shared.updateDevice(
                id: deviceId, input: ["isFavorite": !device.isFavorite]
            )
            applyUpdate(updated)
        } catch { print("toggleFavorite: \(error)") }
        isTogglingFavorite = false
    }

    // MARK: - Lifecycle Actions Card

    @ViewBuilder
    private var lifecycleActionsCard: some View {
        let t = lm.t
        let hasActions: Bool = {
            switch device.status {
            case .COLLECTION, .FOR_SALE, .PENDING_SALE, .IN_REPAIR, .REPAIRED: return true
            default: return false
            }
        }()

        if hasActions {
            VStack(alignment: .leading, spacing: 10) {
                Text(t.deviceDetail.lifecycleActions)
                    .font(.system(size: 11, weight: .bold))
                    .textCase(.uppercase)
                    .tracking(1.5)
                    .foregroundColor(.secondary)

                HStack(spacing: 10) {
                    switch device.status {
                    case .COLLECTION:
                        lifecycleButton(
                            title: t.deviceDetail.markForSale,
                            icon: "storefront",
                            color: .orange
                        ) {
                            showMarkForSaleSheetR = true
                        }

                    case .FOR_SALE:
                        lifecycleButton(
                            title: t.deviceDetail.markPending,
                            icon: "clock.badge.checkmark",
                            color: .yellow
                        ) {
                            Task { await updateDeviceStatus(.PENDING_SALE) }
                        }
                        lifecycleButton(
                            title: t.deviceDetail.markSold,
                            icon: "dollarsign.circle",
                            color: .green
                        ) {
                            showMarkSoldSheetR = true
                        }

                    case .PENDING_SALE:
                        lifecycleButton(
                            title: t.deviceDetail.markForSale,
                            icon: "storefront",
                            color: .orange
                        ) {
                            Task { await updateDeviceStatus(.FOR_SALE) }
                        }
                        lifecycleButton(
                            title: t.deviceDetail.markSold,
                            icon: "dollarsign.circle",
                            color: .green
                        ) {
                            showMarkSoldSheetR = true
                        }

                    case .IN_REPAIR:
                        lifecycleButton(
                            title: t.deviceDetail.markRepaired,
                            icon: "checkmark.seal",
                            color: .mint
                        ) {
                            Task { await updateDeviceStatus(.REPAIRED) }
                        }

                    case .REPAIRED:
                        lifecycleButton(
                            title: t.deviceDetail.backToRepair,
                            icon: "wrench.and.screwdriver",
                            color: .teal
                        ) {
                            Task { await updateDeviceStatus(.IN_REPAIR) }
                        }
                        lifecycleButton(
                            title: t.deviceDetail.markReturned,
                            icon: "arrow.uturn.backward.circle",
                            color: .green
                        ) {
                            showMarkReturnedSheet = true
                        }

                    default:
                        EmptyView()
                    }

                    Spacer()
                }
            }
            .padding(16)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(Color.edSurfaceLowest)
            .clipShape(RoundedRectangle(cornerRadius: 16))
        }
    }

    private func lifecycleButton(title: String, icon: String, color: Color, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            VStack(spacing: 6) {
                Image(systemName: icon)
                    .font(.system(size: 20, weight: .medium))
                    .foregroundColor(color)
                Text(title)
                    .font(.system(size: 11, weight: .semibold))
                    .foregroundColor(.primary)
                    .multilineTextAlignment(.center)
                    .lineLimit(2)
                    .minimumScaleFactor(0.8)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 12)
            .padding(.horizontal, 8)
            .background(color.opacity(0.1))
            .clipShape(RoundedRectangle(cornerRadius: 12))
        }
        .buttonStyle(.plain)
        .disabled(isUpdatingStatus)
    }

    private func markDeviceForSale(listPrice: Double) async {
        isUpdatingStatus = true
        do {
            let updated = try await DeviceService.shared.updateDevice(
                id: deviceId, input: ["status": "FOR_SALE", "listPrice": listPrice]
            )
            applyUpdate(updated)
        } catch { print("markForSale: \(error)") }
        isUpdatingStatus = false
    }

    private func updateDeviceStatus(_ newStatus: Status) async {
        isUpdatingStatus = true
        do {
            let updated = try await DeviceService.shared.updateDevice(
                id: deviceId, input: ["status": newStatus.rawValue]
            )
            applyUpdate(updated)
        } catch { print("updateDeviceStatus: \(error)") }
        isUpdatingStatus = false
    }

    private func markDeviceReturned(date: Date, fee: Double?) async {
        isUpdatingStatus = true
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        var input: [String: Any] = ["status": "RETURNED", "soldDate": formatter.string(from: date)]
        if let f = fee { input["soldPrice"] = f }
        do {
            let updated = try await DeviceService.shared.updateDevice(id: deviceId, input: input)
            applyUpdate(updated)
        } catch { print("markReturned: \(error)") }
        isUpdatingStatus = false
    }

    private func markDeviceSold(date: Date, price: Double?) async {
        isUpdatingStatus = true
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        var input: [String: Any] = ["status": "SOLD", "soldDate": formatter.string(from: date)]
        if let p = price { input["soldPrice"] = p }
        do {
            let updated = try await DeviceService.shared.updateDevice(id: deviceId, input: input)
            applyUpdate(updated)
        } catch { print("markSold: \(error)") }
        isUpdatingStatus = false
    }

    private func deleteTask(_ task: MaintenanceTask) async {
        isDeletingTask = true
        do {
            _ = try await DeviceService.shared.deleteMaintenanceTask(id: task.id)
            maintenanceTasks.removeAll { $0.id == task.id }
        } catch { print("deleteTask: \(error)") }
        isDeletingTask = false
    }

    private func deleteNote(_ note: Note) async {
        isDeletingNote = true
        do {
            _ = try await DeviceService.shared.deleteNote(id: note.id)
            notes.removeAll { $0.id == note.id }
        } catch { print("deleteNote: \(error)") }
        isDeletingNote = false
    }

    private func deleteDevice() async {
        isDeletingDevice = true
        do {
            _ = try await DeviceService.shared.deleteDevice(id: device.id)
            onDeviceDeleted?()
            dismiss()
        } catch { print("deleteDevice: \(error)"); isDeletingDevice = false }
    }

    private func setThumbnail(_ image: DeviceImage, mode: String) async {
        do {
            let existingURLs: [URL] = images
                .filter { $0.isThumbnail && $0.id != image.id }
                .compactMap { APIService.shared.imageURL(for: $0.thumbnailPath ?? $0.path) }
            _ = try await DeviceService.shared.updateImage(id: image.id, isThumbnail: true, thumbnailMode: mode)
            for url in existingURLs { await ImageCacheService.shared.removeImage(for: url) }
            await refreshDevice()
        } catch { print("setThumbnail: \(error)") }
    }

    private func setListingImage(_ image: DeviceImage) async {
        do {
            if let current = images.first(where: { $0.isListingImage && $0.id != image.id }) {
                _ = try await DeviceService.shared.updateImage(id: current.id, isThumbnail: nil, isShopImage: nil, isListingImage: false)
            }
            let updated = try await DeviceService.shared.updateImage(id: image.id, isThumbnail: nil, isShopImage: nil, isListingImage: !image.isListingImage)
            if let i = images.firstIndex(where: { $0.id == image.id }) { images[i] = updated }
            await refreshDevice()
        } catch { print("setListingImage: \(error)") }
    }

    private func toggleShopImage(_ image: DeviceImage) async {
        do {
            let updated = try await DeviceService.shared.updateImage(id: image.id, isThumbnail: nil, isShopImage: !image.isShopImage, isListingImage: nil)
            if let i = images.firstIndex(where: { $0.id == image.id }) { images[i] = updated }
            await refreshDevice()
        } catch { print("toggleShopImage: \(error)") }
    }

    private func deleteImage(_ image: DeviceImage) async {
        do {
            _ = try await DeviceService.shared.deleteImage(id: image.id)
            images.removeAll { $0.id == image.id }
            await refreshDevice()
        } catch { print("deleteImage: \(error)") }
    }

    private func removeTag(_ tag: Tag) async {
        do {
            let updated = try await DeviceService.shared.removeDeviceTag(deviceId: device.id, tagId: tag.id)
            device = updated; tags = updated.tags
            accessories = updated.accessories; links = updated.links
            onDeviceChanged?(updated)
        } catch { print("removeTag: \(error)") }
    }

    private func removeAccessory(_ accessory: DeviceAccessory) async {
        do {
            try await DeviceService.shared.removeDeviceAccessory(id: accessory.id)
            accessories.removeAll { $0.id == accessory.id }
        } catch { print("removeAccessory: \(error)") }
    }

    private func removeLink(_ link: DeviceLink) async {
        do {
            try await DeviceService.shared.removeDeviceLink(id: link.id)
            links.removeAll { $0.id == link.id }
        } catch { print("removeLink: \(error)") }
    }

    @MainActor
    private func refreshDevice() async {
        do {
            if let refreshed = try await DeviceService.shared.fetchDevice(id: deviceId) {
                applyUpdate(refreshed)
            }
        } catch { print("refreshDevice: \(error)") }
    }

    private func applyUpdate(_ updated: Device) {
        device = updated
        images = updated.images
        maintenanceTasks = updated.maintenanceTasks
        notes = updated.notes
        tags = updated.tags
        accessories = updated.accessories
        links = updated.links
        onDeviceChanged?(updated)
    }

    // MARK: - Helpers

    private func formatDate(_ dateString: String?) -> String? {
        guard let dateString else { return nil }
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        let locale = Locale(identifier: LocalizationManager.shared.currentLanguage)
        if let date = formatter.date(from: dateString) {
            let df = DateFormatter(); df.dateStyle = .medium; df.locale = locale
            return df.string(from: date)
        }
        formatter.formatOptions = [.withInternetDateTime]
        if let date = formatter.date(from: dateString) {
            let df = DateFormatter(); df.dateStyle = .medium; df.locale = locale
            return df.string(from: date)
        }
        return dateString
    }
}

// MARK: - Private Sheets

private struct MarkSoldSheetR: View {
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject var lm: LocalizationManager
    @State private var saleDate = Date()
    @State private var salePriceText = ""
    let onSubmit: (Date, Double?) -> Void

    var body: some View {
        let t = lm.t
        return NavigationStack {
            Form {
                DatePicker(t.addEditDevice.soldDate, selection: $saleDate, displayedComponents: .date)
                TextField(t.addEditDevice.soldPrice, text: $salePriceText).keyboardType(.decimalPad)
            }
            .navigationTitle(t.deviceDetail.markSold)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button(t.common.cancel) { dismiss() } }
                ToolbarItem(placement: .confirmationAction) {
                    Button(t.deviceDetail.markSold) {
                        onSubmit(saleDate, Double(salePriceText))
                        dismiss()
                    }
                }
            }
        }
    }
}

private struct MarkForSaleSheetR: View {
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject var lm: LocalizationManager
    @State private var listPriceText = ""
    let onSubmit: (Double) -> Void

    var body: some View {
        let t = lm.t
        return NavigationStack {
            Form {
                TextField(t.addEditDevice.listPrice, text: $listPriceText).keyboardType(.decimalPad)
            }
            .navigationTitle(t.deviceDetail.markForSale)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button(t.common.cancel) { dismiss() } }
                ToolbarItem(placement: .confirmationAction) {
                    Button(t.deviceDetail.markForSale) {
                        if let price = Double(listPriceText) { onSubmit(price) }
                        dismiss()
                    }
                }
            }
        }
    }
}

private struct MarkReturnedSheetR: View {
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject var lm: LocalizationManager
    @State private var returnDate = Date()
    @State private var feeText = ""
    let onSubmit: (Date, Double?) -> Void

    var body: some View {
        let t = lm.t
        return NavigationStack {
            Form {
                DatePicker(t.deviceDetail.returnedDate, selection: $returnDate, displayedComponents: .date)
                TextField(t.deviceDetail.repairFeeCharged, text: $feeText).keyboardType(.decimalPad)
            }
            .navigationTitle(t.deviceDetail.markReturned)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button(t.common.cancel) { dismiss() } }
                ToolbarItem(placement: .confirmationAction) {
                    Button(t.deviceDetail.markReturned) {
                        onSubmit(returnDate, Double(feeText))
                        dismiss()
                    }
                }
            }
        }
    }
}
