//
//  EditDeviceView.swift
//  InventoryDifferent
//
//  Created by Michael Wottle on 2/3/26.
//

import SwiftUI

struct EditDeviceView: View {
    let device: Device
    let onDeviceUpdated: (Device) -> Void
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject var lm: LocalizationManager
    private var t: Translations { lm.t }
    
    @State private var name: String
    @State private var additionalName: String
    @State private var manufacturer: String
    @State private var modelNumber: String
    @State private var serialNumber: String
    @State private var releaseYear: String
    @State private var selectedLocationId: Int?
    @State private var locations: [LocationRef] = []
    @State private var isLoadingLocations = false
    @State private var showingNewLocationAlert = false
    @State private var newLocationName = ""
    @State private var info: String
    @State private var historicalNotes: String

    @State private var status: Status
    @State private var functionalStatus: FunctionalStatus
    @State private var condition: Condition?
    @State private var rarity: Rarity?
    @State private var isFavorite: Bool
    @State private var isAssetTagged: Bool

    @State private var accessories: [DeviceAccessory]
    @State private var links: [DeviceLink]
    @State private var showAddAccessorySheet = false
    @State private var showAddLinkSheet = false
    
    @State private var dateAcquired: Date?
    @State private var whereAcquired: String
    @State private var priceAcquired: String
    @State private var estimatedValue: String
    
    @State private var listPrice: String
    @State private var soldPrice: String
    @State private var soldDate: Date?
    
    @State private var cpu: String
    @State private var ram: String
    @State private var graphics: String
    @State private var storage: String
    @State private var operatingSystem: String
    @State private var isWifiEnabled: Bool
    @State private var isPramBatteryRemoved: Bool
    @State private var lastPowerOnDate: Date?
    
    @State private var selectedCategoryId: Int
    @State private var categories: [Category] = []
    @State private var isLoadingCategories = false

    @State private var customFieldDefinitions: [CustomField] = []
    @State private var customFieldFormValues: [Int: String] = [:]

    @State private var isSubmitting = false
    @State private var error: String?
    @State private var showSerialScanner = false
    
    init(device: Device, onDeviceUpdated: @escaping (Device) -> Void) {
        self.device = device
        self.onDeviceUpdated = onDeviceUpdated
        
        _name = State(initialValue: device.name)
        _additionalName = State(initialValue: device.additionalName ?? "")
        _manufacturer = State(initialValue: device.manufacturer ?? "")
        _modelNumber = State(initialValue: device.modelNumber ?? "")
        _serialNumber = State(initialValue: device.serialNumber ?? "")
        _releaseYear = State(initialValue: device.releaseYear.map { String($0) } ?? "")
        _selectedLocationId = State(initialValue: device.location?.id)
        _info = State(initialValue: device.info ?? "")
        _historicalNotes = State(initialValue: device.historicalNotes ?? "")

        _status = State(initialValue: device.status)
        _functionalStatus = State(initialValue: device.functionalStatus)
        _condition = State(initialValue: device.condition)
        _rarity = State(initialValue: device.rarity)
        _isFavorite = State(initialValue: device.isFavorite)
        _isAssetTagged = State(initialValue: device.isAssetTagged)
        _accessories = State(initialValue: device.accessories)
        _links = State(initialValue: device.links)
        
        _dateAcquired = State(initialValue: Self.parseDate(device.dateAcquired))
        _whereAcquired = State(initialValue: device.whereAcquired ?? "")
        _priceAcquired = State(initialValue: device.priceAcquired.map { String(format: "%.2f", $0) } ?? "")
        _estimatedValue = State(initialValue: device.estimatedValue.map { String(format: "%.2f", $0) } ?? "")
        
        _listPrice = State(initialValue: device.listPrice.map { String(format: "%.2f", $0) } ?? "")
        _soldPrice = State(initialValue: device.soldPrice.map { String(format: "%.2f", $0) } ?? "")
        _soldDate = State(initialValue: Self.parseDate(device.soldDate))
        
        _cpu = State(initialValue: device.cpu ?? "")
        _ram = State(initialValue: device.ram ?? "")
        _graphics = State(initialValue: device.graphics ?? "")
        _storage = State(initialValue: device.storage ?? "")
        _operatingSystem = State(initialValue: device.operatingSystem ?? "")
        _isWifiEnabled = State(initialValue: device.isWifiEnabled ?? false)
        _isPramBatteryRemoved = State(initialValue: device.isPramBatteryRemoved ?? false)
        _lastPowerOnDate = State(initialValue: Self.parseDate(device.lastPowerOnDate))
        
        _selectedCategoryId = State(initialValue: device.category.id)

        var cfValues: [Int: String] = [:]
        for cfv in device.customFieldValues {
            cfValues[cfv.customFieldId] = cfv.value
        }
        _customFieldFormValues = State(initialValue: cfValues)
    }
    
