export type Translations = {
  status: {
    COLLECTION: string;
    FOR_SALE: string;
    PENDING_SALE: string;
    IN_REPAIR: string;
    REPAIRED: string;
    SOLD: string;
    DONATED: string;
    RETURNED: string;
  };
  functionalStatus: {
    YES: string;
    PARTIAL: string;
    NO: string;
  };
  condition: {
    NEW: string;
    LIKE_NEW: string;
    VERY_GOOD: string;
    GOOD: string;
    ACCEPTABLE: string;
    FOR_PARTS: string;
  };
  rarity: {
    COMMON: string;
    UNCOMMON: string;
    RARE: string;
    VERY_RARE: string;
    EXTREMELY_RARE: string;
  };
  categoryType: {
    COMPUTER: string;
    PERIPHERAL: string;
    ACCESSORY: string;
    OTHER: string;
  };
  icons: {
    favorite: string;
    notFavorite: string;
    hasOriginalBox: string;
    noOriginalBox: string;
    pramRemoved: string;
    pramNotRemoved: string;
    assetTagged: string;
    notAssetTagged: string;
    rarityPrefix: string;
    functionalYes: string;
    functionalPartial: string;
    functionalNo: string;
  };
  table: {
    thumbnail: string;
    year: string;
    manufacturerModel: string;
    dateAcquired: string;
    estValue: string;
    location: string;
    availability: string;
    indicators: string;
  };
  filter: {
    title: string;
    status: string;
    category: string;
    location: string;
    functionalStatus: string;
    condition: string;
    rarity: string;
    sortBy: string;
    allCategories: string;
    allLocations: string;
    allFunctionalStatuses: string;
    clearAll: string;
    applyFilters: string;
    ascending: string;
    descending: string;
  };
  sort: {
    category: string;
    name: string;
    manufacturer: string;
    releaseYear: string;
    dateAcquired: string;
    estimatedValue: string;
    location: string;
    available: string;
    status: string;
    condition: string;
    rarity: string;
  };
  card: {
    noImage: string;
    estValue: string;
    available: string;
    pending: string;
  };
  common: {
    cancel: string;
    delete: string;
    add: string;
    yes: string;
    no: string;
    adding: string;
    addingEllipsis: string;
    updating: string;
    deleting: string;
    update: string;
    notes: string;
    date: string;
    cost: string;
    currencySymbol: string;
    back: string;
    save: string;
    edit: string;
    actions: string;
    name: string;
    sort: string;
    type: string;
    remove: string;
  };
  scanner: {
    title: string;
    close: string;
    cancel: string;
    pointCamera: string;
    notSupported: string;
    cameraError: string;
  };
  nav: {
    wishlist: string;
    financials: string;
    stats: string;
    timeline: string;
    usage: string;
    printList: string;
    exportImport: string;
    aiProductImages: string;
    manageCategories: string;
    manageLocations: string;
    manageTemplates: string;
    manageCustomFields: string;
    trash: string;
    logOut: string;
    logIn: string;
  };
  home: {
    search: string;
    filterDevices: string;
    switchToTable: string;
    switchToCards: string;
    addNewDevice: string;
    scanAssetTag: string;
    loadingTitle: string;
    loadingSubtitle: string;
    warmingUp: string;
    noDevices: string;
    showing: string;
    devices: string;
    estValue: string;
    totalSpent: string;
    totalSold: string;
  };
  detail: {
    loading: string;
    loadingSubtitle: string;
    maintenanceTasks: string;
    notes: string;
    tags: string;
    accessories: string;
    referenceLinks: string;
    specifications: string;
    computerSpecs: string;
    acquisition: string;
    valueHistory: string;
    salesInfo: string;
    donationInfo: string;
    repairInfo: string;
    returnedDate: string;
    repairFeeCharged: string;
    customFields: string;
    addTask: string;
    addMaintenance: string;
    addNote: string;
    addPhotos: string;
    addLink: string;
    addMaintenanceTitle: string;
    addNoteTitle: string;
    taskLabel: string;
    dateCompleted: string;
    costOptional: string;
    noteContent: string;
    dateLabel: string;
    costPrefix: string;
    deleteTaskConfirm: string;
    deleteNoteConfirm: string;
    removeLinkConfirm: string;
    deviceId: string;
    serialNumber: string;
    releaseYear: string;
    locationLabel: string;
    lastUsed: string;
    cpu: string;
    ram: string;
    graphics: string;
    storage: string;
    operatingSystem: string;
    wifiEnabled: string;
    pramBatteryRemoved: string;
    dateAcquired: string;
    whereAcquired: string;
    priceAcquired: string;
    estimatedValue: string;
    listPrice: string;
    soldPrice: string;
    soldDate: string;
    donatedDate: string;
    addTagPlaceholder: string;
    noTags: string;
    noAccessories: string;
    noLinks: string;
    customAccessoryPlaceholder: string;
    accessorySuggestionsComputer: string[];
    accessorySuggestionsOther: string[];
    relatedDevices: string;
    addRelationship: string;
    relationshipDevice: string;
    relationshipType: string;
    noRelatedDevices: string;
    removeRelationshipConfirm: string;
    relationshipTypeSuggestions: string[];
    inverseRelationLabels: Record<string, string>;
  };
  pages: {
    timeline: {
      title: string;
      subtitle: string;
      loading: string;
      loadingSubtitle: string;
      legendApple: string;
      legendTech: string;
      legendCollection: string;
      noData: string;
    };
    stats: {
      title: string;
      subtitle: string;
      loading: string;
      loadingSubtitle: string;
      loadingCharts: string;
      loadingChartsSubtitle: string;
      atAGlance: string;
      totalDevices: string;
      working: string;
      avgEstValue: string;
      topCategory: string;
      collectionComposition: string;
      byStatus: string;
      byCondition: string;
      byCategoryType: string;
      byRarity: string;
      rarityDistribution: string;
      acquiredPerYear: string;
      acquisitionYear: string;
      byReleaseEra: string;
      releaseDecade: string;
      topManufacturers: string;
      manufacturer: string;
      noData: string;
      devices: string;
    };
    usage: {
      title: string;
      subtitle: string;
      loading: string;
      loadingSubtitle: string;
      dataCounts: string;
      storage: string;
      devices: string;
      images: string;
      maintenanceTasks: string;
      categories: string;
      templates: string;
      tags: string;
      totalImageStorage: string;
      bytes: string;
    };
    trash: {
      title: string;
      subtitle: string;
      loading: string;
      loadingSubtitle: string;
      emptyTitle: string;
      emptyText: string;
      acquiredLabel: string;
      unknownCategory: string;
      confirmDelete: string;
      yesDelete: string;
      restore: string;
      deleteForever: string;
      deletedDevice: string;
      deletedDevices: string;
    };
    categories: {
      title: string;
      subtitle: string;
      loading: string;
      loadingSubtitle: string;
      addSection: string;
      sort: string;
      actions: string;
      deleteConfirm: string;
      deleteInUse: string;
    };
    locations: {
      title: string;
      subtitle: string;
      loading: string;
      loadingSubtitle: string;
      addSection: string;
      actions: string;
      deleteConfirm: string;
      deleteInUse: string;
      deviceCount: string;
      qrCode: string;
      locationQrTitle: string;
      locationQrSubtitle: string;
      noDevices: string;
      description: string;
    };
    financials: {
      title: string;
      subtitle: string;
      loading: string;
      loadingSubtitle: string;
      loadingChart: string;
      loadingChartSubtitle: string;
      summary: string;
      totalSpent: string;
      totalReceived: string;
      netCash: string;
      estimatedValueOwned: string;
      maintenanceCosts: string;
      netPosition: string;
      realizedProfit: string;
      valueOverTime: string;
      valueOverTimeDesc: string;
      transactionHistory: string;
      transactionHistoryDesc: string;
      noTransactions: string;
      rows: string;
      typeCol: string;
      device: string;
      amount: string;
      cumulativeNet: string;
      txSold: string;
      txDonated: string;
      txMaintenance: string;
      txRepairFee: string;
      txAcquired: string;
      cumulativeCash: string;
      cumulativeValue: string;
      netPositionLine: string;
      noChartData: string;
    };
    wishlist: {
      title: string;
      subtitle: string;
      loading: string;
      loadingSubtitle: string;
      addItem: string;
      newItem: string;
      editPrefix: string;
      emptyTitle: string;
      emptySubtitle: string;
      other: string;
      templateSection: string;
      templateSearch: string;
      noTemplatesFound: string;
      basicInfo: string;
      specifications: string;
      sourceAndNotes: string;
      targetPriceLabel: string;
      groupLabel: string;
      sourceUrlLabel: string;
      sourceNotesLabel: string;
      high: string;
      medium: string;
      low: string;
      noneOption: string;
      targetPrefix: string;
      sourcePrefix: string;
      viewSource: string;
      saving: string;
      acquiredBtn: string;
      deleteConfirmPre: string;
      deleteConfirmPost: string;
      itemSingular: string;
      itemPlural: string;
    };
    customFields: {
      title: string;
      subtitle: string;
      loading: string;
      loadingSubtitle: string;
      addSection: string;
      sortPlaceholder: string;
      fieldNamePlaceholder: string;
      publicLabel: string;
      emptyState: string;
      visibility: string;
      publicBadge: string;
      privateBadge: string;
      deleteTitle: string;
      deleteDescPre: string;
      deleteDescPost: string;
      deleteConfirmPre: string;
      deleteConfirmPost: string;
      deleteFieldBtn: string;
    };
    templates: {
      title: string;
      subtitle: string;
      loading: string;
      loadingSubtitle: string;
      newTemplate: string;
      additional: string;
      model: string;
      year: string;
      actions: string;
      newTemplateTitle: string;
      editTemplateTitle: string;
      closeBtn: string;
      selectCategory: string;
      openLink: string;
      rarityNotSet: string;
      computerSpecs: string;
      deleteConfirm: string;
      linkLabel: string;
      linkLabelPlaceholder: string;
    };
    backup: {
      title: string;
      subtitle: string;
      loading: string;
      loadingSubtitle: string;
      filterBtn: string;
      importSectionTitle: string;
      importToggleHide: string;
      importToggleShow: string;
      importDesc: string;
      importingStatus: string;
      importCompletePrefix: string;
      importDevicesSuccess: string;
      importDevicesFailed: string;
      importFailedPrefix: string;
      tableOriginalId: string;
      tableNewId: string;
      tableIdPreserved: string;
      exportSectionTitle: string;
      includeImages: string;
      compressImages: string;
      largeSplitNote: string;
      devicesSelectedSuffix: string;
      allFilteredPrefix: string;
      allFilteredSuffix: string;
      selectAll: string;
      selectNone: string;
      exportingStatus: string;
      exportBtnLabel: string;
      tableId: string;
      tableCategory: string;
      tableYear: string;
      tableStatus: string;
      tableImages: string;
      tableNotes: string;
      splitPartsPrefix: string;
      splitPartsSuffix: string;
      splitDownloadNote: string;
      partBtn: string;
      dismiss: string;
      progressStarting: string;
      progressDownloading: string;
      progressComplete: string;
      progressFailed: string;
      progressUploading: string;
      progressExtracting: string;
      csvImportTitle: string;
      csvImportToggleShow: string;
      csvImportToggleHide: string;
      csvImportDesc: string;
      csvHasHeader: string;
      csvStep2Title: string;
      csvPreviewTitle: string;
      csvIgnoreColumn: string;
      csvDefaultCategory: string;
      csvDefaultCategoryNote: string;
      csvSelectCategory: string;
      csvNameRequired: string;
      csvCategoryRequired: string;
      csvImportBtn: string;
      csvBackBtn: string;
      csvImportingProgress: string;
      csvImportSuccessCount: string;
      csvImportErrorCount: string;
      csvImportAgainBtn: string;
      csvResultRow: string;
      csvResultStatus: string;
      csvResultError: string;
      csvFields: {
        name: string;
        additionalName: string;
        manufacturer: string;
        modelNumber: string;
        serialNumber: string;
        releaseYear: string;
        info: string;
        category: string;
        status: string;
        functionalStatus: string;
        condition: string;
        rarity: string;
        isFavorite: string;
        isAssetTagged: string;
        dateAcquired: string;
        whereAcquired: string;
        priceAcquired: string;
        estimatedValue: string;
        listPrice: string;
        soldPrice: string;
        soldDate: string;
        cpu: string;
        ram: string;
        graphics: string;
        storage: string;
        operatingSystem: string;
        isWifiEnabled: string;
        isPramBatteryRemoved: string;
        lastPowerOnDate: string;
      };
      deviceSelectionTitle?: string;
      deviceSelectionDesc?: string;
      csvExport?: {
        title: string;
        toggleShow: string;
        toggleHide: string;
        desc: string;
        scopeLabel: string;
        scopeSuffix: string;
        selectAll: string;
        selectNone: string;
        resetDefaults: string;
        fieldsSelectedSuffix: string;
        showPreview: string;
        hidePreview: string;
        downloadBtn: string;
        pickFieldsHint: string;
        groups: {
          basics: string;
          classification: string;
          financial: string;
          location: string;
          specs: string;
          text: string;
          relations: string;
        };
        fieldLabels: {
          id: string;
          location: string;
          hasOriginalBox: string;
          historicalNotes: string;
          externalUrl: string;
          notes: string;
          maintenanceTasks: string;
          accessories: string;
          links: string;
          tags: string;
          customFields: string;
          imageCount: string;
        };
      };
    };
    print: {
      title: string;
      subtitle: string;
      loading: string;
      loadingSubtitle: string;
      filterBtn: string;
      generateBtn: string;
      backToSelection: string;
      printBtn: string;
      selectionInfoOf: string;
      selectionInfoDesc: string;
      collectionTitle: string;
      generatedOn: string;
      tableOfContents: string;
      idHeader: string;
      categoryHeader: string;
      nameHeader: string;
      yearHeader: string;
      statusHeader: string;
      imagesHeader: string;
      tasksHeader: string;
      functionalHeader: string;
      identificationSection: string;
      statusValueSection: string;
      acquisitionSection: string;
      specificationsSection: string;
      descriptionSection: string;
      tagsSection: string;
      maintenanceSection: string;
      manufacturerLabel: string;
      modelLabel: string;
      serialLabel: string;
      locationLabel: string;
      assetTaggedLabel: string;
      functionalLabel: string;
      originalBoxLabel: string;
      pramRemovedLabel: string;
      estValueLabel: string;
      soldPriceLabel: string;
      dateAcquiredLabel: string;
      whereLabel: string;
      pricePaidLabel: string;
      osLabel: string;
      taskHeader: string;
      dateCompletedHeader: string;
      functionalYes: string;
      functionalPartial: string;
      functionalNo: string;
    };
  };
  login: {
    adminLogin: string;
    username: string;
    password: string;
    signingIn: string;
    signIn: string;
    continueAsGuest: string;
    loginFailed: string;
  };
  chat: {
    title: string;
    toolSearching: string;
    toolLoadingInventory: string;
    toolLoadingDevices: string;
    toolLoadingDetails: string;
    toolLoadingFinancials: string;
    conversationModeExit: string;
    conversationModeStart: string;
    unmuteVoice: string;
    muteVoice: string;
    statusListening: string;
    statusSpeaking: string;
    statusThinking: string;
    statusConversation: string;
    emptyPrompt: string;
    emptyExamplesTitle: string;
    example1: string;
    example2: string;
    example3: string;
    example4: string;
    stopListeningTitle: string;
    speakQuestionTitle: string;
    inputPlaceholderListening: string;
    inputPlaceholder: string;
    speakingStatus: string;
    speakingListenAfter: string;
    openAssistantTitle: string;
    devicesCount: string;
    resultsCount: string;
  };
  form: {
    templateSection: string;
    searchLabel: string;
    templateSearchPlaceholder: string;
    selectedPrefix: string;
    clearTemplate: string;
    noMatchingTemplates: string;
    startTypingSearch: string;
    basicInformation: string;
    statusCondition: string;
    repairInformation: string;
    additionalInformation: string;
    additionalNameLabel: string;
    manufacturerLabel: string;
    modelNumberLabel: string;
    scanBtn: string;
    scanSerialTitle: string;
    lastPowerOnLabel: string;
    notSet: string;
    favoriteLabel: string;
    assetTaggedLabel: string;
    selectCategory: string;
    namePlaceholder: string;
    additionalNamePlaceholder: string;
    manufacturerPlaceholder: string;
    modelNumberPlaceholder: string;
    locationSelect: string;
    locationNone: string;
    locationCreateNew: string;
    whereAcquiredPlaceholder: string;
    repairFeeLabel: string;
    returnedDateLabel: string;
    donationInformation: string;
    salesInformation: string;
    cpuPlaceholder: string;
    ramPlaceholder: string;
    graphicsPlaceholder: string;
    storagePlaceholder: string;
    osPlaceholder: string;
    accessoryCustomPlaceholder: string;
    linkLabelPlaceholder: string;
    linkUrlPlaceholder: string;
    descriptionLabel: string;
    descriptionPlaceholder: string;
    saving: string;
    createDevice: string;
    saveChanges: string;
    externalUrlLabel: string;
  };
};

