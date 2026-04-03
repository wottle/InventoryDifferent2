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
};
