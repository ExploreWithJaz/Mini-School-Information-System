# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build/transpile TypeScript (optional, tsx can run it directly)
RUN npm run build 2>/dev/null || true

# Runtime stage
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy built application from builder stage
COPY --from=builder /app . 

# Expose the port
EXPOSE 3001

# Always run seed (it will skip if data exists), then start server
CMD npm run seed && npm start