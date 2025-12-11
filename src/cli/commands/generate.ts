import { defineCommand } from "citty";
import consola from "consola";

import { loadTangenConfig } from "../../core/config";
import { generate } from "../../core/generator";

import type { DotenvOptions } from "c12";

export const generateCommand = defineCommand({
  meta: {
    name: "generate",
    description: "Generate TanStack Query artifacts from GraphQL schema",
  },
  args: {
    config: {
      type: "string",
      alias: "c",
      description: "Path to config file",
    },
    force: {
      type: "boolean",
      alias: "f",
      description: "Force regeneration of all files including client",
      default: false,
    },
    "env-file": {
      type: "string",
      description: "Path to env file (can be specified multiple times)",
    },
    "no-dotenv": {
      type: "boolean",
      description: "Disable automatic .env file loading",
      default: false,
    },
  },
  async run({ args }) {
    try {
      consola.start("Loading configuration...");

      // Determine dotenv option based on flags
      let dotenv: boolean | DotenvOptions = true;
      if (args["no-dotenv"]) {
        dotenv = false;
      } else if (args["env-file"]) {
        // Handle both single value and array (from repeated flags)
        const envFiles = Array.isArray(args["env-file"])
          ? args["env-file"]
          : [args["env-file"]];
        dotenv = { fileName: envFiles };
      }

      const config = await loadTangenConfig({
        configPath: args.config,
        dotenv,
      });

      consola.start("Generating TanStack Query artifacts...");
      await generate({ config, force: args.force });

      consola.success("Generation complete!");
    } catch (error) {
      if (error instanceof Error) {
        consola.error(error.message);
      } else {
        consola.error("An unexpected error occurred");
      }
      process.exit(1);
    }
  },
});
