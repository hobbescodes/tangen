/**
 * GraphQL Collection Discovery and Generation
 *
 * Discovers entities from GraphQL schemas/documents for TanStack DB collection generation.
 * Identifies list queries, CRUD mutations, and key fields automatically.
 * Supports on-demand sync mode with predicate push-down.
 */

import {
  GraphQLList,
  GraphQLNonNull,
  isObjectType,
  isScalarType,
} from "graphql";

import {
  generatePredicateTranslator,
  getPredicateImports,
  needsPredicateTranslation,
} from "@/generators/predicates";
import { toCamelCase, toPascalCase } from "@/utils/naming";
import {
  analyzeGraphQLQueryCapabilities,
  hasQueryCapabilities,
  inferPredicateMappingPreset,
} from "./analysis";

import type {
  GraphQLField,
  GraphQLObjectType,
  GraphQLOutputType,
  GraphQLSchema,
} from "graphql";
import type { CollectionOverrideConfig } from "@/core/config";
import type { ParsedDocuments, ParsedOperation } from "@/core/documents";
import type {
  CollectionDiscoveryResult,
  CollectionEntity,
  CollectionGenOptions,
  CollectionMutation,
  GeneratedFile,
  GraphQLAdapterSchema,
} from "../types";

/** Hardcoded import path for functions (always ../functions from db/) */
const FUNCTIONS_IMPORT_PATH = "../functions";

/**
 * Discover entities from a GraphQL schema for collection generation
 */
export function discoverGraphQLEntities(
  schema: GraphQLAdapterSchema,
  overrides?: Record<string, CollectionOverrideConfig>,
): CollectionDiscoveryResult {
  const warnings: string[] = [];
  const entities: CollectionEntity[] = [];

  // Get list queries from schema's Query type
  const queryType = schema.schema.getQueryType();
  if (!queryType) {
    warnings.push("No Query type found in schema");
    return { entities, warnings };
  }

  // Find all queries that return list types
  const listQueries = findListQueries(queryType, schema.documents);

  for (const { field, typeName, operation } of listQueries) {
    const entity = discoverEntityFromListQuery(
      field,
      typeName,
      operation,
      schema.schema,
      schema.documents,
      overrides,
      warnings,
    );

    if (entity) {
      // Check for duplicate entities (same type from different queries)
      const existing = entities.find((e) => e.typeName === entity.typeName);
      if (!existing) {
        entities.push(entity);
      }
    }
  }

  return { entities, warnings };
}

/**
 * Find all queries that return list types
 */
function findListQueries(
  queryType: GraphQLObjectType,
  documents: ParsedDocuments,
): Array<{
  field: GraphQLField<unknown, unknown>;
  typeName: string;
  operation: ParsedOperation;
}> {
  const results: Array<{
    field: GraphQLField<unknown, unknown>;
    typeName: string;
    operation: ParsedOperation;
  }> = [];

  const fields = queryType.getFields();

  for (const [fieldName, field] of Object.entries(fields)) {
    // Check if this field returns a list type
    const { isList, itemTypeName } = analyzeReturnType(field.type);

    if (isList && itemTypeName) {
      // Find the corresponding document operation
      const operation = documents.operations.find(
        (op) =>
          op.operation === "query" &&
          // Match by field name in the selection set
          op.node.selectionSet.selections.some(
            (sel) =>
              sel.kind === "Field" &&
              (sel.alias?.value || sel.name.value) === fieldName,
          ),
      );

      if (operation) {
        results.push({
          field,
          typeName: itemTypeName,
          operation,
        });
      }
    }
  }

  return results;
}

/**
 * Analyze a GraphQL return type to determine if it's a list and extract the item type
 */
