---
"tangen": minor
---

Change client generation to use async `getClient()` function pattern instead of a singleton. The client file is now only generated once and can be customized by users (e.g., for async auth headers). Use `--force` flag to regenerate all files including the client. Removed `client` config option as headers are now managed directly in the generated client file.
