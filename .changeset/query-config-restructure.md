---
"tangen": major
---

Restructure config to support multiple TanStack libraries.

**Breaking Changes:**

1. **Config structure changed** - All existing config options are now nested under a `query` key:

   ```typescript
   // Before
   defineConfig({
     sources: [...],
     output: { dir: "./src/generated" }
   })

   // After
   defineConfig({
     query: {
       sources: [...],
       output: { dir: "./src/generated" }
     }
   })
   ```

2. **Output directory structure changed** - Generated files are now always placed in `<output.dir>/query/<source-name>/`:

   ```
   # Before (single source)
   src/generated/
   ├── client.ts
   ├── types.ts
   └── operations.ts

   # After (single source)
   src/generated/query/<source-name>/
   ├── client.ts
   ├── types.ts
   └── operations.ts
   ```

3. **Query/mutation keys now always include source name** - For better namespacing and consistency:

   ```typescript
   // Before
   queryKey: ["GetUser", variables]

   // After
   queryKey: ["graphql", "GetUser", variables]
   ```

This restructuring prepares tangen to support generating artifacts for other TanStack libraries (router, form, etc.) in the future.
