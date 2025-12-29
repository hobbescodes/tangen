import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import { tangrams } from "tangrams/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    devtools(),
    tsconfigPaths(),
    tangrams({
      sources: [
        {
          name: "api",
          type: "openapi",
          spec: "../shared/mocks/schemas/openapi.yaml",
          generates: ["query", "form", "db"],
          overrides: {
            db: {
              collections: {
                // Pets use full sync (default) - good for small datasets
                Pet: {
                  syncMode: "full",
                },
                // Users use on-demand sync - demonstrates predicate push-down
                User: {
                  syncMode: "on-demand",
                  predicateMapping: "rest-simple",
                },
              },
            },
          },
        },
      ],
    }),
    tanstackStart({
      spa: { enabled: true },
    }),
    react(),
    tailwindcss(),
  ],
});
