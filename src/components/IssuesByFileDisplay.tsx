import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, CheckCircle, BarChart3, XCircle, FileCode, ChevronRight, Clock, Code, User } from "lucide-react";
import type { AnalysisIssue } from "@/api_service/analysis/analysisService";
import { getCategoryInfo } from "@/config/issueCategories";
import { cn } from "@/lib/utils";
import { usePermissions } from "@/hooks/usePermissions";
import { useWorkspaceRoutes } from "@/hooks/useWorkspaceRoutes";

interface IssuesByFileDisplayProps {
  issues: AnalysisIssue[];
  projectNamespace: string;
  branchName?: string;
  prNumber?: number;
  prVersion?: number;
  onUpdateIssueStatus?: (issueId: string, status: 'open' | 'resolved') => void;
  selectedIssues?: Set<string>;
  onSelectionChange?: (issueId: string, selected: boolean) => void;
  selectionEnabled?: boolean;
  // Current filters to pass to issue detail page for sidebar filtering
  filters?: {
    severity?: string;
    status?: string;
    category?: string;
  };
  // Current active tab to preserve when navigating back
  activeTab?: 'preview' | 'issues' | 'activity';
}

export default function IssuesByFileDisplay({
  issues,
  projectNamespace,
  branchName,
  prNumber,
  prVersion,
  onUpdateIssueStatus,
  selectedIssues = new Set(),
  onSelectionChange,
  selectionEnabled = true,
  filters,
  activeTab
}: IssuesByFileDisplayProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { canManageWorkspace } = usePermissions();
  const routes = useWorkspaceRoutes();


  // Group issues by filename
  const issuesByFile = issues.reduce((acc, issue) => {
    const file = issue.file || 'Unknown File';
    if (!acc[file]) {
      acc[file] = [];
    }
    acc[file].push(issue);
    return acc;
  }, {} as Record<string, AnalysisIssue[]>);

  const getIssueIcon = (type: string) => {
    switch (type) {
      case 'security': return <AlertCircle className="h-4 w-4 text-destructive" />;
      case 'quality': return <CheckCircle className="h-4 w-4 text-primary" />;
      case 'performance': return <BarChart3 className="h-4 w-4 text-warning" />;
      default: return <XCircle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    const variants = {
      high: "destructive",
      medium: "secondary",
      low: "outline"
    } as const;

    return (
      <Badge variant={variants[severity as keyof typeof variants] || "secondary"}>
        {severity.toUpperCase()}
      </Badge>
    );
  };

  const getIssueUrl = (issueId: string) => {
    // Preserve current URL path and params when navigating to issue details
    const currentPath = window.location.pathname;
    const params = new URLSearchParams(searchParams);

    // Store the return path in the URL so we can come back to it
    params.set('returnPath', currentPath + (searchParams.toString() ? '?' + searchParams.toString() : ''));

    // Store the active tab so we can return to it
    if (activeTab) {
      params.set('returnTab', activeTab);
    }

    // Add filter params from props (these may not be in URL if they're applied via state)
    if (filters?.severity && filters.severity !== 'ALL') {
      params.set('severity', filters.severity);
    }
    if (filters?.status && filters.status !== 'all') {
      params.set('status', filters.status);
    }
    if (filters?.category && filters.category !== 'ALL') {
      params.set('category', filters.category);
    }

    // Pass the branch for sidebar scope
    if (branchName) {
      params.set('branch', branchName);
    }

    // Pass PR params for sidebar scope (PR issues take precedence over branch)
    if (prNumber) {
      params.set('prNumber', String(prNumber));
      if (prVersion) {
        params.set('prVersion', String(prVersion));
      }
    }

    return routes.issueDetail(projectNamespace, issueId, Object.fromEntries(params));
  };

  const handleCardClick = (e: React.MouseEvent, issueId: string) => {
    // Allow ctrl+click and middle-click to open in new tab (browser default)
    if (e.ctrlKey || e.metaKey || e.button === 1) {
      return;
    }
    e.preventDefault();
    navigate(getIssueUrl(issueId));
  };

  if (issues.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-muted mb-4">
          <FileCode className="h-7 w-7" />
        </div>
        <p className="font-medium">No analysis issues found</p>
        <p className="text-sm mt-1">Issues will appear here when analysis is complete</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {Object.entries(issuesByFile).map(([filename, fileIssues]) => (
        <div key={filename} className="space-y-3">
          {/* File Header */}
          <div className="flex items-center gap-2 px-1">
            <div className="p-1 rounded bg-muted">
              <FileCode className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <h3 className="font-mono text-xs font-medium text-foreground truncate">
              {filename}
            </h3>
            <Badge variant="secondary" className="ml-auto shrink-0 text-xs">
              {fileIssues.length} issue{fileIssues.length !== 1 ? 's' : ''}
            </Badge>
          </div>

          {/* Issues for this file */}
          <div className="space-y-3">
            {fileIssues.map((issue) => (
              <Link
                key={issue.id}
                to={getIssueUrl(issue.id)}
                onClick={(e) => {
                  if (selectedIssues.size === 0) {
                    handleCardClick(e, issue.id);
                  } else {
                    e.preventDefault();
                  }
                }}
                className="block"
              >
                <Card
                  className={cn(
                    "group cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary/30",
                    selectedIssues.has(issue.id) && "ring-2 ring-primary/50 border-primary/30"
                  )}
                >
                <CardContent className="p-5">
                  <div className="flex gap-4">
                    {/* Selection checkbox - always visible when enabled */}
                    {selectionEnabled && (
                      <div className="shrink-0 pt-1" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedIssues.has(issue.id)}
                          onCheckedChange={(checked) => onSelectionChange?.(issue.id, !!checked)}
                        />
                      </div>
                    )}

                    {/* Icon - only show when no checkbox */}
                    {!selectionEnabled && (
                      <div className="p-2 rounded-lg bg-muted shrink-0 h-fit">
                        {getIssueIcon(issue.type)}
                      </div>
                    )}

                    {/* Main content */}
                    <div className="flex-1 min-w-0 space-y-3">
                      {/* Title row */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-base group-hover:text-primary transition-colors leading-snug">
                            {issue.title}
                          </h4>
                        </div>
                        {selectedIssues.size === 0 && (
                          <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all shrink-0 mt-1" />
                        )}
                      </div>

                      {/* Badges row */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {getSeverityBadge(issue.severity)}
                        {issue.issueCategory && (
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-xs",
                              getCategoryInfo(issue.issueCategory).color,
                              getCategoryInfo(issue.issueCategory).bgColor,
                              getCategoryInfo(issue.issueCategory).borderColor
                            )}
                          >
                            {getCategoryInfo(issue.issueCategory).label}
                          </Badge>
                        )}
                      </div>

                      {/* Separator */}
                      <Separator />

                      {/* Bottom row: status select left, meta right */}
                      <div className="flex items-end justify-between gap-3">
                        {/* Status dropdown - hide when items are selected for bulk actions */}
                        {canManageWorkspace() && (
                          <div className="flex items-center gap-2">
                            {onUpdateIssueStatus && selectedIssues.size === 0 && (
                              <div onClick={(e) => e.stopPropagation()}>
                                <Select
                                  value={issue.status}
                                  onValueChange={(value) => {
                                    onUpdateIssueStatus(issue.id, value as 'open' | 'resolved');
                                  }}
                                >
                                  <SelectTrigger className="w-[100px] h-8 text-xs">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="open">Open</SelectItem>
                                    <SelectItem value="resolved">Resolved</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            )}
                            {/* Show status badge when items are selected */}
                            {selectedIssues.size > 0 && (
                              <Badge variant={issue.status === 'resolved' ? 'secondary' : 'outline'} className="text-xs">
                                {issue.status === 'resolved' ? 'Resolved' : 'Open'}
                              </Badge>
                            )}
                          </div>
                        )}

                        {/* Meta info - bottom right */}
                        <div className="flex items-center leading-none gap-3 text-xs text-muted-foreground flex-wrap">
                          {issue.vcsAuthorUsername && (
                            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/50 border border-border/50">
                              <User className="h-3 w-3 text-muted-foreground" />
                              <span className="font-medium text-foreground/80">{issue.vcsAuthorUsername}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                              <span className="text-muted-foreground/80">L:{issue.line}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{new Date(issue.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
