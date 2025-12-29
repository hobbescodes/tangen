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
          name: "pets",
          type: "graphql",
          schema: {
            file: "../shared/mocks/schemas/schema.graphql",
          },
          url: "http://localhost:3000/graphql",
          documents: "./src/graphql/operations.graphql",
          generates: ["query", "form"],
        },
        {
          name: "users",
          type: "openapi",
          spec: "../shared/mocks/schemas/openapi.yaml",
          exclude: ["/pets/**"],
          generates: ["query", "form"],
        },
      ],
    }),
    tanstackStart(),
    react(),
    tailwindcss(),
  ],
});
