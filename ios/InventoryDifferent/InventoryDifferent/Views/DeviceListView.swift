//
//  DeviceListView.swift
//  InventoryDifferent
//
//  Created by Michael Wottle on 2/2/26.
//

import SwiftUI

private enum ViewMode: String {
    case list, grid
}

struct DeviceListView: View {
    @Binding var navigationPath: NavigationPath
    @EnvironmentObject var deviceStore: DeviceStore
    @EnvironmentObject var appSettings: AppSettings
    @EnvironmentObject var authService: AuthService
    @State private var showingFilters = false
    @State private var showingSortOptions = false
    @State private var showingAddDevice = false
    @State private var showingMenu = false
    @State private var showingScanner = false
    @AppStorage("deviceViewMode") private var viewMode: ViewMode = .list

    private let gridColumns = [GridItem(.adaptive(minimum: 160, maximum: 220))]
    
    var body: some View {
        Group {
            if deviceStore.isLoading && deviceStore.devices.isEmpty {
                ProgressView("Loading devices...")
            } else if let error = deviceStore.error {
                VStack(spacing: 16) {
                    Image(systemName: "exclamationmark.triangle")
                        .font(.largeTitle)
                        .foregroundColor(.orange)
                    Text("Error loading devices")
                        .font(.headline)
                    Text(error)
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .multilineTextAlignment(.center)
                    Button("Retry") {
                        Task {
                            await deviceStore.loadDevices()
                        }
                    }
                    .buttonStyle(.borderedProminent)
                }
                .padding()
            } else {
                deviceList
            }
        }
        .navigationTitle("Devices")
        .overlay(alignment: .bottom) {
            if !(deviceStore.isLoading && deviceStore.devices.isEmpty) {
            HStack(spacing: 4) {
                if #available(iOS 26.0, *) {
                    HStack(spacing: 8) {
                        Image(systemName: "magnifyingglass")
                            .foregroundColor(.secondary)
                        
                        TextField("Search devices...", text: $deviceStore.searchText)
                            .textInputAutocapitalization(.never)
                            .autocorrectionDisabled()
                            .submitLabel(.search)
                        
                        if !deviceStore.searchText.isEmpty {
                            Button {
                                deviceStore.searchText = ""
                            } label: {
                                Image(systemName: "xmark.circle.fill")
                                    .foregroundColor(.secondary)
                            }
                        }
                    }
                    .padding(.horizontal, 12)
                    .padding(.vertical, 10)
                    .glassEffect(.regular.interactive(),  in: RoundedRectangle(cornerRadius: 25, style: .continuous))
                } else {
                    // Fallback on earlier versions
                    HStack(spacing: 8) {
                        Image(systemName: "magnifyingglass")
                            .foregroundColor(.secondary)
                        
                        TextField("Search devices...", text: $deviceStore.searchText)
                            .textInputAutocapitalization(.never)
                            .autocorrectionDisabled()
                            .submitLabel(.search)
                        
                        if !deviceStore.searchText.isEmpty {
                            Button {
                                deviceStore.searchText = ""
                            } label: {
                                Image(systemName: "xmark.circle.fill")
                                    .foregroundColor(.secondary)
                            }
                        }
                    }
                    .padding(.horizontal, 12)
                    .padding(.vertical, 10)
                    .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 25, style: .continuous))
                }

                Button {
                    showingScanner = true
                } label: {
                    if #available(iOS 26.0, *) {
                        Image(systemName: "barcode.viewfinder")
                            .font(.system(size: 20, weight: .semibold))
                            .foregroundColor(.primary)
                            .frame(width: 44, height: 44)
                            .glassEffect(.regular.interactive(), in: Circle())
                    } else {
                        Image(systemName: "barcode.viewfinder")
                            .font(.system(size: 20, weight: .semibold))
                            .foregroundColor(.primary)
                            .frame(width: 44, height: 44)
                            .background(.ultraThinMaterial, in: Circle())
                    }
                }
                .accessibilityLabel("Scan barcode or QR code")
            }
            .padding(.horizontal, 12)
            .padding(.bottom, 10)
            .offset(y: 16)
            .ignoresSafeArea(edges: .bottom)
            }
        }
        .toolbar {
            ToolbarItemGroup(placement: .topBarLeading) {
                Button {
                    showingFilters = true
                } label: {
                    Image(systemName: hasActiveFilters ? "line.3.horizontal.decrease.circle.fill" : "line.3.horizontal.decrease.circle")
                }
                
                Button {
                    showingSortOptions = true
                } label: {
                    Image(systemName: "arrow.up.arrow.down.circle")
                }
            }
            
            ToolbarItemGroup(placement: .topBarTrailing) {
                Button {
                    viewMode = viewMode == .list ? .grid : .list
                } label: {
                    Image(systemName: viewMode == .list ? "square.grid.2x2" : "list.bullet")
                }

                // Only show Add button if authenticated
                if authService.isAuthenticated {
                    Button {
                        showingAddDevice = true
                    } label: {
                        Image(systemName: "plus.circle")
                    }
                }

                Button {
                    showingMenu = true
                } label: {
                    Image(systemName: "line.3.horizontal")
                }
                .popover(isPresented: $showingMenu, arrowEdge: .top) {
                    MenuView(navigationPath: $navigationPath, showingMenu: $showingMenu)
                        .environmentObject(authService)
                        .presentationCompactAdaptation(.popover)
                }
            }
        }
        .sheet(isPresented: $showingFilters) {
            FilterView()
                .environmentObject(deviceStore)
        }
        .sheet(isPresented: $showingSortOptions) {
            SortOptionsView()
                .environmentObject(deviceStore)
        }
        .sheet(isPresented: $showingAddDevice) {
            AddDeviceView()
                .environmentObject(deviceStore)
        }
        .fullScreenCover(isPresented: $showingScanner) {
            BarcodeScannerView()
                .environmentObject(deviceStore)
        }
        .refreshable {
            await deviceStore.loadDevices()
        }
    }
    
    private var deviceList: some View {
        Group {
            if deviceStore.filteredDevices.isEmpty {
                List {
                    ContentUnavailableView {
                        Label("No Devices", systemImage: "desktopcomputer")
                    } description: {
                        if hasActiveFilters {
                            Text("No devices match your filters")
                        } else {
                            Text("No devices found")
                        }
                    } actions: {
                        if hasActiveFilters {
                            Button("Clear Filters") {
                                deviceStore.clearFilters()
                            }
                        }
                    }
                }
                .listStyle(.plain)
            } else if viewMode == .list {
                List {
                    Section {
                        ForEach(deviceStore.filteredDevices) { device in
                            NavigationLink(value: device.id) {
                                DeviceRowView(device: device)
                            }
                            .alignmentGuide(.listRowSeparatorLeading) { _ in 0 }
                            .listRowInsets(EdgeInsets(top: 0, leading: 0, bottom: 0, trailing: 16))
                        }
                    } header: {
                        Text("\(deviceStore.filteredDevices.count) devices")
                    }
                }
                .listStyle(.plain)
            } else {
                ScrollView {
                    LazyVGrid(columns: gridColumns, spacing: 8) {
                        ForEach(deviceStore.filteredDevices) { device in
                            NavigationLink(value: device.id) {
                                DeviceGridItemView(device: device)
                            }
                            .buttonStyle(.plain)
                        }
                    }
                    .padding(.horizontal, 8)
                    .padding(.top, 8)
                    .padding(.bottom, 80) // room for the floating search bar
                    .safeAreaInset(edge: .top) {
                        Text("\(deviceStore.filteredDevices.count) devices")
                            .font(.footnote)
                            .foregroundColor(.secondary)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .padding(.horizontal, 12)
                            .padding(.vertical, 4)
                    }
                }
            }
        }
    }
    
    private var hasActiveFilters: Bool {
        deviceStore.selectedCategoryId != nil ||
        !deviceStore.selectedStatuses.isEmpty ||
        deviceStore.showFavoritesOnly
    }
}

