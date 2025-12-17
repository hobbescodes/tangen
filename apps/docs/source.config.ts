import { defineConfig, defineDocs } from "fumadocs-mdx/config";

import type { DocsCollection } from "fumadocs-mdx/config";

export const docs: DocsCollection = defineDocs({
  dir: "content/docs",
});

export default defineConfig({
  mdxOptions: {
    // Add any MDX plugins here
  },
});