export const en: Translations = {
  status: {
    COLLECTION: "In Collection",
    FOR_SALE: "For Sale",
    PENDING_SALE: "Pending Sale",
    IN_REPAIR: "In Repair",
    REPAIRED: "Repaired",
    SOLD: "Sold",
    DONATED: "Donated",
    RETURNED: "Returned",
  },
  functionalStatus: {
    YES: "Fully Functional",
    PARTIAL: "Partially Functional",
    NO: "Not Functional",
  },
  condition: {
    NEW: "New",
    LIKE_NEW: "Like New",
    VERY_GOOD: "Very Good",
    GOOD: "Good",
    ACCEPTABLE: "Acceptable",
    FOR_PARTS: "For Parts",
  },
  rarity: {
    COMMON: "Common",
    UNCOMMON: "Uncommon",
    RARE: "Rare",
    VERY_RARE: "Very Rare",
    EXTREMELY_RARE: "Extremely Rare",
  },
  categoryType: {
    COMPUTER: "Computer",
    PERIPHERAL: "Peripheral",
    ACCESSORY: "Accessory",
    OTHER: "Other",
  },
  icons: {
    favorite: "Favorite",
    notFavorite: "Not a Favorite",
    hasOriginalBox: "Has Original Box",
    noOriginalBox: "No Original Box",
    pramRemoved: "PRAM Battery Removed",
    pramNotRemoved: "PRAM Battery NOT Removed",
    assetTagged: "Asset Tagged",
    notAssetTagged: "Not Asset Tagged",
    rarityPrefix: "Rarity: ",
    functionalYes: "Functional: YES",
    functionalPartial: "Functional: PARTIAL",
    functionalNo: "Functional: NO",
  },
  table: {
    thumbnail: "Thumbnail",
    year: "Year",
    manufacturerModel: "Manufacturer & Model",
    dateAcquired: "Date Acquired",
    estValue: "Est. Value",
    location: "Location",
    availability: "Availability",
    indicators: "Indicators",
  },
  filter: {
    title: "Filter Devices",
    status: "Status",
    category: "Category",
    functionalStatus: "Functional Status",
    condition: "Condition",
    rarity: "Rarity",
    sortBy: "Sort By",
    allCategories: "All Categories",
    location: "Location",
    allLocations: "All Locations",
    allFunctionalStatuses: "All Functional Statuses",
    clearAll: "Clear All",
    applyFilters: "Apply Filters",
    ascending: "↑ Ascending",
    descending: "↓ Descending",
  },
  sort: {
    category: "Category",
    name: "Name",
    manufacturer: "Manufacturer & Model",
    releaseYear: "Release Year",
    dateAcquired: "Date Acquired",
    estimatedValue: "Estimated Value",
    location: "Location",
    available: "Availability",
    status: "Functional Status",
    condition: "Condition",
    rarity: "Rarity",
  },
  card: {
    noImage: "No Image",
    estValue: "Est. Value",
    available: "Available",
    pending: "Pending",
  },
  common: {
    cancel: "Cancel",
    delete: "Delete",
    add: "Add",
    yes: "Yes",
    no: "No",
    adding: "Adding...",
    addingEllipsis: "Adding…",
    updating: "Updating...",
    deleting: "Deleting...",
    update: "Update",
    notes: "Notes",
    date: "Date",
    cost: "Cost",
    currencySymbol: "$",
    back: "Back",
    save: "Save",
    edit: "Edit",
    actions: "Actions",
    name: "Name",
    sort: "Sort",
    type: "Type",
    remove: "Remove",
  },
  scanner: {
    title: "Scan Barcode",
    close: "Close",
    cancel: "Cancel",
    pointCamera: "Point the camera at the barcode.",
    notSupported: "Barcode scanning is not supported on this browser.",
    cameraError: "Unable to access the camera.",
  },
  nav: {
    wishlist: "Wishlist",
    financials: "Financials",
    stats: "Stats",
    timeline: "Timeline",
    usage: "Usage",
    printList: "Print List",
    exportImport: "Export / Import",
    aiProductImages: "AI Product Images",
    manageCategories: "Manage Categories",
    manageLocations: "Manage Locations",
    manageTemplates: "Manage Templates",
    manageCustomFields: "Manage Custom Fields",
    trash: "Trash",
    logOut: "Log Out",
    logIn: "Log In",
  },
  home: {
    search: "Search...",
    filterDevices: "Filter Devices",
    switchToTable: "Switch to Table View",
    switchToCards: "Switch to Cards View",
    addNewDevice: "Add New Device",
    scanAssetTag: "Scan Asset Tag",
    loadingTitle: "Loading devices…",
    loadingSubtitle: "Fetching your inventory",
    warmingUp: "Warming up the tubes",
    noDevices: "No devices found. Add your first one!",
    showing: "Showing:",
    devices: "devices",
    estValue: "Est. Value:",
    totalSpent: "Total Spent:",
    totalSold: "Total Sold:",
  },
  detail: {
    loading: "Loading device…",
    loadingSubtitle: "Fetching details",
    maintenanceTasks: "Maintenance Logs",
    notes: "Notes",
    tags: "Tags",
    accessories: "Accessories",
    referenceLinks: "Reference Links",
    specifications: "Specifications",
    computerSpecs: "Computer Specs",
    acquisition: "Acquisition",
    valueHistory: "Value History",
    salesInfo: "Sales Info",
    donationInfo: "Donation Info",
    repairInfo: "Repair Info",
    returnedDate: "Returned Date",
    repairFeeCharged: "Repair Fee Charged",
    customFields: "Custom Fields",
    addTask: "Add Log",
    addMaintenance: "Add Maintenance",
    addNote: "Add Note",
    addPhotos: "Add Photos",
    addLink: "Add Link",
    addMaintenanceTitle: "Add Maintenance Task",
    addNoteTitle: "Add Note",
    taskLabel: "Log Label",
    dateCompleted: "Date Completed",
    costOptional: "Cost (optional)",
    noteContent: "Note Content",
    dateLabel: "Date",
    costPrefix: "Cost:",
    deleteTaskConfirm: "Delete this maintenance log?",
    deleteNoteConfirm: "Delete this note?",
    removeLinkConfirm: "Remove this link?",
    deviceId: "Device ID",
    serialNumber: "Serial Number",
    releaseYear: "Release Year",
    locationLabel: "Location",
    lastUsed: "Last Used",
    cpu: "CPU",
    ram: "RAM",
    graphics: "Graphics",
    storage: "Storage",
    operatingSystem: "Operating System",
    wifiEnabled: "WiFi Enabled",
    pramBatteryRemoved: "PRAM Battery Removed",
    dateAcquired: "Date Acquired",
    whereAcquired: "Where Acquired",
    priceAcquired: "Price Acquired",
    estimatedValue: "Estimated Value",
    listPrice: "List Price",
    soldPrice: "Sold Price",
    soldDate: "Sold Date",
    donatedDate: "Donated Date",
    addTagPlaceholder: "Add a tag",
    noTags: "No tags",
    noAccessories: "No accessories",
    noLinks: "No links",
    customAccessoryPlaceholder: "Custom accessory…",
    accessorySuggestionsComputer: ['Original Box', 'Keyboard', 'Mouse', 'Power Cable/Adapter', 'Power Supply', 'Manual/Documentation', 'Software Disks', 'Monitor'],
    accessorySuggestionsOther: ['Original Box', 'Power Cable', 'Cables/Adapters', 'Manual'],
    relatedDevices: "Related Devices",
    addRelationship: "Add Relationship",
    relationshipDevice: "Device",
    relationshipType: "Relationship type",
    noRelatedDevices: "No related devices",
    removeRelationshipConfirm: "Remove this relationship?",
    relationshipTypeSuggestions: ['accessory', 'software', 'manual / documentation', 'installed inside', 'purchased with', 'came bundled with'],
    inverseRelationLabels: {
      'Accessory': 'Accessory of',
      'Software': 'Software for',
      'Manual / documentation': 'Manual for',
      'Installed inside': 'Contains',
      'Purchased with': 'Purchased with',
      'Came bundled with': 'Came bundled with',
    },
  },
  pages: {
    timeline: {
      title: "Collection Timeline",
      subtitle: "Your collection in historical context.",
      loading: "Loading timeline…",
      loadingSubtitle: "Consulting the archives",
      legendApple: "Apple milestone",
      legendTech: "Tech milestone",
      legendCollection: "In your collection",
      noData: "No timeline data. Add release years to devices or add events in the database.",
    },
    stats: {
      title: "Collection Stats",
      subtitle: "Visual breakdown of your collection composition and acquisition trends.",
      loading: "Loading stats…",
      loadingSubtitle: "Tallying the collection",
      loadingCharts: "Loading charts…",
      loadingChartsSubtitle: "Crunching the numbers",
      atAGlance: "At a Glance",
      totalDevices: "Total Devices",
      working: "Working",
      avgEstValue: "Avg. Est. Value",
      topCategory: "Top Category",
      collectionComposition: "Collection Composition",
      byStatus: "By Status",
      byCondition: "By Condition",
      byCategoryType: "By Category Type",
      byRarity: "By Rarity",
      rarityDistribution: "Rarity Distribution",
      acquiredPerYear: "Devices Acquired Per Year",
      acquisitionYear: "Acquisition Year",
      byReleaseEra: "By Release Era",
      releaseDecade: "Release Decade",
      topManufacturers: "Top Manufacturers",
      manufacturer: "Manufacturer",
      noData: "No data",
      devices: "Devices",
    },
    usage: {
      title: "System Usage",
      subtitle: "Overview of your inventory data",
      loading: "Loading usage data…",
      loadingSubtitle: "Tallying things up",
      dataCounts: "Data Counts",
      storage: "Storage",
      devices: "Devices",
      images: "Images",
      maintenanceTasks: "Maintenance Logs",
      categories: "Categories",
      templates: "Templates",
      tags: "Tags",
      totalImageStorage: "Total Image Storage",
      bytes: "bytes",
    },
    trash: {
      title: "Trash",
      subtitle: "Deleted devices can be restored or permanently deleted.",
      loading: "Loading deleted devices…",
      loadingSubtitle: "Checking the trash",
      emptyTitle: "Trash is empty",
      emptyText: "Deleted devices will appear here.",
      acquiredLabel: "Acquired:",
      unknownCategory: "Unknown",
      confirmDelete: "Delete permanently?",
      yesDelete: "Yes, Delete",
      restore: "Restore",
      deleteForever: "Delete Forever",
      deletedDevice: "deleted device",
      deletedDevices: "deleted devices",
    },
    categories: {
      title: "Manage Categories",
      subtitle: "Add, edit, and delete categories.",
      loading: "Loading categories…",
      loadingSubtitle: "Building the index",
      addSection: "Add Category",
      sort: "Sort",
      actions: "Actions",
      deleteConfirm: "Delete category",
      deleteInUse: "Cannot delete: devices are assigned to this category.",
    },
    locations: {
      title: "Manage Locations",
      subtitle: "Create named locations for shelves, boxes, and storage spots. Each gets a scannable QR code.",
      loading: "Loading locations…",
      loadingSubtitle: "Finding your shelves",
      addSection: "Add Location",
      actions: "Actions",
      deleteConfirm: "Delete location",
      deleteInUse: "This will unassign all devices from this location.",
      deviceCount: "Devices",
      qrCode: "QR Code",
      locationQrTitle: "Location QR Code",
      locationQrSubtitle: "Scan to see all devices stored here",
      noDevices: "No devices at this location.",
      description: "Description",
    },
    financials: {
      title: "Financials",
      subtitle: "Overview of spend, sales, and estimated collection position.",
      loading: "Loading financials…",
      loadingSubtitle: "Running the numbers",
      loadingChart: "Loading chart…",
      loadingChartSubtitle: "Plotting the lines",
      summary: "Summary",
      totalSpent: "Total Spent",
      totalReceived: "Total Received",
      netCash: "Net Cash (Received + Spent)",
      estimatedValueOwned: "Estimated Value (Still Owned)",
      maintenanceCosts: "Maintenance Costs",
      netPosition: "Net Position (Owned Value + Net Cash − Maintenance)",
      realizedProfit: "Realized Profit (Sold Devices Only)",
      valueOverTime: "Collection Value Over Time",
      valueOverTimeDesc: "Track cumulative cash flow, estimated value, and net position as your collection grows.",
      transactionHistory: "Transaction History",
      transactionHistoryDesc: "Acquisitions are negative cash and positive estimated value. Sales and donations are negative estimated value (removed from collection).",
      noTransactions: "No transactions yet.",
      rows: "rows",
      typeCol: "Type",
      device: "Device",
      amount: "Amount",
      cumulativeNet: "Cumulative Net",
      txSold: "Sold",
      txDonated: "Donated",
      txMaintenance: "Maintenance",
      txRepairFee: "Repair Fee",
      txAcquired: "Acquired",
      cumulativeCash: "Cumulative Cash",
      cumulativeValue: "Cumulative Value",
      netPositionLine: "Net Position",
      noChartData: "No dated transactions to chart.",
    },
    wishlist: {
      title: "Wishlist",
      subtitle: "Devices you want to acquire, with target prices and sources.",
      loading: "Loading wishlist…",
      loadingSubtitle: "Checking the want list",
      addItem: "+ Add Item",
      newItem: "New Wishlist Item",
      editPrefix: "Edit:",
      emptyTitle: "Your wishlist is empty.",
      emptySubtitle: "Add devices you want to acquire.",
      other: "Other",
      templateSection: "Template (Optional)",
      templateSearch: "Search templates to pre-fill specs…",
      noTemplatesFound: "No templates found",
      basicInfo: "Basic Info",
      specifications: "Specifications",
      sourceAndNotes: "Source & Notes",
      targetPriceLabel: "Target Price",
      groupLabel: "Group",
      sourceUrlLabel: "Source URL",
      sourceNotesLabel: "Source Notes",
      high: "High",
      medium: "Medium",
      low: "Low",
      noneOption: "— None —",
      targetPrefix: "Target:",
      sourcePrefix: "Source:",
      viewSource: "View Source",
      saving: "Saving…",
      acquiredBtn: "Acquired",
      deleteConfirmPre: 'Delete "',
      deleteConfirmPost: '" from wishlist?',
      itemSingular: "item",
      itemPlural: "items",
    },
    customFields: {
      title: "Manage Custom Fields",
      subtitle: "Define custom attributes that can be set on any device.",
      loading: "Loading custom fields...",
      loadingSubtitle: "Fetching field definitions",
      addSection: "Add Custom Field",
      sortPlaceholder: "Sort",
      fieldNamePlaceholder: "Field name",
      publicLabel: "Public",
      emptyState: "No custom fields defined yet. Add one above.",
      visibility: "Visibility",
      publicBadge: "Public",
      privateBadge: "Private",
      deleteTitle: "Delete Custom Field",
      deleteDescPre: 'This will permanently delete the field "',
      deleteDescPost: '" and remove its value from all devices. This action cannot be undone.',
      deleteConfirmPre: "Type ",
      deleteConfirmPost: " to confirm:",
      deleteFieldBtn: "Delete Field",
    },
    templates: {
      title: "Manage Templates",
      subtitle: "Add, edit, and delete templates.",
      loading: "Loading templates…",
      loadingSubtitle: "Fetching your saved presets",
      newTemplate: "New Template",
      additional: "Additional",
      model: "Model",
      year: "Year",
      actions: "Actions",
      newTemplateTitle: "New Template",
      editTemplateTitle: "Edit Template",
      closeBtn: "Close",
      selectCategory: "Select a category",
      openLink: "Open link",
      rarityNotSet: "Not Set",
      computerSpecs: "Computer Specs",
      deleteConfirm: "Delete this template?",
      linkLabel: "Link Label",
      linkLabelPlaceholder: "e.g. EveryMac",
    },
    backup: {
      title: "Export Devices",
      subtitle: "Select devices to export. Data will be bundled into a ZIP file.",
      loading: "Loading devices…",
      loadingSubtitle: "Getting export tools ready",
      filterBtn: "Filter",
      importSectionTitle: "Import Devices",
      importToggleHide: "Hide",
      importToggleShow: "Show",
      importDesc: "Import devices from a previously exported ZIP file. The import will attempt to preserve device IDs for asset tag compatibility.",
      importingStatus: "Importing...",
      importCompletePrefix: "Import Complete:",
      importDevicesSuccess: "device(s) imported successfully",
      importDevicesFailed: "failed",
      importFailedPrefix: "Import Failed:",
      tableOriginalId: "Original ID",
      tableNewId: "New ID",
      tableIdPreserved: "ID Preserved",
      exportSectionTitle: "Export Devices",
      includeImages: "Include images",
      compressImages: "Compress images (reduces size ~50-70%)",
      largeSplitNote: "Large exports (>500MB) will be split into multiple parts for easier downloading and importing.",
      devicesSelectedSuffix: "devices selected for export",
      allFilteredPrefix: "All",
      allFilteredSuffix: "filtered devices will be exported",
      selectAll: "Select All",
      selectNone: "Select None",
      exportingStatus: "Exporting...",
      exportBtnLabel: "Export",
      tableId: "ID",
      tableCategory: "Category",
      tableYear: "Year",
      tableStatus: "Status",
      tableImages: "Images",
      tableNotes: "Notes",
      splitPartsPrefix: "Export split into",
      splitPartsSuffix: "parts (~500MB each)",
      splitDownloadNote: "Download all parts and import them one at a time.",
      partBtn: "Part",
      dismiss: "Dismiss",
      progressStarting: "Starting export...",
      progressDownloading: "Downloading...",
      progressComplete: "Export complete!",
      progressFailed: "Export failed. Please try again.",
      progressUploading: "Uploading file...",
      progressExtracting: "Extracting ZIP file...",
      csvImportTitle: "Import from CSV",
      csvImportToggleShow: "Show",
      csvImportToggleHide: "Hide",
      csvImportDesc: "Import devices from a CSV file. You'll map the CSV columns to device fields in the next step.",
      csvHasHeader: "First row is a header",
      csvStep2Title: "Map Columns",
      csvPreviewTitle: "Preview (first 5 rows)",
      csvIgnoreColumn: "— Ignore —",
      csvDefaultCategory: "Default category",
      csvDefaultCategoryNote: "Used when no category column is mapped or a row's value doesn't match.",
      csvSelectCategory: "Select a category…",
      csvNameRequired: "Map a column to \"Name\" before importing.",
      csvCategoryRequired: "Select a default category.",
      csvImportBtn: "Import",
      csvBackBtn: "Back",
      csvImportingProgress: "Importing…",
      csvImportSuccessCount: "imported",
      csvImportErrorCount: "failed",
      csvImportAgainBtn: "Import another file",
      csvResultRow: "Row",
      csvResultStatus: "Status",
      csvResultError: "Error",
      csvFields: {
        name: "Name",
        additionalName: "Additional Name",
        manufacturer: "Manufacturer",
        modelNumber: "Model Number",
        serialNumber: "Serial Number",
        releaseYear: "Release Year",
        info: "Info / Description",
        category: "Category",
        status: "Status",
        functionalStatus: "Functional Status",
        condition: "Condition",
        rarity: "Rarity",
        isFavorite: "Is Favorite",
        isAssetTagged: "Is Asset Tagged",
        dateAcquired: "Date Acquired",
        whereAcquired: "Where Acquired",
        priceAcquired: "Price Acquired",
        estimatedValue: "Estimated Value",
        listPrice: "List Price",
        soldPrice: "Sold Price",
        soldDate: "Sold Date",
        cpu: "CPU",
        ram: "RAM",
        graphics: "Graphics",
        storage: "Storage",
        operatingSystem: "Operating System",
        isWifiEnabled: "WiFi Enabled",
        isPramBatteryRemoved: "PRAM Battery Removed",
        lastPowerOnDate: "Last Power On Date",
      },
      deviceSelectionTitle: "Device Selection",
      deviceSelectionDesc: "Used by Export Devices (ZIP) and Export CSV. Filter to narrow the list, then optionally select specific devices \u2014 or leave all selected.",
      csvExport: {
        title: "Export to CSV",
        toggleShow: "Show",
        toggleHide: "Hide",
        desc: "Export device metadata as a CSV. Pick fields, drag to reorder, and download. Images are not included. Relationships (notes, maintenance logs, accessories, links, tags, custom fields) are joined into a single cell per device using \" | \" as the separator.",
        scopeLabel: "Exporting",
        scopeSuffix: "devices (current filter + selection).",
        selectAll: "Select all fields",
        selectNone: "Select none",
        resetDefaults: "Reset to defaults",
        fieldsSelectedSuffix: "fields selected",
        showPreview: "Show preview (first 5 rows)",
        hidePreview: "Hide preview",
        downloadBtn: "Download CSV",
        pickFieldsHint: "Pick at least one field.",
        groups: {
          basics: "Basics",
          classification: "Classification",
          financial: "Acquisition & Sale",
          location: "Location & Flags",
          specs: "Specifications",
          text: "Text & Links",
          relations: "Related Items (joined)",
        },
        fieldLabels: {
          id: "ID",
          location: "Location",
          hasOriginalBox: "Has Original Box",
          historicalNotes: "Historical Notes",
          externalUrl: "External URL",
          notes: "Notes",
          maintenanceTasks: "Maintenance Tasks",
          accessories: "Accessories",
          links: "Links",
          tags: "Tags",
          customFields: "Custom Fields",
          imageCount: "Image Count",
        },
      },
    },
    print: {
      title: "Print List",
      subtitle: "Select devices to generate a printable inventory list.",
      loading: "Loading devices…",
      loadingSubtitle: "Preparing the print list",
      filterBtn: "Filter",
      generateBtn: "Generate Print View",
      backToSelection: "← Back to Selection",
      printBtn: "Print",
      selectionInfoOf: "of",
      selectionInfoDesc: "devices selected for printing. Use the Filter button to narrow down the selection.",
      collectionTitle: "Device Collection Inventory",
      generatedOn: "Generated on",
      tableOfContents: "Table of Contents",
      idHeader: "ID",
      categoryHeader: "Category",
      nameHeader: "Name",
      yearHeader: "Year",
      statusHeader: "Status",
      imagesHeader: "Images",
      tasksHeader: "Tasks",
      functionalHeader: "Functional",
      identificationSection: "Identification",
      statusValueSection: "Status & Value",
      acquisitionSection: "Acquisition",
      specificationsSection: "Specifications",
      descriptionSection: "Description",
      tagsSection: "Tags",
      maintenanceSection: "Maintenance Logs",
      manufacturerLabel: "Manufacturer:",
      modelLabel: "Model:",
      serialLabel: "Serial:",
      locationLabel: "Location:",
      assetTaggedLabel: "Asset Tagged:",
      functionalLabel: "Functional:",
      originalBoxLabel: "Original Box:",
      pramRemovedLabel: "PRAM Removed:",
      estValueLabel: "Est. Value:",
      soldPriceLabel: "Sold Price:",
      dateAcquiredLabel: "Date Acquired:",
      whereLabel: "Where:",
      pricePaidLabel: "Price Paid:",
      osLabel: "OS:",
      taskHeader: "Task",
      dateCompletedHeader: "Date Completed",
      functionalYes: "Functional",
      functionalPartial: "Partially Functional",
      functionalNo: "Not Functional",
    },
  },
  login: {
    adminLogin: "Admin Login",
    username: "Username",
    password: "Password",
    signingIn: "Signing in...",
    signIn: "Sign in",
    continueAsGuest: "Continue as guest (view only)",
    loginFailed: "Login failed",
  },
  chat: {
    title: "Collection Assistant",
    toolSearching: "Searching collection",
    toolLoadingInventory: "Loading full inventory",
    toolLoadingDevices: "Loading devices",
    toolLoadingDetails: "Loading device details",
    toolLoadingFinancials: "Loading financials",
    conversationModeExit: "Exit conversation mode",
    conversationModeStart: "Start conversation mode (hands-free)",
    unmuteVoice: "Unmute voice",
    muteVoice: "Mute voice",
    statusListening: "Listening...",
    statusSpeaking: "Speaking...",
    statusThinking: "Thinking...",
    statusConversation: "Conversation mode",
    emptyPrompt: "Ask me about your collection!",
    emptyExamplesTitle: "Try questions like:",
    example1: "\"What Macintosh computers do I have?\"",
    example2: "\"Show me devices for sale\"",
    example3: "\"What's my financial summary?\"",
    example4: "\"Find devices with 68040 CPU\"",
    stopListeningTitle: "Stop listening",
    speakQuestionTitle: "Speak your question",
    inputPlaceholderListening: "Listening...",
    inputPlaceholder: "Ask about your collection...",
    speakingStatus: "Speaking",
    speakingListenAfter: " — will listen when done",
    openAssistantTitle: "Open Collection Assistant",
    devicesCount: "devices",
    resultsCount: "results",
  },
  form: {
    templateSection: "Template",
    searchLabel: "Search",
    templateSearchPlaceholder: "Search templates (name, nickname, manufacturer, model number)",
    selectedPrefix: "Selected:",
    clearTemplate: "Clear",
    noMatchingTemplates: "No matching templates.",
    startTypingSearch: "Start typing to search templates.",
    basicInformation: "Basic Information",
    statusCondition: "Status & Condition",
    repairInformation: "Repair Information",
    additionalInformation: "Additional Information",
    additionalNameLabel: "Additional Name",
    manufacturerLabel: "Manufacturer",
    modelNumberLabel: "Model Number",
    scanBtn: "Scan",
    scanSerialTitle: "Scan Serial Number",
    lastPowerOnLabel: "Last Power On Date",
    notSet: "— Not Set —",
    favoriteLabel: "Favorite",
    assetTaggedLabel: "Asset Tagged",
    selectCategory: "Select a category",
    namePlaceholder: "e.g., Macintosh SE",
    additionalNamePlaceholder: "e.g., FDHD",
    manufacturerPlaceholder: "e.g., Apple",
    modelNumberPlaceholder: "e.g., M5011",
    locationSelect: "Location",
    locationNone: "— No Location —",
    locationCreateNew: "+ Create new location",
    whereAcquiredPlaceholder: "e.g., eBay, Estate Sale",
    repairFeeLabel: "Repair Fee Charged",
    returnedDateLabel: "Returned Date",
    donationInformation: "Donation Information",
    salesInformation: "Sales Information",
    cpuPlaceholder: "e.g., Motorola 68000 8MHz",
    ramPlaceholder: "e.g., 4MB",
    graphicsPlaceholder: 'e.g., Built-in 9" CRT',
    storagePlaceholder: "e.g., 20MB SCSI HDD",
    osPlaceholder: "e.g., System 6.0.8",
    accessoryCustomPlaceholder: "Custom accessory...",
    linkLabelPlaceholder: "Label (e.g. EveryMac)",
    linkUrlPlaceholder: "https://...",
    descriptionLabel: "Description / Notes",
    descriptionPlaceholder: "Add any additional information about this device...",
    saving: "Saving...",
    createDevice: "Create Device",
    saveChanges: "Save Changes",
    externalUrlLabel: "External URL",
  },
};
