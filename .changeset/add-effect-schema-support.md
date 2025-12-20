---
"tangrams": minor
---

Add Effect Schema as a fourth validation library option alongside Zod, Valibot, and ArkType.

Effect Schema is part of the Effect ecosystem and uses a functional approach to schema definition. Unlike the other validators which natively implement Standard Schema, Effect Schema requires wrapping with `Schema.standardSchemaV1()` for use with TanStack Form - this wrapping is handled automatically in generated form options.

To use Effect Schema:

```typescript
import { defineConfig } from "tangrams"

export default defineConfig({
  validator: "effect",
  sources: [/* ... */],
})
```

Custom scalar mappings for Effect use the `Schema.` prefix:

```typescript
overrides: {
  scalars: {
    DateTime: "Schema.String",
    JSON: "Schema.Unknown",
  },
}
```
