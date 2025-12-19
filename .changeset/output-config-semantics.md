---
"tangrams": minor
---

**Breaking Change:** Changed `output` config semantics.

The `output` option now specifies where to place the `tangrams` folder, rather than the full output path. The `tangrams` directory name is now hardcoded and always appended to the configured output path.

- **New default:** `"."` (project root)
- **Old default:** `"./tangrams"`

**Migration:**

- If using the default config, no changes needed - output location remains `./tangrams/<source>/...`
- If using a custom path like `output: "./src/generated"`, change to `output: "./src"` to generate at `./src/tangrams/<source>/...`