    var body: some View {
        NavigationStack {
            Form {
                basicInfoSection
                statusSection
                flagsSection
                acquisitionSection
                if showSalesSection {
                    salesSection
                }
                if status == .RETURNED {
                    repairSection
                }
                if isComputerCategory {
                    computerSpecsSection
                }

                if !customFieldDefinitions.isEmpty {
                    customFieldsSection
                }

                accessoriesSection
                linksSection

            }
            .navigationTitle(t.addEditDevice.editTitle)
            .navigationBarTitleDisplayMode(.inline)
            .alert(t.addEditDevice.locationCreateNew, isPresented: $showingNewLocationAlert) {
                TextField(t.addEditDevice.location, text: $newLocationName)
                Button(t.common.cancel, role: .cancel) { }
                Button(t.common.save) {
                    let name = newLocationName.trimmingCharacters(in: .whitespaces)
                    guard !name.isEmpty else { return }
                    Task {
                        do {
                            let created = try await LocationService.shared.createLocation(name: name)
                            locations = try await LocationService.shared.fetchLocations()
                            selectedLocationId = created.id
                        } catch {
                            print("Failed to create location: \(error)")
                        }
                    }
                }
            }
            .alert(t.addEditDevice.saveFailed, isPresented: Binding(get: { error != nil }, set: { if !$0 { error = nil } })) {
                Button(t.common.ok) { error = nil }
            } message: {
                if let error { Text(error) }
            }
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button(t.common.cancel) {
                        dismiss()
                    }
                }

                ToolbarItem(placement: .confirmationAction) {
                    Button(t.common.save) {
                        Task {
                            await submitChanges()
                        }
                    }
                    .disabled(name.trimmingCharacters(in: .whitespaces).isEmpty || isSubmitting)
                }
            }
            .disabled(isSubmitting)
            .task {
                await loadCategories()
                await loadCustomFields()
                await loadLocations()
            }
            .sheet(isPresented: $showSerialScanner) {
                SerialBarcodeCaptureSheet { scanned in
                    serialNumber = scanned
                }
            }
            .sheet(isPresented: $showAddAccessorySheet) {
                AddAccessorySheet(deviceId: device.id) { newAccessory in
                    accessories.append(newAccessory)
                }
            }
            .sheet(isPresented: $showAddLinkSheet) {
                AddLinkSheet(deviceId: device.id) { newLink in
                    links.append(newLink)
                }
            }
        }
    }
    
    private var basicInfoSection: some View {
        let t = lm.t
        return Section {
            LabeledField(label: t.addEditDevice.name, text: $name)
            LabeledField(label: t.addEditDevice.additionalName, text: $additionalName)
            LabeledField(label: t.addEditDevice.manufacturer, text: $manufacturer)
            LabeledField(label: t.addEditDevice.modelNumber, text: $modelNumber)
            HStack(alignment: .bottom, spacing: 8) {
                LabeledField(label: t.addEditDevice.serialNumber, text: $serialNumber)
                Button { showSerialScanner = true } label: {
                    Image(systemName: "barcode.viewfinder")
                        .font(.system(size: 22))
                        .foregroundColor(.accentColor)
                }
                .buttonStyle(.plain)
            }
            LabeledField(label: t.addEditDevice.releaseYear, text: $releaseYear, keyboardType: .numberPad)

            Picker(t.addEditDevice.location, selection: $selectedLocationId) {
                Text(t.addEditDevice.locationNone).tag(Optional<Int>.none)
                ForEach(locations) { loc in
                    Text(loc.name).tag(Optional<Int>.some(loc.id))
                }
            }
            .disabled(isLoadingLocations)

            Button(t.addEditDevice.locationCreateNew) {
                newLocationName = ""
                showingNewLocationAlert = true
            }
            .font(.footnote)

            Picker(t.addEditDevice.category, selection: $selectedCategoryId) {
                ForEach(categories) { category in
                    Text(category.name).tag(category.id)
                }
            }
            .disabled(isLoadingCategories)

            LabeledTextEditor(label: t.addEditDevice.info, text: $info)
            LabeledTextEditor(label: t.addEditDevice.historicalNotes, text: $historicalNotes)

            DatePicker(t.addEditDevice.lastPowerOn, selection: Binding(
                get: { lastPowerOnDate ?? Date() },
                set: { lastPowerOnDate = $0 }
            ), displayedComponents: .date)

            Button(lastPowerOnDate == nil ? t.addEditDevice.setLastPowerOn : t.addEditDevice.clearLastPowerOn) {
                lastPowerOnDate = lastPowerOnDate == nil ? Date() : nil
            }
            .foregroundColor(.accentColor)
        } header: {
            Text(t.addEditDevice.basicInformation)
        }
    }
    
    private var statusSection: some View {
        let t = lm.t
        return Section {
            Picker(t.addEditDevice.status, selection: $status) {
                ForEach(Status.allCases, id: \.self) { status in
                    Text(status.displayName).tag(status)
                }
            }
            .onChange(of: status) { oldValue, newValue in
                if newValue == .SOLD || newValue == .DONATED || newValue == .RETURNED {
                    soldDate = Date()
                }
            }

            Picker(t.addEditDevice.functionalStatus, selection: $functionalStatus) {
                ForEach(FunctionalStatus.allCases, id: \.self) { status in
                    Text(status.displayName).tag(status)
                }
            }

            Picker(t.addEditDevice.condition, selection: $condition) {
                Text(t.addEditDevice.notSet).tag(Optional<Condition>.none)
                ForEach(Condition.allCases, id: \.self) { c in
                    Text(c.displayName).tag(Optional<Condition>.some(c))
                }
            }

            Picker(t.addEditDevice.rarity, selection: $rarity) {
                Text(t.addEditDevice.notSet).tag(Optional<Rarity>.none)
                ForEach(Rarity.allCases, id: \.self) { r in
                    Text(r.displayName).tag(Optional<Rarity>.some(r))
                }
            }
        } header: {
            Text(t.addEditDevice.status)
        }
    }
    
    private var flagsSection: some View {
        let t = lm.t
        return Section {
            Toggle(t.addEditDevice.favorite, isOn: $isFavorite)
            Toggle(t.addEditDevice.assetTagged, isOn: $isAssetTagged)
        } header: {
            Text(t.addEditDevice.flags)
        }
    }

    private var accessoriesSection: some View {
        let t = lm.t
        return Section {
            if accessories.isEmpty {
                Text(t.addEditDevice.noAccessoriesRecorded)
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            } else {
                ForEach(accessories) { accessory in
                    HStack {
                        Text(accessory.name)
                        Spacer()
                        Button {
                            Task { await removeAccessory(accessory) }
                        } label: {
                            Image(systemName: "trash")
                                .foregroundColor(.red)
                        }
                    }
                }
            }
            Button(t.addEditDevice.addAccessory) {
                showAddAccessorySheet = true
            }
            .foregroundColor(.accentColor)
        } header: {
            Text(t.addEditDevice.accessories)
        }
    }

    private var linksSection: some View {
        let t = lm.t
        return Section {
            if links.isEmpty {
                Text(t.addEditDevice.noLinksRecorded)
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            } else {
                ForEach(links) { link in
                    HStack {
                        VStack(alignment: .leading, spacing: 2) {
                            Text(link.label)
                                .font(.subheadline)
                            Text(link.url)
                                .font(.caption)
                                .foregroundColor(.secondary)
                                .lineLimit(1)
                        }
                        Spacer()
                        Button {
                            Task { await removeLink(link) }
                        } label: {
                            Image(systemName: "trash")
                                .foregroundColor(.red)
                        }
                    }
                }
            }
            Button(t.addEditDevice.addLink) {
                showAddLinkSheet = true
            }
            .foregroundColor(.accentColor)
        } header: {
            Text(t.addEditDevice.referenceLinks)
        }
    }
    
    private var acquisitionSection: some View {
        let t = lm.t
        return Section {
            DatePicker(t.addEditDevice.dateAcquired, selection: Binding(
                get: { dateAcquired ?? Date() },
                set: { dateAcquired = $0 }
            ), displayedComponents: .date)

            Button(dateAcquired == nil ? t.addEditDevice.setDateAcquired : t.addEditDevice.clearDateAcquired) {
                dateAcquired = dateAcquired == nil ? Date() : nil
            }
            .foregroundColor(.accentColor)

            LabeledField(label: t.addEditDevice.whereAcquired, text: $whereAcquired)
            LabeledField(label: t.addEditDevice.priceAcquired, text: $priceAcquired, prompt: "0.00", keyboardType: .decimalPad)
            LabeledField(label: t.addEditDevice.estimatedValue, text: $estimatedValue, prompt: "0.00", keyboardType: .decimalPad)
        } header: {
            Text(t.addEditDevice.acquisitionValue)
        }
    }
    
    private var salesSection: some View {
        let t = lm.t
        return Section {
            if status != .DONATED {
                LabeledField(label: t.addEditDevice.listPrice, text: $listPrice, prompt: "0.00", keyboardType: .decimalPad)
            }

            if status == .SOLD {
                LabeledField(label: t.addEditDevice.soldPrice, text: $soldPrice, prompt: "0.00", keyboardType: .decimalPad)

                DatePicker(t.addEditDevice.soldDate, selection: Binding(
                    get: { soldDate ?? Date() },
                    set: { soldDate = $0 }
                ), displayedComponents: .date)

                Button(soldDate == nil ? t.addEditDevice.setSoldDate : t.addEditDevice.clearSoldDate) {
                    soldDate = soldDate == nil ? Date() : nil
                }
                .foregroundColor(.accentColor)
            }
            else if status == .DONATED {
                DatePicker(t.addEditDevice.donatedDate, selection: Binding(
                    get: { soldDate ?? Date() },
                    set: { soldDate = $0 }
                ), displayedComponents: .date)

                Button(soldDate == nil ? t.addEditDevice.setDonatedDate : t.addEditDevice.clearDonatedDate) {
                    soldDate = soldDate == nil ? Date() : nil
                }
                .foregroundColor(.accentColor)
            }
        } header: {
            Text(status == .DONATED ? t.addEditDevice.donationInformation : t.addEditDevice.sales)
        }
    }
    
    private var computerSpecsSection: some View {
        let t = lm.t
        return Section {
            LabeledField(label: t.addEditDevice.cpu, text: $cpu)
            LabeledField(label: t.addEditDevice.ram, text: $ram)
            LabeledField(label: t.addEditDevice.graphics, text: $graphics)
            LabeledField(label: t.addEditDevice.storage, text: $storage)
            LabeledField(label: t.addEditDevice.os, text: $operatingSystem)
            Toggle(t.addEditDevice.wifiEnabled, isOn: $isWifiEnabled)
            Toggle(t.addEditDevice.pramRemoved, isOn: $isPramBatteryRemoved)
        } header: {
            Text(t.addEditDevice.computerSpecs)
        }
    }
    
    private var customFieldsSection: some View {
        let t = lm.t
        return Section {
            ForEach(customFieldDefinitions) { field in
                LabeledField(label: field.name, text: Binding(
                    get: { customFieldFormValues[field.id] ?? "" },
                    set: { customFieldFormValues[field.id] = $0 }
                ))
            }
        } header: {
            Text(t.addEditDevice.customFields)
        }
    }

    private var repairSection: some View {
        let t = lm.t
        return Section(t.addEditDevice.repairInformation) {
            LabeledField(label: t.addEditDevice.repairFeeCharged, text: $soldPrice, prompt: "0.00", keyboardType: .decimalPad)

            DatePicker(t.addEditDevice.returnedDate, selection: Binding(
                get: { soldDate ?? Date() },
                set: { soldDate = $0 }
            ), displayedComponents: .date)

            Button(soldDate == nil ? t.addEditDevice.setReturnedDate : t.addEditDevice.clearReturnedDate) {
                soldDate = soldDate == nil ? Date() : nil
            }
            .foregroundColor(.accentColor)
        }
    }

    private var showSalesSection: Bool {
        status == .FOR_SALE || status == .PENDING_SALE || status == .SOLD || status == .DONATED
    }
    
    private var isComputerCategory: Bool {
        categories.first(where: { $0.id == selectedCategoryId })?.type == "COMPUTER"
    }
    
    private func removeAccessory(_ accessory: DeviceAccessory) async {
        do {
            try await DeviceService.shared.removeDeviceAccessory(id: accessory.id)
            accessories.removeAll { $0.id == accessory.id }
        } catch {
            print("Failed to remove accessory: \(error)")
        }
    }

    private func removeLink(_ link: DeviceLink) async {
        do {
            try await DeviceService.shared.removeDeviceLink(id: link.id)
            links.removeAll { $0.id == link.id }
        } catch {
            print("Failed to remove link: \(error)")
        }
    }

    private func loadCategories() async {
        isLoadingCategories = true
        do {
            categories = try await DeviceService.shared.fetchCategories()
        } catch {
            print("Failed to load categories: \(error)")
        }
        isLoadingCategories = false
    }

    private func loadLocations() async {
        isLoadingLocations = true
        do {
            locations = try await LocationService.shared.fetchLocations()
        } catch {
            print("Failed to load locations: \(error)")
        }
        isLoadingLocations = false
    }
    
    private func loadCustomFields() async {
        do {
            customFieldDefinitions = try await DeviceService.shared.fetchCustomFields()
        } catch {
            print("Failed to load custom fields: \(error)")
        }
    }

    private func submitChanges() async {
        guard !name.trimmingCharacters(in: .whitespaces).isEmpty else { return }
        
        isSubmitting = true
        error = nil
        
        do {
            var input: [String: Any] = [:]
            
            input["name"] = name.trimmingCharacters(in: .whitespaces)
            if !additionalName.isEmpty { input["additionalName"] = additionalName }
            if !manufacturer.isEmpty { input["manufacturer"] = manufacturer }
            if !modelNumber.isEmpty { input["modelNumber"] = modelNumber }
            if !serialNumber.isEmpty { input["serialNumber"] = serialNumber }
            if let year = Int(releaseYear) { input["releaseYear"] = year }
            input["locationId"] = selectedLocationId ?? NSNull()
            if !info.isEmpty { input["info"] = info }
            if !historicalNotes.isEmpty { input["historicalNotes"] = historicalNotes }

            input["status"] = status.rawValue
            input["functionalStatus"] = functionalStatus.rawValue
            input["condition"] = (condition?.rawValue as Any?) ?? NSNull()
            input["rarity"] = (rarity?.rawValue as Any?) ?? NSNull()
            input["isFavorite"] = isFavorite
            input["isAssetTagged"] = isAssetTagged
            
            if let date = dateAcquired {
                input["dateAcquired"] = Self.formatDate(date)
            }
            if !whereAcquired.isEmpty { input["whereAcquired"] = whereAcquired }
            if let price = Double(priceAcquired) { input["priceAcquired"] = price }
            if let value = Double(estimatedValue) { input["estimatedValue"] = value }
            
            if let price = Double(listPrice) { input["listPrice"] = price }
            if let price = Double(soldPrice) { input["soldPrice"] = price }
            if let date = soldDate {
                input["soldDate"] = Self.formatDate(date)
            }
            
            if selectedCategoryId != device.category.id {
                input["categoryId"] = selectedCategoryId
            }
            
            if isComputerCategory {
                if !cpu.isEmpty { input["cpu"] = cpu }
                if !ram.isEmpty { input["ram"] = ram }
                if !graphics.isEmpty { input["graphics"] = graphics }
                if !storage.isEmpty { input["storage"] = storage }
                if !operatingSystem.isEmpty { input["operatingSystem"] = operatingSystem }
                input["isWifiEnabled"] = isWifiEnabled
                input["isPramBatteryRemoved"] = isPramBatteryRemoved
                if let date = lastPowerOnDate {
                    input["lastPowerOnDate"] = Self.formatDate(date)
                }
            }
            
            var updatedDevice = try await DeviceService.shared.updateDevice(id: device.id, input: input)

            // Save custom field values
            let originalValues: [Int: String] = Dictionary(
                uniqueKeysWithValues: device.customFieldValues.map { ($0.customFieldId, $0.value) }
            )

            for field in customFieldDefinitions {
                let newValue = (customFieldFormValues[field.id] ?? "").trimmingCharacters(in: .whitespaces)
                let oldValue = (originalValues[field.id] ?? "").trimmingCharacters(in: .whitespaces)

                if !newValue.isEmpty && newValue != oldValue {
                    _ = try await DeviceService.shared.setCustomFieldValue(
                        deviceId: device.id, customFieldId: field.id, value: newValue
                    )
                } else if newValue.isEmpty && !oldValue.isEmpty {
                    _ = try await DeviceService.shared.removeCustomFieldValue(
                        deviceId: device.id, customFieldId: field.id
                    )
                }
            }

            // Re-fetch device to get updated custom field values
            if let refreshedDevice = try await DeviceService.shared.fetchDevice(id: device.id) {
                updatedDevice = refreshedDevice
            }

            onDeviceUpdated(updatedDevice)
            dismiss()
        } catch {
            self.error = error.localizedDescription
            isSubmitting = false
        }
    }
    
    private static func parseDate(_ dateString: String?) -> Date? {
        guard let dateString = dateString else { return nil }
        
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        
        if let date = formatter.date(from: dateString) {
            return date
        }
        
        formatter.formatOptions = [.withInternetDateTime]
        return formatter.date(from: dateString)
    }
    
    private static func formatDate(_ date: Date) -> String {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return formatter.string(from: date)
    }
}

