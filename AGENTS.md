# AGENTS.md

## Commands
- **Install**: `bun install`
- **Build**: `bun run build`
- **Lint**: `bun run lint` (fix: `bun run lint:fix`)
- **Format**: `bun run format`
- **Typecheck**: `bun run typecheck`
- **Test all**: `bun test`
- **Test single**: `bun test <file>` (e.g., `bun test test/generator.test.ts`)

## Code Style (Biome)
- Tabs for indentation, double quotes, no semicolons (except when required)
- Imports are auto-organized; use `@/*` alias for `./src/*`
- Use `type` imports for type-only imports (`import type { X } from "y"`)

## Naming Conventions
- Files: `kebab-case.ts`
- Types/Interfaces: `PascalCase`
- Functions/Variables: `camelCase`
- Constants: `camelCase` (not SCREAMING_CASE)

## Error Handling
- Use Zod for config/input validation with descriptive error messages
- Throw `Error` with clear, actionable messages

## Bun-First
- Use Bun runtime, not Node.js. See CLAUDE.md for Bun-specific APIs.

## Changesets
- Add a changeset for any user-facing CLI changes (new features, breaking changes, bug fixes)
- Run `bunx changeset` or create a markdown file in `.changeset/` with the format:
  ```md
  ---
  "tangen": patch | minor | major
  ---
  Description of the change.
  ```
- Use `patch` for bug fixes, `minor` for new features, `major` for breaking changes
