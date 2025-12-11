import { existsSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";

import { defineCommand } from "citty";
import consola from "consola";

import {
  generateDefaultConfig,
  generateMultiSourceConfig,
} from "../../core/config";

export type SourceType = "graphql" | "openapi" | "both";

/**
 * Get the config content based on source type
 */
export function getConfigContent(sourceType: SourceType): string {
  switch (sourceType) {
    case "graphql":
      return generateDefaultConfig();
    case "openapi":
      return generateMultiSourceConfig({ openapi: true });
    case "both":
      return generateMultiSourceConfig({ graphql: true, openapi: true });
    default:
      return generateDefaultConfig();
  }
}

/**
 * Get the next steps message based on source type
 */
export function getNextStepsMessage(sourceType: SourceType): string[] {
  const steps: string[] = [];

  switch (sourceType) {
    case "graphql":
      steps.push("1. Update the schema URL in tangen.config.ts");
      steps.push("2. Create your GraphQL operation files (.graphql)");
      steps.push("3. Run `tangen generate` to generate TypeScript code");
      break;
    case "openapi":
      steps.push("1. Update the spec path/URL in tangen.config.ts");
      steps.push("2. Run `tangen generate` to generate TypeScript code");
      steps.push("3. Install peer dependencies: @better-fetch/fetch zod");
      break;
    case "both":
      steps.push("1. Update the schema URLs/paths in tangen.config.ts");
      steps.push("2. Create your GraphQL operation files (.graphql)");
      steps.push("3. Run `tangen generate` to generate TypeScript code");
      steps.push(
        "4. Install peer dependencies for OpenAPI: @better-fetch/fetch zod",
      );
      break;
  }

  return steps;
}

export const initCommand = defineCommand({
  meta: {
    name: "init",
    description: "Initialize a tangen configuration file",
  },
  args: {
    force: {
      type: "boolean",
      alias: "f",
      description: "Overwrite existing config file",
      default: false,
    },
    source: {
      type: "string",
      alias: "s",
      description: "Source type: graphql, openapi, or both",
      default: "graphql",
    },
  },
  async run({ args }) {
    const configPath = join(process.cwd(), "tangen.config.ts");

    // Validate source type
    const validSourceTypes = ["graphql", "openapi", "both"];
    if (!validSourceTypes.includes(args.source)) {
      consola.error(
        `Invalid source type "${args.source}". Must be one of: ${validSourceTypes.join(", ")}`,
      );
      process.exit(1);
    }

    if (existsSync(configPath) && !args.force) {
      consola.error(
        `Config file already exists at ${configPath}. Use --force to overwrite.`,
      );
      process.exit(1);
    }

    const sourceType = args.source as SourceType;
    const configContent = getConfigContent(sourceType);
    await writeFile(configPath, configContent, "utf-8");

    consola.success("Created tangen.config.ts");
    consola.info("Next steps:");
    for (const step of getNextStepsMessage(sourceType)) {
      consola.info(`  ${step}`);
    }
  },
});
