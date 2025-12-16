---
"tangrams": minor
---

Add on-demand sync mode for TanStack DB collections with predicate push-down support.

- New `syncMode` config option for collections (`"full"` | `"on-demand"`)
- New `predicateMapping` config option with 4 presets: `"rest-simple"`, `"jsonapi"`, `"hasura"`, `"prisma"`
- Auto-detection of filter/sort/pagination capabilities from OpenAPI query parameters and GraphQL input types
- Generated predicate translator functions that convert TanStack DB predicates to API-specific formats
