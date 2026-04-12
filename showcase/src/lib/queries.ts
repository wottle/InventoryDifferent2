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
