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
