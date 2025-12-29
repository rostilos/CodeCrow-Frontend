import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Code2, FolderTree, Coffee, Braces, Globe, FileCode } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Modules() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10">
            <Code2 className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Modules</h1>
            <p className="text-muted-foreground mt-1">
              Overview of CodeCrow ecosystem modules
            </p>
          </div>
        </div>
      </div>

      {/* Module Tabs */}
      <Tabs defaultValue="java" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 h-auto">
          <TabsTrigger value="java" className="py-2">
            <Coffee className="h-4 w-4 mr-2" />
            Java Ecosystem
          </TabsTrigger>
          <TabsTrigger value="python" className="py-2">
            <Braces className="h-4 w-4 mr-2" />
            Python Ecosystem
          </TabsTrigger>
          <TabsTrigger value="frontend" className="py-2">
            <Globe className="h-4 w-4 mr-2" />
            Frontend
          </TabsTrigger>
        </TabsList>

        {/* Java Ecosystem */}
        <TabsContent value="java" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Java Ecosystem</CardTitle>
              <CardDescription>
                Multi-module Maven project with shared libraries and runnable services
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Project Structure */}
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <FolderTree className="h-4 w-4" />
                  Project Structure
                </h3>
                <div className="bg-muted/50 rounded-lg p-4 font-mono text-xs">
                  <pre>{`java-ecosystem/
├── pom.xml                    # Parent POM
├── libs/                      # Shared libraries
│   ├── core/                  # Core models and persistence
│   ├── security/              # Security utilities
│   └── vcs-client/            # VCS API client
├── services/                  # Runnable applications
│   ├── pipeline-agent/        # Analysis processing engine
│   └── web-server/            # REST API backend
└── mcp-servers/               # MCP server implementations
    └── vcs-mcp/         # Bitbucket MCP tools`}</pre>
                </div>
              </div>

              {/* Shared Libraries */}
              <div className="grid gap-4">
                <LibraryCard
                  name="codecrow-core"
                  description="Core domain models, JPA entities, repositories, and common services"
                  packages={["model/", "dto/", "persistence/", "service/", "utils/"]}
                  badge="Library"
                />
                <LibraryCard
                  name="codecrow-security"
                  description="JWT authentication, password encryption, role-based access control"
                  packages={["JwtTokenProvider", "JwtAuthenticationFilter", "EncryptionUtil"]}
                  badge="Security"
                />
                <LibraryCard
                  name="codecrow-vcs-client"
                  description="VCS API client with support for Bitbucket Cloud, token refresh, and Code Insights"
                  packages={["VcsClientProvider", "BitbucketCloudClient", "VcsRepoInfo", "HttpAuthorizedClientFactory"]}
                  badge="Integration"
                />
              </div>

              {/* Services */}
              <div className="space-y-3">
                <h3 className="font-semibold">Services</h3>
                <div className="grid gap-4">
                  <ServiceCard
                    name="pipeline-agent"
                    port="8082"
                    description="Receives webhooks, coordinates analysis workflow, manages locks"
                    responsibilities={[
                      "Receive and validate Bitbucket webhooks",
                      "Coordinate analysis workflow",
                      "Manage analysis locks",
                      "Process and store results"
                    ]}
                  />
                  <ServiceCard
                    name="web-server"
                    port="8081"
                    description="REST API backend for the frontend application"
                    responsibilities={[
                      "User authentication and authorization",
                      "Workspace and project management",
                      "Analysis and issue retrieval",
                      "VCS and AI connection management"
                    ]}
                  />
                </div>
              </div>

              {/* Tech Stack */}
              <div className="flex flex-wrap gap-2">
                <Badge>Java 17</Badge>
                <Badge>Spring Boot 3.2</Badge>
                <Badge>Maven</Badge>
                <Badge>JPA/Hibernate</Badge>
                <Badge>Lombok</Badge>
                <Badge>JWT</Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Python Ecosystem */}
        <TabsContent value="python" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Python Ecosystem</CardTitle>
              <CardDescription>
                FastAPI services for AI analysis and RAG pipeline
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Project Structure */}
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <FolderTree className="h-4 w-4" />
                  Project Structure
                </h3>
                <div className="bg-muted/50 rounded-lg p-4 font-mono text-xs">
                  <pre>{`python-ecosystem/
├── mcp-client/               # MCP client service
│   ├── main.py              # FastAPI application
│   ├── codecrow-vcs-mcp-1.0.jar
│   ├── llm/                 # LLM integration
│   ├── model/               # Data models
│   ├── server/              # MCP server management
│   └── service/             # Business logic
└── rag-pipeline/            # RAG service
    ├── main.py              # FastAPI application
    └── src/
        ├── api/             # API routes
        ├── core/            # Core functionality
        ├── models/          # Data models
        └── services/        # RAG services`}</pre>
                </div>
              </div>

              {/* Services */}
              <div className="grid gap-4">
                <ServiceCard
                  name="mcp-client"
                  port="8000"
                  description="Modified MCP client for code analysis with LLM integration"
                  responsibilities={[
                    "Receive analysis requests from pipeline-agent",
                    "Query RAG for relevant context",
                    "Generate AI prompts",
                    "Execute MCP tools",
                    "Call OpenRouter LLM"
                  ]}
                />
                <ServiceCard
                  name="rag-pipeline"
                  port="8001"
                  description="Retrieval-Augmented Generation for code context"
                  responsibilities={[
                    "Index repository code files",
                    "Generate embeddings via OpenRouter",
                    "Store vectors in Qdrant",
                    "Semantic search for context retrieval"
                  ]}
                />
              </div>

              {/* Tech Stack */}
              <div className="flex flex-wrap gap-2">
                <Badge>Python 3.10+</Badge>
                <Badge>FastAPI</Badge>
                <Badge>Uvicorn</Badge>
                <Badge>LangChain</Badge>
                <Badge>Pydantic</Badge>
                <Badge>HTTPX</Badge>
                <Badge>Qdrant</Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Frontend */}
        <TabsContent value="frontend" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Frontend</CardTitle>
              <CardDescription>
                React SPA with TypeScript and modern tooling
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Project Structure */}
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <FolderTree className="h-4 w-4" />
                  Project Structure
                </h3>
                <div className="bg-muted/50 rounded-lg p-4 font-mono text-xs">
                  <pre>{`frontend/
├── src/
│   ├── api_service/         # API client and hooks
│   ├── components/          # Reusable UI components
│   ├── context/             # React context providers
│   ├── hooks/               # Custom React hooks
│   ├── lib/                 # Utilities
│   └── pages/               # Page components
│       ├── Dashboard/
│       ├── Docs/
│       ├── Analysis/
│       └── ...
├── public/                  # Static assets
├── index.html
├── vite.config.ts
└── tailwind.config.ts`}</pre>
                </div>
              </div>

              {/* Key Features */}
              <div className="space-y-3">
                <h3 className="font-semibold">Key Features</h3>
                <ul className="grid gap-2 text-sm">
                  <li className="flex items-start gap-2">
                    <FileCode className="h-4 w-4 mt-0.5 text-primary" />
                    <span>Workspace and project management dashboard</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <FileCode className="h-4 w-4 mt-0.5 text-primary" />
                    <span>Code analysis visualization with issue breakdown</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <FileCode className="h-4 w-4 mt-0.5 text-primary" />
                    <span>VCS and AI connection configuration</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <FileCode className="h-4 w-4 mt-0.5 text-primary" />
                    <span>User authentication and authorization</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <FileCode className="h-4 w-4 mt-0.5 text-primary" />
                    <span>Interactive documentation</span>
                  </li>
                </ul>
              </div>

              {/* Tech Stack */}
              <div className="flex flex-wrap gap-2">
                <Badge>React 18</Badge>
                <Badge>TypeScript</Badge>
                <Badge>Vite</Badge>
                <Badge>Tailwind CSS</Badge>
                <Badge>shadcn/ui</Badge>
                <Badge>React Router</Badge>
                <Badge>React Query</Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface LibraryCardProps {
  name: string;
  description: string;
  packages: string[];
  badge: string;
}

