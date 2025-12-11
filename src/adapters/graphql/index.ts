/**
 * GraphQL Source Adapter
 *
 * Implements the SourceAdapter interface for GraphQL sources.
 * Handles schema introspection, document parsing, and code generation.
 */

import { loadDocuments } from "@/core/documents";
import { introspectSchema } from "@/core/introspection";
import { generateGraphQLClient } from "./client";
import { generateGraphQLOperations } from "./operations";
import { generateGraphQLTypes } from "./types";

import type { GraphQLSourceConfig } from "@/core/config";
import type {
  GeneratedFile,
  GenerationContext,
  GraphQLAdapterSchema,
  GraphQLAdapter as IGraphQLAdapter,
  OperationGenOptions,
  TypeGenOptions,
} from "../types";

/**
 * GraphQL adapter implementation
 */
class GraphQLAdapterImpl implements IGraphQLAdapter {
  readonly type = "graphql" as const;

  /**
   * Load the GraphQL schema via introspection and parse documents
   */
  async loadSchema(config: GraphQLSourceConfig): Promise<GraphQLAdapterSchema> {
    // Introspect the schema from the GraphQL endpoint
    const schema = await introspectSchema({
      url: config.schema.url,
      headers: config.schema.headers,
    });

    // Load and parse the GraphQL documents
    const documents = await loadDocuments(config.documents);

    return {
      schema,
      documents,
    };
  }

  /**
   * Generate the GraphQL client file
   */
  generateClient(
    schema: GraphQLAdapterSchema,
    config: GraphQLSourceConfig,
    context: GenerationContext,
  ): GeneratedFile {
    return generateGraphQLClient(schema, config, context);
  }

  /**
   * Generate TypeScript types from the schema and documents
   */
  generateTypes(
    schema: GraphQLAdapterSchema,
    config: GraphQLSourceConfig,
    options: TypeGenOptions,
  ): GeneratedFile {
    return generateGraphQLTypes(schema, config, options);
  }

  /**
   * Generate TanStack Query operation helpers
   */
  generateOperations(
    schema: GraphQLAdapterSchema,
    config: GraphQLSourceConfig,
    options: OperationGenOptions,
  ): GeneratedFile {
    return generateGraphQLOperations(schema, config, options);
  }
}

/**
 * Singleton instance of the GraphQL adapter
 */
export const graphqlAdapter = new GraphQLAdapterImpl();

// Re-export types and utilities
export type { GraphQLAdapterSchema };

export { loadDocuments } from "./documents";
export { introspectSchema } from "./schema";
