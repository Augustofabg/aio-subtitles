# Stage 1: Build TypeScript application
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json tsconfig.json ./
RUN npm ci

# Copy source code and build
COPY scripts ./scripts
COPY src ./src
RUN npm run build

# Remove development dependencies
RUN npm prune --production

# Stage 2: Production runtime
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=7000
ENV HOST=0.0.0.0

# Create unprivileged user for security
USER node

# Copy production node_modules and built dist
COPY --chown=node:node --from=builder /app/package*.json ./
COPY --chown=node:node --from=builder /app/node_modules ./node_modules
COPY --chown=node:node --from=builder /app/dist ./dist

EXPOSE 7000

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:7000/health || exit 1

CMD ["node", "dist/index.js"]
