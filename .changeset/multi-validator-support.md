---
"tangrams": minor
---

Add multi-validator support with Zod, Valibot, and ArkType

- Add `validator` config option to choose between `"zod"` (default), `"valibot"`, or `"arktype"` for schema generation
- Implement IR (Intermediate Representation) architecture that decouples spec parsing from code generation
- Add dedicated emitters for each validator library with proper syntax and type inference
- All three validators implement Standard Schema, ensuring compatibility with TanStack Form
- Add `valibot` and `arktype` as optional peer dependencies
- Update `buildQuery` function type to accept `null` values for nullish optional fields
- Update documentation with validator configuration examples
