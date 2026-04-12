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

export const UPDATE_JOURNEY_PUBLISHED = gql`
  mutation UpdateJourneyPublished($id: ID!, $published: Boolean!) {
    updateJourney(id: $id, data: { published: $published }) {
      id published
    }
  }
`;

export const DELETE_JOURNEY = gql`
  mutation DeleteJourney($id: ID!) {
    deleteJourney(id: $id)
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
