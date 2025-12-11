/**
 * GraphQL client generation
 */
import type { GraphQLSourceConfig } from "@/core/config";
import type {
  GeneratedFile,
  GenerationContext,
  GraphQLAdapterSchema,
} from "../types";

/**
 * Generate the GraphQL client file
 */
export function generateGraphQLClient(
  _schema: GraphQLAdapterSchema,
  config: GraphQLSourceConfig,
  _context: GenerationContext,
): GeneratedFile {
  const { url } = config.schema;

  const content = `/* eslint-disable */
/* GraphQL Client - Generated once by tangen. Customize as needed. */

import { GraphQLClient } from "graphql-request"

const endpoint = "${url}"

/**
 * Returns a GraphQL client instance.
 * Customize this function to add dynamic headers (e.g., auth tokens).
 */
export const getClient = async () => {
	return new GraphQLClient(endpoint, {
		headers: {
			// Add your headers here
		},
	})
}
`;

  return {
    filename: "client.ts",
    content,
  };
}
