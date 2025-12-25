import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  jobApi, 
  Job, 
  JobStatus, 
  JobType,
  JobFilters 
} from '@/api_service/job/jobApi';
import { useWorkspace } from '@/context/WorkspaceContext';
import { useWorkspaceRoutes } from '@/hooks/useWorkspaceRoutes';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  ChevronLeft, 
  ChevronRight, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

const JobStatusBadge = ({ status }: { status: JobStatus }) => {
  const variants: Record<JobStatus, { variant: 'default' | 'secondary' | 'destructive' | 'outline', icon: React.ReactNode }> = {
    PENDING: { variant: 'secondary', icon: <Clock className="h-3 w-3" /> },
    QUEUED: { variant: 'secondary', icon: <Clock className="h-3 w-3" /> },
    RUNNING: { variant: 'default', icon: <Loader2 className="h-3 w-3 animate-spin" /> },
    COMPLETED: { variant: 'outline', icon: <CheckCircle className="h-3 w-3 text-green-500" /> },
    FAILED: { variant: 'destructive', icon: <XCircle className="h-3 w-3" /> },
    CANCELLED: { variant: 'secondary', icon: <AlertTriangle className="h-3 w-3" /> },
    WAITING: { variant: 'secondary', icon: <Clock className="h-3 w-3" /> },
  };

  const { variant, icon } = variants[status];

  return (
    <Badge variant={variant} className="flex items-center gap-1">
      {icon}
      {status}
    </Badge>
  );
};

const JobTypeBadge = ({ type }: { type: JobType }) => {
  const labels: Record<JobType, string> = {
    PR_ANALYSIS: 'PR Analysis',
    BRANCH_ANALYSIS: 'Branch Analysis',
    BRANCH_RECONCILIATION: 'Branch Reconciliation',
    RAG_INITIAL_INDEX: 'Initial Indexing',
    RAG_INCREMENTAL_INDEX: 'Incremental Index',
    MANUAL_ANALYSIS: 'Manual Analysis',
    REPO_SYNC: 'Repo Sync',
  };

  return <Badge variant="outline">{labels[type]}</Badge>;
};

const formatDuration = (ms?: number): string => {
  if (!ms) return '-';
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  const minutes = Math.floor(ms / 60000);
  const seconds = ((ms % 60000) / 1000).toFixed(0);
  return `${minutes}m ${seconds}s`;
};

interface JobsListProps {
  projectNamespace: string;
  compact?: boolean;
  maxItems?: number;
}

export default function JobsList({ projectNamespace, compact = false, maxItems }: JobsListProps) {
  const { currentWorkspace } = useWorkspace();
  const navigate = useNavigate();
  const routes = useWorkspaceRoutes();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [statusFilter, setStatusFilter] = useState<JobStatus | 'ALL'>('ALL');
  const [typeFilter, setTypeFilter] = useState<JobType | 'ALL'>('ALL');

  const fetchJobs = useCallback(async () => {
    if (!currentWorkspace || !projectNamespace) return;

    setLoading(true);
    setError(null);

    try {
      const filters: JobFilters = {
        page,
        size: maxItems || 20,
        ...(statusFilter !== 'ALL' && { status: statusFilter }),
        ...(typeFilter !== 'ALL' && { type: typeFilter }),
      };

      const response = await jobApi.listProjectJobs(currentWorkspace.slug, projectNamespace, filters);
      setJobs(response.jobs);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load jobs');
    } finally {
      setLoading(false);
    }
  }, [currentWorkspace, projectNamespace, page, statusFilter, typeFilter, maxItems]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // Auto-refresh for running jobs
  useEffect(() => {
    const hasRunningJobs = jobs.some(j => j.status === 'RUNNING' || j.status === 'PENDING');
    if (!hasRunningJobs) return;

    const interval = setInterval(fetchJobs, 5000);
    return () => clearInterval(interval);
  }, [jobs, fetchJobs]);

  const handleJobClick = (jobId: string) => {
    navigate(routes.projectJobDetail(projectNamespace, jobId));
  };

  if (loading && jobs.length === 0) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="pt-6">
          <p className="text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters and Refresh */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex gap-2 flex-wrap">
          <Select 
            value={statusFilter} 
            onValueChange={(v) => { setStatusFilter(v as JobStatus | 'ALL'); setPage(0); }}
          >
            <SelectTrigger className="w-32 h-8">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="RUNNING">Running</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="FAILED">Failed</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>

          <Select 
            value={typeFilter} 
            onValueChange={(v) => { setTypeFilter(v as JobType | 'ALL'); setPage(0); }}
          >
            <SelectTrigger className="w-40 h-8">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Types</SelectItem>
              <SelectItem value="PR_ANALYSIS">PR Analysis</SelectItem>
              <SelectItem value="BRANCH_ANALYSIS">Branch Analysis</SelectItem>
              <SelectItem value="RAG_INITIAL_INDEX">Initial Indexing</SelectItem>
              <SelectItem value="RAG_INCREMENTAL_INDEX">Incremental Index</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={fetchJobs} variant="outline" size="sm" className="h-8">
          <RefreshCw className={`h-3 w-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Jobs Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Job</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              {!compact && <TableHead>Progress</TableHead>}
              <TableHead>Duration</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={compact ? 5 : 6} className="text-center py-8 text-muted-foreground">
                  No jobs found
                </TableCell>
              </TableRow>
            ) : (
              jobs.map((job) => (
                <TableRow 
                  key={job.id} 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleJobClick(job.id)}
                >
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm">{job.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {job.branchName && `${job.branchName}`}
                        {job.prNumber && ` • PR #${job.prNumber}`}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <JobTypeBadge type={job.jobType} />
                  </TableCell>
                  <TableCell>
                    <JobStatusBadge status={job.status} />
                  </TableCell>
                  {!compact && (
                    <TableCell>
                      {job.status === 'RUNNING' && job.progress !== undefined ? (
                        <div className="flex items-center gap-2">
                          <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary transition-all" 
                              style={{ width: `${job.progress}%` }}
                            />
                          </div>
                          <span className="text-xs">{job.progress}%</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs">-</span>
                      )}
                    </TableCell>
                  )}
                  <TableCell className="text-sm">{formatDuration(job.durationMs)}</TableCell>
                  <TableCell>
                    <span className="text-xs" title={format(new Date(job.createdAt), 'PPpp')}>
                      {formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}
                    </span>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && !maxItems && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Showing {jobs.length} of {totalElements} jobs
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-7"
              disabled={page === 0}
              onClick={() => setPage(p => p - 1)}
            >
              <ChevronLeft className="h-3 w-3" />
              Previous
            </Button>
            <span className="text-xs">
              Page {page + 1} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="h-7"
              disabled={page >= totalPages - 1}
              onClick={() => setPage(p => p + 1)}
            >
              Next
              <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
