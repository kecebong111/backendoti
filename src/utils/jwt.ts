import { sign, verify } from 'hono/jwt';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';

export interface UserPayload {
  userId: number;
  email: string;
  role: 'recruiter' | 'candidate';
}

/**
 * Sign a JWT token with user data
 */
export async function signToken(payload: UserPayload): Promise<string> {
  return await sign(payload as unknown as Record<string, unknown>, JWT_SECRET);
}

/**
 * Verify and decode a JWT token
 */
export async function verifyToken(token: string): Promise<UserPayload | null> {
  try {
    const payload = await verify(token, JWT_SECRET);

    // Validate payload structure
    if (
      typeof payload.userId === 'number' &&
      typeof payload.email === 'string' &&
      typeof payload.role === 'string' &&
      ['recruiter', 'candidate'].includes(payload.role)
    ) {
      return payload as unknown as UserPayload;
    }

    return null;
  } catch {
    return null;
  }
}
