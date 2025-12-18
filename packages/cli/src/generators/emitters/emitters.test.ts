/**
 * Emitter tests
 *
 * Tests for all validator emitters (Zod, Valibot, ArkType)
 */

import { describe, expect, it } from "vitest";

import { arktypeEmitter } from "./arktype";
import { getEmitter, isValidatorLibrary, supportedValidators } from "./index";
import { valibotEmitter } from "./valibot";
import { zodEmitter } from "./zod";

import type { NamedSchemaIR, SchemaIR } from "../ir/types";

// ============================================================================
// Helper Functions
// ============================================================================

function createNamedSchema(
  name: string,
  schema: SchemaIR,
  category: NamedSchemaIR["category"] = "component",
): NamedSchemaIR {
  return { name, schema, category, dependencies: new Set() };
}

// ============================================================================
// Emitter Registry Tests
// ============================================================================

describe("Emitter Registry", () => {
  describe("getEmitter", () => {
    it("returns the Zod emitter for 'zod'", () => {
      const emitter = getEmitter("zod");
      expect(emitter.library).toBe("zod");
    });

    it("returns the Valibot emitter for 'valibot'", () => {
      const emitter = getEmitter("valibot");
      expect(emitter.library).toBe("valibot");
    });

    it("returns the ArkType emitter for 'arktype'", () => {
      const emitter = getEmitter("arktype");
      expect(emitter.library).toBe("arktype");
    });

    it("throws for unknown library", () => {
      expect(() => getEmitter("unknown" as never)).toThrow(
        "Unknown validator library",
      );
    });
  });

  describe("isValidatorLibrary", () => {
    it("returns true for valid libraries", () => {
      expect(isValidatorLibrary("zod")).toBe(true);
      expect(isValidatorLibrary("valibot")).toBe(true);
      expect(isValidatorLibrary("arktype")).toBe(true);
    });

    it("returns false for invalid libraries", () => {
      expect(isValidatorLibrary("unknown")).toBe(false);
      expect(isValidatorLibrary("")).toBe(false);
    });
  });

  describe("supportedValidators", () => {
    it("contains all three validators", () => {
      expect(supportedValidators).toContain("zod");
      expect(supportedValidators).toContain("valibot");
      expect(supportedValidators).toContain("arktype");
      expect(supportedValidators).toHaveLength(3);
    });
  });
});

// ============================================================================
// Zod Emitter Tests
// ============================================================================

describe("Zod Emitter", () => {
  describe("getImportStatement", () => {
    it("returns correct Zod import", () => {
      expect(zodEmitter.getImportStatement()).toBe('import * as z from "zod"');
    });
  });

  describe("getTypeInference", () => {
    it("returns correct type inference", () => {
      expect(zodEmitter.getTypeInference("petSchema", "Pet")).toBe(
        "export type Pet = z.infer<typeof petSchema>",
      );
    });
  });

  describe("emit", () => {
    it("emits string schema", () => {
      const schemas: NamedSchemaIR[] = [
        createNamedSchema("Name", { kind: "string" }),
      ];
      const result = zodEmitter.emit(schemas);

      expect(result.content).toContain("z.string()");
      expect(result.content).toContain("export const nameSchema");
      expect(result.content).toContain("export type Name");
    });

    it("emits string with email format", () => {
      const schemas: NamedSchemaIR[] = [
        createNamedSchema("Email", { kind: "string", format: "email" }),
      ];
      const result = zodEmitter.emit(schemas);

      expect(result.content).toContain("z.email()");
    });

    it("emits string with datetime format", () => {
      const schemas: NamedSchemaIR[] = [
        createNamedSchema("DateTime", { kind: "string", format: "datetime" }),
      ];
      const result = zodEmitter.emit(schemas);

      expect(result.content).toContain("z.iso.datetime()");
    });

    it("emits number schema", () => {
      const schemas: NamedSchemaIR[] = [
        createNamedSchema("Age", { kind: "number" }),
      ];
      const result = zodEmitter.emit(schemas);

      expect(result.content).toContain("z.number()");
    });

    it("emits integer schema", () => {
      const schemas: NamedSchemaIR[] = [
        createNamedSchema("Count", { kind: "number", integer: true }),
      ];
      const result = zodEmitter.emit(schemas);

      expect(result.content).toContain("z.number().int()");
    });

    it("emits boolean schema", () => {
      const schemas: NamedSchemaIR[] = [
        createNamedSchema("Active", { kind: "boolean" }),
      ];
      const result = zodEmitter.emit(schemas);

      expect(result.content).toContain("z.boolean()");
    });

    it("emits enum schema", () => {
      const schemas: NamedSchemaIR[] = [
        createNamedSchema("Status", {
          kind: "enum",
          values: ["active", "inactive"],
        }),
      ];
      const result = zodEmitter.emit(schemas);

      expect(result.content).toContain('z.enum(["active", "inactive"])');
    });

    it("emits array schema", () => {
      const schemas: NamedSchemaIR[] = [
        createNamedSchema("Tags", {
          kind: "array",
          items: { kind: "string" },
        }),
      ];
      const result = zodEmitter.emit(schemas);

      expect(result.content).toContain("z.array(z.string())");
    });

    it("emits object schema with required and optional fields", () => {
      const schemas: NamedSchemaIR[] = [
        createNamedSchema("User", {
          kind: "object",
          properties: {
            id: { schema: { kind: "string" }, required: true },
            name: { schema: { kind: "string" }, required: true },
            email: { schema: { kind: "string" }, required: false },
          },
        }),
      ];
      const result = zodEmitter.emit(schemas);

      expect(result.content).toContain("z.object({");
      expect(result.content).toContain("id: z.string()");
      expect(result.content).toContain("name: z.string()");
      expect(result.content).toContain("email: z.string().nullish()");
    });

    it("emits union schema", () => {
      const schemas: NamedSchemaIR[] = [
        createNamedSchema("StringOrNumber", {
          kind: "union",
          members: [{ kind: "string" }, { kind: "number" }],
        }),
      ];
      const result = zodEmitter.emit(schemas);

      expect(result.content).toContain("z.union([z.string(), z.number()])");
    });

    it("emits ref schema", () => {
      const schemas: NamedSchemaIR[] = [
        createNamedSchema("Status", { kind: "enum", values: ["a", "b"] }),
        createNamedSchema("Item", {
          kind: "object",
          properties: {
            status: { schema: { kind: "ref", name: "Status" }, required: true },
          },
        }),
      ];
      const result = zodEmitter.emit(schemas);

      expect(result.content).toContain("status: statusSchema");
    });
  });
});

