---
"tangrams": minor
---

**BREAKING:** Changed default output directory from `./src/generated` to `./tangrams`.

Users upgrading should either:
- Update their imports to use the new default location
- Explicitly set `output: "./src/generated"` in their config to maintain the previous behavior

We recommend using a `@tangrams/*` path alias in your `tsconfig.json` for cleaner imports:

```json
{
  "compilerOptions": {
    "paths": {
      "@tangrams/*": ["./tangrams/*"]
    }
  },
  "include": ["src", "tangrams"]
}
```
