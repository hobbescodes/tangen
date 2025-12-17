import { setupServer } from "msw/node";

import { handlers } from "./handlers";

export const server = setupServer(...handlers);

// Re-export handlers for convenience
export { handlers } from "./handlers";
