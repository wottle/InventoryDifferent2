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
    @EnvironmentObject var lm: LocalizationManager
    private var t: Translations { lm.t }

    // Called with the new device ID after a successful save; nil = just dismiss
    var onCreated: ((Int) -> Void)? = nil

    // Optional prefill values (from wishlist "Mark as Acquired" or barcode scanner)
    var prefillTemplateId: Int?
    var prefillSerialNumber: String?
    var prefillName: String?
    var prefillAdditionalName: String?
    var prefillManufacturer: String?
    var prefillModelNumber: String?
    var prefillReleaseYear: Int?
    var prefillCategoryId: Int?
    var prefillCpuType: String?
    var prefillCpuSpeed: String?
    var prefillRam: String?
    var prefillGraphicsChip: String?
    var prefillStorage: String?
    var prefillOperatingSystem: String?
    var prefillExternalUrl: String?
    var prefillIsWifiEnabled: Bool?
    var prefillPramBatteryInstalled: Bool?
    var prefillEstimatedValue: Double?

    @State private var name = ""
    @State private var additionalName = ""
    @State private var manufacturer = ""
    @State private var modelNumber = ""
    @State private var serialNumber = ""
    @State private var releaseYear = ""
    @State private var selectedLocationId: Int? = nil
    @State private var locations: [LocationRef] = []
    @State private var isLoadingLocations = false
    @State private var showingNewLocationAlert = false
    @State private var newLocationName = ""
    @State private var info = ""
    @State private var historicalNotes = ""

    @State private var status: Status = .COLLECTION
    @State private var functionalStatus: FunctionalStatus = .UNKNOWN
    @State private var condition: Condition? = nil
    @State private var rarity: Rarity? = nil
    @State private var isFavorite = false
    @State private var isAssetTagged = false

    @State private var localAccessories: [String] = []
    @State private var localLinks: [(label: String, url: String)] = []
    @State private var showAddAccessorySheet = false
    @State private var showAddLinkSheet = false
    
    @State private var dateAcquired: Date? = Date()
    @State private var whereAcquired = ""
    @State private var priceAcquired = ""
    @State private var estimatedValue = ""
    
    @State private var listPrice = ""
    @State private var soldPrice = ""
    @State private var soldDate: Date?
    
    @State private var cpuType = ""
    @State private var cpuSpeed = ""
    @State private var ram = ""
    @State private var graphicsChip = ""
    @State private var screenSize = ""
    @State private var displayType = ""
    @State private var displayVariant = ""
    @State private var nativeResolution = ""
    @State private var storageEntries: [DeviceStorageEntry] = []
    @State private var newStorageValue = ""
    @State private var osEntries: [DeviceOSEntry] = []
    @State private var newOsValue = ""
    @State private var isWifiEnabled = false
    @State private var isRetroBrited = false
    @State private var isRecapped = false
    @State private var pramBatteryInstalled = true
    @State private var lastPowerOnDate: Date?
    
    @State private var selectedCategoryId: Int?
    @State private var categories: [Category] = []
    @State private var isLoadingCategories = false
    
    @State private var templates: [Template] = []
    @State private var isLoadingTemplates = false
    @State private var templateSearchText = ""
    @State private var selectedTemplate: Template?
    @State private var externalTemplates: [ExternalTemplate] = []
    @State private var selectedExternalTemplate: ExternalTemplate?
    
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
                accessoriesSection
                linksSection

            }
            .navigationTitle(t.addEditDevice.addTitle)
            .navigationBarTitleDisplayMode(.inline)
            .alert(t.common.error, isPresented: Binding(
                get: { errorMessage != nil },
                set: { if !$0 { errorMessage = nil } }
            )) {
                Button(t.common.ok, role: .cancel) { errorMessage = nil }
            } message: {
                Text(errorMessage ?? "")
            }
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
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button(t.common.cancel) {
                        dismiss()
                    }
                }

                ToolbarItem(placement: .confirmationAction) {
                    Button(t.common.save) {
                        Task {
                            await saveDevice()
                        }
                    }
                    .disabled(name.trimmingCharacters(in: .whitespaces).isEmpty || selectedCategoryId == nil || isSaving)
                }
            }
            .disabled(isSaving)
            .sheet(isPresented: $showAddAccessorySheet) {
                AddLocalAccessorySheet { name in
                    if !localAccessories.contains(name) {
                        localAccessories.append(name)
                    }
                }
            }
            .sheet(isPresented: $showAddLinkSheet) {
                AddLocalLinkSheet { label, url in
                    localLinks.append((label: label, url: url))
                }
            }
            .task {
                await loadCategories()
                await loadTemplates()
                await loadLocations()
                if AuthService.shared.externalTemplatesEnabled {
                    externalTemplates = await ExternalTemplateService.shared.loadTemplates()
                }
                // Auto-apply matched template from barcode decoder (before other prefills
                // so that prefill values take precedence over template defaults)
                if let id = prefillTemplateId, let template = templates.first(where: { $0.id == id }) {
                    applyTemplate(template)
                }
                // Apply prefill values from wishlist "Mark as Acquired"
                if let v = prefillSerialNumber, !v.isEmpty { serialNumber = v }
                if let v = prefillName, !v.isEmpty { name = v }
                if let v = prefillAdditionalName, !v.isEmpty { additionalName = v }
                if let v = prefillManufacturer, !v.isEmpty { manufacturer = v }
                if let v = prefillModelNumber, !v.isEmpty { modelNumber = v }
                if let v = prefillReleaseYear { releaseYear = String(v) }
                if let v = prefillCategoryId { selectedCategoryId = v }
                if let v = prefillCpuType, !v.isEmpty { cpuType = v }
                if let v = prefillCpuSpeed, !v.isEmpty { cpuSpeed = v }
                if let v = prefillRam, !v.isEmpty { ram = v }
                if let v = prefillGraphicsChip, !v.isEmpty { graphicsChip = v }
                if let v = prefillStorage, !v.isEmpty {
                    let parts = v.components(separatedBy: "+").map { $0.trimmingCharacters(in: .whitespaces) }.filter { !$0.isEmpty }
                    storageEntries = parts.enumerated().map { DeviceStorageEntry(id: -(($0.offset) + 1), value: $0.element, sortOrder: $0.offset) }
                }
                if let v = prefillOperatingSystem, !v.isEmpty {
                    let parts = v.components(separatedBy: "+").map { $0.trimmingCharacters(in: .whitespaces) }.filter { !$0.isEmpty }
                    osEntries = parts.enumerated().map { DeviceOSEntry(id: -(($0.offset) + 1), value: $0.element, sortOrder: $0.offset) }
                }
                if let v = prefillIsWifiEnabled { isWifiEnabled = v }
                if let v = prefillPramBatteryInstalled { pramBatteryInstalled = v }
                if let v = prefillEstimatedValue { estimatedValue = String(format: "%.2f", v) }
            }
        }
    }
    
    private enum TemplateResult: Identifiable {
        case local(Template)
        case remote(ExternalTemplate)
        var id: String {
            switch self { case .local(let t): return "l_\(t.id)"; case .remote(let t): return "r_\(t.id)" }
        }
        var name: String {
            switch self { case .local(let t): return t.name; case .remote(let t): return t.name }
        }
        var additionalName: String? {
            switch self { case .local(let t): return t.additionalName; case .remote(let t): return t.additionalName }
        }
    }

    private var mergedTemplateResults: [TemplateResult] {
        if templateSearchText.isEmpty { return [] }
        let q = templateSearchText
        let localSource = externalTemplates.isEmpty ? filteredTemplates : filteredTemplates.filter { !($0.isSeeded ?? false) }
        let local = localSource.map { TemplateResult.local($0) }
        let remote = filteredExternalTemplates.map { TemplateResult.remote($0) }
        return (local + remote)
            .sorted { a, b in
                let ra = templateMatchRank(name: a.name, additionalName: a.additionalName, query: q)
                let rb = templateMatchRank(name: b.name, additionalName: b.additionalName, query: q)
                if ra != rb { return ra < rb }
                if a.name != b.name { return a.name < b.name }
                return (a.additionalName ?? "") < (b.additionalName ?? "")
            }
            .prefix(8).map { $0 }
    }

    private var templateSection: some View {
        let t = lm.t
        let results = mergedTemplateResults
        return Section {
            TextField(t.addEditDevice.searchTemplates, text: $templateSearchText)
                .textInputAutocapitalization(.never)

            ForEach(results) { result in
                switch result {
                case .local(let template):
                    Button { applyTemplate(template) } label: {
                        templateRow(name: template.name, additionalName: template.additionalName,
                                    categoryName: template.category.name, manufacturer: template.manufacturer,
                                    isExternal: false)
                    }
                case .remote(let template):
                    Button { applyExternalTemplate(template) } label: {
                        templateRow(name: template.name, additionalName: template.additionalName,
                                    categoryName: template.category?.name ?? "",
                                    manufacturer: template.manufacturer,
                                    isExternal: true,
                                    hasImages: !(template.images ?? []).isEmpty)
                    }
                }
            }
        } header: {
            Text(t.addEditDevice.templateOptional)
        } footer: {
            if selectedTemplate != nil || selectedExternalTemplate != nil {
                Text(t.addEditDevice.templateApplied)
            } else if !templateSearchText.isEmpty && results.isEmpty {
                Text(t.addEditDevice.noTemplates)
            }
        }
    }

    @ViewBuilder
    private func templateRow(name: String, additionalName: String?, categoryName: String,
                              manufacturer: String?, isExternal: Bool, hasImages: Bool = false) -> some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text(name)
                    .foregroundColor(.primary)
                if let additionalName = additionalName {
                    Text(additionalName)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                HStack {
                    Text(categoryName)
                        .font(.caption2)
                        .foregroundColor(.secondary)
                    if let manufacturer = manufacturer {
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
            Spacer()
            if hasImages {
                Image(systemName: "photo")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            if isExternal {
                Image(systemName: "cloud")
                    .font(.caption)
                    .foregroundColor(.secondary)
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
            LabeledField(label: t.addEditDevice.serialNumber, text: $serialNumber)
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
                Text(t.addEditDevice.selectCategory)
                    .tag(nil as Int?)
                ForEach(categories) { category in
                    Text(category.name).tag(category.id as Int?)
                }
            }
            .disabled(isLoadingCategories)

            LabeledTextEditor(label: t.addEditDevice.info, text: $info)
            LabeledTextEditor(label: t.addEditDevice.historicalNotes, text: $historicalNotes)
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
                if newValue == .SOLD || newValue == .DONATED {
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
            Toggle("Retr0brited", isOn: $isRetroBrited)
            Toggle("Recapped", isOn: $isRecapped)
        } header: {
            Text(t.addEditDevice.flags)
        }
    }

    private var accessoriesSection: some View {
        let t = lm.t
        return Section {
            if localAccessories.isEmpty {
                Text(t.addEditDevice.noAccessoriesYet)
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            } else {
                ForEach(localAccessories, id: \.self) { accessory in
                    HStack {
                        Text(accessory)
                        Spacer()
                        Button {
                            localAccessories.removeAll { $0 == accessory }
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
            if localLinks.isEmpty {
                Text(t.addEditDevice.noLinksYet)
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            } else {
                ForEach(Array(localLinks.enumerated()), id: \.offset) { index, link in
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
                            localLinks.remove(at: index)
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
            LabeledField(label: t.addEditDevice.cpuType, text: $cpuType)
            LabeledField(label: t.addEditDevice.cpuSpeed, text: $cpuSpeed)
            LabeledField(label: t.addEditDevice.ram, text: $ram)
            LabeledField(label: t.addEditDevice.graphicsChip, text: $graphicsChip)
            LabeledField(label: t.addEditDevice.screenSize, text: $screenSize)
            LabeledField(label: t.addEditDevice.displayType, text: $displayType)
            LabeledField(label: t.addEditDevice.displayVariant, text: $displayVariant)
            LabeledField(label: t.addEditDevice.nativeResolution, text: $nativeResolution)
            ForEach(storageEntries) { entry in
                HStack {
                    Text(entry.value).font(.subheadline)
                    Spacer()
                    Button { storageEntries.removeAll { $0.id == entry.id } } label: {
                        Image(systemName: "trash").foregroundColor(.red)
                    }
                }
            }
            HStack {
                TextField(t.addEditDevice.addStorage, text: $newStorageValue)
                Button("Add") {
                    let v = newStorageValue.trimmingCharacters(in: .whitespaces)
                    guard !v.isEmpty else { return }
                    storageEntries.append(DeviceStorageEntry(id: -(storageEntries.count + 1), value: v, sortOrder: storageEntries.count))
                    newStorageValue = ""
                }.disabled(newStorageValue.trimmingCharacters(in: .whitespaces).isEmpty)
            }
            ForEach(osEntries) { entry in
                HStack {
                    Text(entry.value).font(.subheadline)
                    Spacer()
                    Button { osEntries.removeAll { $0.id == entry.id } } label: {
                        Image(systemName: "trash").foregroundColor(.red)
                    }
                }
            }
            HStack {
                TextField(t.addEditDevice.addOs, text: $newOsValue)
                Button("Add") {
                    let v = newOsValue.trimmingCharacters(in: .whitespaces)
                    guard !v.isEmpty else { return }
                    osEntries.append(DeviceOSEntry(id: -(osEntries.count + 1), value: v, sortOrder: osEntries.count))
                    newOsValue = ""
                }.disabled(newOsValue.trimmingCharacters(in: .whitespaces).isEmpty)
            }
            Toggle(t.addEditDevice.wifiEnabled, isOn: $isWifiEnabled)
            Toggle(t.addEditDevice.pramBatteryInstalled, isOn: $pramBatteryInstalled)
            DatePicker(t.addEditDevice.lastPowerOn, selection: Binding(
                get: { lastPowerOnDate ?? Date() },
                set: { lastPowerOnDate = $0 }
            ), displayedComponents: .date)
            Button(lastPowerOnDate == nil ? t.addEditDevice.setLastPowerOn : t.addEditDevice.clearLastPowerOn) {
                lastPowerOnDate = lastPowerOnDate == nil ? Date() : nil
            }
            .foregroundColor(.accentColor)
        } header: {
            Text(t.addEditDevice.computerSpecs)
        }
    }
    
    private var showSalesSection: Bool {
        status == .FOR_SALE || status == .PENDING_SALE || status == .SOLD || status == .DONATED
    }
    
    private var isComputerCategory: Bool {
        guard let categoryId = selectedCategoryId else { return false }
        return categories.first(where: { $0.id == categoryId })?.type == "COMPUTER"
    }
    
    // 0 = exact, 1 = prefix, 2 = contains — lower is better
    private func templateMatchRank(name: String, additionalName: String?, query: String) -> Int {
        let q = query.lowercased()
        let n = name.lowercased()
        let a = additionalName?.lowercased()
        if n == q || a == q { return 0 }
        if n.hasPrefix(q) || a?.hasPrefix(q) == true { return 1 }
        return 2
    }

    private var filteredTemplates: [Template] {
        if templateSearchText.isEmpty { return [] }
        let q = templateSearchText
        return templates
            .filter { t in
                t.name.localizedCaseInsensitiveContains(q) ||
                t.additionalName?.localizedCaseInsensitiveContains(q) == true ||
                t.manufacturer?.localizedCaseInsensitiveContains(q) == true ||
                t.modelNumber?.localizedCaseInsensitiveContains(q) == true
            }
            .sorted { a, b in
                let ra = templateMatchRank(name: a.name, additionalName: a.additionalName, query: q)
                let rb = templateMatchRank(name: b.name, additionalName: b.additionalName, query: q)
                if ra != rb { return ra < rb }
                if a.name != b.name { return a.name < b.name }
                return (a.additionalName ?? "") < (b.additionalName ?? "")
            }
    }

    private var filteredExternalTemplates: [ExternalTemplate] {
        if templateSearchText.isEmpty { return [] }
        let q = templateSearchText
        return externalTemplates
            .filter { t in
                t.name.localizedCaseInsensitiveContains(q) ||
                t.additionalName?.localizedCaseInsensitiveContains(q) == true ||
                t.manufacturer?.localizedCaseInsensitiveContains(q) == true ||
                t.modelNumber?.localizedCaseInsensitiveContains(q) == true
            }
            .sorted { a, b in
                let ra = templateMatchRank(name: a.name, additionalName: a.additionalName, query: q)
                let rb = templateMatchRank(name: b.name, additionalName: b.additionalName, query: q)
                if ra != rb { return ra < rb }
                if a.name != b.name { return a.name < b.name }
                return (a.additionalName ?? "") < (b.additionalName ?? "")
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
                    cpuType
                    cpuSpeed
                    ram
                    graphicsChip
                    screenSize
                    displayType
                    displayVariant
                    nativeResolution
                    storage
                    operatingSystem
                    externalUrl
                    externalLinkLabel
                    isWifiEnabled
                    rarity
                    isSeeded
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
        selectedExternalTemplate = nil
        name = template.name
        additionalName = template.additionalName ?? ""
        manufacturer = template.manufacturer ?? ""
        modelNumber = template.modelNumber ?? ""
        releaseYear = template.releaseYear.map { String($0) } ?? ""
        estimatedValue = template.estimatedValue.map { String(format: "%.2f", $0) } ?? ""
        cpuType = template.cpuType ?? ""
        cpuSpeed = template.cpuSpeed ?? ""
        ram = template.ram ?? ""
        graphicsChip = template.graphicsChip ?? ""
        screenSize = template.screenSize ?? ""
        displayType = template.displayType ?? ""
        displayVariant = template.displayVariant ?? ""
        nativeResolution = template.nativeResolution ?? ""
        if let stor = template.storage, !stor.isEmpty {
            let parts = stor.components(separatedBy: "+").map { $0.trimmingCharacters(in: .whitespaces) }.filter { !$0.isEmpty }
            storageEntries = parts.enumerated().map { DeviceStorageEntry(id: -(($0.offset) + 1), value: $0.element, sortOrder: $0.offset) }
        }
        if let os = template.operatingSystem, !os.isEmpty {
            let parts = os.components(separatedBy: "+").map { $0.trimmingCharacters(in: .whitespaces) }.filter { !$0.isEmpty }
            osEntries = parts.enumerated().map { DeviceOSEntry(id: -(($0.offset) + 1), value: $0.element, sortOrder: $0.offset) }
        }
        isWifiEnabled = template.isWifiEnabled ?? false
        pramBatteryInstalled = true
        if let r = template.rarity { rarity = r }
        selectedCategoryId = template.categoryId

        // Add the template's reference link to the pending links list
        localLinks.removeAll { $0.label == (selectedTemplate?.externalLinkLabel ?? "Reference") && selectedTemplate?.externalUrl != nil }
        if let url = template.externalUrl, !url.isEmpty {
            let label = template.externalLinkLabel ?? "Reference"
            localLinks.removeAll { $0.url == url }
            localLinks.append((label: label, url: url))
        }

        templateSearchText = ""
    }

    private func applyExternalTemplate(_ template: ExternalTemplate) {
        selectedExternalTemplate = template
        selectedTemplate = nil
        name = template.name
        additionalName = template.additionalName ?? ""
        manufacturer = template.manufacturer ?? ""
        modelNumber = template.modelNumber ?? ""
        releaseYear = template.releaseYear.map { String($0) } ?? ""
        estimatedValue = template.estimatedValue.map { String(format: "%.2f", $0) } ?? ""
        cpuType = template.cpuType ?? ""
        cpuSpeed = template.cpuSpeed ?? ""
        ram = template.ram ?? ""
        graphicsChip = template.graphicsChip ?? ""
        screenSize = template.screenSize ?? ""
        displayType = template.displayType ?? ""
        displayVariant = template.displayVariant ?? ""
        nativeResolution = template.nativeResolution ?? ""
        if let stor = template.storage, !stor.isEmpty {
            let parts = stor.components(separatedBy: "+").map { $0.trimmingCharacters(in: .whitespaces) }.filter { !$0.isEmpty }
            storageEntries = parts.enumerated().map { DeviceStorageEntry(id: -(($0.offset) + 1), value: $0.element, sortOrder: $0.offset) }
        }
        if let os = template.operatingSystem, !os.isEmpty {
            let parts = os.components(separatedBy: "+").map { $0.trimmingCharacters(in: .whitespaces) }.filter { !$0.isEmpty }
            osEntries = parts.enumerated().map { DeviceOSEntry(id: -(($0.offset) + 1), value: $0.element, sortOrder: $0.offset) }
        }
        isWifiEnabled = (template.isWifiEnabled ?? 0) != 0
        historicalNotes = template.historicalNotes ?? ""
        if let r = template.rarity, let rarityVal = Rarity(rawValue: r) { rarity = rarityVal }
        if let remoteCategory = template.category {
            if let match = categories.first(where: { $0.name.lowercased() == remoteCategory.name.lowercased() }) {
                selectedCategoryId = match.id
            } else if let remoteType = remoteCategory.type,
                      let match = categories.first(where: { $0.type == remoteType }) {
                selectedCategoryId = match.id
            }
        }
        if let url = template.externalUrl, !url.isEmpty {
            let label = "Reference"
            localLinks.removeAll { $0.url == url }
            localLinks.append((label: label, url: url))
        }
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
            if let locationId = selectedLocationId { input["locationId"] = locationId }
            if !info.isEmpty { input["info"] = info }
            if !historicalNotes.isEmpty { input["historicalNotes"] = historicalNotes }

            input["status"] = status.rawValue
            input["functionalStatus"] = functionalStatus.rawValue
            if let condition { input["condition"] = condition.rawValue }
            if let rarity { input["rarity"] = rarity.rawValue }
            input["isFavorite"] = isFavorite
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
                if !cpuType.isEmpty { input["cpuType"] = cpuType }
                if !cpuSpeed.isEmpty { input["cpuSpeed"] = cpuSpeed }
                if !ram.isEmpty { input["ram"] = ram }
                if !graphicsChip.isEmpty { input["graphicsChip"] = graphicsChip }
                if !screenSize.isEmpty { input["screenSize"] = screenSize }
                if !displayType.isEmpty { input["displayType"] = displayType }
                if !displayVariant.isEmpty { input["displayVariant"] = displayVariant }
                if !nativeResolution.isEmpty { input["nativeResolution"] = nativeResolution }
                input["isWifiEnabled"] = isWifiEnabled
                input["pramBatteryInstalled"] = pramBatteryInstalled
                if let date = lastPowerOnDate { input["lastPowerOnDate"] = formatDate(date) }
            }
            input["isRetroBrited"] = isRetroBrited
            input["isRecapped"] = isRecapped
            
            struct Response: Decodable {
                struct CreateDevice: Decodable {
                    let id: Int
                    let name: String
                }
                let createDevice: CreateDevice
            }

            let response: Response = try await APIService.shared.execute(
                query: query,
                variables: ["input": input]
            )
            let newDeviceId = response.createDevice.id

            // Add storage and OS entries
            if isComputerCategory {
                for (i, entry) in storageEntries.enumerated() {
                    do { _ = try await DeviceService.shared.addDeviceStorageEntry(deviceId: newDeviceId, value: entry.value, sortOrder: i) }
                    catch { print("Failed to add storage entry: \(error)") }
                }
                for (i, entry) in osEntries.enumerated() {
                    do { _ = try await DeviceService.shared.addDeviceOSEntry(deviceId: newDeviceId, value: entry.value, sortOrder: i) }
                    catch { print("Failed to add OS entry: \(error)") }
                }
            }

            // Add accessories
            for accessoryName in localAccessories {
                do { _ = try await DeviceService.shared.addDeviceAccessory(deviceId: newDeviceId, name: accessoryName) }
                catch { print("Failed to add accessory: \(error)") }
            }

            // Add links
            for linkEntry in localLinks {
                do { _ = try await DeviceService.shared.addDeviceLink(deviceId: newDeviceId, label: linkEntry.label, url: linkEntry.url) }
                catch { print("Failed to add link: \(error)") }
            }

            // Upload template images (best-effort)
            if let extTemplate = selectedExternalTemplate, let images = extTemplate.images, !images.isEmpty {
                let setThumbnailMode = images.count == 1 ? "BOTH" : nil
                for img in images {
                    guard let imageURL = URL(string: img.url),
                          let (imgData, _) = try? await URLSession.shared.data(from: imageURL) else { continue }
                    let filename = imageURL.lastPathComponent.isEmpty ? "template.webp" : imageURL.lastPathComponent
                    let mimeType = filename.hasSuffix(".webp") ? "image/webp" : "image/jpeg"
                    guard let uploadedImage = try? await DeviceService.shared.uploadImage(
                        deviceId: newDeviceId, mediaData: imgData, filename: filename, mimeType: mimeType
                    ) else { continue }
                    let mode = setThumbnailMode ?? img.type
                    _ = try? await DeviceService.shared.updateImage(id: uploadedImage.id, isThumbnail: true, thumbnailMode: mode)
                }
            }

            await MainActor.run {
                Task {
                    await deviceStore.loadDevices()
                }
                onCreated?(newDeviceId)
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

private struct AddLocalAccessorySheet: View {
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject var lm: LocalizationManager
    let onAdded: (String) -> Void

    @State private var customName = ""

    private let suggestions = [
        "Original Box", "Power Adapter", "Power Cable", "Keyboard", "Mouse",
        "Monitor", "Speakers", "Manuals", "Floppy Disks", "CDs", "Remote Control"
    ]

    var body: some View {
        let t = lm.t
        return NavigationStack {
            Form {
                Section(t.addEditDevice.accessorySuggestions) {
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 8) {
                            ForEach(suggestions, id: \.self) { suggestion in
                                Button {
                                    onAdded(suggestion)
                                    dismiss()
                                } label: {
                                    Text(suggestion)
                                        .font(.caption)
                                        .padding(.horizontal, 8)
                                        .padding(.vertical, 4)
                                        .background(Color.green.opacity(0.15))
                                        .foregroundColor(.green)
                                        .clipShape(Capsule())
                                }
                            }
                        }
                        .padding(.vertical, 4)
                    }
                }

                Section(t.addEditDevice.accessoryCustom) {
                    HStack {
                        TextField(t.addEditDevice.accessoryNamePlaceholder, text: $customName)
                        Button(t.common.add) {
                            let trimmed = customName.trimmingCharacters(in: .whitespaces)
                            if !trimmed.isEmpty {
                                onAdded(trimmed)
                                dismiss()
                            }
                        }
                        .disabled(customName.trimmingCharacters(in: .whitespaces).isEmpty)
                    }
                }
            }
            .navigationTitle(t.addEditDevice.addAccessory)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button(t.common.cancel) { dismiss() }
                }
            }
        }
    }
}

private struct AddLocalLinkSheet: View {
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject var lm: LocalizationManager
    let onAdded: (String, String) -> Void

    @State private var label = ""
    @State private var url = ""

    var body: some View {
        let t = lm.t
        return NavigationStack {
            Form {
                Section(t.addEditDevice.linkDetails) {
                    TextField(t.addEditDevice.linkLabelPlaceholder, text: $label)
                    TextField(t.addEditDevice.linkURLPlaceholder, text: $url)
                        .keyboardType(.URL)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                }
            }
            .navigationTitle(t.addEditDevice.addLink)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button(t.common.cancel) { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button(t.common.add) {
                        let trimmedLabel = label.trimmingCharacters(in: .whitespaces)
                        let trimmedUrl = url.trimmingCharacters(in: .whitespaces)
                        if !trimmedLabel.isEmpty && !trimmedUrl.isEmpty {
                            onAdded(trimmedLabel, trimmedUrl)
                            dismiss()
                        }
                    }
                    .disabled(label.trimmingCharacters(in: .whitespaces).isEmpty ||
                              url.trimmingCharacters(in: .whitespaces).isEmpty)
                }
            }
        }
    }
}

#Preview {
    AddDeviceView()
        .environmentObject(DeviceStore())
}
