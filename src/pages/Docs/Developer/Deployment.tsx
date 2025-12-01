import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Server, CheckCircle, Terminal, Shield, Settings, Box, Globe } from "lucide-react";

export default function Deployment() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10">
            <Server className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Deployment</h1>
            <p className="text-muted-foreground mt-1">
              Production deployment guide for CodeCrow
            </p>
          </div>
        </div>
      </div>

      {/* Prerequisites */}
      <Card>
        <CardHeader>
          <CardTitle>Prerequisites</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="font-medium text-sm">Server Requirements</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Linux server (Ubuntu 20.04+)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Docker 20.10+
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Docker Compose v2.0+
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  8GB+ RAM
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  4+ CPU cores
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  100GB+ disk space
                </li>
              </ul>
            </div>
            <div className="space-y-3">
              <h3 className="font-medium text-sm">External Requirements</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Domain name with DNS configured
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  SSL certificate (Let's Encrypt)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  OpenRouter API key
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Bitbucket workspace access
                </li>
                <li className="flex items-center gap-2 text-muted-foreground">
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                  Google OAuth Client ID (optional - for social login)
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Installation Steps */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Terminal className="h-5 w-5 text-primary" />
            <CardTitle>Installation Steps</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step 1 */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge className="h-6 w-6 rounded-full flex items-center justify-center">1</Badge>
              <h3 className="font-medium">Clone Repository</h3>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 ml-8 font-mono text-sm">
              <pre className="text-xs">{`git clone <repository-url> /opt/codecrow
cd /opt/codecrow`}</pre>
            </div>
          </div>

          {/* Step 2 */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge className="h-6 w-6 rounded-full flex items-center justify-center">2</Badge>
              <h3 className="font-medium">Copy Configuration Files</h3>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 ml-8 font-mono text-sm">
              <pre className="text-xs">{`cp deployment/docker-compose-sample.yml deployment/docker-compose.yml
cp deployment/config/java-shared/application.properties.sample \\
   deployment/config/java-shared/application.properties
cp deployment/config/mcp-client/.env.sample deployment/config/mcp-client/.env
cp deployment/config/rag-pipeline/.env.sample deployment/config/rag-pipeline/.env
cp deployment/config/web-frontend/.env.sample deployment/config/web-frontend/.env`}</pre>
            </div>
          </div>

          {/* Step 3 */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge className="h-6 w-6 rounded-full flex items-center justify-center">3</Badge>
              <h3 className="font-medium">Generate Secrets</h3>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 ml-8 font-mono text-sm">
              <pre className="text-xs">{`# Generate JWT secret (256-bit)
JWT_SECRET=$(openssl rand -base64 32)
echo "JWT Secret: $JWT_SECRET"

# Generate encryption key
ENCRYPTION_KEY=$(openssl rand -base64 32)
echo "Encryption Key: $ENCRYPTION_KEY"

# Generate database password
DB_PASSWORD=$(openssl rand -base64 24)
echo "Database Password: $DB_PASSWORD"`}</pre>
            </div>
            <p className="text-sm text-muted-foreground ml-8">
              ⚠️ Store these secrets securely - you'll need them for configuration.
            </p>
          </div>

          {/* Step 4 */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge className="h-6 w-6 rounded-full flex items-center justify-center">4</Badge>
              <h3 className="font-medium">Update Configuration</h3>
            </div>
            <p className="text-sm text-muted-foreground ml-8">
              Update the configuration files with your generated secrets and settings.
              See the <a href="/docs/dev/configuration" className="text-primary hover:underline">Configuration</a> page for details.
            </p>
          </div>

          {/* Step 5 */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge className="h-6 w-6 rounded-full flex items-center justify-center">5</Badge>
              <h3 className="font-medium">Build and Start Services</h3>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 ml-8 font-mono text-sm">
              <pre className="text-xs">{`cd /opt/codecrow
./tools/production-build.sh`}</pre>
            </div>
          </div>

          {/* Step 6 */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge className="h-6 w-6 rounded-full flex items-center justify-center">6</Badge>
              <h3 className="font-medium">Verify Services</h3>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 ml-8 font-mono text-sm">
              <pre className="text-xs">{`cd deployment
docker compose ps
# All services should show status "Up (healthy)"

# Check logs
docker compose logs -f web-server
docker compose logs -f pipeline-agent`}</pre>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Nginx Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            <CardTitle>Reverse Proxy Setup</CardTitle>
          </div>
          <CardDescription>Nginx configuration for production</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-muted/50 rounded-lg p-4 font-mono text-xs overflow-x-auto">
            <pre>{`server {
    listen 443 ssl http2;
    server_name codecrow.example.com;

    ssl_certificate /etc/letsencrypt/live/codecrow.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/codecrow.example.com/privkey.pem;

    # Frontend
    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # API
    location /api {
        proxy_pass http://localhost:8081;
        proxy_read_timeout 300s;
    }

    # Webhooks (restrict to Bitbucket IPs)
    location /webhook {
        allow 104.192.136.0/21;
        allow 185.166.140.0/22;
        deny all;
        proxy_pass http://localhost:8082;
        proxy_read_timeout 600s;
    }
}`}</pre>
          </div>
        </CardContent>
      </Card>

      {/* Docker Services */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Box className="h-5 w-5 text-primary" />
            <CardTitle>Docker Services</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            <ServiceRow name="frontend" port="8080" description="React SPA" />
            <ServiceRow name="web-server" port="8081" description="REST API backend" />
            <ServiceRow name="pipeline-agent" port="8082" description="Webhook handler" />
            <ServiceRow name="mcp-client" port="8000" description="AI analysis" />
            <ServiceRow name="rag-pipeline" port="8001" description="Code indexing" />
            <ServiceRow name="postgres" port="5432" description="Database" />
            <ServiceRow name="redis" port="6379" description="Cache" />
            <ServiceRow name="qdrant" port="6333" description="Vector DB" />
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <Card className="border-amber-500/50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-amber-500" />
            <CardTitle className="text-amber-600">Security Checklist</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-amber-500" />
              Use HTTPS with valid SSL certificates
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-amber-500" />
              Restrict webhook endpoint to Bitbucket IP ranges
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-amber-500" />
              Use strong, randomly generated secrets
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-amber-500" />
              Enable firewall (only expose ports 80, 443)
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-amber-500" />
              Regular backups of PostgreSQL database
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-amber-500" />
              Monitor service health and logs
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

function ServiceRow({ name, port, description }: { name: string; port: string; description: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
      <div className="flex items-center gap-3">
        <code className="text-sm font-medium">{name}</code>
        <Badge variant="outline" className="text-xs">{port}</Badge>
      </div>
      <span className="text-sm text-muted-foreground">{description}</span>
    </div>
  );
}
