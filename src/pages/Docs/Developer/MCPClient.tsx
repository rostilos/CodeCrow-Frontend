import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bot, Brain, FileCode, MessageSquare, Zap, GitPullRequest, Database, ArrowRight, Play, CheckCircle2, Settings, Code, Search, Layers } from "lucide-react";

export default function MCPClient() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-500/10">
            <Bot className="h-6 w-6 text-purple-500" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">MCP Client</h1>
            <p className="text-muted-foreground mt-1">
              AI-powered code analysis engine using Model Context Protocol
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Badge variant="secondary">Python 3.11+</Badge>
          <Badge variant="secondary">FastAPI</Badge>
          <Badge variant="outline">Port 8000</Badge>
        </div>
      </div>

      {/* Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            The MCP Client is the AI analysis engine that performs code reviews. It receives analysis archives
            from the Pipeline Agent, extracts the code, retrieves relevant context from RAG, and uses LLMs
            to generate intelligent code review comments. It implements the Model Context Protocol (MCP) pattern
            for tool-augmented AI interactions.
          </p>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <Brain className="h-5 w-5 text-primary mb-2" />
              <h4 className="font-medium">LLM Integration</h4>
              <p className="text-sm text-muted-foreground">Claude, GPT-4, and other models via OpenRouter</p>
            </div>
            <div className="p-4 border rounded-lg">
              <Search className="h-5 w-5 text-primary mb-2" />
              <h4 className="font-medium">RAG Context</h4>
              <p className="text-sm text-muted-foreground">Retrieves relevant codebase context</p>
            </div>
            <div className="p-4 border rounded-lg">
              <Layers className="h-5 w-5 text-primary mb-2" />
              <h4 className="font-medium">MCP Servers</h4>
              <p className="text-sm text-muted-foreground">VCS and Platform tools for AI</p>
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
{`python-ecosystem/mcp-client/
├── main.py                      # FastAPI application entry
├── requirements.txt             # Python dependencies
├── Dockerfile                   # Container build
├── llm/
│   ├── __init__.py
│   ├── provider.py              # LLM provider abstraction
│   ├── openrouter.py            # OpenRouter API client
│   └── models.py                # Model configuration
├── model/
│   ├── __init__.py
│   ├── analysis.py              # Analysis request/response models
│   └── context.py               # Analysis context models
├── server/
│   ├── __init__.py
│   ├── mcp_manager.py           # MCP server lifecycle manager
│   └── tools.py                 # Tool definitions for MCP
├── service/
│   ├── __init__.py
│   ├── analysis_service.py      # Main analysis orchestration
│   ├── archive_service.py       # Archive extraction
│   ├── context_service.py       # RAG context retrieval
│   └── comment_service.py       # Comment formatting
└── utils/
    ├── __init__.py
    └── logging.py               # Logging configuration`}
          </pre>
        </CardContent>
      </Card>

      {/* Analysis Flow */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitPullRequest className="h-5 w-5" />
            Analysis Flow
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 bg-muted/50 rounded-lg overflow-x-auto">
            <pre className="text-sm whitespace-pre">
{`┌────────────────┐     ┌──────────────┐     ┌──────────────┐
│  Pipeline      │     │  MCP Client  │     │  RAG         │
│  Agent         │────▶│  (FastAPI)   │────▶│  Pipeline    │
│  archive.tar.gz│     └──────────────┘     └──────────────┘
└────────────────┘            │                    │
                              │                    │
                              ▼                    ▼
                    ┌──────────────────┐  ┌───────────────┐
                    │  Extract &       │  │  Semantic     │
                    │  Parse Code      │  │  Search       │
                    └────────┬─────────┘  └───────┬───────┘
                             │                    │
                             ▼                    ▼
                    ┌────────────────────────────────────┐
                    │         Build Analysis Prompt       │
                    │  • PR diff                          │
                    │  • Changed file contents            │
                    │  • RAG context (related code)       │
                    │  • Project guidelines               │
                    └─────────────────┬──────────────────┘
                                      │
                                      ▼
                    ┌──────────────────────────────────────┐
                    │            LLM Analysis              │
                    │    (Claude/GPT-4 via OpenRouter)     │
                    └─────────────────┬────────────────────┘
                                      │
                                      ▼
                    ┌──────────────────────────────────────┐
                    │         Parse & Format Comments      │
                    │    • Inline comments (file:line)     │
                    │    • Summary review                  │
                    │    • Severity levels                 │
                    └──────────────────────────────────────┘`}
            </pre>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium">Step-by-Step Process</h4>
            <ol className="space-y-3">
              <li className="flex gap-3">
                <Badge className="h-6 w-6 rounded-full flex items-center justify-center bg-purple-500">1</Badge>
                <div>
                  <h5 className="font-medium">Receive Analysis Request</h5>
                  <p className="text-sm text-muted-foreground">
                    Pipeline Agent sends <code className="bg-muted px-1 rounded">POST /api/v1/analyze</code> with multipart archive.
                    Archive contains <code className="bg-muted px-1 rounded">analysis-context.json</code> and code files.
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <Badge className="h-6 w-6 rounded-full flex items-center justify-center bg-purple-500">2</Badge>
                <div>
                  <h5 className="font-medium">Extract Archive</h5>
                  <p className="text-sm text-muted-foreground">
                    Extract <code className="bg-muted px-1 rounded">.tar.gz</code> to temporary directory.
                    Parse <code className="bg-muted px-1 rounded">changes.diff</code> and identify changed files.
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <Badge className="h-6 w-6 rounded-full flex items-center justify-center bg-purple-500">3</Badge>
                <div>
                  <h5 className="font-medium">Retrieve RAG Context</h5>
                  <p className="text-sm text-muted-foreground">
                    Query RAG Pipeline with code snippets from changed files.
                    Retrieve semantically similar code, documentation, and patterns from the indexed codebase.
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <Badge className="h-6 w-6 rounded-full flex items-center justify-center bg-purple-500">4</Badge>
                <div>
                  <h5 className="font-medium">Build Analysis Prompt</h5>
                  <p className="text-sm text-muted-foreground">
                    Construct comprehensive prompt with: diff hunks, full file contents (for context), 
                    RAG results, project-specific guidelines, and analysis instructions.
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <Badge className="h-6 w-6 rounded-full flex items-center justify-center bg-purple-500">5</Badge>
                <div>
                  <h5 className="font-medium">LLM Analysis</h5>
                  <p className="text-sm text-muted-foreground">
                    Send prompt to LLM (Claude/GPT-4 via OpenRouter). Model analyzes code for:
                    bugs, security issues, performance problems, style violations, and best practices.
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <Badge className="h-6 w-6 rounded-full flex items-center justify-center bg-green-500">6</Badge>
                <div>
                  <h5 className="font-medium">Format & Return Comments</h5>
                  <p className="text-sm text-muted-foreground">
                    Parse LLM response into structured comments with file paths, line numbers, 
                    severity levels, and suggestions. Return to Pipeline Agent for posting.
                  </p>
                </div>
              </li>
            </ol>
          </div>
        </CardContent>
      </Card>

      {/* Key Components */}
      <Card>
        <CardHeader>
          <CardTitle>Key Components</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="analysis" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="analysis">Analysis</TabsTrigger>
              <TabsTrigger value="llm">LLM</TabsTrigger>
              <TabsTrigger value="context">Context</TabsTrigger>
              <TabsTrigger value="mcp">MCP</TabsTrigger>
            </TabsList>

            <TabsContent value="analysis" className="space-y-4">
              <h4 className="font-medium">analysis_service.py</h4>
              <pre className="p-4 bg-muted rounded-lg text-xs overflow-x-auto">
{`class AnalysisService:
    """Main orchestration for code analysis."""
    
    def __init__(
        self,
        llm_provider: LLMProvider,
        context_service: ContextService,
        archive_service: ArchiveService,
    ):
        self.llm = llm_provider
        self.context = context_service
        self.archive = archive_service
    
    async def analyze_pr(
        self,
        archive_path: Path,
        options: AnalysisOptions
    ) -> AnalysisResult:
        """
        Perform full PR analysis.
        
        1. Extract archive
        2. Parse diff and files
        3. Get RAG context
        4. Build prompt
        5. Call LLM
        6. Parse comments
        """
        # Extract archive
        work_dir = await self.archive.extract(archive_path)
        context_data = self.archive.parse_context(work_dir)
        
        # Get relevant codebase context from RAG
        rag_context = await self.context.get_rag_context(
            project_id=context_data.project_key,
            changed_files=context_data.changed_files,
        )
        
        # Build comprehensive analysis prompt
        prompt = self._build_prompt(
            diff=context_data.diff,
            files=context_data.files,
            rag_context=rag_context,
            options=options,
        )
        
        # Call LLM for analysis
        response = await self.llm.complete(
            prompt=prompt,
            model=options.model or "anthropic/claude-sonnet-4",
            max_tokens=8000,
        )
        
        # Parse response into structured comments
        comments = self._parse_comments(response)
        
        return AnalysisResult(
            comments=comments,
            summary=self._extract_summary(response),
            stats=self._compute_stats(comments),
        )`}
              </pre>
            </TabsContent>

            <TabsContent value="llm" className="space-y-4">
              <h4 className="font-medium">openrouter.py</h4>
              <pre className="p-4 bg-muted rounded-lg text-xs overflow-x-auto">
{`class OpenRouterProvider(LLMProvider):
    """OpenRouter API client for LLM access."""
    
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://openrouter.ai/api/v1"
    
    async def complete(
        self,
        prompt: str,
        model: str = "anthropic/claude-sonnet-4",
        max_tokens: int = 4000,
        temperature: float = 0.3,
    ) -> str:
        """
        Send completion request to OpenRouter.
        
        Supports:
        - anthropic/claude-sonnet-4
        - anthropic/claude-3.5-sonnet
        - openai/gpt-4o
        - openai/gpt-4-turbo
        - google/gemini-pro-1.5
        """
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "HTTP-Referer": "https://codecrow.dev",
                    "X-Title": "CodeCrow Code Review",
                },
                json={
                    "model": model,
                    "messages": [
                        {"role": "system", "content": SYSTEM_PROMPT},
                        {"role": "user", "content": prompt},
                    ],
                    "max_tokens": max_tokens,
                    "temperature": temperature,
                },
                timeout=300.0,
            )
            
            response.raise_for_status()
            data = response.json()
            return data["choices"][0]["message"]["content"]`}
              </pre>
            </TabsContent>

            <TabsContent value="context" className="space-y-4">
              <h4 className="font-medium">context_service.py</h4>
              <pre className="p-4 bg-muted rounded-lg text-xs overflow-x-auto">
{`class ContextService:
    """Retrieves relevant context from RAG pipeline."""
    
    def __init__(self, rag_api_url: str):
        self.rag_url = rag_api_url
    
    async def get_rag_context(
        self,
        project_id: str,
        changed_files: list[ChangedFile],
        max_chunks: int = 20,
    ) -> list[RagChunk]:
        """
        Query RAG for relevant codebase context.
        
        Strategy:
        1. Extract key identifiers from changed code
        2. Query RAG with semantic search
        3. Deduplicate and rank results
        4. Return top-k most relevant chunks
        """
        # Build search queries from changed code
        queries = self._extract_search_queries(changed_files)
        
        all_chunks = []
        for query in queries[:5]:  # Limit queries
            chunks = await self._search_rag(project_id, query)
            all_chunks.extend(chunks)
        
        # Deduplicate by file path and content hash
        unique_chunks = self._deduplicate(all_chunks)
        
        # Rank by relevance score
        ranked = sorted(unique_chunks, key=lambda c: c.score, reverse=True)
        
        return ranked[:max_chunks]
    
    async def _search_rag(
        self,
        project_id: str,
        query: str,
    ) -> list[RagChunk]:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.rag_url}/query",
                json={
                    "project_id": project_id,
                    "query": query,
                    "limit": 10,
                },
            )
            response.raise_for_status()
            return [RagChunk(**c) for c in response.json()["results"]]`}
              </pre>
            </TabsContent>

            <TabsContent value="mcp" className="space-y-4">
              <h4 className="font-medium">mcp_manager.py</h4>
              <pre className="p-4 bg-muted rounded-lg text-xs overflow-x-auto">
{`class MCPManager:
    """
    Manages MCP (Model Context Protocol) server lifecycle.
    
    MCP servers provide tools that the LLM can use during analysis:
    - VCS MCP: Read files, get diffs, fetch PR info
    - Platform MCP: Post comments, update status
    """
    
    def __init__(self, config: MCPConfig):
        self.vcs_server = None
        self.platform_server = None
        self.config = config
    
    async def start_servers(self, context: AnalysisContext):
        """Start MCP servers for this analysis session."""
        # Start VCS MCP server (provides file access tools)
        self.vcs_server = await self._start_java_server(
            jar_path=self.config.vcs_mcp_jar,
            args=[
                "--workspace", context.work_dir,
                "--repo-slug", context.repo_slug,
            ],
        )
        
        # Start Platform MCP server (provides comment tools)
        self.platform_server = await self._start_java_server(
            jar_path=self.config.platform_mcp_jar,
            args=[
                "--project-key", context.project_key,
                "--pr-id", str(context.pr_id),
            ],
        )
    
    def get_available_tools(self) -> list[Tool]:
        """Get all tools available from MCP servers."""
        tools = []
        
        # VCS tools
        tools.extend([
            Tool(
                name="read_file",
                description="Read contents of a file in the repository",
                parameters={"path": "string"},
            ),
            Tool(
                name="get_file_diff",
                description="Get diff for a specific file",
                parameters={"path": "string"},
            ),
        ])
        
        # Platform tools
        tools.extend([
            Tool(
                name="post_inline_comment",
                description="Post inline comment on PR",
                parameters={"file": "string", "line": "int", "content": "string"},
            ),
        ])
        
        return tools
    
    async def stop_servers(self):
        """Cleanup MCP servers after analysis."""
        if self.vcs_server:
            self.vcs_server.terminate()
        if self.platform_server:
            self.platform_server.terminate()`}
              </pre>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Environment Variable</th>
                  <th className="text-left p-2">Description</th>
                </tr>
              </thead>
              <tbody className="font-mono text-xs">
                <tr className="border-b">
                  <td className="p-2">LLM_PROVIDER</td>
                  <td className="p-2 font-sans">LLM provider (openrouter, anthropic, openai)</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2">OPENROUTER_API_KEY</td>
                  <td className="p-2 font-sans">OpenRouter API key</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2">LLM_MODEL</td>
                  <td className="p-2 font-sans">Default model (e.g., anthropic/claude-sonnet-4)</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2">RAG_API_URL</td>
                  <td className="p-2 font-sans">RAG Pipeline service URL</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2">VCS_MCP_JAR_PATH</td>
                  <td className="p-2 font-sans">Path to VCS MCP server JAR</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2">PLATFORM_MCP_JAR_PATH</td>
                  <td className="p-2 font-sans">Path to Platform MCP server JAR</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2">MAX_TOKENS_PER_FILE</td>
                  <td className="p-2 font-sans">Token limit per file in prompt (default: 8000)</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2">ENABLE_RAG_CONTEXT</td>
                  <td className="p-2 font-sans">Enable RAG context retrieval (default: true)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* API Endpoints */}
      <Card>
        <CardHeader>
          <CardTitle>API Endpoints</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="p-3 border rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-green-600">POST</Badge>
              <code className="text-sm">/api/v1/analyze</code>
            </div>
            <p className="text-sm text-muted-foreground">
              Main analysis endpoint. Accepts multipart with <code>archive</code> file.
              Returns <code>AnalysisResult</code> with comments and summary.
            </p>
          </div>
          <div className="p-3 border rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-green-600">POST</Badge>
              <code className="text-sm">/api/v1/analyze/stream</code>
            </div>
            <p className="text-sm text-muted-foreground">
              SSE streaming endpoint for real-time progress updates during analysis.
            </p>
          </div>
          <div className="p-3 border rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-blue-600">GET</Badge>
              <code className="text-sm">/health</code>
            </div>
            <p className="text-sm text-muted-foreground">
              Health check endpoint. Returns service status and LLM connectivity.
            </p>
          </div>
          <div className="p-3 border rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-blue-600">GET</Badge>
              <code className="text-sm">/api/v1/models</code>
            </div>
            <p className="text-sm text-muted-foreground">
              List available LLM models with capabilities and pricing info.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Analysis Prompt Structure */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Analysis Prompt Structure
          </CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="p-4 bg-muted rounded-lg text-xs overflow-x-auto">
{`# System Prompt
You are an expert code reviewer. Analyze the following pull request
and provide constructive feedback focusing on:
- Code quality and best practices
- Potential bugs and edge cases
- Security vulnerabilities
- Performance considerations
- Maintainability and readability

# User Prompt Structure
## Pull Request Context
- Repository: {repo_name}
- Source Branch: {source_branch} → Target: {target_branch}
- Author: {author}

## Diff
\`\`\`diff
{unified_diff}
\`\`\`

## Changed Files
{for each file}
### {file_path}
\`\`\`{language}
{file_content}
\`\`\`
{end for}

## Related Code from Repository (RAG Context)
{for each rag_chunk}
### {chunk.file_path}:{chunk.start_line}-{chunk.end_line}
\`\`\`{language}
{chunk.content}
\`\`\`
{end for}

## Project Guidelines
{project_specific_guidelines}

## Instructions
Provide your review as JSON with this structure:
{
  "summary": "Overall assessment...",
  "comments": [
    {
      "file": "path/to/file.ts",
      "line": 42,
      "severity": "warning|error|info|suggestion",
      "message": "Description of the issue...",
      "suggestion": "Optional code suggestion..."
    }
  ]
}`}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
