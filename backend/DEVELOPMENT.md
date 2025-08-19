# Development Workflow Guide

This guide outlines the recommended development workflow for implementing the Rituals backend MVP.

## 🎯 Next Steps (Implementation Order)

### 1. Set up Development Environment

```bash
# Navigate to backend directory
cd backend

# Install dependencies
bun install

# Create environment file
cp env.example .env

# Update .env with your database credentials
# DATABASE_URL=postgresql://username:password@localhost:5432/rituals_db
# JWT_SECRET=your-super-secret-jwt-key
```

### 2. Database Setup

```bash
# Create PostgreSQL database
createdb rituals_db

# Run the schema
psql rituals_db < database/schema.sql

# Verify tables were created
psql rituals_db -c "\dt"
```

### 3. Start with Authentication System (Priority 1)

**Files to create:**

- `src/database/connection.ts` - Database connection setup
- `src/middleware/auth.ts` - JWT authentication middleware
- `src/services/auth.service.ts` - Authentication business logic
- `src/controllers/auth.ts` - Auth route handlers
- `src/routes/auth.ts` - Auth routes
- `src/utils/crypto.ts` - Password hashing utilities

**Implementation order:**

1. Database connection with KyselyDB
2. Password hashing utilities
3. JWT token generation/validation
4. User registration endpoint
5. User login endpoint
6. Auth middleware for protected routes

### 4. Ritual Management (Priority 2)

**Files to create:**

- `src/services/ritual.service.ts` - Ritual business logic
- `src/controllers/rituals.ts` - Ritual route handlers
- `src/routes/rituals.ts` - Ritual routes
- `src/utils/validation.ts` - Request validation schemas

**Implementation order:**

1. Create ritual endpoint
2. Get user's rituals endpoint
3. Get public rituals library endpoint
4. Update/delete ritual endpoints
5. Fork ritual functionality
6. Publish/unpublish rituals

### 5. Daily Scheduling System (Priority 3)

**Files to create:**

- `src/services/scheduling.service.ts` - Scheduling business logic
- `src/controllers/daily-rituals.ts` - Daily ritual handlers
- `src/routes/daily-rituals.ts` - Daily ritual routes
- `src/utils/date.ts` - Date utility functions

**Implementation order:**

1. Schedule ritual for specific dates
2. Get daily rituals for a date
3. Frequency template creation
4. Recurring schedule generation
5. Update/remove scheduled rituals

### 6. Progress Tracking (Priority 4)

**Implementation order:**

1. Step completion endpoints
2. Answer storage for different step types
3. Daily ritual completion tracking
4. Modification tracking during execution

### 7. Metrics & Analytics (Priority 5)

**Files to create:**

- `src/services/metrics.service.ts` - Metrics calculation
- `src/controllers/metrics.ts` - Metrics route handlers
- `src/routes/metrics.ts` - Metrics routes

**Implementation order:**

1. Basic completion metrics calculation
2. Streak calculations
3. Fitness data aggregation
4. User statistics endpoints

## 🛠️ Development Tips

### Database Operations with KyselyDB

```typescript
// Example connection setup
import { Kysely, PostgresDialect } from "kysely";
import { Pool } from "pg";

const db = new Kysely<Database>({
  dialect: new PostgresDialect({
    pool: new Pool({
      connectionString: process.env.DATABASE_URL,
    }),
  }),
});

// Example query
const users = await db
  .selectFrom("users")
  .select(["id", "email", "current_streak"])
  .where("email", "=", email)
  .executeTakeFirst();
```

### Error Handling Pattern

```typescript
// Standard error response format
export interface ApiError {
  error: string;
  message: string;
  details?: Record<string, any>;
}

// Error handling middleware
export const errorHandler = (error: Error, c: Context) => {
  if (error instanceof ValidationError) {
    return c.json(
      {
        error: "VALIDATION_ERROR",
        message: error.message,
        details: error.details,
      },
      400
    );
  }

  return c.json(
    {
      error: "INTERNAL_ERROR",
      message: "An unexpected error occurred",
    },
    500
  );
};
```

