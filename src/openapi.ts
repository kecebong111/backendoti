// Dynamic server configuration
const getServers = () => {
  const servers = [
    {
      url: 'http://localhost:3000',
      description: 'Development server',
    },
  ];

  // Add production server if running on Vercel
  if (process.env.VERCEL_URL) {
    servers.push({
      url: `https://${process.env.VERCEL_URL}`,
      description: 'Production server (Vercel)',
    });
  }

  // Add custom domain if set
  if (process.env.CUSTOM_DOMAIN) {
    servers.push({
      url: `https://${process.env.CUSTOM_DOMAIN}`,
      description: 'Production server (Custom Domain)',
    });
  }

  return servers;
};

export const openAPISpec = {
  openapi: '3.0.0',
  info: {
    title: 'Job Board API',
    version: '1.0.0',
    description: 'A recruitment platform API built with Node.js, Hono, and Drizzle ORM',
  },
  servers: getServers(),
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          email: { type: 'string', format: 'email' },
          role: { type: 'string', enum: ['recruiter', 'candidate'] },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      Job: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          title: { type: 'string' },
          description: { type: 'string' },
          requirements: { type: 'string' },
          createdBy: { type: 'integer' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      Submission: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          userId: { type: 'integer' },
          jobId: { type: 'integer' },
          githubLink: { type: 'string', format: 'uri' },
          status: {
            type: 'string',
            enum: ['pending', 'reviewed', 'accepted', 'rejected'],
          },
          submittedAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      Error: {
        type: 'object',
        properties: {
          error: { type: 'string' },
        },
      },
    },
  },
  paths: {
    '/auth/register': {
      post: {
        tags: ['Authentication'],
        summary: 'Register a new user',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', minLength: 6 },
                  role: {
                    type: 'string',
                    enum: ['recruiter', 'candidate'],
                    default: 'candidate',
                  },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'User registered successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    user: { $ref: '#/components/schemas/User' },
                    token: { type: 'string' },
                  },
                },
              },
            },
          },
          '400': {
            description: 'Bad request',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Authentication'],
        summary: 'Login a user',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Login successful',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    user: { $ref: '#/components/schemas/User' },
                    token: { type: 'string' },
                  },
                },
              },
            },
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/jobs': {
      get: {
        tags: ['Jobs'],
        summary: 'Get all jobs',
        responses: {
          '200': {
            description: 'List of jobs',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Job' },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Jobs'],
        summary: 'Create a new job (Recruiter only)',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['title', 'description', 'requirements'],
                properties: {
                  title: { type: 'string' },
                  description: { type: 'string' },
                  requirements: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Job created successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Job' },
              },
            },
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '403': {
            description: 'Forbidden - Recruiters only',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/jobs/{id}': {
      get: {
        tags: ['Jobs'],
        summary: 'Get a single job by ID',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer' },
          },
        ],
        responses: {
          '200': {
            description: 'Job details',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Job' },
              },
            },
          },
          '404': {
            description: 'Job not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
      patch: {
        tags: ['Jobs'],
        summary: 'Update a job (Owner only)',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  description: { type: 'string' },
                  requirements: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Job updated successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Job' },
              },
            },
          },
          '400': {
            description: 'Bad request',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
      delete: {
        tags: ['Jobs'],
        summary: 'Delete a job (Owner only)',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer' },
          },
        ],
        responses: {
          '200': {
            description: 'Job deleted successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/submissions': {
      get: {
        tags: ['Submissions'],
        summary: 'Get submissions (role-based)',
        description: 'Candidates see their own submissions. Recruiters see all submissions.',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'jobId',
            in: 'query',
            schema: { type: 'integer' },
            description: 'Filter by job ID (recruiters only)',
          },
        ],
        responses: {
          '200': {
            description: 'List of submissions',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Submission' },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Submissions'],
        summary: 'Create a new submission (Candidate only)',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['jobId', 'githubLink'],
                properties: {
                  jobId: { type: 'integer' },
                  githubLink: { type: 'string', format: 'uri' },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Submission created successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Submission' },
              },
            },
          },
        },
      },
    },
    '/submissions/{id}': {
      get: {
        tags: ['Submissions'],
        summary: 'Get a single submission by ID',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer' },
          },
        ],
        responses: {
          '200': {
            description: 'Submission details',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Submission' },
              },
            },
          },
          '404': {
            description: 'Submission not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
      patch: {
        tags: ['Submissions'],
        summary: 'Update submission status (Recruiter only)',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['status'],
                properties: {
                  status: {
                    type: 'string',
                    enum: ['pending', 'reviewed', 'accepted', 'rejected'],
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Status updated successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Submission' },
              },
            },
          },
        },
      },
    },
  },
};
