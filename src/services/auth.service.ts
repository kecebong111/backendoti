import { HTTPException } from 'hono/http-exception';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { signToken } from '../utils/jwt.js';
import bcrypt from 'bcryptjs';

/**
 * Register a new user
 */
export async function registerUser(
  email: string,
  password: string,
  role: 'recruiter' | 'candidate'
) {
  try {
    // Check if user already exists
    const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);

    if (existingUser.length > 0) {
      throw new HTTPException(400, { message: 'User already exists' });
    }

    // Hash password using bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const result = await db
      .insert(users)
      .values({
        email,
        password: hashedPassword,
        role,
      })
      .returning();
    const user = result[0];

    if (!user) {
      throw new HTTPException(500, { message: 'Failed to create user' });
    }

    // Generate JWT token
    const token = await signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
      token,
    };
  } catch (error) {
    // Re-throw HTTP exceptions as-is
    if (error instanceof HTTPException) {
      throw error;
    }
    // Log and wrap database errors
    console.error('Database error in registerUser:', error);
    throw new HTTPException(500, { message: 'Database error occurred' });
  }
}

/**
 * Login a user
 */
export async function loginUser(email: string, password: string) {
  try {
    // Find user by email
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    const user = result[0];

    if (!user) {
      throw new HTTPException(401, { message: 'Invalid email or password' });
    }

    // Verify password using bcrypt
    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      throw new HTTPException(401, { message: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = await signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
      token,
    };
  } catch (error) {
    // Re-throw HTTP exceptions as-is
    if (error instanceof HTTPException) {
      throw error;
    }
    // Log and wrap database errors
    console.error('Database error in loginUser:', error);
    throw new HTTPException(500, { message: 'Database error occurred' });
  }
}
