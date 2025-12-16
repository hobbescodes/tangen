import { graphqlHandlers } from "./graphql";
import { restHandlers } from "./rest";

export const handlers = [...restHandlers, ...graphqlHandlers];

// Re-export individual handlers for selective use
export { graphqlHandlers } from "./graphql";
export { restHandlers } from "./rest";
