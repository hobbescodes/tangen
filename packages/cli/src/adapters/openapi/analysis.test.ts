/**
 * Tests for OpenAPI parameter analysis
 */

import { describe, expect, it } from "vitest";

import {
  analyzeFilterCapabilities,
  analyzePaginationCapabilities,
  analyzeQueryParameters,
  analyzeSortCapabilities,
  detectFilterStyle,
  extractJsonApiFilterField,
  extractJsonApiFilterOperator,
  extractRestSimpleFilter,
  hasQueryCapabilities,
} from "./analysis";

import type { OpenAPIV3 } from "openapi-types";

type ParameterObject = OpenAPIV3.ParameterObject;

// Helper to create a simple query parameter
function createParam(name: string, type = "string"): ParameterObject {
  return {
    name,
    in: "query",
    schema: { type: type as OpenAPIV3.NonArraySchemaObjectType },
  };
}

describe("OpenAPI Analysis", () => {
  describe("analyzeQueryParameters", () => {
    it("should detect REST-simple style filtering with operator suffixes", () => {
      const params: ParameterObject[] = [
        createParam("price_lt", "number"),
        createParam("price_gt", "number"),
        createParam("category"),
        createParam("sort"),
        createParam("limit", "integer"),
        createParam("offset", "integer"),
      ];

      const result = analyzeQueryParameters(params);

      expect(result.filter.hasFiltering).toBe(true);
      expect(result.filter.filterStyle).toBe("rest-simple");
      expect(result.filter.filterParams).toContain("price_lt");
      expect(result.filter.filterParams).toContain("price_gt");
      expect(result.sort.hasSorting).toBe(true);
      expect(result.sort.sortParam).toBe("sort");
      expect(result.pagination.style).toBe("offset");
      expect(result.pagination.limitParam).toBe("limit");
      expect(result.pagination.offsetParam).toBe("offset");
    });

    it("should detect JSON:API style filtering", () => {
      const params: ParameterObject[] = [
        createParam("filter[status]"),
        createParam("filter[category]"),
        createParam("filter[price][gte]", "number"),
        createParam("sort"),
        createParam("page[limit]", "integer"),
        createParam("page[offset]", "integer"),
      ];

      const result = analyzeQueryParameters(params);

      expect(result.filter.hasFiltering).toBe(true);
      expect(result.filter.filterStyle).toBe("jsonapi");
      expect(result.filter.filterParams).toContain("filter[status]");
      expect(result.filter.filterParams).toContain("filter[price][gte]");
    });

    it("should detect simple field filters", () => {
      const params: ParameterObject[] = [
        createParam("status"),
        createParam("category"),
        createParam("active", "boolean"),
      ];

      const result = analyzeQueryParameters(params);

      expect(result.filter.hasFiltering).toBe(true);
      expect(result.filter.filterStyle).toBe("rest-simple");
      expect(result.filter.filterParams).toContain("status");
      expect(result.filter.filterParams).toContain("category");
    });

    it("should return no filtering when no filter params exist", () => {
      const params: ParameterObject[] = [
        createParam("sort"),
        createParam("limit", "integer"),
      ];

      const result = analyzeQueryParameters(params);

      expect(result.filter.hasFiltering).toBe(false);
    });
  });

  describe("analyzeFilterCapabilities", () => {
    it("should identify REST-simple style with operator suffixes", () => {
      const params: ParameterObject[] = [
        createParam("name_eq"),
        createParam("price_lt", "number"),
        createParam("price_gte", "number"),
      ];

      const result = analyzeFilterCapabilities(params);

      expect(result.hasFiltering).toBe(true);
      expect(result.filterStyle).toBe("rest-simple");
      expect(result.filterParams).toEqual(["name_eq", "price_lt", "price_gte"]);
    });

    it("should identify JSON:API style filters", () => {
      const params: ParameterObject[] = [
        createParam("filter[name]"),
        createParam("filter[price][lt]", "number"),
      ];

      const result = analyzeFilterCapabilities(params);

      expect(result.hasFiltering).toBe(true);
      expect(result.filterStyle).toBe("jsonapi");
    });

    it("should exclude known non-filter params", () => {
      const params: ParameterObject[] = [
        createParam("sort"),
        createParam("limit", "integer"),
        createParam("offset", "integer"),
        createParam("page", "integer"),
      ];

      const result = analyzeFilterCapabilities(params);

      expect(result.hasFiltering).toBe(false);
    });
  });

  describe("analyzeSortCapabilities", () => {
    it("should detect sort parameter", () => {
      const params: ParameterObject[] = [createParam("sort")];

      const result = analyzeSortCapabilities(params);

      expect(result.hasSorting).toBe(true);
      expect(result.sortParam).toBe("sort");
    });

    it("should detect orderBy parameter", () => {
      const params: ParameterObject[] = [createParam("orderBy")];

      const result = analyzeSortCapabilities(params);

      expect(result.hasSorting).toBe(true);
      expect(result.sortParam).toBe("orderBy");
    });

    it("should detect $orderby parameter (OData style)", () => {
      const params: ParameterObject[] = [createParam("$orderby")];

      const result = analyzeSortCapabilities(params);

      expect(result.hasSorting).toBe(true);
      expect(result.sortParam).toBe("$orderby");
    });

    it("should return no sorting when no sort params exist", () => {
      const params: ParameterObject[] = [
        createParam("filter"),
        createParam("limit", "integer"),
      ];

      const result = analyzeSortCapabilities(params);

      expect(result.hasSorting).toBe(false);
    });
  });

  describe("analyzePaginationCapabilities", () => {
    it("should detect offset-based pagination", () => {
      const params: ParameterObject[] = [
        createParam("limit", "integer"),
        createParam("offset", "integer"),
      ];

      const result = analyzePaginationCapabilities(params);

      expect(result.style).toBe("offset");
      expect(result.limitParam).toBe("limit");
      expect(result.offsetParam).toBe("offset");
    });

    it("should detect page-based pagination", () => {
      const params: ParameterObject[] = [
        createParam("page", "integer"),
        createParam("per_page", "integer"),
      ];

      const result = analyzePaginationCapabilities(params);

      expect(result.style).toBe("page");
      expect(result.pageParam).toBe("page");
      expect(result.perPageParam).toBe("per_page");
    });

    it("should detect cursor-based pagination", () => {
      const params: ParameterObject[] = [
        createParam("cursor"),
        createParam("limit", "integer"),
      ];

      const result = analyzePaginationCapabilities(params);

      expect(result.style).toBe("cursor");
      expect(result.limitParam).toBe("limit");
    });

    it("should detect OData style pagination", () => {
      const params: ParameterObject[] = [
        createParam("$top", "integer"),
        createParam("$skip", "integer"),
      ];

      const result = analyzePaginationCapabilities(params);

      expect(result.style).toBe("offset");
      expect(result.limitParam).toBe("$top");
      expect(result.offsetParam).toBe("$skip");
    });

    it("should return none when no pagination params exist", () => {
      const params: ParameterObject[] = [createParam("filter")];

      const result = analyzePaginationCapabilities(params);

      expect(result.style).toBe("none");
    });
  });

  describe("detectFilterStyle", () => {
    it("should detect JSON:API style", () => {
      const paramNames = ["filter[status]", "filter[price][gte]"];
      expect(detectFilterStyle(paramNames)).toBe("jsonapi");
    });

    it("should detect REST-simple style with operator suffixes", () => {
      const paramNames = ["price_lt", "price_gt", "name_eq"];
      expect(detectFilterStyle(paramNames)).toBe("rest-simple");
    });

    it("should detect REST-simple style for simple field filters", () => {
      const paramNames = ["status", "category", "active"];
      expect(detectFilterStyle(paramNames)).toBe("rest-simple");
    });

    it("should return undefined for only special params", () => {
      const paramNames = ["sort", "limit", "offset"];
      expect(detectFilterStyle(paramNames)).toBeUndefined();
    });
  });

  describe("extractJsonApiFilterField", () => {
    it("should extract field from simple filter", () => {
      expect(extractJsonApiFilterField("filter[status]")).toBe("status");
    });

    it("should extract field from filter with operator", () => {
      expect(extractJsonApiFilterField("filter[price][gte]")).toBe("price");
    });

    it("should return null for non-filter params", () => {
      expect(extractJsonApiFilterField("status")).toBeNull();
    });
  });

  describe("extractJsonApiFilterOperator", () => {
    it("should extract operator from filter with operator", () => {
      expect(extractJsonApiFilterOperator("filter[price][gte]")).toBe("gte");
    });

    it("should return null for simple filter (implied equality)", () => {
      expect(extractJsonApiFilterOperator("filter[status]")).toBeNull();
    });
  });

  describe("extractRestSimpleFilter", () => {
    it("should extract field and operator from suffixed param", () => {
      expect(extractRestSimpleFilter("price_gte")).toEqual({
        field: "price",
        operator: "gte",
      });
    });

    it("should handle equality for unsuffixed params", () => {
      expect(extractRestSimpleFilter("status")).toEqual({
        field: "status",
        operator: "eq",
      });
    });

    it("should handle various operator suffixes", () => {
      expect(extractRestSimpleFilter("age_lt")).toEqual({
        field: "age",
        operator: "lt",
      });
      expect(extractRestSimpleFilter("name_contains")).toEqual({
        field: "name",
        operator: "contains",
      });
    });
  });

  describe("hasQueryCapabilities", () => {
    it("should return true when filtering is available", () => {
      const capabilities = {
        filter: { hasFiltering: true, filterStyle: "rest-simple" as const },
        sort: { hasSorting: false },
        pagination: { style: "none" as const },
      };
      expect(hasQueryCapabilities(capabilities)).toBe(true);
    });

    it("should return true when sorting is available", () => {
      const capabilities = {
        filter: { hasFiltering: false },
        sort: { hasSorting: true, sortParam: "sort" },
        pagination: { style: "none" as const },
      };
      expect(hasQueryCapabilities(capabilities)).toBe(true);
    });

    it("should return true when pagination is available", () => {
      const capabilities = {
        filter: { hasFiltering: false },
        sort: { hasSorting: false },
        pagination: { style: "offset" as const, limitParam: "limit" },
      };
      expect(hasQueryCapabilities(capabilities)).toBe(true);
    });

    it("should return false when no capabilities exist", () => {
      const capabilities = {
        filter: { hasFiltering: false },
        sort: { hasSorting: false },
        pagination: { style: "none" as const },
      };
      expect(hasQueryCapabilities(capabilities)).toBe(false);
    });
  });
});
