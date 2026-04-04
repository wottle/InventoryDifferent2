// Translations.swift — string key definitions for all supported languages.

struct Translations {

    // MARK: - Enum display names

    struct StatusT {
        let COLLECTION, FOR_SALE, PENDING_SALE, IN_REPAIR, SOLD, DONATED, RETURNED: String
    }
    struct FunctionalStatusT {
        let YES, PARTIAL, NO: String
    }
    struct ConditionT {
        let NEW, LIKE_NEW, VERY_GOOD, GOOD, ACCEPTABLE, FOR_PARTS: String
    }
    struct RarityT {
        let COMMON, UNCOMMON, RARE, VERY_RARE, EXTREMELY_RARE: String
    }
    struct PriorityT {
        let high, medium, low: String
    }

    // MARK: - Shared UI

    struct CommonT {
        let cancel, save, delete, edit, add, retry, done, ok: String
        let copy, copied: String
        let loading, error, noData: String
        let currencySymbol: String
        let yes, no: String
    }

    // MARK: - Menu

    struct MenuT {
        let wishlist, financials, stats, timeline, chat: String
        let logOut, logIn, logOutTitle, logOutMessage: String
    }

    // MARK: - Device List

    struct DeviceListT {
        let title, loading, errorLoading: String
        let searchPlaceholder: String
        let noDevices, noDevicesFilter, noDevicesFound: String
        let clearFilters, scanBarcode: String
        let estValue, forSale, pending, sold, donated, inRepair, returned: String
        let na, tbd: String
    }

    // MARK: - Device Detail

    struct DeviceDetailT {
        let loading, errorLoading, notFound: String
        let done, manage: String
        let tabDetails, tabPhotos, tabTasks, tabNotes: String
        let quickActions, unfavorite, favorite: String
        let addPhoto, addTask, addNote: String
        let poweredOnToday, markForSale, markPending, markSold, deleteDevice, deleteDeviceMsg: String
        let deleteImage, deleteImageMsg: String
        let setThumbnail, replaceBothModes, setLightThumbnail, setDarkThumbnail, thumbnailChoiceMsg: String
        let removeTag, removeTagFmt: String  // removeTagFmt: "Remove the tag \"%@\" from this device?"
        let tags, noTags: String
        let functionalStatus, rarity, estimatedValue, pramRemoved: String
        let noAccessories, noLinks: String
        let noPhotos: String
        let maintenanceTasks, noTasks: String
        let notes, noNotes: String
        let deleteTask, deleteNote: String
        let valueHistory: String
        // Additional keys for DeviceDetailView
        let deleteDeviceMessage, deleteImageMessage, chooseThumbnailMessage: String
        let setLightMode, setDarkMode: String
        let deleteTaskConfirm, deleteNoteConfirm: String
        let basicInformation, deviceId, modelNumber, serialNumber, releaseYear, location, condition: String
        let lastUsedDate, acquisitionAndValue, dateAcquired, whereAcquired, priceAcquired: String
        let sales, listPrice, soldPrice, soldDate: String
        let donated, donatedDate, repair, returnedDate, repairFeeCharged: String
        let computerSpecs, cpu, ram, graphics, storage, operatingSystem, wifiEnabled, pramBatteryRemoved: String
        let customFields, additionalInfo, accessories, addAccessory, referenceLinks: String
        let noPhotosMessage, noTasksMessage, noNotesMessage: String
    }

    // MARK: - Add / Edit Device

    struct AddEditDeviceT {
        let addTitle, editTitle: String
        let saveFailed: String
        let searchTemplates, templateOptional, templateApplied, noTemplates: String
        let basicInformation: String
        let name, additionalName, manufacturer, modelNumber, serialNumber: String
        let releaseYear, location, category, selectCategory, info: String
        let status, functionalStatus, condition, notSet, rarity: String
        let flags, favorite, assetTagged: String
        let accessories, noAccessoriesYet, addAccessory: String
        let noAccessoriesRecorded: String
        let referenceLinks, noLinksYet, addLink: String
        let noLinksRecorded: String
        let acquisitionValue, dateAcquired, setDateAcquired, clearDateAcquired: String
        let whereAcquired, priceAcquired, estimatedValue: String
        let sales, listPrice, soldPrice, soldDate, setSoldDate, clearSoldDate: String
        let donatedDate, setDonatedDate, clearDonatedDate, donationInformation: String
        let repair: String
        let repairInformation, repairFeeCharged, returnedDate, setReturnedDate, clearReturnedDate: String
        let computerSpecs, cpu, ram, graphics, storage, os: String
        let wifiEnabled, pramRemoved: String
        let lastPowerOn, setLastPowerOn, clearLastPowerOn: String
        let customFields: String
        let accessorySuggestions, accessoryCustom, accessoryNamePlaceholder: String
        let linkDetails, linkLabelPlaceholder, linkURLPlaceholder: String
    }

    // MARK: - Financials