### Authentication Middleware

```typescript
// JWT middleware example
export const requireAuth = async (c: Context, next: Next) => {
  const authorization = c.req.header("Authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return c.json({ error: "UNAUTHORIZED", message: "Missing token" }, 401);
  }

  const token = authorization.slice(7);

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!);
    c.set("userId", payload.sub);
    await next();
  } catch (error) {
    return c.json({ error: "UNAUTHORIZED", message: "Invalid token" }, 401);
  }
};
```

## 🧪 Testing Strategy

### Unit Tests

- Test individual services and utilities
- Mock database operations
- Test business logic in isolation

### Integration Tests

- Test API endpoints end-to-end
- Use test database
- Test authentication flows

### Example Test Structure

```typescript
// auth.service.test.ts
describe("AuthService", () => {
  describe("register", () => {
    it("should create new user with hashed password", async () => {
      // Test implementation
    });

    it("should reject duplicate email", async () => {
      // Test implementation
    });
  });
});
```

## 🔄 Workflow Commands

```bash
# Development workflow
bun run dev                 # Start development server
bun run type-check         # Check TypeScript types
bun run lint               # Check code style
bun run test               # Run tests

# Database workflow
bun run db:migrate         # Run migrations
bun run db:seed            # Add test data
bun run db:reset           # Reset database

# Before committing
bun run type-check && bun run lint && bun run test
```

## 📁 File Creation Order

1. **Core Infrastructure**

   - `src/database/connection.ts`
   - `src/middleware/error-handler.ts`
   - `src/utils/validation.ts`

2. **Authentication**

   - `src/utils/crypto.ts`
   - `src/services/auth.service.ts`
   - `src/middleware/auth.ts`
   - `src/controllers/auth.ts`
   - `src/routes/auth.ts`

3. **Rituals**

   - `src/services/ritual.service.ts`
   - `src/controllers/rituals.ts`
   - `src/routes/rituals.ts`

4. **Scheduling**

   - `src/utils/date.ts`
   - `src/services/scheduling.service.ts`
   - `src/controllers/daily-rituals.ts`
   - `src/routes/daily-rituals.ts`

5. **Metrics**

   - `src/services/metrics.service.ts`
   - `src/controllers/metrics.ts`
   - `src/routes/metrics.ts`

6. **Main Application**
   - `src/index.ts` (Hono app setup)

## 🚀 MVP Completion Checklist

### Phase 1: Authentication ✅

- [ ] User registration endpoint
- [ ] User login endpoint
- [ ] JWT token validation
- [ ] Auth middleware
- [ ] Password hashing

### Phase 2: Ritual Management

- [ ] Create ritual endpoint
- [ ] Get user rituals endpoint
- [ ] Get public rituals endpoint
- [ ] Update ritual endpoint
- [ ] Delete ritual endpoint
- [ ] Fork ritual endpoint
- [ ] Publish ritual endpoint

### Phase 3: Scheduling

- [ ] Schedule ritual endpoint
- [ ] Get daily rituals endpoint
- [ ] Update scheduled ritual endpoint
- [ ] Remove scheduled ritual endpoint
- [ ] Frequency template creation

### Phase 4: Progress Tracking

- [ ] Update step progress endpoint
- [ ] Complete ritual endpoint
- [ ] Track modifications
- [ ] Store step answers

### Phase 5: Metrics

- [ ] Ritual metrics endpoint
- [ ] Step metrics endpoint
- [ ] User statistics endpoint
- [ ] Real-time calculations

### Phase 6: Frontend Integration

- [ ] Replace mock data with API calls
- [ ] Error handling
- [ ] Loading states
- [ ] Authentication flow

This roadmap provides a clear path from the current state to a fully functional MVP backend!
