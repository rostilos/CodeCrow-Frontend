import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Settings, Server, Database, Shield, Key, Mail, Lock, Cpu, Globe, AlertTriangle, ExternalLink } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "react-router-dom";

export default function Configuration() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10">
            <Settings className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Configuration</h1>
            <p className="text-muted-foreground mt-1">
              Configure CodeCrow services and components
            </p>
          </div>
        </div>
      </div>

      {/* Configuration Tabs */}
      <Tabs defaultValue="java" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 h-auto">
          <TabsTrigger value="java" className="py-2">Java Services</TabsTrigger>
          <TabsTrigger value="mcp" className="py-2">MCP Client</TabsTrigger>
          <TabsTrigger value="rag" className="py-2">RAG Pipeline</TabsTrigger>
          <TabsTrigger value="frontend" className="py-2">Frontend</TabsTrigger>
          <TabsTrigger value="smtp" className="py-2">SMTP</TabsTrigger>
        </TabsList>

        {/* Java Services */}
        <TabsContent value="java" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Server className="h-5 w-5 text-primary" />
                <CardTitle>Java Services Configuration</CardTitle>
              </div>
              <CardDescription>
                application.properties for web-server and pipeline-agent
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Database */}
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  Database Configuration
                </h3>
                <div className="bg-muted/50 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                  <pre className="text-xs">{`spring.datasource.url=jdbc:postgresql://localhost:5432/codecrow_ai
spring.datasource.username=codecrow_user
spring.datasource.password=<DB_PASSWORD>
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=false`}</pre>
                </div>
              </div>

              {/* Security */}
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Security Settings
                </h3>
                <div className="bg-muted/50 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                  <pre className="text-xs">{`# JWT Configuration
codecrow.security.jwtSecret=<256-bit-base64-secret>
codecrow.security.jwtExpirationMs=86400000              # 24 hours
codecrow.security.refreshTokenExpirationMs=604800000    # 7 days
codecrow.security.projectJwtExpirationMs=7776000000     # 3 months (webhooks)

# Encryption key for sensitive data (VCS tokens, AI keys)
codecrow.security.encryption-key=<256-bit-base64-key>
codecrow.security.encryption-key-old=<old-key>          # For key rotation

# Internal API (service-to-service)
codecrow.internal.api.secret=<shared-secret>            # Must match MCP Client`}</pre>
                </div>
                <p className="text-sm text-muted-foreground">
                  Generate secrets using: <code className="bg-muted px-1.5 py-0.5 rounded text-xs">openssl rand -base64 32</code>
                </p>
              </div>

              {/* Application URLs */}
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Application URLs
                </h3>
                <div className="bg-muted/50 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                  <pre className="text-xs">{`# Application name (used in emails, 2FA)
codecrow.app.name=CodeCrow

# Web Server URL (API server - used for OAuth callbacks)
codecrow.web.base.url=https://api.codecrow.io

# Frontend URL (for redirects and email links)
codecrow.frontend-url=https://app.codecrow.io

# Pipeline Agent webhook URL
codecrow.webhook.base-url=https://webhooks.codecrow.io`}</pre>
                </div>
              </div>

              {/* Service URLs */}
              <div className="space-y-3">
                <h3 className="font-semibold">Internal Service URLs</h3>
                <div className="bg-muted/50 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                  <pre className="text-xs">{`# MCP client endpoint
codecrow.mcp.client.url=http://codecrow-mcp-client:8000/review

# RAG pipeline endpoint
codecrow.rag.api.url=http://codecrow-rag-pipeline:8001
codecrow.rag.api.enabled=true
codecrow.rag.api.timeout.connect=30         # seconds
codecrow.rag.api.timeout.read=120           # seconds
codecrow.rag.api.timeout.indexing=14400     # 4 hours for large repos`}</pre>
                </div>
              </div>

              {/* Analysis Lock */}
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Analysis Lock Configuration
                </h3>
                <div className="bg-muted/50 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                  <pre className="text-xs">{`# Lock timeouts
analysis.lock.timeout.minutes=30                    # Max analysis duration
analysis.lock.rag.timeout.minutes=360               # RAG indexing (6 hours)
analysis.lock.wait.timeout.minutes=5                # Wait for lock release
analysis.lock.wait.retry.interval.seconds=5         # Retry interval
analysis.lock.cleanup.interval.ms=300000            # Cleanup expired locks`}</pre>
                </div>
              </div>

              {/* Redis */}
              <div className="space-y-3">
                <h3 className="font-semibold">Redis Configuration</h3>
                <div className="bg-muted/50 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                  <pre className="text-xs">{`spring.redis.host=localhost
