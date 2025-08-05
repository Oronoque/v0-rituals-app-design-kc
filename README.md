# Rituals App - Monorepo

A habit tracking and accountability application built with a modern monorepo structure.

## Architecture

This project is organized as a monorepo with the following packages:

- **`packages/frontend`** - Next.js React application with Tailwind CSS
- **`packages/backend`** - Express.js API server with TypeScript and Bun
- **`packages/shared`** - Shared types, schemas, and utilities used across frontend and backend
- **`packages/database`** - Database schema, migrations, and utilities

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [Bun](https://bun.sh/) (v1.0+)
- [PostgreSQL](https://www.postgresql.org/) (for the database)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd rituals-app-monorepo
```

2. Install dependencies for all packages:
```bash
bun install
```

### Development

#### Start all services:
```bash
bun run dev
```

#### Start individual services:
```bash
# Frontend only
bun run dev:frontend

# Backend only
bun run dev:backend

# Shared package (build in watch mode)
bun run dev:shared
```

### Building

#### Build all packages:
```bash
bun run build
```

#### Build individual packages:
```bash
# Build shared package first (required by others)
cd packages/shared && bun run build

# Build backend
cd packages/backend && bun run build

# Build frontend
cd packages/frontend && bun run build
```

### Package Scripts

#### Root Level Scripts
- `bun run dev` - Start all packages in development mode
- `bun run build` - Build all packages
- `bun run lint` - Run linting on all packages
- `bun run type-check` - Run TypeScript type checking on all packages
- `bun run test` - Run tests on all packages
- `bun run clean` - Clean build artifacts from all packages

## Package Details

### Frontend (`packages/frontend`)
- **Framework**: Next.js 15 with React 19
- **Styling**: Tailwind CSS with Radix UI components
- **State Management**: React Query for server state
- **Forms**: React Hook Form with Zod validation
- **Charts**: Recharts for data visualization

**Available Scripts:**
- `bun run dev` - Start development server
- `bun run build` - Build for production
- `bun run start` - Start production server
- `bun run lint` - Run ESLint
- `bun run type-check` - Run TypeScript type checking

### Backend (`packages/backend`)
- **Runtime**: Bun
- **Framework**: Express.js
- **Database**: PostgreSQL with Kysely query builder
- **Authentication**: JWT tokens with bcrypt hashing
- **Validation**: Zod schemas
- **Error Handling**: Neverthrow for functional error handling

**Available Scripts:**
- `bun run dev` - Start development server with watch mode
- `bun run build` - Build for production
- `bun run start` - Start production server
- `bun run db:migrate` - Run database migrations
- `bun run db:seed` - Seed the database
- `bun run db:reset` - Reset the database
- `bun run lint` - Run ESLint
- `bun run type-check` - Run TypeScript type checking

### Shared (`packages/shared`)
Contains shared TypeScript types, Zod schemas, and utilities used by both frontend and backend:

- **Database Types**: Kysely table interfaces and utility types
- **API Types**: Request/response interfaces and error types
- **Validation Schemas**: Zod schemas for data validation
- **Frontend Types**: Application state and UI-specific types

**Available Scripts:**
- `bun run build` - Compile TypeScript to JavaScript
- `bun run dev` - Build in watch mode
- `bun run type-check` - Run TypeScript type checking

### Database (`packages/database`)
Contains database schema, migrations, and utilities:

- **Schema**: PostgreSQL schema definitions
- **Migrations**: Database migration scripts
- **Seeds**: Test data and initial setup

**Available Scripts:**
- `bun run migrate` - Run migrations
- `bun run seed` - Seed database
- `bun run reset` - Reset database

## Environment Variables

### Backend
Create a `.env` file in `packages/backend/`:
```env
DATABASE_URL=postgresql://username:password@localhost:5432/rituals_db
JWT_SECRET=your-jwt-secret-key
PORT=3001
NODE_ENV=development
```

### Frontend
Create a `.env.local` file in `packages/frontend/`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Database Setup

1. Create a PostgreSQL database:
```sql
CREATE DATABASE rituals_db;
```

2. Run migrations:
```bash
cd packages/backend
bun run db:migrate
```

3. (Optional) Seed with test data:
```bash
bun run db:seed
```

## Project Structure

```
rituals-app-monorepo/
├── packages/
│   ├── frontend/          # Next.js React app
│   │   ├── app/           # Next.js app directory
│   │   ├── components/    # React components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── lib/           # Utility libraries
│   │   └── styles/        # CSS styles
│   ├── backend/           # Express.js API
│   │   ├── src/
│   │   │   ├── controllers/  # Route controllers
│   │   │   ├── middleware/   # Express middleware
│   │   │   ├── routes/       # API routes
│   │   │   ├── services/     # Business logic
│   │   │   ├── database/     # Database connection
│   │   │   └── utils/        # Utility functions
│   ├── shared/            # Shared types and utilities
│   │   ├── src/
│   │   │   ├── schemas.ts       # Zod validation schemas
│   │   │   ├── database-types.ts # Database type definitions
│   │   │   ├── api-types.ts     # API interface definitions
│   │   │   └── frontend-types.ts # Frontend-specific types
│   └── database/          # Database schema and migrations
│       ├── schema.sql     # Database schema
│       └── migrations/    # Migration scripts
├── package.json           # Root package configuration
├── tsconfig.json          # Root TypeScript configuration
└── README.md              # This file
```

## Contributing

1. Install dependencies: `bun install`
2. Make changes in the appropriate package
3. Run type checking: `bun run type-check`
4. Run linting: `bun run lint`
5. Test your changes: `bun run test`
6. Build to ensure everything compiles: `bun run build`

## Technology Stack

- **Languages**: TypeScript, SQL
- **Frontend**: Next.js, React, Tailwind CSS, Radix UI
- **Backend**: Bun, Express.js, Kysely
- **Database**: PostgreSQL
- **Validation**: Zod
- **Error Handling**: Neverthrow
- **Authentication**: JWT
- **Build Tools**: Bun workspaces
- **Development**: TypeScript project references for fast incremental builds

---

*Originally built with [v0.dev](https://v0.dev) and restructured into a modern monorepo*