# Base Bun image
FROM oven/bun:1-alpine AS base

WORKDIR /app

ENV NODE_ENV=production
ARG NEXT_PUBLIC_API_URL
ARG API_URL

RUN apk add --no-cache libc6-compat python3 make g++

# ------------------------------------
# Install dependencies
FROM base AS deps

# Copy root-level and package-level files
COPY package.json bun.lock* ./
COPY tsconfig.json ./
COPY shared/tsconfig.json ./shared/
COPY backend/tsconfig.json ./backend/
COPY frontend/tsconfig.json ./frontend/
COPY shared/package.json ./shared/
COPY frontend/package.json ./frontend/
COPY backend/package.json ./backend/

# Install all deps (for all packages)
RUN bun install --frozen-lockfile

# ------------------------------------
# Build shared package
FROM base AS shared-builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY shared ./shared
COPY package.json ./
RUN bun run build:shared
# remove source code
RUN rm -rf shared/src

# ------------------------------------
# Build backend
FROM base AS backend-builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=shared-builder /app/shared ./shared
COPY backend ./backend
COPY package.json ./
COPY tsconfig.json ./
RUN bun run build:backend

# ------------------------------------
# Build frontend (Next.js)
FROM base AS frontend-builder
WORKDIR /app
COPY package.json ./
COPY tsconfig.json ./
COPY frontend ./frontend
COPY --from=deps /app/node_modules ./node_modules
COPY --from=shared-builder /app/shared ./shared
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

COPY --from=frontend-builder --chown=nextjs:nodejs /app/frontend/.next/standalone ./
COPY --from=frontend-builder --chown=nextjs:nodejs /app/frontend/.next/static ./.next/static
COPY --from=frontend-builder --chown=nextjs:nodejs /app/frontend/public ./public

# Backend
COPY --from=backend-builder --chown=nextjs:nodejs /app/backend/dist/server ./dist/server

USER nextjs

ENV HOSTNAME="0.0.0.0"
CMD ["bunx", "concurrently", "dist/server", "bun server.js"]