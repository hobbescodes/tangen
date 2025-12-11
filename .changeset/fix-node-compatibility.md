---
"tangen": patch
---

Fix CLI compatibility with Node.js by replacing Bun-specific `Bun.file().exists()` API with Node.js `fs/promises` access check.