function LibraryCard({ name, description, packages, badge }: LibraryCardProps) {
  return (
    <div className="p-4 border rounded-lg">
      <div className="flex items-center gap-2 mb-2">
        <h4 className="font-medium">{name}</h4>
        <Badge variant="secondary" className="text-xs">{badge}</Badge>
      </div>
      <p className="text-sm text-muted-foreground mb-3">{description}</p>
      <div className="flex flex-wrap gap-1">
        {packages.map((pkg) => (
          <code key={pkg} className="text-xs bg-muted px-1.5 py-0.5 rounded">{pkg}</code>
        ))}
      </div>
    </div>
  );
}

interface ServiceCardProps {
  name: string;
  port: string;
  description: string;
  responsibilities: string[];
}

function ServiceCard({ name, port, description, responsibilities }: ServiceCardProps) {
  return (
    <div className="p-4 border rounded-lg">
      <div className="flex items-center gap-2 mb-2">
        <h4 className="font-medium">{name}</h4>
        <Badge variant="outline">Port {port}</Badge>
      </div>
      <p className="text-sm text-muted-foreground mb-3">{description}</p>
      <ul className="text-sm space-y-1">
        {responsibilities.map((r, i) => (
          <li key={i} className="flex items-start gap-2 text-muted-foreground">
            <span className="text-primary">•</span>
            {r}
          </li>
        ))}
      </ul>
    </div>
  );
}
