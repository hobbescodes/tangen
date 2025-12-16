/**
 * OpenAPI parameter analysis for TanStack DB predicate push-down
 *
 * Analyzes query parameters from OpenAPI operations to detect:
 * - Filtering capabilities (simple REST, JSON:API, etc.)
 * - Sorting capabilities
 * - Pagination capabilities (offset, page-based, cursor)
 */

import type { OpenAPIV3, OpenAPIV3_1 } from "openapi-types";
import type { PredicateMappingPreset } from "@/core/config";
import type {
  FilterCapabilities,
  PaginationCapabilities,
  QueryCapabilities,
  SortCapabilities,
} from "../types";

type ParameterObject = OpenAPIV3.ParameterObject | OpenAPIV3_1.ParameterObject;

// =============================================================================
// Pattern Detection Constants
// =============================================================================

/** Common filter operator suffixes for REST-simple style */
const restSimpleOperatorSuffixes = [
  "_eq",
  "_ne",
  "_lt",
  "_lte",
  "_gt",
  "_gte",
  "_in",
  "_nin",
  "_like",
  "_contains",
];

/** Common sort parameter names */
const sortParamNames = [
  "sort",
  "sortBy",
  "sort_by",
  "orderBy",
  "order_by",
  "$orderby",
  "order",
];

/** Common limit parameter names */
const limitParamNames = ["limit", "$top", "per_page", "perPage", "pageSize"];

/** Common offset parameter names */
const offsetParamNames = ["offset", "$skip", "start"];

/** Common page parameter names */
const pageParamNames = ["page", "pageNumber", "page_number"];

/** Common cursor parameter names (for cursor-based pagination) */
const cursorParamNames = ["cursor", "after", "before"];

// =============================================================================
// Main Analysis Function
// =============================================================================

/**
 * Analyze query parameters to detect filtering, sorting, and pagination capabilities
 */
export function analyzeQueryParameters(
  queryParams: ParameterObject[],
): QueryCapabilities {
  const filter = analyzeFilterCapabilities(queryParams);
  const sort = analyzeSortCapabilities(queryParams);
  const pagination = analyzePaginationCapabilities(queryParams);

  return { filter, sort, pagination };
}

// =============================================================================
// Filter Analysis
// =============================================================================

/**
 * Analyze query parameters to detect filtering capabilities
 */
export function analyzeFilterCapabilities(
  queryParams: ParameterObject[],
): FilterCapabilities {
  const paramNames = queryParams.map((p) => p.name);

  // Check for JSON:API style: filter[field], filter[field][op]
  const jsonApiFilterParams = paramNames.filter(
    (name) => name.startsWith("filter[") && name.endsWith("]"),
  );
  if (jsonApiFilterParams.length > 0) {
    return {
      hasFiltering: true,
      filterStyle: "jsonapi",
      filterParams: jsonApiFilterParams,
    };
  }

  // Check for REST-simple style: field_eq, field_lt, etc.
  const restSimpleFilterParams = paramNames.filter((name) =>
    restSimpleOperatorSuffixes.some((suffix) => name.endsWith(suffix)),
  );
  if (restSimpleFilterParams.length > 0) {
    return {
      hasFiltering: true,
      filterStyle: "rest-simple",
      filterParams: restSimpleFilterParams,
    };
  }

  // Check for simple field filters (params that could be direct filters)
  // Exclude known non-filter params (sort, pagination, etc.)
  const knownNonFilterParams = new Set([
    ...sortParamNames,
    ...limitParamNames,
    ...offsetParamNames,
    ...pageParamNames,
    ...cursorParamNames,
  ]);

  const potentialFilterParams = paramNames.filter(
    (name) =>
      !knownNonFilterParams.has(name.toLowerCase()) &&
      !name.startsWith("$") &&
      !name.includes("["),
  );

  if (potentialFilterParams.length > 0) {
    return {
      hasFiltering: true,
      filterStyle: "rest-simple",
      filterParams: potentialFilterParams,
    };
  }

  return {
    hasFiltering: false,
  };
}

/**
 * Detect the filter style from a set of parameter names
 */
export function detectFilterStyle(
  paramNames: string[],
): PredicateMappingPreset | undefined {
  // Check for JSON:API style
  if (paramNames.some((name) => name.startsWith("filter["))) {
    return "jsonapi";
  }

  // Check for REST-simple style with operator suffixes
  if (
    paramNames.some((name) =>
      restSimpleOperatorSuffixes.some((suffix) => name.endsWith(suffix)),
    )
  ) {
    return "rest-simple";
  }

  // Check for simple field filters (any non-special params)
  const specialParams = new Set([
    ...sortParamNames,
    ...limitParamNames,
    ...offsetParamNames,
    ...pageParamNames,
    ...cursorParamNames,
  ]);

  const hasSimpleFilters = paramNames.some(
    (name) =>
      !specialParams.has(name.toLowerCase()) &&
      !name.startsWith("$") &&
      !name.includes("["),
  );

  if (hasSimpleFilters) {
    return "rest-simple";
  }

  return undefined;
}

