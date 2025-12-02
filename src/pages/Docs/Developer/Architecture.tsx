import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Layers, ArrowRight, Server, Database, Cpu, Globe } from "lucide-react";

export default function Architecture() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10">
            <Layers className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">System Architecture</h1>
            <p className="text-muted-foreground mt-1">
              Understand how CodeCrow components work together
            </p>
          </div>
        </div>
      </div>

      {/* Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Architecture Overview</CardTitle>
          <CardDescription>
            CodeCrow is a distributed system with multiple services working together
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-muted/30 rounded-lg p-4 font-mono text-xs overflow-x-auto">
            <pre>{`┌─────────────────────────────────────────────────────────────────┐
│                         Bitbucket Cloud                         │
└────────────────────────────┬────────────────────────────────────┘
                             │ Webhooks
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Pipeline Agent (8082)                      │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ Webhook Controller                                      │    │
│  │  - Validates requests                                   │    │
│  │  - Acquires analysis lock                               │    │
│  │  - Fetches repository data via VCS client               │    │
│  └────────────────────────────────────────────────────────┘    │
└───────┬─────────────────────────────────┬───────────────────────┘
        │                                 │
        ▼                                 ▼
┌──────────────────┐           ┌──────────────────────────┐
│  MCP Client      │           │    RAG Pipeline          │
│    (8000)        │◄──────────┤      (8001)              │
│                  │  Context  │                          │
│ ┌──────────────┐ │           │ ┌──────────────────────┐ │
│ │ Prompt Gen   │ │           │ │ Indexing Service     │ │
│ │ MCP Tools    │ │           │ │ Query Service        │ │
│ │ LLM Client   │ │           │ │ Qdrant Integration   │ │
│ └──────────────┘ │           │ └──────────────────────┘ │
└──────────────────┘           └──────────────────────────┘
        │
        ▼
┌──────────────────────────────┐
│   OpenRouter / LLM Provider  │
└──────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      Web Server (8081)                          │
│  - REST API Controllers    - Business Logic Services           │
│  - Auth, Users, Workspaces - Security Layer (JWT, Permissions) │
└───────────────────────────────────────────────────────────────┘
        │
        ▼
┌──────────────────────────────┐  ┌──────────────────────────────┐
│      PostgreSQL (5432)        │  │       Redis (6379)           │
│  - Users, Workspaces, ...     │  │  - Sessions, Cache           │
└──────────────────────────────┘  └──────────────────────────────┘

┌──────────────────────────────┐  ┌───────────────────────────────┐
│      Qdrant (6333)           │  │   Frontend (8080)             │
│  - Code embeddings           │  │  - React SPA                  │
└──────────────────────────────┘  └───────────────────────────────┘`}</pre>
          </div>
        </CardContent>
      </Card>

      {/* Core Services */}
      <Card>
        <CardHeader>
          <CardTitle>Core Services</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <div className="flex items-start gap-4 p-4 bg-muted/30 rounded-lg">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Server className="h-5 w-5 text-blue-500" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">Pipeline Agent</h3>
                  <Badge variant="outline">Port 8082</Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Receives webhooks from Bitbucket, coordinates analysis workflow, manages locks, and processes results.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-muted/30 rounded-lg">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Cpu className="h-5 w-5 text-purple-500" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">MCP Client</h3>
                  <Badge variant="outline">Port 8000</Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Generates AI prompts with RAG context, executes MCP tools, calls LLM for code analysis.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-muted/30 rounded-lg">
              <div className="p-2 rounded-lg bg-green-500/10">
                <Database className="h-5 w-5 text-green-500" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">RAG Pipeline</h3>
                  <Badge variant="outline">Port 8001</Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Indexes code repositories, performs semantic search, retrieves relevant context for analysis.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-muted/30 rounded-lg">
              <div className="p-2 rounded-lg bg-orange-500/10">
                <Globe className="h-5 w-5 text-orange-500" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">Web Server</h3>
                  <Badge variant="outline">Port 8081</Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  REST API backend for frontend, handles authentication, user management, and data access.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Component Interactions */}
      <Card>
        <CardHeader>
          <CardTitle>Component Interactions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Webhook Processing Flow */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm">1. Webhook Processing Flow</h3>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              {["Bitbucket", "Pipeline Agent", "Lock Check", "Fetch Code", "MCP Client", "AI Analysis", "Store Results"].map((step, i, arr) => (
                <div key={step} className="flex items-center gap-2">
                  <Badge variant="secondary">{step}</Badge>
                  {i < arr.length - 1 && <ArrowRight className="h-3 w-3 text-muted-foreground" />}
                </div>
              ))}
            </div>
          </div>

          {/* Branch Analysis Flow */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm">2. Branch Analysis Flow</h3>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              {["PR Merged", "Webhook", "Fetch Changes", "Query Issues", "RAG Context", "MCP Analysis", "Update Status"].map((step, i, arr) => (
                <div key={step} className="flex items-center gap-2">
                  <Badge variant="secondary">{step}</Badge>
                  {i < arr.length - 1 && <ArrowRight className="h-3 w-3 text-muted-foreground" />}
                </div>
              ))}
            </div>
          </div>

          {/* RAG Integration Flow */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm">3. RAG Integration Flow</h3>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              {["Code Files", "Chunking", "Embedding", "Qdrant Storage", "Semantic Search", "Context Retrieval"].map((step, i, arr) => (
                <div key={step} className="flex items-center gap-2">
                  <Badge variant="secondary">{step}</Badge>
                  {i < arr.length - 1 && <ArrowRight className="h-3 w-3 text-muted-foreground" />}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Infrastructure */}
      <Card>
        <CardHeader>
          <CardTitle>Infrastructure Services</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Database className="h-4 w-4 text-blue-500" />
                <h3 className="font-medium">PostgreSQL</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Port 5432 - Primary relational database for users, workspaces, projects, issues, and analyses.
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Database className="h-4 w-4 text-red-500" />
                <h3 className="font-medium">Redis</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Port 6379 - Session storage, caching, and temporary data.
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Database className="h-4 w-4 text-purple-500" />
                <h3 className="font-medium">Qdrant</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Port 6333 - Vector database for code embeddings and semantic search.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tech Stack */}
      <Card>
        <CardHeader>
          <CardTitle>Technology Stack</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="font-medium text-sm">Java Ecosystem</h3>
              <div className="flex flex-wrap gap-2">
                <Badge>Java 17</Badge>
                <Badge>Spring Boot 3.2</Badge>
                <Badge>Maven</Badge>
                <Badge>JPA/Hibernate</Badge>
                <Badge>JWT</Badge>
              </div>
            </div>
            <div className="space-y-3">
              <h3 className="font-medium text-sm">Python Ecosystem</h3>
              <div className="flex flex-wrap gap-2">
                <Badge>Python 3.10+</Badge>
                <Badge>FastAPI</Badge>
                <Badge>LangChain</Badge>
                <Badge>Pydantic</Badge>
                <Badge>HTTPX</Badge>
              </div>
            </div>
            <div className="space-y-3">
              <h3 className="font-medium text-sm">Frontend</h3>
              <div className="flex flex-wrap gap-2">
                <Badge>React 18</Badge>
                <Badge>TypeScript</Badge>
                <Badge>Vite</Badge>
                <Badge>Tailwind CSS</Badge>
                <Badge>shadcn/ui</Badge>
              </div>
            </div>
            <div className="space-y-3">
              <h3 className="font-medium text-sm">Infrastructure</h3>
              <div className="flex flex-wrap gap-2">
                <Badge>Docker</Badge>
                <Badge>Docker Compose</Badge>
                <Badge>Nginx</Badge>
                <Badge>OpenRouter</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
