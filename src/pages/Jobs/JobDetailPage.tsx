import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { 
  jobApi, 
  Job, 
  JobLog, 
  JobStatus,
  JobLogLevel 
} from '@/api_service/job/jobApi';
import { useWorkspace } from '@/context/WorkspaceContext';
import { useWorkspaceRoutes } from '@/hooks/useWorkspaceRoutes';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft,
  RefreshCw, 
  Play, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  Loader2,
  Download,
  Ban,
  Terminal,
  Info,
  AlertOctagon
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { cn } from '@/lib/utils';

const JobStatusBadge = ({ status }: { status: JobStatus }) => {
  const variants: Record<JobStatus, { variant: 'default' | 'secondary' | 'destructive' | 'outline', icon: React.ReactNode, className?: string }> = {
    PENDING: { variant: 'secondary', icon: <Clock className="h-3 w-3" /> },
    QUEUED: { variant: 'secondary', icon: <Clock className="h-3 w-3" /> },
    RUNNING: { variant: 'default', icon: <Loader2 className="h-3 w-3 animate-spin" /> },
    COMPLETED: { variant: 'outline', icon: <CheckCircle className="h-3 w-3" />, className: 'border-green-500 text-green-600' },
    FAILED: { variant: 'destructive', icon: <XCircle className="h-3 w-3" /> },
    CANCELLED: { variant: 'secondary', icon: <AlertTriangle className="h-3 w-3" /> },
    WAITING: { variant: 'secondary', icon: <Clock className="h-3 w-3" /> },
    SKIPPED: { variant: 'outline', icon: <Ban className="h-3 w-3" />, className: 'border-yellow-500 text-yellow-600' },
  };

  const { variant, icon, className } = variants[status] || { variant: 'secondary', icon: <Clock className="h-3 w-3" /> };

  return (
    <Badge variant={variant} className={cn("flex items-center gap-1", className)}>
      {icon}
      {status}
    </Badge>
  );
};

const LogLevelIcon = ({ level }: { level: JobLogLevel }) => {
  switch (level) {
    case 'ERROR':
      return <AlertOctagon className="h-4 w-4 text-red-500" />;
    case 'WARN':
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    case 'DEBUG':
      return <Terminal className="h-4 w-4 text-gray-400" />;
    default:
      return <Info className="h-4 w-4 text-blue-500" />;
  }
};

const LogEntry = ({ log }: { log: JobLog }) => {
  const levelColors: Record<JobLogLevel, string> = {
    ERROR: 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800',
    WARN: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800',
    DEBUG: 'bg-gray-50 border-gray-200 dark:bg-gray-900 dark:border-gray-700',
    INFO: 'bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800',
  };

  return (
    <div className={cn(
      "flex items-start gap-3 p-3 border-l-4 rounded-r-md",
      levelColors[log.level]
    )}>
      <LogLevelIcon level={log.level} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
          <span>{format(new Date(log.timestamp), 'HH:mm:ss.SSS')}</span>
          {log.step && (
            <>
              <span>•</span>
              <span className="font-medium">{log.step}</span>
            </>
          )}
          {log.durationMs && (
            <>
              <span>•</span>
              <span>{log.durationMs}ms</span>
            </>
          )}
        </div>
        <p className="text-sm font-mono whitespace-pre-wrap break-words">{log.message}</p>
        {log.metadata && (
          <details className="mt-2">
            <summary className="text-xs text-muted-foreground cursor-pointer">
              Show metadata
            </summary>
            <pre className="text-xs mt-1 p-2 bg-muted rounded overflow-x-auto">
              {JSON.stringify(JSON.parse(log.metadata), null, 2)}
            </pre>
          </details>
        )}
      </div>
      <span className="text-xs text-muted-foreground">#{log.sequenceNumber}</span>
    </div>
  );
};

const formatDuration = (ms?: number): string => {
  if (!ms) return '-';
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  const minutes = Math.floor(ms / 60000);
  const seconds = ((ms % 60000) / 1000).toFixed(0);
  return `${minutes}m ${seconds}s`;
};

