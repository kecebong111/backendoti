import type { UserPayload } from './utils/jwt';

/**
 * Hono context variables
 * This defines what custom data can be stored in the request context (c.set/c.get)
 */
export type Variables = {
  user: UserPayload;
  jwtPayload: UserPayload;
};

/**
 * Hono app environment type
 * Use this when creating Hono instances to get proper TypeScript support
 */
export type AppEnv = {
  Variables: Variables;
};