function analyzeReturnType(type: GraphQLOutputType): {
  isList: boolean;
  itemTypeName: string | null;
} {
  // Unwrap NonNull
  let unwrapped = type;
  if (unwrapped instanceof GraphQLNonNull) {
    unwrapped = unwrapped.ofType;
  }

  // Check if it's a list
  if (unwrapped instanceof GraphQLList) {
    // Get the item type
    let itemType = unwrapped.ofType;
    if (itemType instanceof GraphQLNonNull) {
      itemType = itemType.ofType;
    }

    if (isObjectType(itemType)) {
      return { isList: true, itemTypeName: itemType.name };
    }
  }

  return { isList: false, itemTypeName: null };
}

/**
 * Discover an entity from a list query
 */
function discoverEntityFromListQuery(
  field: GraphQLField<unknown, unknown>,
  typeName: string,
  operation: ParsedOperation,
  graphqlSchema: GraphQLSchema,
  documents: ParsedDocuments,
  overrides?: Record<string, CollectionOverrideConfig>,
  warnings: string[] = [],
): CollectionEntity | null {
  // Get the GraphQL type
  const type = graphqlSchema.getType(typeName);
  if (!type || !isObjectType(type)) {
    warnings.push(`Could not find object type ${typeName} in schema`);
    return null;
  }

  // Get overrides for this entity
  const entityOverrides = overrides?.[typeName];

  // Find key field
  const keyFieldOverride = entityOverrides?.keyField;
  const { keyField, keyFieldType } = findKeyField(
    type,
    keyFieldOverride,
    warnings,
    typeName,
  );

  if (!keyField) {
    warnings.push(
      `Could not find key field for entity ${typeName} - skipping collection generation`,
    );
    return null;
  }

  // Find CRUD mutations for this entity
  const mutations = findCrudMutations(typeName, documents, graphqlSchema);

  // Analyze query field for filter/sort/pagination capabilities
  const queryCapabilities = analyzeGraphQLQueryCapabilities(field);

  // Check for syncMode override and warn if on-demand but no capabilities
  const syncMode = entityOverrides?.syncMode;
  if (syncMode === "on-demand" && !hasQueryCapabilities(queryCapabilities)) {
    warnings.push(
      `Entity "${typeName}" configured for on-demand sync, but no filtering arguments detected on the query field. Collection will fetch all data regardless of predicates.`,
    );
  }

  // Determine variables type name if query has arguments
  const hasArgs = field.args.length > 0;
  const variablesTypeName = hasArgs
    ? `${toPascalCase(operation.name)}QueryVariables`
    : undefined;

  // Infer predicate mapping from capabilities if not explicitly configured
  const detectedPreset = inferPredicateMappingPreset(queryCapabilities);

  return {
    name: typeName,
    typeName: toPascalCase(typeName),
    keyField,
    keyFieldType,
    listQuery: {
      operationName: operation.name,
      queryKey: [typeName],
      paramsTypeName: variablesTypeName,
    },
    mutations,
    // On-demand mode properties
    syncMode,
    predicateMapping: entityOverrides?.predicateMapping ?? detectedPreset,
    filterCapabilities: queryCapabilities.filter,
    sortCapabilities: queryCapabilities.sort,
    paginationCapabilities: queryCapabilities.pagination,
  };
}

/**
 * Find the key field in a GraphQL object type
 */
function findKeyField(
  type: GraphQLObjectType,
  override?: string,
  warnings: string[] = [],
  typeName?: string,
): { keyField: string | null; keyFieldType: string } {
  const fields = type.getFields();

  // Use override if provided
  if (override) {
    if (fields[override]) {
      const field = fields[override];
      return {
        keyField: override,
        keyFieldType: getTypeScriptType(field.type),
      };
    }
    warnings.push(
      `Configured keyField '${override}' not found in type ${typeName || "unknown"}`,
    );
  }

  // Look for 'id' field with ID scalar type (common GraphQL pattern)
  if (fields.id) {
    const idField = fields.id;
    const idType = unwrapType(idField.type);
    if (isScalarType(idType) && idType.name === "ID") {
      return { keyField: "id", keyFieldType: "string" };
    }
  }

  // Look for common key field names
  const keyFieldCandidates = ["id", "_id", "uuid", "key"];

  for (const candidate of keyFieldCandidates) {
    if (fields[candidate]) {
      const field = fields[candidate];
      return {
        keyField: candidate,
        keyFieldType: getTypeScriptType(field.type),
      };
    }
  }

  return { keyField: null, keyFieldType: "string" };
}

