# Base Bun image
FROM oven/bun:1-alpine AS base
WORKDIR /app

RUN apk add --no-cache libc6-compat python3 make g++

# ------------------------------------
# Install dependencies
FROM base AS deps

# Copy root-level and package-level files
COPY package.json bun.lock* ./
COPY tsconfig.json ./
COPY packages/shared/tsconfig.json ./packages/shared/
COPY packages/backend/tsconfig.json ./packages/backend/
COPY packages/frontend/tsconfig.json ./packages/frontend/
COPY packages/shared/package.json ./packages/shared/
COPY packages/frontend/package.json ./packages/frontend/
COPY packages/backend/package.json ./packages/backend/

# Install all deps (for all packages)
RUN bun install --frozen-lockfile

# ------------------------------------
# Build shared package
FROM base AS shared-builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY packages/shared ./packages/shared
COPY package.json ./
RUN bun run build:shared
# remove source code
RUN rm -rf packages/shared/src

# ------------------------------------
# Build backend
FROM base AS backend-builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=shared-builder /app/packages/shared ./packages/shared
COPY packages/backend ./packages/backend
COPY package.json ./
RUN bun run build:backend

# ------------------------------------
# Build frontend (Next.js)
FROM base AS frontend-builder
WORKDIR /app
COPY package.json ./
COPY tsconfig.json ./
COPY packages/frontend ./packages/frontend
COPY --from=deps /app/node_modules ./node_modules
COPY --from=shared-builder /app/packages/shared ./packages/shared
RUN bun run build:frontend

# ------------------------------------
# Production Image
FROM base AS runner
WORKDIR /app

# Create app user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy node_modules with rebuilt bcrypt
COPY --from=deps /app/node_modules ./node_modules

COPY --from=frontend-builder --chown=nextjs:nodejs /app/packages/frontend/.next/standalone ./
COPY --from=frontend-builder --chown=nextjs:nodejs /app/packages/frontend/.next/static ./.next/static
COPY --from=frontend-builder --chown=nextjs:nodejs /app/packages/frontend/public ./public

# Backend
COPY --from=backend-builder --chown=nextjs:nodejs /app/packages/backend/dist/server ./dist/server

USER nextjs

ENV HOSTNAME="0.0.0.0"
CMD ["bunx", "concurrently", "dist/server", "bun server.js"]