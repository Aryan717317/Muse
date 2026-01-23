# Base stage
FROM node:18-alpine AS base

# Builder stage
FROM base AS builder
WORKDIR /app

# Copy package.json from the server directory
COPY apps/server/package*.json ./

# Install dependencies (ignoring workspace for now since it's a standalone build)
RUN npm install

# Copy the server source code
COPY apps/server/ .

# Build the server
RUN npm run build

# Runner stage
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

EXPOSE 3001
CMD ["npm", "start"]
