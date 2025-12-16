---
"tangrams": patch
---

Simplify TanStack Form options generation:

- Use empty object with type assertion (`{} as TypeName`) for `defaultValues` instead of generating default values from Zod schemas
- Remove complex default value extraction and generation logic
- Simplify both OpenAPI and GraphQL form generation adapters
- Remove `defaults.ts` and related code (no longer needed)

This change simplifies the generated output and removes edge cases around nested objects, nullable arrays, and enum defaults. Users who need specific default values can override `defaultValues` when using the form options.
