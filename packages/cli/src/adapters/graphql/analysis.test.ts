/**
 * Tests for GraphQL argument analysis
 */

import { buildSchema } from "graphql";
import { describe, expect, it } from "vitest";

import {
  analyzeFilterCapabilities,
  analyzeGraphQLQueryCapabilities,
  analyzePaginationCapabilities,
  analyzeSortCapabilities,
  detectFilterStyle,
  detectFilterStyleFromTypeName,
  detectOrderByStyle,
  hasQueryCapabilities,
  inferPredicateMappingPreset,
} from "./analysis";

// Helper to build a schema and get a field
function getQueryField(schemaSDL: string, fieldName: string) {
  const schema = buildSchema(schemaSDL);
  const queryType = schema.getQueryType();
  if (!queryType) throw new Error("No Query type");
  const field = queryType.getFields()[fieldName];
  if (!field) throw new Error(`Field ${fieldName} not found`);
  return field;
}

describe("GraphQL Analysis", () => {
  describe("analyzeGraphQLQueryCapabilities", () => {
    it("should detect Hasura-style filtering", () => {
      const schema = `
				type Query {
					products(
						where: products_bool_exp
						order_by: [products_order_by!]
						limit: Int
						offset: Int
					): [Product!]!
				}
				
				type Product { id: ID!, name: String! }
				
				input products_bool_exp {
					_and: [products_bool_exp!]
					_or: [products_bool_exp!]
					name: String_comparison_exp
				}
				
				input String_comparison_exp {
					_eq: String
					_lt: String
				}
				
				input products_order_by {
					name: order_by
				}
				
				enum order_by { asc, desc }
			`;

      const field = getQueryField(schema, "products");
      const result = analyzeGraphQLQueryCapabilities(field);

      expect(result.filter.hasFiltering).toBe(true);
      expect(result.filter.filterStyle).toBe("hasura");
      expect(result.filter.filterInputType).toBe("products_bool_exp");
      expect(result.sort.hasSorting).toBe(true);
      expect(result.sort.sortParam).toBe("order_by");
      expect(result.pagination.style).toBe("offset");
      expect(result.pagination.limitParam).toBe("limit");
      expect(result.pagination.offsetParam).toBe("offset");
    });

    it("should detect Prisma-style filtering", () => {
      const schema = `
				type Query {
					users(
						where: UserWhereInput
						orderBy: [UserOrderByInput!]
						take: Int
						skip: Int
					): [User!]!
				}
				
				type User { id: ID!, email: String! }
				
				input UserWhereInput {
					AND: [UserWhereInput!]
					OR: [UserWhereInput!]
					email: StringFilter
				}
				
				input StringFilter {
					equals: String
					contains: String
				}
				
				input UserOrderByInput {
					email: SortOrder
				}
				
				enum SortOrder { asc, desc }
			`;

      const field = getQueryField(schema, "users");
      const result = analyzeGraphQLQueryCapabilities(field);

      expect(result.filter.hasFiltering).toBe(true);
      expect(result.filter.filterStyle).toBe("prisma");
      expect(result.filter.filterInputType).toBe("UserWhereInput");
      expect(result.sort.hasSorting).toBe(true);
      expect(result.sort.sortParam).toBe("orderBy");
      expect(result.pagination.style).toBe("offset");
      expect(result.pagination.limitParam).toBe("take");
      expect(result.pagination.offsetParam).toBe("skip");
    });

    it("should detect Relay-style pagination", () => {
      const schema = `
				type Query {
					posts(first: Int, after: String, last: Int, before: String): PostConnection!
				}
				
				type PostConnection {
					edges: [PostEdge!]!
					pageInfo: PageInfo!
				}
				
				type PostEdge { node: Post!, cursor: String! }
				type Post { id: ID!, title: String! }
				type PageInfo { hasNextPage: Boolean!, endCursor: String }
			`;

      const field = getQueryField(schema, "posts");
      const result = analyzeGraphQLQueryCapabilities(field);

      expect(result.pagination.style).toBe("relay");
      expect(result.pagination.limitParam).toBe("first");
    });

    it("should detect simple offset pagination", () => {
      const schema = `
				type Query {
					items(limit: Int, offset: Int): [Item!]!
				}
				type Item { id: ID! }
			`;

      const field = getQueryField(schema, "items");
      const result = analyzeGraphQLQueryCapabilities(field);

      expect(result.pagination.style).toBe("offset");
      expect(result.pagination.limitParam).toBe("limit");
      expect(result.pagination.offsetParam).toBe("offset");
    });

    it("should return no capabilities for simple query", () => {
      const schema = `
				type Query {
					items: [Item!]!
				}
				type Item { id: ID! }
			`;

      const field = getQueryField(schema, "items");
      const result = analyzeGraphQLQueryCapabilities(field);

      expect(result.filter.hasFiltering).toBe(false);
      expect(result.sort.hasSorting).toBe(false);
      expect(result.pagination.style).toBe("none");
    });
  });

  describe("analyzeFilterCapabilities", () => {
    it("should detect where argument with Hasura pattern", () => {
      const schema = `
				type Query {
					items(where: items_bool_exp): [Item!]!
				}
				type Item { id: ID! }
				input items_bool_exp { _eq: String }
			`;

      const field = getQueryField(schema, "items");
      const result = analyzeFilterCapabilities(field.args);

      expect(result.hasFiltering).toBe(true);
      expect(result.filterStyle).toBe("hasura");
      expect(result.filterInputType).toBe("items_bool_exp");
    });

    it("should detect filter argument", () => {
      const schema = `
				type Query {
					items(filter: ItemFilter): [Item!]!
				}
				type Item { id: ID! }
				input ItemFilter { name: String }
			`;

      const field = getQueryField(schema, "items");
      const result = analyzeFilterCapabilities(field.args);

      expect(result.hasFiltering).toBe(true);
      expect(result.filterInputType).toBe("ItemFilter");
    });

    it("should return no filtering when no filter args exist", () => {
      const schema = `
				type Query {
					items(limit: Int): [Item!]!
				}
				type Item { id: ID! }
			`;

      const field = getQueryField(schema, "items");
      const result = analyzeFilterCapabilities(field.args);

      expect(result.hasFiltering).toBe(false);
    });
  });

  describe("analyzeSortCapabilities", () => {
    it("should detect order_by argument", () => {
      const schema = `
				type Query {
					items(order_by: [items_order_by!]): [Item!]!
				}
				type Item { id: ID! }
				input items_order_by { id: order_by }
				enum order_by { asc, desc }
			`;

      const field = getQueryField(schema, "items");
      const result = analyzeSortCapabilities(field.args);

      expect(result.hasSorting).toBe(true);
      expect(result.sortParam).toBe("order_by");
      expect(result.orderByInputType).toBe("items_order_by");
    });

    it("should detect orderBy argument", () => {
      const schema = `
				type Query {
					items(orderBy: ItemOrderBy): [Item!]!
				}
				type Item { id: ID! }
				input ItemOrderBy { id: SortOrder }
				enum SortOrder { asc, desc }
			`;

      const field = getQueryField(schema, "items");
      const result = analyzeSortCapabilities(field.args);

      expect(result.hasSorting).toBe(true);
      expect(result.sortParam).toBe("orderBy");
    });

    it("should return no sorting when no sort args exist", () => {
      const schema = `
				type Query {
					items(where: ItemFilter): [Item!]!
				}
				type Item { id: ID! }
				input ItemFilter { name: String }
			`;

      const field = getQueryField(schema, "items");
      const result = analyzeSortCapabilities(field.args);

      expect(result.hasSorting).toBe(false);
    });
  });

  describe("analyzePaginationCapabilities", () => {
    it("should detect Relay pagination", () => {
      const schema = `
				type Query {
					items(first: Int, after: String): [Item!]!
				}
				type Item { id: ID! }
			`;

      const field = getQueryField(schema, "items");
      const result = analyzePaginationCapabilities(field.args);

      expect(result.style).toBe("relay");
      expect(result.limitParam).toBe("first");
    });

    it("should detect Prisma take/skip pagination", () => {
      const schema = `
				type Query {
					items(take: Int, skip: Int): [Item!]!
				}
				type Item { id: ID! }
			`;

      const field = getQueryField(schema, "items");
      const result = analyzePaginationCapabilities(field.args);

      expect(result.style).toBe("offset");
      expect(result.limitParam).toBe("take");
      expect(result.offsetParam).toBe("skip");
    });

    it("should detect standard limit/offset pagination", () => {
      const schema = `
				type Query {
					items(limit: Int, offset: Int): [Item!]!
				}
				type Item { id: ID! }
			`;

      const field = getQueryField(schema, "items");
      const result = analyzePaginationCapabilities(field.args);

      expect(result.style).toBe("offset");
      expect(result.limitParam).toBe("limit");
      expect(result.offsetParam).toBe("offset");
    });

    it("should return none when no pagination args exist", () => {
      const schema = `
				type Query {
					items(where: ItemFilter): [Item!]!
				}
				type Item { id: ID! }
				input ItemFilter { name: String }
			`;

      const field = getQueryField(schema, "items");
      const result = analyzePaginationCapabilities(field.args);

      expect(result.style).toBe("none");
    });
  });

  describe("detectFilterStyle", () => {
    it("should detect Hasura style by field names", () => {
      const schema = buildSchema(`
				input TestFilter {
					_eq: String
					_lt: String
					_and: [TestFilter!]
				}
			`);
      const type = schema.getType("TestFilter");
      if (!type || type.astNode?.kind !== "InputObjectTypeDefinition") {
        throw new Error("Expected input type");
      }

      const result = detectFilterStyle(type as any);
      expect(result).toBe("hasura");
    });

    it("should detect Prisma style by field names", () => {
      const schema = buildSchema(`
				input TestFilter {
					equals: String
					contains: String
					in: [String!]
				}
			`);
      const type = schema.getType("TestFilter");

      const result = detectFilterStyle(type as any);
      expect(result).toBe("prisma");
    });

    it("should return custom for unknown patterns", () => {
      const schema = buildSchema(`
				input TestFilter {
					name: String
					age: Int
				}
			`);
      const type = schema.getType("TestFilter");

      const result = detectFilterStyle(type as any);
      expect(result).toBe("custom");
    });
  });

  describe("detectFilterStyleFromTypeName", () => {
    it("should detect Hasura style from type name", () => {
      expect(detectFilterStyleFromTypeName("users_bool_exp")).toBe("hasura");
      expect(detectFilterStyleFromTypeName("products_where")).toBe("hasura");
    });

    it("should detect Prisma style from type name", () => {
      expect(detectFilterStyleFromTypeName("UserWhereInput")).toBe("prisma");
      expect(detectFilterStyleFromTypeName("ProductWhereUniqueInput")).toBe(
        "prisma",
      );
    });

    it("should return undefined for unknown patterns", () => {
      expect(detectFilterStyleFromTypeName("CustomFilter")).toBeUndefined();
    });
  });

  describe("detectOrderByStyle", () => {
    it("should detect Hasura style from type name", () => {
      expect(detectOrderByStyle("users_order_by")).toBe("hasura");
    });

    it("should detect Prisma style from type name", () => {
      expect(detectOrderByStyle("UserOrderByInput")).toBe("prisma");
      expect(detectOrderByStyle("UserOrderByWithRelationInput")).toBe("prisma");
    });

    it("should return undefined for unknown patterns", () => {
      expect(detectOrderByStyle("CustomSort")).toBeUndefined();
    });
  });

  describe("hasQueryCapabilities", () => {
    it("should return true when any capability exists", () => {
      expect(
        hasQueryCapabilities({
          filter: { hasFiltering: true, filterStyle: "hasura" },
          sort: { hasSorting: false },
          pagination: { style: "none" },
        }),
      ).toBe(true);

      expect(
        hasQueryCapabilities({
          filter: { hasFiltering: false },
          sort: { hasSorting: true },
          pagination: { style: "none" },
        }),
      ).toBe(true);

      expect(
        hasQueryCapabilities({
          filter: { hasFiltering: false },
          sort: { hasSorting: false },
          pagination: { style: "offset" },
        }),
      ).toBe(true);
    });

    it("should return false when no capabilities exist", () => {
      expect(
        hasQueryCapabilities({
          filter: { hasFiltering: false },
          sort: { hasSorting: false },
          pagination: { style: "none" },
        }),
      ).toBe(false);
    });
  });

  describe("inferPredicateMappingPreset", () => {
    it("should infer from filter style", () => {
      const result = inferPredicateMappingPreset({
        filter: { hasFiltering: true, filterStyle: "hasura" },
        sort: { hasSorting: false },
        pagination: { style: "none" },
      });
      expect(result).toBe("hasura");
    });

    it("should infer from order_by type name", () => {
      const result = inferPredicateMappingPreset({
        filter: { hasFiltering: false },
        sort: { hasSorting: true, orderByInputType: "users_order_by" },
        pagination: { style: "none" },
      });
      expect(result).toBe("hasura");
    });

    it("should return undefined when cannot infer", () => {
      const result = inferPredicateMappingPreset({
        filter: { hasFiltering: true, filterStyle: "custom" },
        sort: { hasSorting: false },
        pagination: { style: "none" },
      });
      expect(result).toBeUndefined();
    });
  });
});
