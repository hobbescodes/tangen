/* eslint-disable */
/* GraphQL Client - Generated once by tangrams. Customize as needed. */

import { GraphQLClient } from "graphql-request";

// Use absolute URL for SSR compatibility with MSW
const endpoint = "http://localhost:5173/graphql";

/**
 * Returns a GraphQL client instance.
 * Customize this function to add dynamic headers (e.g., auth tokens).
 */
export const getClient = async () => {
  return new GraphQLClient(endpoint, {
    headers: {
      // Add your headers here
    },
  });
};
