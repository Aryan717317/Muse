# Base stage
FROM node:18-alpine AS base

# Builder stage
FROM base AS builder
WORKDIR /app
COPY package*.json ./
COPY apps/server/package*.json ./apps/server/
COPY packages/types/package*.json ./packages/types/
# Install dependencies (including workspace)
RUN npm ci

# Copy source
COPY . .
# Build server & types
RUN npm run build -w apps/server

# Runner stage
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/server/dist ./apps/server/dist
COPY --from=builder /app/apps/server/package*.json ./apps/server/

WORKDIR /app/apps/server
EXPOSE 3001
CMD ["npm", "start"]
