//
//  AddDeviceView.swift
//  InventoryDifferent
//
//  Created by Michael Wottle on 2/2/26.
//

import SwiftUI

struct AddDeviceView: View {
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject var deviceStore: DeviceStore

    // Optional prefill values (from wishlist "Mark as Acquired")
    var prefillName: String?
    var prefillAdditionalName: String?
    var prefillManufacturer: String?
    var prefillModelNumber: String?
    var prefillReleaseYear: Int?
    var prefillCategoryId: Int?
    var prefillCpu: String?
    var prefillRam: String?
    var prefillGraphics: String?
    var prefillStorage: String?
    var prefillOperatingSystem: String?
    var prefillExternalUrl: String?
    var prefillIsWifiEnabled: Bool?
    var prefillIsPramBatteryRemoved: Bool?
    var prefillEstimatedValue: Double?

    @State private var name = ""
    @State private var additionalName = ""
    @State private var manufacturer = ""
    @State private var modelNumber = ""
    @State private var serialNumber = ""
    @State private var releaseYear = ""
    @State private var location = ""
    @State private var info = ""
    @State private var externalUrl = ""
    
    @State private var status: Status = .COLLECTION
    @State private var functionalStatus: FunctionalStatus = .YES
    @State private var isFavorite = false
    @State private var hasOriginalBox = false
    @State private var isAssetTagged = false
    
    @State private var dateAcquired: Date?
    @State private var whereAcquired = ""
    @State private var priceAcquired = ""
    @State private var estimatedValue = ""
    
    @State private var listPrice = ""
    @State private var soldPrice = ""
    @State private var soldDate: Date?
    
    @State private var cpu = ""
    @State private var ram = ""
    @State private var graphics = ""
    @State private var storage = ""
    @State private var operatingSystem = ""
    @State private var isWifiEnabled = false
    @State private var isPramBatteryRemoved = false
    @State private var lastPowerOnDate: Date?
    
    @State private var selectedCategoryId: Int?
    @State private var categories: [Category] = []
    @State private var isLoadingCategories = false
    
    @State private var templates: [Template] = []
    @State private var isLoadingTemplates = false
    @State private var templateSearchText = ""
    @State private var selectedTemplate: Template?
    
    @State private var isSaving = false
    @State private var errorMessage: String?
    