struct DeviceRowView: View {
    let device: DeviceListItem
    @Environment(\.colorScheme) private var colorScheme

    var body: some View {
        HStack(spacing: 12) {
            // Thumbnail
            CachedThumbnailImage(url: thumbnailURL)
                .frame(width: 80, height: 80)
                .background(Color(.systemGray5))
                .clipShape(RoundedRectangle(cornerRadius: 8))
            
            VStack(alignment: .leading, spacing: 3) {
                // Name
                Text(device.name)
                    .font(.headline)
                    .lineLimit(1)
                
                // Additional name
                if let additionalName = device.additionalName, !additionalName.isEmpty {
                    Text(additionalName)
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                        .lineLimit(1)
                }
                
                // Category, release year, and status badge
                HStack(spacing: 6) {
                    Text(device.category.name)
                        .font(.caption)
                        .foregroundColor(.secondary)
                    
                    if let year = device.releaseYear {
                        Text("•")
                            .font(.caption)
                            .foregroundColor(.secondary)
                        Text(String(year))
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                    
                    StatusBadge(status: device.status)
                }
                
                // Status indicator icons row
                StatusIndicatorsRow(device: device)
                
                // Value/Sale info
                ValueSaleInfo(device: device)
            }
            
            Spacer()
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 4)
    }
    
    private var thumbnailURL: URL? {
        guard let thumbnail = device.thumbnailImage(for: colorScheme) else { return nil }
        let path = thumbnail.thumbnailPath ?? thumbnail.path
        return APIService.shared.imageURL(for: path)
    }
}

struct StatusIndicatorsRow: View {
    let device: any DeviceRowPresentable
    
