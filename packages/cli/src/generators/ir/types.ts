/**
 * Schema Intermediate Representation (IR)
 *
 * A validator-agnostic representation of schema types that can be
 * converted to any Standard Schema compliant validation library.
 */

// ============================================================================
// Core Types
// ============================================================================

export type SchemaIRKind =
  | "string"
  | "number"
  | "boolean"
  | "bigint"
  | "null"
  | "undefined"
  | "unknown"
  | "never"
  | "date"
  | "object"
  | "array"
  | "tuple"
  | "record"
  | "enum"
  | "literal"
  | "union"
  | "intersection"
  | "ref"
  | "raw";

export interface SchemaIRBase {
  kind: SchemaIRKind;
  description?: string;
}

// ============================================================================
// Primitive Types
// ============================================================================

export type StringFormat =
  | "email"
  | "url"
  | "uuid"
  | "datetime"
  | "date"
  | "time"
  | "ipv4"
  | "ipv6";

export interface StringSchemaIR extends SchemaIRBase {
  kind: "string";
  format?: StringFormat;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
}

export interface NumberSchemaIR extends SchemaIRBase {
  kind: "number";
  integer?: boolean;
  min?: number;
  max?: number;
}

export interface BooleanSchemaIR extends SchemaIRBase {
  kind: "boolean";
}

export interface BigIntSchemaIR extends SchemaIRBase {
  kind: "bigint";
}

export interface NullSchemaIR extends SchemaIRBase {
  kind: "null";
}

export interface UndefinedSchemaIR extends SchemaIRBase {
  kind: "undefined";
}

export interface UnknownSchemaIR extends SchemaIRBase {
  kind: "unknown";
}

export interface NeverSchemaIR extends SchemaIRBase {
  kind: "never";
}

export interface DateSchemaIR extends SchemaIRBase {
  kind: "date";
}

// ============================================================================
// Complex Types
// ============================================================================

export interface ObjectPropertyIR {
  schema: SchemaIR;
  required: boolean;
  description?: string;
}

export interface ObjectSchemaIR extends SchemaIRBase {
  kind: "object";
  properties: Record<string, ObjectPropertyIR>;
  /** Additional properties: true = passthrough, false = strict, SchemaIR = typed catchall */
  additionalProperties?: boolean | SchemaIR;
}

export interface ArraySchemaIR extends SchemaIRBase {
  kind: "array";
  items: SchemaIR;
}

export interface TupleSchemaIR extends SchemaIRBase {
  kind: "tuple";
  items: SchemaIR[];
}

export interface RecordSchemaIR extends SchemaIRBase {
  kind: "record";
  keyType: SchemaIR; // Usually string
  valueType: SchemaIR;
}

// ============================================================================
// Union & Literal Types
// ============================================================================

export interface EnumSchemaIR extends SchemaIRBase {
  kind: "enum";
  values: (string | number)[];
}

export interface LiteralSchemaIR extends SchemaIRBase {
  kind: "literal";
  value: string | number | boolean;
}

export interface UnionSchemaIR extends SchemaIRBase {
  kind: "union";
  members: SchemaIR[];
}

export interface IntersectionSchemaIR extends SchemaIRBase {
  kind: "intersection";
  members: SchemaIR[];
}

// ============================================================================
// Reference Type
// ============================================================================

export interface RefSchemaIR extends SchemaIRBase {
  kind: "ref";
  name: string; // References another named schema
}

// ============================================================================
// Raw Type (for custom scalar mappings - emitted verbatim)
// ============================================================================

export interface RawSchemaIR extends SchemaIRBase {
  kind: "raw";
  /** The raw code string to emit (validator-specific) */
  code: string;
}

// ============================================================================
// Union of All Schema Types
// ============================================================================

export type SchemaIR =
  | StringSchemaIR
  | NumberSchemaIR
  | BooleanSchemaIR
  | BigIntSchemaIR
  | NullSchemaIR
  | UndefinedSchemaIR
  | UnknownSchemaIR
  | NeverSchemaIR
  | DateSchemaIR
  | ObjectSchemaIR
  | ArraySchemaIR
  | TupleSchemaIR
  | RecordSchemaIR
  | EnumSchemaIR
  | LiteralSchemaIR
  | UnionSchemaIR
  | IntersectionSchemaIR
  | RefSchemaIR
  | RawSchemaIR;

// ============================================================================
// Nullable/Optional Wrapper
// ============================================================================

/**
 * Represents a schema with nullable/optional modifiers.
 * Used internally during IR construction to track modifiers
 * before flattening into the final schema.
 */
export interface ModifiedSchemaIR {
  schema: SchemaIR;
  /** Schema can be null */
  nullable?: boolean;
  /** Schema can be undefined (for object properties) */
  optional?: boolean;
  /** Schema can be null or undefined (nullish) */
  nullish?: boolean;
}

// ============================================================================
// Named Schema Entry
// ============================================================================

/**
 * Category of schema for organization and output grouping
 */
export type SchemaCategory =
  | "enum"
  | "input"
  | "response"
  | "params"
  | "fragment"
  | "component"
  | "variables";

/**
 * A named schema entry ready for code generation
 */
export interface NamedSchemaIR {
  /** The schema name (PascalCase, e.g., "Pet", "CreatePetRequest") */
  name: string;
  /** The schema definition */
  schema: SchemaIR;
  /** Names of other schemas this one depends on */
  dependencies: Set<string>;
  /** Category for organization */
  category?: SchemaCategory;
}

// ============================================================================
// Parser Result
// ============================================================================

/**
 * Result of parsing a spec to IR
 */
export interface SchemaIRResult {
  /** Named schemas in dependency order */
  schemas: NamedSchemaIR[];
  /** Warnings encountered during parsing */
  warnings: string[];
}

// ============================================================================
// Type Guards
// ============================================================================

export function isStringSchema(schema: SchemaIR): schema is StringSchemaIR {
  return schema.kind === "string";
}

export function isNumberSchema(schema: SchemaIR): schema is NumberSchemaIR {
  return schema.kind === "number";
}

export function isObjectSchema(schema: SchemaIR): schema is ObjectSchemaIR {
  return schema.kind === "object";
}

export function isArraySchema(schema: SchemaIR): schema is ArraySchemaIR {
  return schema.kind === "array";
}

export function isEnumSchema(schema: SchemaIR): schema is EnumSchemaIR {
  return schema.kind === "enum";
}

export function isUnionSchema(schema: SchemaIR): schema is UnionSchemaIR {
  return schema.kind === "union";
}

export function isRefSchema(schema: SchemaIR): schema is RefSchemaIR {
  return schema.kind === "ref";
}

export function isRawSchema(schema: SchemaIR): schema is RawSchemaIR {
  return schema.kind === "raw";
}

export function isLiteralSchema(schema: SchemaIR): schema is LiteralSchemaIR {
  return schema.kind === "literal";
}

export function isRecordSchema(schema: SchemaIR): schema is RecordSchemaIR {
  return schema.kind === "record";
}

export function isIntersectionSchema(
  schema: SchemaIR,
): schema is IntersectionSchemaIR {
  return schema.kind === "intersection";
}
