import { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  AlertCircle, 
  CheckCircle, 
  CheckSquare, 
  Square, 
  FileText, 
  ExternalLink,
  GitBranch,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import IssueFilterPanel, { IssueFilters } from '@/components/IssueFilterPanel';
import IssuesByFileDisplay from '@/components/IssuesByFileDisplay';
import { AnalysisIssue, AnalysisIssueSummary } from '@/api_service/analysis/analysisService';
import { VcsProvider } from '@/api_service/project/projectService';

// Helper function to build VCS PR URL
export function buildVcsPrUrl(
  vcsProvider: VcsProvider | null | undefined, 
  vcsWorkspace: string | undefined, 
  repoSlug: string | undefined, 
  prNumber: number
): string | null {
  if (!vcsProvider || !vcsWorkspace || !repoSlug) return null;
  
  switch (vcsProvider) {
    case 'BITBUCKET_CLOUD':
      return `https://bitbucket.org/${vcsWorkspace}/${repoSlug}/pull-requests/${prNumber}`;
    case 'GITHUB':
      return `https://github.com/${vcsWorkspace}/${repoSlug}/pull/${prNumber}`;
    case 'GITLAB':
      return `https://gitlab.com/${vcsWorkspace}/${repoSlug}/-/merge_requests/${prNumber}`;
    default:
      return null;
  }
}

export interface IssueListWithFiltersProps {
  // Data
  issues: AnalysisIssue[];
  totalCount?: number;
  issueSummary?: AnalysisIssueSummary | null;
  
  // Loading state
  loading?: boolean;
  
  // Filtering
  filters: IssueFilters;
  onFiltersChange: (filters: IssueFilters) => void;
  serverSideFiltering?: boolean; // If true, don't filter client-side
  
  // Pagination
  hasMore?: boolean;
  onLoadMore?: () => void;
  loadingMore?: boolean;
  
  // Selection
  enableSelection?: boolean;
  selectedIssues?: Set<string>;
  onSelectionChange?: (selected: Set<string>) => void;
  onBulkAction?: (action: string, issueIds: string[]) => void;
  
  // Navigation
  onIssueClick?: (issue: AnalysisIssue) => void;
  issueDetailRoute?: (issue: AnalysisIssue) => string;
  
  // Issue display context
  projectNamespace?: string;
  branchName?: string;
  prVersion?: number;
  onUpdateIssueStatus?: (issueId: string, status: 'open' | 'resolved') => void;
  
  // Header
  title?: string;
  description?: string;
  headerActions?: React.ReactNode;
  
  // PR Info (for VCS link)
  prNumber?: number;
  vcsProvider?: VcsProvider | null;
  vcsWorkspace?: string;
  repoSlug?: string;
  sourceBranch?: string;
  targetBranch?: string;
  commitHash?: string;
  analysisSummary?: string;
  
  // Layout
  showFilterPanel?: boolean;
  className?: string;
}

export default function IssueListWithFilters({
  issues,
  totalCount,
  issueSummary,
  loading = false,
  filters,
  onFiltersChange,
  serverSideFiltering = true,
  hasMore = false,
  onLoadMore,
  loadingMore = false,
  enableSelection = false,
  selectedIssues = new Set(),
  onSelectionChange,
  onBulkAction,
  onIssueClick,
  issueDetailRoute,
  projectNamespace,
  branchName,
  prVersion,
  onUpdateIssueStatus,
  title = 'Issues',
  description,
  headerActions,
  prNumber,
  vcsProvider,
  vcsWorkspace,
  repoSlug,
  sourceBranch,
  targetBranch,
  commitHash,
  analysisSummary,
  showFilterPanel = true,
  className,
}: IssueListWithFiltersProps) {
  const navigate = useNavigate();

  // Client-side filtering (only if serverSideFiltering is false)
  const filteredIssues = useMemo(() => {
    if (serverSideFiltering) return issues;
    
    return issues.filter((issue) => {
      // Severity filter
      if (filters.severity !== 'ALL' && issue.severity?.toUpperCase() !== filters.severity) {
        return false;
      }
      
      // Status filter
      if (filters.status === 'open' && issue.status === 'resolved') return false;
      if (filters.status === 'resolved' && issue.status !== 'resolved') return false;
      
      // Category filter
      if (filters.category !== 'ALL' && issue.issueCategory?.toUpperCase() !== filters.category) {
        return false;
      }
      
      // File path filter
      if (filters.filePath && !issue.file?.toLowerCase().includes(filters.filePath.toLowerCase())) {
        return false;
      }
      
      // Date filters
      if (filters.dateFrom) {
        const issueDate = new Date(issue.createdAt);
        if (issueDate < filters.dateFrom) return false;
      }
      
      if (filters.dateTo) {
        const issueDate = new Date(issue.createdAt);
        if (issueDate > filters.dateTo) return false;
      }
      
      return true;
    });
  }, [issues, filters, serverSideFiltering]);

  const displayIssues = serverSideFiltering ? issues : filteredIssues;
  const displayCount = totalCount ?? displayIssues.length;

  // Selection handlers
  const handleSelectAll = useCallback(() => {
    if (!onSelectionChange) return;
    
    if (selectedIssues.size === displayIssues.length) {
      onSelectionChange(new Set());
    } else {
      onSelectionChange(new Set(displayIssues.map(i => i.id)));
    }
  }, [selectedIssues, displayIssues, onSelectionChange]);

  const handleToggleIssue = useCallback((issueId: string, selected: boolean) => {
    if (!onSelectionChange) return;
    
    const newSelected = new Set(selectedIssues);
    if (selected) {
      newSelected.add(issueId);
    } else {
      newSelected.delete(issueId);
    }
    onSelectionChange(newSelected);
  }, [selectedIssues, onSelectionChange]);

  const handleIssueClick = useCallback((issue: AnalysisIssue) => {
    if (onIssueClick) {
      onIssueClick(issue);
    } else if (issueDetailRoute) {
      navigate(issueDetailRoute(issue));
    }
  }, [onIssueClick, issueDetailRoute, navigate]);

  // Build VCS URL
  const vcsPrUrl = prNumber ? buildVcsPrUrl(vcsProvider, vcsWorkspace, repoSlug, prNumber) : null;

  // Summary stats from issueSummary or calculate from issues
  const summaryStats = useMemo(() => {
    if (issueSummary) {
      return {
        high: issueSummary.highCount,
        medium: issueSummary.mediumCount,
        low: issueSummary.lowCount,
      };
    }
    return {
      high: displayIssues.filter(i => i.severity?.toUpperCase() === 'HIGH').length,
      medium: displayIssues.filter(i => i.severity?.toUpperCase() === 'MEDIUM').length,
      low: displayIssues.filter(i => i.severity?.toUpperCase() === 'LOW').length,
    };
  }, [issueSummary, displayIssues]);

  return (
    <div className={cn("flex gap-6", className)}>
      {/* Filter Sidebar */}
      {showFilterPanel && (
        <div className="w-64 shrink-0 hidden lg:block self-start">
          <IssueFilterPanel
            filters={filters}
            onFiltersChange={onFiltersChange}
            issueCount={displayCount}
          />
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  {prNumber ? (
                    <>
                      PR #{prNumber}
                      {vcsPrUrl && (
                        <a 
                          href={vcsPrUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-primary transition-colors"
                          title={`Open PR #${prNumber} in ${vcsProvider?.replace('_', ' ')}`}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                    </>
                  ) : (
                    title
                  )}
                </CardTitle>
                <CardDescription className="mt-1">
                  {sourceBranch && targetBranch && (
                    <span className="flex items-center gap-2">
                      <GitBranch className="h-3 w-3" />
                      {sourceBranch} → {targetBranch}
                    </span>
                  )}
                  {commitHash && (
                    <span className="flex items-center gap-1 mt-1">
                      <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{commitHash.slice(0, 7)}</code>
                    </span>
                  )}
                  {description || `${displayCount} issue${displayCount !== 1 ? 's' : ''} found`}
                </CardDescription>
              </div>

              {/* Summary Stats */}
              <div className="text-right text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <AlertCircle className="h-4 w-4" />
                  <span>{displayCount} issues found</span>
                </div>
                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                  <span className="text-red-500">{summaryStats.high} high</span>
                  <span className="text-yellow-500">{summaryStats.medium} medium</span>
                  <span className="text-green-500">{summaryStats.low} low</span>
                </div>
              </div>
            </div>

            {/* Header Actions */}
            {(headerActions || enableSelection) && (
              <div className="flex items-center gap-2 mt-4">
                {enableSelection && displayIssues.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAll}
                    className="flex items-center gap-2"
                  >
                    {selectedIssues.size === displayIssues.length ? (
                      <CheckSquare className="h-4 w-4" />
                    ) : (
                      <Square className="h-4 w-4" />
                    )}
                    {selectedIssues.size === displayIssues.length ? 'Deselect All' : `Select All (${displayIssues.length})`}
                  </Button>
                )}
                {enableSelection && selectedIssues.size > 0 && onBulkAction && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onBulkAction('resolve', Array.from(selectedIssues))}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Resolve ({selectedIssues.size})
                    </Button>
                  </>
                )}
                {headerActions}
              </div>
            )}
          </CardHeader>

          <CardContent>
            {/* Analysis Summary */}
            {analysisSummary && (
              <div className="mb-6 p-4 bg-muted/50 rounded-lg">
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Analysis Summary
                </h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{analysisSummary}</p>
              </div>
            )}

            {/* Loading State */}
            {loading ? (
              <div className="text-center py-12 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                Loading issues...
              </div>
            ) : displayIssues.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                <p className="text-lg font-medium">No issues found</p>
                <p className="text-sm">Great job! Everything looks clean.</p>
              </div>
            ) : (
              <>
                {/* Issue Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-muted/50 rounded-lg p-3 text-center">
                    <p className="text-xs text-muted-foreground">Total Issues</p>
                    <p className="text-2xl font-bold mt-1">{displayCount}</p>
                  </div>
                  <div className="bg-red-500/10 rounded-lg p-3 text-center">
                    <p className="text-xs text-red-600 dark:text-red-400">High Severity</p>
                    <p className="text-2xl font-bold mt-1 text-red-600 dark:text-red-400">
                      {summaryStats.high}
                    </p>
                  </div>
                  <div className="bg-yellow-500/10 rounded-lg p-3 text-center">
                    <p className="text-xs text-yellow-600 dark:text-yellow-400">Medium Severity</p>
                    <p className="text-2xl font-bold mt-1 text-yellow-600 dark:text-yellow-400">
                      {summaryStats.medium}
                    </p>
                  </div>
                  <div className="bg-green-500/10 rounded-lg p-3 text-center">
                    <p className="text-xs text-green-600 dark:text-green-400">Low Severity</p>
                    <p className="text-2xl font-bold mt-1 text-green-600 dark:text-green-400">
                      {summaryStats.low}
                    </p>
                  </div>
                </div>

                <Separator className="my-4" />

                {/* Issue List using existing IssuesByFileDisplay component */}
                <IssuesByFileDisplay
                  issues={displayIssues}
                  projectNamespace={projectNamespace || ''}
                  branchName={branchName}
                  prNumber={prNumber}
                  prVersion={prVersion}
                  onUpdateIssueStatus={onUpdateIssueStatus}
                  selectionEnabled={enableSelection}
                  selectedIssues={selectedIssues}
                  onSelectionChange={handleToggleIssue}
                />

                {/* Load More */}
                {hasMore && onLoadMore && (
                  <div className="mt-4 text-center">
                    <Button
                      variant="outline"
                      onClick={onLoadMore}
                      disabled={loadingMore}
                    >
                      {loadingMore ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        `Load More (${displayIssues.length} of ${displayCount})`
                      )}
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
