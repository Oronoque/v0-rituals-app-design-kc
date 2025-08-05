# Rituals Backend API

Backend service for the Rituals app - a habit tracking and accountability platform.

## Tech Stack

- **Runtime**: Bun + Node.js
- **Framework**: Hono (lightweight web framework)
- **Database**: PostgreSQL with KyselyDB (type-safe SQL builder)
- **Authentication**: JWT with bcrypt password hashing
- **Validation**: Zod for request/response validation
- **Language**: TypeScript

## 🚀 Quick Start

### Prerequisites

- [Bun](https://bun.sh/) (latest version)
- [PostgreSQL](https://www.postgresql.org/) (v13 or higher)
- [Git](https://git-scm.com/)

### 1. Clone and Setup

```bash
git clone <repository-url>
cd backend
bun install
```

### 2. Database Setup

1. Create a PostgreSQL database:

```bash
createdb rituals_db
```

2. Copy environment variables:

```bash
cp env.example .env
```

3. Update `.env` with your database credentials:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/rituals_db
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

4. Run database migrations:

```bash
bun run db:migrate
```

5. (Optional) Seed with test data:

```bash
bun run db:seed
```

### 3. Start Development Server

```bash
bun run dev
```

The API will be available at `http://localhost:3001`

## 📚 API Documentation

See [API.md](./API.md) for complete endpoint documentation.

### Base URL

```
http://localhost:3001/api
```

### Authentication

Include JWT token in Authorization header:

```
Authorization: Bearer <token>
```

## 🗂️ Project Structure

```
backend/
├── src/
│   ├── controllers/         # Route handlers
│   │   ├── auth.ts
│   │   ├── rituals.ts
│   │   ├── daily-rituals.ts
│   │   └── metrics.ts
│   ├── middleware/          # Custom middleware
│   │   ├── auth.ts
│   │   ├── validation.ts
│   │   └── error-handler.ts
│   ├── database/           # Database configuration
│   │   ├── connection.ts
│   │   ├── migrate.ts
│   │   ├── seed.ts
│   │   └── reset.ts
│   ├── services/           # Business logic
│   │   ├── auth.service.ts
│   │   ├── ritual.service.ts
│   │   ├── scheduling.service.ts
│   │   └── metrics.service.ts
│   ├── types/              # TypeScript definitions
│   │   ├── database.ts
│   │   └── api.ts
│   ├── utils/              # Utility functions
│   │   ├── validation.ts
│   │   ├── crypto.ts
│   │   └── date.ts
│   ├── routes/             # Route definitions
│   │   ├── auth.ts
│   │   ├── rituals.ts
│   │   ├── daily-rituals.ts
│   │   └── metrics.ts
│   └── index.ts            # Application entry point
├── database/
│   └── schema.sql          # Database schema
├── package.json
├── tsconfig.json
├── API.md                  # API documentation
└── README.md
```

## 🛠️ Development Commands

```bash
# Development
bun run dev              # Start dev server with hot reload
bun run build            # Build for production
bun run start            # Start production server

# Database
bun run db:migrate       # Run database migrations
bun run db:seed          # Seed test data
bun run db:reset         # Reset database (drop + recreate)

# Code Quality
bun run lint             # Run ESLint
bun run type-check       # Run TypeScript compiler check
bun run test             # Run tests
bun run test:watch       # Run tests in watch mode
```

## 🏗️ Implementation Roadmap

### Phase 1: Core Backend Setup ✅

- [x] Project structure and configuration
- [x] Database schema design
- [x] TypeScript types matching frontend
- [x] API specification

### Phase 2: Authentication System 🚧

- [ ] User registration and login endpoints
- [ ] JWT token generation and validation
- [ ] Password hashing with bcrypt
- [ ] Auth middleware for protected routes
- [ ] User profile management

### Phase 3: Ritual Management 🚧

- [ ] Create/Read/Update/Delete rituals
- [ ] Public library for ritual sharing
- [ ] Ritual forking functionality
- [ ] Publish/unpublish private rituals
- [ ] Search and filtering

### Phase 4: Scheduling System 🚧

- [ ] Ritual templates with frequency patterns
- [ ] Daily ritual instance creation
- [ ] Schedule management (add/remove/edit)
- [ ] Recurring pattern logic (daily, weekly, custom)

### Phase 5: Progress Tracking 🚧

- [ ] Step completion tracking
- [ ] Answer storage for different step types
- [ ] Progress persistence
- [ ] Modification tracking during execution

### Phase 6: Metrics & Analytics 🚧

- [ ] Real-time metrics calculation
- [ ] Completion streaks and rates
- [ ] Personal bests and records
- [ ] User statistics dashboard
- [ ] Historical data aggregation

### Phase 7: Review & Updates 🚧

- [ ] Review flow for completed rituals
- [ ] Template updates affecting future instances
- [ ] Change propagation logic
- [ ] History tracking

### Phase 8: Testing & Optimization 🚧

- [ ] Unit tests for core services
- [ ] Integration tests for API endpoints
- [ ] Performance optimization
- [ ] Error handling improvements
- [ ] API documentation updates

## 🔍 Key Features

### Ritual System

- **Creation**: Build custom rituals with multiple step types
- **Forking**: Copy public rituals to private library
- **Publishing**: Share rituals with the community
- **Step Types**: Yes/No, Q&A, Weightlifting, Cardio, Custom metrics

### Scheduling

- **Frequency Patterns**: One-time, daily, weekly, custom schedules
- **Templates**: Reusable scheduling configurations
- **Instance Management**: Individual daily ritual instances
- **Time Management**: Scheduled times with conflict detection

### Progress Tracking

- **Step Completion**: Track individual step progress
- **Answer Storage**: Persist responses for all step types
- **Modification Tracking**: Flag changes during execution
- **Completion States**: Full ritual completion tracking

### Metrics & Analytics

- **Streaks**: Current and longest completion streaks
- **Rates**: Completion percentages over time
- **Personal Records**: Track fitness improvements
- **Proof Score**: Gamification scoring system

## 🚀 Deployment

### Environment Variables

Ensure these are set in production:

```env
NODE_ENV=production
DATABASE_URL=your-production-database-url
JWT_SECRET=your-production-jwt-secret
FRONTEND_URL=your-frontend-domain
```

### Build and Deploy

```bash
bun run build
bun run start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
