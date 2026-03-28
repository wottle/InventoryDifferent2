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
    
    @State private var name: String
    @State private var additionalName: String
    @State private var manufacturer: String
    @State private var modelNumber: String
    @State private var serialNumber: String
    @State private var releaseYear: String
    @State private var location: String
    @State private var info: String
    @State private var externalUrl: String
    
    @State private var status: Status
    @State private var functionalStatus: FunctionalStatus
    @State private var isFavorite: Bool
    @State private var hasOriginalBox: Bool
    @State private var isAssetTagged: Bool
    
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
    
    init(device: Device, onDeviceUpdated: @escaping (Device) -> Void) {
        self.device = device
        self.onDeviceUpdated = onDeviceUpdated
        
        _name = State(initialValue: device.name)
        _additionalName = State(initialValue: device.additionalName ?? "")
        _manufacturer = State(initialValue: device.manufacturer ?? "")
        _modelNumber = State(initialValue: device.modelNumber ?? "")
        _serialNumber = State(initialValue: device.serialNumber ?? "")
        _releaseYear = State(initialValue: device.releaseYear.map { String($0) } ?? "")
        _location = State(initialValue: device.location ?? "")
        _info = State(initialValue: device.info ?? "")
        _externalUrl = State(initialValue: device.externalUrl ?? "")
        
        _status = State(initialValue: device.status)
        _functionalStatus = State(initialValue: device.functionalStatus)
        _isFavorite = State(initialValue: device.isFavorite)
        _hasOriginalBox = State(initialValue: device.hasOriginalBox)
        _isAssetTagged = State(initialValue: device.isAssetTagged)
        
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

                if let error = error {
                    Section {
                        Text(error)
                            .foregroundColor(.red)
                            .font(.caption)
                    }
                }
            }
            .navigationTitle("Edit Device")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
                
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
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
            }
        }
    }
    
    private var basicInfoSection: some View {
        Section {
            TextField("Name", text: $name)
            TextField("Additional Name", text: $additionalName)
            TextField("Manufacturer", text: $manufacturer)
            TextField("Model Number", text: $modelNumber)
            TextField("Serial Number", text: $serialNumber)
            TextField("Release Year", text: $releaseYear)
                .keyboardType(.numberPad)
            TextField("Location", text: $location)
            TextField("External URL", text: $externalUrl)
                .keyboardType(.URL)
                .textInputAutocapitalization(.never)
            
            Picker("Category", selection: $selectedCategoryId) {
                ForEach(categories) { category in
                    Text(category.name).tag(category.id)
                }
            }
            .disabled(isLoadingCategories)
            
            ZStack(alignment: .topLeading) {
                if info.isEmpty {
                    Text("Additional information...")
                        .foregroundColor(Color(.placeholderText))
                        .padding(.top, 8)
                        .padding(.leading, 4)
                }
                TextEditor(text: $info)
                    .frame(minHeight: 100)
            }
        } header: {
            Text("Basic Information")
        }
    }
    
    private var statusSection: some View {
        Section {
            Picker("Status", selection: $status) {
                ForEach(Status.allCases, id: \.self) { status in
                    Text(status.displayName).tag(status)
                }
            }
            .onChange(of: status) { oldValue, newValue in
                if newValue == .SOLD || newValue == .DONATED || newValue == .RETURNED {
                    soldDate = Date()
                }
            }
            
            Picker("Functional Status", selection: $functionalStatus) {
                ForEach(FunctionalStatus.allCases, id: \.self) { status in
                    Text(status.displayName).tag(status)
                }
            }
        } header: {
            Text("Status")
        }
    }
    
    private var flagsSection: some View {
        Section {
            Toggle("Favorite", isOn: $isFavorite)
            Toggle("Has Original Box", isOn: $hasOriginalBox)
            Toggle("Asset Tagged", isOn: $isAssetTagged)
        } header: {
            Text("Flags")
        }
    }
    
    private var acquisitionSection: some View {
        Section {
            DatePicker("Date Acquired", selection: Binding(
                get: { dateAcquired ?? Date() },
                set: { dateAcquired = $0 }
            ), displayedComponents: .date)
            
            Button(dateAcquired == nil ? "Set Date Acquired" : "Clear Date Acquired") {
                dateAcquired = dateAcquired == nil ? Date() : nil
            }
            .foregroundColor(.accentColor)
            
            TextField("Where Acquired", text: $whereAcquired)
            TextField("Price Acquired", text: $priceAcquired)
                .keyboardType(.decimalPad)
            TextField("Estimated Value", text: $estimatedValue)
                .keyboardType(.decimalPad)
        } header: {
            Text("Acquisition & Value")
        }
    }
    
    private var salesSection: some View {
        Section {
            if status != .DONATED {
                TextField("List Price", text: $listPrice)
                    .keyboardType(.decimalPad)
            }
            
            if status == .SOLD {
                TextField("Sold Price", text: $soldPrice)
                    .keyboardType(.decimalPad)
                
                DatePicker("Sold Date", selection: Binding(
                    get: { soldDate ?? Date() },
                    set: { soldDate = $0 }
                ), displayedComponents: .date)
                
                Button(soldDate == nil ? "Set Sold Date" : "Clear Sold Date") {
                    soldDate = soldDate == nil ? Date() : nil
                }
                .foregroundColor(.accentColor)
            }
            else if status == .DONATED {
                DatePicker("Donated Date", selection: Binding(
                    get: { soldDate ?? Date() },
                    set: { soldDate = $0 }
                ), displayedComponents: .date)
                
                Button(soldDate == nil ? "Set Donated Date" : "Clear Donated Date") {
                    soldDate = soldDate == nil ? Date() : nil
                }
                .foregroundColor(.accentColor)
            }
        } header: {
            Text(status == .DONATED ? "Donation Information" : "Sales")
        }
    }
    
    private var computerSpecsSection: some View {
        Section {
            TextField("CPU", text: $cpu)
            TextField("RAM", text: $ram)
            TextField("Graphics", text: $graphics)
            TextField("Storage", text: $storage)
            TextField("Operating System", text: $operatingSystem)
            Toggle("WiFi Enabled", isOn: $isWifiEnabled)
            Toggle("PRAM Battery Removed", isOn: $isPramBatteryRemoved)
            
            DatePicker("Last Power On Date", selection: Binding(
                get: { lastPowerOnDate ?? Date() },
                set: { lastPowerOnDate = $0 }
            ), displayedComponents: .date)
            
            Button(lastPowerOnDate == nil ? "Set Last Power On Date" : "Clear Last Power On Date") {
                lastPowerOnDate = lastPowerOnDate == nil ? Date() : nil
            }
            .foregroundColor(.accentColor)
        } header: {
            Text("Computer Specifications")
        }
    }
    
    private var customFieldsSection: some View {
        Section {
            ForEach(customFieldDefinitions) { field in
                TextField(field.name, text: Binding(
                    get: { customFieldFormValues[field.id] ?? "" },
                    set: { customFieldFormValues[field.id] = $0 }
                ))
            }
        } header: {
            Text("Custom Fields")
        }
    }

    private var repairSection: some View {
        Section("Repair Information") {
            TextField("Repair Fee Charged", text: $soldPrice)
                .keyboardType(.decimalPad)

            DatePicker("Returned Date", selection: Binding(
                get: { soldDate ?? Date() },
                set: { soldDate = $0 }
            ), displayedComponents: .date)

            Button(soldDate == nil ? "Set Returned Date" : "Clear Returned Date") {
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
    
    private func loadCategories() async {
        isLoadingCategories = true
        do {
            categories = try await DeviceService.shared.fetchCategories()
        } catch {
            print("Failed to load categories: \(error)")
        }
        isLoadingCategories = false
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
            if !location.isEmpty { input["location"] = location }
            if !info.isEmpty { input["info"] = info }
            if !externalUrl.isEmpty { input["externalUrl"] = externalUrl }
            
            input["status"] = status.rawValue
            input["functionalStatus"] = functionalStatus.rawValue
            input["isFavorite"] = isFavorite
            input["hasOriginalBox"] = hasOriginalBox
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

#Preview {
    EditDeviceView(device: Device(
        id: 1,
        name: "Macintosh SE",
        additionalName: "FDHD",
        manufacturer: "Apple",
        modelNumber: "M5011",
        serialNumber: "ABC123",
        releaseYear: 1987,
        location: "Shelf A",
        info: "Great condition",
        searchText: nil,
        isFavorite: true,
        status: .COLLECTION,
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
        tags: [],
        customFieldValues: []
    )) { device in
        print("Device updated: \(device)")
    }
}
