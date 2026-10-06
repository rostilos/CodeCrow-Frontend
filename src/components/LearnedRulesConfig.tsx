import { useCallback, useEffect, useRef, useState } from "react";
import { reviewFeedbackService, type LearnedReviewRule } from "@/api_service/analysis/reviewFeedbackService";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { usePermissions } from "@/hooks/usePermissions";
import { Link } from "react-router-dom";
import { ROUTES } from "@/lib/routes";

export default function LearnedRulesConfig({ workspace, project, disabled, onRulesChanged }: {
  workspace: string; project: string; disabled: boolean; onRulesChanged: () => Promise<void>;
}) {
  const [rules, setRules] = useState<LearnedReviewRule[]>([]);
  const [descriptions, setDescriptions] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const scopeGeneration = useRef(0);
  const loadGeneration = useRef(0);
  const latestParent = useRef({ disabled, onRulesChanged });
  latestParent.current = { disabled, onRulesChanged };
  const { toast } = useToast();
  const { canManageWorkspace } = usePermissions();
  const owner = canManageWorkspace();
  const load = useCallback(async () => {
    if (!owner) return false;
    const generation = ++loadGeneration.current;
    const current = () => generation === loadGeneration.current;
    setLoading(true); setError(null);
    try {
      const result = await reviewFeedbackService.list(workspace, project);
      if (!current()) return false;
      setRules(result); setDescriptions(Object.fromEntries(result.map(rule => [rule.id, rule.description])));
      return true;
    } catch {
      if (current()) setError("Learned rules could not be loaded. Your existing review rules remain available.");
      return current();
    } finally { if (current()) setLoading(false); }
  }, [workspace, project, owner]);
  useEffect(() => {
    scopeGeneration.current += 1;
    setBusy(null);
    void load();
    return () => {
      scopeGeneration.current += 1;
      loadGeneration.current += 1;
    };
  }, [load]);

  const change = async (rule: LearnedReviewRule, promote: boolean) => {
    const generation = scopeGeneration.current;
    const current = () => generation === scopeGeneration.current;
    setBusy(rule.id);
    try {
      if (promote) await reviewFeedbackService.promote(workspace, project, rule.id, descriptions[rule.id]);
      else await reviewFeedbackService.disable(workspace, project, rule.id);
      if (!current()) return;
      toast({ title: promote ? "Rule activated" : "Rule disabled" });
      const currentLoad = await load();
      if (currentLoad && current() && !latestParent.current.disabled) {
        await latestParent.current.onRulesChanged();
      }
    } catch (error: unknown) {
      if (current()) toast({ title: "Rule could not be updated", description: (error as { message?: string })?.message || "Please try again.", variant: "destructive" });
    } finally { if (current()) setBusy(null); }
  };

  if (!owner) return null;
  return <Card>
    <CardHeader>
      <div className="flex items-center justify-between gap-3">
        <CardTitle>Learned Review Rules</CardTitle>
        <Button type="button" variant="outline" size="sm" disabled={loading || !!busy} onClick={load}>Refresh</Button>
      </div>
      <CardDescription>
        Candidates come from feedback on matching findings in this repository. Review their source feedback and wording before activating them.
        Contradictory judgments remove an active learned rule until you resolve the feedback and activate it again.
      </CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      {disabled && <p className="text-sm text-muted-foreground">Save your custom rule edits before changing learned rules.</p>}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {loading ? <p className="text-sm text-muted-foreground">Loading feedback…</p> : !error && rules.length === 0
        ? <p className="text-sm text-muted-foreground">No feedback yet. Open a finding and record whether it is correct.</p>
        : rules.map(rule => <details key={rule.id} className="rounded-md border p-4">
          <summary className="cursor-pointer space-x-2">
            <span className="font-medium">{rule.title}</span>
            <Badge variant={rule.effective ? "default" : "outline"}>{rule.effective ? "Active" : rule.state === "ACTIVE" ? "Disabled in custom rules" : rule.state.toLowerCase()}</Badge>
            <Badge variant="outline">{rule.ruleType}</Badge>
          </summary>
          <div className="mt-4 space-y-3">
            <p className="break-all font-mono text-xs">{rule.filePath}</p>
            <p className="text-sm text-muted-foreground">{rule.validVotes} correct · {rule.falsePositiveVotes} false positive · {rule.distinctIssues} distinct findings</p>
            <Label htmlFor={`learned-${rule.id}`}>Rule wording</Label>
            <Textarea id={`learned-${rule.id}`} value={descriptions[rule.id] || ""} maxLength={2000} disabled={!!busy || loading}
              onChange={event => setDescriptions(previous => ({ ...previous, [rule.id]: event.target.value }))} />
            <div className="flex gap-2">
              <Button type="button" disabled={disabled || !!busy || rule.state === "CONTESTED" || !descriptions[rule.id]?.trim()}
                onClick={() => change(rule, true)}>{rule.effective ? "Update active rule" : "Activate rule"}</Button>
              <Button type="button" variant="outline" disabled={disabled || !!busy || rule.state === "DISABLED"}
                onClick={() => change(rule, false)}>Disable</Button>
            </div>
            {rule.state === "CONTESTED" && <p className="text-sm text-muted-foreground">Conflicting judgments must be corrected on the source findings before activation.</p>}
            <p className="text-sm font-medium">Feedback history</p>
            <ul className="space-y-2 text-sm">
              {rule.evidence.map(evidence => <li key={evidence.id} className="border-l-2 pl-3">
                <span className="text-muted-foreground">
                  <Link className="underline" to={ROUTES.ISSUE_DETAIL(workspace, project, String(evidence.issueId))}>Finding #{evidence.issueId}</Link>
                  {" · "}User #{evidence.userId} · {evidence.verdict === "VALID" ? "Correct" : "False positive"} · {new Date(evidence.createdAt).toLocaleString()}
                </span>
                <p className="whitespace-pre-wrap">{evidence.explanation}</p>
                {evidence.commitHash && <p className="font-mono text-xs text-muted-foreground">Commit {evidence.commitHash}</p>}
              </li>)}
            </ul>
          </div>
        </details>)}
    </CardContent>
  </Card>;
}
