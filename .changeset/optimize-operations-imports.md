---
"tangen": patch
---

Optimize generated operations imports to only include what's actually used. TanStack Query imports now only include `queryOptions` or `mutationOptions` based on the operations defined, and type imports no longer include unused variables types for operations without variables.