// =============================================================================
// Sort Analysis
// =============================================================================

/**
 * Analyze query parameters to detect sorting capabilities
 */
export function analyzeSortCapabilities(
  queryParams: ParameterObject[],
): SortCapabilities {
  const paramNames = queryParams.map((p) => p.name.toLowerCase());

  for (const sortName of sortParamNames) {
    if (paramNames.includes(sortName.toLowerCase())) {
      const originalParam = queryParams.find(
        (p) => p.name.toLowerCase() === sortName.toLowerCase(),
      );
      return {
        hasSorting: true,
        sortParam: originalParam?.name || sortName,
      };
    }
  }

  return {
    hasSorting: false,
  };
}

// =============================================================================
// Pagination Analysis
// =============================================================================

/**
 * Analyze query parameters to detect pagination capabilities
 */
export function analyzePaginationCapabilities(
  queryParams: ParameterObject[],
): PaginationCapabilities {
  const paramNames = queryParams.map((p) => p.name.toLowerCase());
  const originalNames = new Map(
    queryParams.map((p) => [p.name.toLowerCase(), p.name]),
  );

  // Check for cursor-based pagination first
  for (const cursorName of cursorParamNames) {
    if (paramNames.includes(cursorName.toLowerCase())) {
      return {
        style: "cursor",
        limitParam: findParam(paramNames, originalNames, limitParamNames),
      };
    }
  }

  // Check for page-based pagination
  const pageParam = findParam(paramNames, originalNames, pageParamNames);
  if (pageParam) {
    return {
      style: "page",
      pageParam,
      perPageParam: findParam(paramNames, originalNames, [
        "per_page",
        "perPage",
        "pageSize",
        "limit",
      ]),
    };
  }

  // Check for offset-based pagination (most common)
  const limitParam = findParam(paramNames, originalNames, limitParamNames);
  const offsetParam = findParam(paramNames, originalNames, offsetParamNames);

  if (limitParam || offsetParam) {
    return {
      style: "offset",
      limitParam,
      offsetParam,
    };
  }

  return {
    style: "none",
  };
}

/**
 * Helper to find a parameter by checking multiple possible names
 */
function findParam(
  lowerCaseNames: string[],
  originalNames: Map<string, string>,
  possibleNames: string[],
): string | undefined {
  for (const name of possibleNames) {
    const lowerName = name.toLowerCase();
    if (lowerCaseNames.includes(lowerName)) {
      return originalNames.get(lowerName);
    }
  }
  return undefined;
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Extract the field name from a JSON:API filter parameter
 * e.g., "filter[status]" -> "status"
 * e.g., "filter[price][gte]" -> "price"
 */
export function extractJsonApiFilterField(paramName: string): string | null {
  const match = paramName.match(/^filter\[([^\]]+)\]/);
  return match?.[1] ?? null;
}

/**
 * Extract the operator from a JSON:API filter parameter
 * e.g., "filter[price][gte]" -> "gte"
 * e.g., "filter[status]" -> null (equality implied)
 */
export function extractJsonApiFilterOperator(paramName: string): string | null {
  const match = paramName.match(/^filter\[[^\]]+\]\[([^\]]+)\]/);
  return match?.[1] ?? null;
}

/**
 * Extract field name and operator from a REST-simple filter parameter
 * e.g., "price_gte" -> { field: "price", operator: "gte" }
 * e.g., "status" -> { field: "status", operator: "eq" }
 */
export function extractRestSimpleFilter(paramName: string): {
  field: string;
  operator: string;
} {
  for (const suffix of restSimpleOperatorSuffixes) {
    if (paramName.endsWith(suffix)) {
      return {
        field: paramName.slice(0, -suffix.length),
        operator: suffix.slice(1), // Remove leading underscore
      };
    }
  }

  // No operator suffix - treat as equality filter
  return {
    field: paramName,
    operator: "eq",
  };
}

/**
 * Check if the query has any filtering/sorting/pagination capabilities
 */
export function hasQueryCapabilities(capabilities: QueryCapabilities): boolean {
  return (
    capabilities.filter.hasFiltering ||
    capabilities.sort.hasSorting ||
    capabilities.pagination.style !== "none"
  );
}
