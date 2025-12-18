/**
 * Emitter registry
 *
 * Provides access to all available emitters for converting IR to validator code.
 */

import { arktypeEmitter } from "./arktype";
import { valibotEmitter } from "./valibot";
import { zodEmitter } from "./zod";

import type { Emitter, ValidatorLibrary } from "./types";

// ============================================================================
// Emitter Registry
// ============================================================================

/**
 * All available emitters
 */
export const emitters: Record<ValidatorLibrary, Emitter> = {
  zod: zodEmitter,
  valibot: valibotEmitter,
  arktype: arktypeEmitter,
};

/**
 * Get an emitter by library name
 */
export function getEmitter(library: ValidatorLibrary): Emitter {
  const emitter = emitters[library];
  if (!emitter) {
    throw new Error(
      `Unknown validator library: ${library}. Supported libraries: ${Object.keys(emitters).join(", ")}`,
    );
  }
  return emitter;
}

/**
 * Check if a string is a valid validator library name
 */
export function isValidatorLibrary(value: string): value is ValidatorLibrary {
  return value === "zod" || value === "valibot" || value === "arktype";
}

/**
 * List of all supported validator libraries
 */
export const supportedValidators: ValidatorLibrary[] = [
  "zod",
  "valibot",
  "arktype",
];

// Re-export individual emitters for direct access if needed
export { arktypeEmitter } from "./arktype";
export { valibotEmitter } from "./valibot";
export { zodEmitter } from "./zod";

// Re-export types
export type {
  Emitter,
  EmitterOptions,
  EmitterResult,
  ValidatorLibrary,
} from "./types";
