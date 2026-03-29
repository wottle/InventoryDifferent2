//
//  DeviceService.swift
//  InventoryDifferent
//
//  Created by Michael Wottle on 2/2/26.
//

import Foundation

class DeviceService {
    static let shared = DeviceService()
    private let api = APIService.shared
    
    private init() {}

    func fetchDeviceListItems(categoryId: Int? = nil, status: Status? = nil) async throws -> [DeviceListItem] {
        var whereClause = "deleted: { equals: false }"

        if let categoryId = categoryId {
            whereClause += ", category: { id: { equals: \(categoryId) } }"
        }

        if let status = status {
            whereClause += ", status: { equals: \(status.rawValue) }"
        }

        let query = """
        query GetDeviceListItems {
            devices(where: { \(whereClause) }) {
                id
                name
                additionalName
                manufacturer
                modelNumber
                serialNumber
                releaseYear
                location
                searchText
                isFavorite
                status
                functionalStatus
                condition
                rarity
                lastPowerOnDate
                isAssetTagged
                isPramBatteryRemoved
                accessories { id name }
                dateAcquired
                estimatedValue
                listPrice
                soldPrice
                soldDate
                category {
                    id
                    name
                    type
                    sortOrder
                }
                thumbnails: images {
                    id
                    path
                    thumbnailPath
                    isThumbnail
                }
            }
        }
        """

        struct Response: Decodable {
            let devices: [DeviceListItem]
        }

        let response: Response = try await api.execute(query: query)
        return response.devices
    }
    
