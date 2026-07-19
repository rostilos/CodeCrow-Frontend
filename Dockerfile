FROM node:20-slim AS build

RUN groupadd -r appgroup && useradd -r -g appgroup appuser

WORKDIR /app

ENV NPM_CONFIG_AUDIT=false \
    NPM_CONFIG_FUND=false \
    NPM_CONFIG_REGISTRY=https://registry.npmjs.org/ \
    NPM_CONFIG_UPDATE_NOTIFIER=false \
    NPM_CONFIG_FETCH_RETRIES=5 \
    NPM_CONFIG_FETCH_RETRY_FACTOR=2 \
    NPM_CONFIG_FETCH_RETRY_MINTIMEOUT=20000 \
    NPM_CONFIG_FETCH_RETRY_MAXTIMEOUT=120000 \
    NPM_CONFIG_FETCH_TIMEOUT=300000

COPY package*.json ./

RUN npm ci --prefer-offline

COPY . .

# Vite values are public by design, but the source configuration must not be
# stored in a build layer or exported cache. The hash is a non-secret cache key
# so configuration changes cannot reuse stale frontend output.
ARG PUBLIC_WEB_FRONTEND_ENV_SHA256
RUN --mount=type=secret,id=web_frontend_env,required=true \
    test "$(sha256sum /run/secrets/web_frontend_env | cut -d' ' -f1)" = "$PUBLIC_WEB_FRONTEND_ENV_SHA256" && \
    cp /run/secrets/web_frontend_env .env.production && \
    npm run build && \
    rm -f .env.production

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
