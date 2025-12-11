---
"tangen": minor
---

Add automatic `.env` file loading for environment variables in config files. Environment variables defined in `.env` are now available when evaluating `tangen.config.ts`. Added `--env-file` flag to specify custom env files (can be used multiple times) and `--no-dotenv` flag to disable this behavior.
