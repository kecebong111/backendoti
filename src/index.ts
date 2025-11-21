import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { serve } from '@hono/node-server';
import { swaggerUI } from '@hono/swagger-ui';
import authRoutes from './routes/auth.js';
import jobsRoutes from './routes/jobs.js';
import submissionsRoutes from './routes/submissions.js';
import { errorHandler, notFoundHandler } from './middleware/error.js';
import { openAPISpec } from './openapi.js';
import type { AppEnv } from './types.js';

const app = new Hono<AppEnv>();

// Middleware
app.use('*', logger());
app.use(
  '*',
  cors({
    origin: '*',
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    credentials: false,
  })
);

// Routes
app.get('/', (c) => {
  return c.json({
    message: 'Job Board API',
    version: '1.0.0',
    endpoints: {
      auth: '/auth',
      jobs: '/jobs',
      submissions: '/submissions',
      docs: '/docs',
      openapi: '/openapi.json',
    },
  });
});

// OpenAPI documentation
// Create OpenAPI spec with dynamic servers
const createOpenAPISpec = (c?: {
  req: { url: string; header: (_name: string) => string | undefined };
}) => {
  const servers = [];

  // If we have a request context, detect the current URL
  let currentOrigin = '';
  if (c) {
    const url = new globalThis.URL(c.req.url);
    // Check for proxy headers (Vercel uses these)
    const proto = c.req.header('x-forwarded-proto') || url.protocol.replace(':', '');
    const host = c.req.header('x-forwarded-host') || c.req.header('host') || url.host;
    currentOrigin = `${proto}://${host}`;
  }

  // Add current origin (for development or when accessing directly)
  if (currentOrigin && !currentOrigin.includes('localhost')) {
    servers.push({
      url: currentOrigin,
      description: 'Current server',
    });
  }

  // Add localhost last (only as fallback)
  if (servers.length === 0 || currentOrigin.includes('localhost')) {
    servers.push({
      url: 'http://localhost:3000',
      description: 'Development server',
    });
  }

  return {
    openapi: '3.0.0',
    info: {
      title: 'Job Board API',
      version: '1.0.0',
      description: 'A recruitment platform API built with Node.js, Hono, and Drizzle ORM',
    },
    servers,
    components: openAPISpec.components,
    paths: openAPISpec.paths,
  };
};

app.get('/openapi.json', (c) => {
  return c.json(createOpenAPISpec(c));
});

app.get(
  '/docs',
  swaggerUI({
    url: '/openapi.json',
  })
);

app.route('/auth', authRoutes);
app.route('/jobs', jobsRoutes);
app.route('/submissions', submissionsRoutes);

// Error handling
app.onError(errorHandler);
app.notFound(notFoundHandler);

// Start server for local development only
if (!process.env.VERCEL) {
  const port = parseInt(process.env.PORT || '3000');
  serve({
    fetch: app.fetch,
    port,
  });
  console.log(`Server running on http://localhost:${port}`);
}

// Export for deployment platforms
export default app;
