import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, CheckSquare, Square } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useWorkspace } from '@/context/WorkspaceContext';
import { analysisService, type AnalysisIssue } from '@/api_service/analysis/analysisService';
import { useToast } from '@/hooks/use-toast';
import IssuesByFileDisplay from '@/components/IssuesByFileDisplay';
import IssueFilterPanel, { type IssueFilters } from '@/components/IssueFilterPanel';
import { useWorkspaceRoutes } from '@/hooks/useWorkspaceRoutes';

export default function BranchIssues() {
  const { namespace, branchName } = useParams<{ namespace: string; branchName: string }>();
  const navigate = useNavigate();
  const routes = useWorkspaceRoutes();
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentWorkspace } = useWorkspace();
  const { toast } = useToast();
  const [issues, setIssues] = useState<AnalysisIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedIssues, setSelectedIssues] = useState<Set<string>>(new Set());
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalIssues, setTotalIssues] = useState(0);
  const [pageSize] = useState(50);
  const [filters, setFilters] = useState<IssueFilters>({
    severity: 'ALL',
    status: 'open',
    category: 'ALL',
    filePath: '',
    dateFrom: undefined,
    dateTo: undefined,
  });

  useEffect(() => {
    // Read filters from URL first
    const newFilters: IssueFilters = {
      severity: 'ALL',
      status: 'open', // Default to showing only open issues
      category: 'ALL',
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
    
    const categoryParam = searchParams.get('category');
    if (categoryParam) {
      newFilters.category = categoryParam.toUpperCase();
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
    // Load data with the parsed filters
    loadBranchData(newFilters, 1, false);
  }, [namespace, branchName, currentWorkspace]);

  const loadBranchData = async (filterOverrides?: Partial<IssueFilters>, page: number = 1, append: boolean = false) => {
    if (!namespace || !branchName || !currentWorkspace) return;
    
    // Use passed filters or current state
    const activeFilters = { ...filters, ...filterOverrides };
    
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    
    try {
      // Map frontend status to API status parameter
      const apiStatus = activeFilters.status === 'ALL' ? 'all' : activeFilters.status;
      const response = await analysisService.getBranchIssues(
        currentWorkspace.slug,
        namespace,
        decodeURIComponent(branchName),
        apiStatus,
        page,
        pageSize,
        true, // excludeDiff
        {
          severity: activeFilters.severity,
          category: activeFilters.category,
          filePath: activeFilters.filePath,
        }
      );
      
      if (append) {
        setIssues(prev => [...prev, ...response.issues]);
      } else {
        setIssues(response.issues);
      }
      setTotalIssues(response.total);
      setCurrentPage(page);
    } catch (error: any) {
      // If 404, the project/branch doesn't exist in this workspace - navigate away
      if (error.response?.status === 404 || error.status === 404) {
        toast({
          title: "Not found",
          description: "This project or branch doesn't exist in this workspace",
          variant: "destructive",
        });
        navigate(routes.projects());
        return;
      }
      toast({
        title: "Failed to load branch issues",
        description: error.message || "Could not load branch data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMoreIssues = async () => {
    if (issues.length < totalIssues) {
      await loadBranchData(undefined, currentPage + 1, true);
    }
  };

  const handleFiltersChange = (newFilters: IssueFilters) => {
    setFilters(newFilters);
    // Reset pagination and reload data when any filter changes
    setCurrentPage(1);
    loadBranchData(newFilters, 1, false);
    
    const newParams = new URLSearchParams();
    
    if (newFilters.severity !== 'ALL') {
      newParams.set('severity', newFilters.severity);
    }
    // Only add status to URL if it's not the default 'open'
    if (newFilters.status !== 'open') {
      newParams.set('status', newFilters.status);
    }
    if (newFilters.category !== 'ALL') {
      newParams.set('category', newFilters.category);
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
      // Find the issue to get its commit hash for context
      const issueToUpdate = issues.find(i => i.id === issueId);
      const commitHash = issueToUpdate?.commitHash || undefined;
      
      const response = await analysisService.updateIssueStatus(
        currentWorkspace.slug, 
        namespace, 
        issueId, 
        isResolved,
        undefined, // comment
        undefined, // no PR context in branch view
        isResolved ? commitHash : undefined
      );
      
      if (!response.success) {
        throw new Error(response.errorMessage || 'Failed to update issue status');
      }
      
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

  const handleSelectionChange = (issueId: string, selected: boolean) => {
    setSelectedIssues(prev => {
      const next = new Set(prev);
      if (selected) {
        next.add(issueId);
      } else {
        next.delete(issueId);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIssues.size === filteredIssues.length) {
      setSelectedIssues(new Set());
    } else {
      setSelectedIssues(new Set(filteredIssues.map(i => i.id)));
    }
  };

  const handleBulkStatusUpdate = async (newStatus: 'open' | 'resolved') => {
    if (!currentWorkspace || !namespace || selectedIssues.size === 0) return;
    
    setBulkUpdating(true);
    try {
      const isResolved = newStatus === 'resolved';
      const result = await analysisService.bulkUpdateIssueStatus(
        currentWorkspace.slug, 
        namespace, 
        Array.from(selectedIssues),
        isResolved
      );
      
      // Update local state for successful updates
      setIssues(prev => prev.map(issue => 
        selectedIssues.has(issue.id) && !result.failedIds.includes(Number(issue.id))
          ? { ...issue, status: newStatus } 
          : issue
      ));
      
      toast({
        title: "Bulk update complete",
        description: `${result.successCount} issue(s) updated${result.failureCount > 0 ? `, ${result.failureCount} failed` : ''}`,
        variant: result.failureCount > 0 ? "destructive" : "default",
      });
      
      // Clear selection
      setSelectedIssues(new Set());
    } catch (error: any) {
      toast({
        title: "Failed to update issues",
        description: error.message || "Could not update issue statuses",
        variant: "destructive",
      });
    } finally {
      setBulkUpdating(false);
    }
  };

  // Server returns pre-filtered results for status/severity/category/filePath
  // We only apply date filters client-side (not yet supported on backend)
  const filteredIssues = issues.filter(issue => {
    // Date range filter (client-side only)
    const issueDate = issue.createdAt ? new Date(issue.createdAt) : null;
    const matchesDateFrom = !filters.dateFrom || !issueDate || issueDate >= filters.dateFrom;
    const matchesDateTo = !filters.dateTo || !issueDate || issueDate <= filters.dateTo;
    
    return matchesDateFrom && matchesDateTo;
  });

  const handleGoBack = () => {
    // Navigate back to project dashboard with the branch selected and issues tab open
    const params = new URLSearchParams();
    if (branchName) {
      params.set('branch', decodeURIComponent(branchName));
    }
    navigate(`${routes.projectDetail(namespace!)}?${params.toString()}`);
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
    <div className="p-6">
      <Button variant="ghost" onClick={handleGoBack} size="sm" className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Project Dashboard
      </Button>

      <div className="mb-6">
        <h1 className="text-xl font-bold tracking-tight">
          Branch Issues: {decodeURIComponent(branchName || '')}
        </h1>
      </div>

      <div className="flex gap-6">
        {/* Filter Sidebar - Left */}
        <div className="w-64 shrink-0 hidden lg:block self-start">
          <IssueFilterPanel
            filters={filters}
            onFiltersChange={handleFiltersChange}
            issueCount={totalIssues}
          />
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4 pb-4">
              <div className="flex flex-col gap-1">
                <CardTitle>Issues</CardTitle>
                <CardDescription>
                  {totalIssues} total issue{totalIssues !== 1 ? 's' : ''} found
                  {filteredIssues.length !== issues.length && ` (${filteredIssues.length} shown after filters)`}
                </CardDescription>
              </div>
            </CardHeader>
            
            {/* Bulk Action Bar - shows when at least 1 issue is selected */}
            {selectedIssues.size > 0 && (
              <div className="px-6 py-3 bg-muted/50 border-b flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSelectAll}
                  >
                    {selectedIssues.size === filteredIssues.length ? (
                      <>
                        <Square className="mr-2 h-4 w-4" />
                        Deselect All
                      </>
                    ) : (
                      <>
                        <CheckSquare className="mr-2 h-4 w-4" />
                        Select All ({filteredIssues.length})
                      </>
                    )}
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {selectedIssues.size} issue{selectedIssues.size !== 1 ? 's' : ''} selected
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={bulkUpdating}
                    onClick={() => handleBulkStatusUpdate('resolved')}
                  >
                    Mark as Resolved
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={bulkUpdating}
                    onClick={() => handleBulkStatusUpdate('open')}
                  >
                    Mark as Open
                  </Button>
                </div>
              </div>
            )}
            
            <CardContent className={selectedIssues.size > 0 ? "pt-4" : ""}>
              {filteredIssues.length > 0 ? (
                <>
                  <IssuesByFileDisplay 
                    issues={filteredIssues}
                    projectNamespace={namespace || ''}
                    branchName={branchName ? decodeURIComponent(branchName) : undefined}
                    onUpdateIssueStatus={handleUpdateIssueStatus}
                    selectionEnabled={true}
                    selectedIssues={selectedIssues}
                    onSelectionChange={handleSelectionChange}
                  />
                  {/* Load More Button */}
                  {issues.length < totalIssues && (
                    <div className="flex justify-center mt-6">
                      <Button
                        variant="outline"
                        onClick={loadMoreIssues}
                        disabled={loadingMore}
                      >
                        {loadingMore ? 'Loading...' : `Load More (${issues.length} of ${totalIssues})`}
                      </Button>
                    </div>
                  )}
                </>
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
      </div>
    </div>
  );
}
