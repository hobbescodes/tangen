---
"tangrams": patch
---

Fix TanStack DB collection generation and standardize import structure in generated files.

- Fix path parameter name mismatch in collection mutation handlers (was using entity `keyField` instead of API path parameter name)
- Remove unused type imports from generated `collections.ts` files
- Standardize import structure across all generated files to match biome.json import ordering:
  1. External packages (sorted alphabetically)
  2. Internal imports (sorted alphabetically)
  3. Type imports (sorted alphabetically)
