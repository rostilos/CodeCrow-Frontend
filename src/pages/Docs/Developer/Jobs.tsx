import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, Play, CheckCircle2, XCircle, AlertTriangle, Pause, RefreshCw, GitPullRequest, GitBranch, Database, ArrowRight, Loader2, Info } from "lucide-react";

export default function Jobs() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-yellow-500/10">
            <Clock className="h-6 w-6 text-yellow-500" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Jobs System</h1>
            <p className="text-muted-foreground mt-1">
              Understanding analysis and indexing jobs lifecycle
            </p>
          </div>
        </div>
      </div>

      {/* Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            CodeCrow uses an asynchronous job system to handle long-running operations like PR analysis
            and code indexing. Jobs are created when triggered by webhooks or manual requests, and progress
            through a defined lifecycle until completion or failure.
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <GitPullRequest className="h-5 w-5 text-primary mb-2" />
              <h4 className="font-medium">Analysis Jobs</h4>
              <p className="text-sm text-muted-foreground">
                PR and commit code reviews. Triggered by webhooks or manual request.
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <GitBranch className="h-5 w-5 text-primary mb-2" />
              <h4 className="font-medium">Indexing Jobs</h4>
              <p className="text-sm text-muted-foreground">
                RAG index operations. Triggered by branch push or manual reindex.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Job States */}
      <Card>
        <CardHeader>
          <CardTitle>Job States</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 bg-muted/50 rounded-lg overflow-x-auto">
            <pre className="text-sm whitespace-pre">
{`┌─────────┐     ┌───────────────┐     ┌──────────────┐
│ PENDING │────▶│ FETCHING_DATA │────▶│  PREPARING   │
└─────────┘     └───────────────┘     └──────────────┘
                                             │
                                             ▼
                                      ┌──────────────┐
                                      │  ANALYZING   │
                                      └──────────────┘
                                             │
                          ┌──────────────────┼──────────────────┐
                          ▼                  ▼                  ▼
                   ┌──────────────┐  ┌───────────────┐  ┌──────────────┐
                   │  COMPLETED   │  │ POSTING_RESULTS│  │   FAILED     │
                   │     ✓        │  └───────┬───────┘  │     ✗        │
                   └──────────────┘          │          └──────────────┘
                                             │
                                             ▼
                                      ┌──────────────┐
                                      │  COMPLETED   │
                                      │     ✓        │
                                      └──────────────┘`}
            </pre>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-4 p-3 border rounded-lg">
              <Badge variant="outline" className="w-32 justify-center">
                <Clock className="h-3 w-3 mr-1" />
                PENDING
              </Badge>
              <p className="text-sm text-muted-foreground">Job created, waiting to start processing</p>
            </div>
            <div className="flex items-center gap-4 p-3 border rounded-lg">
              <Badge variant="outline" className="w-32 justify-center bg-blue-500/10">
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                FETCHING_DATA
              </Badge>
              <p className="text-sm text-muted-foreground">Retrieving PR diff and files from VCS</p>
            </div>
            <div className="flex items-center gap-4 p-3 border rounded-lg">
              <Badge variant="outline" className="w-32 justify-center bg-blue-500/10">
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                PREPARING
              </Badge>
              <p className="text-sm text-muted-foreground">Creating analysis archive, preparing context</p>
            </div>
            <div className="flex items-center gap-4 p-3 border rounded-lg">
              <Badge variant="outline" className="w-32 justify-center bg-purple-500/10">
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                ANALYZING
              </Badge>
              <p className="text-sm text-muted-foreground">MCP Client performing AI analysis</p>
            </div>
            <div className="flex items-center gap-4 p-3 border rounded-lg">
              <Badge variant="outline" className="w-32 justify-center bg-orange-500/10">
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                POSTING_RESULTS
              </Badge>
              <p className="text-sm text-muted-foreground">Posting review comments to VCS platform</p>
            </div>
            <div className="flex items-center gap-4 p-3 border rounded-lg bg-green-500/5">
              <Badge className="w-32 justify-center bg-green-500">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                COMPLETED
              </Badge>
              <p className="text-sm text-muted-foreground">Job finished successfully</p>
            </div>
            <div className="flex items-center gap-4 p-3 border rounded-lg bg-red-500/5">
              <Badge className="w-32 justify-center bg-red-500">
                <XCircle className="h-3 w-3 mr-1" />
                FAILED
              </Badge>
              <p className="text-sm text-muted-foreground">Job encountered an error</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Job Types */}
      <Card>
        <CardHeader>
          <CardTitle>Job Types</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="pr_analysis" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="pr_analysis">PR Analysis</TabsTrigger>
              <TabsTrigger value="branch_index">Branch Index</TabsTrigger>
              <TabsTrigger value="full_reindex">Full Reindex</TabsTrigger>
            </TabsList>

            <TabsContent value="pr_analysis" className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <GitPullRequest className="h-5 w-5" />
                <h4 className="font-medium">Pull Request Analysis</h4>
              </div>
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h5 className="font-medium text-sm mb-2">Triggers</h5>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• PR created (webhook)</li>
                      <li>• PR updated with new commits</li>
                      <li>• Manual trigger from dashboard</li>
                      <li>• Comment command: <code>/codecrow review</code></li>
                    </ul>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h5 className="font-medium text-sm mb-2">Output</h5>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Inline review comments</li>
                      <li>• Summary review on PR</li>
                      <li>• Quality gate status (pass/fail)</li>
                      <li>• Job result in database</li>
                    </ul>
                  </div>
                </div>
                <pre className="p-4 bg-muted rounded-lg text-xs overflow-x-auto">
{`// Job Entity for PR Analysis
@Entity
@Table(name = "analysis_jobs")
public class AnalysisJob {
    @Id
    private UUID id;
    
    @Enumerated(EnumType.STRING)
    private JobType type = JobType.PULL_REQUEST_ANALYSIS;
    
    @Enumerated(EnumType.STRING)
    private JobStatus status;
    
    @ManyToOne
    private Project project;
    
    private String pullRequestId;
    private String sourceBranch;
    private String targetBranch;
    private String commitHash;
    
    @Column(columnDefinition = "jsonb")
    private String result;  // AnalysisResult JSON
    
    private String errorMessage;
    
    private Instant createdAt;
    private Instant startedAt;
    private Instant completedAt;
}`}
                </pre>
              </div>
            </TabsContent>

            <TabsContent value="branch_index" className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <GitBranch className="h-5 w-5" />
                <h4 className="font-medium">Branch Indexing</h4>
              </div>
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h5 className="font-medium text-sm mb-2">Triggers</h5>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Push to configured branch (webhook)</li>
                      <li>• Manual index from dashboard</li>
                      <li>• Project setup (initial index)</li>
                    </ul>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h5 className="font-medium text-sm mb-2">Output</h5>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Updated RAG index in Qdrant</li>
                      <li>• Index metadata in database</li>
                      <li>• Statistics (files, chunks)</li>
                    </ul>
                  </div>
                </div>
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>Index Updates</AlertTitle>
                  <AlertDescription>
                    Branch indexing updates the project's single collection in Qdrant. 
                    Changed files have their vectors replaced; unchanged files are preserved.
                  </AlertDescription>
                </Alert>
              </div>
            </TabsContent>

            <TabsContent value="full_reindex" className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <RefreshCw className="h-5 w-5" />
                <h4 className="font-medium">Full Reindex</h4>
              </div>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Complete reindex of the repository. Deletes existing collection and creates fresh index.
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h5 className="font-medium text-sm mb-2">When to Use</h5>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• After major codebase restructuring</li>
                      <li>• Embedding model changes</li>
                      <li>• Chunking strategy updates</li>
                      <li>• Index corruption recovery</li>
                    </ul>
                  </div>
                  <div className="p-4 border rounded-lg border-yellow-500/30 bg-yellow-500/5">
                    <h5 className="font-medium text-sm mb-2 text-yellow-600">⚠️ Considerations</h5>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Takes longer than incremental</li>
                      <li>• Uses more API calls (embeddings)</li>
                      <li>• Brief period without RAG context</li>
                    </ul>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Database Schema */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Database Tables
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <pre className="p-4 bg-muted rounded-lg text-xs overflow-x-auto">
{`-- Analysis Jobs Table
CREATE TABLE analysis_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(50) NOT NULL,  -- PULL_REQUEST_ANALYSIS, BRANCH_INDEX, FULL_REINDEX
    status VARCHAR(50) NOT NULL,
    project_id UUID NOT NULL REFERENCES projects(id),
    
    -- PR Analysis fields
    pull_request_id VARCHAR(100),
    source_branch VARCHAR(255),
    target_branch VARCHAR(255),
    commit_hash VARCHAR(40),
    
    -- Result storage
    result JSONB,           -- Full analysis result
    comments_count INTEGER DEFAULT 0,
    
    -- Error handling
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Metrics
    duration_ms BIGINT,
    tokens_used INTEGER,
    
    CONSTRAINT fk_project FOREIGN KEY (project_id) REFERENCES projects(id)
);

CREATE INDEX idx_jobs_project_status ON analysis_jobs(project_id, status);
CREATE INDEX idx_jobs_created_at ON analysis_jobs(created_at DESC);
CREATE INDEX idx_jobs_pr ON analysis_jobs(pull_request_id) WHERE pull_request_id IS NOT NULL;`}
          </pre>
        </CardContent>
      </Card>

      {/* API for Job Management */}
      <Card>
        <CardHeader>
          <CardTitle>Job Management API</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="p-3 border rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-blue-600">GET</Badge>
              <code className="text-sm">/api/projects/{"{id}"}/jobs</code>
            </div>
            <p className="text-sm text-muted-foreground">
              List jobs for a project. Supports pagination and status filtering.
            </p>
          </div>
          <div className="p-3 border rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-blue-600">GET</Badge>
              <code className="text-sm">/api/jobs/{"{jobId}"}</code>
            </div>
            <p className="text-sm text-muted-foreground">
              Get job details including status, result, and error message.
            </p>
          </div>
          <div className="p-3 border rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-green-600">POST</Badge>
              <code className="text-sm">/api/projects/{"{id}"}/jobs/analyze</code>
            </div>
            <p className="text-sm text-muted-foreground">
              Trigger manual PR analysis. Body: <code>{`{ pullRequestId }`}</code>
            </p>
          </div>
          <div className="p-3 border rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-green-600">POST</Badge>
              <code className="text-sm">/api/projects/{"{id}"}/jobs/index</code>
            </div>
            <p className="text-sm text-muted-foreground">
              Trigger branch indexing. Body: <code>{`{ branch?, fullReindex? }`}</code>
            </p>
          </div>
          <div className="p-3 border rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-green-600">POST</Badge>
              <code className="text-sm">/api/jobs/{"{jobId}"}/retry</code>
            </div>
            <p className="text-sm text-muted-foreground">
              Retry a failed job. Only available for jobs in FAILED status.
            </p>
          </div>
          <div className="p-3 border rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-red-600">DELETE</Badge>
              <code className="text-sm">/api/jobs/{"{jobId}"}</code>
            </div>
            <p className="text-sm text-muted-foreground">
              Cancel a pending or in-progress job.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Error Handling & Retries */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Error Handling & Retries
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Jobs implement automatic retry logic for transient failures:
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Error Type</th>
                  <th className="text-left p-2">Retries</th>
                  <th className="text-left p-2">Backoff</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="p-2">VCS API timeout</td>
                  <td className="p-2">3</td>
                  <td className="p-2">Exponential (1s, 2s, 4s)</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2">MCP Client unavailable</td>
                  <td className="p-2">3</td>
                  <td className="p-2">Exponential (5s, 10s, 20s)</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2">LLM rate limit</td>
                  <td className="p-2">5</td>
                  <td className="p-2">Per Retry-After header</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2">RAG Pipeline error</td>
                  <td className="p-2">2</td>
                  <td className="p-2">Linear (5s)</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2">Authentication error</td>
                  <td className="p-2">0</td>
                  <td className="p-2">Immediate fail</td>
                </tr>
              </tbody>
            </table>
          </div>
          <pre className="p-4 bg-muted rounded-lg text-xs overflow-x-auto">
{`@Service
public class JobRetryService {
    
    @Retryable(
        value = {TransientException.class},
        maxAttempts = 3,
        backoff = @Backoff(delay = 1000, multiplier = 2)
    )
    public void executeWithRetry(AnalysisJob job) {
        try {
            analysisService.execute(job);
        } catch (RateLimitException e) {
            job.incrementRetryCount();
            throw e;  // Will be retried
        } catch (AuthenticationException e) {
            job.setStatus(JobStatus.FAILED);
            job.setErrorMessage("Authentication failed: " + e.getMessage());
            throw new NonRetryableException(e);
        }
    }
    
    @Recover
    public void handleMaxRetries(TransientException e, AnalysisJob job) {
        job.setStatus(JobStatus.FAILED);
        job.setErrorMessage("Max retries exceeded: " + e.getMessage());
        notificationService.notifyJobFailed(job);
    }
}`}
          </pre>
        </CardContent>
      </Card>

      {/* Monitoring */}
      <Card>
        <CardHeader>
          <CardTitle>Monitoring & Metrics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Key metrics exposed for job monitoring:
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Job Metrics</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• <code>codecrow_jobs_total</code> - Total jobs by type/status</li>
                <li>• <code>codecrow_job_duration_seconds</code> - Job execution time</li>
                <li>• <code>codecrow_jobs_pending</code> - Current pending queue size</li>
                <li>• <code>codecrow_job_retries_total</code> - Retry attempts</li>
              </ul>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Alerts</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Job queue depth &gt; 100</li>
                <li>• Failure rate &gt; 10%</li>
                <li>• Average duration &gt; 5 minutes</li>
                <li>• Stuck jobs (&gt; 15 min in-progress)</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
