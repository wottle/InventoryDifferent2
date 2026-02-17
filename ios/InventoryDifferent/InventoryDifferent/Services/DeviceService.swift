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
                lastPowerOnDate
                hasOriginalBox
                isAssetTagged
                isPramBatteryRemoved
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
                lastPowerOnDate
                hasOriginalBox
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
                externalUrl
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
                }
                tags {
                    id
                    name
                }
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
                lastPowerOnDate
                hasOriginalBox
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
                externalUrl
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
                }
                tags {
                    id
                    name
                }
            }
        }
        """
        
        struct Response: Decodable {
            let device: Device?
        }
        
        let response: Response = try await api.execute(query: query)
        return response.device
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
    
    func createMaintenanceTask(deviceId: Int, label: String, dateCompleted: String, notes: String?) async throws -> MaintenanceTask {
        let mutation = """
        mutation CreateMaintenanceTask($input: MaintenanceTaskCreateInput!) {
            createMaintenanceTask(input: $input) {
                id
                label
                dateCompleted
                notes
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
                lastPowerOnDate
                hasOriginalBox
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
                externalUrl
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
                }
                tags {
                    id
                    name
                }
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
                lastPowerOnDate
                hasOriginalBox
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
                externalUrl
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
                }
                tags {
                    id
                    name
                }
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
                lastPowerOnDate
                hasOriginalBox
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
                externalUrl
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
                }
                tags {
                    id
                    name
                }
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
}
