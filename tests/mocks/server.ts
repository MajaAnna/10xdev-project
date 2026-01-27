import { setupServer } from "msw/node";
import { handlers } from "./handlers";

/**
 * MSW Server configuration for Node.js tests (Vitest)
 *
 * This server intercepts all HTTP requests in tests
 * and returns mocked responses defined in handlers.
 */

export const server = setupServer(...handlers);
