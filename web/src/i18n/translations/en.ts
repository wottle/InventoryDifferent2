export type Translations = {
  status: {
    COLLECTION: string;
    FOR_SALE: string;
    PENDING_SALE: string;
    IN_REPAIR: string;
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
    functionalStatus: string;
    condition: string;
    rarity: string;
    sortBy: string;
    allCategories: string;
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
  };
};

export const en: Translations = {
  status: {
    COLLECTION: "In Collection",
    FOR_SALE: "For Sale",
    PENDING_SALE: "Pending Sale",
    IN_REPAIR: "In Repair",
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
  filter: {
    title: "Filter Devices",
    status: "Status",
    category: "Category",
    functionalStatus: "Functional Status",
    condition: "Condition",
    rarity: "Rarity",
    sortBy: "Sort By",
    allCategories: "All Categories",
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
    maintenanceTasks: "Maintenance Tasks",
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
    customFields: "Custom Fields",
    addTask: "Add Task",
    addMaintenance: "Add Maintenance",
    addNote: "Add Note",
    addPhotos: "Add Photos",
    addLink: "Add Link",
    addMaintenanceTitle: "Add Maintenance Task",
    addNoteTitle: "Add Note",
    taskLabel: "Task Label",
    dateCompleted: "Date Completed",
    costOptional: "Cost (optional)",
    noteContent: "Note Content",
    dateLabel: "Date",
    costPrefix: "Cost:",
    deleteTaskConfirm: "Delete this maintenance task?",
    deleteNoteConfirm: "Delete this note?",
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
  },
};
