# HADEROS Platform - Production Dockerfile
# Multi-stage build for optimized production image

# ============================================
# Stage 1: Dependencies
# ============================================
FROM node:20-alpine AS deps

# Install pnpm
RUN corepack enable && corepack prepare pnpm@8 --activate

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/haderos-web/package.json ./apps/haderos-web/

# Install dependencies
RUN pnpm install --frozen-lockfile --prod=false

# ============================================
# Stage 2: Builder
# ============================================
FROM node:20-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@8 --activate

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/haderos-web/node_modules ./apps/haderos-web/node_modules

# Copy source code
COPY . .

# Build arguments
ARG NODE_ENV=production
ARG VERSION=1.0.0
ENV NODE_ENV=${NODE_ENV}
ENV VERSION=${VERSION}

# Build the application
RUN pnpm build

# ============================================
# Stage 3: Production Runner
# ============================================
FROM node:20-alpine AS runner

# Install pnpm
RUN corepack enable && corepack prepare pnpm@8 --activate

WORKDIR /app

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 haderos

# Set environment
ENV NODE_ENV=production
ENV PORT=3000

# Copy built application
COPY --from=builder --chown=haderos:nodejs /app/apps/haderos-web/.next/standalone ./
COPY --from=builder --chown=haderos:nodejs /app/apps/haderos-web/.next/static ./apps/haderos-web/.next/static
COPY --from=builder --chown=haderos:nodejs /app/apps/haderos-web/public ./apps/haderos-web/public

# Copy package.json for healthcheck
COPY --from=builder /app/package.json ./

# Switch to non-root user
USER haderos

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))" || exit 1

# Start the application
CMD ["node", "apps/haderos-web/server.js"]
