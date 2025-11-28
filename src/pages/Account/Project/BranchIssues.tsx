import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useWorkspace } from '@/context/WorkspaceContext';
import { analysisService, type AnalysisIssue } from '@/api_service/analysis/analysisService';
import { useToast } from '@/hooks/use-toast';
import IssuesByFileDisplay from '@/components/IssuesByFileDisplay';
import IssueFilterSidebar, { type IssueFilters } from '@/components/IssueFilterSidebar';

export default function BranchIssues() {
  const { namespace, branchName } = useParams<{ namespace: string; branchName: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentWorkspace } = useWorkspace();
  const { toast } = useToast();
  const [issues, setIssues] = useState<AnalysisIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<IssueFilters>({
    severity: 'ALL',
    status: 'open',
    filePath: '',
    dateFrom: undefined,
    dateTo: undefined,
  });

  useEffect(() => {
    loadBranchData();
    
    // Read filters from URL
    const newFilters: IssueFilters = {
      severity: 'ALL',
      status: 'open', // Default to showing only open issues
      filePath: '',
      dateFrom: undefined,
      dateTo: undefined,
    };
    
    const severityParam = searchParams.get('severity');
    if (severityParam && ['HIGH', 'MEDIUM', 'LOW'].includes(severityParam.toUpperCase())) {
      newFilters.severity = severityParam.toUpperCase();
    }
    
    const statusParam = searchParams.get('status');
    if (statusParam && ['open', 'resolved', 'ALL'].includes(statusParam.toLowerCase())) {
      newFilters.status = statusParam.toLowerCase();
    }
    
    const filePathParam = searchParams.get('filePath');
    if (filePathParam) {
      newFilters.filePath = filePathParam;
    }
    
    const dateFromParam = searchParams.get('dateFrom');
    if (dateFromParam) {
      newFilters.dateFrom = new Date(dateFromParam);
    }
    
    const dateToParam = searchParams.get('dateTo');
    if (dateToParam) {
      newFilters.dateTo = new Date(dateToParam);
    }
    
    setFilters(newFilters);
  }, [namespace, branchName, currentWorkspace]);

  const loadBranchData = async () => {
    if (!namespace || !branchName || !currentWorkspace) return;
    
    setLoading(true);
    try {
      const issuesData = await analysisService.getBranchIssues(
        currentWorkspace.slug,
        namespace,
        decodeURIComponent(branchName)
      );
      setIssues(issuesData);
    } catch (error: any) {
      toast({
        title: "Failed to load branch issues",
        description: error.message || "Could not load branch data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFiltersChange = (newFilters: IssueFilters) => {
    setFilters(newFilters);
    const newParams = new URLSearchParams();
    
    if (newFilters.severity !== 'ALL') {
      newParams.set('severity', newFilters.severity);
    }
    // Only add status to URL if it's not the default 'open'
    if (newFilters.status !== 'open') {
      newParams.set('status', newFilters.status);
    }
    if (newFilters.filePath) {
      newParams.set('filePath', newFilters.filePath);
    }
    if (newFilters.dateFrom) {
      newParams.set('dateFrom', newFilters.dateFrom.toISOString());
    }
    if (newFilters.dateTo) {
      newParams.set('dateTo', newFilters.dateTo.toISOString());
    }
    
    setSearchParams(newParams);
  };

  const handleUpdateIssueStatus = async (issueId: string, newStatus: 'open' | 'resolved') => {
    if (!currentWorkspace || !namespace) return;
    
    try {
      const isResolved = newStatus === 'resolved';
      await analysisService.updateIssueStatus(currentWorkspace.slug, namespace, issueId, isResolved);
      setIssues(prev => prev.map(issue => 
        issue.id === issueId ? { ...issue, status: newStatus } : issue
      ));
      toast({
        title: "Success",
        description: "Issue status updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Failed to update issue status",
        description: error.message || "Could not update issue status",
        variant: "destructive",
      });
    }
  };

  const filteredIssues = issues.filter(issue => {
    // Severity filter
    const validSeverities = ['HIGH', 'MEDIUM', 'LOW'];
    const normalizedSeverity = issue.severity?.toUpperCase();
    const matchesSeverity = filters.severity === 'ALL' || 
      (validSeverities.includes(normalizedSeverity || '') && normalizedSeverity === filters.severity);
    
    // Status filter
    const normalizedStatus = issue.status?.toLowerCase();
    const matchesStatus = filters.status === 'ALL' || normalizedStatus === filters.status.toLowerCase();
    
    // File path filter
    const matchesFilePath = !filters.filePath || 
      issue.file?.toLowerCase().includes(filters.filePath.toLowerCase());
    
    // Date range filter
    const issueDate = issue.createdAt ? new Date(issue.createdAt) : null;
    const matchesDateFrom = !filters.dateFrom || !issueDate || issueDate >= filters.dateFrom;
    const matchesDateTo = !filters.dateTo || !issueDate || issueDate <= filters.dateTo;
    
    return matchesSeverity && matchesStatus && matchesFilePath && matchesDateFrom && matchesDateTo;
  });

  const handleGoBack = () => {
    navigate(`/dashboard/projects/${namespace}`);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-32 bg-muted rounded"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <Button variant="ghost" onClick={handleGoBack} size="sm">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Project Dashboard
      </Button>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Branch Issues: {decodeURIComponent(branchName || '')}
        </h1>
        <p className="text-muted-foreground">
          Filter and manage all issues found in this branch
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Branch Issues</CardTitle>
          <IssueFilterSidebar 
            filters={filters}
            onFiltersChange={handleFiltersChange}
            issueCount={filteredIssues.length}
          />
        </CardHeader>
        <CardContent>
          {filteredIssues.length > 0 ? (
            <IssuesByFileDisplay 
              issues={filteredIssues}
              projectNamespace={namespace || ''}
              onUpdateIssueStatus={handleUpdateIssueStatus}
            />
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {issues.length === 0 ? 'No issues found for this branch' : 'No issues match the current filters'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
