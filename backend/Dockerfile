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

# Expose the port (Render will use PORT env var, but we expose 3001 as default)
EXPOSE 3001

# Optional: Run seed on startup if SEED_DATABASE flag is set
CMD sh -c 'if [ "$SEED_DATABASE" = "true" ]; then npm run seed && npm start; else npm start; fi'