import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { useWorkspace } from "@/context/WorkspaceContext";
import { analysisService } from "@/api_service/analysis/analysisService";
import { projectService, type ProjectDTO } from "@/api_service/project/projectService";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft, CheckCircle, FileText, Clock, GitBranch, GitPullRequest, ChevronRight, ChevronLeft, Copy, ExternalLink
} from "lucide-react";
import type { AnalysisIssue } from "@/api_service/analysis/analysisService";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { vs } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useTheme } from "@/components/ThemeProvider";
import { getCategoryInfo } from "@/config/issueCategories";
import { cn } from "@/lib/utils";
import { useWorkspaceRoutes } from "@/hooks/useWorkspaceRoutes";
import { usePermissions } from "@/hooks/usePermissions";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { buildVcsPrUrl } from "@/components/IssueListWithFilters";


export default function IssueDetails() {
  const { namespace, issueId } = useParams<{ namespace: string; issueId: string }>();
  const navigate = useNavigate();
  const routes = useWorkspaceRoutes();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { currentWorkspace } = useWorkspace();
  const { toast } = useToast();
  const { theme } = useTheme();
  const { canManageWorkspace } = usePermissions();


  const [issue, setIssue] = useState<AnalysisIssue | null>(null);
  const [project, setProject] = useState<ProjectDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [scopeIssues, setScopeIssues] = useState<AnalysisIssue[]>(
    // Initialize from route state if available
    (location.state as { scopeIssues?: AnalysisIssue[] })?.scopeIssues || []
  );
  const [scopeLoading, setScopeLoading] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Get scope parameters from URL
  const scopeBranch = searchParams.get('branch');
  const scopePrNumber = searchParams.get('prNumber');
  const scopePrVersion = searchParams.get('prVersion');
  const returnPath = searchParams.get('returnPath');
  const filterSeverity = searchParams.get('severity');
  const filterStatus = searchParams.get('status');
  const filterCategory = searchParams.get('category');

  // Helper to build PR URL using project VCS info
  const buildPrUrl = (prNumber: number | null | undefined): string | null => {
    if (!prNumber || !project) return null;
    return buildVcsPrUrl(
      project.vcsProvider,
      project.projectVcsWorkspace,
      project.projectVcsRepoSlug || project.projectRepoSlug,
      prNumber
    );
  };

  const loadIssue = async () => {
    if (!currentWorkspace || !namespace || !issueId) return;

    try {
      setLoading(true);
      // Load issue and project info in parallel
      const [issueData, projectData] = await Promise.all([
        analysisService.getIssueById(currentWorkspace.slug, namespace, issueId),
        projectService.getProjectByNamespace(currentWorkspace.slug, namespace)
      ]);
      setIssue(issueData);
      setProject(projectData);
    } catch (error: any) {
      // If 404, the issue doesn't exist in this workspace/project - navigate away
      if (error.response?.status === 404 || error.status === 404) {
        toast({
          title: "Issue not found",
          description: "This issue doesn't exist or doesn't belong to this workspace",
          variant: "destructive",
        });
        // Navigate to projects list for this workspace
        navigate(routes.projects());
        return;
      }
      toast({
        title: "Failed to load issue",
        description: error.message || "Could not load issue details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadScopeIssues = async () => {
    if (!currentWorkspace || !namespace) return;

    setScopeLoading(true);
    try {
      let issues: AnalysisIssue[] = [];

      // If PR scope is specified, load PR issues
      if (scopePrNumber) {
        const version = scopePrVersion ? parseInt(scopePrVersion) : undefined;
        const response = await analysisService.getAnalysisIssues(
          currentWorkspace.slug,
          namespace,
          scopePrNumber,
          version
        );
        issues = response.issues;
      } else {
        // Fall back to branch scope
        const branch = scopeBranch || issue?.branch;
        if (!branch) {
          setScopeLoading(false);
          return;
        }

        // Use filter parameters from URL if available
        const statusFilter = filterStatus || 'all';
        const response = await analysisService.getBranchIssues(
          currentWorkspace.slug,
          namespace,
          branch,
          statusFilter,
          1,
          100, // Load more issues for sidebar navigation
          true // excludeDiff to reduce payload size
        );
        issues = response.issues;
      }

      // Apply additional filters if present
      if (filterSeverity && filterSeverity !== 'ALL') {
        issues = issues.filter(i => i.severity.toLowerCase() === filterSeverity.toLowerCase());
      }
      if (filterCategory && filterCategory !== 'ALL') {
        issues = issues.filter(i => i.issueCategory?.toLowerCase() === filterCategory.toLowerCase());
      }

      setScopeIssues(issues);
    } catch (error: any) {
      console.error('Failed to load scope issues:', error);
    } finally {
      setScopeLoading(false);
    }
  };

  useEffect(() => {
    loadIssue();
  }, [currentWorkspace, namespace, issueId]);

  useEffect(() => {
    // Skip loading if we already have scope issues from route state
    if (scopeIssues.length > 0) return;

    if (issue || scopeBranch || scopePrNumber) {
      loadScopeIssues();
    }
  }, [issue, scopeBranch, scopePrNumber, currentWorkspace, namespace]);

  const navigateToIssue = (targetIssueId: string) => {
    const params = new URLSearchParams();
    if (scopeBranch) params.set('branch', scopeBranch);
    if (returnPath) params.set('returnPath', returnPath);
    // Preserve PR scope parameters
    if (scopePrNumber) params.set('prNumber', scopePrNumber);
    if (scopePrVersion) params.set('prVersion', scopePrVersion);
    // Preserve filter parameters
    if (filterSeverity) params.set('severity', filterSeverity);
    if (filterStatus) params.set('status', filterStatus);
    if (filterCategory) params.set('category', filterCategory);

    // Pass scopeIssues via route state to avoid reloading
    navigate(routes.issueDetail(namespace!, targetIssueId, Object.fromEntries(params)), {
      state: { scopeIssues },
      replace: false
    });
  };

  const handleUpdateIssueStatus = async (newStatus: 'open' | 'resolved') => {
    if (!currentWorkspace || !namespace || !issueId) return;

    try {
      const isResolved = newStatus === 'resolved';
      
      // Capture PR context if we're viewing from a PR scope
      const prNumber = scopePrNumber ? parseInt(scopePrNumber) : undefined;
      // Use the issue's commit hash as context for the resolution
      const commitHash = issue?.commitHash || undefined;
      
      const response = await analysisService.updateIssueStatus(
        currentWorkspace.slug, 
        namespace, 
        issueId, 
        isResolved,
        undefined, // comment
        isResolved ? prNumber : undefined,
        isResolved ? commitHash : undefined
      );
      
      if (!response.success) {
        throw new Error(response.errorMessage || 'Failed to update issue status');
      }
      
      // Update local state with resolution info
      const now = new Date().toISOString();
      setIssue(prev => prev ? { 
        ...prev, 
        status: newStatus,
        resolvedAt: isResolved ? now : null,
        resolvedBy: isResolved ? 'manual' : null,
        resolvedByPr: isResolved ? prNumber : null,
        resolvedCommitHash: isResolved ? commitHash : null,
      } : null);
      
      // Update in scope list too
      setScopeIssues(prev => prev.map(i => i.id === issueId ? { ...i, status: newStatus } : i));
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

  const getSeverityBadge = (severity: string, minimal: boolean = false) => {
    const colors = {
      high: "bg-red-200 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
      medium: "bg-yellow-200 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
      low: "bg-green-200 text-green-800 dark:bg-green-900 dark:text-green-300"
    };

      const displayText = severity.toUpperCase();

      if(minimal) {
          return (
              <Badge className={`shrink-0 h-4 w-4 ${colors[severity as keyof typeof colors] || colors.medium}`}/>
          )
      }
      return (
      <Badge className={colors[severity as keyof typeof colors] || colors.medium}>
        {displayText}
      </Badge>
    );
  };


  const renderDiff = (diffContent: string) => {
    if (!diffContent) return null;

    // Parse the diff to extract file information and detect language
    const detectLanguage = (filepath: string): string => {
      const ext = filepath.split('.').pop()?.toLowerCase() || '';
      const langMap: Record<string, string> = {
        'ts': 'typescript',
        'tsx': 'tsx',
        'js': 'javascript',
        'jsx': 'jsx',
        'py': 'python',
        'java': 'java',
        'php': 'php',
        'rb': 'ruby',
        'go': 'go',
        'rs': 'rust',
        'c': 'c',
        'cpp': 'cpp',
        'cs': 'csharp',
        'html': 'html',
        'css': 'css',
        'scss': 'scss',
        'json': 'json',
        'xml': 'xml',
        'yaml': 'yaml',
        'yml': 'yaml',
        'sql': 'sql',
        'sh': 'bash',
        'md': 'markdown',
      };
      return langMap[ext] || 'text';
    };

    const lines = diffContent.split('\n');
    const sections: Array<{type: 'header' | 'hunk' | 'content', content: string, language?: string}> = [];
    let currentLanguage = 'text';
    let currentHunk: string[] = [];
    let inHunkContent = false;

    lines.forEach((line, idx) => {
      // File header
      if (line.startsWith('diff --git') || line.startsWith('---') || line.startsWith('+++')) {
        if (currentHunk.length > 0) {
          sections.push({ type: 'content', content: currentHunk.join('\n'), language: currentLanguage });
          currentHunk = [];
          inHunkContent = false;
        }

        // Detect language from file path
        if (line.startsWith('+++') || line.startsWith('---')) {
          const match = line.match(/[ab]\/(.*)/);
          if (match) {
            currentLanguage = detectLanguage(match[1]);
          }
        }

        sections.push({ type: 'header', content: line });
      }
      // Hunk header
      else if (line.startsWith('@@')) {
        if (currentHunk.length > 0) {
          sections.push({ type: 'content', content: currentHunk.join('\n'), language: currentLanguage });
          currentHunk = [];
        }
        sections.push({ type: 'hunk', content: line });
        inHunkContent = true;
      }
      // Diff content
      else if (inHunkContent) {
        currentHunk.push(line);
      }
      // Fallback
      else {
        sections.push({ type: 'header', content: line });
      }
    });

    // Push remaining hunk
    if (currentHunk.length > 0) {
      sections.push({ type: 'content', content: currentHunk.join('\n'), language: currentLanguage });
    }

    return (
      <div className="rounded-lg overflow-x-auto border border-border">
        <div className="inline-block min-w-full">{sections.map((section, idx) => {
          if (section.type === 'header') {
            return (
              <div
                key={idx}
                className="bg-muted px-4 py-2 text-sm font-mono text-muted-foreground border-b border-border"
              >
                {section.content}
              </div>
            );
          }

          if (section.type === 'hunk') {
            return (
              <div
                key={idx}
                className="bg-accent/50 px-4 py-1.5 text-sm font-mono text-accent-foreground border-b border-border"
              >
                {section.content}
              </div>
            );
          }

          // Render diff content with syntax highlighting
          const diffLines = section.content.split('\n');
          return (
            <div key={idx} className="bg-background">
              {diffLines.map((line, lineIdx) => {
                const isAddition = line.startsWith('+') && !line.startsWith('+++');
                const isDeletion = line.startsWith('-') && !line.startsWith('---');
                const isContext = line.startsWith(' ');

                // Extract the actual code (remove +/- prefix)
                const code = isAddition || isDeletion ? line.substring(1) : line;

                let bgClass = '';
                let borderClass = '';

                if (isAddition) {
                  bgClass = 'bg-green-500/10 dark:bg-green-500/20';
                  borderClass = 'border-l-2 border-green-500';
                } else if (isDeletion) {
                  bgClass = 'bg-red-500/10 dark:bg-red-500/20';
                  borderClass = 'border-l-2 border-red-500';
                }

                return (
                  <div
                    key={lineIdx}
                    className={`flex font-mono text-sm ${bgClass} ${borderClass}`}
                  >
                    <span className="inline-block w-12 text-right pr-4 text-muted-foreground/50 select-none flex-shrink-0">
                      {lineIdx + 1}
                    </span>
                    <span className="inline-block w-6 text-center flex-shrink-0 select-none text-muted-foreground/70">
                      {isAddition ? '+' : isDeletion ? '-' : ' '}
                    </span>
                    <div className="flex-1">
                      <SyntaxHighlighter
                        language={section.language || 'text'}
                        style={theme === 'dark' ? vscDarkPlus : vs}
                        wrapLongLines={false}
                        customStyle={{
                          margin: 0,
                          padding: '0.125rem 0.75rem',
                          background: 'transparent',
                          fontSize: '0.875rem',
                          lineHeight: '1.5',
                          border: 'none',
                        }}
                        codeTagProps={{
                          style: {
                            fontFamily: 'inherit',
                          }
                        }}
                        PreTag="span"
                      >
                        {code}
                      </SyntaxHighlighter>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}</div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center space-x-4">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-64" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!issue) {
    // Determine fallback URL - if we have branch scope, go back to branch issues
    let backUrl = returnPath;
    if (!backUrl) {
      if (scopeBranch) {
        backUrl = routes.branchIssues(namespace!, scopeBranch);
      } else {
        backUrl = routes.projectDetail(namespace!);
      }
    }

    return (
      <div className="mx-auto p-6">
        <Button variant="ghost" size="sm" onClick={() => navigate(backUrl)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Analysis
        </Button>
        <div className="mt-6">
          <Card>
            <CardContent className="text-center py-12">
              <h3 className="text-lg font-semibold mb-2">Issue Not Found</h3>
              <p className="text-muted-foreground">The requested issue could not be loaded.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Use new fields if available, fallback to description
  const descriptionText = issue.suggestedFixDescription || issue.description;
  const diffContent = issue.suggestedFixDiff;

  // Determine back URL - if we have branch scope, go back to branch issues
  let backUrl = returnPath;
  if (!backUrl) {
    if (scopeBranch) {
      backUrl = routes.branchIssues(namespace!, scopeBranch);
    } else {
      backUrl = routes.projectDetail(namespace!);
    }
  }

  // Find current issue index in scope list
  const currentIndex = scopeIssues.findIndex(i => i.id === issueId);
  const prevIssue = currentIndex > 0 ? scopeIssues[currentIndex - 1] : null;
  const nextIssue = currentIndex < scopeIssues.length - 1 ? scopeIssues[currentIndex + 1] : null;

  return (
    <div className="flex h-[calc(100vh-64px)] ">
      {/* Left Sidebar - Issues List */}
      <div className={cn(
        "border-r border-l  bg-card transition-all duration-200 flex flex-col",
        sidebarCollapsed ? "w-10" : "w-80"
      )}>
        {/* Sidebar Toggle */}
        <div className="p-2 border-b flex items-center justify-between">
          {!sidebarCollapsed && (
            <span className="text-sm font-medium">Issues ({scopeIssues.length})</span>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        {!sidebarCollapsed && (
          <ScrollArea className="flex-1">
            {scopeLoading ? (
              <div className="p-3 space-y-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : scopeIssues.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No issues in scope
              </div>
            ) : (
              <div className="p-2">
                {scopeIssues.map((scopeIssue) => (
                  <button
                    key={scopeIssue.id}
                    onClick={() => navigateToIssue(scopeIssue.id)}
                    className={cn(
                      "w-full text-left p-2 rounded-md hover:bg-primary/10 transition-colors mb-1",
                      scopeIssue.id === issueId && "bg-primary/10"
                    )}
                  >
                    <div className="flex items-start gap-2">
                      {getSeverityBadge(scopeIssue.severity, true)}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate" title={scopeIssue.title}>{scopeIssue.title}</p>
                        <p className="text-xs text-muted-foreground truncate" title={scopeIssue.file}>{scopeIssue.file}</p>
                      </div>
                      {scopeIssue.status === 'resolved' && (
                        <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto container pt-6">
        {/* Top Navigation Bar */}
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(backUrl)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          {/* Navigation between issues */}
          {scopeIssues.length > 1 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {currentIndex + 1} of {scopeIssues.length}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={!prevIssue}
                onClick={() => prevIssue && navigateToIssue(prevIssue.id)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!nextIssue}
                onClick={() => nextIssue && navigateToIssue(nextIssue.id)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Issue Header - Compact Metadata Bar */}
        <div className="flex justify-between gap-x-4">
          <div className="bg-card border rounded-lg p-4 mb-6 w-full">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2 flex-1 min-w-0">
              <h1 className="text-lg font-bold leading-tight">{issue.title}</h1>
              <div className="flex gap-x-4 text-xs">
              </div>
            </div>
            {canManageWorkspace() && (
              <div className="flex items-center gap-2">
                <Select
                  value={issue.status}
                  onValueChange={(value) => handleUpdateIssueStatus(value as 'open' | 'resolved')}
                >
                  <SelectTrigger className="w-[120px] h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
              {getSeverityBadge(issue.severity)}
              {issue.issueCategory && (
                  <Badge
                      variant="outline"
                      className={cn(
                          getCategoryInfo(issue.issueCategory).color,
                          getCategoryInfo(issue.issueCategory).bgColor,
                          getCategoryInfo(issue.issueCategory).borderColor,
                          "text-xs"
                      )}
                  >
                      {getCategoryInfo(issue.issueCategory).label}
                  </Badge>
              )}
              <Separator orientation="vertical" className="h-4" />
              <TooltipProvider>
                  <Tooltip>
                      <TooltipTrigger asChild>
                          <button
                              onClick={() => {
                                  const fullPath = `${issue.file}${issue.line > 0 ? `:${issue.line}` : ''}`;
                                  navigator.clipboard.writeText(fullPath);
                                  toast({
                                      title: "Copied to clipboard",
                                      description: fullPath,
                                  });
                              }}
                              className="text-xs text-muted-foreground flex items-center gap-1 max-w-[200px] lg:max-w-[500px] hover:text-foreground transition-colors cursor-pointer group"
                          >
                              <FileText className="h-3 w-3 flex-shrink-0" />
                              <span className="truncate">{issue.file}</span>
                              {issue.line > 0 && <span className="flex-shrink-0">:{issue.line}</span>}
                              <Copy className="h-3 w-3 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </button>
                      </TooltipTrigger>
                      <TooltipContent>
                          <p className="font-mono text-xs">{issue.file}{issue.line > 0 ? `:${issue.line}` : ''}</p>
                          <p className="text-xs text-muted-foreground">Click to copy</p>
                      </TooltipContent>
                  </Tooltip>
              </TooltipProvider>
              <Separator orientation="vertical" className="h-4" />
              <span className="text-xs text-muted-foreground flex items-center gap-1">
            <GitBranch className="h-3 w-3" />
                  {issue.branch}
          </span>
              <Separator orientation="vertical" className="h-4" />
              <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" />
                  {new Date(issue.createdAt).toLocaleDateString()}
          </span>
              <Separator orientation="vertical" className="h-4" />
              {issue.prNumber && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    PR #{issue.prNumber}
                  </span>
              )}
              <Separator orientation="vertical" className="h-4" />
              {issue.commitHash && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    {issue.commitHash.substring(0, 8)}
                  </span>
              )}
          </div>
            </div>
        </div>

        <div className="md:flex justify-between gap-2">
          {/* Resolution Info - shown when issue is resolved */}
          {issue.status === 'resolved' && (issue.resolvedAt || issue.resolvedBy || issue.resolvedDescription || issue.resolvedCommitHash) && (
            <Card className="mb-6 border-green-500/30 bg-green-500/5 basis-1/2">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2 text-green-600 dark:text-green-400">
                  <CheckCircle className="h-4 w-4" />
                  Resolution Information
                </CardTitle>
                <CardDescription className="text-xs">
                  Details about how and when this issue was resolved
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  {issue.resolvedAt && (
                    <div>
                      <span className="text-muted-foreground">Resolved on:</span>
                      <span className="ml-2 font-medium">{new Date(issue.resolvedAt).toLocaleString()}</span>
                    </div>
                  )}
                  {issue.resolvedBy && (
                    <div>
                      <span className="text-muted-foreground">Resolved by:</span>
                      <span className="ml-2 font-medium">{issue.resolvedBy}</span>
                    </div>
                  )}
                  {issue.resolvedByPr && (
                    <div>
                      <span className="text-muted-foreground">Resolved in PR:</span>
                      {buildPrUrl(issue.resolvedByPr) ? (
                        <a 
                          href={buildPrUrl(issue.resolvedByPr)!} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="ml-2 font-medium text-green-600 dark:text-green-400 hover:underline inline-flex items-center gap-1"
                        >
                          #{issue.resolvedByPr}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <span className="ml-2 font-medium">#{issue.resolvedByPr}</span>
                      )}
                    </div>
                  )}
                  {issue.resolvedCommitHash && (
                    <div>
                      <span className="text-muted-foreground">Resolved in commit:</span>
                      <span className="ml-2 font-mono font-medium">{issue.resolvedCommitHash.substring(0, 8)}</span>
                    </div>
                  )}
                </div>
                {issue.resolvedDescription && (
                  <div className="pt-2 border-t">
                    <span className="text-muted-foreground text-sm">Resolution explanation:</span>
                    <p className="mt-1 text-sm text-foreground leading-relaxed">{issue.resolvedDescription}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Original Issue Detection Info */}
          {(issue.analysisId || issue.prNumber || issue.commitHash) && (
            <Card className="mb-6 border-blue-500/30 bg-blue-500/5 basis-1/2 grow">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2 text-blue-600 dark:text-blue-400">
                  <GitPullRequest className="h-4 w-4" />
                  Original Detection
                </CardTitle>
                <CardDescription className="text-xs">
                  Where this issue was first identified
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  {issue.analysisId && (
                    <div>
                      <span className="text-muted-foreground">Analysis ID:</span>
                      <span className="ml-2 font-medium">#{issue.analysisId}</span>
                    </div>
                  )}
                  {issue.prNumber && (
                    <div>
                      <span className="text-muted-foreground">Detected in PR:</span>
                      {buildPrUrl(issue.prNumber) ? (
                        <a 
                          href={buildPrUrl(issue.prNumber)!} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="ml-2 font-medium text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
                        >
                          #{issue.prNumber}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <span className="ml-2 font-medium">#{issue.prNumber}</span>
                      )}
                    </div>
                  )}
                  {issue.commitHash && (
                    <div>
                      <span className="text-muted-foreground">Detected in commit:</span>
                      <span className="ml-2 font-mono font-medium">{issue.commitHash.substring(0, 8)}</span>
                    </div>
                  )}
                  {issue.detectedAt && (
                    <div>
                      <span className="text-muted-foreground">Detected on:</span>
                      <span className="ml-2 font-medium">{new Date(issue.detectedAt).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Issue Content */}
        <div className="space-y-6">
          {/* Description */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Issue Description
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground leading-relaxed">{descriptionText}</p>
            </CardContent>
          </Card>

          {/* Code Diff */}
          {diffContent && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Suggested Fix</CardTitle>
                <CardDescription className="text-xs">
                  Suggested code change to resolve this issue
                </CardDescription>
              </CardHeader>
              <CardContent>
                {renderDiff(diffContent)}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}