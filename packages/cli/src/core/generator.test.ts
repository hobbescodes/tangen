import { describe, expect, it } from "vitest";

import { validateServerFunctionsRequirements } from "./generator";

describe("validateServerFunctionsRequirements", () => {
  /**
   * Helper to create a mock resolve function
   */
  function createMockResolve(installedPackages: string[]) {
    return (moduleName: string) => {
      if (installedPackages.includes(moduleName)) {
        return `/fake/node_modules/${moduleName}/index.js`;
      }
      throw new Error(`Cannot find module '${moduleName}'`);
    };
  }

  it("does not throw when serverFunctions is false", () => {
    // Even with no packages installed, should not throw
    const resolve = createMockResolve([]);

    expect(() =>
      validateServerFunctionsRequirements("test-source", false, resolve),
    ).not.toThrow();
  });

  it("does not throw when both packages are installed", () => {
    const resolve = createMockResolve([
      "@tanstack/react-router",
      "@tanstack/react-start",
    ]);

    expect(() =>
      validateServerFunctionsRequirements("test-source", true, resolve),
    ).not.toThrow();
  });

  it("throws when @tanstack/react-router is not installed", () => {
    // Only react-start is installed
    const resolve = createMockResolve(["@tanstack/react-start"]);

    expect(() =>
      validateServerFunctionsRequirements("my-api", true, resolve),
    ).toThrowError(
      'Source "my-api" has serverFunctions enabled but @tanstack/react-router is not installed.',
    );
  });

  it("throws when @tanstack/react-start is not installed", () => {
    // Only react-router is installed
    const resolve = createMockResolve(["@tanstack/react-router"]);

    expect(() =>
      validateServerFunctionsRequirements("my-api", true, resolve),
    ).toThrowError(
      'Source "my-api" has serverFunctions enabled but @tanstack/react-start is not installed.',
    );
  });

  it("throws when neither package is installed", () => {
    const resolve = createMockResolve([]);

    // Should fail on react-router first since it's checked first
    expect(() =>
      validateServerFunctionsRequirements("my-api", true, resolve),
    ).toThrowError(
      'Source "my-api" has serverFunctions enabled but @tanstack/react-router is not installed.',
    );
  });

  it("includes install instructions in error message", () => {
    const resolve = createMockResolve([]);

    expect(() =>
      validateServerFunctionsRequirements("test-source", true, resolve),
    ).toThrowError("bun add @tanstack/react-router @tanstack/react-start");
  });

  it("includes TanStack Start requirement explanation in error message", () => {
    const resolve = createMockResolve([]);

    expect(() =>
      validateServerFunctionsRequirements("test-source", true, resolve),
    ).toThrowError(
      "TanStack Start requires both @tanstack/react-router and @tanstack/react-start",
    );
  });

  it("checks @tanstack/react-router before @tanstack/react-start", () => {
    const callOrder: string[] = [];
    const trackingResolve = (moduleName: string) => {
      callOrder.push(moduleName);
      return `/fake/node_modules/${moduleName}/index.js`;
    };

    validateServerFunctionsRequirements("test-source", true, trackingResolve);

    expect(callOrder).toEqual([
      "@tanstack/react-router",
      "@tanstack/react-start",
    ]);
  });

  it("uses source name in error message", () => {
    const resolve = createMockResolve([]);

    expect(() =>
      validateServerFunctionsRequirements("custom-api-source", true, resolve),
    ).toThrowError('Source "custom-api-source" has serverFunctions enabled');
  });
});
