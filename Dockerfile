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
FROM nginx:stable-alpine

# Copy built files to nginx html directory
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Create log directory
RUN mkdir -p /app/logs && chown -R nginx:nginx /app/logs

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
