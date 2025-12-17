---
"tangrams": minor
---

Unify GraphQL type generation into schema.ts using Zod inference

**Breaking Change:** GraphQL sources no longer generate a separate `query/types.ts` file. All types are now inferred from Zod schemas in `schema.ts`.

Before:
```
<source>/
  ├── schema.ts          # Zod schemas (only when form/db enabled)
  ├── query/
  │   ├── types.ts       # TypeScript types + enums
  │   └── operations.ts
```

After:
```
<source>/
  ├── schema.ts          # Zod schemas + inferred types (always when query/form/db enabled)
  ├── query/
  │   └── operations.ts
```

Benefits:
- Single source of truth for types (Zod schemas)
- Consistent type inference between GraphQL and OpenAPI sources
- Eliminates type mismatches between enum definitions and Zod schemas
- Generated types use `z.infer<typeof schema>` pattern

Migration:
- Update imports from `./query/types` to `./schema`
- Enum types are now string literal unions (e.g., `"dog" | "cat"` instead of `enum PetCategory { dog = "dog" }`)
