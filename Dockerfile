FROM node:20-slim AS build

RUN groupadd -r appgroup && useradd -r -g appgroup appuser

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

# ---------------------
# Production stage
# ---------------------
FROM node:20-slim

# Create non-root user
RUN groupadd -r appgroup && useradd -r -g appgroup appuser

WORKDIR /app

# Copy built files only
COPY --from=build /app/dist ./dist
COPY --from=build /app/package*.json ./

# Install only production dependencies (we'll add `serve`)
RUN npm install -g serve && \
    npm install --omit=dev && \
    mkdir -p /app/logs && \
    chown -R appuser:appgroup /app

USER appuser

EXPOSE 8080

# Serve production build
CMD ["serve", "-s", "dist", "-l", "8080"]