    func fetchDevices(categoryId: Int? = nil, status: Status? = nil) async throws -> [Device] {
        var whereClause = "deleted: { equals: false }"
        
        if let categoryId = categoryId {
            whereClause += ", category: { id: { equals: \(categoryId) } }"
        }
        
        if let status = status {
            whereClause += ", status: { equals: \(status.rawValue) }"
        }
        
        let query = """
        query GetDevices {
            devices(where: { \(whereClause) }) {
                id
                name
                additionalName
                manufacturer
                modelNumber
                serialNumber
                releaseYear
                location
                info
                searchText
                isFavorite
                status
                functionalStatus
                condition
                rarity
                lastPowerOnDate
                isAssetTagged
                dateAcquired
                whereAcquired
                priceAcquired
                estimatedValue
                listPrice
                soldPrice
                soldDate
                cpu
                ram
                graphics
                storage
                operatingSystem
                isWifiEnabled
                isPramBatteryRemoved
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
                    isListingImage
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

        let response: Response = try await api.execute(query: query)
        return response.devices
    }
    
    func fetchDevice(id: Int) async throws -> Device? {
        let query = """
        query GetDevice {
            device(where: { id: \(id), deleted: { equals: false } }) {
                id
                name
                additionalName
                manufacturer
                modelNumber
                serialNumber
                releaseYear
                location
                info
                searchText
                isFavorite
                status
                functionalStatus
                condition
                rarity
                lastPowerOnDate
                isAssetTagged
                dateAcquired
                whereAcquired
                priceAcquired
                estimatedValue
                listPrice
                soldPrice
                soldDate
                cpu
                ram
                graphics
                storage
                operatingSystem
                isWifiEnabled
                isPramBatteryRemoved
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
                    isListingImage
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
            let device: Device?
        }
        
        let response: Response = try await api.execute(query: query)
        return response.device
    }
    
    func fetchValueHistory(deviceId: Int) async throws -> [ValueSnapshot] {
        let query = """
        query GetValueHistory($deviceId: Int!) {
            valueHistory(deviceId: $deviceId) {
                id
                estimatedValue
                snapshotDate
            }
        }
        """
        struct Response: Decodable {
            let valueHistory: [ValueSnapshot]
        }
        let response: Response = try await api.execute(query: query, variables: ["deviceId": deviceId])
        return response.valueHistory
    }

    func fetchCategories() async throws -> [Category] {
        let query = """
        query GetCategories {
            categories {
                id
                name
                type
                sortOrder
            }
        }
        """
        
        struct Response: Decodable {
            let categories: [Category]
        }
        
        let response: Response = try await api.execute(query: query)
        return response.categories
    }
    
    func fetchMaintenanceTaskLabels() async throws -> [String] {
        let query = """
        query GetMaintenanceTaskLabels {
            maintenanceTaskLabels
        }
        """
        
        struct Response: Decodable {
            let maintenanceTaskLabels: [String]
        }
        
        let response: Response = try await api.execute(query: query)
        return response.maintenanceTaskLabels
    }
    
    func createMaintenanceTask(deviceId: Int, label: String, dateCompleted: String, notes: String?, cost: Double?) async throws -> MaintenanceTask {
        let mutation = """
        mutation CreateMaintenanceTask($input: MaintenanceTaskCreateInput!) {
            createMaintenanceTask(input: $input) {
                id
                label
                dateCompleted
                notes
                cost
            }
        }
        """

        var input: [String: Any] = [
            "deviceId": deviceId,
            "label": label,
            "dateCompleted": dateCompleted
        ]

        if let notes = notes {
            input["notes"] = notes
        }
        if let cost = cost {
            input["cost"] = cost
        }

        let variables: [String: Any] = ["input": input]
        
        struct Response: Decodable {
            let createMaintenanceTask: MaintenanceTask
        }
        
        let response: Response = try await api.execute(query: mutation, variables: variables)
        return response.createMaintenanceTask
    }
    
    func deleteMaintenanceTask(id: Int) async throws -> Bool {
        let mutation = """
        mutation DeleteMaintenanceTask($id: Int!) {
            deleteMaintenanceTask(id: $id)
        }
        """
        
        let variables: [String: Any] = ["id": id]
        
        struct Response: Decodable {
            let deleteMaintenanceTask: Bool
        }
        
        let response: Response = try await api.execute(query: mutation, variables: variables)
        return response.deleteMaintenanceTask
    }
    
    func createNote(deviceId: Int, content: String, date: String) async throws -> Note {
        let mutation = """
        mutation CreateNote($input: NoteCreateInput!) {
            createNote(input: $input) {
                id
                content
                date
            }
        }
        """
        
        let input: [String: Any] = [
            "deviceId": deviceId,
            "content": content,
            "date": date
        ]
        
        let variables: [String: Any] = ["input": input]
        
        struct Response: Decodable {
            let createNote: Note
        }
        
        let response: Response = try await api.execute(query: mutation, variables: variables)
        return response.createNote
    }
    
    func updateNote(id: Int, content: String, date: String) async throws -> Note {
        let mutation = """
        mutation UpdateNote($input: NoteUpdateInput!) {
            updateNote(input: $input) {
                id
                content
                date
            }
        }
        """
        
        let input: [String: Any] = [
            "id": id,
            "content": content,
            "date": date
        ]
        
        let variables: [String: Any] = ["input": input]
        
        struct Response: Decodable {
            let updateNote: Note
        }
        
        let response: Response = try await api.execute(query: mutation, variables: variables)
        return response.updateNote
    }
    
    func deleteNote(id: Int) async throws -> Bool {
        let mutation = """
        mutation DeleteNote($id: Int!) {
            deleteNote(id: $id)
        }
        """
        
        let variables: [String: Any] = ["id": id]
        
        struct Response: Decodable {
            let deleteNote: Bool
        }
        
        let response: Response = try await api.execute(query: mutation, variables: variables)
        return response.deleteNote
    }
    
    func updateDevice(id: Int, input: [String: Any]) async throws -> Device {
        let mutation = """
        mutation UpdateDevice($input: DeviceUpdateInput!) {
            updateDevice(input: $input) {
                id
                name
                additionalName
                manufacturer
                modelNumber
                serialNumber
                releaseYear
                location
                info
                searchText
                isFavorite
                status
                functionalStatus
                condition
                rarity
                lastPowerOnDate
                isAssetTagged
                dateAcquired
                whereAcquired
                priceAcquired
                estimatedValue
                listPrice
                soldPrice
                soldDate
                cpu
                ram
                graphics
                storage
                operatingSystem
                isWifiEnabled
                isPramBatteryRemoved
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
                    isListingImage
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
        
        var deviceInput = input
        deviceInput["id"] = id
        
        let variables: [String: Any] = ["input": deviceInput]
        
        struct Response: Decodable {
            let updateDevice: Device
        }
        
        let response: Response = try await api.execute(query: mutation, variables: variables)
        return response.updateDevice
    }
    
    func deleteDevice(id: Int) async throws -> Bool {
        let mutation = """
        mutation DeleteDevice($id: Int!) {
            deleteDevice(id: $id)
        }
        """
        
        let variables: [String: Any] = ["id": id]
        
        struct Response: Decodable {
            let deleteDevice: Bool
        }
        
        let response: Response = try await api.execute(query: mutation, variables: variables)
        return response.deleteDevice
    }
    
    func updateImage(id: Int, isThumbnail: Bool? = nil, isShopImage: Bool? = nil, isListingImage: Bool? = nil) async throws -> DeviceImage {
        let mutation = """
        mutation UpdateImage($input: ImageUpdateInput!) {
            updateImage(input: $input) {
                id
                path
                thumbnailPath
                dateTaken
                caption
                isShopImage
                isThumbnail
                isListingImage
            }
        }
        """
        
        var input: [String: Any] = ["id": id]
        
        if let isThumbnail = isThumbnail {
            input["isThumbnail"] = isThumbnail
        }
        if let isShopImage = isShopImage {
            input["isShopImage"] = isShopImage
        }
        if let isListingImage = isListingImage {
            input["isListingImage"] = isListingImage
        }
        
        let variables: [String: Any] = ["input": input]
        
        struct Response: Decodable {
            let updateImage: DeviceImage
        }
        
        let response: Response = try await api.execute(query: mutation, variables: variables)
        return response.updateImage
    }
    
    func deleteImage(id: Int) async throws -> Bool {
        let mutation = """
        mutation DeleteImage($id: Int!) {
            deleteImage(id: $id)
        }
        """
        
        let variables: [String: Any] = ["id": id]
        
        struct Response: Decodable {
            let deleteImage: Bool
        }
        
        let response: Response = try await api.execute(query: mutation, variables: variables)
        return response.deleteImage
    }
    
    func uploadImage(deviceId: Int, imageData: Data) async throws -> DeviceImage {
        // Step 1: Upload file to /upload endpoint
        let boundary = UUID().uuidString
        var uploadRequest = URLRequest(url: URL(string: "\(api.getBaseURL())/upload?deviceId=\(deviceId)")!)
        uploadRequest.httpMethod = "POST"
        uploadRequest.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")

        // Add Authorization header if we have a token
        if let token = await AuthService.shared.getAccessToken() {
            uploadRequest.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        var body = Data()
        body.append("--\(boundary)\r\n".data(using: .utf8)!)
        body.append("Content-Disposition: form-data; name=\"image\"; filename=\"image.jpg\"\r\n".data(using: .utf8)!)
        body.append("Content-Type: image/jpeg\r\n\r\n".data(using: .utf8)!)
        body.append(imageData)
        body.append("\r\n".data(using: .utf8)!)
        body.append("--\(boundary)--\r\n".data(using: .utf8)!)
        
        uploadRequest.httpBody = body
        
        let (uploadData, uploadResponse) = try await URLSession.shared.data(for: uploadRequest)
        
        guard let httpResponse = uploadResponse as? HTTPURLResponse,
              (200...299).contains(httpResponse.statusCode) else {
            throw NSError(domain: "DeviceService", code: -1, userInfo: [NSLocalizedDescriptionKey: "Failed to upload file"])
        }
        
        struct FileUploadResponse: Codable {
            let path: String
        }
        
        let fileResponse = try JSONDecoder().decode(FileUploadResponse.self, from: uploadData)
        
        // Step 2: Create image record via GraphQL
        let mutation = """
        mutation CreateImage($input: ImageCreateInput!) {
            createImage(input: $input) {
                id
                path
                thumbnailPath
                dateTaken
                caption
                isShopImage
                isThumbnail
                isListingImage
            }
        }
        """
        
        let input: [String: Any] = [
            "deviceId": deviceId,
            "path": fileResponse.path,
            "isThumbnail": false,
            "isShopImage": false
        ]
        
        let variables: [String: Any] = ["input": input]
        
        struct Response: Decodable {
            let createImage: DeviceImage
        }
        
        let response: Response = try await api.execute(query: mutation, variables: variables)
        return response.createImage
    }

    struct GenerateImageConfig: Decodable {
        let enabled: Bool
        let defaultPrompt: String?
    }

    func fetchGenerateImageConfig() async throws -> GenerateImageConfig {
        guard let url = URL(string: "\(api.getBaseURL())/generate-image/config") else {
            throw APIError.invalidURL
        }
        let (data, _) = try await URLSession.shared.data(from: url)
        return try JSONDecoder().decode(GenerateImageConfig.self, from: data)
    }

    func checkOpenAIEnabled() async -> Bool {
        return (try? await fetchGenerateImageConfig())?.enabled ?? false
    }

    func saveDefaultImagePrompt(_ prompt: String) async throws {
        let mutation = """
        mutation SetSystemSetting($key: String!, $value: String!) {
            setSystemSetting(key: $key, value: $value)
        }
        """
        struct SetSystemSettingData: Decodable {
            let setSystemSetting: Bool
        }
        let _: SetSystemSettingData = try await api.execute(query: mutation, variables: ["key": "imagePrompt", "value": prompt])
    }

    func generateImage(
        deviceId: Int,
        sourceImageId: Int?,
        prompt: String,
        assignAsThumbnail: Bool,
        assignAsShopImage: Bool,
        assignAsListingImage: Bool
    ) async throws -> DeviceImage {
        guard let url = URL(string: "\(api.getBaseURL())/generate-image") else {
            throw APIError.invalidURL
        }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        if let token = await AuthService.shared.getAccessToken() {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        var body: [String: Any] = [
            "deviceId": deviceId,
            "prompt": prompt,
            "assignAsThumbnail": assignAsThumbnail,
            "assignAsShopImage": assignAsShopImage,
            "assignAsListingImage": assignAsListingImage
        ]
        if let sourceImageId = sourceImageId {
            body["sourceImageId"] = sourceImageId
        }

        request.httpBody = try JSONSerialization.data(withJSONObject: body)

        let (data, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse,
              (200...299).contains(httpResponse.statusCode) else {
            struct ErrorResponse: Decodable { let error: String }
            if let errorResponse = try? JSONDecoder().decode(ErrorResponse.self, from: data) {
                throw NSError(domain: "DeviceService", code: -1,
                              userInfo: [NSLocalizedDescriptionKey: errorResponse.error])
            }
            throw APIError.invalidResponse
        }

        return try JSONDecoder().decode(DeviceImage.self, from: data)
    }

    func fetchAllTags() async throws -> [Tag] {
        let query = """
        query GetTags {
            tags {
                id
                name
            }
        }
        """

        struct Response: Decodable {
            let tags: [Tag]
        }

        let response: Response = try await api.execute(query: query)
        return response.tags
    }

    func addDeviceTag(deviceId: Int, tagName: String) async throws -> Device {
        let mutation = """
        mutation AddDeviceTag($deviceId: Int!, $tagName: String!) {
            addDeviceTag(deviceId: $deviceId, tagName: $tagName) {
                id
                name
                additionalName
                manufacturer
                modelNumber
                serialNumber
                releaseYear
                location
                info
                searchText
                isFavorite
                status
                functionalStatus
                condition
                rarity
                lastPowerOnDate
                isAssetTagged
                dateAcquired
                whereAcquired
                priceAcquired
                estimatedValue
                listPrice
                soldPrice
                soldDate
                cpu
                ram
                graphics
                storage
                operatingSystem
                isWifiEnabled
                isPramBatteryRemoved
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
                    isListingImage
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

        let variables: [String: Any] = ["deviceId": deviceId, "tagName": tagName]

        struct Response: Decodable {
            let addDeviceTag: Device
        }

        let response: Response = try await api.execute(query: mutation, variables: variables)
        return response.addDeviceTag
    }

    func fetchCustomFields() async throws -> [CustomField] {
        let query = """
        query GetCustomFields {
            customFields {
                id
                name
                isPublic
                sortOrder
            }
        }
        """

        struct Response: Decodable {
            let customFields: [CustomField]
        }

        let response: Response = try await api.execute(query: query)
        return response.customFields
    }

    func setCustomFieldValue(deviceId: Int, customFieldId: Int, value: String) async throws -> CustomFieldValue {
        let mutation = """
        mutation SetCustomFieldValue($input: SetCustomFieldValueInput!) {
            setCustomFieldValue(input: $input) {
                id
                customFieldId
                customFieldName
                value
                isPublic
            }
        }
        """

        let input: [String: Any] = [
            "deviceId": deviceId,
            "customFieldId": customFieldId,
            "value": value
        ]

        let variables: [String: Any] = ["input": input]

        struct Response: Decodable {
            let setCustomFieldValue: CustomFieldValue
        }

        let response: Response = try await api.execute(query: mutation, variables: variables)
        return response.setCustomFieldValue
    }

    func removeCustomFieldValue(deviceId: Int, customFieldId: Int) async throws -> Bool {
        let mutation = """
        mutation RemoveCustomFieldValue($deviceId: Int!, $customFieldId: Int!) {
            removeCustomFieldValue(deviceId: $deviceId, customFieldId: $customFieldId)
        }
        """

        let variables: [String: Any] = ["deviceId": deviceId, "customFieldId": customFieldId]

        struct Response: Decodable {
            let removeCustomFieldValue: Bool
        }

        let response: Response = try await api.execute(query: mutation, variables: variables)
        return response.removeCustomFieldValue
    }

    func removeDeviceTag(deviceId: Int, tagId: Int) async throws -> Device {
        let mutation = """
        mutation RemoveDeviceTag($deviceId: Int!, $tagId: Int!) {
            removeDeviceTag(deviceId: $deviceId, tagId: $tagId) {
                id
                name
                additionalName
                manufacturer
                modelNumber
                serialNumber
                releaseYear
                location
                info
                searchText
                isFavorite
                status
                functionalStatus
                condition
                rarity
                lastPowerOnDate
                isAssetTagged
                dateAcquired
                whereAcquired
                priceAcquired
                estimatedValue
                listPrice
                soldPrice
                soldDate
                cpu
                ram
                graphics
                storage
                operatingSystem
                isWifiEnabled
                isPramBatteryRemoved
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
                    isListingImage
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

        let variables: [String: Any] = ["deviceId": deviceId, "tagId": tagId]

        struct Response: Decodable {
            let removeDeviceTag: Device
        }

        let response: Response = try await api.execute(query: mutation, variables: variables)
        return response.removeDeviceTag
    }

    // MARK: - Wishlist

    func fetchWishlistItems() async throws -> [WishlistItem] {
        let query = """
        query GetWishlistItems {
            wishlistItems(where: { deleted: false }) {
                id
                name
                additionalName
                manufacturer
                modelNumber
                releaseYear
                targetPrice
                sourceUrl
                sourceNotes
                notes
                priority
                group
                deleted
                createdAt
                categoryId
                cpu
                ram
                graphics
                storage
                operatingSystem
                externalUrl
                isWifiEnabled
                isPramBatteryRemoved
                category {
                    id
                    name
                    type
                }
            }
        }
        """

        struct Response: Decodable {
            let wishlistItems: [WishlistItem]
        }

        let response: Response = try await api.execute(query: query)
        return response.wishlistItems
    }

    func createWishlistItem(
        name: String,
        additionalName: String?,
        manufacturer: String?,
        modelNumber: String?,
        releaseYear: Int?,
        targetPrice: Double?,
        sourceUrl: String?,
        sourceNotes: String?,
        notes: String?,
        priority: Int,
        group: String?,
        categoryId: Int?,
        cpu: String?,
        ram: String?,
        graphics: String?,
        storage: String?,
        operatingSystem: String?,
        externalUrl: String?,
        isWifiEnabled: Bool?,
        isPramBatteryRemoved: Bool?
    ) async throws -> WishlistItem {
        let mutation = """
        mutation CreateWishlistItem($data: WishlistItemCreateInput!) {
            createWishlistItem(data: $data) {
                id
                name
                additionalName
                manufacturer
                modelNumber
                releaseYear
                targetPrice
                sourceUrl
                sourceNotes
                notes
                priority
                group
                deleted
                createdAt
                categoryId
                cpu
                ram
                graphics
                storage
                operatingSystem
                externalUrl
                isWifiEnabled
                isPramBatteryRemoved
                category {
                    id
                    name
                    type
                }
            }
        }
        """

        var data: [String: Any] = ["name": name, "priority": priority]
        if let v = additionalName { data["additionalName"] = v }
        if let v = manufacturer { data["manufacturer"] = v }
        if let v = modelNumber { data["modelNumber"] = v }
        if let v = releaseYear { data["releaseYear"] = v }
        if let v = targetPrice { data["targetPrice"] = v }
        if let v = sourceUrl { data["sourceUrl"] = v }
        if let v = sourceNotes { data["sourceNotes"] = v }
        if let v = notes { data["notes"] = v }
        if let v = group { data["group"] = v }
        if let v = categoryId { data["categoryId"] = v }
        if let v = cpu { data["cpu"] = v }
        if let v = ram { data["ram"] = v }
        if let v = graphics { data["graphics"] = v }
        if let v = storage { data["storage"] = v }
        if let v = operatingSystem { data["operatingSystem"] = v }
        if let v = externalUrl { data["externalUrl"] = v }
        if let v = isWifiEnabled { data["isWifiEnabled"] = v }
        if let v = isPramBatteryRemoved { data["isPramBatteryRemoved"] = v }

        let variables: [String: Any] = ["data": data]

        struct Response: Decodable {
            let createWishlistItem: WishlistItem
        }

        let response: Response = try await api.execute(query: mutation, variables: variables)
        return response.createWishlistItem
    }

    func updateWishlistItem(
        id: Int,
        name: String?,
        additionalName: String?,
        manufacturer: String?,
        modelNumber: String?,
        releaseYear: Int?,
        targetPrice: Double?,
        sourceUrl: String?,
        sourceNotes: String?,
        notes: String?,
        priority: Int?,
        group: String?,
        categoryId: Int?,
        cpu: String?,
        ram: String?,
        graphics: String?,
        storage: String?,
        operatingSystem: String?,
        externalUrl: String?,
        isWifiEnabled: Bool?,
        isPramBatteryRemoved: Bool?
    ) async throws -> WishlistItem {
        let mutation = """
        mutation UpdateWishlistItem($id: Int!, $data: WishlistItemUpdateInput!) {
            updateWishlistItem(id: $id, data: $data) {
                id
                name
                additionalName
                manufacturer
                modelNumber
                releaseYear
                targetPrice
                sourceUrl
                sourceNotes
                notes
                priority
                group
                deleted
                createdAt
                categoryId
                cpu
                ram
                graphics
                storage
                operatingSystem
                externalUrl
                isWifiEnabled
                isPramBatteryRemoved
                category {
                    id
                    name
                    type
                }
            }
        }
        """

        var data: [String: Any] = [:]
        if let v = name { data["name"] = v }
        if let v = additionalName { data["additionalName"] = v }
        if let v = manufacturer { data["manufacturer"] = v }
        if let v = modelNumber { data["modelNumber"] = v }
        if let v = releaseYear { data["releaseYear"] = v }
        if let v = targetPrice { data["targetPrice"] = v }
        if let v = sourceUrl { data["sourceUrl"] = v }
        if let v = sourceNotes { data["sourceNotes"] = v }
        if let v = notes { data["notes"] = v }
        if let v = priority { data["priority"] = v }
        if let v = group { data["group"] = v }
        if let v = categoryId { data["categoryId"] = v }
        if let v = cpu { data["cpu"] = v }
        if let v = ram { data["ram"] = v }
        if let v = graphics { data["graphics"] = v }
        if let v = storage { data["storage"] = v }
        if let v = operatingSystem { data["operatingSystem"] = v }
        if let v = externalUrl { data["externalUrl"] = v }
        if let v = isWifiEnabled { data["isWifiEnabled"] = v }
        if let v = isPramBatteryRemoved { data["isPramBatteryRemoved"] = v }

        let variables: [String: Any] = ["id": id, "data": data]

        struct Response: Decodable {
            let updateWishlistItem: WishlistItem
        }

        let response: Response = try await api.execute(query: mutation, variables: variables)
        return response.updateWishlistItem
    }

    func addDeviceAccessory(deviceId: Int, name: String) async throws -> DeviceAccessory {
        let mutation = """
        mutation {
            addDeviceAccessory(deviceId: \(deviceId), name: "\(name.replacingOccurrences(of: "\"", with: "\\\""))") {
                id
                name
            }
        }
        """

        struct Response: Decodable {
            let addDeviceAccessory: DeviceAccessory
        }

        let response: Response = try await api.execute(query: mutation)
        return response.addDeviceAccessory
    }

    func removeDeviceAccessory(id: Int) async throws {
        let mutation = """
        mutation {
            removeDeviceAccessory(id: \(id))
        }
        """

        struct Response: Decodable {
            let removeDeviceAccessory: Bool
        }

        let _: Response = try await api.execute(query: mutation)
    }

    func addDeviceLink(deviceId: Int, label: String, url: String) async throws -> DeviceLink {
        let safeLabel = label.replacingOccurrences(of: "\"", with: "\\\"")
        let safeUrl = url.replacingOccurrences(of: "\"", with: "\\\"")
        let mutation = """
        mutation {
            addDeviceLink(deviceId: \(deviceId), label: "\(safeLabel)", url: "\(safeUrl)") {
                id
                label
                url
            }
        }
        """

        struct Response: Decodable {
            let addDeviceLink: DeviceLink
        }

        let response: Response = try await api.execute(query: mutation)
        return response.addDeviceLink
    }

    func removeDeviceLink(id: Int) async throws {
        let mutation = """
        mutation {
            removeDeviceLink(id: \(id))
        }
        """

        struct Response: Decodable {
            let removeDeviceLink: Bool
        }

        let _: Response = try await api.execute(query: mutation)
    }

    func deleteWishlistItem(id: Int) async throws -> WishlistItem {
        let mutation = """
        mutation DeleteWishlistItem($id: Int!) {
            deleteWishlistItem(id: $id) {
                id
                name
                manufacturer
                modelNumber
                releaseYear
                targetPrice
                sourceUrl
                sourceNotes
                notes
                priority
                group
                deleted
                createdAt
                categoryId
            }
        }
        """

        let variables: [String: Any] = ["id": id]

        struct Response: Decodable {
            let deleteWishlistItem: WishlistItem
        }

        let response: Response = try await api.execute(query: mutation, variables: variables)
        return response.deleteWishlistItem
    }
}
