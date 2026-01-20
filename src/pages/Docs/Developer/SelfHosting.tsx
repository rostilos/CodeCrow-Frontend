import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Server, Database, Key, Mail, GitBranch, Bot, Brain, Shield, Terminal, FolderTree, CheckCircle2, AlertTriangle, Copy, ExternalLink } from "lucide-react";

export default function SelfHosting() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10">
            <Server className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Self-Hosting Guide</h1>
            <p className="text-muted-foreground mt-1">
              Complete instructions to deploy CodeCrow on your own infrastructure
            </p>
          </div>
        </div>
      </div>

      {/* Prerequisites */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            Prerequisites
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg space-y-2">
              <h4 className="font-medium">System Requirements</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• <strong>CPU:</strong> 4+ cores recommended</li>
                <li>• <strong>RAM:</strong> 8GB minimum, 16GB recommended</li>
                <li>• <strong>Storage:</strong> 50GB+ SSD</li>
                <li>• <strong>OS:</strong> Linux (Ubuntu 22.04+ recommended)</li>
              </ul>
            </div>
            <div className="p-4 border rounded-lg space-y-2">
              <h4 className="font-medium">Required Software</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• <strong>Docker:</strong> 24.0+ with Compose V2</li>
                <li>• <strong>Git:</strong> For cloning repository</li>
                <li>• <strong>Domain:</strong> For HTTPS and VCS callbacks</li>
                <li>• <strong>SSL Certificate:</strong> Let's Encrypt or custom</li>
              </ul>
            </div>
          </div>

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Network Requirements</AlertTitle>
            <AlertDescription>
              CodeCrow requires outbound internet access for LLM APIs (OpenRouter) and embedding models.
              VCS webhooks require inbound access on port 443 (via reverse proxy).
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Directory Structure */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderTree className="h-5 w-5" />
            Project Structure
          </CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="p-4 bg-muted rounded-lg text-sm overflow-x-auto">
{`codecrow/
├── deployment/
│   ├── docker-compose.yml          # Main deployment configuration
│   └── config/
│       ├── java-shared/
│       │   └── application.properties  # Java services configuration
│       ├── mcp-client/
│       │   └── .env                    # MCP Client environment
│       ├── rag-pipeline/
│       │   └── .env                    # RAG Pipeline environment
│       └── web-frontend/
│           └── .env                    # Frontend environment
├── java-ecosystem/                 # Java services source
├── python-ecosystem/               # Python services source
└── frontend/                       # React frontend source`}
          </pre>
        </CardContent>
      </Card>

      {/* Configuration Files */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Configuration Files
          </CardTitle>
          <CardDescription>
            All configuration files that need to be created before deployment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="java" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="java">Java Services</TabsTrigger>
              <TabsTrigger value="mcp">MCP Client</TabsTrigger>
              <TabsTrigger value="rag">RAG Pipeline</TabsTrigger>
              <TabsTrigger value="frontend">Frontend</TabsTrigger>
            </TabsList>

            <TabsContent value="java" className="space-y-4">
              <div className="text-sm text-muted-foreground mb-4">
                <strong>Location:</strong> <code className="bg-muted px-1 rounded">deployment/config/java-shared/application.properties</code>
              </div>
              <pre className="p-4 bg-muted rounded-lg text-xs overflow-x-auto max-h-[600px]">
{`# =============================================================================
# CODECROW APPLICATION PROPERTIES
# =============================================================================

# -----------------------------------------------------------------------------
# SERVER CONFIGURATION
# -----------------------------------------------------------------------------
server.port=8081
spring.application.name=codecrow-web-server

# -----------------------------------------------------------------------------
# DATABASE CONFIGURATION
# -----------------------------------------------------------------------------
spring.datasource.url=jdbc:postgresql://postgres:5432/codecrow
spring.datasource.username=codecrow
spring.datasource.password=YOUR_SECURE_DB_PASSWORD
spring.datasource.driver-class-name=org.postgresql.Driver

# JPA/Hibernate
spring.jpa.hibernate.ddl-auto=validate
spring.jpa.show-sql=false
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.PostgreSQLDialect
spring.jpa.properties.hibernate.format_sql=true

# Flyway migrations
spring.flyway.enabled=true
spring.flyway.locations=classpath:db/migration
spring.flyway.baseline-on-migrate=true

# -----------------------------------------------------------------------------
# REDIS CONFIGURATION
# -----------------------------------------------------------------------------
spring.data.redis.host=redis
spring.data.redis.port=6379

# -----------------------------------------------------------------------------
# SECURITY CONFIGURATION
# -----------------------------------------------------------------------------
# JWT Secret (generate with: openssl rand -base64 64)
codecrow.security.jwt.secret=YOUR_JWT_SECRET_BASE64_ENCODED_MIN_64_CHARS

# JWT Token Validity (24 hours in milliseconds)
codecrow.security.jwt.expiration=86400000

# Encryption key for sensitive data (generate with: openssl rand -hex 32)
codecrow.security.encryption.key=YOUR_32_BYTE_HEX_ENCRYPTION_KEY

# CORS Origins (your frontend domain)
codecrow.security.cors.allowed-origins=https://codecrow.yourdomain.com

# -----------------------------------------------------------------------------
# EMAIL / SMTP CONFIGURATION
# -----------------------------------------------------------------------------
spring.mail.host=smtp.your-provider.com
spring.mail.port=587
spring.mail.username=your-email@domain.com
spring.mail.password=YOUR_SMTP_PASSWORD
spring.mail.properties.mail.smtp.auth=true
spring.mail.properties.mail.smtp.starttls.enable=true

codecrow.mail.from=noreply@yourdomain.com
codecrow.mail.from-name=CodeCrow

# -----------------------------------------------------------------------------
# BITBUCKET CLOUD CONFIGURATION
# -----------------------------------------------------------------------------
# OAuth Consumer (for user authentication)
codecrow.vcs.bitbucket.oauth.client-id=YOUR_BITBUCKET_OAUTH_CLIENT_ID
codecrow.vcs.bitbucket.oauth.client-secret=YOUR_BITBUCKET_OAUTH_CLIENT_SECRET
codecrow.vcs.bitbucket.oauth.callback-url=https://codecrow.yourdomain.com/api/auth/bitbucket/callback

# Bitbucket Connect App (for webhooks and API access)
codecrow.vcs.bitbucket.connect.app-key=your-app-key
codecrow.vcs.bitbucket.connect.shared-secret=YOUR_CONNECT_SHARED_SECRET
codecrow.vcs.bitbucket.connect.base-url=https://codecrow.yourdomain.com

# -----------------------------------------------------------------------------
# GITHUB CONFIGURATION
# -----------------------------------------------------------------------------
# GitHub App credentials
codecrow.vcs.github.app.id=YOUR_GITHUB_APP_ID
codecrow.vcs.github.app.client-id=YOUR_GITHUB_APP_CLIENT_ID
codecrow.vcs.github.app.client-secret=YOUR_GITHUB_APP_CLIENT_SECRET
codecrow.vcs.github.app.webhook-secret=YOUR_GITHUB_WEBHOOK_SECRET
# Private key path (mount as volume or use environment variable)
codecrow.vcs.github.app.private-key-path=/app/config/github-private-key/private-key.pem

# -----------------------------------------------------------------------------
# GITLAB CONFIGURATION
# -----------------------------------------------------------------------------
codecrow.vcs.gitlab.oauth.client-id=YOUR_GITLAB_CLIENT_ID
codecrow.vcs.gitlab.oauth.client-secret=YOUR_GITLAB_CLIENT_SECRET
codecrow.vcs.gitlab.oauth.callback-url=https://codecrow.yourdomain.com/api/auth/gitlab/callback

# -----------------------------------------------------------------------------
# RAG CONFIGURATION
# -----------------------------------------------------------------------------
codecrow.rag.api.enabled=true
codecrow.rag.api.url=http://rag-pipeline:8001

# -----------------------------------------------------------------------------
# MCP CLIENT CONFIGURATION
# -----------------------------------------------------------------------------
codecrow.mcp.client.url=http://mcp-client:8000

# -----------------------------------------------------------------------------
# LOGGING
# -----------------------------------------------------------------------------
logging.level.org.rostilos.codecrow=INFO
logging.level.org.springframework.security=WARN
logging.level.org.hibernate.SQL=WARN`}
              </pre>
            </TabsContent>

            <TabsContent value="mcp" className="space-y-4">
              <div className="text-sm text-muted-foreground mb-4">
                <strong>Location:</strong> <code className="bg-muted px-1 rounded">deployment/config/mcp-client/.env</code>
              </div>
              <pre className="p-4 bg-muted rounded-lg text-xs overflow-x-auto">
{`# =============================================================================
# MCP CLIENT CONFIGURATION
# =============================================================================

# LLM Provider Configuration
LLM_PROVIDER=openrouter
OPENROUTER_API_KEY=sk-or-v1-your-openrouter-api-key

# Model Selection
LLM_MODEL=anthropic/claude-sonnet-4
LLM_FALLBACK_MODEL=openai/gpt-4o

# RAG Pipeline Connection
RAG_API_URL=http://rag-pipeline:8001

# MCP Server Paths (mounted in container)
VCS_MCP_JAR_PATH=/app/mcp-servers/codecrow-vcs-mcp.jar
PLATFORM_MCP_JAR_PATH=/app/mcp-servers/codecrow-platform-mcp.jar

# Analysis Settings
MAX_TOKENS_PER_FILE=8000
MAX_TOTAL_TOKENS=100000
ENABLE_RAG_CONTEXT=true

# Logging
LOG_LEVEL=INFO
PYTHONUNBUFFERED=1`}
              </pre>
            </TabsContent>

            <TabsContent value="rag" className="space-y-4">
              <div className="text-sm text-muted-foreground mb-4">
                <strong>Location:</strong> <code className="bg-muted px-1 rounded">deployment/config/rag-pipeline/.env</code>
              </div>
              <pre className="p-4 bg-muted rounded-lg text-xs overflow-x-auto">
{`# =============================================================================
# RAG PIPELINE CONFIGURATION
# =============================================================================

# Qdrant Vector Database
QDRANT_URL=http://qdrant:6333
QDRANT_API_KEY=  # Optional, for Qdrant Cloud

# Embedding Model
EMBEDDING_PROVIDER=openrouter
OPENROUTER_API_KEY=sk-or-v1-your-openrouter-api-key
EMBEDDING_MODEL=openai/text-embedding-3-small

# Chunking Configuration
CHUNK_SIZE=800
CHUNK_OVERLAP=200

# Index Limits (Free tier defaults)
MAX_CHUNKS_PER_INDEX=50000
MAX_FILES_PER_INDEX=5000
MAX_FILE_SIZE_BYTES=1048576  # 1MB

# Reranking
ENABLE_RERANKING=true
RERANK_MODEL=cohere/rerank-english-v3.0

# Logging
LOG_LEVEL=INFO
PYTHONUNBUFFERED=1`}
              </pre>
            </TabsContent>

            <TabsContent value="frontend" className="space-y-4">
              <div className="text-sm text-muted-foreground mb-4">
                <strong>Location:</strong> <code className="bg-muted px-1 rounded">deployment/config/web-frontend/.env</code>
              </div>
              <pre className="p-4 bg-muted rounded-lg text-xs overflow-x-auto">
{`# =============================================================================
# FRONTEND CONFIGURATION
# =============================================================================

# API Base URL (your backend)
VITE_API_BASE_URL=https://codecrow.yourdomain.com

# Public URL (for OAuth callbacks)
VITE_PUBLIC_URL=https://codecrow.yourdomain.com

# Feature Flags
VITE_ENABLE_GITHUB=true
VITE_ENABLE_GITLAB=true
VITE_ENABLE_RAG=true`}
              </pre>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Docker Compose */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Terminal className="h-5 w-5" />
            Docker Compose Setup
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground mb-4">
            The <code className="bg-muted px-1 rounded">deployment/docker-compose.yml</code> file orchestrates all services.
          </div>

          <pre className="p-4 bg-muted rounded-lg text-xs overflow-x-auto max-h-[500px]">
{`version: '3.8'

services:
  # PostgreSQL Database
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: codecrow
      POSTGRES_USER: codecrow
      POSTGRES_PASSWORD: \${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U codecrow"]
      interval: 5s
      timeout: 5s
      retries: 5

  # Redis for sessions and locks
  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 5

  # Qdrant Vector Database
  qdrant:
    image: qdrant/qdrant:latest
    volumes:
      - qdrant_data:/qdrant/storage
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:6333/health"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Web Server (Main API)
  web-server:
    image: codecrow/web-server:latest
    ports:
      - "8081:8081"
    volumes:
      - ./config/java-shared:/app/config:ro
    environment:
      - SPRING_CONFIG_LOCATION=/app/config/application.properties
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy

  # Pipeline Agent (Webhook Handler)
  pipeline-agent:
    image: codecrow/pipeline-agent:latest
    ports:
      - "8082:8082"
    volumes:
      - ./config/java-shared:/app/config:ro
    environment:
      - SPRING_CONFIG_LOCATION=/app/config/application.properties
    depends_on:
      - web-server
      - mcp-client

  # MCP Client (AI Analysis)
  mcp-client:
    image: codecrow/mcp-client:latest
    ports:
      - "8000:8000"
    env_file:
      - ./config/mcp-client/.env
    volumes:
      - ./mcp-servers:/app/mcp-servers:ro
    depends_on:
      - rag-pipeline

  # RAG Pipeline (Indexing & Search)
  rag-pipeline:
    image: codecrow/rag-pipeline:latest
    ports:
      - "8001:8001"
    env_file:
      - ./config/rag-pipeline/.env
    depends_on:
      qdrant:
        condition: service_healthy

  # Frontend
  web-frontend:
    image: codecrow/web-frontend:latest
    ports:
      - "8080:8080"
    env_file:
      - ./config/web-frontend/.env

volumes:
  postgres_data:
  redis_data:
  qdrant_data:`}
          </pre>
        </CardContent>
      </Card>

      {/* VCS Platform Setup */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            VCS Platform Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="bitbucket" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="bitbucket">Bitbucket Cloud</TabsTrigger>
              <TabsTrigger value="github">GitHub</TabsTrigger>
              <TabsTrigger value="gitlab">GitLab</TabsTrigger>
            </TabsList>

            <TabsContent value="bitbucket" className="space-y-4">
              <div className="space-y-4">
                <h4 className="font-medium">1. Create OAuth Consumer</h4>
                <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-2 ml-4">
                  <li>Go to Bitbucket Settings → OAuth consumers → Add consumer</li>
                  <li>Set Callback URL: <code className="bg-muted px-1 rounded">https://codecrow.yourdomain.com/api/auth/bitbucket/callback</code></li>
                  <li>Enable permissions: Account Read, Repositories Read, Pull Requests Read/Write</li>
                  <li>Save and copy Client ID and Secret to <code>application.properties</code></li>
                </ol>

                <h4 className="font-medium">2. Create Bitbucket Connect App</h4>
                <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-2 ml-4">
                  <li>Create <code>atlassian-connect.json</code> descriptor file</li>
                  <li>Host the descriptor at <code>https://codecrow.yourdomain.com/connect/atlassian-connect.json</code></li>
                  <li>Install the app to your Bitbucket workspace</li>
                  <li>Configure webhook URL: <code>https://codecrow.yourdomain.com/api/v1/pipeline/webhook</code></li>
                </ol>
              </div>
            </TabsContent>

            <TabsContent value="github" className="space-y-4">
              <div className="space-y-4">
                <h4 className="font-medium">1. Create GitHub App</h4>
                <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-2 ml-4">
                  <li>Go to GitHub Settings → Developer settings → GitHub Apps → New GitHub App</li>
                  <li>Set Homepage URL: <code className="bg-muted px-1 rounded">https://codecrow.yourdomain.com</code></li>
                  <li>Set Callback URL: <code className="bg-muted px-1 rounded">https://codecrow.yourdomain.com/api/auth/github/callback</code></li>
                  <li>Set Webhook URL: <code className="bg-muted px-1 rounded">https://codecrow.yourdomain.com/api/v1/pipeline/webhook/github</code></li>
                  <li>Generate and download private key (.pem file)</li>
                </ol>

                <h4 className="font-medium">2. Required Permissions</h4>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                  <li>• <strong>Repository:</strong> Contents (Read), Pull requests (Read/Write), Metadata (Read)</li>
                  <li>• <strong>Organization:</strong> Members (Read)</li>
                  <li>• <strong>Subscribe to events:</strong> Pull request, Push, Issue comment</li>
                </ul>
              </div>
            </TabsContent>

            <TabsContent value="gitlab" className="space-y-4">
              <div className="space-y-4">
                <h4 className="font-medium">1. Create GitLab Application</h4>
                <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-2 ml-4">
                  <li>Go to GitLab Preferences → Applications → New Application</li>
                  <li>Set Redirect URI: <code className="bg-muted px-1 rounded">https://codecrow.yourdomain.com/api/auth/gitlab/callback</code></li>
                  <li>Enable scopes: api, read_user, read_repository</li>
                  <li>Save Application ID and Secret to <code>application.properties</code></li>
                </ol>

                <h4 className="font-medium">2. Configure Webhooks</h4>
                <p className="text-sm text-muted-foreground ml-4">
                  Webhooks are configured per-project in GitLab. CodeCrow will guide you through this during project setup.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Reverse Proxy */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Reverse Proxy Configuration (nginx)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="p-4 bg-muted rounded-lg text-xs overflow-x-auto">
{`server {
    listen 443 ssl http2;
    server_name codecrow.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/codecrow.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/codecrow.yourdomain.com/privkey.pem;

    # Frontend
    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Web Server API
    location /api/ {
        proxy_pass http://localhost:8081/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # SSE support for streaming
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 300s;
    }

    # Pipeline Agent webhooks
    location /api/v1/pipeline/ {
        proxy_pass http://localhost:8082/api/v1/pipeline/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Longer timeout for analysis
        proxy_read_timeout 600s;
    }

    # Bitbucket Connect descriptor
    location /connect/ {
        proxy_pass http://localhost:8081/connect/;
        proxy_set_header Host $host;
    }
}`}
          </pre>
        </CardContent>
      </Card>

      {/* Deployment Steps */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            Deployment Steps
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ol className="space-y-4">
            <li className="flex gap-4">
              <Badge variant="outline" className="h-6 w-6 rounded-full flex items-center justify-center">1</Badge>
              <div>
                <h4 className="font-medium">Clone Repository</h4>
                <pre className="mt-2 p-2 bg-muted rounded text-sm">git clone https://github.com/codecrow/codecrow.git && cd codecrow</pre>
              </div>
            </li>
            <li className="flex gap-4">
              <Badge variant="outline" className="h-6 w-6 rounded-full flex items-center justify-center">2</Badge>
              <div>
                <h4 className="font-medium">Create Configuration Files</h4>
                <p className="text-sm text-muted-foreground">Copy sample configs and fill in your values:</p>
                <pre className="mt-2 p-2 bg-muted rounded text-sm">
{`cp deployment/config/java-shared/application.properties.sample deployment/config/java-shared/application.properties
cp deployment/config/mcp-client/.env.sample deployment/config/mcp-client/.env
cp deployment/config/rag-pipeline/.env.sample deployment/config/rag-pipeline/.env`}
                </pre>
              </div>
            </li>
            <li className="flex gap-4">
              <Badge variant="outline" className="h-6 w-6 rounded-full flex items-center justify-center">3</Badge>
              <div>
                <h4 className="font-medium">Build Docker Images</h4>
                <pre className="mt-2 p-2 bg-muted rounded text-sm">cd tools && ./production-build.sh</pre>
              </div>
            </li>
            <li className="flex gap-4">
              <Badge variant="outline" className="h-6 w-6 rounded-full flex items-center justify-center">4</Badge>
              <div>
                <h4 className="font-medium">Start Services</h4>
                <pre className="mt-2 p-2 bg-muted rounded text-sm">cd deployment && docker compose up -d</pre>
              </div>
            </li>
            <li className="flex gap-4">
              <Badge variant="outline" className="h-6 w-6 rounded-full flex items-center justify-center">5</Badge>
              <div>
                <h4 className="font-medium">Verify Health</h4>
                <pre className="mt-2 p-2 bg-muted rounded text-sm">
{`# Check all services are healthy
docker compose ps

# Check individual service logs
docker compose logs -f web-server`}
                </pre>
              </div>
            </li>
            <li className="flex gap-4">
              <Badge variant="outline" className="h-6 w-6 rounded-full flex items-center justify-center">6</Badge>
              <div>
                <h4 className="font-medium">Configure Reverse Proxy</h4>
                <p className="text-sm text-muted-foreground">Set up nginx/Caddy with SSL certificates</p>
              </div>
            </li>
            <li className="flex gap-4">
              <Badge variant="outline" className="h-6 w-6 rounded-full flex items-center justify-center">7</Badge>
              <div>
                <h4 className="font-medium">Access CodeCrow</h4>
                <p className="text-sm text-muted-foreground">
                  Open <code className="bg-muted px-1 rounded">https://codecrow.yourdomain.com</code> and complete the initial setup
                </p>
              </div>
            </li>
          </ol>
        </CardContent>
      </Card>

      {/* Health Endpoints */}
      <Card>
        <CardHeader>
          <CardTitle>Health Check Endpoints</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 text-sm">
            <div className="flex justify-between p-2 bg-muted rounded">
              <span>Web Server</span>
              <code>GET http://localhost:8081/actuator/health</code>
            </div>
            <div className="flex justify-between p-2 bg-muted rounded">
              <span>Pipeline Agent</span>
              <code>GET http://localhost:8082/actuator/health</code>
            </div>
            <div className="flex justify-between p-2 bg-muted rounded">
              <span>MCP Client</span>
              <code>GET http://localhost:8000/health</code>
            </div>
            <div className="flex justify-between p-2 bg-muted rounded">
              <span>RAG Pipeline</span>
              <code>GET http://localhost:8001/health</code>
            </div>
            <div className="flex justify-between p-2 bg-muted rounded">
              <span>Qdrant</span>
              <code>GET http://localhost:6333/health</code>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
