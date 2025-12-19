/**
 * Runtime Validation Tests
 *
 * Tests that generated schemas actually work at runtime by:
 * 1. Generating schema code for each validator
 * 2. Writing to temp files
 * 3. Dynamically importing the modules
 * 4. Testing parse behavior with valid/invalid data
 */

import { mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { openapiAdapter } from "@/adapters/openapi";
import { supportedValidators } from "@/generators/emitters";

import type { SchemaGenOptions } from "@/adapters/types";
import type { OpenAPISourceConfig } from "@/core/config";
import type { ValidatorLibrary } from "@/generators/emitters";

// ============================================================================
// Test Configuration
// ============================================================================

const fixturesDir = join(__dirname, "fixtures/openapi");
const cacheDir = join(
  __dirname,
  "../../node_modules/.cache/tangrams-test/runtime-validation",
);

const testConfig: OpenAPISourceConfig = {
  name: "petstore",
  type: "openapi",
  generates: ["query"],
  spec: join(fixturesDir, "petstore.json"),
};

// ============================================================================
// Test Data
// ============================================================================

/**
 * Valid Pet object matching the petstore schema
 */
const validPet = {
  id: "pet-123",
  name: "Fido",
  species: "dog",
  status: "available",
  breed: "Golden Retriever",
  age: 3,
  tags: ["friendly", "trained"],
};

/**
 * Invalid Pet object - missing required fields
 */
const invalidPetMissingRequired = {
  id: "pet-123",
  // missing: name, species, status
};

/**
 * Invalid Pet object - wrong enum value
 */
const invalidPetWrongEnum = {
  id: "pet-123",
  name: "Fido",
  species: "dragon", // not a valid species
  status: "available",
};

/**
 * Invalid Pet object - wrong type
 */
const invalidPetWrongType = {
  id: "pet-123",
  name: "Fido",
  species: "dog",
  status: "available",
  age: "three", // should be number
};

/**
 * Valid Species enum value
 */
const validSpecies = "dog";

/**
 * Invalid Species enum value
 */
const invalidSpecies = "dragon";

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Check if a value is an ArkType error result
 *
 * ArkType returns an ArkErrors array on validation failure,
 * which has an " arkKind": "errors" property
 */
function isArkTypeError(value: unknown): boolean {
  return (
    value !== null &&
    typeof value === "object" &&
    " arkKind" in value &&
    (value as Record<string, unknown>)[" arkKind"] === "errors"
  );
}

/**
 * Parse data using the appropriate validator API
 *
 * Each validator has a different parse API:
 * - Zod: schema.parse(data) throws on error
 * - Valibot: v.parse(schema, data) throws on error
 * - ArkType: schema(data) returns data on success, ArkErrors on failure
 */
async function parseWithValidator(
  validator: ValidatorLibrary,
  // biome-ignore lint/suspicious/noExplicitAny: Dynamic module imports require any
  schemaModule: any,
  schemaName: string,
  data: unknown,
): Promise<{ success: boolean; data?: unknown; error?: unknown }> {
  const schema = schemaModule[schemaName];

  if (!schema) {
    throw new Error(`Schema ${schemaName} not found in module`);
  }

  try {
    switch (validator) {
      case "zod": {
        const result = schema.parse(data);
        return { success: true, data: result };
      }
      case "valibot": {
        // Valibot uses v.parse(schema, data)
        const v = await import("valibot");
        const result = v.parse(schema, data);
        return { success: true, data: result };
      }
      case "arktype": {
        // ArkType returns the validated data on success, or an ArkErrors array on failure
        const result = schema(data);
        if (isArkTypeError(result)) {
          return { success: false, error: result };
        }
        return { success: true, data: result };
      }
    }
  } catch (error) {
    return { success: false, error };
  }
}

/**
 * Generate schema file for a validator and write to cache
 */
async function generateAndWriteSchema(
  validator: ValidatorLibrary,
): Promise<string> {
  const schema = await openapiAdapter.loadSchema(testConfig);
  const schemaOptions: SchemaGenOptions = { validator };
  const result = openapiAdapter.generateSchemas(
    schema,
    testConfig,
    schemaOptions,
  );

  const validatorDir = join(cacheDir, validator);
  await mkdir(validatorDir, { recursive: true });

  const filePath = join(validatorDir, "schema.ts");
  await writeFile(filePath, result.content);

  return filePath;
}

// ============================================================================
// Tests
// ============================================================================

describe("Runtime Validation", () => {
  // Setup: generate schemas for all validators
  beforeAll(async () => {
    await mkdir(cacheDir, { recursive: true });

    // Generate schemas for all validators in parallel
    await Promise.all(
      supportedValidators.map((validator) => generateAndWriteSchema(validator)),
    );
  });

  // Cleanup: remove temp files
  afterAll(async () => {
    await rm(cacheDir, { recursive: true, force: true });
  });

  describe.each(
    supportedValidators,
  )("%s runtime validation", (validator: ValidatorLibrary) => {
    // biome-ignore lint/suspicious/noExplicitAny: Dynamic module imports require any
    let schemaModule: any;

    beforeAll(async () => {
      const filePath = join(cacheDir, validator, "schema.ts");
      // Dynamic import of generated schema
      schemaModule = await import(filePath);
    });

    describe("Pet schema", () => {
      it("parses valid Pet object successfully", async () => {
        const result = await parseWithValidator(
          validator,
          schemaModule,
          "petSchema",
          validPet,
        );

        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();
      });

      it("rejects Pet with missing required fields", async () => {
        const result = await parseWithValidator(
          validator,
          schemaModule,
          "petSchema",
          invalidPetMissingRequired,
        );

        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
      });

      it("rejects Pet with invalid enum value", async () => {
        const result = await parseWithValidator(
          validator,
          schemaModule,
          "petSchema",
          invalidPetWrongEnum,
        );

        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
      });

      it("rejects Pet with wrong type", async () => {
        const result = await parseWithValidator(
          validator,
          schemaModule,
          "petSchema",
          invalidPetWrongType,
        );

        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
      });
    });

    describe("Species enum schema", () => {
      it("parses valid Species value", async () => {
        const result = await parseWithValidator(
          validator,
          schemaModule,
          "speciesSchema",
          validSpecies,
        );

        expect(result.success).toBe(true);
        expect(result.data).toBe("dog");
      });

      it("rejects invalid Species value", async () => {
        const result = await parseWithValidator(
          validator,
          schemaModule,
          "speciesSchema",
          invalidSpecies,
        );

        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
      });
    });

    describe("Array handling", () => {
      it("parses array of Pets", async () => {
        const pets = [validPet, { ...validPet, id: "pet-456", name: "Max" }];

        // The listPetsResponse is an array of pets
        const result = await parseWithValidator(
          validator,
          schemaModule,
          "listPetsResponseSchema",
          pets,
        );

        expect(result.success).toBe(true);
        expect(result.data).toHaveLength(2);
      });

      it("rejects array with invalid Pet", async () => {
        const pets = [validPet, invalidPetMissingRequired];

        const result = await parseWithValidator(
          validator,
          schemaModule,
          "listPetsResponseSchema",
          pets,
        );

        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
      });
    });

    describe("Optional fields", () => {
      it("parses Pet with only required fields", async () => {
        const minimalPet = {
          id: "pet-789",
          name: "Whiskers",
          species: "cat",
          status: "pending",
        };

        const result = await parseWithValidator(
          validator,
          schemaModule,
          "petSchema",
          minimalPet,
        );

        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();
      });

      it("parses Pet with omitted optional fields", async () => {
        // Optional fields should be omittable in all validators
        const petWithOmittedOptionals = {
          id: "pet-101",
          name: "Goldie",
          species: "fish",
          status: "available",
          // breed, age, ownerId, tags all omitted
        };

        const result = await parseWithValidator(
          validator,
          schemaModule,
          "petSchema",
          petWithOmittedOptionals,
        );

        expect(result.success).toBe(true);
      });

      it("parses Pet with null optional fields", async () => {
        // All validators should allow null for optional fields
        // Zod/Valibot use .nullish(), ArkType uses "type | null"
        const petWithNulls = {
          id: "pet-101",
          name: "Goldie",
          species: "fish",
          status: "available",
          breed: null,
          age: null,
          ownerId: null,
          tags: null,
        };

        const result = await parseWithValidator(
          validator,
          schemaModule,
          "petSchema",
          petWithNulls,
        );

        expect(result.success).toBe(true);
      });
    });

    describe("CreatePetInput schema", () => {
      it("parses valid CreatePetInput", async () => {
        const input = {
          name: "Buddy",
          species: "dog",
          breed: "Labrador",
          age: 2,
        };

        const result = await parseWithValidator(
          validator,
          schemaModule,
          "createPetInputSchema",
          input,
        );

        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();
      });

      it("rejects CreatePetInput without required name", async () => {
        const input = {
          species: "dog",
        };

        const result = await parseWithValidator(
          validator,
          schemaModule,
          "createPetInputSchema",
          input,
        );

        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
      });
    });
  });
});
