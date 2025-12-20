---
"tangrams": patch
---

Fix infinite query detection to be schema-driven rather than variable-name dependent. Previously, `infiniteQueryOptions` would only be generated if GraphQL variable names matched expected patterns (e.g., `$first`, `$after`). Now, detection analyzes the schema field's arguments and return type directly, allowing any variable names (e.g., `$pageSize` instead of `$first`, `$cursor` instead of `$after`) as long as the schema field supports Relay-style pagination.
