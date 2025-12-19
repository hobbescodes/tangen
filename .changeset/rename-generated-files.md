---
"tangrams": minor
---

Rename generated output files for better clarity:

- `query/operations.ts` → `query/options.ts`
- `form/forms.ts` → `form/options.ts`

This aligns naming with `db/collections.ts` by using descriptive file names that reflect their contents (query/mutation options and form options respectively).

**Breaking Change:** Update your imports from `/query/operations` to `/query/options` and `/form/forms` to `/form/options`.
