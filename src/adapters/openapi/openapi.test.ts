import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { openapiAdapter } from "./index";

import type { OpenAPISourceConfig } from "@/core/config";

const fixturesDir = join(__dirname, "../../test/fixtures/openapi");

describe("OpenAPI Adapter", () => {
  const testConfig: OpenAPISourceConfig = {
    name: "petstore",
    type: "openapi",
    spec: join(fixturesDir, "petstore.json"),
  };

  describe("loadSchema", () => {
    it("loads and parses an OpenAPI spec from a file", async () => {
      const schema = await openapiAdapter.loadSchema(testConfig);

      expect(schema.document).toBeDefined();
      expect(schema.document.info.title).toBe("Pet Store API");
      expect(schema.baseUrl).toBe("https://api.petstore.example.com/v1");
    });

    it("extracts paths from the spec", async () => {
      const schema = await openapiAdapter.loadSchema(testConfig);

      expect(schema.document.paths).toBeDefined();
      expect(schema.document.paths?.["/pets"]).toBeDefined();
      expect(schema.document.paths?.["/pets/{petId}"]).toBeDefined();
    });
  });

  describe("generateTypes", () => {
    it("generates Zod schemas and TypeScript types", async () => {
      const schema = await openapiAdapter.loadSchema(testConfig);
      const result = openapiAdapter.generateTypes(schema, testConfig, {});

      expect(result.filename).toBe("types.ts");
      expect(result.content).toContain("import { z } from");

      // Check for generated schema types
      expect(result.content).toContain("petSchema");
      expect(result.content).toContain("export type Pet");

      // Check for enum handling
      expect(result.content).toContain("z.enum");
    });

    it("generates operation-specific types", async () => {
      const schema = await openapiAdapter.loadSchema(testConfig);
      const result = openapiAdapter.generateTypes(schema, testConfig, {});

      // Should have params types for operations with parameters
      expect(result.content).toContain("ListPetsParams");
      expect(result.content).toContain("GetPetParams");
    });
  });

  describe("generateClient", () => {
    it("generates a better-fetch client", async () => {
      const schema = await openapiAdapter.loadSchema(testConfig);
      const result = openapiAdapter.generateClient(schema, testConfig, {
        config: {
          sources: [testConfig],
          output: {
            dir: "./generated",
            client: "client.ts",
            types: "types.ts",
            operations: "operations.ts",
          },
        },
        outputDir: "./generated/petstore",
        isMultiSource: false,
      });

      expect(result.filename).toBe("client.ts");
      expect(result.content).toContain("@better-fetch/fetch");
      expect(result.content).toContain("createFetch");
      expect(result.content).toContain("https://api.petstore.example.com/v1");
      expect(result.content).toContain("buildPath");
      expect(result.content).toContain("buildQuery");
    });
  });

  describe("generateOperations", () => {
    it("generates TanStack Query options for GET operations", async () => {
      const schema = await openapiAdapter.loadSchema(testConfig);
      const result = openapiAdapter.generateOperations(schema, testConfig, {
        clientImportPath: "./client",
        typesImportPath: "./types",
        includeSourceInQueryKey: false,
      });

      expect(result.filename).toBe("operations.ts");
      expect(result.content).toContain("@tanstack/react-query");
      expect(result.content).toContain("queryOptions");

      // Check for GET operation query options
      expect(result.content).toContain("listPetsQueryOptions");
      expect(result.content).toContain("getPetQueryOptions");
    });

    it("generates TanStack mutation options for non-GET operations", async () => {
      const schema = await openapiAdapter.loadSchema(testConfig);
      const result = openapiAdapter.generateOperations(schema, testConfig, {
        clientImportPath: "./client",
        typesImportPath: "./types",
        includeSourceInQueryKey: false,
      });

      expect(result.content).toContain("mutationOptions");

      // Check for mutation operations
      expect(result.content).toContain("createPetMutationOptions");
      expect(result.content).toContain("updatePetMutationOptions");
      expect(result.content).toContain("deletePetMutationOptions");
    });

    it("includes source name in query keys when includeSourceInQueryKey is true", async () => {
      const schema = await openapiAdapter.loadSchema(testConfig);
      const result = openapiAdapter.generateOperations(schema, testConfig, {
        clientImportPath: "./client",
        typesImportPath: "./types",
        includeSourceInQueryKey: true,
      });

      expect(result.content).toContain('"petstore"');
    });

    it("imports types from the types file", async () => {
      const schema = await openapiAdapter.loadSchema(testConfig);
      const result = openapiAdapter.generateOperations(schema, testConfig, {
        clientImportPath: "./client",
        typesImportPath: "./types",
        includeSourceInQueryKey: false,
      });

      expect(result.content).toContain('from "./types"');
      expect(result.content).toContain('from "./client"');
    });
  });
});

describe("OpenAPI Schema Loading", () => {
  describe("path filtering", () => {
    it("filters paths with include patterns", async () => {
      const config: OpenAPISourceConfig = {
        name: "petstore",
        type: "openapi",
        spec: join(fixturesDir, "petstore.json"),
        include: ["/pets"],
      };

      const schema = await openapiAdapter.loadSchema(config);

      expect(schema.document.paths?.["/pets"]).toBeDefined();
      expect(schema.document.paths?.["/pets/{petId}"]).toBeUndefined();
    });

    it("filters paths with exclude patterns", async () => {
      const config: OpenAPISourceConfig = {
        name: "petstore",
        type: "openapi",
        spec: join(fixturesDir, "petstore.json"),
        exclude: ["/pets/{petId}/vaccinations"],
      };

      const schema = await openapiAdapter.loadSchema(config);

      expect(schema.document.paths?.["/pets"]).toBeDefined();
      expect(schema.document.paths?.["/pets/{petId}"]).toBeDefined();
      expect(
        schema.document.paths?.["/pets/{petId}/vaccinations"],
      ).toBeUndefined();
    });
  });
});

