---
"tangen": minor
---

Add multi-source configuration and OpenAPI support

## New Features

### Multi-Source Configuration

tangen now supports multiple data sources in a single configuration file. This enables you to generate TanStack Query helpers from both GraphQL endpoints and OpenAPI specs in one project.

```typescript
import { defineConfig } from "tangen";

export default defineConfig({
  sources: [
    {
      name: "graphql-api",
      type: "graphql",
      schema: { url: "http://localhost:4000/graphql" },
      documents: "./src/graphql/**/*.graphql",
    },
    {
      name: "rest-api",
      type: "openapi",
      spec: "./openapi.yaml",
    },
  ],
  output: {
    dir: "./src/generated",
  },
});
```

With multiple sources, generated files are organized by source name:
```
src/generated/
├── graphql-api/
│   ├── client.ts
│   ├── types.ts
│   └── operations.ts
└── rest-api/
    ├── client.ts
    ├── types.ts
    └── operations.ts
```

### OpenAPI Support

Generate TanStack Query helpers from OpenAPI/Swagger specifications:

- **Local and Remote Specs**: Load specs from local files or remote URLs
- **Path Filtering**: Include/exclude specific API paths using glob patterns
- **Zod Schema Generation**: Generates Zod schemas for runtime validation
- **better-fetch Client**: Uses `@better-fetch/fetch` as the HTTP client
- **Full Type Safety**: Generates TypeScript types inferred from Zod schemas

OpenAPI source configuration options:
- `spec`: Path to OpenAPI spec file (local path or URL)
- `headers`: Headers for fetching remote specs (e.g., for authentication)
- `include`: Glob patterns for paths to include (e.g., `["/users/**"]`)
- `exclude`: Glob patterns for paths to exclude (e.g., `["/internal/**"]`)

### CLI Enhancements

The `init` command now supports a `--source` flag:
```bash
tangen init --source graphql  # GraphQL only (default)
tangen init --source openapi  # OpenAPI only
tangen init --source both     # Both GraphQL and OpenAPI
```

### Watch Mode Improvements

Watch mode now monitors:
- GraphQL document files (`.graphql`)
- Local OpenAPI spec files
- Config file changes

Remote specs (URLs) are cached and only re-fetched when pressing `r` to force refresh.

## Backward Compatibility

**The legacy single-source GraphQL configuration continues to work.** Existing configurations do not need to be updated:

```typescript
// This still works!
export default defineConfig({
  schema: { url: "http://localhost:4000/graphql" },
  documents: "./src/graphql/**/*.graphql",
  output: { dir: "./src/generated" },
});
```

Legacy configurations are automatically normalized to the multi-source format internally.

## New Peer Dependencies (for OpenAPI)

If using OpenAPI sources, install the following peer dependencies:
```bash
bun add @better-fetch/fetch zod
```

These are optional - only required when using OpenAPI sources.

## Migration Guide

To migrate from legacy to multi-source format:

**Before:**
```typescript
export default defineConfig({
  schema: { url: "http://localhost:4000/graphql" },
  documents: "./src/graphql/**/*.graphql",
  scalars: { DateTime: "Date" },
  output: { dir: "./src/generated" },
});
```

**After:**
```typescript
export default defineConfig({
  sources: [
    {
      name: "graphql",
      type: "graphql",
      schema: { url: "http://localhost:4000/graphql" },
      documents: "./src/graphql/**/*.graphql",
      scalars: { DateTime: "Date" },
    },
  ],
  output: { dir: "./src/generated" },
});
```

Note: With a single source, the output directory structure remains unchanged.
