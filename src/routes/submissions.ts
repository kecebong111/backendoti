import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { HTTPException } from 'hono/http-exception';
import { jwtMiddleware, authMiddleware, requireRole } from '../middleware/auth.js';
import { validationHook } from '../middleware/error.js';
import type { UserPayload } from '../utils/jwt.js';
import {
  createSubmission,
  getAllSubmissions,
  getSubmissionsByUser,
  getSubmissionById,
  updateSubmissionStatus,
} from '../services/submission.service.js';
import type { AppEnv } from '../types.js';

const submissionsRouter = new Hono<AppEnv>();

// Validators
const createSubmissionSchema = z.object({
  jobId: z.number().int().positive('Invalid job ID'),
  githubLink: z.url(),
});

const updateStatusSchema = z.object({
  status: z.enum(['pending', 'reviewed', 'accepted', 'rejected']),
});

/**
 * POST /submissions - Create a new submission (candidates only)
 */
submissionsRouter.post(
  '/',
  jwtMiddleware,
  authMiddleware,
  requireRole(['candidate']),
  zValidator('json', createSubmissionSchema, validationHook),
  async (c) => {
    const user = c.get('user') as UserPayload;
    const { jobId, githubLink } = c.req.valid('json');
    const submission = await createSubmission(user.userId, jobId, githubLink);
    return c.json(submission, 201);
  }
);

/**
 * GET /submissions - Get submissions
 * - Candidates: Get their own submissions
 * - Recruiters: Get all submissions (optionally filtered by jobId)
 */
submissionsRouter.get('/', jwtMiddleware, authMiddleware, async (c) => {
  const user = c.get('user') as UserPayload;

  if (user.role === 'candidate') {
    const submissions = await getSubmissionsByUser(user.userId);
    return c.json(submissions, 200);
  }

  if (user.role === 'recruiter') {
    const jobId = c.req.query('jobId');
    const submissions = await getAllSubmissions(jobId ? parseInt(jobId) : undefined);
    return c.json(submissions, 200);
  }

  throw new HTTPException(400, { message: 'Invalid role' });
});

/**
 * GET /submissions/:id - Get a single submission by ID
 */
submissionsRouter.get('/:id', jwtMiddleware, authMiddleware, async (c) => {
  const user = c.get('user') as UserPayload;
  const id = parseInt(c.req.param('id'));
  const submission = await getSubmissionById(id);

  // Candidates can only view their own submissions
  if (user.role === 'candidate' && submission.userId !== user.userId) {
    throw new HTTPException(403, { message: 'Forbidden - You can only view your own submissions' });
  }

  return c.json(submission, 200);
});

/**
 * PATCH /submissions/:id - Update submission status (recruiters only)
 */
submissionsRouter.patch(
  '/:id',
  jwtMiddleware,
  authMiddleware,
  requireRole(['recruiter']),
  zValidator('json', updateStatusSchema, validationHook),
  async (c) => {
    const id = parseInt(c.req.param('id'));
    const { status } = c.req.valid('json');
    const submission = await updateSubmissionStatus(id, status);
    return c.json(submission, 200);
  }
);

export default submissionsRouter;
