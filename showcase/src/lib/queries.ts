import { gql } from 'graphql-tag';

export const GET_SHOWCASE_CONFIG = gql`
  query GetShowcaseConfig {
    showcaseConfig {
      id
      siteTitle
      tagline
      bioText
      heroImagePath
      accentColor
      timelineCuratorNote
    }
  }
`;

export const GET_SHOWCASE_JOURNEYS = gql`
  query GetShowcaseJourneys {
    showcaseJourneys {
      id
      title
      slug
      description
      coverImagePath
      sortOrder
      published
      chapters {
        id
        title
        sortOrder
      }
    }
  }
`;

export const GET_FEATURED_DEVICES = gql`
  query GetFeaturedDevices {
    showcaseFeaturedDevices {
      id
      curatorNote
      isFeatured
      device {
        id
        name
        manufacturer
        releaseYear
        info
        rarity
        images {
          thumbnailPath
        }
      }
    }
  }
`;

export const GET_ALL_SHOWCASE_JOURNEYS = gql`
  query GetAllShowcaseJourneys {
    showcaseJourneys {
      id
      title
      slug
      description
      coverImagePath
      sortOrder
      published
      chapters {
        id
        devices {
          id
        }
      }
    }
  }
`;

export const GET_SHOWCASE_JOURNEY_BY_SLUG = gql`
  query GetShowcaseJourneyBySlug($slug: String!) {
    showcaseJourney(slug: $slug) {
      id
      title
      slug
      description
      coverImagePath
      published
      sortOrder
      chapters {
        id
        title
        description
        sortOrder
        devices {
          id
          curatorNote
          sortOrder
          isFeatured
          device {
            id
            name
            manufacturer
            releaseYear
            rarity
            info
            images {
              thumbnailPath
            }
          }
        }
      }
    }
  }
`;

export const GET_TIMELINE_DATA = gql`
  query GetTimelineData {
    showcaseConfig {
      timelineCuratorNote
    }
    showcaseJourneys {
      id
      title
      slug
      published
      chapters {
        devices {
          id
          isFeatured
          device {
            id
            name
            manufacturer
            releaseYear
            info
            rarity
            category {
              name
              type
            }
            images {
              thumbnailPath
            }
          }
        }
      }
    }
  }
`;

export const GET_SHOWCASE_QUOTES = gql`
  query GetShowcaseQuotes {
    showcaseQuotes {
      id
      author
      text
      source
      isDefault
      isEnabled
    }
  }
`;

export const GET_ALL_SHOWCASE_JOURNEYS_ADMIN = gql`
  query GetAllShowcaseJourneysAdmin {
    showcaseAllJourneys {
      id title slug description coverImagePath sortOrder published
      chapters {
        id title
        devices { id }
      }
    }
  }
`;

export const DELETE_JOURNEY = gql`
  mutation DeleteJourney($id: ID!) {
    deleteJourney(id: $id)
  }
`;

export const GET_ALL_JOURNEYS_FOR_EDIT = gql`
  query GetAllJourneysForEdit {
    showcaseAllJourneys {
      id title slug description coverImagePath sortOrder published
      chapters {
        id title description sortOrder
        devices {
          id curatorNote sortOrder isFeatured
          device { id name manufacturer releaseYear images { thumbnailPath } }
        }
      }
    }
  }
`;

export const CREATE_JOURNEY = gql`
  mutation CreateJourney($input: JourneyInput!) {
    createJourney(input: $input) {
      id title slug
    }
  }
`;

export const UPDATE_JOURNEY = gql`
  mutation UpdateJourney($id: ID!, $input: JourneyInput!) {
    updateJourney(id: $id, input: $input) {
      id title slug description sortOrder published
    }
  }
`;

export const UPSERT_CHAPTER = gql`
  mutation UpsertChapter($input: ChapterInput!) {
    upsertChapter(input: $input) {
      id title description sortOrder
    }
  }
`;

export const DELETE_CHAPTER = gql`
  mutation DeleteChapter($id: ID!) {
    deleteChapter(id: $id)
  }
`;

export const UPSERT_SHOWCASE_DEVICE = gql`
  mutation UpsertShowcaseDevice($input: ShowcaseDeviceInput!) {
    upsertShowcaseDevice(input: $input) {
      id curatorNote isFeatured sortOrder
      device { id name manufacturer releaseYear images { thumbnailPath } }
    }
  }
`;

export const REMOVE_SHOWCASE_DEVICE = gql`
  mutation RemoveShowcaseDevice($id: ID!) {
    removeShowcaseDevice(id: $id)
  }
`;

export const SEARCH_DEVICES_FOR_SHOWCASE = gql`
  query SearchDevicesForShowcase {
    devices {
      id name manufacturer releaseYear
      images { thumbnailPath }
    }
  }
`;

export const UPSERT_SHOWCASE_QUOTE = gql`
  mutation UpsertShowcaseQuote($input: ShowcaseQuoteInput!) {
    upsertShowcaseQuote(input: $input) {
      id
      author
      text
      source
      isDefault
      isEnabled
    }
  }
`;

export const DELETE_SHOWCASE_QUOTE = gql`
  mutation DeleteShowcaseQuote($id: ID!) {
    deleteShowcaseQuote(id: $id)
  }
`;

export const UPSERT_SHOWCASE_CONFIG = gql`
  mutation UpsertShowcaseConfig($input: ShowcaseConfigInput!) {
    upsertShowcaseConfig(input: $input) {
      id
      siteTitle
      tagline
      bioText
      heroImagePath
      accentColor
      timelineCuratorNote
    }
  }
`;

export const GET_SHOWCASE_DEVICE = gql`
  query GetShowcaseDevice($id: Int!) {
    device(where: { id: $id }) {
      id
      name
      additionalName
      manufacturer
      releaseYear
      modelNumber
      serialNumber
      condition
      functionalStatus
      hasOriginalBox
      isWifiEnabled
      isPramBatteryRemoved
      info
      cpu
      ram
      storage
      graphics
      operatingSystem
      externalUrl
      rarity
      location { id name }
      dateAcquired
      category { name type }
      images { id path thumbnailPath caption isThumbnail }
      maintenanceTasks { id label dateCompleted notes }
      notes { id content date }
    }
  }
`;
