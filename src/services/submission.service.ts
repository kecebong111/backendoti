import { HTTPException } from 'hono/http-exception';
import { db } from '../db/index.js';
import { submissions } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';

/**
 * Create a new submission
 */
export async function createSubmission(userId: number, jobId: number, githubLink: string) {
  // Check if user already submitted to this job
  const existing = await db
    .select()
    .from(submissions)
    .where(and(eq(submissions.userId, userId), eq(submissions.jobId, jobId)))
    .limit(1);

  if (existing.length > 0) {
    throw new HTTPException(400, { message: 'You have already submitted to this job' });
  }

  const result = await db
    .insert(submissions)
    .values({
      userId,
      jobId,
      githubLink,
      status: 'pending',
    })
    .returning();
  return result[0];
}

/**
 * Get all submissions (for recruiters to review)
 */
export async function getAllSubmissions(jobId?: number) {
  const query = db.query.submissions.findMany({
    where: jobId ? eq(submissions.jobId, jobId) : undefined,
    with: {
      user: {
        columns: {
          id: true,
          email: true,
          role: true,
        },
      },
      job: {
        columns: {
          id: true,
          title: true,
        },
      },
    },
    orderBy: (submissions, { desc }) => [desc(submissions.submittedAt)],
  });

  return await query;
}

/**
 * Get submissions by user (candidates viewing their own submissions)
 */
export async function getSubmissionsByUser(userId: number) {
  const result = await db.query.submissions.findMany({
    where: eq(submissions.userId, userId),
    with: {
      job: {
        columns: {
          id: true,
          title: true,
          description: true,
        },
      },
    },
    orderBy: (submissions, { desc }) => [desc(submissions.submittedAt)],
  });

  return result;
}

/**
 * Get a single submission by ID
 */
export async function getSubmissionById(id: number) {
  const result = await db.query.submissions.findFirst({
    where: eq(submissions.id, id),
    with: {
      user: {
        columns: {
          id: true,
          email: true,
          role: true,
        },
      },
      job: true,
    },
  });

  if (!result) {
    throw new HTTPException(404, { message: 'Submission not found' });
  }

  return result;
}

/**
 * Update submission status (recruiters only)
 */
export async function updateSubmissionStatus(
  id: number,
  status: 'pending' | 'reviewed' | 'accepted' | 'rejected'
) {
  const existing = await db.select().from(submissions).where(eq(submissions.id, id)).limit(1);

  if (existing.length === 0) {
    throw new HTTPException(404, { message: 'Submission not found' });
  }

  const result = await db
    .update(submissions)
    .set({ status })
    .where(eq(submissions.id, id))
    .returning();

  return result[0];
}
