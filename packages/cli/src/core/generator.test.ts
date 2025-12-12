import { describe, expect, it } from "vitest";

import { validateServerFunctionsRequirements } from "./generator";

describe("validateServerFunctionsRequirements", () => {
  /**
   * Helper to create a mock dependencies object
   */
  function createMockDeps(installedPackages: string[]): Record<string, string> {
    const deps: Record<string, string> = {};
    for (const pkg of installedPackages) {
      deps[pkg] = "^1.0.0";
    }
    return deps;
  }

  it("does not throw when serverFunctions is false", async () => {
    // Even with no packages installed, should not throw
    const deps = createMockDeps([]);

    await expect(
      validateServerFunctionsRequirements("test-source", false, deps),
    ).resolves.not.toThrow();
  });

  it("does not throw when both packages are installed", async () => {
    const deps = createMockDeps([
      "@tanstack/react-router",
      "@tanstack/react-start",
    ]);

    await expect(
      validateServerFunctionsRequirements("test-source", true, deps),
    ).resolves.not.toThrow();
  });

  it("throws when @tanstack/react-router is not installed", async () => {
    // Only react-start is installed
    const deps = createMockDeps(["@tanstack/react-start"]);

    await expect(
      validateServerFunctionsRequirements("my-api", true, deps),
    ).rejects.toThrowError(
      'Source "my-api" has serverFunctions enabled but @tanstack/react-router is not installed.',
    );
  });

  it("throws when @tanstack/react-start is not installed", async () => {
    // Only react-router is installed
    const deps = createMockDeps(["@tanstack/react-router"]);

    await expect(
      validateServerFunctionsRequirements("my-api", true, deps),
    ).rejects.toThrowError(
      'Source "my-api" has serverFunctions enabled but @tanstack/react-start is not installed.',
    );
  });

  it("throws when neither package is installed", async () => {
    const deps = createMockDeps([]);

    // Should fail on react-router first since it's checked first
    await expect(
      validateServerFunctionsRequirements("my-api", true, deps),
    ).rejects.toThrowError(
      'Source "my-api" has serverFunctions enabled but @tanstack/react-router is not installed.',
    );
  });

  it("includes install instructions in error message", async () => {
    const deps = createMockDeps([]);

    await expect(
      validateServerFunctionsRequirements("test-source", true, deps),
    ).rejects.toThrowError(
      "bun add @tanstack/react-router @tanstack/react-start",
    );
  });

  it("includes TanStack Start requirement explanation in error message", async () => {
    const deps = createMockDeps([]);

    await expect(
      validateServerFunctionsRequirements("test-source", true, deps),
    ).rejects.toThrowError(
      "TanStack Start requires both @tanstack/react-router and @tanstack/react-start",
    );
  });

  it("uses source name in error message", async () => {
    const deps = createMockDeps([]);

    await expect(
      validateServerFunctionsRequirements("custom-api-source", true, deps),
    ).rejects.toThrowError(
      'Source "custom-api-source" has serverFunctions enabled',
    );
  });
});