export default function JobDetailPage() {
  const { namespace, jobId } = useParams<{ 
    namespace: string;
    jobId: string;
  }>();
  const { currentWorkspace } = useWorkspace();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const routes = useWorkspaceRoutes();
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Get returnTab from URL params for back navigation
  const returnTab = searchParams.get('returnTab');

  const [job, setJob] = useState<Job | null>(null);
  const [logs, setLogs] = useState<JobLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const eventSourceRef = useRef<EventSource | null>(null);

  const fetchJob = useCallback(async () => {
    if (!currentWorkspace || !namespace || !jobId) return;

    try {
      const jobData = await jobApi.getJob(currentWorkspace.slug, namespace, jobId);
      setJob(jobData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load job');
    }
  }, [currentWorkspace, namespace, jobId]);

  const fetchLogs = useCallback(async () => {
    if (!currentWorkspace || !namespace || !jobId) return;

    try {
      const response = await jobApi.getJobLogs(currentWorkspace.slug, namespace, jobId);
      setLogs(response.logs);
    } catch (err) {
      console.error('Failed to fetch logs:', err);
    }
  }, [currentWorkspace, namespace, jobId]);

  const startStreaming = useCallback(() => {
    if (!currentWorkspace || !namespace || !jobId || isStreaming) return;

    const latestSeq = logs.length > 0 ? logs[logs.length - 1].sequenceNumber : 0;

    setIsStreaming(true);
    eventSourceRef.current = jobApi.streamJobLogs(
      currentWorkspace.slug,
      namespace,
      jobId,
      latestSeq,
      (log) => {
        setLogs(prev => {
          // Avoid duplicates
          if (prev.some(l => l.sequenceNumber === log.sequenceNumber)) {
            return prev;
          }
          return [...prev, log];
        });
        
        // Auto-scroll to bottom
        if (autoScroll && scrollRef.current) {
          setTimeout(() => {
            scrollRef.current?.scrollTo({
              top: scrollRef.current.scrollHeight,
              behavior: 'smooth'
            });
          }, 100);
        }
      },
      (status, message) => {
        setIsStreaming(false);
        fetchJob(); // Refresh job to get final status
      },
      (error) => {
        console.error('SSE error:', error);
        setIsStreaming(false);
      }
    );
  }, [currentWorkspace, namespace, jobId, isStreaming, logs, autoScroll, fetchJob]);

  // Initial load
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await fetchJob();
      await fetchLogs();
      setLoading(false);
    };
    load();
  }, [fetchJob, fetchLogs]);

  // Start streaming for running jobs
  useEffect(() => {
    if (job && (job.status === 'RUNNING' || job.status === 'PENDING') && !isStreaming) {
      startStreaming();
    }

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [job, isStreaming, startStreaming]);

  const handleCancel = async () => {
    if (!currentWorkspace || !namespace || !jobId) return;

    try {
      await jobApi.cancelJob(currentWorkspace.slug, namespace, jobId);
      await fetchJob();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel job');
    }
  };

  const downloadLogs = () => {
    const content = logs.map(log => 
      `[${log.timestamp}] [${log.level}] [${log.step || '-'}] ${log.message}`
    ).join('\n');
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `job-${jobId}-logs.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="container mx-auto py-6">
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">{error || 'Job not found'}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Build back URL with returnTab if available
  const getBackUrl = () => {
    if (returnTab) {
      const params = new URLSearchParams();
      params.set('returnTab', returnTab);
      return `${routes.projectDetail(namespace!)}?${params.toString()}`;
    }
    return routes.projectDetail(namespace!);
  };

  const handleBack = (e: React.MouseEvent) => {
    // Allow ctrl+click and middle-click to open in new tab
    if (e.ctrlKey || e.metaKey || e.button === 1) {
      return;
    }
    e.preventDefault();
    if (returnTab) {
      navigate(getBackUrl());
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to={getBackUrl()} onClick={handleBack}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{job.title}</h1>
            <JobStatusBadge status={job.status} />
          </div>
          <p className="text-muted-foreground">
            {job.branchName && `Branch: ${job.branchName}`}
            {job.prNumber && ` • PR #${job.prNumber}`}
            {job.commitHash && ` • Commit: ${job.commitHash.substring(0, 7)}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {(job.status === 'RUNNING' || job.status === 'PENDING') && (
            <Button variant="destructive" size="sm" onClick={handleCancel}>
              <Ban className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={downloadLogs}>
            <Download className="h-4 w-4 mr-2" />
            Download Logs
          </Button>
          <Button variant="outline" size="sm" onClick={() => { fetchJob(); fetchLogs(); }}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Job Info */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Created</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="font-medium">{format(new Date(job.createdAt), 'PPpp')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Duration</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="font-medium">{formatDuration(job.durationMs)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Trigger</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="font-medium capitalize">{job.triggerSource.toLowerCase()}</p>
            {job.triggeredByUsername && (
              <p className="text-sm text-muted-foreground">by {job.triggeredByUsername}</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Progress</CardDescription>
          </CardHeader>
          <CardContent>
            {job.status === 'RUNNING' && job.progress !== undefined ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{job.progress}%</span>
                  {isStreaming && <Loader2 className="h-4 w-4 animate-spin" />}
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all" 
                    style={{ width: `${job.progress}%` }}
                  />
                </div>
                {job.currentStep && (
                  <p className="text-sm text-muted-foreground">{job.currentStep}</p>
                )}
              </div>
            ) : job.status === 'COMPLETED' ? (
              <p className="font-medium text-green-600">100% Complete</p>
            ) : job.status === 'FAILED' ? (
              <p className="font-medium text-red-600">Failed</p>
            ) : (
              <p className="font-medium">-</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Error Message */}
      {job.errorMessage && (
        <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
          <CardHeader>
            <CardTitle className="text-red-600 flex items-center gap-2">
              <XCircle className="h-5 w-5" />
              Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-sm whitespace-pre-wrap font-mono">{job.errorMessage}</pre>
          </CardContent>
        </Card>
      )}

      {/* Logs */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Terminal className="h-5 w-5" />
              Logs
            </CardTitle>
            <CardDescription>
              {logs.length} log entries
              {isStreaming && ' • Streaming live'}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={autoScroll ? 'default' : 'outline'}
              size="sm"
              onClick={() => setAutoScroll(!autoScroll)}
            >
              Auto-scroll: {autoScroll ? 'On' : 'Off'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea 
            ref={scrollRef} 
            className="h-[500px] pr-4"
          >
            <div className="space-y-2">
              {logs.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No logs yet
                </p>
              ) : (
                logs.map((log) => (
                  <LogEntry key={log.id} log={log} />
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Analysis Link */}
      {job.codeAnalysisId && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Analysis Result</p>
                <p className="text-sm text-muted-foreground">
                  View the code analysis generated by this job
                </p>
              </div>
              <Button onClick={() => {
                // Navigate to analysis - adjust path as needed
                navigate(routes.projectDetail(namespace!));
              }}>
                View Analysis
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
