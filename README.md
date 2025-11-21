# Job Board API

A modern, lightweight REST API for job recruitment platforms built with Bun, Hono, and Drizzle ORM.

## Features

- 🔐 **JWT Authentication** - Secure user authentication with role-based access control
- 👥 **User Roles** - Separate flows for recruiters and candidates
- 💼 **Job Management** - Create, read, update, and delete job postings
- 📝 **Submission Workflow** - Candidates can submit applications, recruiters can review
- ✅ **Type-Safe** - Full TypeScript with Zod validation
- 📚 **API Documentation** - Interactive Swagger UI at `/docs`
- ⚡ **Fast** - Built on Bun runtime for maximum performance

## Tech Stack

- **Runtime**: [Bun](https://bun.sh)
- **Framework**: [Hono](https://hono.dev) v4
- **Database**: [Turso](https://turso.tech) (LibSQL)
- **ORM**: [Drizzle ORM](https://orm.drizzle.team)
- **Validation**: Zod v4
- **Authentication**: JWT with bcrypt password hashing
- **Deployment**: [Vercel](https://vercel.com) (Bun support)

## Prerequisites

- [Bun](https://bun.sh) v1.3.2 or higher

## Quick Start

### 1. Install Dependencies

```bash
bun install
```

### 2. Set Up Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Update the values:

```env
TURSO_DATABASE_URL=your-turso-database-url
TURSO_AUTH_TOKEN=your-turso-auth-token
JWT_SECRET=your-super-secret-jwt-key
PORT=3000
```

### 3. Run Database Migrations

```bash
bun run db:generate
bun run db:migrate
```

### 4. Start Development Server

```bash
bun run dev
```

The API will be running at `http://localhost:3000` with hot-reload enabled.

**Note**: If you get a "port already in use" error, run:

```bash
bun run dev:clean
```

### 5. Access API Documentation

Once the server is running, visit:

- **Swagger UI**: http://localhost:3000/docs
- **OpenAPI Spec**: http://localhost:3000/openapi.json
- **Health Check**: http://localhost:3000/

## API Features

### Authentication & Authorization

- **JWT-based authentication** with secure token handling
- **Role-based access control** (recruiter vs candidate permissions)
- **Password hashing** with bcrypt for security
- **Protected routes** with automatic token verification

### Data Validation

- **Zod schemas** for request/response validation
- **Type-safe API** with TypeScript integration
- **Automatic error responses** for invalid data
- **OpenAPI documentation** synchronized with validators

### Error Handling

- **Consistent error format** across all endpoints
- **HTTP status codes** following REST conventions
- **Detailed error messages** for debugging
- **Global error handler** for uncaught exceptions

## API Endpoints

### Authentication

- `POST /auth/register` - Register new user (recruiter or candidate)
- `POST /auth/login` - Login and receive JWT token

### Jobs

- `GET /jobs` - List all jobs (public)
- `GET /jobs/:id` - Get single job (public)
- `POST /jobs` - Create job (recruiters only)
- `PATCH /jobs/:id` - Update job (owner only)
- `DELETE /jobs/:id` - Delete job (owner only)

### Submissions

- `POST /submissions` - Submit application (candidates only)
- `GET /submissions` - List submissions (role-based access)
- `GET /submissions/:id` - Get single submission
- `PATCH /submissions/:id` - Update submission status (recruiters only)

## Project Structure

```
src/
├── db/              # Database schema and connection
├── routes/          # API route handlers
├── services/        # Business logic layer
├── middleware/      # Auth and error handling
├── utils/           # JWT utilities
└── index.ts         # Application entry point
```

## Available Scripts

```bash
bun run dev          # Start development server with hot reload
bun run dev:clean    # Clean port 3000 and start dev server
bun run start        # Start production server
bun run db:generate  # Generate database migrations
bun run db:migrate   # Apply database migrations
bun run db:studio    # Open Drizzle Studio
bun run lint         # Run ESLint
bun run format       # Format code with Prettier
```

## Deployment to Vercel

This API is optimized for Vercel which supports Bun runtime.

### Quick Deploy (CLI):

```bash
vercel login
vercel
vercel env add TURSO_DATABASE_URL
vercel env add TURSO_AUTH_TOKEN
vercel env add JWT_SECRET
vercel --prod
```

See [DEPLOY.md](DEPLOY.md) for detailed step-by-step instructions.

## Documentation

- **[README.md](README.md)** - Project overview and quick start (this file)
- **[DEPLOY.md](DEPLOY.md)** - Vercel deployment guide (CLI)
- **[HOWTO.md](HOWTO.md)** - Step-by-step tutorial on how this API was built

## License

MIT