// ============================================================================
// Valibot Emitter Tests
// ============================================================================

describe("Valibot Emitter", () => {
  describe("getImportStatement", () => {
    it("returns correct Valibot import", () => {
      expect(valibotEmitter.getImportStatement()).toBe(
        'import * as v from "valibot"',
      );
    });
  });

  describe("getTypeInference", () => {
    it("returns correct type inference", () => {
      expect(valibotEmitter.getTypeInference("petSchema", "Pet")).toBe(
        "export type Pet = v.InferOutput<typeof petSchema>",
      );
    });
  });

  describe("emit", () => {
    it("emits string schema", () => {
      const schemas: NamedSchemaIR[] = [
        createNamedSchema("Name", { kind: "string" }),
      ];
      const result = valibotEmitter.emit(schemas);

      expect(result.content).toContain("v.string()");
    });

    it("emits string with email format using pipe", () => {
      const schemas: NamedSchemaIR[] = [
        createNamedSchema("Email", { kind: "string", format: "email" }),
      ];
      const result = valibotEmitter.emit(schemas);

      expect(result.content).toContain("v.pipe(v.string(), v.email())");
    });

    it("emits number schema", () => {
      const schemas: NamedSchemaIR[] = [
        createNamedSchema("Age", { kind: "number" }),
      ];
      const result = valibotEmitter.emit(schemas);

      expect(result.content).toContain("v.number()");
    });

    it("emits integer schema", () => {
      const schemas: NamedSchemaIR[] = [
        createNamedSchema("Count", { kind: "number", integer: true }),
      ];
      const result = valibotEmitter.emit(schemas);

      expect(result.content).toContain("v.pipe(v.number(), v.integer())");
    });

    it("emits enum schema using picklist", () => {
      const schemas: NamedSchemaIR[] = [
        createNamedSchema("Status", {
          kind: "enum",
          values: ["active", "inactive"],
        }),
      ];
      const result = valibotEmitter.emit(schemas);

      expect(result.content).toContain('v.picklist(["active", "inactive"])');
    });

    it("emits array schema", () => {
      const schemas: NamedSchemaIR[] = [
        createNamedSchema("Tags", {
          kind: "array",
          items: { kind: "string" },
        }),
      ];
      const result = valibotEmitter.emit(schemas);

      expect(result.content).toContain("v.array(v.string())");
    });

    it("emits object schema with required and optional fields", () => {
      const schemas: NamedSchemaIR[] = [
        createNamedSchema("User", {
          kind: "object",
          properties: {
            id: { schema: { kind: "string" }, required: true },
            email: { schema: { kind: "string" }, required: false },
          },
        }),
      ];
      const result = valibotEmitter.emit(schemas);

      expect(result.content).toContain("v.object({");
      expect(result.content).toContain("id: v.string()");
      expect(result.content).toContain("v.nullish(v.string())");
    });

    it("emits union schema", () => {
      const schemas: NamedSchemaIR[] = [
        createNamedSchema("StringOrNumber", {
          kind: "union",
          members: [{ kind: "string" }, { kind: "number" }],
        }),
      ];
      const result = valibotEmitter.emit(schemas);

      expect(result.content).toContain("v.union([v.string(), v.number()])");
    });
  });
});

