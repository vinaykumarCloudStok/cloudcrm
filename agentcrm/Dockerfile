# ---- Build Stage ----
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json ./
COPY server/package.json server/
COPY client/package.json client/

# Install all dependencies
RUN npm install && cd server && npm install && cd ../client && npm install

# Copy source code
COPY server/ server/
COPY client/ client/

# Build React client
RUN cd client && npm run build

# Generate Prisma client
RUN cd server && npx prisma generate

# ---- Production Stage ----
FROM node:20-alpine AS production

WORKDIR /app

# Copy package files and install server deps
COPY package.json ./
COPY server/package.json server/
RUN cd server && npm install

# Copy Prisma schema + migrations
COPY server/prisma server/prisma
RUN cd server && npx prisma generate

# Copy server source (tsx runs from source)
COPY server/src server/src

# Copy built React client
COPY --from=builder /app/client/dist client/dist

# Create data directory for SQLite
RUN mkdir -p /app/data

# Environment defaults
ENV NODE_ENV=production
ENV PORT=3001
ENV DATABASE_URL="file:/app/data/agentcrm.db"
ENV CORS_ORIGIN=http://localhost:3001

EXPOSE 3001

# Run migrations then start server
CMD cd server && npx prisma migrate deploy && NODE_ENV=production npx tsx src/server.ts