/**
 * Unwrap NonNull and List types to get the underlying type
 */
function unwrapType(type: GraphQLOutputType): GraphQLOutputType {
  if (type instanceof GraphQLNonNull || type instanceof GraphQLList) {
    return unwrapType(type.ofType);
  }
  return type;
}

/**
 * Get TypeScript type from GraphQL type
 */
function getTypeScriptType(type: GraphQLOutputType): string {
  const unwrapped = unwrapType(type);

  if (isScalarType(unwrapped)) {
    switch (unwrapped.name) {
      case "Int":
      case "Float":
        return "number";
      case "Boolean":
        return "boolean";
      default:
        return "string";
    }
  }

  return "string";
}

/**
 * Find CRUD mutations for an entity by naming convention
 */
function findCrudMutations(
  typeName: string,
  documents: ParsedDocuments,
  _schema: GraphQLSchema,
): CollectionMutation[] {
  const mutations: CollectionMutation[] = [];
  const typeNameLower = typeName.toLowerCase();

  // Get all mutation operations from documents
  const mutationOps = documents.operations.filter(
    (op) => op.operation === "mutation",
  );

  for (const mutation of mutationOps) {
    const nameLower = mutation.name.toLowerCase();

    // Check for create/insert mutation
    if (nameLower.startsWith("create") && nameLower.includes(typeNameLower)) {
      mutations.push({
        type: "insert",
        operationName: mutation.name,
        inputTypeName: `${toPascalCase(mutation.name)}Variables`,
      });
    }

    // Check for update mutation
    if (nameLower.startsWith("update") && nameLower.includes(typeNameLower)) {
      mutations.push({
        type: "update",
        operationName: mutation.name,
        inputTypeName: `${toPascalCase(mutation.name)}Variables`,
      });
    }

    // Check for delete mutation
    if (
      (nameLower.startsWith("delete") || nameLower.startsWith("remove")) &&
      nameLower.includes(typeNameLower)
    ) {
      mutations.push({
        type: "delete",
        operationName: mutation.name,
      });
    }
  }

  return mutations;
}

// =============================================================================
// Code Generation
// =============================================================================

/**
 * Generate TanStack DB collection options code for GraphQL
 */
export function generateGraphQLCollections(
  entities: CollectionEntity[],
  options: CollectionGenOptions,
): GeneratedFile {
  const lines: string[] = [];

  // Check if any entities need predicate translation (on-demand mode)
  const hasOnDemandEntities = entities.some(needsPredicateTranslation);

  // External imports (sorted alphabetically by package)
  lines.push(
    'import { queryCollectionOptions } from "@tanstack/query-db-collection"',
  );
  if (hasOnDemandEntities) {
    lines.push(getPredicateImports());
  }
  lines.push('import { createCollection } from "@tanstack/react-db"');

  // Internal imports (sorted alphabetically)
  const queryFnImports = entities.map(
    (e) => `${toCamelCase(e.listQuery.operationName)}`,
  );
  const mutationFnImports = entities.flatMap((e) =>
    e.mutations.map((m) => `${toCamelCase(m.operationName)}`),
  );
  const allFunctionImports = [
    ...new Set([...queryFnImports, ...mutationFnImports]),
  ].sort();

  if (allFunctionImports.length > 0) {
    lines.push("");
    lines.push(
      `import { ${allFunctionImports.join(", ")} } from "${FUNCTIONS_IMPORT_PATH}"`,
    );
  }

  // Type imports (sorted alphabetically, always last with blank line)
  const typeImports: string[] = ["QueryClient"];

  // Import variables types for on-demand entities (these are actually used in predicate translators)
  const variablesTypeNames = entities
    .filter(needsPredicateTranslation)
    .map((e) => e.listQuery.paramsTypeName)
    .filter((name): name is string => !!name)
    .sort();

  lines.push("");
  lines.push(
    `import type { ${typeImports.join(", ")} } from "@tanstack/react-query"`,
  );

  if (variablesTypeNames.length > 0) {
    lines.push(
      `import type { ${variablesTypeNames.join(", ")} } from "${options.typesImportPath}"`,
    );
  }

  lines.push("");

  // Generate predicate translators for on-demand entities
  for (const entity of entities) {
    if (needsPredicateTranslation(entity)) {
      lines.push(
        generatePredicateTranslator(
          entity,
          entity.listQuery.paramsTypeName,
          "graphql",
        ),
      );
      lines.push("");
    }
  }

  // Generate collection options for each entity
  for (const entity of entities) {
    lines.push(generateEntityCollectionOptions(entity, options));
    lines.push("");
  }

  return {
    filename: "collections.ts",
    content: lines.join("\n"),
  };
}

