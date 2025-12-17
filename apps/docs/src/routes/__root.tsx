import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRoute,
} from "@tanstack/react-router";
import { RootProvider } from "fumadocs-ui/provider/tanstack";

import { generateMetadata } from "@/lib/util/generateMetadata";
import appCss from "../../styles/app.css?url";

export const Route = createRootRoute({
  head: () => {
    const { meta, links } = generateMetadata({
      description: "Generate TanStack artifacts that just fit.",
      icons: [
        { rel: "shortcut icon", url: "/img/favicon.ico" },
        { rel: "icon", url: "/img/favicon-32x32.png" },
        { rel: "apple-touch-icon", url: "/img/apple-touch-icon.png" },
      ],
      manifest: "/img/site.webmanifest",
      twitter: {
        card: "summary_large_image",
        creator: "@hobbescodes",
        images: "/tangrams-logo.png",
        title: "Tangrams",
        description: "Generate TanStack artifacts that just fit.",
      },
    });

    return {
      meta,
      links: [...links, { rel: "stylesheet", href: appCss }],
    };
  },
  component: RootComponent,
});

function RootComponent() {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <HeadContent />
      </head>
      <body className="flex min-h-screen flex-col">
        <RootProvider>
          <Outlet />
        </RootProvider>
        <Scripts />
      </body>
    </html>
  );
}
