import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { jwtMiddleware, authMiddleware, requireRole } from '../middleware/auth.js';
import { validationHook } from '../middleware/error.js';
import type { UserPayload } from '../utils/jwt.js';
import {
  createJob,
  getAllJobs,
  getJobById,
  updateJob,
  deleteJob,
} from '../services/job.service.js';
import type { AppEnv } from '../types.js';

const jobsRouter = new Hono<AppEnv>();

// Validators
const createJobSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  requirements: z.string().min(1, 'Requirements are required'),
});

const updateJobSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  requirements: z.string().min(1).optional(),
});

/**
 * GET /jobs - Get all jobs (public)
 */
jobsRouter.get('/', async (c) => {
  const jobs = await getAllJobs();
  return c.json(jobs, 200);
});

/**
 * GET /jobs/:id - Get a single job by ID (public)
 */
jobsRouter.get('/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  const job = await getJobById(id);
  return c.json(job, 200);
});

/**
 * POST /jobs - Create a new job (recruiter only)
 */
jobsRouter.post(
  '/',
  jwtMiddleware,
  authMiddleware,
  requireRole(['recruiter']),
  zValidator('json', createJobSchema, validationHook),
  async (c) => {
    const user = c.get('user') as UserPayload;
    const { title, description, requirements } = c.req.valid('json');
    const job = await createJob(title, description, requirements, user.userId);
    return c.json(job, 201);
  }
);

/**
 * PATCH /jobs/:id - Update a job (recruiter only, own jobs)
 */
jobsRouter.patch(
  '/:id',
  jwtMiddleware,
  authMiddleware,
  requireRole(['recruiter']),
  zValidator('json', updateJobSchema, validationHook),
  async (c) => {
    const user = c.get('user') as UserPayload;
    const id = parseInt(c.req.param('id'));
    const { title, description, requirements } = c.req.valid('json');
    const job = await updateJob(id, title, description, requirements, user.userId);
    return c.json(job, 200);
  }
);

/**
 * DELETE /jobs/:id - Delete a job (recruiter only, own jobs)
 */
jobsRouter.delete('/:id', jwtMiddleware, authMiddleware, requireRole(['recruiter']), async (c) => {
  const user = c.get('user') as UserPayload;
  const id = parseInt(c.req.param('id'));
  const result = await deleteJob(id, user.userId);
  return c.json(result, 200);
});

export default jobsRouter;
