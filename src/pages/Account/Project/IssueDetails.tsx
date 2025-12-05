import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useWorkspace } from "@/context/WorkspaceContext";
import { analysisService } from "@/api_service/analysis/analysisService";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, AlertCircle, CheckCircle, XCircle, BarChart3,
  FileText, Clock, GitBranch, GitPullRequest
} from "lucide-react";
import type { AnalysisIssue } from "@/api_service/analysis/analysisService";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { vs } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useTheme } from "@/components/ThemeProvider";
import { getCategoryInfo } from "@/config/issueCategories";
import { cn } from "@/lib/utils";

export default function IssueDetails() {
  const { namespace, issueId } = useParams<{ namespace: string; issueId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currentWorkspace } = useWorkspace();
  const { toast } = useToast();
  const { theme } = useTheme();

  const [issue, setIssue] = useState<AnalysisIssue | null>(null);
  const [loading, setLoading] = useState(true);

  const loadIssue = async () => {
    if (!currentWorkspace || !namespace || !issueId) return;
    
    try {
      setLoading(true);
      const issueData = await analysisService.getIssueById(currentWorkspace.slug, namespace, issueId);
      setIssue(issueData);
    } catch (error: any) {
      toast({
        title: "Failed to load issue",
        description: error.message || "Could not load issue details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIssue();
  }, [currentWorkspace, namespace, issueId]);

  const handleUpdateIssueStatus = async (newStatus: 'open' | 'resolved') => {
    if (!currentWorkspace || !namespace || !issueId) return;
    
    try {
      const isResolved = newStatus === 'resolved';
      await analysisService.updateIssueStatus(currentWorkspace.slug, namespace, issueId, isResolved);
      setIssue(prev => prev ? { ...prev, status: newStatus } : null);
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

  const getIssueIcon = (type: string) => {
    switch (type) {
      case 'security': return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'quality': return <CheckCircle className="h-5 w-5 text-blue-500" />;
      case 'performance': return <BarChart3 className="h-5 w-5 text-orange-500" />;
      default: return <XCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    const colors = {
      high: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
      medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
      low: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
    };

      const displayText = severity.toUpperCase();


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
      <div className="mx-auto p-6 space-y-6">
        <div className="flex items-center space-x-4">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-64" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!issue) {
    const returnPath = searchParams.get('returnPath');
    const backUrl = returnPath || `/dashboard/projects/${namespace}`;
    
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
  
  // Determine back URL from returnPath parameter or default to dashboard
  const returnPath = searchParams.get('returnPath');
  const backUrl = returnPath || `/dashboard/projects/${namespace}`;

  return (
    <div className="mx-auto p-6 space-y-6">
      <Button variant="ghost" size="sm" onClick={() => navigate(backUrl)}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Analysis
      </Button>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div>
            <h1 className="text-base md:text-xl lg:text-2xl font-bold">{issue.title}</h1>
            <div className="flex items-center space-x-2 mt-1">
              {getSeverityBadge(issue.severity)}
              {issue.issueCategory && (
                <Badge 
                  variant="outline" 
                  className={cn(
                    getCategoryInfo(issue.issueCategory).color,
                    getCategoryInfo(issue.issueCategory).bgColor,
                    getCategoryInfo(issue.issueCategory).borderColor
                  )}
                >
                  {getCategoryInfo(issue.issueCategory).label}
                </Badge>
              )}
              <Badge variant="outline">{issue.type || 'Quality'}</Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span className="text-xl lg:text-2xl">Issue Description</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="prose prose-sm max-w-none">
                <p className="text-foreground leading-relaxed">{descriptionText}</p>
              </div>
            </CardContent>
          </Card>

          {/* Code Diff */}
          {diffContent && (
            <Card>
              <CardHeader>
                <CardTitle className="text-xl lg:text-2xl">Suggested Fix</CardTitle>
                <CardDescription>
                  Below is the suggested code change to resolve this issue
                </CardDescription>
              </CardHeader>
              <CardContent>
                {renderDiff(diffContent)}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Issue Metadata */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Issue Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">File</p>
                  <p className="text-sm text-muted-foreground break-all">{issue.file}</p>
                </div>
              </div>

              {issue.line > 0 && (
                <div className="flex items-center space-x-3">
                  <div className="h-4 w-4 flex items-center justify-center">
                    <span className="text-xs font-mono">#</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Line</p>
                    <p className="text-sm text-muted-foreground">{issue.line}</p>
                  </div>
                </div>
              )}

              <Separator />

              <div className="flex items-center space-x-3">
                <GitBranch className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Branch</p>
                  <p className="text-sm text-muted-foreground">{issue.branch}</p>
                </div>
              </div>

              {issue.pullRequest && (
                <div className="flex items-center space-x-3">
                  <GitPullRequest className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Pull Request</p>
                    <p className="text-sm text-muted-foreground">#{issue.pullRequest}</p>
                  </div>
                </div>
              )}

              <Separator />

              <div className="flex items-center space-x-3">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Created</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(issue.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="flex items-center space-x-3">
                  <div>
                      <p className="text-sm font-medium mb-2">Issue status</p>
                      <Select
                          value={issue.status}
                          onValueChange={(value) => handleUpdateIssueStatus(value as 'open' | 'resolved')}
                      >
                          <SelectTrigger className="w-[140px]">
                              <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                              <SelectItem value="open">Open</SelectItem>
                              <SelectItem value="resolved">Resolved</SelectItem>
                          </SelectContent>
                      </Select>
                  </div>
              </div>


            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}