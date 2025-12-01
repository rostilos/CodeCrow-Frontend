import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Settings, Server, Database, Shield, Key } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
        <TabsList className="grid w-full grid-cols-4 h-auto">
          <TabsTrigger value="java" className="py-2">Java Services</TabsTrigger>
          <TabsTrigger value="mcp" className="py-2">MCP Client</TabsTrigger>
          <TabsTrigger value="rag" className="py-2">RAG Pipeline</TabsTrigger>
          <TabsTrigger value="frontend" className="py-2">Frontend</TabsTrigger>
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
codecrow.security.jwtExpirationMs=86400000
codecrow.security.projectJwtExpirationMs=7776000000

# Encryption key for sensitive data (API keys, passwords)
codecrow.security.encryption-key=<256-bit-base64-key>`}</pre>
                </div>
                <p className="text-sm text-muted-foreground">
                  Generate secrets using: <code className="bg-muted px-1.5 py-0.5 rounded text-xs">openssl rand -base64 32</code>
                </p>
              </div>

              {/* Service URLs */}
              <div className="space-y-3">
                <h3 className="font-semibold">Service URLs</h3>
                <div className="bg-muted/50 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                  <pre className="text-xs">{`# Web server base URL (for external links)
codecrow.web.base.url=https://codecrow.example.com

# MCP client endpoint
codecrow.mcp.client.url=http://mcp-client:8000/review

# RAG pipeline endpoint
codecrow.rag.api.url=http://rag-pipeline:8001`}</pre>
                </div>
              </div>

              {/* Redis */}
              <div className="space-y-3">
                <h3 className="font-semibold">Redis Configuration</h3>
                <div className="bg-muted/50 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                  <pre className="text-xs">{`spring.redis.host=localhost
spring.redis.port=6379
spring.data.redis.repositories.enabled=false`}</pre>
                </div>
              </div>

              {/* Bitbucket App */}
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  Bitbucket Cloud App
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
                  Create an OAuth consumer at Bitbucket Settings → OAuth consumers with callback URL:{" "}
                  <code className="bg-muted px-1 py-0.5 rounded">
                    {"${codecrow.web.base.url}"}/api/integrations/bitbucket-cloud/app/callback
                  </code>
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
                  <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    Google Cloud Console
                  </a>
                  . Add your frontend URL to authorized JavaScript origins.
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
                <Key className="h-5 w-5 text-primary" />
                <CardTitle>MCP Client Configuration</CardTitle>
              </div>
              <CardDescription>
                Environment variables for the Python MCP client
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <h3 className="font-semibold">Required Settings</h3>
                <div className="bg-muted/50 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                  <pre className="text-xs">{`# Service port
AI_CLIENT_PORT=8000

# RAG Integration
RAG_ENABLED=true
RAG_API_URL=http://localhost:8001

# OpenRouter (optional - can use from AI connection config)
OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_MODEL=anthropic/claude-3.5-sonnet`}</pre>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold">Optional Settings</h3>
                <div className="bg-muted/50 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                  <pre className="text-xs">{`# Logging level
LOG_LEVEL=INFO

# Request timeouts
REQUEST_TIMEOUT=300

# Max tokens for LLM response
MAX_TOKENS=4096`}</pre>
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
              <div className="space-y-3">
                <h3 className="font-semibold">Required Settings</h3>
                <div className="bg-muted/50 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                  <pre className="text-xs">{`# OpenRouter API key for embeddings
OPENROUTER_API_KEY=sk-or-v1-...

# Qdrant vector database
QDRANT_URL=http://qdrant:6333

# Service port
RAG_PORT=8001`}</pre>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold">Indexing Settings</h3>
                <div className="bg-muted/50 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                  <pre className="text-xs">{`# Chunk sizes for code and text
CODE_CHUNK_SIZE=800
TEXT_CHUNK_SIZE=1000

# Embedding model
EMBEDDING_MODEL=text-embedding-3-small

# Top-K results for retrieval
TOP_K_RESULTS=10`}</pre>
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
VITE_API_URL=https://codecrow.example.com/api

# Webhook URL for Bitbucket configuration
VITE_WEBHOOK_URL=https://codecrow.example.com/webhook

# Google OAuth Client ID (optional - enables Google Sign-In)
VITE_GOOGLE_CLIENT_ID=<your-google-client-id>.apps.googleusercontent.com`}</pre>
              </div>
              <p className="text-sm text-muted-foreground">
                <strong>Note:</strong> The Google Client ID must match the backend configuration. 
                Google Sign-In button only appears when <code className="bg-muted px-1 py-0.5 rounded text-xs">VITE_GOOGLE_CLIENT_ID</code> is set.
              </p>
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
          <CardTitle className="text-amber-600">Security Best Practices</CardTitle>
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
              Restrict Bitbucket IP ranges for webhook endpoints
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
