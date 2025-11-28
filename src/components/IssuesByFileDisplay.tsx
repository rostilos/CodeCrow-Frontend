import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, CheckCircle, BarChart3, XCircle, FileCode } from "lucide-react";
import type { AnalysisIssue } from "@/api_service/analysis/analysisService";

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
      case 'performance': return <BarChart3 className="h-4 w-4 text-orange-500" />;
      default: return <XCircle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    const colors = {
      high: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
      medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
      low: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
    };
    
    return (
      <Badge className={colors[severity as keyof typeof colors] || colors.medium}>
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
        <FileCode className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No analysis issues found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {Object.entries(issuesByFile).map(([filename, fileIssues]) => (
        <div key={filename} className="space-y-3">
          {/* File Header */}
          <div className="flex items-center gap-2 px-2">
            <FileCode className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-mono text-xs font-medium text-foreground">
              {filename}
            </h3>
            <Badge variant="outline" className="ml-2">
              {fileIssues.length}
            </Badge>
          </div>

          {/* Issues for this file */}
          <div className="space-y-2">
            {fileIssues.map((issue) => (
              <Card 
                key={issue.id}
                className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50 group"
                onClick={() => handleCardClick(issue.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      {getIssueIcon(issue.type)}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-base group-hover:text-primary transition-colors">
                          {issue.title}
                        </h4>
                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                          <span>Line {issue.line}</span>
                          <span>•</span>
                          <span>{new Date(issue.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                      {getSeverityBadge(issue.severity)}
                      {onUpdateIssueStatus && (
                        <Select 
                          value={issue.status} 
                          onValueChange={(value) => {
                            onUpdateIssueStatus(issue.id, value as 'open' | 'resolved');
                          }}
                        >
                          <SelectTrigger className="w-[110px] h-8">
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