spring.redis.port=6379
spring.redis.password=<redis-password>
spring.data.redis.repositories.enabled=false`}</pre>
                </div>
              </div>

              {/* Bitbucket App */}
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  Bitbucket Cloud OAuth
                </h3>
                <p className="text-sm text-muted-foreground">
                  Required for 1-click App installation with automatic token refresh:
                </p>
                <div className="bg-muted/50 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                  <pre className="text-xs">{`# Bitbucket Cloud App OAuth credentials
codecrow.bitbucket.app.client-id=<your-oauth-consumer-key>
codecrow.bitbucket.app.client-secret=<your-oauth-consumer-secret>`}</pre>
                </div>
                <p className="text-xs text-muted-foreground">
                  Create at: Bitbucket Settings → Workspace Settings → OAuth consumers with callback URL:{" "}
                  <code className="bg-muted px-1 py-0.5 rounded">
                    {"${codecrow.web.base.url}"}/api/{"{workspaceSlug}"}/integrations/bitbucket-cloud/app/callback
                  </code>
                </p>
              </div>

              {/* GitHub App */}
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  GitHub App
                </h3>
                <p className="text-sm text-muted-foreground">
                  Required for 1-click GitHub integration:
                </p>
                <div className="bg-muted/50 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                  <pre className="text-xs">{`# GitHub App credentials
codecrow.github.app.id=<app-id>
codecrow.github.app.slug=<app-slug>
codecrow.github.app.private-key-path=/app/config/github-app-private-key.pem
codecrow.github.app.webhook-secret=<webhook-secret>`}</pre>
                </div>
                <div className="mt-2 p-2 bg-blue-500/10 border border-blue-500/20 rounded text-xs">
                  <strong>Setup:</strong> Create GitHub App at{" "}
                  <a href="https://github.com/settings/apps/new" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
                    github.com/settings/apps <ExternalLink className="h-3 w-3" />
                  </a>
                  {" "}→ Generate private key (.pem) → Mount in container
                </div>
              </div>

              {/* GitLab OAuth */}
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  GitLab OAuth
                </h3>
                <p className="text-sm text-muted-foreground">
                  Required for GitLab integration:
                </p>
                <div className="bg-muted/50 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                  <pre className="text-xs">{`# GitLab OAuth credentials
codecrow.gitlab.oauth.client-id=<application-id>
codecrow.gitlab.oauth.client-secret=<application-secret>

# For self-hosted GitLab (leave empty for gitlab.com)
codecrow.gitlab.oauth.base-url=https://gitlab.mycompany.com`}</pre>
                </div>
                <p className="text-xs text-muted-foreground">
                  <strong>Required scopes:</strong> api, read_user, read_repository, write_repository
                </p>
              </div>

              {/* Google OAuth */}
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  Google OAuth (Optional)
                </h3>
                <p className="text-sm text-muted-foreground">
                  Enable Google Sign-In for user authentication:
                </p>
                <div className="bg-muted/50 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                  <pre className="text-xs">{`# Google OAuth Client ID
codecrow.oauth.google.client-id=<your-google-client-id>.apps.googleusercontent.com`}</pre>
                </div>
                <p className="text-xs text-muted-foreground">
                  Create OAuth 2.0 credentials at{" "}
                  <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
                    Google Cloud Console <ExternalLink className="h-3 w-3" />
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* MCP Client */}
        <TabsContent value="mcp" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Cpu className="h-5 w-5 text-primary" />
                <CardTitle>MCP Client Configuration</CardTitle>
              </div>
              <CardDescription>
                Environment variables for the Python MCP client
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Server Settings */}
              <div className="space-y-3">
                <h3 className="font-semibold">Server Settings</h3>
                <div className="bg-muted/50 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                  <pre className="text-xs">{`# Server port
AI_CLIENT_PORT=8000

# Internal API
CODECROW_API_URL=http://codecrow-web-application:8081
INTERNAL_API_SECRET=<must-match-java-config>

# Platform MCP JAR
PLATFORM_MCP_JAR=/app/codecrow-platform-mcp-1.0.jar`}</pre>
                </div>
              </div>

              {/* RAG Integration */}
              <div className="space-y-3">
                <h3 className="font-semibold">RAG Integration</h3>
                <div className="bg-muted/50 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                  <pre className="text-xs">{`# Enable RAG context retrieval
RAG_ENABLED=true
RAG_API_URL=http://codecrow-rag-pipeline:8001

