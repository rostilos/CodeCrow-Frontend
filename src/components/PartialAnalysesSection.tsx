import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, ChevronDown, ChevronUp, RefreshCw } from "lucide-react";
import {
  analysisService,
  type AnalysesHistoryResponse,
  type AnalysisReportResponse,
} from "@/api_service/analysis/analysisService";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import { DASHBOARD_ROUTES } from "@/lib/routes/dashboard.routes";

interface PartialAnalysesSectionProps {
  workspaceSlug: string;
  projectNamespace: string;
  branchName?: string;
  prNumber?: number;
  refreshKey?: number;
}

export default function PartialAnalysesSection({
  workspaceSlug,
  projectNamespace,
  branchName,
  prNumber,
  refreshKey = 0,
}: PartialAnalysesSectionProps) {
  const [page, setPage] = useState(1);
  const [history, setHistory] = useState<AnalysesHistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [report, setReport] = useState<AnalysisReportResponse | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [reportRetry, setReportRetry] = useState(0);

  useEffect(() => { setPage(1); }, [workspaceSlug, projectNamespace, branchName, prNumber]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    setHistory(null);
    setSelectedId(null);
    analysisService.getAnalysisHistory(workspaceSlug, projectNamespace, page, 10, branchName, "PARTIAL", prNumber)
      .then((result) => { if (active) setHistory(result); })
      .catch((err) => { if (active) setError(err.message || "Could not load partial analyses."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [workspaceSlug, projectNamespace, branchName, prNumber, page, refreshKey, retry]);

  useEffect(() => {
    let active = true;
    setReport(null);
    setReportError(null);
    if (!selectedId) {
      setReportLoading(false);
      return;
    }
    setReportLoading(true);
    analysisService.getAnalysisReport(workspaceSlug, projectNamespace, selectedId)
      .then((result) => { if (active) setReport(result); })
      .catch((err) => { if (active) setReportError(err.message || "Could not load this report."); })
      .finally(() => { if (active) setReportLoading(false); });
    return () => { active = false; };
  }, [workspaceSlug, projectNamespace, selectedId, reportRetry]);

  return (
    <Card className="border-warning/40">
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="h-4 w-4 text-warning" />
            Partial analyses
            {history && <Badge variant="outline">{history.totalElements}</Badge>}
          </CardTitle>
          <Button size="sm" variant="ghost" disabled={loading} onClick={() => setRetry((value) => value + 1)} aria-label="Refresh partial analyses">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
        <CardDescription>
          Incomplete runs{prNumber != null ? ` for PR #${prNumber}` : branchName ? ` targeting ${branchName}` : " across this project"}.
          Saved results are available here and excluded from main report totals and trends.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? <p className="text-sm text-muted-foreground" role="status">Loading partial analyses...</p> : error ? (
          <Alert variant="destructive"><AlertDescription className="flex items-center justify-between gap-3">
            {error}<Button size="sm" variant="outline" onClick={() => setRetry((value) => value + 1)}>Retry</Button>
          </AlertDescription></Alert>
        ) : !history?.analyses.length ? (
          <p className="text-sm text-muted-foreground">No partial analyses{prNumber != null ? " for this PR" : branchName ? " for this branch" : " in this project"}.</p>
        ) : (
          <>
            {history.analyses.map((analysis) => {
              const expanded = selectedId === analysis.id;
              return (
                <div key={analysis.id} className="rounded-lg border overflow-hidden">
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-3 p-4 text-left hover:bg-muted/30"
                    aria-expanded={expanded}
                    aria-controls={`partial-analysis-${analysis.id}`}
                    onClick={() => setSelectedId(expanded ? null : analysis.id)}
                  >
                    <div className="min-w-0 space-y-1">
                      <p className="text-sm font-medium break-words">
                        {analysis.pullRequestId ? `PR #${analysis.pullRequestId}` : "Branch analysis"}
                        {analysis.prVersion != null && ` · Version ${analysis.prVersion}`}
                        {` · ${analysis.sourceBranch ? `${analysis.sourceBranch} → ` : ""}${analysis.branch || "Unknown branch"}`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(analysis.triggeredAt).toLocaleString()}
                        {analysis.commitHash && ` · ${analysis.commitHash.slice(0, 8)}`}
                        {` · ${analysis.issuesFound} open findings`}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Badge variant="outline" className="border-warning/50 text-warning">Partial</Badge>
                      {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  </button>
                  {analysis.pullRequestId && analysis.prVersion != null && (
                    <div className="px-4 pb-3">
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`${DASHBOARD_ROUTES.PROJECT_DETAIL(workspaceSlug, projectNamespace)}?${new URLSearchParams({ prNumber: String(analysis.pullRequestId), version: String(analysis.prVersion) })}`}>
                          Open PR #{analysis.pullRequestId} · Version {analysis.prVersion}
                        </Link>
                      </Button>
                    </div>
                  )}
                  {expanded && (
                    <div id={`partial-analysis-${analysis.id}`} className="border-t bg-muted/10 p-4 space-y-4">
                      {reportLoading ? <p className="text-sm text-muted-foreground" role="status">Loading saved report...</p> : reportError ? (
                        <Alert variant="destructive"><AlertDescription className="flex items-center justify-between gap-3">
                          {reportError}<Button size="sm" variant="outline" onClick={() => setReportRetry((value) => value + 1)}>Retry</Button>
                        </AlertDescription></Alert>
                      ) : report?.analysis.id === analysis.id && (
                        <>
                          <div>
                            <h4 className="text-sm font-medium mb-2">Saved summary</h4>
                            {report.summary ? <MarkdownRenderer content={report.summary} /> : <p className="text-sm text-muted-foreground">No summary was saved for this run.</p>}
                          </div>
                          <div className="space-y-3">
                            <h4 className="text-sm font-medium">Saved findings ({report.issues.length})</h4>
                            {report.issues.length === 0 && <p className="text-sm text-muted-foreground">No findings were saved. This incomplete run does not establish a clean result.</p>}
                            {report.issues.map((issue) => (
                              <div key={issue.id} className="rounded-md border p-3 space-y-2">
                                <div className="flex flex-wrap items-center gap-2">
                                  <Badge variant="outline">{issue.severity}</Badge>
                                  {issue.status === "resolved" && <Badge variant="secondary">Resolved</Badge>}
                                  <span className="text-sm font-medium">{issue.title}</span>
                                </div>
                                <p className="text-xs font-mono text-muted-foreground break-all">{issue.file}{issue.line != null && `:${issue.line}`}</p>
                                <MarkdownRenderer content={issue.description || ""} />
                                {issue.suggestedFixDescription && <MarkdownRenderer content={issue.suggestedFixDescription} />}
                                {issue.suggestedFixDiff && <pre className="overflow-x-auto rounded bg-muted p-3 text-xs">{issue.suggestedFixDiff}</pre>}
                              </div>
                            ))}
                          </div>
                          <Button variant="outline" size="sm" asChild>
                            <Link to={DASHBOARD_ROUTES.ANALYSIS_SOURCE_VIEW(workspaceSlug, projectNamespace, analysis.id)}>View saved source</Link>
                          </Button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">Page {history.currentPage} of {history.totalPages}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Previous</Button>
                <Button variant="outline" size="sm" disabled={page >= history.totalPages} onClick={() => setPage((value) => value + 1)}>Next</Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
