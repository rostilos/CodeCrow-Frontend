import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, CheckSquare, Square } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useWorkspace } from '@/context/WorkspaceContext';
import { analysisService, type AnalysisIssue } from '@/api_service/analysis/analysisService';
import { useToast } from '@/hooks/use-toast';
import IssuesByFileDisplay from '@/components/IssuesByFileDisplay';
import IssueFilterPanel, { type IssueFilters } from '@/components/IssueFilterPanel';

export default function BranchIssues() {
  const { namespace, branchName } = useParams<{ namespace: string; branchName: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentWorkspace } = useWorkspace();
  const { toast } = useToast();
  const [issues, setIssues] = useState<AnalysisIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIssues, setSelectedIssues] = useState<Set<string>>(new Set());
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const [filters, setFilters] = useState<IssueFilters>({
    severity: 'ALL',
    status: 'open',
    category: 'ALL',
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
  }, [namespace, branchName, currentWorkspace]);

  const loadBranchData = async (statusFilter: string = filters.status) => {
    if (!namespace || !branchName || !currentWorkspace) return;
    
    setLoading(true);
    try {
      // Map frontend status to API status parameter
      const apiStatus = statusFilter === 'ALL' ? 'all' : statusFilter;
      const issuesData = await analysisService.getBranchIssues(
        currentWorkspace.slug,
        namespace,
        decodeURIComponent(branchName),
        apiStatus
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
    // Reload data when status filter changes
    if (newFilters.status !== filters.status) {
      loadBranchData(newFilters.status);
    }
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

  const filteredIssues = issues.filter(issue => {
    // Severity filter
    const validSeverities = ['HIGH', 'MEDIUM', 'LOW'];
    const normalizedSeverity = issue.severity?.toUpperCase();
    const matchesSeverity = filters.severity === 'ALL' || 
      (validSeverities.includes(normalizedSeverity || '') && normalizedSeverity === filters.severity);
    
    // Status filter
    const normalizedStatus = issue.status?.toLowerCase();
    const matchesStatus = filters.status === 'ALL' || normalizedStatus === filters.status.toLowerCase();
    
    // Category filter
    const issueCategory = issue.issueCategory?.toUpperCase().replace(/[- ]/g, '_') || 'CODE_QUALITY';
    const matchesCategory = filters.category === 'ALL' || issueCategory === filters.category;
    
    // File path filter
    const matchesFilePath = !filters.filePath || 
      issue.file?.toLowerCase().includes(filters.filePath.toLowerCase());
    
    // Date range filter
    const issueDate = issue.createdAt ? new Date(issue.createdAt) : null;
    const matchesDateFrom = !filters.dateFrom || !issueDate || issueDate >= filters.dateFrom;
    const matchesDateTo = !filters.dateTo || !issueDate || issueDate <= filters.dateTo;
    
    return matchesSeverity && matchesStatus && matchesCategory && matchesFilePath && matchesDateFrom && matchesDateTo;
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
        {/* Main content */}
        <div className="flex-1 min-w-0">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4 pb-4">
              <div className="flex items-center gap-4">
                <CardTitle>Issues</CardTitle>
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
                <IssuesByFileDisplay 
                  issues={filteredIssues}
                  projectNamespace={namespace || ''}
                  onUpdateIssueStatus={handleUpdateIssueStatus}
                  selectionEnabled={true}
                  selectedIssues={selectedIssues}
                  onSelectionChange={handleSelectionChange}
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
        
        {/* Filter Sidebar */}
        <div className="w-72 shrink-0">
          <IssueFilterPanel
            filters={filters}
            onFiltersChange={handleFiltersChange}
            issueCount={filteredIssues.length}
            className="sticky top-6"
          />
        </div>
      </div>
    </div>
  );
}