# RAG Context Settings
RAG_MIN_RELEVANCE_SCORE=0.7      # Minimum similarity (0.0-1.0)
RAG_DEFAULT_TOP_K=15             # Number of chunks to retrieve
RAG_CACHE_TTL_SECONDS=300        # Cache duration
RAG_CACHE_MAX_SIZE=100           # Max cache entries`}</pre>
                </div>
              </div>

              {/* LLM Settings */}
              <div className="space-y-3">
                <h3 className="font-semibold">LLM Settings</h3>
                <div className="bg-muted/50 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                  <pre className="text-xs">{`# Temperature (0.0 = deterministic)
LLM_TEMPERATURE=0.0

# LLM Reranking (for large PRs)
LLM_RERANK_ENABLED=true
LLM_RERANK_THRESHOLD=20          # Min files to trigger
LLM_RERANK_MAX_ITEMS=15          # Max RAG items to rerank`}</pre>
                </div>
              </div>

              {/* Diff Processing Limits */}
              <div className="space-y-3">
                <h3 className="font-semibold">Diff Processing Limits</h3>
                <div className="bg-muted/50 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                  <pre className="text-xs">{`# Matches MCP server LargeContentFilter
DIFF_MAX_FILE_SIZE=25600         # 25KB per file
DIFF_MAX_FILES=100               # Max files per review
DIFF_MAX_TOTAL_SIZE=500000       # 500KB total
DIFF_MAX_LINES_PER_FILE=1000     # Max lines per file`}</pre>
                </div>
              </div>

              {/* Context Budget */}
              <div className="space-y-3">
                <h3 className="font-semibold">Context Budget Allocation</h3>
                <div className="bg-muted/50 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                  <pre className="text-xs">{`# Must sum to 1.0
CONTEXT_BUDGET_HIGH_PRIORITY_PCT=0.30    # Critical changed files
CONTEXT_BUDGET_MEDIUM_PRIORITY_PCT=0.40  # Related files
CONTEXT_BUDGET_LOW_PRIORITY_PCT=0.20     # Config, docs
CONTEXT_BUDGET_RAG_PCT=0.10              # RAG context`}</pre>
                </div>
              </div>

              {/* Debug Logging */}
              <div className="space-y-3">
                <h3 className="font-semibold">Debug Logging</h3>
                <div className="bg-muted/50 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                  <pre className="text-xs">{`# Prompt logging (for debugging)
PROMPT_LOG_ENABLED=true
PROMPT_LOG_TO_FILE=true
PROMPT_LOG_TO_CONSOLE=false
PROMPT_LOG_DIR=/tmp/codecrow_prompts
PROMPT_LOG_MAX_FILES=50`}</pre>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* RAG Pipeline */}
        <TabsContent value="rag" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" />
                <CardTitle>RAG Pipeline Configuration</CardTitle>
              </div>
              <CardDescription>
                Environment variables for the RAG service
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Vector Database */}
              <div className="space-y-3">
                <h3 className="font-semibold">Vector Database</h3>
                <div className="bg-muted/50 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                  <pre className="text-xs">{`# Qdrant connection
QDRANT_URL=http://qdrant:6333
QDRANT_COLLECTION_PREFIX=codecrow`}</pre>
                </div>
              </div>

              {/* Embedding Model */}
              <div className="space-y-3">
                <h3 className="font-semibold">Embedding Model</h3>
                <div className="bg-muted/50 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                  <pre className="text-xs">{`# OpenRouter for embeddings
OPENROUTER_API_KEY=sk-or-v1-your-api-key
OPENROUTER_MODEL=qwen/qwen3-embedding-8b

# Alternative models:
# OPENROUTER_MODEL=openai/text-embedding-3-large
# OPENROUTER_MODEL=openai/text-embedding-ada-002`}</pre>
                </div>
              </div>

              {/* AST Chunking */}
              <div className="space-y-3">
                <h3 className="font-semibold">AST-Based Chunking</h3>
                <div className="bg-muted/50 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                  <pre className="text-xs">{`# Enable AST-based chunking (recommended)
RAG_USE_AST_SPLITTER=true

# Chunking sizes
CHUNK_SIZE=800
CHUNK_OVERLAP=200
TEXT_CHUNK_SIZE=1000
TEXT_CHUNK_OVERLAP=200`}</pre>
                </div>
                <p className="text-xs text-muted-foreground">
                  AST chunking uses tree-sitter to split code by semantic units (functions, classes) instead of arbitrary line counts.
                </p>
              </div>

              {/* Retrieval Settings */}
              <div className="space-y-3">
                <h3 className="font-semibold">Retrieval Settings</h3>
                <div className="bg-muted/50 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                  <pre className="text-xs">{`# Search configuration
