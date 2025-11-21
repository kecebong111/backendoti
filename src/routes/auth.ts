import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { registerUser, loginUser } from '../services/auth.service.js';
import { validationHook } from '../middleware/error.js';

const auth = new Hono();

// Validators
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['recruiter', 'candidate']).default('candidate'),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Password is required'),
});

/**
 * POST /auth/register - Register a new user
 */
auth.post('/register', zValidator('json', registerSchema, validationHook), async (c) => {
  const { email, password, role } = c.req.valid('json');
  const result = await registerUser(email, password, role);
  return c.json(result, 201);
});

/**
 * POST /auth/login - Login a user
 */
auth.post('/login', zValidator('json', loginSchema, validationHook), async (c) => {
  const { email, password } = c.req.valid('json');
  const result = await loginUser(email, password);
  return c.json(result, 200);
});

export default auth;
