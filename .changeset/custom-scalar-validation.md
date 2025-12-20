---
"tangrams": patch
---

Add validation for custom scalar mappings in GraphQL config. Previously, invalid scalar values like `{ DateTime: "string" }` instead of `{ DateTime: "z.string()" }` would generate broken code. Now, tangrams validates that scalar values are valid expressions for the selected validator and throws a helpful error with suggestions (e.g., `Did you mean "z.string()"?`).
