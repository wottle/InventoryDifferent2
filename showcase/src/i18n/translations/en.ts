export type Translations = {
  nav: {
    journeys: string;
    timeline: string;
    about: string;
    explore: string;
  };
  footer: {
    poweredBy: string;
  };
  rarity: {
    COMMON: string;
    UNCOMMON: string;
    RARE: string;
    VERY_RARE: string;
    UNIQUE: string;
    FEATURED: string;
  };
  home: {
    startExploring: string;
    theNarrative: string;
    featuredJourney: string;
    chapterSingular: string;
    chapterPlural: string;
    readTheStory: string;
    theArchive: string;
    comingSoon: string;
    viewDetail: string;
    selectionLabel: string;
    featuredArtifacts: string;
    curatedNarratives: string;
    theJourneys: string;
    allJourneys: string;
    ctaHeading: string;
    ctaSubtext: string;
    exploreAllDevices: string;
    everyDeviceDocumented: string;
    originalPhotography: string;
  };
  journeys: {
    curatedNarratives: string;
    heading: string;
    subheading: string;
    journeysLabel: string;
    artifactsLabel: string;
    noJourneys: string;
    noJourneysSubtext: string;
    volume: string;
    published: string;
    exploreJourney: string;
  };
  journeyDetail: {
    chapter: string;
    theNarrative: string;
    viewRecord: string;
    nextStop: string;
    exploreArchive: string;
    browseTimeline: string;
    allJourneys: string;
  };
  timeline: {
    chronologicalCatalog: string;
    heading: string;
    allEras: string;
    historicalEras: string;
    categoryFilter: string;
    curatorsNote: string;
    noDevices: string;
    noDevicesSubtext: string;
    viewRecord: string;
    loadMore: string;
    eraFoundation: string;
    eraSculley: string;
    eraInterim: string;
    eraReturn: string;
    eraModern: string;
  };
  admin: {
    adminLabel: string;
    siteTitle: string;
    viewSite: string;
    logout: string;
    navJourneys: string;
    navQuotes: string;
    navAppearance: string;
    navData: string;
  };
  adminLogin: {
    title: string;
    subtitle: string;
    usernameLabel: string;
    usernamePlaceholder: string;
    passwordLabel: string;
    passwordPlaceholder: string;
    signingIn: string;
    signIn: string;
  };
  adminJourneys: {
    title: string;
    newJourney: string;
    published: string;
    draft: string;
    chapterSingular: string;
    chapterPlural: string;
    deviceSingular: string;
    devicePlural: string;
    edit: string;
    delete: string;
    emptyTitle: string;
    emptySubtext: string;
  };
  adminQuotes: {
    title: string;
    subtitle: string;
    defaultQuotesSection: string;
    yourQuotesSection: string;
    addQuoteSection: string;
    noDefaultQuotes: string;
    noCustomQuotes: string;
    authorLabel: string;
    sourceLabel: string;
    textLabel: string;
    authorPlaceholder: string;
    sourcePlaceholder: string;
    textPlaceholder: string;
    saving: string;
    saveQuote: string;
    enabled: string;
    disabled: string;
    delete: string;
    errorUpdate: string;
    errorDelete: string;
    errorRequired: string;
    errorSave: string;
  };
  adminAppearance: {
    title: string;
    subtitle: string;
    saved: string;
    siteIdentitySection: string;
    siteTitleLabel: string;
    taglineLabel: string;
    bioTextLabel: string;
    homepageSection: string;
    narrativeStatementLabel: string;
    narrativeStatementHint: string;
    collectionOverviewLabel: string;
    collectionOverviewHint: string;
    timelineSection: string;
    curatorsNoteLabel: string;
    heroImageSection: string;
    replaceImage: string;
    uploadImage: string;
    uploading: string;
    accentColorSection: string;
    accentColorHint: string;
    saving: string;
    saveChanges: string;
    errorImageUpload: string;
    errorAccentColor: string;
    errorSave: string;
  };
  adminData: {
    title: string;
    subtitle: string;
    exportSection: string;
    exportDesc: string;
    exporting: string;
    exportBtn: string;
    importSection: string;
    importDesc: string;
    importing: string;
    importBtn: string;
    importComplete: string;
    errorInvalidJson: string;
    journeySingular: string;
    journeyPlural: string;
    chapterSingular: string;
    chapterPlural: string;
    deviceLinkedSingular: string;
    deviceLinkedPlural: string;
    deviceSkippedSingular: string;
    deviceSkippedPlural: string;
    quoteSingular: string;
    quotePlural: string;
    devicesSkippedNote: string;
    missingImagesSingular: string;
    missingImagesPlural: string;
  };
  adminJourneyEditor: {
    allJourneys: string;
    titlePlaceholder: string;
    published: string;
    draft: string;
    unpublish: string;
    publish: string;
    saving: string;
    createJourney: string;
    save: string;
    journeyDetails: string;
    urlSlugLabel: string;
    slugPlaceholder: string;
    descriptionLabel: string;
    descriptionPlaceholder: string;
    coverImageLabel: string;
    publishImmediately: string;
    statsSection: string;
    chaptersLabel: string;
    devicesLabel: string;
    featuredLabel: string;
    publishedLabel: string;
    journeyIdSection: string;
    chaptersHeader: string;
    addChapter: string;
    createFirst: string;
    noChapters: string;
    noChaptersSubtext: string;
    chapterTitlePlaceholder: string;
    chapterDescPlaceholder: string;
    deviceSingular: string;
    devicePlural: string;
    addDeviceBtn: string;
    saveChapterFirst: string;
    addDeviceModalTitle: string;
    searchPlaceholder: string;
    noDevicesFound: string;
    addBtn: string;
    moveUp: string;
    moveDown: string;
    deleteChapterTitle: string;
    removeDeviceTitle: string;
    curatorsNotePlaceholder: string;
    feature: string;
    unfeature: string;
    uploading: string;
    titleSlugRequired: string;
    volumeNumberLabel: string;
    volumeNumberHint: string;
    autoVolumePreview: string;
  };
  common: {
    share: string;
    postOnX: string;
    shareOnFacebook: string;
    copyLink: string;
    copied: string;
  };
};