    var body: some View {
        HStack(spacing: 6) {
            // Functional Status
            FunctionalStatusIcon(status: device.functionalStatus)
            
            // Rarity - custom faceted gem shape
            if let rarity = device.rarity {
                let rarityColor: Color = {
                    switch rarity {
                    case .COMMON: return .gray.opacity(0.4)
                    case .UNCOMMON: return .yellow
                    case .RARE: return Color(red: 0.4, green: 0.85, blue: 0.4)
                    case .VERY_RARE: return .green
                    case .EXTREMELY_RARE: return Color(red: 0.2, green: 1.0, blue: 0.6)
                    }
                }()
                GemShape()
                    .fill(style: FillStyle(eoFill: true))
                    .foregroundColor(rarityColor)
                    .frame(width: 12, height: 12)
                    .help("Rarity: \(rarity.displayName)")
            }

            // Asset Tagged
            Image(systemName: "tag.fill")
                .font(.system(size: 12))
                .foregroundColor(device.isAssetTagged ? .green : .gray.opacity(0.4))
            
            // Original Box
            Image(systemName: "shippingbox.fill")
                .font(.system(size: 12))
                .foregroundColor(device.accessories.contains(where: { $0.name == "Original Box" }) ? .green : .gray.opacity(0.4))
            
            // PRAM Battery (only for computers)
            if device.category.type == "COMPUTER" {
                Image(systemName: "battery.100")
                    .font(.system(size: 12))
                    .foregroundColor(device.isPramBatteryRemoved == true ? .green : .red)
            }
            
            // Favorite
            Image(systemName: "star.fill")
                .font(.system(size: 12))
                .foregroundColor(device.isFavorite ? .yellow : .gray.opacity(0.4))
        }
    }
}

struct FunctionalStatusIcon: View {
    let status: FunctionalStatus
    