// ============================================================================
// ArkType Emitter Tests
// ============================================================================

describe("ArkType Emitter", () => {
  describe("getImportStatement", () => {
    it("returns correct ArkType import", () => {
      expect(arktypeEmitter.getImportStatement()).toBe(
        'import { type } from "arktype"',
      );
    });
  });

  describe("getTypeInference", () => {
    it("returns correct type inference", () => {
      expect(arktypeEmitter.getTypeInference("petSchema", "Pet")).toBe(
        "export type Pet = typeof petSchema.infer",
      );
    });
  });

  describe("emit", () => {
    it("emits string schema", () => {
      const schemas: NamedSchemaIR[] = [
        createNamedSchema("Name", { kind: "string" }),
      ];
      const result = arktypeEmitter.emit(schemas);

      expect(result.content).toContain('type("string")');
    });

    it("emits string with email format", () => {
      const schemas: NamedSchemaIR[] = [
        createNamedSchema("Email", { kind: "string", format: "email" }),
      ];
      const result = arktypeEmitter.emit(schemas);

      expect(result.content).toContain('type("string.email")');
    });

    it("emits number schema", () => {
      const schemas: NamedSchemaIR[] = [
        createNamedSchema("Age", { kind: "number" }),
      ];
      const result = arktypeEmitter.emit(schemas);

      expect(result.content).toContain('type("number")');
    });

    it("emits integer schema", () => {
      const schemas: NamedSchemaIR[] = [
        createNamedSchema("Count", { kind: "number", integer: true }),
      ];
      const result = arktypeEmitter.emit(schemas);

      expect(result.content).toContain('type("number.integer")');
    });

    it("emits enum schema", () => {
      const schemas: NamedSchemaIR[] = [
        createNamedSchema("Status", {
          kind: "enum",
          values: ["active", "inactive"],
        }),
      ];
      const result = arktypeEmitter.emit(schemas);

      // ArkType uses type.enumerated() for enums
      expect(result.content).toContain('type.enumerated("active", "inactive")');
    });

    it("emits array schema", () => {
      const schemas: NamedSchemaIR[] = [
        createNamedSchema("Tags", {
          kind: "array",
          items: { kind: "string" },
        }),
      ];
      const result = arktypeEmitter.emit(schemas);

      expect(result.content).toContain('type("string[]")');
    });

    it("emits object schema with required and optional fields", () => {
      const schemas: NamedSchemaIR[] = [
        createNamedSchema("User", {
          kind: "object",
          properties: {
            id: { schema: { kind: "string" }, required: true },
            email: { schema: { kind: "string" }, required: false },
          },
        }),
      ];
      const result = arktypeEmitter.emit(schemas);

      expect(result.content).toContain("type({");
      // ArkType quotes all property names
      expect(result.content).toContain('"id": "string"');
      // Optional fields use "key?" syntax
      expect(result.content).toContain('"email?":');
    });

    it("emits union schema", () => {
      const schemas: NamedSchemaIR[] = [
        createNamedSchema("StringOrNumber", {
          kind: "union",
          members: [{ kind: "string" }, { kind: "number" }],
        }),
      ];
      const result = arktypeEmitter.emit(schemas);

      expect(result.content).toContain('type("string | number")');
    });
  });
});

// ============================================================================
// Cross-Emitter Consistency Tests
// ============================================================================

describe("Cross-Emitter Consistency", () => {
  const testSchemas: NamedSchemaIR[] = [
    createNamedSchema("Status", {
      kind: "enum",
      values: ["active", "pending"],
    }),
    createNamedSchema("Pet", {
      kind: "object",
      properties: {
        id: { schema: { kind: "string" }, required: true },
        name: { schema: { kind: "string" }, required: true },
        status: { schema: { kind: "ref", name: "Status" }, required: true },
        age: { schema: { kind: "number", integer: true }, required: false },
      },
    }),
  ];

  it("all emitters produce valid output with no warnings for basic schema", () => {
    for (const validator of supportedValidators) {
      const emitter = getEmitter(validator);
      const result = emitter.emit(testSchemas);

      expect(result.content).toBeTruthy();
      expect(result.warnings).toHaveLength(0);
    }
  });

  it("all emitters include file header", () => {
    for (const validator of supportedValidators) {
      const emitter = getEmitter(validator);
      const result = emitter.emit(testSchemas);

      expect(result.content).toContain("eslint-disable");
      expect(result.content).toContain("auto-generated by tangrams");
    }
  });

  it("all emitters export schema and type", () => {
    for (const validator of supportedValidators) {
      const emitter = getEmitter(validator);
      const result = emitter.emit(testSchemas);

      expect(result.content).toContain("export const statusSchema");
      expect(result.content).toContain("export const petSchema");
      expect(result.content).toContain("export type Status");
      expect(result.content).toContain("export type Pet");
    }
  });
});
