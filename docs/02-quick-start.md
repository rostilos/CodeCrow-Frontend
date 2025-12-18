# Quick Start

Get CodeCrow up and running in under 10 minutes.

## Prerequisites

- Docker 20.10+
- Docker Compose v2.0+
- 4GB+ available RAM
- 10GB+ disk space
- OpenRouter API key (get one at [openrouter.ai](https://openrouter.ai))

## 1. Clone Repository

```bash
git clone <repository-url>
cd codecrow
```

## 2. Copy Configuration Files

```bash
# Docker Compose configuration
cp deployment/docker-compose-sample.yml deployment/docker-compose.yml

# Java services configuration
cp deployment/config/java-shared/application.properties.sample \
   deployment/config/java-shared/application.properties

# Python services configuration
cp deployment/config/mcp-client/.env.sample \
   deployment/config/mcp-client/.env

cp deployment/config/rag-pipeline/.env.sample \
   deployment/config/rag-pipeline/.env

# Frontend configuration
cp deployment/config/web-frontend/.env.sample \
   deployment/config/web-frontend/.env
```

## 3. Configure Secrets

Edit `deployment/config/java-shared/application.properties`:

```properties
# Generate new secrets (use: openssl rand -base64 32)
codecrow.security.jwtSecret=<your-jwt-secret>
codecrow.security.encryption-key=<your-encryption-key>

# Base URL for your deployment
codecrow.web.base.url=http://localhost:8080
```

Edit `deployment/config/rag-pipeline/.env`:

```bash
OPENROUTER_API_KEY=sk-or-v1-your-api-key-here
```

## 4. Build and Start

```bash
./tools/production-build.sh
```

This script builds all components and starts Docker containers.

Or manually:

```bash
cd deployment
docker compose up -d --build
```

## 5. Verify Services

```bash
cd deployment
docker compose ps
```

All services should be running:
- `codecrow-web-frontend` (8080) - Web interface
- `codecrow-web-application` (8081) - Backend API
- `codecrow-pipeline-agent` (8082) - Webhook processing
- `codecrow-mcp-client` (8000) - AI analysis
- `codecrow-rag-pipeline` (8001) - Code indexing
- `codecrow-postgres` (5432) - Database
- `codecrow-redis` (6379) - Cache
- `codecrow-qdrant` (6333) - Vector store

## 6. Access Application

Open your browser: **http://localhost:8080**

Create your first account and workspace.

## 7. Connect VCS

### Option A: Bitbucket Cloud App (Recommended)

1. Go to **Settings → Integrations**
2. Click **Install App** on Bitbucket Cloud card
3. Authorize in Atlassian
4. Select repositories to onboard
5. Configure AI connection
6. Done! Webhooks are automatically configured

### Option B: GitHub App

1. Go to **Settings → Integrations**
2. Click **Install App** on GitHub card
3. Authorize in GitHub
4. Select repositories to install
5. Configure AI connection
6. Done! Webhooks are automatically configured

### Option C: Manual Webhook Setup

1. Create a project in CodeCrow
2. Generate webhook token in project settings
3. Configure webhook in your VCS:
   - **URL**: `http://<your-domain>:8082/api/webhooks/bitbucket-cloud/<auth-token>`
   - **Events**: Pull Request (created, updated), Push, PR Comments
4. Configure AI connection in project settings

## 8. Test Analysis

Create a pull request in your connected repository. CodeCrow will automatically:
1. Receive the webhook
2. Analyze the changes
3. Post a comment with results

## What's Next?

- [Configuration Reference](./04-configuration.md) - Customize settings
- [Comment Commands](./08-comment-commands.md) - Use `/codecrow` commands
- [RAG Pipeline](./09-rag-pipeline.md) - Enable contextual analysis
- [Troubleshooting](./15-troubleshooting.md) - Common issues

## Troubleshooting Quick Fixes

**Services not starting?**
```bash
docker compose logs -f
```

**Port conflicts?**
Edit `deployment/docker-compose.yml` to change port mappings.

**Database connection errors?**
```bash
docker compose down -v
docker compose up -d
```

**Webhooks not working?**
- Check pipeline-agent is accessible from the internet
- Verify webhook URL and auth token
- Check logs: `docker logs codecrow-pipeline-agent`