export const en: Translations = {
  nav: {
    journeys: 'Journeys',
    timeline: 'Timeline',
    about: 'About',
    explore: 'Explore',
  },
  footer: {
    poweredBy: 'Powered by ',
  },
  rarity: {
    COMMON: 'Common',
    UNCOMMON: 'Uncommon',
    RARE: 'Rare',
    VERY_RARE: 'Very Rare',
    UNIQUE: 'Unique',
    FEATURED: 'Featured',
  },
  home: {
    startExploring: 'Start Exploring',
    theNarrative: 'The Narrative',
    featuredJourney: 'Featured Journey',
    chapterSingular: 'chapter',
    chapterPlural: 'chapters',
    readTheStory: 'Read the story',
    theArchive: 'The Archive',
    comingSoon: 'Curated Journeys Coming Soon',
    viewDetail: 'View Detail',
    selectionLabel: 'Selection 01',
    featuredArtifacts: 'Featured Artifacts',
    curatedNarratives: 'Curated Narratives',
    theJourneys: 'The Journeys',
    allJourneys: 'All Journeys',
    ctaHeading: 'Ready for a deeper dive into the vault?',
    ctaSubtext: 'Browse the full timeline of every device in the collection — filterable by era, category, and condition.',
    exploreAllDevices: 'Explore All Devices',
    everyDeviceDocumented: 'Every device documented',
    originalPhotography: 'Original photography',
  },
  journeys: {
    curatedNarratives: 'Curated Narratives',
    heading: 'Digital\u00a0Histories.',
    subheading: 'A chronological odyssey through the platinum and polycarbonate that defined an era.',
    journeysLabel: 'Journeys',
    artifactsLabel: 'Artifacts',
    noJourneys: 'No journeys published yet.',
    noJourneysSubtext: 'Check back soon for curated narratives.',
    volume: 'Volume',
    published: 'Published',
    exploreJourney: 'Explore Journey →',
  },
  journeyDetail: {
    chapter: 'Chapter',
    theNarrative: 'The Narrative',
    viewRecord: 'View Record →',
    nextStop: 'Next Stop',
    exploreArchive: 'Explore the Full Archive',
    browseTimeline: 'Browse Timeline',
    allJourneys: 'All Journeys',
  },
  timeline: {
    chronologicalCatalog: 'Chronological Catalog',
    heading: 'The Timeline',
    allEras: 'All Eras',
    historicalEras: 'Historical Eras',
    categoryFilter: 'Category Filter',
    curatorsNote: "Curator's Note",
    noDevices: 'No devices found',
    noDevicesSubtext: 'Try adjusting your filters to see more results.',
    viewRecord: 'View Record',
    loadMore: 'Load More Artifacts',
    eraFoundation: 'The Foundation',
    eraSculley: 'The Sculley Years',
    eraInterim: 'The Interim',
    eraReturn: 'The Return',
    eraModern: 'Modern Era',
  },
  admin: {
    adminLabel: 'Admin',
    siteTitle: 'The Collection',
    viewSite: 'View Site',
    logout: 'Logout',
    navJourneys: 'Journeys',
    navQuotes: 'Quotes',
    navAppearance: 'Appearance',
    navData: 'Data',
  },
  adminLogin: {
    title: 'The Collection',
    subtitle: 'Admin Access',
    usernameLabel: 'Username',
    usernamePlaceholder: 'Enter username',
    passwordLabel: 'Password',
    passwordPlaceholder: 'Enter password',
    signingIn: 'Signing in\u2026',
    signIn: 'Sign In',
  },
  adminJourneys: {
    title: 'Journeys',
    newJourney: '+ New Journey',
    published: 'Published',
    draft: 'Draft',
    chapterSingular: 'chapter',
    chapterPlural: 'chapters',
    deviceSingular: 'device',
    devicePlural: 'devices',
    edit: 'Edit',
    delete: 'Delete',
    emptyTitle: 'No journeys yet.',
    emptySubtext: 'Create your first journey to get started.',
  },
  adminQuotes: {
    title: 'Quotes',
    subtitle: 'Manage the quotes shown throughout the site. Enable or disable individual quotes.',
    defaultQuotesSection: 'Default Quotes',
    yourQuotesSection: 'Your Quotes',
    addQuoteSection: 'Add Quote',
    noDefaultQuotes: 'No default quotes.',
    noCustomQuotes: 'No custom quotes yet. Add one below.',
    authorLabel: 'Author',
    sourceLabel: 'Source',
    textLabel: 'Text',
    authorPlaceholder: 'e.g. Steve Jobs',
    sourcePlaceholder: 'e.g. WWDC 1997',
    textPlaceholder: 'Enter the quote text\u2026',
    saving: 'Saving\u2026',
    saveQuote: 'Save Quote',
    enabled: 'Enabled',
    disabled: 'Disabled',
    delete: 'Delete',
    errorUpdate: 'Failed to update quote. Please try again.',
    errorDelete: 'Failed to delete quote. Please try again.',
    errorRequired: 'Author and text are required.',
    errorSave: 'Failed to save quote.',
  },
  adminAppearance: {
    title: 'Appearance',
    subtitle: "Customize your site's title, copy, and visual identity.",
    saved: 'Saved!',
    siteIdentitySection: 'Site Identity',
    siteTitleLabel: 'Site Title',
    taglineLabel: 'Tagline',
    bioTextLabel: 'Bio Text',
    homepageSection: 'Homepage',
    narrativeStatementLabel: 'Narrative Statement',
    narrativeStatementHint: 'The large bold heading in the \u201cThe Narrative\u201d section.',
    collectionOverviewLabel: 'Collection Overview',
    collectionOverviewHint: 'The body text in the right column of the narrative section.',
    timelineSection: 'Timeline',
    curatorsNoteLabel: "Curator's Note",
    heroImageSection: 'Hero Image',
    replaceImage: 'Replace Image',
    uploadImage: 'Upload Image',
    uploading: 'Uploading\u2026',
    accentColorSection: 'Accent Color',
    accentColorHint: 'Used for highlights and interactive elements',
    saving: 'Saving\u2026',
    saveChanges: 'Save Changes',
    errorImageUpload: 'Image upload failed. Please try again.',
    errorAccentColor: 'Accent color must be a valid 6-digit hex color (e.g. #6750A4).',
    errorSave: 'Failed to save. Please try again.',
  },
  adminData: {
    title: 'Showcase Data',
    subtitle: 'Export and import your showcase configuration \u2014 appearance settings, quotes, and journeys.',
    exportSection: 'Export',
    exportDesc: 'Downloads a ZIP file containing all appearance settings, quotes, and journeys — plus any uploaded images (hero image and journey covers).',
    exporting: 'Exporting\u2026',
    exportBtn: 'Export Showcase Data',
    importSection: 'Import',
    importDesc: 'Imports appearance, quotes, and journeys from a previously exported ZIP or JSON file. Journeys are matched by slug \u2014 existing journeys with the same slug are updated, new slugs are created. Devices not found in this system are silently dropped from chapters.',
    importing: 'Importing\u2026',
    importBtn: 'Import Showcase Data',
    importComplete: 'Import complete',
    errorInvalidJson: 'File is not valid JSON',
    journeySingular: 'journey',
    journeyPlural: 'journeys',
    chapterSingular: 'chapter',
    chapterPlural: 'chapters',
    deviceLinkedSingular: 'device assignment linked',
    deviceLinkedPlural: 'device assignments linked',
    deviceSkippedSingular: 'device assignment skipped (not found in this system)',
    deviceSkippedPlural: 'device assignments skipped (not found in this system)',
    quoteSingular: 'quote',
    quotePlural: 'quotes',
    devicesSkippedNote: 'skipped (not found in this system)',
    missingImagesSingular: 'image was not found in the export and has been cleared — re-upload it from the Appearance page.',
    missingImagesPlural: 'images were not found in the export and have been cleared — re-upload them from the Appearance page.',
  },
  adminJourneyEditor: {
    allJourneys: '\u2190 All Journeys',
    titlePlaceholder: 'Journey Title',
    published: 'Published',
    draft: 'Draft',
    unpublish: 'Unpublish',
    publish: 'Publish',
    saving: 'Saving\u2026',
    createJourney: 'Create Journey',
    save: 'Save',
    journeyDetails: 'Journey Details',
    urlSlugLabel: 'URL Slug',
    slugPlaceholder: 'my-journey-slug',
    descriptionLabel: 'Description',
    descriptionPlaceholder: 'A short description of this journey...',
    coverImageLabel: 'Cover Image',
    publishImmediately: 'Publish immediately',
    statsSection: 'Stats',
    chaptersLabel: 'Chapters',
    devicesLabel: 'Devices',
    featuredLabel: 'Featured',
    publishedLabel: 'Published',
    journeyIdSection: 'Journey ID',
    chaptersHeader: 'Chapters',
    addChapter: '+ Add Chapter',
    createFirst: 'Create the journey first, then you can add chapters and devices.',
    noChapters: 'No chapters yet.',
    noChaptersSubtext: 'Add a chapter to start building this journey.',
    chapterTitlePlaceholder: 'Chapter title',
    chapterDescPlaceholder: 'Chapter description (optional)',
    deviceSingular: 'device',
    devicePlural: 'devices',
    addDeviceBtn: 'Add device to this chapter',
    saveChapterFirst: 'Save chapter title to add devices',
    addDeviceModalTitle: 'Add Device',
    searchPlaceholder: 'Search by name, manufacturer, year...',
    noDevicesFound: 'No devices found.',
    addBtn: 'Add',
    moveUp: 'Move up',
    moveDown: 'Move down',
    deleteChapterTitle: 'Delete chapter',
    removeDeviceTitle: 'Remove device',
    curatorsNotePlaceholder: 'Curator note (optional)',
    feature: 'Feature',
    unfeature: 'Unfeature',
    uploading: 'Uploading\u2026',
    titleSlugRequired: 'Title and slug are required.',
    volumeNumberLabel: 'Volume Number',
    volumeNumberHint: 'Leave blank to auto-assign based on publish date',
    autoVolumePreview: 'Will show as',
  },
  common: {
    share: 'Share',
    postOnX: 'Post on X',
    shareOnFacebook: 'Share on Facebook',
    copyLink: 'Copy link',
    copied: 'Copied!',
  },
};
