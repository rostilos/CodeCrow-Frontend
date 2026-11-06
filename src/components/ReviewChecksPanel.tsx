import { useEffect, useState } from "react";
import { reviewCheckService, type ReviewCheckFinding, type ReviewChecksResponse } from "@/api_service/analysis/reviewCheckService";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";

interface Props {
  workspace: string;
  project: string;
  prNumber: number;
  version: number;
  checkId?: string | null;
  canReview: boolean;
}

export function ReviewChecksPanel({ workspace, project, prNumber, version, checkId, canReview }: Props) {
  const [data, setData] = useState<ReviewChecksResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState<number | null>(null);
  const [status, setStatus] = useState("open");

  useEffect(() => {
    let active = true;
    setLoading(true); setData(null); setError(null);
    reviewCheckService.list(workspace, project, prNumber, version)
      .then(result => { if (active) setData(result); })
      .catch(error => { if (active) setError(error.message || "Could not load dependency checks."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [workspace, project, prNumber, version]);

  async function updateStatus(finding: ReviewCheckFinding) {
    setPending(finding.id); setError(null);
    try {
      await reviewCheckService.updateStatus(workspace, project, finding);
      setData(current => current && ({ ...current, checks: current.checks.map(check => ({ ...check,
        findings: check.findings.map(item => item.id === finding.id ? { ...item, resolved: !item.resolved } : item),
      })) }));
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not update the advisory.");
    } finally { setPending(null); }
  }

  if (loading) return <p role="status" className="p-6 text-muted-foreground">Loading dependency checks…</p>;
  const checks = data?.checks.filter(check => !checkId || check.id === checkId) ?? [];
  return <div className="space-y-4">
    {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
    <div className="flex items-center gap-3">
      <Label htmlFor="check-status">Advisories</Label>
      <Select value={status} onValueChange={setStatus}>
        <SelectTrigger id="check-status" className="w-40"><SelectValue /></SelectTrigger>
        <SelectContent><SelectItem value="open">Open</SelectItem><SelectItem value="resolved">Resolved</SelectItem><SelectItem value="all">All</SelectItem></SelectContent>
      </Select>
    </div>
    {!error && checks.length === 0 && <p className="p-6 text-muted-foreground">No dependency checks were recorded for this review.</p>}
    {checks.map(check => {
      const open = check.findings.filter(finding => !finding.resolved);
      const visible = check.findings.filter(finding => status === "all" || finding.resolved === (status === "resolved"));
      return <Card key={check.id}>
        <CardHeader>
          <CardTitle className="capitalize">{check.id.replace(/-/g, " ")}</CardTitle>
          <CardDescription>{open.length} open advisories · Review {data?.version}</CardDescription>
          {!check.complete && <Alert><AlertDescription>Audit coverage is incomplete. Available and last-known findings are shown.</AlertDescription></Alert>}
          {check.diagnostics.length > 0 && <details className="text-sm text-muted-foreground"><summary className="cursor-pointer">Audit details</summary>
            <ul className="mt-2 list-disc space-y-1 pl-5">{check.diagnostics.map((message, index) => <li key={index}>{message}</li>)}</ul>
          </details>}
        </CardHeader>
        <CardContent className="space-y-4">
          {visible.length === 0 && <p className="text-sm text-muted-foreground">No advisories match this status.</p>}
          {visible.map(finding => <article key={finding.id} className="rounded-lg border p-4 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={finding.severity === "HIGH" ? "destructive" : "secondary"}>{finding.severity.toLowerCase()}</Badge>
              <h3 className="font-medium break-words">{finding.title}</h3>
              {finding.resolved && <Badge variant="outline">Resolved</Badge>}
            </div>
            <p className="text-sm text-muted-foreground break-all">{finding.file}{finding.line ? `:${finding.line}` : ""}</p>
            <MarkdownRenderer content={finding.description} />
            {finding.codeSnippet && <pre className="overflow-auto rounded-md bg-muted p-3 text-xs"><code>{finding.codeSnippet}</code></pre>}
            {finding.suggestedFix && <div className="text-sm"><strong>Suggested fix</strong><MarkdownRenderer content={finding.suggestedFix} /></div>}
            {canReview && <Button variant="outline" size="sm" disabled={pending !== null} onClick={() => updateStatus(finding)}>
              {pending === finding.id ? "Saving…" : finding.resolved ? "Reopen" : "Mark resolved"}
            </Button>}
          </article>)}
        </CardContent>
      </Card>;
    })}
  </div>;
}
