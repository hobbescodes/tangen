/**
 * OpenAPI Source Adapter
 *
 * Implements the SourceAdapter interface for OpenAPI sources.
 * Handles spec loading, Zod schema generation, and code generation.
 */

import { generateOpenAPIClient } from "./client";
import { generateOpenAPIOperations } from "./operations";
import { loadOpenAPISpec } from "./schema";
import { generateOpenAPITypes } from "./types";

import type { OpenAPISourceConfig } from "@/core/config";
import type {
  GeneratedFile,
  GenerationContext,
  OpenAPIAdapter as IOpenAPIAdapter,
  OpenAPIAdapterSchema,
  OperationGenOptions,
  TypeGenOptions,
} from "../types";

/**
 * OpenAPI adapter implementation
 */
class OpenAPIAdapterImpl implements IOpenAPIAdapter {
  readonly type = "openapi" as const;

  /**
   * Load and parse the OpenAPI specification
   */
  async loadSchema(config: OpenAPISourceConfig): Promise<OpenAPIAdapterSchema> {
    return loadOpenAPISpec(config);
  }

  /**
   * Generate the better-fetch client file
   */
  generateClient(
    schema: OpenAPIAdapterSchema,
    config: OpenAPISourceConfig,
    context: GenerationContext,
  ): GeneratedFile {
    return generateOpenAPIClient(schema, config, context);
  }

  /**
   * Generate Zod schemas and TypeScript types from the OpenAPI spec
   */
  generateTypes(
    schema: OpenAPIAdapterSchema,
    config: OpenAPISourceConfig,
    options: TypeGenOptions,
  ): GeneratedFile {
    return generateOpenAPITypes(schema, config, options);
  }

  /**
   * Generate TanStack Query operation helpers
   */
  generateOperations(
    schema: OpenAPIAdapterSchema,
    config: OpenAPISourceConfig,
    options: OperationGenOptions,
  ): GeneratedFile {
    return generateOpenAPIOperations(schema, config, options);
  }
}

/**
 * Singleton instance of the OpenAPI adapter
 */
export const openapiAdapter = new OpenAPIAdapterImpl();

// Re-export types and utilities
export type { OpenAPIAdapterSchema };

export { extractOperations, loadOpenAPISpec } from "./schema";

export type { ParsedOperation } from "./schema";
