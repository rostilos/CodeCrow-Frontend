import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Cpu, GitPullRequest, GitBranch, Webhook, MessageSquare, Play, CheckCircle2, Clock, ArrowRight, Code, FileText, Bot, Database, Zap, AlertTriangle, Info } from "lucide-react";

export default function PipelineAgent() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-orange-500/10">
            <Cpu className="h-6 w-6 text-orange-500" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Pipeline Agent</h1>
            <p className="text-muted-foreground mt-1">
              Webhook handler and analysis orchestrator for VCS events
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Badge variant="secondary">Java 21</Badge>
          <Badge variant="secondary">Spring Boot 3</Badge>
          <Badge variant="outline">Port 8082</Badge>
        </div>
      </div>

      {/* Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            The Pipeline Agent is the entry point for all VCS webhook events. It receives webhooks from 
            Bitbucket, GitHub, and GitLab, validates them, and orchestrates the code review analysis process.
            It acts as the bridge between VCS platforms and the AI analysis pipeline.
          </p>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <Webhook className="h-5 w-5 text-primary mb-2" />
              <h4 className="font-medium">Webhook Handler</h4>
              <p className="text-sm text-muted-foreground">Receives and validates VCS webhooks</p>
            </div>
            <div className="p-4 border rounded-lg">
              <Code className="h-5 w-5 text-primary mb-2" />
              <h4 className="font-medium">Code Packager</h4>
              <p className="text-sm text-muted-foreground">Creates analysis archives with diff context</p>
            </div>
            <div className="p-4 border rounded-lg">
              <Bot className="h-5 w-5 text-primary mb-2" />
              <h4 className="font-medium">Analysis Orchestrator</h4>
              <p className="text-sm text-muted-foreground">Coordinates AI review process</p>
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
          <pre className="p-4 bg-muted rounded-lg text-sm">
{`java-ecosystem/services/pipeline-agent/
├── src/main/java/org/rostilos/codecrow/pipeline/
│   ├── PipelineAgentApplication.java    # Spring Boot entry point
│   ├── controller/
│   │   └── WebhookController.java       # Webhook endpoints
│   ├── service/
│   │   ├── PipelineService.java         # Main orchestration logic
│   │   ├── ArchiveService.java          # Creates analysis packages
│   │   └── WebhookValidationService.java
│   ├── handler/
│   │   ├── BitbucketWebhookHandler.java
│   │   ├── GithubWebhookHandler.java
│   │   └── GitlabWebhookHandler.java
│   ├── client/
│   │   └── McpClientService.java        # Calls MCP Client for analysis
│   └── model/
│       └── *.java                       # DTOs and domain models
└── src/main/resources/
    └── application.properties           # Service-specific config`}
          </pre>
        </CardContent>
      </Card>

      {/* PR Analysis Flow */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitPullRequest className="h-5 w-5" />
            Pull Request Analysis Flow
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 bg-muted/50 rounded-lg overflow-x-auto">
            <pre className="text-sm whitespace-pre">
{`┌─────────────┐     ┌─────────────────┐     ┌──────────────┐
│  VCS        │     │  Pipeline       │     │  MCP         │
│  Platform   │────▶│  Agent          │────▶│  Client      │
│  (Webhook)  │     │  (Port 8082)    │     │  (Port 8000) │
└─────────────┘     └─────────────────┘     └──────────────┘
                            │                       │
                            │                       │
                    ┌───────▼───────┐       ┌───────▼───────┐
                    │  Create       │       │  AI Analysis  │
                    │  Archive      │       │  + RAG        │
                    │  .tar.gz      │       │  Context      │
                    └───────────────┘       └───────────────┘
                            │                       │
                            │                       │
                    ┌───────▼───────────────────────▼───────┐
                    │         VCS Client                     │
                    │  (Post review comments to PR)          │
                    └───────────────────────────────────────┘`}
            </pre>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium">Step-by-Step Process</h4>
            <ol className="space-y-3">
              <li className="flex gap-3">
                <Badge className="h-6 w-6 rounded-full flex items-center justify-center bg-blue-500">1</Badge>
                <div>
                  <h5 className="font-medium">Webhook Received</h5>
                  <p className="text-sm text-muted-foreground">
                    VCS platform sends webhook to <code className="bg-muted px-1 rounded">/api/v1/pipeline/webhook</code>
                    on PR creation or update. Payload includes PR ID, repo details, and commit info.
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <Badge className="h-6 w-6 rounded-full flex items-center justify-center bg-blue-500">2</Badge>
                <div>
                  <h5 className="font-medium">Validation & Filtering</h5>
                  <p className="text-sm text-muted-foreground">
                    Validates webhook signature, checks if project has active subscription, 
                    verifies branch patterns match configured rules.
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <Badge className="h-6 w-6 rounded-full flex items-center justify-center bg-blue-500">3</Badge>
                <div>
                  <h5 className="font-medium">Create Analysis Job</h5>
                  <p className="text-sm text-muted-foreground">
                    Creates a new <code className="bg-muted px-1 rounded">AnalysisJob</code> entity in database 
                    with status <code className="bg-muted px-1 rounded">PENDING</code>. Job ID returned to caller.
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <Badge className="h-6 w-6 rounded-full flex items-center justify-center bg-blue-500">4</Badge>
                <div>
                  <h5 className="font-medium">Fetch PR Diff & Files</h5>
                  <p className="text-sm text-muted-foreground">
                    Uses VCS Client to fetch the PR diff, changed files content, and repository structure.
                    Respects file filters (e.g., exclude vendor/, *.min.js).
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <Badge className="h-6 w-6 rounded-full flex items-center justify-center bg-blue-500">5</Badge>
                <div>
                  <h5 className="font-medium">Create Analysis Archive</h5>
                  <p className="text-sm text-muted-foreground">
                    Packages diff, file contents, and metadata into a <code className="bg-muted px-1 rounded">.tar.gz</code> archive.
                    Includes <code className="bg-muted px-1 rounded">analysis-context.json</code> with PR metadata.
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <Badge className="h-6 w-6 rounded-full flex items-center justify-center bg-blue-500">6</Badge>
                <div>
                  <h5 className="font-medium">Send to MCP Client</h5>
                  <p className="text-sm text-muted-foreground">
                    Uploads archive to MCP Client via HTTP multipart. MCP Client extracts, 
                    retrieves RAG context, and performs AI analysis.
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <Badge className="h-6 w-6 rounded-full flex items-center justify-center bg-green-500">7</Badge>
                <div>
                  <h5 className="font-medium">Post Review Comments</h5>
                  <p className="text-sm text-muted-foreground">
                    Receives analysis results from MCP Client. Uses VCS Client to post 
                    inline comments and summary review on the PR.
                  </p>
                </div>
              </li>
            </ol>
          </div>
        </CardContent>
      </Card>

      {/* Branch Analysis Flow */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            Branch Analysis Flow
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Branch analysis indexes code for RAG without posting PR comments. Triggered by push events 
            or manual request. Used to build context for future PR reviews.
          </p>

          <div className="space-y-3">
            <div className="flex items-center gap-4 p-3 border rounded-lg">
              <Badge variant="outline">1</Badge>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Receive push webhook or manual trigger</span>
            </div>
            <div className="flex items-center gap-4 p-3 border rounded-lg">
              <Badge variant="outline">2</Badge>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Create branch indexing job</span>
            </div>
            <div className="flex items-center gap-4 p-3 border rounded-lg">
              <Badge variant="outline">3</Badge>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Archive repository files (exclude binaries, vendors)</span>
            </div>
            <div className="flex items-center gap-4 p-3 border rounded-lg">
              <Badge variant="outline">4</Badge>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Send to RAG Pipeline for indexing</span>
            </div>
            <div className="flex items-center gap-4 p-3 border rounded-lg bg-green-500/10">
              <Badge variant="outline" className="bg-green-500/20">5</Badge>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Index stored in Qdrant (project-level collection)</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Components */}
      <Card>
        <CardHeader>
          <CardTitle>Key Components</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="controller" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="controller">Controller</TabsTrigger>
              <TabsTrigger value="service">Service</TabsTrigger>
              <TabsTrigger value="archive">Archive</TabsTrigger>
              <TabsTrigger value="client">Client</TabsTrigger>
            </TabsList>

            <TabsContent value="controller" className="space-y-4">
              <h4 className="font-medium">WebhookController.java</h4>
              <pre className="p-4 bg-muted rounded-lg text-xs overflow-x-auto">
{`@RestController
@RequestMapping("/api/v1/pipeline")
public class WebhookController {

    @PostMapping("/webhook")
    public ResponseEntity<WebhookResponse> handleBitbucketWebhook(
            @RequestHeader("X-Event-Key") String eventKey,
            @RequestHeader("X-Hub-Signature") String signature,
            @RequestBody String payload) {
        
        // Validate signature
        webhookValidationService.validateBitbucket(signature, payload);
        
        // Route to appropriate handler
        WebhookEvent event = parseWebhookEvent(eventKey, payload);
        
        return switch (event.getType()) {
            case PULL_REQUEST_CREATED,
                 PULL_REQUEST_UPDATED -> pipelineService.handlePrEvent(event);
            case PUSH -> pipelineService.handlePushEvent(event);
            default -> ResponseEntity.ok().build();
        };
    }
    
    @PostMapping("/webhook/github")
    public ResponseEntity<WebhookResponse> handleGithubWebhook(...) { ... }
    
    @PostMapping("/analyze")
    public ResponseEntity<AnalysisJob> triggerManualAnalysis(
            @RequestBody ManualAnalysisRequest request) {
        return pipelineService.triggerManualAnalysis(request);
    }
}`}
              </pre>
            </TabsContent>

            <TabsContent value="service" className="space-y-4">
              <h4 className="font-medium">PipelineService.java</h4>
              <pre className="p-4 bg-muted rounded-lg text-xs overflow-x-auto">
{`@Service
@RequiredArgsConstructor
public class PipelineService {

    private final VcsClientService vcsClient;
    private final ArchiveService archiveService;
    private final McpClientService mcpClient;
    private final JobService jobService;
    
    @Async
    @Transactional
    public void processPullRequest(PullRequestEvent event) {
        // 1. Create job record
        AnalysisJob job = jobService.createJob(event);
        
        try {
            job.setStatus(JobStatus.FETCHING_DATA);
            
            // 2. Fetch PR data from VCS
            PullRequestData prData = vcsClient.fetchPullRequest(
                event.getRepositoryId(),
                event.getPullRequestId()
            );
            
            // 3. Create analysis archive
            job.setStatus(JobStatus.PREPARING_ANALYSIS);
            Path archive = archiveService.createPrArchive(prData);
            
            // 4. Send to MCP Client for analysis
            job.setStatus(JobStatus.ANALYZING);
            AnalysisResult result = mcpClient.analyze(archive);
            
            // 5. Post comments to PR
            job.setStatus(JobStatus.POSTING_RESULTS);
            vcsClient.postReviewComments(prData, result);
            
            job.setStatus(JobStatus.COMPLETED);
            job.setResult(result);
            
        } catch (Exception e) {
            job.setStatus(JobStatus.FAILED);
            job.setErrorMessage(e.getMessage());
            throw e;
        }
    }
}`}
              </pre>
            </TabsContent>

            <TabsContent value="archive" className="space-y-4">
              <h4 className="font-medium">ArchiveService.java</h4>
              <pre className="p-4 bg-muted rounded-lg text-xs overflow-x-auto">
{`@Service
public class ArchiveService {

    public Path createPrArchive(PullRequestData prData) {
        Path tempDir = Files.createTempDirectory("codecrow-analysis-");
        
        try {
            // Write context file
            Path contextFile = tempDir.resolve("analysis-context.json");
            objectMapper.writeValue(contextFile.toFile(), AnalysisContext.builder()
                .analysisType(AnalysisType.PULL_REQUEST)
                .pullRequestId(prData.getId())
                .sourceBranch(prData.getSourceBranch())
                .targetBranch(prData.getTargetBranch())
                .repositoryName(prData.getRepository().getName())
                .projectKey(prData.getProject().getKey())
                .build());
            
            // Write diff file
            Path diffFile = tempDir.resolve("changes.diff");
            Files.writeString(diffFile, prData.getDiff());
            
            // Write changed files
            Path filesDir = tempDir.resolve("files");
            for (ChangedFile file : prData.getChangedFiles()) {
                Path filePath = filesDir.resolve(file.getPath());
                Files.createDirectories(filePath.getParent());
                Files.writeString(filePath, file.getContent());
            }
            
            // Create tar.gz archive
            return createTarGz(tempDir);
            
        } finally {
            FileUtils.deleteDirectory(tempDir.toFile());
        }
    }
}`}
              </pre>
            </TabsContent>

            <TabsContent value="client" className="space-y-4">
              <h4 className="font-medium">McpClientService.java</h4>
              <pre className="p-4 bg-muted rounded-lg text-xs overflow-x-auto">
{`@Service
@RequiredArgsConstructor
public class McpClientService {

    @Value("\${codecrow.mcp.client.url}")
    private String mcpClientUrl;
    
    private final WebClient webClient;
    
    public AnalysisResult analyze(Path archivePath) {
        MultipartBodyBuilder builder = new MultipartBodyBuilder();
        builder.part("archive", new FileSystemResource(archivePath));
        
        return webClient.post()
            .uri(mcpClientUrl + "/api/v1/analyze")
            .contentType(MediaType.MULTIPART_FORM_DATA)
            .body(BodyInserters.fromMultipartData(builder.build()))
            .retrieve()
            .bodyToMono(AnalysisResult.class)
            .timeout(Duration.ofMinutes(10))
            .block();
    }
    
    public Flux<AnalysisEvent> analyzeStreaming(Path archivePath) {
        // SSE streaming for real-time progress
        return webClient.post()
            .uri(mcpClientUrl + "/api/v1/analyze/stream")
            .body(...)
            .retrieve()
            .bodyToFlux(AnalysisEvent.class);
    }
}`}
              </pre>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Configuration Properties</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Property</th>
                  <th className="text-left p-2">Default</th>
                  <th className="text-left p-2">Description</th>
                </tr>
              </thead>
              <tbody className="font-mono text-xs">
                <tr className="border-b">
                  <td className="p-2">server.port</td>
                  <td className="p-2">8082</td>
                  <td className="p-2 font-sans">HTTP server port</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2">codecrow.mcp.client.url</td>
                  <td className="p-2">http://mcp-client:8000</td>
                  <td className="p-2 font-sans">MCP Client service URL</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2">codecrow.pipeline.max-file-size</td>
                  <td className="p-2">1MB</td>
                  <td className="p-2 font-sans">Maximum file size to include in analysis</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2">codecrow.pipeline.archive-ttl</td>
                  <td className="p-2">1h</td>
                  <td className="p-2 font-sans">Time to keep temporary archives</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2">codecrow.pipeline.async-threads</td>
                  <td className="p-2">4</td>
                  <td className="p-2 font-sans">Thread pool size for async processing</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Endpoints Reference */}
      <Card>
        <CardHeader>
          <CardTitle>API Endpoints</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="p-3 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-green-600">POST</Badge>
                <code className="text-sm">/api/v1/pipeline/webhook</code>
              </div>
              <p className="text-sm text-muted-foreground">
                Bitbucket Cloud webhook endpoint. Handles PR and push events.
              </p>
            </div>
            <div className="p-3 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-green-600">POST</Badge>
                <code className="text-sm">/api/v1/pipeline/webhook/github</code>
              </div>
              <p className="text-sm text-muted-foreground">
                GitHub webhook endpoint. Validates X-Hub-Signature-256.
              </p>
            </div>
            <div className="p-3 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-green-600">POST</Badge>
                <code className="text-sm">/api/v1/pipeline/webhook/gitlab</code>
              </div>
              <p className="text-sm text-muted-foreground">
                GitLab webhook endpoint. Validates X-Gitlab-Token header.
              </p>
            </div>
            <div className="p-3 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-green-600">POST</Badge>
                <code className="text-sm">/api/v1/pipeline/analyze</code>
              </div>
              <p className="text-sm text-muted-foreground">
                Manual analysis trigger. Requires authentication. Body: {`{ repositoryId, pullRequestId }`}
              </p>
            </div>
            <div className="p-3 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-blue-600">GET</Badge>
                <code className="text-sm">/api/v1/pipeline/jobs/{"{jobId}"}</code>
              </div>
              <p className="text-sm text-muted-foreground">
                Get analysis job status and result.
              </p>
            </div>
            <div className="p-3 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-blue-600">GET</Badge>
                <code className="text-sm">/actuator/health</code>
              </div>
              <p className="text-sm text-muted-foreground">
                Health check endpoint for load balancers.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Handling */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Error Handling
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            The Pipeline Agent implements robust error handling with retries and fallbacks:
          </p>
          <div className="space-y-3">
            <div className="p-3 border rounded-lg">
              <h4 className="font-medium">Webhook Validation Failure</h4>
              <p className="text-sm text-muted-foreground">
                Returns 401 Unauthorized. Logged for security monitoring.
              </p>
            </div>
            <div className="p-3 border rounded-lg">
              <h4 className="font-medium">VCS API Timeout</h4>
              <p className="text-sm text-muted-foreground">
                Retries 3 times with exponential backoff. Job marked as FAILED after exhausting retries.
              </p>
            </div>
            <div className="p-3 border rounded-lg">
              <h4 className="font-medium">MCP Client Unavailable</h4>
              <p className="text-sm text-muted-foreground">
                Job queued for later retry. Circuit breaker prevents cascade failures.
              </p>
            </div>
            <div className="p-3 border rounded-lg">
              <h4 className="font-medium">Archive Creation Failure</h4>
              <p className="text-sm text-muted-foreground">
                Disk space checked before operation. Temporary files cleaned up on failure.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
