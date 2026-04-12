export const API_BASE_URL = typeof window !== 'undefined'
  ? window.location.origin
  : process.env.API_URL || 'http://api:4000';
export const GRAPHQL_URL = `${API_BASE_URL}/graphql`;
