//
//  AddEditWishlistItemView.swift
//  InventoryDifferent
//

import SwiftUI

struct AddEditWishlistItemView: View {
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject var deviceStore: DeviceStore
    @EnvironmentObject var lm: LocalizationManager

    let item: WishlistItem?
    let categories: [Category]
    let existingGroups: [String]
    let onSaved: () -> Void

    @State private var name = ""
    @State private var additionalName = ""
    @State private var manufacturer = ""
    @State private var modelNumber = ""
    @State private var releaseYear = ""
    @State private var targetPrice = ""
    @State private var sourceUrl = ""
    @State private var sourceNotes = ""
    @State private var notes = ""
    @State private var priority = 2
    @State private var group = ""
    @State private var selectedCategoryId: Int?

    // Spec fields
    @State private var cpu = ""
    @State private var ram = ""
    @State private var graphics = ""
    @State private var storage = ""
    @State private var operatingSystem = ""
    @State private var externalUrl = ""
    @State private var isWifiEnabled = false
    @State private var isPramBatteryRemoved = false

    // Template picker
    @State private var templates: [Template] = []
    @State private var templateSearchText = ""
    @State private var selectedTemplate: Template?
    @State private var isLoadingTemplates = false

    @State private var isSaving = false
    @State private var errorMessage: String?
    @State private var showingAddDevice = false

    init(item: WishlistItem? = nil, categories: [Category], existingGroups: [String] = [], onSaved: @escaping () -> Void) {
        self.item = item
        self.categories = categories
        self.existingGroups = existingGroups
        self.onSaved = onSaved
    }

    var isEditing: Bool { item != nil }

    private var isComputerCategory: Bool {
        guard let categoryId = selectedCategoryId else { return false }
        return categories.first(where: { $0.id == categoryId })?.type == "COMPUTER"
    }

    private var filteredTemplates: [Template] {
        if templateSearchText.isEmpty { return [] }
        return templates.filter { t in
            t.name.localizedCaseInsensitiveContains(templateSearchText) ||
            t.additionalName?.localizedCaseInsensitiveContains(templateSearchText) == true ||
            t.manufacturer?.localizedCaseInsensitiveContains(templateSearchText) == true ||
            t.modelNumber?.localizedCaseInsensitiveContains(templateSearchText) == true
        }
    }

