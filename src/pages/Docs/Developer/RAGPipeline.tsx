import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Database, Brain, Search, FileCode, GitBranch, Layers, ArrowRight, Settings, Zap, FolderTree, RefreshCw, Trash2, BarChart3 } from "lucide-react";

export default function RAGPipeline() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-green-500/10">
            <Brain className="h-6 w-6 text-green-500" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">RAG Pipeline</h1>
            <p className="text-muted-foreground mt-1">
              Retrieval-Augmented Generation for codebase context and semantic search
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Badge variant="secondary">Python 3.11+</Badge>
          <Badge variant="secondary">FastAPI</Badge>
          <Badge variant="secondary">Qdrant</Badge>
          <Badge variant="outline">Port 8001</Badge>
        </div>
      </div>

      {/* Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            The RAG Pipeline indexes repository codebases into vector embeddings stored in Qdrant.
            When analyzing PRs, the MCP Client queries the RAG Pipeline to retrieve semantically relevant 
            code snippets, providing the LLM with project-specific context for more accurate reviews.
          </p>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <FileCode className="h-5 w-5 text-primary mb-2" />
              <h4 className="font-medium">Code Indexing</h4>
              <p className="text-sm text-muted-foreground">Chunks and embeds source code files</p>
            </div>
            <div className="p-4 border rounded-lg">
              <Search className="h-5 w-5 text-primary mb-2" />
              <h4 className="font-medium">Semantic Search</h4>
              <p className="text-sm text-muted-foreground">Find related code by meaning</p>
            </div>
            <div className="p-4 border rounded-lg">
              <Database className="h-5 w-5 text-primary mb-2" />
              <h4 className="font-medium">Qdrant Storage</h4>
              <p className="text-sm text-muted-foreground">Vector database for embeddings</p>
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
{`python-ecosystem/rag-pipeline/
├── main.py                          # FastAPI application entry
├── requirements.txt                 # Python dependencies
├── Dockerfile                       # Container build
├── src/
│   ├── __init__.py
│   ├── api/
│   │   ├── __init__.py
│   │   ├── routes.py                # API endpoint definitions
│   │   └── models.py                # Request/response models
│   ├── indexing/
│   │   ├── __init__.py
│   │   ├── chunker.py               # Code chunking strategies
│   │   ├── embedder.py              # Embedding generation
│   │   └── indexer.py               # Full indexing pipeline
│   ├── retrieval/
│   │   ├── __init__.py
│   │   ├── searcher.py              # Semantic search
│   │   └── reranker.py              # Result reranking
│   ├── storage/
│   │   ├── __init__.py
│   │   └── qdrant_client.py         # Qdrant operations
│   └── utils/
│       ├── __init__.py
│       ├── file_processor.py        # File type detection
│       └── language_detector.py     # Programming language ID
└── tests/
    └── *.py                         # Test files`}
          </pre>
        </CardContent>
      </Card>

      {/* Architecture */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5" />
            Architecture: Single Collection per Project
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            CodeCrow uses a <strong>project-level collection</strong> architecture in Qdrant.
            Each project has one collection that contains all indexed code, regardless of branch.
          </p>

          <div className="p-4 bg-muted/50 rounded-lg overflow-x-auto">
            <pre className="text-sm whitespace-pre">
{`┌─────────────────────────────────────────────────────────────┐
│                     Qdrant Database                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌───────────────────────┐   ┌───────────────────────┐      │
│  │  Collection:          │   │  Collection:          │      │
│  │  project_abc123       │   │  project_xyz789       │      │
│  ├───────────────────────┤   ├───────────────────────┤      │
│  │  Vectors:             │   │  Vectors:             │      │
│  │  • src/main.ts        │   │  • app/models.py      │      │
│  │  • src/utils.ts       │   │  • app/views.py       │      │
│  │  • lib/helpers.ts     │   │  • tests/test_api.py  │      │
│  │  ...                  │   │  ...                  │      │
│  │                       │   │                       │      │
│  │  Metadata:            │   │  Metadata:            │      │
│  │  • file_path          │   │  • file_path          │      │
│  │  • language           │   │  • language           │      │
│  │  • chunk_index        │   │  • chunk_index        │      │
│  │  • indexed_at         │   │  • indexed_at         │      │
│  └───────────────────────┘   └───────────────────────┘      │
│                                                              │
└─────────────────────────────────────────────────────────────┘`}
            </pre>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg border-green-500/30 bg-green-500/5">
              <h4 className="font-medium text-green-600 mb-2">Benefits</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Simple management (one collection per project)</li>
                <li>• Easy full reindex operations</li>
                <li>• Consistent context across branches</li>
                <li>• Lower storage overhead</li>
              </ul>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Collection Naming</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Pattern: <code className="bg-muted px-1 rounded">project_{"{projectId}"}</code></li>
                <li>• Example: <code className="bg-muted px-1 rounded">project_abc123</code></li>
                <li>• Unique per workspace/project combination</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Indexing Flow */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            Indexing Flow
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 bg-muted/50 rounded-lg overflow-x-auto">
            <pre className="text-sm whitespace-pre">
{`┌─────────────┐     ┌──────────────┐     ┌──────────────┐
│  Pipeline   │     │  RAG         │     │  Embedding   │
│  Agent      │────▶│  Pipeline    │────▶│  API         │
│  (archive)  │     │  (FastAPI)   │     │  (OpenRouter)│
└─────────────┘     └──────────────┘     └──────────────┘
                           │                     │
                           ▼                     │
                    ┌─────────────┐              │
                    │  Extract &  │              │
                    │  Process    │              │
                    │  Files      │              │
                    └──────┬──────┘              │
                           │                     │
                           ▼                     │
                    ┌─────────────┐              │
                    │  Chunk      │              │
                    │  Code       │              │
                    │  (AST-aware)│              │
                    └──────┬──────┘              │
                           │                     │
                           ▼                     ▼
                    ┌─────────────────────────────────┐
                    │      Generate Embeddings        │
                    │  (text-embedding-3-small)       │
                    └──────────────┬──────────────────┘
                                   │
                                   ▼
                    ┌─────────────────────────────────┐
                    │        Store in Qdrant          │
                    │  (project-level collection)     │
                    └─────────────────────────────────┘`}
            </pre>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium">Indexing Steps</h4>
            <ol className="space-y-3">
              <li className="flex gap-3">
                <Badge className="h-6 w-6 rounded-full flex items-center justify-center bg-green-500">1</Badge>
                <div>
                  <h5 className="font-medium">Receive Index Request</h5>
                  <p className="text-sm text-muted-foreground">
                    Pipeline Agent sends <code className="bg-muted px-1 rounded">POST /index</code> with repository archive.
                    Includes project ID and branch information.
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <Badge className="h-6 w-6 rounded-full flex items-center justify-center bg-green-500">2</Badge>
                <div>
                  <h5 className="font-medium">Extract & Filter Files</h5>
                  <p className="text-sm text-muted-foreground">
                    Extract archive, filter by supported file types (.py, .ts, .java, etc.), 
                    exclude binaries, vendors, node_modules, and files over size limit.
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <Badge className="h-6 w-6 rounded-full flex items-center justify-center bg-green-500">3</Badge>
                <div>
                  <h5 className="font-medium">Smart Chunking</h5>
                  <p className="text-sm text-muted-foreground">
                    Chunk code intelligently using AST-aware boundaries when possible.
                    Respects function/class boundaries. Default chunk size: 800 tokens, overlap: 200.
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <Badge className="h-6 w-6 rounded-full flex items-center justify-center bg-green-500">4</Badge>
                <div>
                  <h5 className="font-medium">Generate Embeddings</h5>
                  <p className="text-sm text-muted-foreground">
                    Send chunks to embedding model (text-embedding-3-small via OpenRouter).
                    Batch processing with rate limiting. 1536-dimensional vectors.
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <Badge className="h-6 w-6 rounded-full flex items-center justify-center bg-green-500">5</Badge>
                <div>
                  <h5 className="font-medium">Upsert to Qdrant</h5>
                  <p className="text-sm text-muted-foreground">
                    Store vectors in project collection with metadata (file path, language, 
                    line numbers, chunk index). Previous vectors for same files are replaced.
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
          <Tabs defaultValue="chunker" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="chunker">Chunker</TabsTrigger>
              <TabsTrigger value="embedder">Embedder</TabsTrigger>
              <TabsTrigger value="searcher">Searcher</TabsTrigger>
              <TabsTrigger value="storage">Storage</TabsTrigger>
            </TabsList>

            <TabsContent value="chunker" className="space-y-4">
              <h4 className="font-medium">chunker.py</h4>
              <pre className="p-4 bg-muted rounded-lg text-xs overflow-x-auto">
{`class CodeChunker:
    """
    Smart code chunking that respects code structure.
    
    Strategies:
    1. AST-aware: Split at function/class boundaries
    2. Line-based: Fall back to line boundaries
    3. Overlap: Maintain context between chunks
    """
    
    def __init__(
        self,
        chunk_size: int = 800,
        chunk_overlap: int = 200,
    ):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        self.tokenizer = tiktoken.get_encoding("cl100k_base")
    
    def chunk_file(
        self,
        content: str,
        file_path: str,
        language: str,
    ) -> list[CodeChunk]:
        """
        Chunk a source file into semantically meaningful pieces.
        """
        # Try AST-aware chunking for supported languages
        if language in ["python", "typescript", "javascript", "java"]:
            try:
                return self._ast_chunk(content, file_path, language)
            except Exception:
                pass  # Fall back to line-based
        
        # Line-based chunking with overlap
        return self._line_chunk(content, file_path, language)
    
    def _ast_chunk(
        self,
        content: str,
        file_path: str,
        language: str,
    ) -> list[CodeChunk]:
        """
        Chunk using AST to respect code boundaries.
        """
        parser = get_parser(language)
        tree = parser.parse(content.encode())
        
        chunks = []
        for node in self._extract_definitions(tree.root_node):
            node_text = content[node.start_byte:node.end_byte]
            
            if self._count_tokens(node_text) > self.chunk_size:
                # Split large functions/classes
                sub_chunks = self._split_large_node(node_text, file_path, language)
                chunks.extend(sub_chunks)
            else:
                chunks.append(CodeChunk(
                    content=node_text,
                    file_path=file_path,
                    start_line=node.start_point[0] + 1,
                    end_line=node.end_point[0] + 1,
                    language=language,
                ))
        
        return chunks`}
              </pre>
            </TabsContent>

            <TabsContent value="embedder" className="space-y-4">
              <h4 className="font-medium">embedder.py</h4>
              <pre className="p-4 bg-muted rounded-lg text-xs overflow-x-auto">
{`class CodeEmbedder:
    """
    Generate embeddings for code chunks.
    
    Uses OpenRouter for embedding API access.
    Model: text-embedding-3-small (1536 dimensions)
    """
    
    def __init__(
        self,
        api_key: str,
        model: str = "openai/text-embedding-3-small",
        batch_size: int = 100,
    ):
        self.api_key = api_key
        self.model = model
        self.batch_size = batch_size
    
    async def embed_chunks(
        self,
        chunks: list[CodeChunk],
    ) -> list[EmbeddedChunk]:
        """
        Generate embeddings for a list of code chunks.
        
        Batches requests for efficiency.
        """
        results = []
        
        for batch in self._batch(chunks, self.batch_size):
            texts = [self._prepare_text(c) for c in batch]
            embeddings = await self._embed_batch(texts)
            
            for chunk, embedding in zip(batch, embeddings):
                results.append(EmbeddedChunk(
                    content=chunk.content,
                    file_path=chunk.file_path,
                    start_line=chunk.start_line,
                    end_line=chunk.end_line,
                    language=chunk.language,
                    embedding=embedding,
                ))
        
        return results
    
    def _prepare_text(self, chunk: CodeChunk) -> str:
        """
        Prepare text for embedding.
        Includes file path context for better retrieval.
        """
        return f"File: {chunk.file_path}\\n\\n{chunk.content}"
    
    async def _embed_batch(self, texts: list[str]) -> list[list[float]]:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://openrouter.ai/api/v1/embeddings",
                headers={"Authorization": f"Bearer {self.api_key}"},
                json={"input": texts, "model": self.model},
            )
            response.raise_for_status()
            return [e["embedding"] for e in response.json()["data"]]`}
              </pre>
            </TabsContent>

            <TabsContent value="searcher" className="space-y-4">
              <h4 className="font-medium">searcher.py</h4>
              <pre className="p-4 bg-muted rounded-lg text-xs overflow-x-auto">
{`class SemanticSearcher:
    """
    Semantic search over indexed codebase.
    """
    
    def __init__(
        self,
        qdrant: QdrantClient,
        embedder: CodeEmbedder,
        reranker: Optional[Reranker] = None,
    ):
        self.qdrant = qdrant
        self.embedder = embedder
        self.reranker = reranker
    
    async def search(
        self,
        project_id: str,
        query: str,
        limit: int = 10,
        filters: Optional[SearchFilters] = None,
    ) -> list[SearchResult]:
        """
        Search for code relevant to query.
        
        1. Embed query
        2. Vector search in Qdrant
        3. Optional reranking
        4. Return top results
        """
        # Embed the query
        query_embedding = await self.embedder.embed_text(query)
        
        # Build Qdrant filter
        qdrant_filter = self._build_filter(filters)
        
        # Search
        collection_name = f"project_{project_id}"
        results = self.qdrant.search(
            collection_name=collection_name,
            query_vector=query_embedding,
            limit=limit * 3 if self.reranker else limit,
            query_filter=qdrant_filter,
        )
        
        # Convert to SearchResult
        search_results = [
            SearchResult(
                content=r.payload["content"],
                file_path=r.payload["file_path"],
                start_line=r.payload["start_line"],
                end_line=r.payload["end_line"],
                language=r.payload["language"],
                score=r.score,
            )
            for r in results
        ]
        
        # Optional reranking for better relevance
        if self.reranker:
            search_results = await self.reranker.rerank(
                query=query,
                results=search_results,
                top_k=limit,
            )
        
        return search_results[:limit]`}
              </pre>
            </TabsContent>

            <TabsContent value="storage" className="space-y-4">
              <h4 className="font-medium">qdrant_client.py</h4>
              <pre className="p-4 bg-muted rounded-lg text-xs overflow-x-auto">
{`class QdrantStorage:
    """
    Qdrant vector database operations.
    """
    
    def __init__(self, url: str, api_key: Optional[str] = None):
        self.client = QdrantClient(url=url, api_key=api_key)
        self.vector_size = 1536  # text-embedding-3-small
    
    def ensure_collection(self, project_id: str) -> None:
        """
        Create collection if it doesn't exist.
        """
        collection_name = f"project_{project_id}"
        
        if not self.client.collection_exists(collection_name):
            self.client.create_collection(
                collection_name=collection_name,
                vectors_config=VectorParams(
                    size=self.vector_size,
                    distance=Distance.COSINE,
                ),
            )
    
    def upsert_chunks(
        self,
        project_id: str,
        chunks: list[EmbeddedChunk],
    ) -> None:
        """
        Upsert embedded chunks to collection.
        """
        collection_name = f"project_{project_id}"
        
        points = [
            PointStruct(
                id=self._generate_id(chunk),
                vector=chunk.embedding,
                payload={
                    "content": chunk.content,
                    "file_path": chunk.file_path,
                    "start_line": chunk.start_line,
                    "end_line": chunk.end_line,
                    "language": chunk.language,
                    "indexed_at": datetime.utcnow().isoformat(),
                },
            )
            for chunk in chunks
        ]
        
        self.client.upsert(
            collection_name=collection_name,
            points=points,
        )
    
    def delete_collection(self, project_id: str) -> None:
        """Delete entire project collection."""
        collection_name = f"project_{project_id}"
        self.client.delete_collection(collection_name)
    
    def get_stats(self, project_id: str) -> CollectionStats:
        """Get collection statistics."""
        collection_name = f"project_{project_id}"
        info = self.client.get_collection(collection_name)
        return CollectionStats(
            vectors_count=info.vectors_count,
            points_count=info.points_count,
        )`}
              </pre>
            </TabsContent>
          </Tabs>
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
              <code className="text-sm">/index</code>
            </div>
            <p className="text-sm text-muted-foreground">
              Index a repository. Accepts multipart with archive file.
              Body: <code>{`{ project_id, branch?, replace_existing? }`}</code>
            </p>
          </div>
          <div className="p-3 border rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-green-600">POST</Badge>
              <code className="text-sm">/query</code>
            </div>
            <p className="text-sm text-muted-foreground">
              Semantic search. Body: <code>{`{ project_id, query, limit?, filters? }`}</code>.
              Returns array of matching code chunks with scores.
            </p>
          </div>
          <div className="p-3 border rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-blue-600">GET</Badge>
              <code className="text-sm">/collections/{"{project_id}"}/status</code>
            </div>
            <p className="text-sm text-muted-foreground">
              Get index status. Returns vectors count, last indexed time, storage size.
            </p>
          </div>
          <div className="p-3 border rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-red-600">DELETE</Badge>
              <code className="text-sm">/collections/{"{project_id}"}</code>
            </div>
            <p className="text-sm text-muted-foreground">
              Delete project index. Removes all vectors for the project.
            </p>
          </div>
          <div className="p-3 border rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-blue-600">GET</Badge>
              <code className="text-sm">/health</code>
            </div>
            <p className="text-sm text-muted-foreground">
              Health check. Returns service status and Qdrant connectivity.
            </p>
          </div>
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
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Environment Variable</th>
                  <th className="text-left p-2">Default</th>
                  <th className="text-left p-2">Description</th>
                </tr>
              </thead>
              <tbody className="font-mono text-xs">
                <tr className="border-b">
                  <td className="p-2">QDRANT_URL</td>
                  <td className="p-2">http://qdrant:6333</td>
                  <td className="p-2 font-sans">Qdrant server URL</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2">OPENROUTER_API_KEY</td>
                  <td className="p-2">-</td>
                  <td className="p-2 font-sans">API key for embeddings</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2">EMBEDDING_MODEL</td>
                  <td className="p-2">openai/text-embedding-3-small</td>
                  <td className="p-2 font-sans">Embedding model to use</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2">CHUNK_SIZE</td>
                  <td className="p-2">800</td>
                  <td className="p-2 font-sans">Max tokens per chunk</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2">CHUNK_OVERLAP</td>
                  <td className="p-2">200</td>
                  <td className="p-2 font-sans">Token overlap between chunks</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2">MAX_FILE_SIZE_BYTES</td>
                  <td className="p-2">1048576</td>
                  <td className="p-2 font-sans">Max file size to index (1MB)</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2">ENABLE_RERANKING</td>
                  <td className="p-2">true</td>
                  <td className="p-2 font-sans">Use reranker for better results</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Supported File Types */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderTree className="h-5 w-5" />
            Supported File Types
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Languages</h4>
              <p className="text-sm text-muted-foreground">
                .py, .ts, .tsx, .js, .jsx, .java, .kt, .go, .rs, .rb, .php, .cs, .cpp, .c, .swift
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Markup & Config</h4>
              <p className="text-sm text-muted-foreground">
                .md, .json, .yaml, .yml, .toml, .xml, .html, .css, .scss
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Excluded</h4>
              <p className="text-sm text-muted-foreground">
                node_modules/, vendor/, .git/, *.min.js, *.map, binaries, images
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
