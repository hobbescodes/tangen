/**
 * Schema Intermediate Representation (IR)
 *
 * This module provides a validator-agnostic intermediate representation
 * for schema types. Parsers convert OpenAPI/GraphQL specs to IR, and
 * emitters convert IR to validator-specific code (Zod, Valibot, ArkType).
 */

// Parsers
export { parseGraphQLToIR } from "./graphql";
export { parseOpenAPIToIR } from "./openapi";
// Type guards
export {
  isArraySchema,
  isEnumSchema,
  isIntersectionSchema,
  isLiteralSchema,
  isNumberSchema,
  isObjectSchema,
  isRawSchema,
  isRecordSchema,
  isRefSchema,
  isStringSchema,
  isUnionSchema,
} from "./types";
// Utilities
export {
  createNamedSchema,
  extractDependencies,
  getSafePropertyName,
  ir,
  isValidIdentifier,
  makeNullable,
  makeNullish,
  toCamelCase,
  toFragmentSchemaName,
  toFragmentTypeName,
  toMutationResponseSchemaName,
  toMutationResponseTypeName,
  toMutationVariablesSchemaName,
  toMutationVariablesTypeName,
  toPascalCase,
  toQueryResponseSchemaName,
  toQueryResponseTypeName,
  toQueryVariablesSchemaName,
  toQueryVariablesTypeName,
  toSchemaName,
  topologicalSortSchemas,
} from "./utils";

export type { GraphQLIROptions } from "./graphql";
export type { OpenAPIIROptions } from "./openapi";
// Types
export type {
  ArraySchemaIR,
  BigIntSchemaIR,
  BooleanSchemaIR,
  DateSchemaIR,
  EnumSchemaIR,
  IntersectionSchemaIR,
  LiteralSchemaIR,
  ModifiedSchemaIR,
  NamedSchemaIR,
  NeverSchemaIR,
  NullSchemaIR,
  NumberSchemaIR,
  ObjectPropertyIR,
  ObjectSchemaIR,
  RawSchemaIR,
  RecordSchemaIR,
  RefSchemaIR,
  SchemaCategory,
  SchemaIR,
  SchemaIRBase,
  SchemaIRKind,
  SchemaIRResult,
  StringFormat,
  StringSchemaIR,
  TupleSchemaIR,
  UndefinedSchemaIR,
  UnionSchemaIR,
  UnknownSchemaIR,
} from "./types";
