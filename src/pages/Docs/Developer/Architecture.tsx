import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Layers, ArrowRight, ArrowDown, Server, Database, Cpu, Globe, GitBranch, Bot, Search, FileCode, Lock, Zap, Brain, Package } from "lucide-react";

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

      {/* High-Level Flow */}
      <Card>
        <CardHeader>
          <CardTitle>High-Level Data Flow</CardTitle>
          <CardDescription>
            VCS platforms trigger analysis through webhooks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Flow Diagram */}
            <div className="flex flex-col items-center gap-2 py-4">
              {/* Row 1: VCS Platforms */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <GitBranch className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">VCS Platform</span>
                </div>
                <span className="text-xs text-muted-foreground">(Bitbucket, GitHub, GitLab)</span>
              </div>
              
              <ArrowDown className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Webhook (PR opened, comment, push)</span>
              
              {/* Row 2: Pipeline Agent */}
              <div className="flex items-center gap-2 px-4 py-2 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                <Server className="h-4 w-4 text-orange-500" />
                <span className="text-sm font-medium">Pipeline Agent</span>
                <Badge variant="outline" className="text-[10px]">:8082</Badge>
              </div>
              
              <ArrowDown className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Acquire lock → Fetch code → Create archive</span>
              
              {/* Row 3: MCP Client + RAG */}
              <div className="flex items-center gap-6">
                <div className="flex flex-col items-center gap-2">
                  <div className="flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                    <Bot className="h-4 w-4 text-purple-500" />
                    <span className="text-sm font-medium">MCP Client</span>
                    <Badge variant="outline" className="text-[10px]">:8000</Badge>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <Brain className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">RAG Pipeline</span>
                  <Badge variant="outline" className="text-[10px]">:8001</Badge>
                </div>
              </div>
              
              <ArrowDown className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Build prompt with RAG context → Call LLM</span>
              
              {/* Row 4: LLM */}
              <div className="flex items-center gap-2 px-4 py-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <Zap className="h-4 w-4 text-yellow-500" />
                <span className="text-sm font-medium">LLM Provider</span>
                <span className="text-xs text-muted-foreground">(OpenRouter)</span>
              </div>
              
              <ArrowDown className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Analysis results</span>
              
              {/* Row 5: Back to VCS */}
              <div className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <GitBranch className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">Post Comments to VCS</span>
              </div>
            </div>
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
            {/* Pipeline Agent */}
            <div className="flex items-start gap-4 p-4 bg-orange-500/5 border border-orange-500/20 rounded-lg">
              <div className="p-2 rounded-lg bg-orange-500/10">
                <Server className="h-5 w-5 text-orange-500" />
              </div>
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">Pipeline Agent</h3>
                  <Badge variant="outline">Port 8082</Badge>
                  <Badge variant="secondary" className="text-[10px]">Java / Spring Boot</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Central orchestrator that receives webhooks, manages analysis locks, and coordinates the review workflow.
                </p>
                <div className="space-y-2 text-sm">
                  <p className="font-medium">Key Responsibilities:</p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1">
                    <li><span className="font-medium text-foreground">Webhook Processing</span> — Receives events from Bitbucket, GitHub, GitLab</li>
                    <li><span className="font-medium text-foreground">Lock Mechanism</span> — Redis-based locks prevent concurrent analysis on same PR</li>
                    <li><span className="font-medium text-foreground">Code Fetching</span> — Uses VCS-Client library to fetch diffs and file contents</li>
                    <li><span className="font-medium text-foreground">Archive Creation</span> — Packages code into archive for MCP Client</li>
                    <li><span className="font-medium text-foreground">Result Processing</span> — Stores issues in DB, posts comments to VCS</li>
                  </ul>
                </div>
                <div className="flex items-center gap-2 p-2 bg-muted/50 rounded text-xs">
                  <Lock className="h-3 w-3" />
                  <span><strong>Lock Strategy:</strong> 30min timeout, auto-cleanup, wait queue with 5s retry</span>
                </div>
              </div>
            </div>

            {/* MCP Client */}
            <div className="flex items-start gap-4 p-4 bg-purple-500/5 border border-purple-500/20 rounded-lg">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Bot className="h-5 w-5 text-purple-500" />
              </div>
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">MCP Client</h3>
                  <Badge variant="outline">Port 8000</Badge>
                  <Badge variant="secondary" className="text-[10px]">Python / FastAPI</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  AI analysis engine that builds MCP agents, retrieves RAG context, and generates code review comments.
                </p>
                <div className="space-y-2 text-sm">
                  <p className="font-medium">Key Responsibilities:</p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1">
                    <li><span className="font-medium text-foreground">MCP Agent Building</span> — Creates agent with filesystem tools for code exploration</li>
                    <li><span className="font-medium text-foreground">RAG Integration</span> — Queries RAG Pipeline for semantic context about changed files</li>
                    <li><span className="font-medium text-foreground">Prompt Construction</span> — Builds structured prompt with diff, context, and guidelines</li>
                    <li><span className="font-medium text-foreground">LLM Communication</span> — Calls OpenRouter/OpenAI with streaming support</li>
                    <li><span className="font-medium text-foreground">Response Parsing</span> — Extracts structured issues from LLM response</li>
                  </ul>
                </div>
                <div className="flex items-center gap-2 p-2 bg-muted/50 rounded text-xs">
                  <Package className="h-3 w-3" />
                  <span><strong>MCP Servers:</strong> codecrow-platform-mcp (file ops), codecrow-vcs-mcp (git ops)</span>
                </div>
              </div>
            </div>

            {/* RAG Pipeline */}
            <div className="flex items-start gap-4 p-4 bg-green-500/5 border border-green-500/20 rounded-lg">
              <div className="p-2 rounded-lg bg-green-500/10">
                <Brain className="h-5 w-5 text-green-500" />
              </div>
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">RAG Pipeline</h3>
                  <Badge variant="outline">Port 8001</Badge>
                  <Badge variant="secondary" className="text-[10px]">Python / FastAPI</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Retrieval-Augmented Generation service that indexes codebases and provides semantic search for context retrieval.
                </p>
                <div className="space-y-2 text-sm">
                  <p className="font-medium">Key Responsibilities:</p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1">
                    <li><span className="font-medium text-foreground">AST-Based Chunking</span> — Uses tree-sitter to split code by semantic units (functions, classes)</li>
                    <li><span className="font-medium text-foreground">Embedding Generation</span> — Creates vector embeddings via OpenRouter embedding models</li>
                    <li><span className="font-medium text-foreground">Vector Storage</span> — Stores embeddings in Qdrant with metadata</li>
                    <li><span className="font-medium text-foreground">Semantic Search</span> — Finds relevant code chunks based on query similarity</li>
                    <li><span className="font-medium text-foreground">Reranking</span> — Uses cross-encoder or LLM to reorder results by relevance</li>
                  </ul>
                </div>
                <div className="flex items-center gap-2 p-2 bg-muted/50 rounded text-xs">
                  <Search className="h-3 w-3" />
                  <span><strong>Chunking:</strong> 800 tokens with 200 overlap, AST-aware boundaries</span>
                </div>
              </div>
            </div>

            {/* Web Server */}
            <div className="flex items-start gap-4 p-4 bg-blue-500/5 border border-blue-500/20 rounded-lg">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Globe className="h-5 w-5 text-blue-500" />
              </div>
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">Web Server</h3>
                  <Badge variant="outline">Port 8081</Badge>
                  <Badge variant="secondary" className="text-[10px]">Java / Spring Boot</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  REST API backend for the frontend application, handling authentication, user management, and data access.
                </p>
                <div className="space-y-2 text-sm">
                  <p className="font-medium">Key Responsibilities:</p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1">
                    <li><span className="font-medium text-foreground">Authentication</span> — JWT-based auth with refresh tokens, Google OAuth</li>
                    <li><span className="font-medium text-foreground">User Management</span> — Registration, 2FA, password reset via email</li>
                    <li><span className="font-medium text-foreground">Workspace/Project CRUD</span> — Full management of organizations and projects</li>
                    <li><span className="font-medium text-foreground">VCS Integration</span> — OAuth flows for Bitbucket, GitHub, GitLab</li>
                    <li><span className="font-medium text-foreground">Analysis Data</span> — Serves issues, PRs, branches to frontend</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Frontend */}
            <div className="flex items-start gap-4 p-4 bg-cyan-500/5 border border-cyan-500/20 rounded-lg">
              <div className="p-2 rounded-lg bg-cyan-500/10">
                <FileCode className="h-5 w-5 text-cyan-500" />
              </div>
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">Frontend</h3>
                  <Badge variant="outline">Port 8080</Badge>
                  <Badge variant="secondary" className="text-[10px]">React / TypeScript</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Single-page application for managing workspaces, projects, viewing analysis results, and configuration.
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge variant="outline" className="text-[10px]">Vite</Badge>
                  <Badge variant="outline" className="text-[10px]">Tailwind CSS</Badge>
                  <Badge variant="outline" className="text-[10px]">shadcn/ui</Badge>
                  <Badge variant="outline" className="text-[10px]">React Router</Badge>
                  <Badge variant="outline" className="text-[10px]">TanStack Query</Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analysis Flow Details */}
      <Card>
        <CardHeader>
          <CardTitle>Analysis Flow Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* PR Analysis Flow */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-xs">1</span>
              Pull Request Analysis
            </h3>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              {[
                { label: "PR Event", desc: "opened/updated" },
                { label: "Acquire Lock", desc: "Redis" },
                { label: "Fetch Diff", desc: "VCS API" },
                { label: "Query RAG", desc: "semantic context" },
                { label: "Build Prompt", desc: "MCP agent" },
                { label: "LLM Analysis", desc: "OpenRouter" },
                { label: "Parse Issues", desc: "structured output" },
                { label: "Post Comments", desc: "VCS API" }
              ].map((step, i, arr) => (
                <div key={step.label} className="flex items-center gap-2">
                  <div className="flex flex-col items-center">
                    <Badge variant="secondary">{step.label}</Badge>
                    <span className="text-[10px] text-muted-foreground">{step.desc}</span>
                  </div>
                  {i < arr.length - 1 && <ArrowRight className="h-3 w-3 text-muted-foreground" />}
                </div>
              ))}
            </div>
          </div>

          {/* Branch Analysis Flow */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-xs">2</span>
              Branch Analysis (Post-Merge)
            </h3>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              {[
                { label: "PR Merged", desc: "webhook" },
                { label: "Load PR Issues", desc: "from DB" },
                { label: "Fetch Branch Diff", desc: "vs target" },
                { label: "Check Resolved", desc: "line changes" },
                { label: "Query RAG", desc: "new context" },
                { label: "Analyze New Code", desc: "LLM" },
                { label: "Update Status", desc: "resolved/new" }
              ].map((step, i, arr) => (
                <div key={step.label} className="flex items-center gap-2">
                  <div className="flex flex-col items-center">
                    <Badge variant="secondary">{step.label}</Badge>
                    <span className="text-[10px] text-muted-foreground">{step.desc}</span>
                  </div>
                  {i < arr.length - 1 && <ArrowRight className="h-3 w-3 text-muted-foreground" />}
                </div>
              ))}
            </div>
          </div>

          {/* RAG Indexing Flow */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-xs">3</span>
              RAG Indexing Pipeline
            </h3>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              {[
                { label: "Clone Repo", desc: "git" },
                { label: "Parse Files", desc: "tree-sitter AST" },
                { label: "Split Chunks", desc: "semantic units" },
                { label: "Generate Embeds", desc: "embedding model" },
                { label: "Store Vectors", desc: "Qdrant" },
                { label: "Save Metadata", desc: "file paths" }
              ].map((step, i, arr) => (
                <div key={step.label} className="flex items-center gap-2">
                  <div className="flex flex-col items-center">
                    <Badge variant="secondary">{step.label}</Badge>
                    <span className="text-[10px] text-muted-foreground">{step.desc}</span>
                  </div>
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
                <Badge variant="outline" className="text-[10px]">:5432</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Primary database for users, workspaces, projects, analyses, and issues.
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Database className="h-4 w-4 text-red-500" />
                <h3 className="font-medium">Redis</h3>
                <Badge variant="outline" className="text-[10px]">:6379</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Analysis locks, session storage, caching, and rate limiting.
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Database className="h-4 w-4 text-purple-500" />
                <h3 className="font-medium">Qdrant</h3>
                <Badge variant="outline" className="text-[10px]">:6333</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Vector database for code embeddings and semantic search.
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
                <Badge>Flyway</Badge>
              </div>
            </div>
            <div className="space-y-3">
              <h3 className="font-medium text-sm">Python Ecosystem</h3>
              <div className="flex flex-wrap gap-2">
                <Badge>Python 3.10+</Badge>
                <Badge>FastAPI</Badge>
                <Badge>LangChain</Badge>
                <Badge>LlamaIndex</Badge>
                <Badge>tree-sitter</Badge>
                <Badge>Pydantic</Badge>
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
                <Badge>TanStack Query</Badge>
              </div>
            </div>
            <div className="space-y-3">
              <h3 className="font-medium text-sm">Infrastructure</h3>
              <div className="flex flex-wrap gap-2">
                <Badge>Docker</Badge>
                <Badge>Docker Compose</Badge>
                <Badge>Nginx</Badge>
                <Badge>OpenRouter</Badge>
                <Badge>Qdrant</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Java Module Structure */}
      <Card>
        <CardHeader>
          <CardTitle>Java Module Structure</CardTitle>
          <CardDescription>
            Monorepo with shared libraries and services
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-muted/30 rounded-lg p-4 font-mono text-xs overflow-x-auto">
            <pre>{`java-ecosystem/
├── libs/
│   ├── core/              # Shared entities, DTOs, utilities
│   ├── vcs-client/        # VCS API clients (Bitbucket, GitHub, GitLab)
│   ├── analysis-engine/   # Analysis orchestration logic
│   ├── rag-engine/        # RAG API client
│   ├── security/          # JWT, encryption utilities
│   └── email/             # Email templates and sending
├── mcp-servers/
│   ├── platform-mcp/      # Filesystem MCP tools
│   └── vcs-mcp/           # Git operations MCP tools
└── services/
    ├── web-server/        # REST API (port 8081)
    └── pipeline-agent/    # Webhook handler (port 8082)`}</pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
