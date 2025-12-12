---
"tangrams": patch
---

Fix TanStack Start detection to check the user's `package.json` directly instead of using Node's module resolution. This fixes detection issues when running via `bunx` or in various monorepo setups.
