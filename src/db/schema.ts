/**
 * Database Schema
 * All tables and relations defined in one place to avoid circular imports
 */

import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

// ============================================================================
// TABLES
// ============================================================================

/**
 * Users Table
 * Stores user accounts (recruiters and candidates)
 */
export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  role: text('role', { enum: ['recruiter', 'candidate'] })
    .notNull()
    .default('candidate'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdateFn(() => new Date()),
});

/**
 * Jobs Table
 * Stores job postings created by recruiters
 */
export const jobs = sqliteTable('jobs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  description: text('description').notNull(),
  requirements: text('requirements').notNull(), // Stored as JSON string
  createdBy: integer('created_by')
    .notNull()
    .references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdateFn(() => new Date()),
});

/**
 * Submissions Table
 * Stores candidate submissions to job postings
 */
export const submissions = sqliteTable('submissions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  jobId: integer('job_id')
    .notNull()
    .references(() => jobs.id),
  githubLink: text('github_link').notNull(),
  status: text('status', {
    enum: ['pending', 'reviewed', 'accepted', 'rejected'],
  })
    .notNull()
    .default('pending'),
  submittedAt: integer('submitted_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdateFn(() => new Date()),
});

// ============================================================================
// RELATIONS
// ============================================================================

export const usersRelations = relations(users, ({ many }) => ({
  jobs: many(jobs),
  submissions: many(submissions),
}));

export const jobsRelations = relations(jobs, ({ one, many }) => ({
  creator: one(users, {
    fields: [jobs.createdBy],
    references: [users.id],
  }),
  submissions: many(submissions),
}));

export const submissionsRelations = relations(submissions, ({ one }) => ({
  user: one(users, {
    fields: [submissions.userId],
    references: [users.id],
  }),
  job: one(jobs, {
    fields: [submissions.jobId],
    references: [jobs.id],
  }),
}));

// ============================================================================
// TYPES
// ============================================================================

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Job = typeof jobs.$inferSelect;
export type NewJob = typeof jobs.$inferInsert;

export type Submission = typeof submissions.$inferSelect;
export type NewSubmission = typeof submissions.$inferInsert;
