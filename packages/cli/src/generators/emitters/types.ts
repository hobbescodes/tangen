/**
 * Emitter types and interfaces
 *
 * Defines the interface for converting IR to validator-specific code.
 */

import type { NamedSchemaIR } from "../ir/types";

// ============================================================================
// Validator Libraries
// ============================================================================

/**
 * Supported validator libraries
 */
export type ValidatorLibrary = "zod" | "valibot" | "arktype";

// ============================================================================
// Emitter Options & Results
// ============================================================================

/**
 * Options for emitting IR to code
 */
export interface EmitterOptions {
  /**
   * Custom scalar mappings (validator-specific code strings).
   * These are passed through from GraphQL config and emitted verbatim.
   */
  customScalars?: Record<string, string>;
}

/**
 * Result of emitting IR to code
 */
export interface EmitterResult {
  /** Generated code content */
  content: string;
  /** Warnings during emission */
  warnings: string[];
}

// ============================================================================
// Emitter Interface
// ============================================================================

/**
 * Interface for converting IR to validator-specific code
 */
export interface Emitter {
  /** The library this emitter targets */
  readonly library: ValidatorLibrary;

  /**
   * Emit IR schemas to code
   * @param schemas Named schemas in dependency order
   * @param options Emitter options
   * @returns Generated code and warnings
   */
  emit(schemas: NamedSchemaIR[], options?: EmitterOptions): EmitterResult;

  /**
   * Get the import statement for this library
   * @returns Import statement string
   */
  getImportStatement(): string;

  /**
   * Get the type inference expression for a schema
   * @param schemaVarName The schema variable name (e.g., "petSchema")
   * @param typeName The type name (e.g., "Pet")
   * @returns Type export statement
   */
  getTypeInference(schemaVarName: string, typeName: string): string;
}
