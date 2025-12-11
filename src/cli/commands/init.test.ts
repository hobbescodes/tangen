import { existsSync } from "node:fs";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  generateDefaultConfig,
  generateMultiSourceConfig,
} from "../../core/config";
import { getConfigContent, getNextStepsMessage } from "./init";

// We test the logic directly rather than the citty command
// to avoid mocking process.cwd() and process.exit()

describe("init command logic", () => {
  const testDir = join(__dirname, ".test-init");
  const configPath = join(testDir, "tangen.config.ts");

  beforeEach(async () => {
    // Create test directory
    await mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    // Cleanup test directory
    await rm(testDir, { recursive: true, force: true });
  });

  describe("when config file does not exist", () => {
    it("creates a config file", async () => {
      const configContent = generateDefaultConfig();
      await writeFile(configPath, configContent, "utf-8");

      expect(existsSync(configPath)).toBe(true);
    });

    it("creates config with valid content", async () => {
      const configContent = generateDefaultConfig();
      await writeFile(configPath, configContent, "utf-8");

      const content = await readFile(configPath, "utf-8");
      expect(content).toContain("defineConfig");
      expect(content).toContain("schema");
      expect(content).toContain("documents");
      expect(content).toContain("output");
    });
  });

  describe("when config file already exists", () => {
    beforeEach(async () => {
      await writeFile(configPath, "existing content", "utf-8");
    });

    it("detects existing config file", () => {
      expect(existsSync(configPath)).toBe(true);
    });

    it("can be forced to overwrite", async () => {
      const newContent = generateDefaultConfig();
      await writeFile(configPath, newContent, "utf-8");

      const content = await readFile(configPath, "utf-8");
      expect(content).toContain("defineConfig");
    });
  });

  describe("generateDefaultConfig", () => {
    it("returns a valid TypeScript config template", () => {
      const config = generateDefaultConfig();

      expect(config).toContain('import { defineConfig } from "tangen"');
      expect(config).toContain("export default defineConfig");
    });

    it("includes schema configuration", () => {
      const config = generateDefaultConfig();

      expect(config).toContain("schema:");
      expect(config).toContain("url:");
    });

    it("includes documents pattern", () => {
      const config = generateDefaultConfig();

      expect(config).toContain("documents:");
      expect(config).toContain(".graphql");
    });

    it("includes output configuration", () => {
      const config = generateDefaultConfig();

      expect(config).toContain("output:");
      expect(config).toContain("dir:");
      expect(config).toContain("client:");
      expect(config).toContain("types:");
      expect(config).toContain("operations:");
    });
  });

  describe("generateMultiSourceConfig", () => {
    it("generates GraphQL-only config", () => {
      const config = generateMultiSourceConfig({ graphql: true });

      expect(config).toContain("sources:");
      expect(config).toContain('type: "graphql"');
      expect(config).not.toContain('type: "openapi"');
    });

    it("generates OpenAPI-only config", () => {
      const config = generateMultiSourceConfig({ openapi: true });

      expect(config).toContain("sources:");
      expect(config).toContain('type: "openapi"');
      expect(config).toContain("spec:");
      expect(config).not.toContain('type: "graphql"');
    });

    it("generates both GraphQL and OpenAPI config", () => {
      const config = generateMultiSourceConfig({
        graphql: true,
        openapi: true,
      });

      expect(config).toContain("sources:");
      expect(config).toContain('type: "graphql"');
      expect(config).toContain('type: "openapi"');
    });
  });

  describe("getConfigContent", () => {
    it("returns default GraphQL config for 'graphql' source type", () => {
      const content = getConfigContent("graphql");

      expect(content).toContain("schema:");
      expect(content).toContain("documents:");
    });

    it("returns OpenAPI config for 'openapi' source type", () => {
      const content = getConfigContent("openapi");

      expect(content).toContain("sources:");
      expect(content).toContain('type: "openapi"');
      expect(content).toContain("spec:");
    });

    it("returns multi-source config for 'both' source type", () => {
      const content = getConfigContent("both");

      expect(content).toContain("sources:");
      expect(content).toContain('type: "graphql"');
      expect(content).toContain('type: "openapi"');
    });
  });

  describe("getNextStepsMessage", () => {
    it("returns GraphQL-specific steps for 'graphql' source type", () => {
      const steps = getNextStepsMessage("graphql");

      expect(steps).toContain("1. Update the schema URL in tangen.config.ts");
      expect(steps.some((s) => s.includes("GraphQL"))).toBe(true);
    });

    it("returns OpenAPI-specific steps for 'openapi' source type", () => {
      const steps = getNextStepsMessage("openapi");

      expect(steps).toContain(
        "1. Update the spec path/URL in tangen.config.ts",
      );
      expect(steps.some((s) => s.includes("@better-fetch/fetch"))).toBe(true);
    });

    it("returns combined steps for 'both' source type", () => {
      const steps = getNextStepsMessage("both");

      expect(steps.some((s) => s.includes("GraphQL"))).toBe(true);
      expect(steps.some((s) => s.includes("@better-fetch/fetch"))).toBe(true);
    });
  });
});
