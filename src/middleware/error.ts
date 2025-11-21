import type { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { ZodError } from 'zod';

interface ValidationResult {
  success: boolean;
  error?: {
    issues: Array<{ message: string }>;
  };
}

/**
 * Validation hook for zValidator - returns clean error messages
 */
export const validationHook = (result: ValidationResult, c: Context) => {
  if (!result.success) {
    return c.json({ error: result.error?.issues?.[0]?.message }, 400);
  }
};

/**
 * Global error handler
 */
export function errorHandler(err: Error | ZodError, c: Context) {
  // Handle HTTPException (thrown by our code)
  if (err instanceof HTTPException) {
    // Ensure HTTPException responses have correct content-type
    return c.json({ error: err.message }, err.status);
  }

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    return c.json(
      {
        error: 'Validation error',
        details: err.issues.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      },
      400
    );
  }

  // Handle other errors
  console.error('Unhandled error:', err);
  return c.json({ error: err.message || 'Internal server error' }, 500);
}

/**
 * 404 Not Found handler
 */
export function notFoundHandler(c: Context) {
  return c.json({ error: 'Not Found' }, 404);
}