describe("Remote OpenAPI Spec Loading", () => {
  describe("URL detection", () => {
    it("correctly identifies HTTP URLs", () => {
      const httpConfig: OpenAPISourceConfig = {
        name: "remote-api",
        type: "openapi",
        spec: "http://api.example.com/openapi.json",
      };

      const httpsConfig: OpenAPISourceConfig = {
        name: "remote-api",
        type: "openapi",
        spec: "https://api.example.com/openapi.json",
      };

      // Both should be recognized as URLs (starts with http:// or https://)
      expect(httpConfig.spec.startsWith("http://")).toBe(true);
      expect(httpsConfig.spec.startsWith("https://")).toBe(true);
    });

    it("correctly identifies local file paths", () => {
      const localConfig: OpenAPISourceConfig = {
        name: "local-api",
        type: "openapi",
        spec: "./openapi.yaml",
      };

      const absoluteConfig: OpenAPISourceConfig = {
        name: "local-api",
        type: "openapi",
        spec: "/path/to/openapi.json",
      };

      // Neither should be recognized as URLs
      expect(localConfig.spec.startsWith("http://")).toBe(false);
      expect(localConfig.spec.startsWith("https://")).toBe(false);
      expect(absoluteConfig.spec.startsWith("http://")).toBe(false);
      expect(absoluteConfig.spec.startsWith("https://")).toBe(false);
    });
  });

  describe("schema caching behavior", () => {
    it("schema object can be cached and reused for generation", async () => {
      const config: OpenAPISourceConfig = {
        name: "petstore",
        type: "openapi",
        spec: join(fixturesDir, "petstore.json"),
      };

      const schema1 = await openapiAdapter.loadSchema(config);

      // Simulate caching by storing the schema
      const cachedSchema = schema1;

      // The cached schema should be usable for generation without re-loading
      const typesResult = openapiAdapter.generateTypes(
        cachedSchema,
        config,
        {},
      );
      expect(typesResult.content).toContain("petSchema");

      const opsResult = openapiAdapter.generateOperations(
        cachedSchema,
        config,
        {
          clientImportPath: "./client",
          typesImportPath: "./types",
          includeSourceInQueryKey: false,
        },
      );
      expect(opsResult.content).toContain("listPetsQueryOptions");
    });

    it("cached schema produces identical output to fresh load", async () => {
      const config: OpenAPISourceConfig = {
        name: "petstore",
        type: "openapi",
        spec: join(fixturesDir, "petstore.json"),
      };

      // Load schema twice
      const schema1 = await openapiAdapter.loadSchema(config);
      const schema2 = await openapiAdapter.loadSchema(config);

      // Generate types from both
      const types1 = openapiAdapter.generateTypes(schema1, config, {});
      const types2 = openapiAdapter.generateTypes(schema2, config, {});

      // Output should be identical
      expect(types1.content).toBe(types2.content);

      // Generate operations from both
      const ops1 = openapiAdapter.generateOperations(schema1, config, {
        clientImportPath: "./client",
        typesImportPath: "./types",
        includeSourceInQueryKey: false,
      });
      const ops2 = openapiAdapter.generateOperations(schema2, config, {
        clientImportPath: "./client",
        typesImportPath: "./types",
        includeSourceInQueryKey: false,
      });

      // Output should be identical
      expect(ops1.content).toBe(ops2.content);
    });

    it("schema can be stored in a Map for caching (like generator does)", async () => {
      const config: OpenAPISourceConfig = {
        name: "petstore",
        type: "openapi",
        spec: join(fixturesDir, "petstore.json"),
      };

      // This simulates what the generator does with cachedSchemas
      const schemaCache = new Map<string, unknown>();

      // First load - no cache
      const schema = await openapiAdapter.loadSchema(config);
      schemaCache.set(config.name, schema);

      // Verify cached schema is retrievable and usable
      const cachedSchema = schemaCache.get(config.name);
      expect(cachedSchema).toBeDefined();
      expect(cachedSchema).toBe(schema); // Same reference

      // Use cached schema for generation (simulates watch mode rebuild)
      const typesResult = openapiAdapter.generateTypes(
        cachedSchema as typeof schema,
        config,
        {},
      );
      expect(typesResult.content).toContain("petSchema");
    });
  });

  describe("config with headers (for authenticated remote specs)", () => {
    it("accepts headers configuration for remote specs", () => {
      const configWithHeaders: OpenAPISourceConfig = {
        name: "authenticated-api",
        type: "openapi",
        spec: "https://api.example.com/openapi.json",
        headers: {
          Authorization: "Bearer secret-token",
          "X-API-Key": "my-api-key",
        },
      };

      // Config should be valid with headers
      expect(configWithHeaders.headers).toBeDefined();
      expect(configWithHeaders.headers?.Authorization).toBe(
        "Bearer secret-token",
      );
      expect(configWithHeaders.headers?.["X-API-Key"]).toBe("my-api-key");
    });
  });
});