    struct FinancialsT {
        let title, loading, errorLoading: String
        let spent, received, netCash, estValue, maintenance, netPosition, profit: String
        let valueOverTime, notEnoughData: String
        let cumulativeCash, cumulativeValue, netPositionLine, zero: String
        let summary, transactionHistory, transactions, noTransactions: String
        let amount, cumNet: String
        let totalSpent, totalReceived, estimatedValueOwned, maintenanceCosts: String
        let realizedProfit: String
        let txSold, txDonated, txMaintenance, txRepairFee, txAcquired: String
    }

    // MARK: - Stats

    struct StatsT {
        let title, loading, errorLoading: String
        let atAGlance, totalDevices, working, avgEstValue, topCategory: String
        let byStatus, byCondition, byCategoryType, byRarity: String
        let acquiredPerYear, byReleaseEra, topManufacturers, noData: String
        let chartLabel, chartCount, chartManufacturer, chartRarity: String
    }

    // MARK: - Wishlist

    struct WishlistT {
        let title, loading, errorLoading: String
        let emptyTitle, emptyMessage: String
        let delete, other: String
    }

    // MARK: - Add / Edit Wishlist Item

    struct AddEditWishlistT {
        let newTitle, editTitle: String
        let searchTemplates, templateOptional, templateApplied, noTemplates: String
        let basicInfo, name, additionalName, manufacturer, modelNumber, releaseYear: String
        let details, priority: String
        let category, none_, group, targetPrice: String
        let source, sourceURL, sourceNotes: String
        let notes, notesPlaceholder: String
        let specifications, cpu, ram, graphics, storage, os, externalURL: String
        let wifiEnabled, pramRemoved: String
        let markAcquired: String
    }

    // MARK: - Login / Server Setup

    struct LoginT {
        let appName, connectTitle: String
        let serverURL, serverURLPlaceholder: String
        let usernameOptional, username: String
        let passwordOptional, password: String
        let connect, connecting, guestHint: String
        let couldNotConnect, connectionFailed: String
        let setupTitle, welcomeTitle, enterURLHint, setupURLPlaceholder: String
    }

    // MARK: - Chat

    struct ChatT {
        let title, thinking, listening, speaking: String
        let tapMicStop, placeholder: String
        let welcomeMessage: String
    }

    // MARK: - Share

    struct ShareT {
        let title, done, shareLink, assetTag, deviceLink: String
        let copy, copied, shareVia, shareViaSheet: String
        let assetTagPreview, labelOptimized: String
        let savedToPhotos, saveToPhotos, shareAssetTag: String
        let idPrefix: String
    }

    // MARK: - Filter

    struct FilterT {
        let title, category, allCategories, status: String
        let other, favoritesOnly, clearAll, done: String
    }

    // MARK: - Image Management

    struct ImageManagementT {
        let title, done, imageSettings: String
        let setThumbnail, removeFromShop, addToShop, setListingImage: String
        let deleteImage, deleteTitle, deleteMessage: String
    }

    // MARK: - Add Note / Edit Note

    struct NoteT {
        let addTitle, editTitle: String
        let dateTime, content, placeholder: String
    }

    // MARK: - Add Maintenance Task

    struct MaintenanceT {
        let addTitle: String
        let taskInfo, label, dateCompleted, cost, notes, notesPlaceholder: String
    }

    // MARK: - Add Tag

    struct TagT {
        let addTitle, tagNamePlaceholder: String
        let newTagHeader, currentTagsHeader, availableTagsHeader: String
    }

    // MARK: - Image Upload

    struct ImageUploadT {
        let title, cancel: String
        let selectPhotos, chooseHint: String
        let uploadingFmt: String    // "Uploading %d%%"
        let selectedFmt: String     // "%d photo(s) selected"
        let uploadButton: String
    }

    // MARK: - Generate Image

    struct GenerateImageT {
        let referencePhoto: String
    }

    // MARK: - Barcode Scanner

    struct BarcodeScannerT {
        let lookingUp: String
    }

    // MARK: - Timeline

    struct TimelineT {
        let title, loading, errorLoading: String
    }

    // MARK: - Sort Options

    struct SortT {
        let title, sortBy, direction: String
    }

    // MARK: - Settings (in-app label for Settings app entry)

    struct SettingsT {
        let languageLabel, system_, english, german: String
    }

    // MARK: - Root

    let status: StatusT
    let functionalStatus: FunctionalStatusT
    let condition: ConditionT
    let rarity: RarityT
    let priority: PriorityT
    let common: CommonT
    let menu: MenuT
    let deviceList: DeviceListT
    let deviceDetail: DeviceDetailT
    let addEditDevice: AddEditDeviceT
    let financials: FinancialsT
    let stats: StatsT
    let wishlist: WishlistT
    let addEditWishlist: AddEditWishlistT
    let login: LoginT
    let chat: ChatT
    let share: ShareT
    let filter: FilterT
    let imageManagement: ImageManagementT
    let note: NoteT
    let maintenance: MaintenanceT
    let tag: TagT
    let imageUpload: ImageUploadT
    let generateImage: GenerateImageT
    let barcodeScanner: BarcodeScannerT
    let timeline: TimelineT
    let sort: SortT
    let settings: SettingsT
}
