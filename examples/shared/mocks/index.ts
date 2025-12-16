import { setupWorker } from "msw/browser";

import { handlers } from "./handlers";

export const worker = setupWorker(...handlers);

// Re-export data utilities
export * from "./data";
// Re-export handlers for server usage and selective use
export { graphqlHandlers, handlers, restHandlers } from "./handlers";
