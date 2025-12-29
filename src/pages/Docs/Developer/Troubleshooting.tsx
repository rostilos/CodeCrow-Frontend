import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileCode, AlertTriangle, CheckCircle, Terminal, Database, Server, Key, Wifi } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export default function Troubleshooting() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10">
            <FileCode className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Troubleshooting</h1>
            <p className="text-muted-foreground mt-1">
              Common issues and solutions for CodeCrow
            </p>
          </div>
        </div>
      </div>

      {/* Installation Issues */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Server className="h-5 w-5 text-primary" />
            <CardTitle>Installation & Setup Issues</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="docker-fail">
              <AccordionTrigger className="text-left">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  Docker Compose fails to start
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Check logs:</p>
                  <CodeBlock>{`docker compose logs <service-name>`}</CodeBlock>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Insufficient resources:</p>
                  <p className="text-sm text-muted-foreground">
                    Increase Docker memory limit in Docker Desktop: Settings → Resources → Memory (set to 8GB+)
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Port conflicts:</p>
                  <CodeBlock>{`lsof -i :8080
lsof -i :8081
# Kill conflicting processes or change ports`}</CodeBlock>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Permission issues:</p>
                  <CodeBlock>{`docker compose down
docker volume rm source_code_tmp
docker compose up -d`}</CodeBlock>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="config-missing">
              <AccordionTrigger className="text-left">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  Configuration files not found
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <p className="text-sm text-muted-foreground mb-3">
                  Ensure all config files are copied from samples:
                </p>
                <CodeBlock>{`cp deployment/config/java-shared/application.properties.sample \\
   deployment/config/java-shared/application.properties
cp deployment/config/mcp-client/.env.sample \\
   deployment/config/mcp-client/.env
cp deployment/config/rag-pipeline/.env.sample \\
   deployment/config/rag-pipeline/.env
cp deployment/config/web-frontend/.env.sample \\
   deployment/config/web-frontend/.env`}</CodeBlock>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      {/* Database Issues */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            <CardTitle>Database Issues</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="db-connection">
              <AccordionTrigger className="text-left">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  Database connection failed
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Verify PostgreSQL is running:</p>
                  <CodeBlock>{`docker ps | grep postgres
docker logs codecrow-postgres`}</CodeBlock>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Check credentials match in docker-compose.yml:</p>
                  <CodeBlock>{`postgres:
  environment:
    POSTGRES_PASSWORD: codecrow_pass

web-server:
  environment:
    SPRING_DATASOURCE_PASSWORD: codecrow_pass`}</CodeBlock>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Create database if missing:</p>
                  <CodeBlock>{`docker exec -it codecrow-postgres psql -U codecrow_user -c "CREATE DATABASE codecrow_ai;"`}</CodeBlock>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="db-schema">
              <AccordionTrigger className="text-left">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  Database schema mismatch
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <p className="text-sm text-muted-foreground mb-3">
                  ⚠️ Warning: This will reset the database and lose all data!
                </p>
                <CodeBlock>{`docker exec -it codecrow-postgres psql -U codecrow_user -c "DROP DATABASE codecrow_ai;"
docker exec -it codecrow-postgres psql -U codecrow_user -c "CREATE DATABASE codecrow_ai;"
docker compose restart web-server`}</CodeBlock>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      {/* Service Issues */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Terminal className="h-5 w-5 text-primary" />
            <CardTitle>Service-Specific Issues</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="web-server">
              <AccordionTrigger className="text-left">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  Web Server won't start
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Check health:</p>
                  <CodeBlock>{`docker logs codecrow-web-application
curl http://localhost:8081/actuator/health`}</CodeBlock>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Common issues:</p>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc ml-4">
                    <li>JWT secret not set in application.properties</li>
                    <li>Redis connection failed - check if Redis is running</li>
                    <li>Database connection failed - verify credentials</li>
                  </ul>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="analysis-stuck">
              <AccordionTrigger className="text-left">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  Analysis stuck in processing
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Check for stale locks:</p>
                  <CodeBlock>{`SELECT * FROM analysis_lock WHERE locked_at < NOW() - INTERVAL '30 minutes';

-- Remove stale locks
DELETE FROM analysis_lock WHERE locked_at < NOW() - INTERVAL '30 minutes';`}</CodeBlock>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Check MCP client connectivity:</p>
                  <CodeBlock>{`docker exec codecrow-pipeline-agent curl http://mcp-client:8000/health`}</CodeBlock>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="mcp-errors">
              <AccordionTrigger className="text-left">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  MCP Client / OpenRouter errors
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Check logs:</p>
                  <CodeBlock>{`docker logs codecrow-mcp-client`}</CodeBlock>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Verify MCP servers JAR exists:</p>
                  <CodeBlock>{`docker exec codecrow-mcp-client ls -la /app/codecrow-vcs-mcp-1.0.jar`}</CodeBlock>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Check API key:</p>
                  <CodeBlock>{`docker exec codecrow-mcp-client cat /app/.env | grep OPENROUTER_API_KEY`}</CodeBlock>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Common issues:</p>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc ml-4">
                    <li>Invalid API key - verify in OpenRouter dashboard</li>
                    <li>Rate limiting - check quota and reduce frequency</li>
                    <li>Model not available - try a different model</li>
                  </ul>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      {/* Webhook Issues */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Wifi className="h-5 w-5 text-primary" />
            <CardTitle>Webhook Issues</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="webhook-not-received">
              <AccordionTrigger className="text-left">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  Webhook not received
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Verify firewall allows Bitbucket IPs:</p>
                  <CodeBlock>{`ufw status
# Allow Bitbucket IP ranges
ufw allow from 104.192.136.0/21
ufw allow from 185.166.140.0/22`}</CodeBlock>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Check webhook configuration in Bitbucket:</p>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc ml-4">
                    <li>URL correct: https://domain.com/webhook</li>
                    <li>Events enabled: PR created, PR updated, Repo push</li>
                    <li>Token in Authorization header</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Test webhook manually:</p>
                  <CodeBlock>{`curl -X POST http://localhost:8082/api/v1/bitbucket-cloud/webhook \\
  -H "Authorization: Bearer <project-token>" \\
  -H "Content-Type: application/json" \\
  -d @sample-webhook.json`}</CodeBlock>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="webhook-401">
              <AccordionTrigger className="text-left">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  Webhook returns 401 Unauthorized
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-3">
                <ul className="text-sm text-muted-foreground space-y-2 list-disc ml-4">
                  <li>Verify project token is valid and not expired</li>
                  <li>Check Authorization header format: <code className="bg-muted px-1 rounded">Bearer &lt;token&gt;</code></li>
                  <li>Regenerate token in CodeCrow dashboard if needed</li>
                </ul>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      {/* Quick Diagnostics */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <CardTitle>Quick Diagnostics</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Run these commands to check system health:
          </p>
          <CodeBlock>{`# Check all services
docker compose ps

# View service logs
docker compose logs -f <service-name>

# Check database connection
docker exec -it codecrow-postgres psql -U codecrow_user -d codecrow_ai -c "SELECT 1;"

# Check Redis
docker exec -it codecrow-redis redis-cli ping

# Check Qdrant
curl http://localhost:6333/health

# Check service health endpoints
curl http://localhost:8081/actuator/health
curl http://localhost:8082/actuator/health
curl http://localhost:8000/health
curl http://localhost:8001/health`}</CodeBlock>
        </CardContent>
      </Card>
    </div>
  );
}

function CodeBlock({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-muted/50 rounded-lg p-4 font-mono text-xs overflow-x-auto">
      <pre className="whitespace-pre-wrap">{children}</pre>
    </div>
  );
}