// MARK: - Serial Number Barcode Capture Sheet

struct SerialBarcodeCaptureSheet: View {
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject var lm: LocalizationManager
    let onCapture: (String) -> Void

    var body: some View {
        NavigationStack {
            ZStack {
                BarcodeScannerPreview { code in
                    onCapture(code)
                    dismiss()
                }
                .ignoresSafeArea()

                VStack {
                    Spacer()
                    Text(lm.t.barcodeScanner.pointCamera)
                        .foregroundColor(.white)
                        .padding(.horizontal, 20)
                        .padding(.vertical, 12)
                        .background(Color.black.opacity(0.7))
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                        .padding(.bottom, 40)
                }
            }
            .navigationTitle(lm.t.barcodeScanner.title)
            .navigationBarTitleDisplayMode(.inline)
            .toolbarBackground(.visible, for: .navigationBar)
            .toolbarBackground(Color.black.opacity(0.8), for: .navigationBar)
            .toolbarColorScheme(.dark, for: .navigationBar)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button(lm.t.barcodeScanner.cancel) { dismiss() }
                        .foregroundColor(.white)
                }
            }
        }
    }
}

#Preview {
    EditDeviceView(device: Device(
        id: 1,
        name: "Macintosh SE",
        additionalName: "FDHD",
        manufacturer: "Apple",
        modelNumber: "M5011",
        serialNumber: "ABC123",
        releaseYear: 1987,
        location: LocationRef(id: 1, name: "Shelf A"),
        info: "Great condition",
        historicalNotes: nil,
        searchText: nil,
        isFavorite: true,
        status: .COLLECTION,
        functionalStatus: .YES,
        condition: nil,
        rarity: nil,
        lastPowerOnDate: nil,
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
        category: Category(id: 1, name: "Compact Macs", type: "COMPUTER", sortOrder: 1),
        images: [],
        notes: [],
        maintenanceTasks: [],
        tags: [],
        customFieldValues: [],
        accessories: [],
        links: []
    )) { device in
        print("Device updated: \(device)")
    }
}
