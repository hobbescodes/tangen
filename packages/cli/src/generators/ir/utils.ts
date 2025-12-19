/**
 * IR utilities for schema generation
 *
 * Contains naming conventions, dependency extraction, and topological sorting
 */

import type { NamedSchemaIR, SchemaIR } from "./types";

// ============================================================================
// Naming Utilities
// ============================================================================

/**
 * Convert a type name to a schema variable name
 * e.g., "User" -> "userSchema", "CreateUserRequest" -> "createUserRequestSchema"
 */
export function toSchemaName(typeName: string): string {
  const camelCase = typeName.charAt(0).toLowerCase() + typeName.slice(1);
  return `${camelCase}Schema`;
}

/**
 * Convert a string to PascalCase
 * e.g., "create_user" -> "CreateUser", "create-user" -> "CreateUser"
 */
export function toPascalCase(str: string): string {
  return str
    .replace(/[-_](.)/g, (_, c) => c.toUpperCase())
    .replace(/^(.)/, (_, c) => c.toUpperCase());
}

/**
 * Convert a string to camelCase
 * e.g., "CreateUser" -> "createUser", "create_user" -> "createUser"
 */
export function toCamelCase(str: string): string {
  const pascal = toPascalCase(str);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

/**
 * Check if a property name is a valid JavaScript identifier
 * If not, it needs to be quoted in object literals
 */
export function isValidIdentifier(name: string): boolean {
  return /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(name);
}

/**
 * Get a safe property name for use in object literals
 * Quotes the name if it's not a valid identifier
 */
export function getSafePropertyName(name: string): string {
  return isValidIdentifier(name) ? name : `"${name}"`;
}

// ============================================================================
// GraphQL-specific Naming Utilities
// ============================================================================

/**
 * Convert a GraphQL operation name to a query variables schema name
 * e.g., "GetPets" -> "getPetsQueryVariablesSchema"
 */
export function toQueryVariablesSchemaName(operationName: string): string {
  return `${toCamelCase(operationName)}QueryVariablesSchema`;
}

/**
 * Convert a GraphQL operation name to a mutation variables schema name
 * e.g., "CreatePet" -> "createPetMutationVariablesSchema"
 */
export function toMutationVariablesSchemaName(operationName: string): string {
  return `${toCamelCase(operationName)}MutationVariablesSchema`;
}

/**
 * Convert a GraphQL operation name to a query response schema name
 * e.g., "GetPets" -> "getPetsQuerySchema"
 */
export function toQueryResponseSchemaName(operationName: string): string {
  return `${toCamelCase(operationName)}QuerySchema`;
}

/**
 * Convert a GraphQL operation name to a mutation response schema name
 * e.g., "CreatePet" -> "createPetMutationSchema"
 */
export function toMutationResponseSchemaName(operationName: string): string {
  return `${toCamelCase(operationName)}MutationSchema`;
}

/**
 * Convert a GraphQL fragment name to a fragment schema name
 * e.g., "PetFields" -> "petFieldsFragmentSchema"
 */
export function toFragmentSchemaName(fragmentName: string): string {
  return `${toCamelCase(fragmentName)}FragmentSchema`;
}

/**
 * Convert a GraphQL operation name to a query variables type name
 * e.g., "GetPets" -> "GetPetsQueryVariables"
 */
export function toQueryVariablesTypeName(operationName: string): string {
  return `${toPascalCase(operationName)}QueryVariables`;
}

/**
 * Convert a GraphQL operation name to a mutation variables type name
 * e.g., "CreatePet" -> "CreatePetMutationVariables"
 */
export function toMutationVariablesTypeName(operationName: string): string {
  return `${toPascalCase(operationName)}MutationVariables`;
}

/**
 * Convert a GraphQL operation name to a query response type name
 * e.g., "GetPets" -> "GetPetsQuery"
 */
export function toQueryResponseTypeName(operationName: string): string {
  return `${toPascalCase(operationName)}Query`;
}

/**
 * Convert a GraphQL operation name to a mutation response type name
 * e.g., "CreatePet" -> "CreatePetMutation"
 */
export function toMutationResponseTypeName(operationName: string): string {
  return `${toPascalCase(operationName)}Mutation`;
}

/**
 * Convert a GraphQL fragment name to a fragment type name
 * e.g., "PetFields" -> "PetFieldsFragment"
 */
export function toFragmentTypeName(fragmentName: string): string {
  return `${toPascalCase(fragmentName)}Fragment`;
}

// ============================================================================
// Dependency Extraction
// ============================================================================

/**
 * Extract schema dependencies (references to other schemas) from a SchemaIR
 */
export function extractDependencies(schema: SchemaIR): Set<string> {
  const deps = new Set<string>();

  function visit(s: SchemaIR): void {
    switch (s.kind) {
      case "ref":
        deps.add(s.name);
        break;

      case "object":
        for (const prop of Object.values(s.properties)) {
          visit(prop.schema);
        }
        if (
          s.additionalProperties &&
          typeof s.additionalProperties === "object"
        ) {
          visit(s.additionalProperties);
        }
        break;

      case "array":
        visit(s.items);
        break;

      case "tuple":
        for (const item of s.items) {
          visit(item);
        }
        break;

      case "record":
        visit(s.keyType);
        visit(s.valueType);
        break;

      case "union":
      case "intersection":
        for (const member of s.members) {
          visit(member);
        }
        break;

      // Primitives and other types don't have dependencies
      default:
        break;
    }
  }

  visit(schema);
  return deps;
}

// ============================================================================
// Topological Sort
// ============================================================================

/**
 * Topologically sort schema entries so dependencies come before dependents
 */
export function topologicalSortSchemas(
  schemas: NamedSchemaIR[],
): NamedSchemaIR[] {
  const result: NamedSchemaIR[] = [];
  const visited = new Set<string>();
  const visiting = new Set<string>(); // For cycle detection

  // Create a map for quick lookup
  const schemaMap = new Map<string, NamedSchemaIR>();
  for (const schema of schemas) {
    schemaMap.set(schema.name, schema);
  }

  function visit(name: string): void {
    if (visited.has(name)) return;
    if (visiting.has(name)) {
      // Cycle detected - just return, the schema will be emitted where it is
      return;
    }

    const schema = schemaMap.get(name);
    if (!schema) return;

    visiting.add(name);

    // Visit dependencies first
    for (const dep of schema.dependencies) {
      if (schemaMap.has(dep)) {
        visit(dep);
      }
    }

    visiting.delete(name);
    visited.add(name);
    result.push(schema);
  }

  // Visit all entries
  for (const schema of schemas) {
    visit(schema.name);
  }

  return result;
}

// ============================================================================
// Schema IR Builders
// ============================================================================

/**
 * Convenience builders for creating SchemaIR nodes
 */
export const ir = {
  string: (format?: SchemaIR extends { format?: infer F } ? F : never) =>
    ({ kind: "string", format }) as const,

  number: (integer?: boolean) => ({ kind: "number", integer }) as const,

  boolean: () => ({ kind: "boolean" }) as const,

  bigint: () => ({ kind: "bigint" }) as const,

  null: () => ({ kind: "null" }) as const,

  undefined: () => ({ kind: "undefined" }) as const,

  unknown: () => ({ kind: "unknown" }) as const,

  never: () => ({ kind: "never" }) as const,

  date: () => ({ kind: "date" }) as const,

  object: (
    properties: Record<string, { schema: SchemaIR; required: boolean }>,
    additionalProperties?: boolean | SchemaIR,
  ) =>
    ({
      kind: "object",
      properties,
      additionalProperties,
    }) as const,

  array: (items: SchemaIR) => ({ kind: "array", items }) as const,

  tuple: (items: SchemaIR[]) => ({ kind: "tuple", items }) as const,

  record: (keyType: SchemaIR, valueType: SchemaIR) =>
    ({ kind: "record", keyType, valueType }) as const,

  enum: (values: (string | number)[]) => ({ kind: "enum", values }) as const,

  literal: (value: string | number | boolean) =>
    ({ kind: "literal", value }) as const,

  union: (members: SchemaIR[]) => ({ kind: "union", members }) as const,

  intersection: (members: SchemaIR[]) =>
    ({ kind: "intersection", members }) as const,

  ref: (name: string) => ({ kind: "ref", name }) as const,

  raw: (code: string) => ({ kind: "raw", code }) as const,
};

// ============================================================================
// Schema Creation Helpers
// ============================================================================

/**
 * Create a NamedSchemaIR with automatically extracted dependencies
 */
export function createNamedSchema(
  name: string,
  schema: SchemaIR,
  category?: NamedSchemaIR["category"],
): NamedSchemaIR {
  const dependencies = extractDependencies(schema);
  // Remove self-reference
  dependencies.delete(name);

  return {
    name,
    schema,
    dependencies,
    category,
  };
}

/**
 * Wrap a schema to make it nullable (| null)
 */
export function makeNullable(schema: SchemaIR): SchemaIR {
  return {
    kind: "union",
    members: [schema, { kind: "null" }],
  };
}

/**
 * Wrap a schema to make it nullish (| null | undefined)
 * This is commonly used for optional nullable fields
 */
export function makeNullish(schema: SchemaIR): SchemaIR {
  return {
    kind: "union",
    members: [schema, { kind: "null" }, { kind: "undefined" }],
  };
}