    var body: some View {
        switch status {
        case .YES:
            Image(systemName: "hand.thumbsup.fill")
                .font(.system(size: 12))
                .foregroundColor(.green)
        case .PARTIAL:
            Image(systemName: "exclamationmark.triangle.fill")
                .font(.system(size: 12))
                .foregroundColor(.yellow)
        case .NO:
            Image(systemName: "hand.thumbsdown.fill")
                .font(.system(size: 12))
                .foregroundColor(.red)
        }
    }
}

// Gem shape matching the web SVG icon (flat-top, faceted cut gem)
struct GemShape: Shape {
    func path(in rect: CGRect) -> Path {
        let sx = rect.width / 24
        let sy = rect.height / 24
        func pt(_ x: CGFloat, _ y: CGFloat) -> CGPoint {
            CGPoint(x: rect.minX + x * sx, y: rect.minY + y * sy)
        }
        var path = Path()
        // Outer silhouette: flat top, wide girdle at y=8, pointed bottom
        path.move(to: pt(6, 2))
        path.addLine(to: pt(2, 8))
        path.addLine(to: pt(12, 22))
        path.addLine(to: pt(22, 8))
        path.addLine(to: pt(18, 2))
        path.closeSubpath()
        // Top-left facet
        path.move(to: pt(5.65, 4))
        path.addLine(to: pt(8.54, 4))
        path.addLine(to: pt(7, 7.3))
        path.closeSubpath()
        // Top-center facet
        path.move(to: pt(9.46, 4))
        path.addLine(to: pt(14.54, 4))
        path.addLine(to: pt(12, 7.69))
        path.closeSubpath()
        // Top-right facet
        path.move(to: pt(13, 4))
        path.addLine(to: pt(15.89, 4))
        path.addLine(to: pt(17, 7.3))
        path.addLine(to: pt(13.54, 4))
        path.closeSubpath()
        // Bottom-left facet
        path.move(to: pt(4.5, 8))
        path.addLine(to: pt(7.59, 8))
        path.addLine(to: pt(10.09, 16.5))
        path.closeSubpath()
        // Bottom-center facet
        path.move(to: pt(10.12, 8))
        path.addLine(to: pt(13.88, 8))
        path.addLine(to: pt(12, 16.5))
        path.closeSubpath()
        // Bottom-right facet
        path.move(to: pt(16.41, 8))
        path.addLine(to: pt(19.5, 8))
        path.addLine(to: pt(13.91, 16.5))
        path.closeSubpath()
        return path
    }
}

struct ValueSaleInfo: View {
    let device: any DeviceRowPresentable
    
    var body: some View {
        Group {
            switch device.status {
            case .COLLECTION:
                if let value = device.estimatedValue {
                    Text("Est. Value: \(formatPrice(value))")
                        .font(.caption)
                        .foregroundColor(.green)
                }
            case .FOR_SALE:
                Text("For Sale: \(device.listPrice.map { formatPrice($0) } ?? "TBD")")
                    .font(.caption)
                    .foregroundColor(.orange)
            case .PENDING_SALE:
                Text("Pending: \(device.listPrice.map { formatPrice($0) } ?? "TBD")")
                    .font(.caption)
                    .foregroundColor(.yellow)
            case .SOLD:
                Text("Sold: \(device.soldPrice.map { formatPrice($0) } ?? "N/A")")
                    .font(.caption)
                    .foregroundColor(.red)
            case .DONATED:
                Text("Donated")
                    .font(.caption)
                    .foregroundColor(.purple)
            case .IN_REPAIR:
                Text("In Repair")
                    .font(.caption)
                    .foregroundColor(.teal)
            case .RETURNED:
                if let fee = device.soldPrice, fee > 0 {
                    Text("Returned: \(formatPrice(fee))")
                        .font(.caption)
                        .foregroundColor(.red)
                } else {
                    Text("Returned")
                        .font(.caption)
                        .foregroundColor(.red)
                }
            }
        }
    }

    private func formatPrice(_ price: Double) -> String {
        return "$\(Int(price).formatted())"
    }
}

struct StatusBadge: View {
    let status: Status
    
    var body: some View {
        Text(status.displayName)
            .font(.caption2)
            .fontWeight(.medium)
            .padding(.horizontal, 6)
            .padding(.vertical, 2)
            .background(backgroundColor)
            .foregroundColor(textColor)
            .clipShape(Capsule())
    }
    
    private var textColor: Color {
        // Yellow background needs dark text for readability
        status == .PENDING_SALE ? .black : .white
    }
    
    private var backgroundColor: Color {
        switch status {
        case .COLLECTION:
            return Color(red: 0.13, green: 0.55, blue: 0.13) // Darker green for readability
        case .FOR_SALE:
            return .orange
        case .PENDING_SALE:
            return .yellow
        case .SOLD:
            return .red
        case .DONATED:
            return .purple
        case .IN_REPAIR:
            return .teal
        case .RETURNED:
            return .red
        }
    }
}

#Preview {
    NavigationStack {
        DeviceListView(navigationPath: .constant(NavigationPath()))
    }
    .environmentObject(DeviceStore())
    .environmentObject(AppSettings.shared)
    .environmentObject(AuthService.shared)
}