    var body: some View {
        let t = lm.t
        NavigationStack {
            Form {
                // Template picker
                Section {
                    TextField(t.addEditWishlist.searchTemplates, text: $templateSearchText)
                        .textInputAutocapitalization(.never)
                    if !filteredTemplates.isEmpty {
                        ForEach(filteredTemplates.prefix(5)) { template in
                            Button {
                                applyTemplate(template)
                            } label: {
                                VStack(alignment: .leading, spacing: 2) {
                                    Text(template.name).foregroundColor(.primary)
                                    HStack {
                                        Text(template.category.name).font(.caption2).foregroundColor(.secondary)
                                        if let mfr = template.manufacturer {
                                            Text("· \(mfr)").font(.caption2).foregroundColor(.secondary)
                                        }
                                    }
                                }
                                .padding(.vertical, 2)
                            }
                        }
                    }
                } header: {
                    Text(t.addEditWishlist.templateOptional)
                } footer: {
                    if selectedTemplate != nil {
                        Text(t.addEditWishlist.templateApplied)
                    } else if !templateSearchText.isEmpty && filteredTemplates.isEmpty {
                        Text(t.addEditWishlist.noTemplates)
                    }
                }

                Section(t.addEditWishlist.basicInfo) {
                    LabeledField(label: t.addEditWishlist.name, text: $name)
                    LabeledField(label: t.addEditWishlist.additionalName, text: $additionalName)
                    LabeledField(label: t.addEditWishlist.manufacturer, text: $manufacturer)
                    LabeledField(label: t.addEditWishlist.modelNumber, text: $modelNumber)
                    LabeledField(label: t.addEditWishlist.releaseYear, text: $releaseYear, keyboardType: .numberPad)
                }

                Section(t.addEditWishlist.details) {
                    Picker(t.addEditWishlist.priority, selection: $priority) {
                        Text(t.priority.high).tag(1)
                        Text(t.priority.medium).tag(2)
                        Text(t.priority.low).tag(3)
                    }

                    Picker(t.addEditWishlist.category, selection: $selectedCategoryId) {
                        Text(t.addEditWishlist.none_).tag(Int?.none)
                        ForEach(categories) { category in
                            Text(category.name).tag(Optional(category.id))
                        }
                    }

                    LabeledField(label: t.addEditWishlist.group, text: $group)
                    // Autocomplete suggestions
                    let suggestions = existingGroups.filter { g in
                        !g.isEmpty && (group.isEmpty || g.localizedCaseInsensitiveContains(group)) && g != group
                    }
                    if !suggestions.isEmpty {
                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 8) {
                                ForEach(suggestions, id: \.self) { suggestion in
                                    Button(suggestion) { group = suggestion }
                                        .font(.caption)
                                        .padding(.horizontal, 10)
                                        .padding(.vertical, 4)
                                        .background(Color.accentColor.opacity(0.1))
                                        .foregroundColor(.accentColor)
                                        .clipShape(Capsule())
                                }
                            }
                            .padding(.vertical, 2)
                        }
                    }

                    LabeledField(label: t.addEditWishlist.targetPrice, text: $targetPrice, prompt: "0.00", keyboardType: .decimalPad)
                }

                Section(t.addEditWishlist.source) {
                    LabeledField(label: t.addEditWishlist.sourceURL, text: $sourceUrl, keyboardType: .URL)
                    LabeledField(label: t.addEditWishlist.sourceNotes, text: $sourceNotes)
                }

                Section(t.addEditWishlist.notes) {
                    LabeledTextEditor(label: t.addEditWishlist.notes, text: $notes, placeholder: t.addEditWishlist.notesPlaceholder)
                }

                Section(t.addEditWishlist.specifications) {
                    LabeledField(label: t.addEditWishlist.cpu, text: $cpu)
                    LabeledField(label: t.addEditWishlist.ram, text: $ram)
                    LabeledField(label: t.addEditWishlist.graphics, text: $graphics)
                    LabeledField(label: t.addEditWishlist.storage, text: $storage)
                    LabeledField(label: t.addEditWishlist.os, text: $operatingSystem)
                    LabeledField(label: t.addEditWishlist.externalURL, text: $externalUrl, keyboardType: .URL)
                    Toggle(t.addEditWishlist.wifiEnabled, isOn: $isWifiEnabled)
                    Toggle(t.addEditWishlist.pramRemoved, isOn: $isPramBatteryRemoved)
                }

                if isEditing {
                    Section {
                        Button {
                            showingAddDevice = true
                        } label: {
                            Label(t.addEditWishlist.markAcquired, systemImage: "checkmark.circle")
                                .foregroundColor(.green)
                        }
                    }
                }

                if let error = errorMessage {
                    Section {
                        Text(error)
                            .foregroundColor(.red)
                            .font(.caption)
                    }
                }
            }
            .navigationTitle(isEditing ? t.addEditWishlist.editTitle : t.addEditWishlist.newTitle)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button(t.common.cancel) { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button(t.common.save) {
                        Task { await save() }
                    }
                    .disabled(name.trimmingCharacters(in: .whitespaces).isEmpty || isSaving)
                }
            }
            .disabled(isSaving)
        }
        .onAppear {
            populateFields()
            Task { await loadTemplates() }
        }
        .sheet(isPresented: $showingAddDevice) {
            AddDeviceView(
                prefillName: name.isEmpty ? nil : name,
                prefillAdditionalName: additionalName.isEmpty ? nil : additionalName,
                prefillManufacturer: manufacturer.isEmpty ? nil : manufacturer,
                prefillModelNumber: modelNumber.isEmpty ? nil : modelNumber,
                prefillReleaseYear: Int(releaseYear),
                prefillCategoryId: selectedCategoryId,
                prefillCpu: cpu.isEmpty ? nil : cpu,
                prefillRam: ram.isEmpty ? nil : ram,
                prefillGraphics: graphics.isEmpty ? nil : graphics,
                prefillStorage: storage.isEmpty ? nil : storage,
                prefillOperatingSystem: operatingSystem.isEmpty ? nil : operatingSystem,
                prefillExternalUrl: externalUrl.isEmpty ? nil : externalUrl,
                prefillIsWifiEnabled: isWifiEnabled ? true : nil,
                prefillIsPramBatteryRemoved: isPramBatteryRemoved ? true : nil,
                prefillEstimatedValue: nil
            )
            .environmentObject(deviceStore)
        }
    }

    private func applyTemplate(_ template: Template) {
        selectedTemplate = template
        name = template.name
        additionalName = template.additionalName ?? ""
        manufacturer = template.manufacturer ?? ""
        modelNumber = template.modelNumber ?? ""
        releaseYear = template.releaseYear.map { String($0) } ?? ""
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

    private func populateFields() {
        guard let item = item else { return }
        name = item.name
        additionalName = item.additionalName ?? ""
        manufacturer = item.manufacturer ?? ""
        modelNumber = item.modelNumber ?? ""
        releaseYear = item.releaseYear.map { String($0) } ?? ""
        targetPrice = item.targetPrice.map { String(format: "%.2f", $0) } ?? ""
        sourceUrl = item.sourceUrl ?? ""
        sourceNotes = item.sourceNotes ?? ""
        notes = item.notes ?? ""
        priority = item.priority
        group = item.group ?? ""
        selectedCategoryId = item.categoryId
        cpu = item.cpu ?? ""
        ram = item.ram ?? ""
        graphics = item.graphics ?? ""
        storage = item.storage ?? ""
        operatingSystem = item.operatingSystem ?? ""
        externalUrl = item.externalUrl ?? ""
        isWifiEnabled = item.isWifiEnabled ?? false
        isPramBatteryRemoved = item.isPramBatteryRemoved ?? false
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

    private func save() async {
        isSaving = true
        errorMessage = nil

        let trimmedName = name.trimmingCharacters(in: .whitespaces)
        let addlName = additionalName.isEmpty ? nil : additionalName
        let mfr = manufacturer.isEmpty ? nil : manufacturer
        let model = modelNumber.isEmpty ? nil : modelNumber
        let year = Int(releaseYear)
        let price = Double(targetPrice)
        let url = sourceUrl.isEmpty ? nil : sourceUrl
        let srcNotes = sourceNotes.isEmpty ? nil : sourceNotes
        let notesTrimmed = notes.isEmpty ? nil : notes
        let grp = group.isEmpty ? nil : group
        let cpuVal = cpu.isEmpty ? nil : cpu
        let ramVal = ram.isEmpty ? nil : ram
        let gfxVal = graphics.isEmpty ? nil : graphics
        let storVal = storage.isEmpty ? nil : storage
        let osVal = operatingSystem.isEmpty ? nil : operatingSystem
        let extUrl = externalUrl.isEmpty ? nil : externalUrl

        do {
            if let existing = item {
                _ = try await DeviceService.shared.updateWishlistItem(
                    id: existing.id,
                    name: trimmedName,
                    additionalName: addlName,
                    manufacturer: mfr,
                    modelNumber: model,
                    releaseYear: year,
                    targetPrice: price,
                    sourceUrl: url,
                    sourceNotes: srcNotes,
                    notes: notesTrimmed,
                    priority: priority,
                    group: grp,
                    categoryId: selectedCategoryId,
                    cpu: cpuVal,
                    ram: ramVal,
                    graphics: gfxVal,
                    storage: storVal,
                    operatingSystem: osVal,
                    externalUrl: extUrl,
                    isWifiEnabled: isWifiEnabled ? isWifiEnabled : nil,
                    isPramBatteryRemoved: isPramBatteryRemoved ? isPramBatteryRemoved : nil
                )
            } else {
                _ = try await DeviceService.shared.createWishlistItem(
                    name: trimmedName,
                    additionalName: addlName,
                    manufacturer: mfr,
                    modelNumber: model,
                    releaseYear: year,
                    targetPrice: price,
                    sourceUrl: url,
                    sourceNotes: srcNotes,
                    notes: notesTrimmed,
                    priority: priority,
                    group: grp,
                    categoryId: selectedCategoryId,
                    cpu: cpuVal,
                    ram: ramVal,
                    graphics: gfxVal,
                    storage: storVal,
                    operatingSystem: osVal,
                    externalUrl: extUrl,
                    isWifiEnabled: isWifiEnabled ? isWifiEnabled : nil,
                    isPramBatteryRemoved: isPramBatteryRemoved ? isPramBatteryRemoved : nil
                )
            }
            onSaved()
            dismiss()
        } catch {
            errorMessage = error.localizedDescription
        }
        isSaving = false
    }
}

#Preview {
    AddEditWishlistItemView(categories: []) {}
        .environmentObject(DeviceStore())
}