RETRIEVAL_TOP_K=10
SIMILARITY_THRESHOLD=0.7

# File size limit
MAX_FILE_SIZE_BYTES=1048576    # 1MB`}</pre>
                </div>
              </div>

              {/* Plan Limits */}
              <div className="space-y-3">
                <h3 className="font-semibold">Index Limits</h3>
                <div className="bg-muted/50 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                  <pre className="text-xs">{`# Limits for free/starter plans
RAG_MAX_CHUNKS_PER_INDEX=70000
RAG_MAX_FILES_PER_INDEX=40000`}</pre>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Frontend */}
        <TabsContent value="frontend" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Frontend Configuration</CardTitle>
              <CardDescription>
                Vite environment variables for the React frontend
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-muted/50 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                <pre className="text-xs">{`# API base URL
VITE_API_URL=https://api.codecrow.io/api

# Webhook URL (displayed in setup instructions)
VITE_WEBHOOK_URL=https://webhooks.codecrow.io

# Google OAuth Client ID (optional - enables Google Sign-In)
VITE_GOOGLE_CLIENT_ID=<your-google-client-id>.apps.googleusercontent.com

# Server port
SERVER_PORT=8080`}</pre>
              </div>
              <p className="text-sm text-muted-foreground">
                <strong>Note:</strong> The Google Client ID must match the backend configuration. 
                Google Sign-In button only appears when <code className="bg-muted px-1 py-0.5 rounded text-xs">VITE_GOOGLE_CLIENT_ID</code> is set.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SMTP */}
        <TabsContent value="smtp" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" />
                <CardTitle>SMTP Configuration</CardTitle>
              </div>
              <CardDescription>
                Email settings for 2FA, password reset, and notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-muted/50 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                <pre className="text-xs">{`# Enable/disable email
codecrow.email.enabled=true

# Sender configuration
codecrow.email.from=noreply@codecrow.io
codecrow.email.from-name=CodeCrow
codecrow.email.app-name=CodeCrow
codecrow.email.frontend-url=https://app.codecrow.io

# SMTP Server
spring.mail.host=smtp.example.com
spring.mail.port=587
spring.mail.username=<smtp-username>
spring.mail.password=<smtp-password>

# SMTP Properties
spring.mail.properties.mail.smtp.auth=true
spring.mail.properties.mail.smtp.starttls.enable=true
spring.mail.properties.mail.smtp.starttls.required=true`}</pre>
              </div>
              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <p className="text-sm">
                  For detailed provider-specific setup (Gmail, AWS SES, SendGrid, Mailgun), see the{" "}
                  <Link to="/docs/dev/smtp" className="text-primary hover:underline font-medium">
                    SMTP Setup Guide
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Configuration Files Location */}
      <Card>
        <CardHeader>
          <CardTitle>Configuration File Locations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 font-mono text-sm">
            <div className="flex items-start gap-4 p-2 rounded hover:bg-muted/30">
              <Badge variant="outline" className="shrink-0">Java</Badge>
              <code className="text-xs">deployment/config/java-shared/application.properties</code>
            </div>
            <div className="flex items-start gap-4 p-2 rounded hover:bg-muted/30">
              <Badge variant="outline" className="shrink-0">MCP</Badge>
              <code className="text-xs">deployment/config/mcp-client/.env</code>
            </div>
            <div className="flex items-start gap-4 p-2 rounded hover:bg-muted/30">
              <Badge variant="outline" className="shrink-0">RAG</Badge>
              <code className="text-xs">deployment/config/rag-pipeline/.env</code>
            </div>
            <div className="flex items-start gap-4 p-2 rounded hover:bg-muted/30">
              <Badge variant="outline" className="shrink-0">Frontend</Badge>
              <code className="text-xs">deployment/config/web-frontend/.env</code>
            </div>
            <div className="flex items-start gap-4 p-2 rounded hover:bg-muted/30">
              <Badge variant="outline" className="shrink-0">Docker</Badge>
              <code className="text-xs">deployment/docker-compose.yml</code>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Best Practices */}
      <Card className="border-amber-500/50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <CardTitle className="text-amber-600">Security Best Practices</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-amber-500">•</span>
              Never commit secrets to version control
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-500">•</span>
              Use strong, randomly generated passwords and secrets
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-500">•</span>
              Rotate JWT secrets and encryption keys regularly
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-500">•</span>
              Use environment variables in production, not config files
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-500">•</span>
              Use TLS/HTTPS for all external communication
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