    var body: some View {
        NavigationStack {
            Form {
                templateSection
                basicInfoSection
                statusSection
                flagsSection
                acquisitionSection
                if showSalesSection {
                    salesSection
                }
                if isComputerCategory {
                    computerSpecsSection
                }
                
                if let error = errorMessage {
                    Section {
                        Text(error)
                            .foregroundColor(.red)
                            .font(.caption)
                    }
                }
            }
            .navigationTitle("Add Device")
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
                            await saveDevice()
                        }
                    }
                    .disabled(name.trimmingCharacters(in: .whitespaces).isEmpty || selectedCategoryId == nil || isSaving)
                }
            }
            .disabled(isSaving)
            .task {
                await loadCategories()
                await loadTemplates()
                // Apply prefill values from wishlist "Mark as Acquired"
                if let v = prefillName, !v.isEmpty { name = v }
                if let v = prefillAdditionalName, !v.isEmpty { additionalName = v }
                if let v = prefillManufacturer, !v.isEmpty { manufacturer = v }
                if let v = prefillModelNumber, !v.isEmpty { modelNumber = v }
                if let v = prefillReleaseYear { releaseYear = String(v) }
                if let v = prefillCategoryId { selectedCategoryId = v }
                if let v = prefillCpu, !v.isEmpty { cpu = v }
                if let v = prefillRam, !v.isEmpty { ram = v }
                if let v = prefillGraphics, !v.isEmpty { graphics = v }
                if let v = prefillStorage, !v.isEmpty { storage = v }
                if let v = prefillOperatingSystem, !v.isEmpty { operatingSystem = v }
                if let v = prefillExternalUrl, !v.isEmpty { externalUrl = v }
                if let v = prefillIsWifiEnabled { isWifiEnabled = v }
                if let v = prefillIsPramBatteryRemoved { isPramBatteryRemoved = v }
                if let v = prefillEstimatedValue { estimatedValue = String(format: "%.2f", v) }
            }
        }
    }
    
    private var templateSection: some View {
        Section {
            TextField("Search templates...", text: $templateSearchText)
                .textInputAutocapitalization(.never)
            
            if !filteredTemplates.isEmpty {
                ForEach(filteredTemplates.prefix(5)) { template in
                    Button {
                        applyTemplate(template)
                    } label: {
                        VStack(alignment: .leading, spacing: 4) {
                            Text(template.name)
                                .foregroundColor(.primary)
                            if let additionalName = template.additionalName {
                                Text(additionalName)
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                            HStack {
                                Text(template.category.name)
                                    .font(.caption2)
                                    .foregroundColor(.secondary)
                                if let manufacturer = template.manufacturer {
                                    Text("•")
                                        .font(.caption2)
                                        .foregroundColor(.secondary)
                                    Text(manufacturer)
                                        .font(.caption2)
                                        .foregroundColor(.secondary)
                                }
                            }
                        }
                        .padding(.vertical, 4)
                    }
                }
            }
        } header: {
            Text("Template (Optional)")
        } footer: {
            if selectedTemplate != nil {
                Text("Template applied. You can modify any fields below.")
            } else if !templateSearchText.isEmpty && filteredTemplates.isEmpty {
                Text("No templates found")
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
                Text("Select a category")
                    .tag(nil as Int?)
                ForEach(categories) { category in
                    Text(category.name).tag(category.id as Int?)
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
                if newValue == .SOLD || newValue == .DONATED {
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
    
    private var showSalesSection: Bool {
        status == .FOR_SALE || status == .PENDING_SALE || status == .SOLD || status == .DONATED
    }
    
    private var isComputerCategory: Bool {
        guard let categoryId = selectedCategoryId else { return false }
        return categories.first(where: { $0.id == categoryId })?.type == "COMPUTER"
    }
    
    private var filteredTemplates: [Template] {
        if templateSearchText.isEmpty {
            return []
        }
        return templates.filter { template in
            template.name.localizedCaseInsensitiveContains(templateSearchText) ||
            template.additionalName?.localizedCaseInsensitiveContains(templateSearchText) == true ||
            template.manufacturer?.localizedCaseInsensitiveContains(templateSearchText) == true ||
            template.modelNumber?.localizedCaseInsensitiveContains(templateSearchText) == true
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
    
    private func loadTemplates() async {
        isLoadingTemplates = true
        do {
            let query = """
            query {
                templates {
                    id
                    name
                    additionalName
                    manufacturer
                    modelNumber
                    releaseYear
                    estimatedValue
                    cpu
                    ram
                    graphics
                    storage
                    operatingSystem
                    externalUrl
                    isWifiEnabled
                    isPramBatteryRemoved
                    categoryId
                    category {
                        id
                        name
                        type
                        sortOrder
                    }
                }
            }
            """
            
            struct Response: Decodable {
                let templates: [Template]
            }
            
            let response: Response = try await APIService.shared.execute(query: query)
            templates = response.templates
        } catch {
            print("Failed to load templates: \(error)")
        }
        isLoadingTemplates = false
    }
    
    private func applyTemplate(_ template: Template) {
        selectedTemplate = template
        name = template.name
        additionalName = template.additionalName ?? ""
        manufacturer = template.manufacturer ?? ""
        modelNumber = template.modelNumber ?? ""
        releaseYear = template.releaseYear.map { String($0) } ?? ""
        estimatedValue = template.estimatedValue.map { String(format: "%.2f", $0) } ?? ""
        cpu = template.cpu ?? ""
        ram = template.ram ?? ""
        graphics = template.graphics ?? ""
        storage = template.storage ?? ""
        operatingSystem = template.operatingSystem ?? ""
        externalUrl = template.externalUrl ?? ""
        isWifiEnabled = template.isWifiEnabled ?? false
        isPramBatteryRemoved = template.isPramBatteryRemoved ?? false
        selectedCategoryId = template.categoryId
        
        templateSearchText = ""
    }
    
    private func saveDevice() async {
        guard let categoryId = selectedCategoryId else { return }
        guard !name.trimmingCharacters(in: .whitespaces).isEmpty else { return }
        
        isSaving = true
        errorMessage = nil
        
        do {
            let query = """
            mutation CreateDevice($input: DeviceCreateInput!) {
                createDevice(input: $input) {
                    id
                    name
                }
            }
            """
            
            var input: [String: Any] = [
                "name": name.trimmingCharacters(in: .whitespaces),
                "categoryId": categoryId
            ]
            
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
                input["dateAcquired"] = formatDate(date)
            }
            if !whereAcquired.isEmpty { input["whereAcquired"] = whereAcquired }
            if let price = Double(priceAcquired) { input["priceAcquired"] = price }
            if let value = Double(estimatedValue) { input["estimatedValue"] = value }
            
            if let price = Double(listPrice) { input["listPrice"] = price }
            if let price = Double(soldPrice) { input["soldPrice"] = price }
            if let date = soldDate {
                input["soldDate"] = formatDate(date)
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
                    input["lastPowerOnDate"] = formatDate(date)
                }
            }
            
            struct Response: Decodable {
                struct CreateDevice: Decodable {
                    let id: Int
                    let name: String
                }
                let createDevice: CreateDevice
            }
            
            let _: Response = try await APIService.shared.execute(
                query: query,
                variables: ["input": input]
            )
            
            await MainActor.run {
                Task {
                    await deviceStore.loadDevices()
                }
                dismiss()
            }
        } catch {
            await MainActor.run {
                errorMessage = error.localizedDescription
                isSaving = false
            }
        }
    }
    
    private func formatDate(_ date: Date) -> String {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return formatter.string(from: date)
    }
}

#Preview {
    AddDeviceView()
        .environmentObject(DeviceStore())
}
