// API configuration
// Uses environment variable in production, falls back to localhost for development

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
export const GRAPHQL_URL = `${API_BASE_URL}/graphql`;