/**
 * Generate collection options for a single entity
 */
function generateEntityCollectionOptions(
  entity: CollectionEntity,
  _options: CollectionGenOptions,
): string {
  const lines: string[] = [];
  const collectionName = `${toCamelCase(entity.name)}CollectionOptions`;
  const listQueryFn = `${toCamelCase(entity.listQuery.operationName)}`;
  const isOnDemand = needsPredicateTranslation(entity);
  const translatorFn = `translate${entity.name}Predicates`;

  lines.push("/**");
  lines.push(` * Collection options for ${entity.name}`);
  if (isOnDemand) {
    lines.push(` * @remarks Uses on-demand sync mode with predicate push-down`);
  }
  lines.push(" */");
  lines.push(`export const ${collectionName} = (queryClient: QueryClient) =>`);
  lines.push(`  createCollection(`);
  lines.push(`    queryCollectionOptions({`);
  lines.push(`      queryKey: ${JSON.stringify(entity.listQuery.queryKey)},`);

  // Generate queryFn based on sync mode
  if (isOnDemand) {
    lines.push(`      syncMode: "on-demand",`);
    lines.push(`      queryFn: async (ctx) => {`);
    lines.push(
      `        const variables = ${translatorFn}(ctx.meta?.loadSubsetOptions)`,
    );
    lines.push(`        return ${listQueryFn}(variables)`);
    lines.push(`      },`);
  } else {
    lines.push(`      queryFn: async () => ${listQueryFn}(),`);
  }

  lines.push(`      queryClient,`);
  lines.push(`      getKey: (item) => item.${entity.keyField},`);

  // Add persistence handlers for mutations
  const insertMutation = entity.mutations.find((m) => m.type === "insert");
  const updateMutation = entity.mutations.find((m) => m.type === "update");
  const deleteMutation = entity.mutations.find((m) => m.type === "delete");

  if (insertMutation) {
    const insertFn = toCamelCase(insertMutation.operationName);
    lines.push(`      onInsert: async ({ transaction }) => {`);
    lines.push(
      `        await Promise.all(transaction.mutations.map((m) => ${insertFn}({ input: m.modified })))`,
    );
    lines.push(`      },`);
  }

  if (updateMutation) {
    const updateFn = toCamelCase(updateMutation.operationName);
    lines.push(`      onUpdate: async ({ transaction }) => {`);
    lines.push(
      `        await Promise.all(transaction.mutations.map((m) => ${updateFn}({ ${entity.keyField}: m.original.${entity.keyField}, input: m.changes })))`,
    );
    lines.push(`      },`);
  }

  if (deleteMutation) {
    const deleteFn = toCamelCase(deleteMutation.operationName);
    lines.push(`      onDelete: async ({ transaction }) => {`);
    lines.push(
      `        await Promise.all(transaction.mutations.map((m) => ${deleteFn}({ ${entity.keyField}: m.key })))`,
    );
    lines.push(`      },`);
  }

  lines.push(`    })`);
  lines.push(`  )`);

  return lines.join("\n");
}
