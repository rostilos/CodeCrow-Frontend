import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Server, Users, Database, Shield, Key, Mail, GitBranch, Bot, Settings, FileCode, Activity, Lock, UserCircle, Building2, CreditCard, Webhook, BarChart3 } from "lucide-react";

export default function WebServer() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-500/10">
            <Server className="h-6 w-6 text-blue-500" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Web Server</h1>
            <p className="text-muted-foreground mt-1">
              Main API server handling authentication, project management, and dashboard
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Badge variant="secondary">Java 21</Badge>
          <Badge variant="secondary">Spring Boot 3</Badge>
          <Badge variant="outline">Port 8081</Badge>
        </div>
      </div>

      {/* Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            The Web Server is the main backend API that powers the CodeCrow dashboard. It handles user authentication,
            workspace and project management, integration configuration, and serves the REST API consumed by the frontend.
          </p>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="p-4 border rounded-lg text-center">
              <Users className="h-5 w-5 mx-auto mb-2 text-primary" />
              <h4 className="font-medium text-sm">User Management</h4>
            </div>
            <div className="p-4 border rounded-lg text-center">
              <Building2 className="h-5 w-5 mx-auto mb-2 text-primary" />
              <h4 className="font-medium text-sm">Workspaces</h4>
            </div>
            <div className="p-4 border rounded-lg text-center">
              <Settings className="h-5 w-5 mx-auto mb-2 text-primary" />
              <h4 className="font-medium text-sm">Integrations</h4>
            </div>
            <div className="p-4 border rounded-lg text-center">
              <BarChart3 className="h-5 w-5 mx-auto mb-2 text-primary" />
              <h4 className="font-medium text-sm">Analytics</h4>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Source Location */}
      <Card>
        <CardHeader>
          <CardTitle>Source Location</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="p-4 bg-muted rounded-lg text-sm overflow-x-auto">
{`java-ecosystem/services/web-server/
├── src/main/java/org/rostilos/codecrow/web/
│   ├── WebServerApplication.java        # Spring Boot entry point
│   ├── controller/
│   │   ├── AuthController.java          # OAuth & JWT authentication
│   │   ├── WorkspaceController.java     # Workspace CRUD
│   │   ├── ProjectController.java       # Project management
│   │   ├── IntegrationController.java   # VCS integrations
│   │   ├── AnalysisController.java      # Analysis history & results
│   │   ├── UserController.java          # User profile & settings
│   │   └── AdminController.java         # Admin operations
│   ├── service/
│   │   ├── AuthService.java
│   │   ├── WorkspaceService.java
│   │   ├── ProjectService.java
│   │   ├── IntegrationService.java
│   │   ├── JobService.java
│   │   └── RagOperationsService.java    # RAG index management
│   ├── security/
│   │   ├── JwtTokenProvider.java
│   │   ├── OAuth2SuccessHandler.java
│   │   └── SecurityConfig.java
│   ├── entity/
│   │   └── *.java                       # JPA entities
│   └── repository/
│       └── *.java                       # Spring Data repositories
└── src/main/resources/
    ├── application.properties
    └── db/migration/                    # Flyway migrations`}
          </pre>
        </CardContent>
      </Card>

      {/* Domain Model */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Core Domain Model
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-muted/50 rounded-lg overflow-x-auto">
            <pre className="text-sm whitespace-pre">
{`┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│    User      │       │  Workspace   │       │   Project    │
├──────────────┤       ├──────────────┤       ├──────────────┤
│ id           │       │ id           │       │ id           │
│ email        │──────▶│ name         │──────▶│ name         │
│ name         │  owns │ slug         │ has   │ repoSlug     │
│ avatar       │       │ createdAt    │       │ defaultBranch│
│ provider     │       │ tier         │       │ isEnabled    │
│ providerId   │       │ ownerId      │       │ workspaceId  │
└──────────────┘       └──────────────┘       │ integrationId│
                                              └──────────────┘
                                                     │
                              ┌─────────────────────┬┘
                              │                     │
                    ┌─────────▼────────┐  ┌────────▼─────────┐
                    │   AnalysisJob    │  │  BranchPattern   │
                    ├──────────────────┤  ├──────────────────┤
                    │ id               │  │ id               │
                    │ status           │  │ pattern          │
                    │ type             │  │ isInclude        │
                    │ pullRequestId    │  │ projectId        │
                    │ result           │  └──────────────────┘
                    │ createdAt        │
                    │ completedAt      │
                    │ projectId        │
                    └──────────────────┘`}
            </pre>
          </div>
        </CardContent>
      </Card>

      {/* API Modules */}
      <Card>
        <CardHeader>
          <CardTitle>API Modules</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="auth" className="w-full">
            <TabsList className="flex flex-wrap h-auto gap-1">
              <TabsTrigger value="auth">Auth</TabsTrigger>
              <TabsTrigger value="workspace">Workspace</TabsTrigger>
              <TabsTrigger value="project">Project</TabsTrigger>
              <TabsTrigger value="integration">Integration</TabsTrigger>
              <TabsTrigger value="analysis">Analysis</TabsTrigger>
              <TabsTrigger value="rag">RAG</TabsTrigger>
            </TabsList>

            <TabsContent value="auth" className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Lock className="h-5 w-5" />
                <h4 className="font-medium">Authentication Module</h4>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Handles OAuth2 login with VCS providers and JWT session management.
              </p>
              <div className="space-y-2">
                <div className="p-3 border rounded-lg">
                  <code className="text-sm">GET /api/auth/bitbucket</code>
                  <p className="text-xs text-muted-foreground mt-1">Initiate Bitbucket OAuth flow</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <code className="text-sm">GET /api/auth/bitbucket/callback</code>
                  <p className="text-xs text-muted-foreground mt-1">OAuth callback, issues JWT</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <code className="text-sm">GET /api/auth/github</code>
                  <p className="text-xs text-muted-foreground mt-1">Initiate GitHub OAuth flow</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <code className="text-sm">POST /api/auth/refresh</code>
                  <p className="text-xs text-muted-foreground mt-1">Refresh JWT token</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <code className="text-sm">POST /api/auth/logout</code>
                  <p className="text-xs text-muted-foreground mt-1">Invalidate session</p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="workspace" className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="h-5 w-5" />
                <h4 className="font-medium">Workspace Module</h4>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Multi-tenant workspace management. Workspaces contain projects and integrations.
              </p>
              <div className="space-y-2">
                <div className="p-3 border rounded-lg">
                  <code className="text-sm">GET /api/workspaces</code>
                  <p className="text-xs text-muted-foreground mt-1">List user's workspaces</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <code className="text-sm">POST /api/workspaces</code>
                  <p className="text-xs text-muted-foreground mt-1">Create new workspace</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <code className="text-sm">GET /api/workspaces/{"{slug}"}</code>
                  <p className="text-xs text-muted-foreground mt-1">Get workspace details</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <code className="text-sm">PUT /api/workspaces/{"{slug}"}</code>
                  <p className="text-xs text-muted-foreground mt-1">Update workspace settings</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <code className="text-sm">GET /api/workspaces/{"{slug}"}/members</code>
                  <p className="text-xs text-muted-foreground mt-1">List workspace members</p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="project" className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <FileCode className="h-5 w-5" />
                <h4 className="font-medium">Project Module</h4>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Repository/project configuration including branch patterns and analysis settings.
              </p>
              <div className="space-y-2">
                <div className="p-3 border rounded-lg">
                  <code className="text-sm">GET /api/workspaces/{"{slug}"}/projects</code>
                  <p className="text-xs text-muted-foreground mt-1">List workspace projects</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <code className="text-sm">POST /api/workspaces/{"{slug}"}/projects</code>
                  <p className="text-xs text-muted-foreground mt-1">Add project from repository</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <code className="text-sm">GET /api/projects/{"{id}"}/settings</code>
                  <p className="text-xs text-muted-foreground mt-1">Get project configuration</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <code className="text-sm">PUT /api/projects/{"{id}"}/branch-patterns</code>
                  <p className="text-xs text-muted-foreground mt-1">Configure branch include/exclude patterns</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <code className="text-sm">PUT /api/projects/{"{id}"}/file-filters</code>
                  <p className="text-xs text-muted-foreground mt-1">Configure file include/exclude patterns</p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="integration" className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Webhook className="h-5 w-5" />
                <h4 className="font-medium">Integration Module</h4>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                VCS platform connections. Stores OAuth tokens and manages repository access.
              </p>
              <div className="space-y-2">
                <div className="p-3 border rounded-lg">
                  <code className="text-sm">GET /api/workspaces/{"{slug}"}/integrations</code>
                  <p className="text-xs text-muted-foreground mt-1">List connected integrations</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <code className="text-sm">POST /api/workspaces/{"{slug}"}/integrations/bitbucket</code>
                  <p className="text-xs text-muted-foreground mt-1">Connect Bitbucket workspace</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <code className="text-sm">GET /api/integrations/{"{id}"}/repositories</code>
                  <p className="text-xs text-muted-foreground mt-1">List repositories from integration</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <code className="text-sm">DELETE /api/integrations/{"{id}"}</code>
                  <p className="text-xs text-muted-foreground mt-1">Disconnect integration</p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="analysis" className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="h-5 w-5" />
                <h4 className="font-medium">Analysis Module</h4>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Analysis job history, results viewing, and manual analysis triggers.
              </p>
              <div className="space-y-2">
                <div className="p-3 border rounded-lg">
                  <code className="text-sm">GET /api/projects/{"{id}"}/analyses</code>
                  <p className="text-xs text-muted-foreground mt-1">List analysis history for project</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <code className="text-sm">GET /api/analyses/{"{jobId}"}</code>
                  <p className="text-xs text-muted-foreground mt-1">Get analysis details and result</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <code className="text-sm">POST /api/projects/{"{id}"}/analyze</code>
                  <p className="text-xs text-muted-foreground mt-1">Trigger manual PR analysis</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <code className="text-sm">GET /api/analyses/{"{jobId}"}/comments</code>
                  <p className="text-xs text-muted-foreground mt-1">Get analysis comments</p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="rag" className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Bot className="h-5 w-5" />
                <h4 className="font-medium">RAG Operations Module</h4>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Manage RAG index state, trigger reindexing, and view index statistics.
              </p>
              <div className="space-y-2">
                <div className="p-3 border rounded-lg">
                  <code className="text-sm">GET /api/projects/{"{id}"}/rag/status</code>
                  <p className="text-xs text-muted-foreground mt-1">Get RAG index status (chunks, last indexed)</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <code className="text-sm">POST /api/projects/{"{id}"}/rag/index</code>
                  <p className="text-xs text-muted-foreground mt-1">Trigger branch indexing</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <code className="text-sm">DELETE /api/projects/{"{id}"}/rag/index</code>
                  <p className="text-xs text-muted-foreground mt-1">Delete RAG index</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <code className="text-sm">GET /api/rag/search</code>
                  <p className="text-xs text-muted-foreground mt-1">Search indexed code (debug endpoint)</p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <pre className="p-4 bg-muted rounded-lg text-xs overflow-x-auto">
{`@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        return http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable())  // Stateless JWT
            .sessionManagement(session -> 
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // Public endpoints
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/actuator/health").permitAll()
                .requestMatchers("/connect/**").permitAll()  // Bitbucket Connect
                
                // Webhook endpoints (validated by signature)
                .requestMatchers("/api/v1/pipeline/webhook/**").permitAll()
                
                // All other endpoints require authentication
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
            .build();
    }
    
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}`}
          </pre>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">JWT Token</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Algorithm: HS512</li>
                <li>• Expiry: 24 hours (configurable)</li>
                <li>• Contains: userId, email, workspaceIds</li>
                <li>• Stored in: HTTP-only cookie + header</li>
              </ul>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Data Encryption</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• OAuth tokens: AES-256 encrypted</li>
                <li>• API keys: Hashed (irreversible)</li>
                <li>• Passwords: BCrypt (12 rounds)</li>
                <li>• Transit: TLS 1.3 required</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Database Migrations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Database Migrations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Uses Flyway for schema migrations. Migrations are versioned and run automatically on startup.
          </p>
          <pre className="p-4 bg-muted rounded-lg text-sm">
{`src/main/resources/db/migration/
├── V1__initial_schema.sql
├── V2__add_workspaces.sql
├── V3__add_integrations.sql
├── V4__add_analysis_jobs.sql
├── V5__add_branch_patterns.sql
├── V6__add_quality_gates.sql
├── V7__add_rag_indexes.sql
└── V8__add_comment_commands.sql`}
          </pre>
          <div className="p-4 border rounded-lg">
            <h4 className="font-medium mb-2">Migration Best Practices</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Never modify existing migrations</li>
              <li>• Use repeatable migrations (R__) for views/functions</li>
              <li>• Test rollback scenarios locally</li>
              <li>• Add indexes in separate migrations</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Key Configuration Properties</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Property</th>
                  <th className="text-left p-2">Description</th>
                </tr>
              </thead>
              <tbody className="font-mono text-xs">
                <tr className="border-b">
                  <td className="p-2">server.port</td>
                  <td className="p-2 font-sans">HTTP server port (default: 8081)</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2">spring.datasource.*</td>
                  <td className="p-2 font-sans">PostgreSQL connection settings</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2">codecrow.security.jwt.secret</td>
                  <td className="p-2 font-sans">JWT signing key (min 64 chars base64)</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2">codecrow.security.encryption.key</td>
                  <td className="p-2 font-sans">AES key for token encryption</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2">codecrow.vcs.bitbucket.oauth.*</td>
                  <td className="p-2 font-sans">Bitbucket OAuth consumer credentials</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2">codecrow.rag.api.url</td>
                  <td className="p-2 font-sans">RAG Pipeline service URL</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2">spring.mail.*</td>
                  <td className="p-2 font-sans">SMTP email configuration</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Health & Monitoring */}
      <Card>
        <CardHeader>
          <CardTitle>Health & Monitoring</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Spring Boot Actuator endpoints for monitoring and health checks.
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Actuator Endpoints</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• <code>/actuator/health</code> - Service health</li>
                <li>• <code>/actuator/info</code> - Build info</li>
                <li>• <code>/actuator/metrics</code> - Metrics</li>
                <li>• <code>/actuator/prometheus</code> - Prometheus format</li>
              </ul>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Health Indicators</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Database connectivity</li>
                <li>• Redis connectivity</li>
                <li>• RAG Pipeline availability</li>
                <li>• Disk space</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
