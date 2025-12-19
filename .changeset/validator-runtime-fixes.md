---
"tangrams": patch
---

Fix validator schema generation issues discovered through runtime validation testing

- Fix Valibot datetime format to use `v.pipe(v.string(), v.isoTimestamp())` instead of `v.isoDateTime()` for proper ISO 8601 validation with seconds and timezone
- Fix property name double-quoting where names with special characters (e.g., `special-name`) were incorrectly quoted twice in generated schemas
