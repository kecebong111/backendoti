import type { Context, Next } from 'hono';
import { jwt } from 'hono/jwt';
import { HTTPException } from 'hono/http-exception';
import type { UserPayload } from '../utils/jwt.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';

/**
 * JWT middleware using Hono's built-in JWT verification
 */
export const jwtMiddleware = jwt({ secret: JWT_SECRET });

/**
 * Middleware to extract user from JWT payload and attach to context
 * Must be used after jwtMiddleware
 */
export async function authMiddleware(c: Context, next: Next) {
  const payload = c.get('jwtPayload');

  if (!payload) {
    throw new HTTPException(401, { message: 'Unauthorized' });
  }

  // Attach user data to context for easier access
  c.set('user', payload as UserPayload);
  await next();
}

/**
 * Middleware to check if user has required role
 */
export function requireRole(allowedRoles: ('recruiter' | 'candidate')[]) {
  return async (c: Context, next: Next) => {
    const user = c.get('user') as UserPayload;

    if (!allowedRoles.includes(user.role)) {
      throw new HTTPException(403, { message: 'Forbidden - Insufficient permissions' });
    }

    await next();
  };
}
