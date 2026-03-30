import gql from 'graphql-tag';

export const typeDefs = gql`
  scalar DateTime

  enum Status {
    COLLECTION
    FOR_SALE
    PENDING_SALE
    SOLD
    DONATED
    IN_REPAIR
    RETURNED
  }

  enum FunctionalStatus {
    YES
    PARTIAL
    NO
  }

  enum Condition {
    NEW
    LIKE_NEW
    VERY_GOOD
    GOOD
    ACCEPTABLE
    FOR_PARTS
  }

  enum Rarity {
    COMMON
    UNCOMMON
    RARE
    VERY_RARE
    EXTREMELY_RARE
  }

  enum TransactionType {
    ACQUISITION
    SALE
    DONATION
    MAINTENANCE
    REPAIR_RETURN
  }

  type Device {
    id: Int!
    name: String!
    additionalName: String
    manufacturer: String
    modelNumber: String
    serialNumber: String
    releaseYear: Int
    location: String
    info: String
    searchText: String
    isFavorite: Boolean!
    
    status: Status!
    functionalStatus: FunctionalStatus!
    condition: Condition
    rarity: Rarity
    lastPowerOnDate: DateTime
    hasOriginalBox: Boolean!
    isAssetTagged: Boolean!
    
    dateAcquired: DateTime
    whereAcquired: String
    priceAcquired: Float
    estimatedValue: Float
    
    listPrice: Float
    soldPrice: Float
    soldDate: DateTime
    
    cpu: String
    ram: String
    graphics: String
    storage: String
    operatingSystem: String
    isWifiEnabled: Boolean
    isPramBatteryRemoved: Boolean
    
    externalUrl: String
    
    popularity: Float

    category: Category!
    images: [Image!]!
    notes: [Note!]!
    maintenanceTasks: [MaintenanceTask!]!
    tags: [Tag!]!
    customFieldValues: [CustomFieldValue!]!
    accessories: [DeviceAccessory!]!
    links: [DeviceLink!]!
  }

  type DeviceAccessory {
    id: Int!
    deviceId: Int!
    name: String!
    createdAt: String!
  }

  type DeviceLink {
    id: Int!
    deviceId: Int!
    label: String!
    url: String!
    createdAt: String!
  }

  type Category {
    id: Int!
    name: String!
    type: String!
    sortOrder: Int!
    devices: [Device!]!
  }

  type Image {
    id: Int!
    path: String!
    thumbnailPath: String
    dateTaken: DateTime!
    caption: String
    isShopImage: Boolean!
    isThumbnail: Boolean!
    isListingImage: Boolean!
  }

  type Note {
    id: Int!
    content: String!
    date: DateTime!
  }

  type MaintenanceTask {
    id: Int!
    label: String!
    dateCompleted: DateTime!
    notes: String
    cost: Float
  }

  type Tag {
    id: Int!
    name: String!
  }

  type CustomField {
    id: Int!
    name: String!
    isPublic: Boolean!
    sortOrder: Int!
  }

  type CustomFieldValue {
    id: Int!
    customFieldId: Int!
    customFieldName: String!
    value: String!
    isPublic: Boolean!
    sortOrder: Int!
  }

  type Template {
    id: Int!
    name: String!
    additionalName: String
    manufacturer: String
    modelNumber: String
    releaseYear: Int
    estimatedValue: Float
    cpu: String
    ram: String
    graphics: String
    storage: String
    operatingSystem: String
    externalUrl: String
    isWifiEnabled: Boolean
    isPramBatteryRemoved: Boolean
    rarity: Rarity
    categoryId: Int!
    category: Category!
  }

  type FinancialOverview {
    totalSpent: Float!
    totalReceived: Float!
    netCash: Float!
    estimatedValueOwned: Float!
    netPosition: Float!
    totalProfit: Float!
    totalMaintenanceCost: Float!
  }

  type FinancialTransaction {
    type: TransactionType!
    deviceId: Int!
    deviceName: String!
    additionalName: String
    date: DateTime
    amount: Float!
    estimatedValue: Float!
    label: String
  }

  type SystemUsage {
    deviceCount: Int!
    noteCount: Int!
    taskCount: Int!
    imageCount: Int!
    categoryCount: Int!
    templateCount: Int!
    tagCount: Int!
    totalStorageBytes: Float!
  }

  type ValueSnapshot {
    id: Int!
    deviceId: Int!
    estimatedValue: Float
    snapshotDate: DateTime!
  }

  type TimelineEvent {
    id:          Int!
    year:        Int!
    title:       String!
    description: String!
    type:        String!
    sortOrder:   Int!
  }

  type WishlistItem {
    id: Int!
    name: String!
    additionalName: String
    manufacturer: String
    modelNumber: String
    releaseYear: Int
    targetPrice: Float
    sourceUrl: String
    sourceNotes: String
    notes: String
    priority: Int!
    group: String
    deleted: Boolean!
    createdAt: String!
    cpu: String
    ram: String
    graphics: String
    storage: String
    operatingSystem: String
    externalUrl: String
    isWifiEnabled: Boolean
    isPramBatteryRemoved: Boolean
    category: Category
    categoryId: Int
  }

  input WishlistItemWhereInput {
    deleted: Boolean
  }

  input WishlistItemCreateInput {
    name: String!
    additionalName: String
    manufacturer: String
    modelNumber: String
    releaseYear: Int
    targetPrice: Float
    sourceUrl: String
    sourceNotes: String
    notes: String
    priority: Int
    group: String
    categoryId: Int
    cpu: String
    ram: String
    graphics: String
    storage: String
    operatingSystem: String
    externalUrl: String
    isWifiEnabled: Boolean
    isPramBatteryRemoved: Boolean
  }

  input WishlistItemUpdateInput {
    name: String
    additionalName: String
    manufacturer: String
    modelNumber: String
    releaseYear: Int
    targetPrice: Float
    sourceUrl: String
    sourceNotes: String
    notes: String
    priority: Int
    group: String
    categoryId: Int
    cpu: String
    ram: String
    graphics: String
    storage: String
    operatingSystem: String
    externalUrl: String
    isWifiEnabled: Boolean
    isPramBatteryRemoved: Boolean
  }

  type StatsBucket {
    label: String!
    count: Int!
  }

  type CollectionStats {
    byStatus:           [StatsBucket!]!
    byFunctionalStatus: [StatsBucket!]!
    byCategoryType:     [StatsBucket!]!
    byAcquisitionYear:  [StatsBucket!]!
    byReleaseDecade:    [StatsBucket!]!
    topManufacturers:   [StatsBucket!]!
    byRarity:           [StatsBucket!]!
    totalDevices:       Int!
    workingPercent:     Float!
    avgEstimatedValue:  Float!
    topCategoryType:    String!
  }

  input TemplateCreateInput {
    name: String!
    categoryId: Int!
    additionalName: String
    manufacturer: String
    modelNumber: String
    releaseYear: Int
    estimatedValue: Float
    cpu: String
    ram: String
    graphics: String
    storage: String
    operatingSystem: String
    externalUrl: String
    isWifiEnabled: Boolean
    isPramBatteryRemoved: Boolean
    rarity: Rarity
  }

  input TemplateUpdateInput {
    id: Int!
    name: String
    categoryId: Int
    additionalName: String
    manufacturer: String
    modelNumber: String
    releaseYear: Int
    estimatedValue: Float
    cpu: String
    ram: String
    graphics: String
    storage: String
    operatingSystem: String
    externalUrl: String
    isWifiEnabled: Boolean
    isPramBatteryRemoved: Boolean
    rarity: Rarity
  }

  type Query {
    devices(where: DeviceWhereInput): [Device!]!
    device(where: DeviceWhereInput): Device
    categories: [Category!]!
    tags: [Tag!]!
    templates: [Template!]!
    financialOverview: FinancialOverview!
    financialTransactions: [FinancialTransaction!]!
    systemUsage: SystemUsage!
    maintenanceTaskLabels: [String!]!
    customFields: [CustomField!]!
    collectionStats: CollectionStats!
    timelineEvents: [TimelineEvent!]!
    valueHistory(deviceId: Int!): [ValueSnapshot!]!
    wishlistItems(where: WishlistItemWhereInput): [WishlistItem!]!
    systemSetting(key: String!): String
  }

  input DeviceCreateInput {
    # Required
    name: String!
    categoryId: Int!

    # Optional - Basic
    additionalName: String
    manufacturer: String
    modelNumber: String
    serialNumber: String
    releaseYear: Int
    location: String
    info: String
    isFavorite: Boolean
    externalUrl: String

    # Optional - Status
    status: Status
    functionalStatus: FunctionalStatus
    condition: Condition
    rarity: Rarity

    # Optional - Flags
    hasOriginalBox: Boolean
    isAssetTagged: Boolean

    # Optional - Acquisition
    dateAcquired: DateTime
    whereAcquired: String
    priceAcquired: Float
    estimatedValue: Float

    # Optional - Sales
    listPrice: Float
    soldPrice: Float
    soldDate: DateTime

    # Optional - Computer Specs
    cpu: String
    ram: String
    graphics: String
    storage: String
    operatingSystem: String
    isWifiEnabled: Boolean
    isPramBatteryRemoved: Boolean
    lastPowerOnDate: DateTime
  }

  input DeviceUpdateInput {
    id: Int!

    # All fields optional for update
    name: String
    manufacturer: String
    modelNumber: String
    serialNumber: String
    releaseYear: Int
    location: String
    categoryId: Int

    additionalName: String
    info: String
    isFavorite: Boolean
    externalUrl: String

    status: Status
    functionalStatus: FunctionalStatus
    condition: Condition
    rarity: Rarity

    hasOriginalBox: Boolean
    isAssetTagged: Boolean

    dateAcquired: DateTime
    whereAcquired: String
    priceAcquired: Float
    estimatedValue: Float

    listPrice: Float
    soldPrice: Float
    soldDate: DateTime

    cpu: String
    ram: String
    graphics: String
    storage: String
    operatingSystem: String
    isWifiEnabled: Boolean
    isPramBatteryRemoved: Boolean
    lastPowerOnDate: DateTime
    deleted: Boolean
  }

  input ImageCreateInput {
    deviceId: Int!
    path: String!
    caption: String
    isThumbnail: Boolean
    isShopImage: Boolean
  }

  input ImageUpdateInput {
    id: Int!
    caption: String
    isThumbnail: Boolean
    isShopImage: Boolean
    isListingImage: Boolean
  }

  input NoteUpdateInput {
    id: Int!
    content: String!
    date: DateTime!
  }

  input MaintenanceTaskCreateInput {
    deviceId: Int!
    label: String!
    dateCompleted: DateTime!
    notes: String
    cost: Float
  }

  input NoteCreateInput {
    deviceId: Int!
    content: String!
    date: DateTime!
  }

  input CustomFieldCreateInput {
    name: String!
    isPublic: Boolean
    sortOrder: Int
  }

  input CustomFieldUpdateInput {
    id: Int!
    name: String
    isPublic: Boolean
    sortOrder: Int
  }

  input SetCustomFieldValueInput {
    deviceId: Int!
    customFieldId: Int!
    value: String!
  }

  input DeviceWhereInput {
    id: Int
    serialNumber: DeviceWhereSerialNumberInput
    deleted: DeviceWhereDeletedInput
    category: DeviceWhereCategoryInput
    status: DeviceWhereStatusInput
    functionalStatus: DeviceWhereFunctionalStatusInput
    condition: DeviceWhereConditionInput
    rarity: DeviceWhereRarityInput
  }

  input DeviceWhereSerialNumberInput {
    equals: String
  }

  input DeviceWhereDeletedInput {
    equals: Boolean
  }

  input DeviceWhereCategoryInput {
    id: DeviceWhereCategoryIdInput
    type: DeviceWhereCategoryTypeInput
  }

  input DeviceWhereCategoryIdInput {
    equals: Int
    in: [Int!]
  }

  input DeviceWhereCategoryTypeInput {
    equals: String
    in: [String!]
  }

  input DeviceWhereStatusInput {
    equals: Status
    in: [Status!]
  }

  input DeviceWhereFunctionalStatusInput {
    equals: FunctionalStatus
    in: [FunctionalStatus!]
  }

  input DeviceWhereConditionInput {
    equals: Condition
    in: [Condition!]
  }

  input DeviceWhereRarityInput {
    equals: Rarity
    in: [Rarity!]
  }

  type Mutation {
    recordDeviceView(deviceId: Int!): Boolean
    createWishlistItem(data: WishlistItemCreateInput!): WishlistItem!
    updateWishlistItem(id: Int!, data: WishlistItemUpdateInput!): WishlistItem!
    deleteWishlistItem(id: Int!): WishlistItem!
    permanentlyDeleteWishlistItem(id: Int!): WishlistItem!
    createCategory(name: String!, type: String!, sortOrder: Int): Category!
    updateCategory(id: Int!, name: String, type: String, sortOrder: Int): Category!
    createTemplate(input: TemplateCreateInput!): Template!
    updateTemplate(input: TemplateUpdateInput!): Template!
    deleteTemplate(id: Int!): Boolean!
    createDevice(input: DeviceCreateInput!): Device!
    updateDevice(input: DeviceUpdateInput!): Device!
    deleteDevice(id: Int!): Boolean!
    restoreDevice(id: Int!): Device!
    permanentlyDeleteDevice(id: Int!): Boolean!
    createImage(input: ImageCreateInput!): Image!
    updateImage(input: ImageUpdateInput!): Image!
    deleteImage(id: Int!): Boolean!
    createMaintenanceTask(input: MaintenanceTaskCreateInput!): MaintenanceTask!
    deleteMaintenanceTask(id: Int!): Boolean!
    createNote(input: NoteCreateInput!): Note!
    updateNote(input: NoteUpdateInput!): Note!
    deleteNote(id: Int!): Boolean!
    addDeviceTag(deviceId: Int!, tagName: String!): Device!
    removeDeviceTag(deviceId: Int!, tagId: Int!): Device!
    createCustomField(input: CustomFieldCreateInput!): CustomField!
    updateCustomField(input: CustomFieldUpdateInput!): CustomField!
    deleteCustomField(id: Int!): Boolean!
    setCustomFieldValue(input: SetCustomFieldValueInput!): CustomFieldValue!
    removeCustomFieldValue(deviceId: Int!, customFieldId: Int!): Boolean!
    addDeviceAccessory(deviceId: Int!, name: String!): DeviceAccessory!
    removeDeviceAccessory(id: Int!): Boolean!
    addDeviceLink(deviceId: Int!, label: String!, url: String!): DeviceLink!
    removeDeviceLink(id: Int!): Boolean!
    setSystemSetting(key: String!, value: String!): Boolean!
  }
`;
