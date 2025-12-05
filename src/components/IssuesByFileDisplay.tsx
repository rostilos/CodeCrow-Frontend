import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, CheckCircle, BarChart3, XCircle, FileCode, ChevronRight } from "lucide-react";
import type { AnalysisIssue } from "@/api_service/analysis/analysisService";
import { getCategoryInfo } from "@/config/issueCategories";
import { cn } from "@/lib/utils";

interface IssuesByFileDisplayProps {
  issues: AnalysisIssue[];
  projectNamespace: string;
  onUpdateIssueStatus?: (issueId: string, status: 'open' | 'resolved') => void;
}

export default function IssuesByFileDisplay({ 
  issues, 
  projectNamespace,
  onUpdateIssueStatus 
}: IssuesByFileDisplayProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

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

  const handleCardClick = (issueId: string) => {
    // Preserve current URL path and params when navigating to issue details
    const currentPath = window.location.pathname;
    const params = new URLSearchParams(searchParams);
    
    // Store the return path in the URL so we can come back to it
    params.set('returnPath', currentPath + (searchParams.toString() ? '?' + searchParams.toString() : ''));
    
    navigate(`/dashboard/projects/${projectNamespace}/issues/${issueId}?${params.toString()}`);
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
          <div className="space-y-2">
            {fileIssues.map((issue) => (
              <Card 
                key={issue.id}
                className="group cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary/30"
                onClick={() => handleCardClick(issue.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="p-1.5 rounded-lg bg-muted shrink-0 mt-0.5">
                        {getIssueIcon(issue.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-sm group-hover:text-primary transition-colors truncate">
                            {issue.title}
                          </h4>
                          <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all shrink-0" />
                        </div>
                        <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
                          <span className="font-mono">Line {issue.line}</span>
                          <span className="opacity-50">•</span>
                          <span>{new Date(issue.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
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
                      {getSeverityBadge(issue.severity)}
                      {onUpdateIssueStatus && (
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
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
