import { HTTPException } from 'hono/http-exception';
import { db } from '../db/index.js';
import { jobs } from '../db/schema.js';
import { eq } from 'drizzle-orm';

/**
 * Create a new job posting
 */
export async function createJob(
  title: string,
  description: string,
  requirements: string,
  createdBy: number
) {
  const result = await db
    .insert(jobs)
    .values({
      title,
      description,
      requirements,
      createdBy,
    })
    .returning();
  const job = result[0];

  if (!job) {
    throw new HTTPException(500, { message: 'Failed to create job' });
  }

  return job;
}

/**
 * Get all jobs with creator information
 */
export async function getAllJobs() {
  return await db.query.jobs.findMany({
    with: {
      creator: {
        columns: {
          id: true,
          email: true,
          role: true,
        },
      },
    },
    orderBy: (jobs, { desc }) => [desc(jobs.createdAt)],
  });
}

/**
 * Get a single job by ID
 */
export async function getJobById(id: number) {
  const result = await db.query.jobs.findFirst({
    where: eq(jobs.id, id),
    with: {
      creator: {
        columns: {
          id: true,
          email: true,
          role: true,
        },
      },
    },
  });

  if (!result) {
    throw new HTTPException(404, { message: 'Job not found' });
  }

  return result;
}

/**
 * Update a job posting
 */
export async function updateJob(
  id: number,
  title?: string,
  description?: string,
  requirements?: string,
  userId?: number
) {
  // First check if job exists and user owns it
  const existingJob = await db.select().from(jobs).where(eq(jobs.id, id)).limit(1);
  const job = existingJob[0];

  if (!job) {
    throw new HTTPException(404, { message: 'Job not found' });
  }

  if (userId && job.createdBy !== userId) {
    throw new HTTPException(403, { message: 'Forbidden - You can only update your own jobs' });
  }

  const updateData = {
    ...(title && { title }),
    ...(description && { description }),
    ...(requirements && { requirements }),
  };

  const result = await db.update(jobs).set(updateData).where(eq(jobs.id, id)).returning();
  return result[0]!;
}

/**
 * Delete a job posting
 */
export async function deleteJob(id: number, userId?: number) {
  // First check if job exists and user owns it
  const existingJob = await db.select().from(jobs).where(eq(jobs.id, id)).limit(1);
  const job = existingJob[0];

  if (!job) {
    throw new HTTPException(404, { message: 'Job not found' });
  }

  if (userId && job.createdBy !== userId) {
    throw new HTTPException(403, { message: 'Forbidden - You can only delete your own jobs' });
  }

  await db.delete(jobs).where(eq(jobs.id, id));

  return { message: 'Job deleted successfully' };
}
