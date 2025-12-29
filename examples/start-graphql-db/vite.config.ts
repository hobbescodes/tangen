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
          type: "graphql",
          schema: {
            file: "../shared/mocks/schemas/schema.graphql",
          },
          url: "http://localhost:3000/graphql",
          documents: "./src/graphql/operations.graphql",
          generates: ["db"],
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
